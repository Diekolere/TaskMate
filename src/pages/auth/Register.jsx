import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
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

        {/* Card */}
        <div className="bg-white py-8 px-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-2xl border border-[#1a2b3c]/5">
          
          {/* User Type Toggle */}
          <div className="flex p-1 bg-[#f7f8f3] rounded-lg mb-6 border border-[#1a2b3c]/5">
              <button
                type="button"
                onClick={() => handleUserTypeChange('customer')}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all duration-200 ${
                    formData.userType === 'customer' 
                    ? 'bg-white text-[#1a2b3c] shadow-sm ring-1 ring-[#1a2b3c]/5' 
                    : 'text-[#1a2b3c]/50 hover:text-[#1a2b3c] hover:bg-white/50'
                }`}
              >
                I need a service
            </button>
            <button
                type="button"
                onClick={() => handleUserTypeChange('provider')}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all duration-200 ${
                    formData.userType === 'provider' 
                    ? 'bg-[#1a2b3c] text-white shadow-sm' 
                    : 'text-[#1a2b3c]/50 hover:text-[#1a2b3c] hover:bg-white/50'
                }`}
              >
                I offer services
            </button>
          </div>

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
              className="w-full flex justify-center py-3.5 px-4 rounded-lg text-sm font-bold text-white bg-[#1a2b3c] hover:bg-[#7AC142] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a2b3c] transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-md mt-6"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin h-5 w-5 text-white" />
                  Creating Account...
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#1a2b3c]/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-[#1a2b3c]/50 font-medium">Or sign up with</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <button
                type="button"
                className="w-full inline-flex justify-center py-3 px-4 border border-[#1a2b3c]/20 rounded-lg shadow-sm bg-white text-sm font-medium hover:bg-[#f7f8f3] transition-colors"
              >
                 <img className="h-5 w-5" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" />
                 <span className="sr-only">Sign up with Google</span>
              </button>
               <button
                type="button"
                className="w-full inline-flex justify-center py-3 px-4 border border-[#1a2b3c]/20 rounded-lg shadow-sm bg-white text-sm font-medium hover:bg-[#f7f8f3] transition-colors"
              >
                 <img className="h-5 w-5" src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="" />
                 <span className="sr-only">Sign up with Facebook</span>
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
