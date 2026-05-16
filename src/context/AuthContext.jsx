import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
        const shimmedUser = {
          ...user,
          ...data,
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
          } : {}),
          // Flatten customer_profiles
          ...(data.customer_profiles ? {
            saved_workers: data.customer_profiles.saved_workers || [],
          } : {}),
        };
        setCurrentUser(shimmedUser);
        return shimmedUser; // ← return so login() can read the real role
      } else {
        // Profile row doesn't exist yet (brand-new account, OAuth, etc.)
        // Trust user_metadata.role which was set during register()
        const fallbackUser = {
          ...user,
          uid: user.id,
          displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          photoURL: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
          role: user.user_metadata?.role || 'customer',
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
    }
  };

  // ── Email/Password Login ────────────────────────────────
  // Awaits fetchProfile so the returned user always has the real DB role.
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // fetchProfile sets state AND returns the full user — callers use this
    // to navigate to the correct dashboard without a race condition.
    const fullUser = await fetchProfile(data.user);
    toast.success('Welcome back!');
    return fullUser;
  };

  // ── Google OAuth ────────────────────────────────────────
  const loginWithGoogle = async (role = 'customer') => {
    const redirectTo = `${window.location.origin}/customer/dashboard`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        data: {
          role: role,
        }
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
        data: {
          full_name: name,
          role: role,
        }
      }
    });

    if (error) throw error;
    
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
      {!loading && children}
    </AuthContext.Provider>
  );
}
