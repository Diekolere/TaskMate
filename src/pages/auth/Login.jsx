import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import EmailVerificationModal from '../../components/auth/EmailVerificationModal';

const Login = () => {
  const [selectedRole, setSelectedRole] = useState(null); // No default, user MUST choose
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const { login, loginWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRole) {
      setError('Please select whether you are signing in as a Regular User or Service Pro.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // login() awaits fetchProfile internally. fullUser.role is the
      // real DB value.
      const fullUser = await login(formData.email, formData.password, selectedRole);
      
      // Mismatched Role Prevention:
      // If the account's real role doesn't match what the user selected on the radio buttons,
      // block the login and show an error.
      if (fullUser?.role && fullUser.role !== selectedRole) {
        setError(`This account is registered as a ${fullUser.role}. Please switch the toggle above to sign in.`);
        return;
      }

      const role = fullUser?.role || selectedRole;
      if (role === 'provider') navigate('/provider/dashboard', { replace: true });
      else if (role === 'admin') navigate('/admin/dashboard', { replace: true });
      else navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.message === 'Email not confirmed') {
        setShowVerificationModal(true);
      } else {
        setError('Failed to sign in. Please check your credentials.');
        toast.error('Sign in failed');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle(selectedRole);
      // OAuth redirect handles navigation
    } catch (err) {
      toast.error('Google sign in failed');
      console.error(err);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Redirect already-authenticated users away from the login page
  if (currentUser) {
    if (currentUser.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (currentUser.role === 'provider') return <Navigate to="/provider/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  const isProvider = selectedRole === 'provider';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8 font-sans"
    >
      <div className="max-w-md w-full">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/icon.png" alt="TaskMate" className="h-10 w-10" />
            <span className="font-bold text-3xl tracking-tight text-[#1a2b3c] font-serif">TaskMate</span>
          </Link>
          <h2 className="text-2xl font-bold text-[#1a2b3c] font-serif">Sign in to your account</h2>
          <p className="mt-2 text-[#1a2b3c]/60 text-sm">
            New to TaskMate?{' '}
            <Link to="/register" className="font-semibold text-[#7AC142] hover:text-[#1a2b3c] transition-colors">
              Create an account
            </Link>
          </p>
        </div>

        {/* Role toggle (Compact Horizontal Cards) */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSelectedRole('customer')}
            className={`relative flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all overflow-hidden ${
              selectedRole === 'customer'
                ? 'border-[#7AC142] bg-[#7AC142]/[0.03] shadow-sm'
                : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
              selectedRole === 'customer' ? 'bg-[#7AC142]/10 text-[#7AC142]' : 'bg-gray-100 text-gray-400'
            }`}>
              <span className="material-icons-outlined text-lg">person</span>
            </div>
            <div className="flex-1 min-w-0 pr-4">
              <h3 className={`font-bold text-xs leading-tight mb-0.5 truncate ${selectedRole === 'customer' ? 'text-[#1a2b3c]' : 'text-gray-600'}`}>Regular User</h3>
              <p className="text-[10px] text-gray-500 font-medium truncate">I want to hire pros</p>
            </div>
            {selectedRole === 'customer' && (
              <div className="absolute right-2 text-[#7AC142] flex items-center">
                <span className="material-icons-outlined text-base">check_circle</span>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('provider')}
            className={`relative flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all overflow-hidden ${
              selectedRole === 'provider'
                ? 'border-[#0F172A] bg-[#0F172A]/[0.02] shadow-sm'
                : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
              selectedRole === 'provider' ? 'bg-[#0F172A]/10 text-[#0F172A]' : 'bg-gray-100 text-gray-400'
            }`}>
              <span className="material-icons-outlined text-lg">handyman</span>
            </div>
            <div className="flex-1 min-w-0 pr-4">
              <h3 className={`font-bold text-xs leading-tight mb-0.5 truncate ${selectedRole === 'provider' ? 'text-[#1a2b3c]' : 'text-gray-600'}`}>Service Pro</h3>
              <p className="text-[10px] text-gray-500 font-medium truncate">I want to find jobs</p>
            </div>
            {selectedRole === 'provider' && (
              <div className="absolute right-2 text-[#0F172A] flex items-center">
                <span className="material-icons-outlined text-base">check_circle</span>
              </div>
            )}
          </button>
        </div>

        {/* Context hint */}
        <AnimatePresence mode="wait">
          {selectedRole ? (
            <motion.div
              key={selectedRole}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
              className={`mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
                isProvider
                  ? 'bg-[#0F172A]/[0.03] border-[#0F172A]/10 text-[#0F172A]/70'
                  : 'bg-[#7AC142]/[0.06] border-[#7AC142]/20 text-[#1a2b3c]/70'
              }`}
            >
              <span className={`material-icons-outlined text-base shrink-0 ${isProvider ? 'text-[#10B981]' : 'text-[#7AC142]'}`}>
                {isProvider ? 'verified' : 'check_circle'}
              </span>
              {isProvider
                ? "You'll be signed into your provider dashboard to manage jobs and earnings."
                : "You'll be signed into your customer dashboard to book and track services."}
            </motion.div>
          ) : (
             <motion.div
              key="unselected"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
              className="mb-6 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-orange-200 bg-orange-50 text-sm text-orange-700"
            >
              <span className="material-icons-outlined text-base">info</span>
              Please select an account type above to continue.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form shell */}
        <div className="bg-white py-2 px-0 sm:py-8 sm:px-8 sm:shadow-[0_8px_30px_rgb(0,0,0,0.05)] sm:rounded-2xl sm:border sm:border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#1a2b3c] mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7AC142]/40 focus:border-[#7AC142] transition-colors text-[#1a2b3c]"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[#1a2b3c] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7AC142]/40 focus:border-[#7AC142] transition-colors text-[#1a2b3c] pr-11"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 font-medium flex items-center gap-1.5">
                <span className="material-icons-outlined text-base">error_outline</span>
                {error}
              </p>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 accent-[#7AC142] border-gray-200 rounded"
                />
                <span className="text-sm text-gray-500">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm font-semibold text-[#7AC142] hover:text-[#1a2b3c] transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedRole}
              className={`w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md ${
                !selectedRole 
                  ? 'bg-gray-400'
                  : isProvider
                    ? 'bg-[#0F172A] hover:bg-slate-700'
                    : 'bg-[#1a2b3c] hover:bg-[#7AC142]'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  Signing in…
                </>
              ) : (
                `Sign in ${selectedRole ? `as ${isProvider ? 'Service Pro' : 'Customer'}` : ''}`
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-4 bg-white text-gray-400 font-medium">Or continue with</span>
              </div>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading || !selectedRole}
                className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                <img className="h-5 w-5" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" />
                {googleLoading ? 'Connecting...' : 'Continue with Google'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} TaskMate Inc. All rights reserved.
        </div>
      </div>

      <EmailVerificationModal 
        isOpen={showVerificationModal} 
        onClose={() => setShowVerificationModal(false)} 
        email={formData.email} 
      />
    </motion.div>
  );
};

export default Login;
