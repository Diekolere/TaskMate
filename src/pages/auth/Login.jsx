import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const Login = () => {
  const [selectedRole, setSelectedRole] = useState('customer');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') navigate('/admin/dashboard', { replace: true });
      else if (currentUser.role === 'provider') navigate('/provider/dashboard', { replace: true });
      else if (currentUser.role === 'customer') navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(formData.email, formData.password);
      toast.success('Welcome back!');
      // Use backend role first, fall back to selected role
      const role = user?.role || selectedRole;
      if (role === 'admin') navigate('/admin/dashboard', { replace: true });
      else if (role === 'provider') navigate('/provider/dashboard', { replace: true });
      else navigate('/dashboard', { replace: true });
    } catch (err) {
      setError('Failed to sign in. Please check your credentials.');
      console.error(err);
      toast.error('Sign in failed');
      setLoading(false);
    }
  };

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

        {/* Role toggle */}
        <div className="mb-6 p-1 bg-gray-100 rounded-xl flex gap-1">
          <button
            type="button"
            onClick={() => setSelectedRole('customer')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              !isProvider
                ? 'bg-white text-[#1a2b3c] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className={`material-icons-outlined text-base ${!isProvider ? 'text-[#7AC142]' : 'text-gray-400'}`}>
              person
            </span>
            Regular User
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('provider')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              isProvider
                ? 'bg-[#0F172A] text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className={`material-icons-outlined text-base ${isProvider ? 'text-[#10B981]' : 'text-gray-400'}`}>
              handyman
            </span>
            Service Pro
          </button>
        </div>

        {/* Context hint */}
        <AnimatePresence mode="wait">
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
        </AnimatePresence>

        {/* Card */}
        <div className="bg-white py-8 px-8 shadow-[0_8px_30px_rgb(0,0,0,0.05)] rounded-2xl border border-gray-100">
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
              disabled={loading}
              className={`w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md ${
                isProvider
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
                `Sign in as ${isProvider ? 'Service Pro' : 'Customer'}`
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

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <img className="h-4 w-4" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" />
                Google
              </button>
              <button
                type="button"
                className="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <img className="h-4 w-4" src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="" />
                Facebook
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} TaskMate Inc. All rights reserved.
        </div>
      </div>
    </motion.div>
  );
};

export default Login;
