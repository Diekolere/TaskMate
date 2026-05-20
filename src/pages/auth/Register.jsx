import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import EmailVerificationModal from '../../components/auth/EmailVerificationModal';

const CATEGORIES = [
  'Plumbing', 'Electrical', 'Furniture (Carpentry)', 'Cleaning', 'Painting',
  'HVAC', 'Moving', 'Roofing', 'Appliance Repair', 'Landscaping', 'Laundry'
];

const Register = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    userType: null,
  });
  
  const [step, setStep] = useState(1); // For providers: 1=Form, 2=OTP
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [errors, setErrors] = useState({});

  const [otpValue, setOtpValue] = useState('');

  const validateCustomerForm = () => {
    let newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
    
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateProviderStep1 = () => {
    let newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleUserTypeChange = (type) => {
    setFormData(prev => ({ ...prev, userType: type }));
    setStep(1);
    setErrors({});
  }

  // Handle Customer Submit
  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!validateCustomerForm()) return;
    setIsLoading(true);
    try {
        await register(formData.email, formData.password, formData.fullName, 'customer');
        setShowVerificationModal(true);
    } catch (error) {
        let msg = error.message || "Registration failed";
        if (error.code === 'auth/email-already-in-use') msg = "Email is already registered.";
        toast.error(msg);
    } finally {
        setIsLoading(false);
    }
  };

  // Handle Provider Next Steps
  const nextProviderStep = () => {
    if (step === 1 && !validateProviderStep1()) return;
    
    if (step === 1) {
      setStep(2);
      toast.success('Mock OTP Sent! (Enter 123456 to verify)');
    }
  };

  // Handle Provider Mock OTP Verify
  const handleProviderVerifyOTP = async () => {
    if (otpValue !== '123456') {
      toast.error('Invalid OTP. Use 123456 for testing.');
      return;
    }
    
    setIsLoading(true);
    try {
      await register(formData.phone, formData.password, formData.fullName, 'provider', formData.email || null);
      
      // Attempt to retrieve session (if phone confirmation is disabled)
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (userId) {
        // Save phone, name, role directly
        await supabase.from('profiles').update({
          phone_number: formData.phone,
          full_name: formData.fullName,
          role: 'provider'
        }).eq('id', userId);
        
        await supabase.from('provider_profiles').upsert({
          id: userId
        });
      }

      toast.success('Provider account created successfully!');
      navigate('/provider/dashboard');
      
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      <div className="max-w-xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <img src="/icon.png" alt="TaskMate" className="h-10 w-10" />
            <span className="font-bold text-3xl tracking-tight text-[#1a2b3c] font-serif">TaskMate</span>
          </Link>
          <h2 className="text-3xl font-bold text-[#1a2b3c] font-serif">Create Account</h2>
          <p className="mt-2 text-[#1a2b3c]/70 text-base">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#7AC142] hover:text-[#1a2b3c] transition-colors">Sign in</Link>
          </p>
        </div>

        {/* Role toggle */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={() => handleUserTypeChange('customer')}
            className={`relative flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all overflow-hidden ${
              formData.userType === 'customer' ? 'border-[#7AC142] bg-[#7AC142]/[0.03] shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
            }`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0 ${formData.userType === 'customer' ? 'bg-[#7AC142]/10 text-[#7AC142]' : 'bg-gray-100 text-gray-400'}`}>
              <span className="material-icons-outlined text-lg">person</span>
            </div>
            <div className="flex-1 min-w-0 pr-4">
              <h3 className={`font-bold text-xs leading-tight mb-0.5 truncate ${formData.userType === 'customer' ? 'text-[#1a2b3c]' : 'text-gray-600'}`}>Regular User</h3>
              <p className="text-[10px] text-gray-500 font-medium truncate">I want to hire pros</p>
            </div>
          </button>

          <button type="button" onClick={() => handleUserTypeChange('provider')}
            className={`relative flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all overflow-hidden ${
              formData.userType === 'provider' ? 'border-[#0F172A] bg-[#0F172A]/[0.02] shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
            }`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0 ${formData.userType === 'provider' ? 'bg-[#0F172A]/10 text-[#0F172A]' : 'bg-gray-100 text-gray-400'}`}>
              <span className="material-icons-outlined text-lg">handyman</span>
            </div>
            <div className="flex-1 min-w-0 pr-4">
              <h3 className={`font-bold text-xs leading-tight mb-0.5 truncate ${formData.userType === 'provider' ? 'text-[#1a2b3c]' : 'text-gray-600'}`}>Service Pro</h3>
              <p className="text-[10px] text-gray-500 font-medium truncate">I want to find jobs</p>
            </div>
          </button>
        </div>
        
        {/* Context hint */}
        <AnimatePresence mode="wait">
          {formData.userType && (
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
                ? "You'll be registered as a Service Pro to find jobs and manage earnings."
                : "You'll be registered as a Customer to hire pros and post jobs."}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Container */}
        <div className="w-full mt-8">
          
          {!formData.userType && (
            <div className="text-center py-10">
              <span className="material-icons text-4xl text-gray-300 mb-2">touch_app</span>
              <p className="text-gray-500 font-medium">Please select an account type above to continue.</p>
            </div>
          )}

          {/* CUSTOMER FLOW */}
          {formData.userType === 'customer' && (
            <form onSubmit={handleCustomerSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-[#1a2b3c] mb-1.5">Full Name</label>
                  <input name="fullName" type="text" value={formData.fullName} onChange={handleChange} className={`appearance-none block w-full px-4 py-3 border rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7AC142]/50 focus:border-[#7AC142] transition-colors ${errors.fullName ? 'border-red-300' : 'border-gray-200'}`} placeholder="John Doe" />
                  {errors.fullName && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1a2b3c] mb-1.5">Email Address</label>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} className={`appearance-none block w-full px-4 py-3 border rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7AC142]/50 focus:border-[#7AC142] transition-colors ${errors.email ? 'border-red-300' : 'border-gray-200'}`} placeholder="you@example.com" />
                  {errors.email && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-[#1a2b3c] mb-1.5">Password</label>
                  <div className="relative">
                    <input name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} className={`appearance-none block w-full px-4 py-3 border rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7AC142]/50 focus:border-[#7AC142] transition-colors pr-10 ${errors.password ? 'border-red-300' : 'border-gray-200'}`} placeholder="Create a password" />
                    <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                   {errors.password && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1a2b3c] mb-1.5">Confirm Password</label>
                  <input name="confirmPassword" type={showPassword ? "text" : "password"} value={formData.confirmPassword} onChange={handleChange} className={`appearance-none block w-full px-4 py-3 border rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7AC142]/50 focus:border-[#7AC142] transition-colors ${errors.confirmPassword ? 'border-red-300' : 'border-gray-200'}`} placeholder="Confirm your password" />
                  {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.confirmPassword}</p>}
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#1a2b3c] hover:bg-[#7AC142] transition-all disabled:opacity-70 shadow-lg mt-4">
                {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Create Customer Account'}
              </button>
            </form>
          )}

          {/* PROVIDER FLOW (Multi-Step) */}
          {formData.userType === 'provider' && (
            <div className="space-y-6">

              {step === 1 && (
                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-[#1a2b3c] mb-1.5">Full Name</label>
                      <input name="fullName" type="text" value={formData.fullName} onChange={handleChange} className={`appearance-none block w-full px-4 py-3 border rounded-xl placeholder-gray-400 focus:outline-none focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A] ${errors.fullName ? 'border-red-300' : 'border-gray-200'}`} placeholder="Jane Doe" />
                      {errors.fullName && <p className="mt-1.5 text-xs text-red-500">{errors.fullName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#1a2b3c] mb-1.5">Phone Number</label>
                      <input name="phone" type="tel" value={formData.phone} onChange={handleChange} className={`appearance-none block w-full px-4 py-3 border rounded-xl placeholder-gray-400 focus:outline-none focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A] ${errors.phone ? 'border-red-300' : 'border-gray-200'}`} placeholder="+234 800 000 0000" />
                      {errors.phone && <p className="mt-1.5 text-xs text-red-500">{errors.phone}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#1a2b3c] mb-1.5">Email Address <span className="text-gray-400 font-normal">(Optional)</span></label>
                    <input name="email" type="email" value={formData.email} onChange={handleChange} className={`appearance-none block w-full px-4 py-3 border rounded-xl placeholder-gray-400 focus:outline-none focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A] ${errors.email ? 'border-red-300' : 'border-gray-200'}`} placeholder="you@example.com" />
                    {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-[#1a2b3c] mb-1.5">Password</label>
                      <div className="relative">
                        <input name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} className={`appearance-none block w-full px-4 py-3 border rounded-xl placeholder-gray-400 focus:outline-none focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A] pr-10 ${errors.password ? 'border-red-300' : 'border-gray-200'}`} placeholder="Create a password" />
                        <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#1a2b3c] mb-1.5">Confirm Password</label>
                      <input name="confirmPassword" type={showPassword ? "text" : "password"} value={formData.confirmPassword} onChange={handleChange} className={`appearance-none block w-full px-4 py-3 border rounded-xl placeholder-gray-400 focus:outline-none focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A] ${errors.confirmPassword ? 'border-red-300' : 'border-gray-200'}`} placeholder="Confirm your password" />
                      {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword}</p>}
                    </div>
                  </div>
                  <button onClick={nextProviderStep} disabled={isLoading} className="w-full flex justify-center items-center gap-2 bg-[#0F172A] text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors mt-6 disabled:opacity-70">
                    {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Register & Verify Phone'}
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-5 text-center">
                  <h3 className="text-2xl font-bold text-[#1a2b3c] mb-2">Verify Phone</h3>
                  <p className="text-sm text-gray-500">We've sent a code to <span className="font-bold text-gray-800">{formData.phone}</span></p>
                  
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs p-3 rounded-xl mt-4 mb-6 text-left">
                    <strong>Note:</strong> SMS verification is currently simulated. Please enter <strong>123456</strong> to complete testing.
                  </div>

                  <div>
                    <input type="text" maxLength={6} value={otpValue} onChange={e => setOtpValue(e.target.value.replace(/\D/g, ''))} className="tracking-[0.5em] text-center text-3xl font-bold block w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-[#0F172A] outline-none transition-colors" placeholder="------" />
                  </div>
                  
                  <button onClick={handleProviderVerifyOTP} disabled={isLoading || otpValue.length < 6} className="w-full flex justify-center items-center gap-2 bg-[#0F172A] text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 mt-4">
                    {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Complete Registration'}
                  </button>
                  
                  <button onClick={() => setStep(1)} className="text-sm font-semibold text-gray-400 hover:text-gray-800 mt-4 underline">Back</button>
                </motion.div>
              )}

            </div>
          )}

          {/* Google Auth Option */}
          {formData.userType && step === 1 && (
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-4 bg-white text-gray-400 font-medium">Or sign up with</span>
                </div>
              </div>
              <div className="mt-5">
                <button type="button" onClick={async () => {
                    setGoogleLoading(true);
                    try { await loginWithGoogle(formData.userType); }
                    catch (err) { toast.error('Google sign up failed'); }
                    finally { setGoogleLoading(false); }
                  }}
                  disabled={googleLoading}
                  className="w-full inline-flex justify-center items-center gap-2 py-3.5 px-4 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
                >
                  <img className="h-5 w-5" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
                  {googleLoading ? 'Connecting...' : 'Google'}
                </button>
              </div>
            </div>
          )}

        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center text-sm text-[#1a2b3c]/40 font-medium">
            &copy; {new Date().getFullYear()} TaskMate Inc. All rights reserved.
        </div>
      </div>

      <EmailVerificationModal isOpen={showVerificationModal} onClose={() => setShowVerificationModal(false)} email={formData.email} />
    </motion.div>
  );
};

export default Register;
