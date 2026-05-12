import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'customer',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    let newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
    
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    
    if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleUserTypeChange = (type) => {
    setFormData(prev => ({ ...prev, userType: type }));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
        await register(formData.email, formData.password, formData.fullName, formData.userType);
        toast.success(`Welcome, ${formData.fullName}!`);
        
        if (formData.userType === 'customer') {
          navigate('/customer/onboarding', { replace: true });
        } else {
          navigate('/provider/onboarding/step-1', { replace: true });
        }
    } catch (error) {
        console.error("Registration failed", error);
        let msg = "Sign up failed: " + error.message;
        if (error.code === 'auth/email-already-in-use') msg = "Email is already registered.";
        toast.error(msg);
    } finally {
        setIsLoading(false);
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
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <img src="/icon.png" alt="TaskMate" className="h-10 w-10" />
            <span className="font-bold text-3xl tracking-tight text-[#1a2b3c] font-serif">TaskMate</span>
          </Link>
          <h2 className="text-3xl font-bold text-[#1a2b3c] font-serif">Create Account</h2>
          <p className="mt-2 text-[#1a2b3c]/70 text-base">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#7AC142] hover:text-[#1a2b3c] transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        {/* Form shell */}
        <div className="bg-white py-2 px-0 sm:py-8 sm:px-8 sm:shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-2xl sm:border sm:border-[#1a2b3c]/5">
          
          {/* User Type Toggle — matches login page */}
          <div className="mb-6 p-1 bg-gray-100 rounded-xl flex gap-1">
            <button
              type="button"
              onClick={() => handleUserTypeChange('customer')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                formData.userType === 'customer'
                  ? 'bg-white text-[#1a2b3c] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className={`material-icons-outlined text-base ${formData.userType === 'customer' ? 'text-[#7AC142]' : 'text-gray-400'}`}>
                person
              </span>
              Regular User
            </button>
            <button
              type="button"
              onClick={() => handleUserTypeChange('provider')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                formData.userType === 'provider'
                  ? 'bg-[#0F172A] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className={`material-icons-outlined text-base ${formData.userType === 'provider' ? 'text-[#10B981]' : 'text-gray-400'}`}>
                handyman
              </span>
              Service Pro
            </button>
          </div>

          {/* Context hint */}
          <AnimatePresence mode="wait">
            <motion.div
              key={formData.userType}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
              className={`mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
                formData.userType === 'provider'
                  ? 'bg-[#0F172A]/[0.03] border-[#0F172A]/10 text-[#0F172A]/70'
                  : 'bg-[#7AC142]/[0.06] border-[#7AC142]/20 text-[#1a2b3c]/70'
              }`}
            >
              <span className={`material-icons-outlined text-base shrink-0 ${formData.userType === 'provider' ? 'text-[#10B981]' : 'text-[#7AC142]'}`}>
                {formData.userType === 'provider' ? 'verified' : 'check_circle'}
              </span>
              {formData.userType === 'provider'
                ? "You'll set up a provider profile to offer services and receive job requests."
                : "You'll set up a customer account to book and manage service requests."}
            </motion.div>
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-[#1a2b3c] mb-1.5">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                value={formData.fullName}
                onChange={handleChange}
                className={`appearance-none block w-full px-4 py-3 border rounded-lg placeholder-[#1a2b3c]/30 focus:outline-none focus:ring-2 focus:ring-[#7AC142]/50 focus:border-[#7AC142] transition-colors text-[#1a2b3c] ${errors.fullName ? 'border-red-300' : 'border-[#1a2b3c]/20'}`}
                placeholder="John Doe"
              />
              {errors.fullName && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.fullName}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#1a2b3c] mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className={`appearance-none block w-full px-4 py-3 border rounded-lg placeholder-[#1a2b3c]/30 focus:outline-none focus:ring-2 focus:ring-[#7AC142]/50 focus:border-[#7AC142] transition-colors text-[#1a2b3c] ${errors.email ? 'border-red-300' : 'border-[#1a2b3c]/20'}`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[#1a2b3c] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-4 py-3 border rounded-lg placeholder-[#1a2b3c]/30 focus:outline-none focus:ring-2 focus:ring-[#7AC142]/50 focus:border-[#7AC142] transition-colors text-[#1a2b3c] pr-10 ${errors.password ? 'border-red-300' : 'border-[#1a2b3c]/20'}`}
                  placeholder="Create a password"
                />
                <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#1a2b3c]/40 hover:text-[#1a2b3c]/70 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
               {errors.password ? <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.password}</p> : <p className="mt-1.5 text-xs text-[#1a2b3c]/40 font-medium">Min. 6 characters</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#1a2b3c] mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                      handleChange(e);
                      if (e.target.value !== formData.password) {
                          setErrors(prev => ({...prev, confirmPassword: "Passwords do not match"}));
                      } else {
                          setErrors(prev => ({...prev, confirmPassword: null}));
                      }
                  }}
                   className={`appearance-none block w-full px-4 py-3 border rounded-lg placeholder-[#1a2b3c]/30 focus:outline-none focus:ring-2 focus:ring-[#7AC142]/50 focus:border-[#7AC142] transition-colors text-[#1a2b3c] pr-10 ${errors.confirmPassword ? 'border-red-300' : 'border-[#1a2b3c]/20'}`}
                  placeholder="Confirm your password"
                />
                <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#1a2b3c]/40 hover:text-[#1a2b3c]/70 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md mt-2 ${
                formData.userType === 'provider'
                  ? 'bg-[#0F172A] hover:bg-slate-700'
                  : 'bg-[#1a2b3c] hover:bg-[#7AC142]'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  Creating Account…
                </>
              ) : (
                `Create Account as ${formData.userType === 'provider' ? 'Service Pro' : 'Customer'}`
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-4 bg-white text-gray-400 font-medium">Or sign up with</span>
              </div>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={async () => {
                  setGoogleLoading(true);
                  try { await loginWithGoogle(formData.userType); }
                  catch (err) { toast.error('Google sign up failed'); console.error(err); }
                  finally { setGoogleLoading(false); }
                }}
                disabled={googleLoading}
                className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                <img className="h-5 w-5" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" />
                {googleLoading ? 'Connecting...' : 'Sign up with Google'}
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

export default Register;
