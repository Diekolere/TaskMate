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
  const [deletedAccount, setDeletedAccount] = useState(false);
  // Guard against concurrent fetchProfile calls (e.g. login() + onAuthStateChange both fire at once)
  const fetchingRef = useRef(false);
  const isLoggingInRef = useRef(false);

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
        if (isLoggingInRef.current) return;
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
  const fetchProfile = async (user, skipSetUser = false) => {
    // Prevent duplicate concurrent calls (e.g. login() + onAuthStateChange)
    if (fetchingRef.current) {
      // Wait a bit and return the already-in-progress result via currentUser
      await new Promise(r => setTimeout(r, 800));
      return null; // caller should use currentUser state
    }
    fetchingRef.current = true;
    try {
      let { data, error } = await supabase
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

      if (!data) {
        const pendingRole = sessionStorage.getItem('pending_oauth_role');
        const effectiveRole = pendingRole || user.user_metadata?.role || 'customer';
        console.warn(`[Auth] No profile row found for user ${user.id}. Self-healing for role: ${effectiveRole}`);
        try {
          // Use upsert to avoid unique-constraint violations if the trigger partially ran
          const { error: profileUpsertErr } = await supabase.from('profiles').upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
            role: effectiveRole,
          }, { onConflict: 'id' });

          // A 23503 FK violation means the user was deleted from auth.users
          // but their Supabase session is still cached locally.
          // Sign them out and show the deleted-account modal.
          if (profileUpsertErr?.code === '23503') {
            console.warn('[Auth] User deleted from auth.users — signing out stale session.');
            await supabase.auth.signOut();
            if (!skipSetUser) setCurrentUser(null);
            setDeletedAccount(true);
            setLoading(false);
            fetchingRef.current = false;
            return null;
          }
          if (profileUpsertErr) console.error('[Auth] Profile upsert failed:', profileUpsertErr);

          if (effectiveRole === 'provider') {
            const { error: ppErr } = await supabase.from('provider_profiles').upsert({ id: user.id }, { onConflict: 'id' });
            if (ppErr) console.error('[Auth] provider_profiles upsert failed:', ppErr);
          } else {
            const { error: cpErr } = await supabase.from('customer_profiles').upsert({ id: user.id }, { onConflict: 'id' });
            if (cpErr) console.error('[Auth] customer_profiles upsert failed:', cpErr);
          }

          // Re-fetch the now-created profile
          const { data: refetchedData } = await supabase
            .from('profiles')
            .select(`
              *,
              provider_profiles (*),
              customer_profiles (*)
            `)
            .eq('id', user.id)
            .maybeSingle();

          if (refetchedData) {
            data = refetchedData;
          }
        } catch (healErr) {
          console.error('[Auth] Self-healing profile creation failed:', healErr);
        }
      }

      if (data) {
        // Use sub-profile EXISTENCE as the authoritative role source.
        // This is a safety net for accounts where profiles.role column may be
        // stale, incorrectly set, or the trigger wasn't deployed to production.
        const hasProviderProfile = data.provider_profiles && (Array.isArray(data.provider_profiles) ? data.provider_profiles.length > 0 : true);
        const hasCustomerProfile = data.customer_profiles && (Array.isArray(data.customer_profiles) ? data.customer_profiles.length > 0 : true);

        let effectiveRole = data.role;
        if (hasProviderProfile) effectiveRole = 'provider';
        else if (hasCustomerProfile) effectiveRole = 'customer';

        // SELF-HEALING: Fix database if trigger defaulted to customer but user intended provider
        const intendedRole = user.user_metadata?.role;
        const isNewUser = user.created_at ? (new Date() - new Date(user.created_at)) < 300000 : false;

        if (intendedRole && intendedRole !== effectiveRole && isNewUser) {
          console.warn(`[Auth] Role mismatch detected. DB: ${effectiveRole}, Metadata: ${intendedRole}. Self-healing...`);
          try {
            await supabase.from('profiles').update({ role: intendedRole }).eq('id', user.id);
            if (intendedRole === 'provider') {
              await supabase.from('provider_profiles').upsert({ id: user.id }, { onConflict: 'id' });
            } else {
              await supabase.from('provider_profiles').delete().eq('id', user.id);
            }
          } catch (e) {
            console.error('[Auth] Self-healing failed:', e);
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
          ...(hasProviderProfile ? (() => {
            const pProfile = Array.isArray(data.provider_profiles) ? (data.provider_profiles[0] || {}) : data.provider_profiles;
            return {
              kycCompleted: pProfile.kyc_completed,
              bvnVerified: pProfile.bvn_verified,
              bankName: pProfile.bank_name,
              bankCode: pProfile.bank_code,
              accountNumber: pProfile.account_number,
              accountName: pProfile.account_name,
              isVerified: pProfile.verification_status === 'verified',
              transactionPin: pProfile.transaction_pin,
              tradeCategory: pProfile.trade_category || [],
              rating: pProfile.average_rating ?? null,
            };
          })() : {}),
          // Flatten customer_profiles
          ...(hasCustomerProfile ? (() => {
            const cProfile = Array.isArray(data.customer_profiles) ? (data.customer_profiles[0] || {}) : data.customer_profiles;
            return {
              saved_workers: cProfile.saved_workers || [],
            };
          })() : {}),
        };
        if (!skipSetUser) setCurrentUser(shimmedUser);
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
        if (!skipSetUser) setCurrentUser(fallbackUser);
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
      if (!skipSetUser) setCurrentUser(fallbackUser);
      return fallbackUser;
    } finally {
      if (!skipSetUser) setLoading(false);
      fetchingRef.current = false;
    }
  };

  // ── Email/Password Login ────────────────────────────────
  // Awaits fetchProfile so the returned user always has the real DB role.
  // intentRole: the role the user SELECTED on the login page, used as
  // a last-resort fallback if the DB and user_metadata are both unreliable.
  const login = async (email, password, intentRole) => {
    isLoggingInRef.current = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      const fullUser = await fetchProfile(data.user, true); // true = skipSetUser
      const resolvedUser = fullUser || { role: intentRole || 'customer' };
      
      // Prevent mismatched role sign in
      if (intentRole && resolvedUser.role && resolvedUser.role !== intentRole) {
        await supabase.auth.signOut();
        throw new Error(`This account is registered as a ${resolvedUser.role === 'provider' ? 'Service Pro' : 'Regular User'}. Please select the correct account type to sign in.`);
      }

      toast.success('Welcome back!');
      setCurrentUser(resolvedUser);
      return resolvedUser;
    } finally {
      isLoggingInRef.current = false;
    }
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
  const register = async (email, password, name, role) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: name,
          role: role,
        }
      }
    });
    
    if (error) {
      if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already exists') || error.message.toLowerCase().includes('already in use')) {
        throw new Error('This account already exists. Please sign in instead.');
      }
      throw error;
    }
    
    // Sometimes Supabase returns a fake user on sign up if the email is already in use
    if (data?.user?.identities?.length === 0) {
      throw new Error('This account already exists. Please sign in instead.');
    }

    // Safety net: manually upsert profile rows immediately.
    // The DB trigger (handle_new_user) should handle this via SECURITY DEFINER,
    // but if it isn't deployed, the user's first login would find no profile row.
    // RLS may block these calls if email isn't confirmed yet — that's fine,
    // the self-healing in fetchProfile() will catch it on first login.
    if (data.user) {
      try {
        const { error: profErr } = await supabase.from('profiles').upsert({
          id: data.user.id,
          email: email,
          full_name: name,
          role: role,
        }, { onConflict: 'id' });
        if (profErr) console.warn('[Auth] Profile upsert after register:', profErr.message);

        if (role === 'provider') {
          const { error: ppErr } = await supabase.from('provider_profiles').upsert({ id: data.user.id }, { onConflict: 'id' });
          if (ppErr) console.warn('[Auth] provider_profiles upsert after register:', ppErr.message);
        } else {
          const { error: cpErr } = await supabase.from('customer_profiles').upsert({ id: data.user.id }, { onConflict: 'id' });
          if (cpErr) console.warn('[Auth] customer_profiles upsert after register:', cpErr.message);
        }
      } catch (profileErr) {
        // Non-fatal: RLS may block this until email is confirmed.
        // user_metadata.role is the reliable fallback for the login step.
        console.warn('[Auth] Profile upsert after register (non-fatal):', profileErr.message);
      }
    }

    toast.success('Account created! Check your email to verify.');
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
      // Use upsert instead of update: if the provider_profiles row was never
      // created (e.g. RLS blocked it during registration), a plain .update()
      // would succeed with 0 rows affected, silently losing the user's data.
      const { error } = await supabase
        .from('provider_profiles')
        .upsert({ id: currentUser.id, ...data }, { onConflict: 'id' });

      if (error) throw error;

      setCurrentUser(prev => {
        const rawPProfile = Array.isArray(prev.provider_profiles) 
          ? (prev.provider_profiles[0] || {}) 
          : (prev.provider_profiles || {});
        const updatedProviderProfiles = { ...rawPProfile, ...data };
        return {
          ...prev,
          provider_profiles: Array.isArray(prev.provider_profiles) 
            ? [updatedProviderProfiles] 
            : updatedProviderProfiles,
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
          rating: updatedProviderProfiles.average_rating ?? null,
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

  const clearDeletedAccount = () => setDeletedAccount(false);

  const value = {
    currentUser,
    loading,
    deletedAccount,
    clearDeletedAccount,
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
