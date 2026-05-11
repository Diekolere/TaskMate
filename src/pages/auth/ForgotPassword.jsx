import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setMessage('');
      setError('');
      setLoading(true);
      await resetPassword(email);
      setMessage('Check your inbox for further instructions');
      toast.success('Password reset email sent');
    } catch {
      setError('Failed to reset password');
      toast.error('Failed to send reset email');
    }
    setLoading(false);
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
          <h2 className="text-3xl font-bold text-[#1a2b3c] font-serif">Reset Password</h2>
          <p className="mt-3 text-[#1a2b3c]/70 text-base">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {/* Form shell */}
        <div className="bg-white py-2 px-0 sm:py-10 sm:px-8 sm:shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-2xl sm:border sm:border-[#1a2b3c]/5">
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-[#1a2b3c]/20 rounded-lg placeholder-[#1a2b3c]/30 focus:outline-none focus:ring-2 focus:ring-[#7AC142]/50 focus:border-[#7AC142] transition-colors text-[#1a2b3c]"
                placeholder="you@example.com"
              />
            </div>

            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
            {message && <p className="text-sm text-[#7AC142] font-medium">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3.5 px-4 rounded-lg text-sm font-bold text-white bg-[#1a2b3c] hover:bg-[#7AC142] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a2b3c] transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin h-5 w-5 text-white" />
                  Sending...
                </div>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <Link to="/login" className="font-semibold text-[#7AC142] hover:text-[#1a2b3c] transition-colors">
              &larr; Back to Sign In
            </Link>
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

export default ForgotPassword;
