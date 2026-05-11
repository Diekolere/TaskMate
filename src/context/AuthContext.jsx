import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MOCK_USER_CUSTOMER, MOCK_USER_PROVIDER } from '../lib/mocks';

const AuthContext = createContext();

// SIMULATION FLAG - Set to true to bypass Supabase
const IS_SIMULATED = !import.meta.env.VITE_SUPABASE_URL || 
                     import.meta.env.VITE_SUPABASE_URL === 'https://your-project-id.supabase.co' ||
                     import.meta.env.VITE_SUPABASE_URL === '';

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (IS_SIMULATED || !supabase) {
      console.log('🚀 TaskMate running in Simulation Mode');
      // Retrieve from localStorage if available
      const savedUser = localStorage.getItem('taskmate_mock_user');
      const currentUserData = savedUser ? JSON.parse(savedUser) : null;
      
      // Route-aware auto-login/switch for development
      if (window.location.pathname.startsWith('/provider') && currentUserData?.role !== 'provider') {
        setCurrentUser(MOCK_USER_PROVIDER);
        localStorage.setItem('taskmate_mock_user', JSON.stringify(MOCK_USER_PROVIDER));
      } else if (window.location.pathname.startsWith('/admin') && currentUserData?.role !== 'admin') {
        const adminUser = { ...MOCK_USER_CUSTOMER, role: 'admin', email: 'admin@taskmate.com', full_name: 'Admin User' };
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

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        fetchProfile(session.user);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (user) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        // Shim for compatibility with existing UI
        const shimmedUser = {
          ...user,
          ...data,
          uid: user.id,
          displayName: data.full_name,
          photoURL: data.avatar_url
        };
        setCurrentUser(shimmedUser);
      } else {
        setCurrentUser(user);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, role) => {
    if (IS_SIMULATED) {
      const user = role === 'provider' ? MOCK_USER_PROVIDER : MOCK_USER_CUSTOMER;
      setCurrentUser(user);
      localStorage.setItem('taskmate_mock_user', JSON.stringify(user));
      return user;
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data.user;
  };

  const logout = async () => {
    if (IS_SIMULATED) {
      setCurrentUser(null);
      localStorage.removeItem('taskmate_mock_user');
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email) => {
    if (!email) throw new Error('Email is required');
    if (IS_SIMULATED || !supabase) {
      await new Promise(resolve => setTimeout(resolve, 400));
      return { simulated: true };
    }

    const redirectTo = `${window.location.origin}/login`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
    return { simulated: false };
  };

  const updateUserProfile = async (data) => {
    if (!currentUser) return;
    
    if (IS_SIMULATED) {
      const updatedUser = { ...currentUser, ...data };
      setCurrentUser(updatedUser);
      localStorage.setItem('taskmate_mock_user', JSON.stringify(updatedUser));
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', currentUser.id);

    if (error) throw error;
    
    // Update local state
    setCurrentUser(prev => ({ ...prev, ...data }));
  };

  const register = async (email, password, name, role) => {
    if (IS_SIMULATED) {
      const user = { ...MOCK_USER_CUSTOMER, email, full_name: name, role };
      setCurrentUser(user);
      localStorage.setItem('taskmate_mock_user', JSON.stringify(user));
      return user;
    }

    // 1. Sign up user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        }
      }
    });

    if (error) throw error;
    const user = data.user;

    // 2. Create profile entry
    const profileData = {
      id: user.id,
      email: email,
      full_name: name,
      role: role,
      created_at: new Date().toISOString(),
      trust_score: 50.0,
      is_active: true
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([profileData]);

    if (profileError) throw profileError;

    // 3. For providers, create empty provider profile
    if (role === 'provider') {
      const { error: providerError } = await supabase
        .from('provider_profiles')
        .insert([{ id: user.id, verification_status: 'unverified' }]);
      
      if (providerError) throw providerError;
    }

    // Update local state with shims
    const shimmedUser = {
      ...user,
      ...profileData,
      uid: user.id,
      displayName: name,
      photoURL: profileData.avatar_url
    };
    setCurrentUser(shimmedUser);

    return user;
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
    register,
    resetPassword,
    updateUserProfile,
    isSimulated: IS_SIMULATED
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
