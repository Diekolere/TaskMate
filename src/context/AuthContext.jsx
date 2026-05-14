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
            accountNumber: data.provider_profiles.account_number,
            accountName: data.provider_profiles.account_name,
            isVerified: data.provider_profiles.verification_status === 'verified',
          } : {}),
          // Flatten customer_profiles
          ...(data.customer_profiles ? {
            saved_workers: data.customer_profiles.saved_workers || [],
          } : {}),
        };
        setCurrentUser(shimmedUser);
      } else {
        // Profile doesn't exist yet (just created via OAuth)
        setCurrentUser({
          ...user,
          uid: user.id,
          displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          photoURL: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
          role: user.user_metadata?.role || 'customer',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Set basic user data even if profile fetch fails
      setCurrentUser({
        ...user,
        uid: user.id,
        displayName: user.user_metadata?.full_name || '',
        role: user.user_metadata?.role || 'customer',
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Email/Password Login ────────────────────────────────
  const login = async (email, password, role) => {

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    toast.success('Welcome back!');
    return data.user;
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

  // ── Update Profile ─────────────────────────────────────
  const updateUserProfile = async (data) => {
    if (!currentUser) return;

    try {
      const updateData = { ...data };
      
      // Map frontend camelCase to database snake_case
      if (updateData.photoURL) {
        updateData.avatar_url = updateData.photoURL;
        delete updateData.photoURL;
      }
      if (updateData.displayName) {
        updateData.full_name = updateData.displayName;
        delete updateData.displayName;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', currentUser.id);

      if (error) throw error;

      setCurrentUser(prev => {
        const next = { ...prev, ...updateData };
        // Keep camelCase versions in state for UI consistency
        if (updateData.full_name) next.displayName = updateData.full_name;
        if (updateData.avatar_url) next.photoURL = updateData.avatar_url;
        return next;
      });
      toast.success('Profile updated');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
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
          accountNumber: updatedProviderProfiles.account_number,
          accountName: updatedProviderProfiles.account_name,
          isVerified: updatedProviderProfiles.verification_status === 'verified',
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
