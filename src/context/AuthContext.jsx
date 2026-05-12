import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, IS_SIMULATED } from '../lib/supabase';
import { MOCK_USER_CUSTOMER, MOCK_USER_PROVIDER } from '../lib/mocks';
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
    if (IS_SIMULATED || !supabase) {
      console.log('🚀 TaskMate running in Simulation Mode');
      const savedUser = localStorage.getItem('taskmate_mock_user');
      const currentUserData = savedUser ? JSON.parse(savedUser) : null;

      if (window.location.pathname.startsWith('/provider') && currentUserData?.role !== 'provider') {
        setCurrentUser(MOCK_USER_PROVIDER);
        localStorage.setItem('taskmate_mock_user', JSON.stringify(MOCK_USER_PROVIDER));
      } else if (window.location.pathname.startsWith('/admin') && currentUserData?.role !== 'admin') {
        const adminUser = { ...MOCK_USER_CUSTOMER, role: 'admin', email: 'admin@taskmate.com', full_name: 'Admin User', displayName: 'Admin User' };
        setCurrentUser(adminUser);
        localStorage.setItem('taskmate_mock_user', JSON.stringify(adminUser));
      } else if (savedUser) {
        setCurrentUser(currentUserData);
      } else {
        setCurrentUser(MOCK_USER_CUSTOMER);
        localStorage.setItem('taskmate_mock_user', JSON.stringify(MOCK_USER_CUSTOMER));
      }

      setLoading(false);
      return;
    }

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
        .single();

      if (error && error.code !== 'PGRST116') {
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
    if (IS_SIMULATED) {
      const user = role === 'provider' ? MOCK_USER_PROVIDER : MOCK_USER_CUSTOMER;
      setCurrentUser(user);
      localStorage.setItem('taskmate_mock_user', JSON.stringify(user));
      return user;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    toast.success('Welcome back!');
    return data.user;
  };

  // ── Google OAuth ────────────────────────────────────────
  const loginWithGoogle = async (role = 'customer') => {
    if (IS_SIMULATED) {
      const user = role === 'provider' ? MOCK_USER_PROVIDER : MOCK_USER_CUSTOMER;
      setCurrentUser(user);
      localStorage.setItem('taskmate_mock_user', JSON.stringify(user));
      toast.success('Signed in with Google (simulated)');
      return user;
    }

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
    if (IS_SIMULATED) {
      setCurrentUser(null);
      localStorage.removeItem('taskmate_mock_user');
      toast.success('Signed out');
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    toast.success('Signed out');
  };

  // ── Register ────────────────────────────────────────────
  const register = async (email, password, name, role) => {
    if (IS_SIMULATED) {
      const user = { ...MOCK_USER_CUSTOMER, email, full_name: name, displayName: name, role };
      setCurrentUser(user);
      localStorage.setItem('taskmate_mock_user', JSON.stringify(user));
      return user;
    }

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
    if (IS_SIMULATED || !supabase) {
      await new Promise(resolve => setTimeout(resolve, 400));
      toast.success('Password reset email sent (simulated)');
      return { simulated: true };
    }

    const redirectTo = `${window.location.origin}/login`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
    toast.success('Password reset email sent!');
    return { simulated: false };
  };

  // ── Update Profile ─────────────────────────────────────
  const updateUserProfile = async (data) => {
    if (!currentUser) return;

    if (IS_SIMULATED) {
      const updatedUser = { ...currentUser, ...data };
      setCurrentUser(updatedUser);
      localStorage.setItem('taskmate_mock_user', JSON.stringify(updatedUser));
      toast.success('Profile updated');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', currentUser.id);

      if (error) throw error;

      setCurrentUser(prev => ({ ...prev, ...data }));
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

    if (IS_SIMULATED) {
      const updatedUser = { ...currentUser, provider_profiles: { ...currentUser.provider_profiles, ...data } };
      setCurrentUser(updatedUser);
      localStorage.setItem('taskmate_mock_user', JSON.stringify(updatedUser));
      toast.success('Provider profile updated');
      return;
    }

    try {
      const { error } = await supabase
        .from('provider_profiles')
        .update(data)
        .eq('id', currentUser.id);

      if (error) throw error;

      setCurrentUser(prev => ({
        ...prev,
        provider_profiles: { ...prev.provider_profiles, ...data }
      }));
      toast.success('Provider profile updated');
    } catch (error) {
      console.error('Provider profile update error:', error);
      toast.error('Failed to update provider profile');
      throw error;
    }
  };

  // ── Update Password ─────────────────────────────────────
  const updatePassword = async (newPassword) => {
    if (IS_SIMULATED) {
      await new Promise(resolve => setTimeout(resolve, 400));
      toast.success('Password updated (simulated)');
      return;
    }

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
    resetPassword,
    updateUserProfile,
    updateProviderProfile,
    updatePassword,
    isSimulated: IS_SIMULATED
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
