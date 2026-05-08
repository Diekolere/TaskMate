import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      toast.success("Welcome back!");
    } catch(err) {
      setError('Failed to login. Please check your credentials.');
      console.error(err);
      toast.error('Login failed');
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8 font-sans"
    >
      <div className="max-w-md w-full">
        {/* Logo & Header */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/icon.png" alt="TaskMate" className="h-10 w-10" />
            <span className="font-bold text-3xl tracking-tight text-[#1a2b3c] font-serif">TaskMate</span>
          </Link>
          <h2 className="text-3xl font-bold text-[#1a2b3c] font-serif">Sign in</h2>
          <p className="mt-3 text-[#1a2b3c]/70 text-base">
            New to TaskMate?{' '}
            <Link to="/register" className="font-semibold text-[#7AC142] hover:text-[#1a2b3c] transition-colors">
              Create an account
            </Link>
          </p>
        </div>

        {/* Card */}
        <div className="bg-white py-10 px-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-2xl border border-[#1a2b3c]/5">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                className="appearance-none block w-full px-4 py-3 border border-[#1a2b3c]/20 rounded-lg placeholder-[#1a2b3c]/30 focus:outline-none focus:ring-2 focus:ring-[#7AC142]/50 focus:border-[#7AC142] transition-colors text-[#1a2b3c]"
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
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-4 py-3 border border-[#1a2b3c]/20 rounded-lg placeholder-[#1a2b3c]/30 focus:outline-none focus:ring-2 focus:ring-[#7AC142]/50 focus:border-[#7AC142] transition-colors text-[#1a2b3c] pr-10"
                  placeholder="••••••••"
                />
                <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#1a2b3c]/40 hover:text-[#1a2b3c]/70 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#7AC142] focus:ring-[#7AC142] border-[#1a2b3c]/20 rounded transition-colors"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-[#1a2b3c]/70">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-semibold text-[#7AC142] hover:text-[#1a2b3c] transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3.5 px-4 rounded-lg text-sm font-bold text-white bg-[#1a2b3c] hover:bg-[#7AC142] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a2b3c] transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin h-5 w-5 text-white" />
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
          
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#1a2b3c]/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-[#1a2b3c]/50 font-medium">Or continue with</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <button
                type="button"
                className="w-full inline-flex justify-center py-3 px-4 border border-[#1a2b3c]/20 rounded-lg shadow-sm bg-white text-sm font-medium hover:bg-[#f7f8f3] transition-colors"
              >
                 <img className="h-5 w-5" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" />
                 <span className="sr-only">Sign in with Google</span>
              </button>
               <button
                type="button"
                className="w-full inline-flex justify-center py-3 px-4 border border-[#1a2b3c]/20 rounded-lg shadow-sm bg-white text-sm font-medium hover:bg-[#f7f8f3] transition-colors"
              >
                 <img className="h-5 w-5" src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="" />
                 <span className="sr-only">Sign in with Facebook</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center text-sm text-[#1a2b3c]/50">
            &copy; {new Date().getFullYear()} TaskMate Inc. All rights reserved.
        </div>
      </div>
    </motion.div>
  );
};

export default Login;
