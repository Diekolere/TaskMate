import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import FullPageLoader from '../components/FullPageLoader';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Guard against concurrent fetchProfile calls (e.g. login() + onAuthStateChange both fire at once)
  const fetchingRef = useRef(false);

  // ── Session bootstrap ───────────────────────────────────
  useEffect(() => {
    // Real Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) fetchProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ── Fetch profile from DB ───────────────────────────────
  // Returns the fully-shimmed user object so callers can read .role immediately.
  const fetchProfile = async (user) => {
    // Prevent duplicate concurrent calls (e.g. login() + onAuthStateChange)
    if (fetchingRef.current) {
      // Wait a bit and return the already-in-progress result via currentUser
      await new Promise(r => setTimeout(r, 800));
      return null; // caller should use currentUser state
    }
    fetchingRef.current = true;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          provider_profiles (*),
          customer_profiles (*)
        `)
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Profile fetch error:', error);
        throw error;
      }

      if (data) {
        // Use sub-profile EXISTENCE as the authoritative role source.
        // This is a safety net for accounts where profiles.role column may be
        // stale, incorrectly set, or the trigger wasn't deployed to production.
        let effectiveRole = data.role;
        if (data.provider_profiles) effectiveRole = 'provider';
        else if (data.customer_profiles) effectiveRole = 'customer';

        // SELF-HEALING: Fix database if trigger defaulted to customer but user intended provider
        const intendedRole = user.user_metadata?.role;
        const isNewUser = user.created_at ? (new Date() - new Date(user.created_at)) < 300000 : false;

        if (intendedRole && intendedRole !== effectiveRole && isNewUser) {
          console.warn(`[Auth] Role mismatch detected. DB: ${effectiveRole}, Metadata: ${intendedRole}. Self-healing...`);
          try {
            await supabase.from('profiles').update({ role: intendedRole }).eq('id', user.id);
            if (intendedRole === 'provider') {
              await supabase.from('provider_profiles').upsert({ id: user.id }, { onConflict: 'id' });
              await supabase.from('customer_profiles').delete().eq('id', user.id);
            } else {
              await supabase.from('customer_profiles').upsert({ id: user.id }, { onConflict: 'id' });
              await supabase.from('provider_profiles').delete().eq('id', user.id);
            }
            effectiveRole = intendedRole;
          } catch (healErr) {
            console.error('[Auth] Self-healing failed:', healErr);
          }
        }

        console.log('[Auth] fetchProfile resolved role:', effectiveRole, '(DB role was:', data.role, ')');

        const shimmedUser = {
          ...user,
          ...data,
          role: effectiveRole,          // ← always use the derived role
          uid: user.id,
          displayName: data.full_name,
          photoURL: data.avatar_url,
          // Flatten provider_profiles for easy access
          ...(data.provider_profiles ? {
            kycCompleted: data.provider_profiles.kyc_completed,
            bvnVerified: data.provider_profiles.bvn_verified,
            bankName: data.provider_profiles.bank_name,
            bankCode: data.provider_profiles.bank_code,
            accountNumber: data.provider_profiles.account_number,
            accountName: data.provider_profiles.account_name,
            isVerified: data.provider_profiles.verification_status === 'verified',
            transactionPin: data.provider_profiles.transaction_pin,
            tradeCategory: data.provider_profiles.trade_category || [],
          } : {}),
          // Flatten customer_profiles
          ...(data.customer_profiles ? {
            saved_workers: data.customer_profiles.saved_workers || [],
          } : {}),
        };
        setCurrentUser(shimmedUser);
        return shimmedUser;
      } else {
        // Profile row doesn't exist yet (brand-new account, etc.)
        // Trust user_metadata.role which was set during register()
        const pendingRole = sessionStorage.getItem('pending_oauth_role');
        const effectiveRole = pendingRole || user.user_metadata?.role || 'customer';
        console.log('[Auth] fetchProfile: no profile row, using role:', effectiveRole);
        const fallbackUser = {
          ...user,
          uid: user.id,
          displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          photoURL: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
          role: effectiveRole,
        };
        setCurrentUser(fallbackUser);
        return fallbackUser;
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      const fallbackUser = {
        ...user,
        uid: user.id,
        displayName: user.user_metadata?.full_name || '',
        role: user.user_metadata?.role || 'customer',
      };
      setCurrentUser(fallbackUser);
      return fallbackUser;
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  // ── Email/Password Login ────────────────────────────────
  // Awaits fetchProfile so the returned user always has the real DB role.
  // intentRole: the role the user SELECTED on the login page, used as
  // a last-resort fallback if the DB and user_metadata are both unreliable.
  const login = async (emailOrPhone, password, intentRole) => {
    let credentials = {};
    const input = emailOrPhone.trim();

    // Check if it's an email (contains '@') or a phone number
    if (input.includes('@')) {
      // It's an email. But what if this email belongs to a provider whose primary auth is phone?
      // Let's query profiles to check if this user has a phone_number and their role is 'provider'.
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone_number, role')
        .eq('email', input)
        .maybeSingle();

      if (profile && profile.role === 'provider' && profile.phone_number) {
        // Log in using phone since that's their primary Auth credential
        credentials = { phone: profile.phone_number, password };
      } else {
        // Log in using email
        credentials = { email: input, password };
      }
    } else {
      // It's a phone number. Log in using phone.
      credentials = { phone: input, password };
    }

    const { data, error } = await supabase.auth.signInWithPassword(credentials);
    if (error) throw error;

    const fullUser = await fetchProfile(data.user);
    const resolvedUser = fullUser || { role: intentRole || 'customer' };
    toast.success('Welcome back!');
    return resolvedUser;
  };

  // ── Google OAuth ──────────────────────────────────
  const loginWithGoogle = async (role = 'customer') => {
    // Store the intended role in sessionStorage so the callback page can
    // use it for brand-new accounts where the DB profile doesn't exist yet.
    sessionStorage.setItem('pending_oauth_role', role);

    // Redirect to a neutral callback route, NOT a role-specific page.
    const redirectTo = `${window.location.origin}/auth/callback`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;
    // OAuth redirects — no return value
  };

  // ── Logout ──────────────────────────────────────────────
  const logout = async () => {

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    toast.success('Signed out');
  };

  const resendVerification = async (email) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) throw error;
    toast.success('Verification email resent!');
  };

  // ── Register ────────────────────────────────────────────
  const register = async (emailOrPhone, password, name, role, optionalEmail = null) => {
    let signUpParams = {};
    
    if (role === 'provider') {
      signUpParams = {
        phone: emailOrPhone,
        password,
        options: {
          data: {
            full_name: name,
            role: role,
            email: optionalEmail
          }
        }
      };
    } else {
      signUpParams = {
        email: emailOrPhone,
        password,
        options: {
          data: {
            full_name: name,
            role: role,
          }
        }
      };
    }

    const { data, error } = await supabase.auth.signUp(signUpParams);
    if (error) throw error;

    // Safety net: manually upsert profile rows immediately.
    // The DB trigger may not be deployed to production.
    // upsert is idempotent — safe even if the trigger DID run.
    if (data.user) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: role === 'provider' ? optionalEmail : emailOrPhone,
          phone_number: role === 'provider' ? emailOrPhone : null,
          full_name: name,
          role: role,
        }, { onConflict: 'id' });

        if (role === 'provider') {
          await supabase.from('provider_profiles').upsert({ id: data.user.id }, { onConflict: 'id' });
          await supabase.from('customer_profiles').delete().eq('id', data.user.id);
        } else {
          await supabase.from('customer_profiles').upsert({ id: data.user.id }, { onConflict: 'id' });
          await supabase.from('provider_profiles').delete().eq('id', data.user.id);
        }
      } catch (profileErr) {
        // Non-fatal: RLS may block this until email is confirmed.
        // user_metadata.role is the reliable fallback for the login step.
        console.warn('[Auth] Profile upsert after register (non-fatal):', profileErr.message);
      }
    }

    if (role === 'customer') {
      toast.success('Account created! Check your email to verify.');
    }
    return data.user;
  };

  // ── Reset Password ─────────────────────────────────────
  const resetPassword = async (email) => {
    if (!email) throw new Error('Email is required');

    const redirectTo = `${window.location.origin}/login`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
    toast.success('Password reset email sent!');
    return { simulated: false };
  };

  // ── Unified Profile Update ─────────────────────────────
  const updateUserProfile = async (data) => {
    if (!currentUser) return;

    try {
      // 1. Separate data for 'profiles' and 'provider_profiles'
      const profileData = {};
      const providerData = {};

      // Mapping for 'profiles' table
      if (data.displayName || data.full_name) profileData.full_name = data.displayName || data.full_name;
      if (data.photoURL || data.avatar_url) profileData.avatar_url = data.photoURL || data.avatar_url;
      if (data.phoneNumber || data.phone_number) profileData.phone_number = data.phoneNumber || data.phone_number;
      if (data.locationName || data.location_name) profileData.location_name = data.locationName || data.location_name;
      if (data.status) profileData.status = data.status;

      // Mapping for 'provider_profiles' table
      if (data.bio || data.description) providerData.bio = data.bio || data.description;
      if (data.address) providerData.address = data.address;
      if (data.businessName || data.business_name) providerData.business_name = data.businessName || data.business_name;
      if (data.yearsExperience || data.years_experience) providerData.years_experience = Number(data.yearsExperience || data.years_experience);
      if (data.skills || data.trade_category) providerData.trade_category = Array.isArray(data.skills || data.trade_category) ? (data.skills || data.trade_category) : [];
      if (data.website) providerData.website = data.website;

      // 2. Perform updates
      const updatePromises = [];

      if (Object.keys(profileData).length > 0) {
        updatePromises.push(
          supabase.from('profiles').update(profileData).eq('id', currentUser.id)
        );
      }

      if (Object.keys(providerData).length > 0 && currentUser.role === 'provider') {
        updatePromises.push(
          supabase.from('provider_profiles').update(providerData).eq('id', currentUser.id)
        );
      }

      const results = await Promise.all(updatePromises);
      const errors = results.filter(r => r.error).map(r => r.error);
      
      if (errors.length > 0) {
        console.error('Update errors:', errors);
        throw errors[0];
      }

      // 3. Update local state
      setCurrentUser(prev => {
        const next = { ...prev, ...data };
        // Sync shimmed fields
        if (profileData.full_name) next.displayName = profileData.full_name;
        if (profileData.avatar_url) next.photoURL = profileData.avatar_url;
        if (providerData.bio) next.bio = providerData.bio;
        return next;
      });

      toast.success('Profile updated');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile');
      throw error;
    }
  };

  // ── Update Provider Profile ─────────────────────────────
  const updateProviderProfile = async (data) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('provider_profiles')
        .update(data)
        .eq('id', currentUser.id);

      if (error) throw error;

      setCurrentUser(prev => {
        const updatedProviderProfiles = { ...prev.provider_profiles, ...data };
        return {
          ...prev,
          provider_profiles: updatedProviderProfiles,
          // Sync flattened fields for immediate UI updates
          kycCompleted: updatedProviderProfiles.kyc_completed,
          bvnVerified: updatedProviderProfiles.bvn_verified,
          bankName: updatedProviderProfiles.bank_name,
          bankCode: updatedProviderProfiles.bank_code,
          accountNumber: updatedProviderProfiles.account_number,
          accountName: updatedProviderProfiles.account_name,
          isVerified: updatedProviderProfiles.verification_status === 'verified',
          transactionPin: updatedProviderProfiles.transaction_pin,
          tradeCategory: updatedProviderProfiles.trade_category || [],
        };
      });
      toast.success('Provider profile updated');
    } catch (error) {
      console.error('Provider profile update error:', error);
      toast.error('Failed to update provider profile');
      throw error;
    }
  };

  // ── Update Password ─────────────────────────────────────
  const updatePassword = async (newPassword) => {

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    toast.success('Password updated!');
  };

  const value = {
    currentUser,
    loading,
    login,
    loginWithGoogle,
    logout,
    register,
    resendVerification,
    resetPassword,
    updateUserProfile,
    updateProviderProfile,
    updatePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
