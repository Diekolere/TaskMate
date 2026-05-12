import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle2, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

const EmailVerificationModal = ({ isOpen, onClose, email }) => {
    const { resendVerification } = useAuth();
    const [isResending, setIsResending] = useState(false);

    const handleResend = async () => {
        if (!email) return;
        setIsResending(true);
        try {
            await resendVerification(email);
        } catch (err) {
            toast.error(err.message || 'Failed to resend email');
        } finally {
            setIsResending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-[#0F172A]/60 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-[440px] bg-white rounded-[32px] shadow-2xl overflow-hidden"
                >
                    {/* Header Image/Icon Section */}
                    <div className="relative h-40 bg-[#7AC142] flex items-center justify-center overflow-hidden">
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-xl" />
                        
                        <div className="relative bg-white p-5 rounded-3xl shadow-xl">
                            <Mail className="w-10 h-10 text-[#7AC142]" />
                        </div>
                    </div>

                    {/* Close Button */}
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Content */}
                    <div className="p-8 sm:p-10 text-center">
                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 tracking-tight">
                            Verify your email
                        </h2>
                        <p className="text-gray-500 text-[15px] leading-relaxed mb-8">
                            We've sent a verification link to <span className="font-bold text-gray-900">{email || 'your email'}</span>. Please click the link to activate your TaskMate account.
                        </p>

                        <div className="space-y-4">
                            <button 
                                onClick={() => window.open('https://mail.google.com', '_blank')}
                                className="w-full flex items-center justify-center gap-2 py-4 bg-[#0F172A] text-white rounded-2xl font-bold text-[15px] hover:bg-slate-800 transition-all shadow-xl group"
                            >
                                Open Gmail
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                            
                            <button 
                                onClick={onClose}
                                className="w-full py-4 text-gray-500 font-bold text-[14px] hover:text-gray-900 transition-colors"
                            >
                                I'll do it later
                            </button>
                        </div>

                        {/* Footer Help */}
                        <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-gray-300" />
                            <p className="text-[12px] font-medium text-gray-400">
                                Didn't get it? <button 
                                    onClick={handleResend}
                                    disabled={isResending}
                                    className="text-[#7AC142] font-bold hover:underline disabled:opacity-50 inline-flex items-center gap-1"
                                >
                                    {isResending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                    Resend email
                                </button>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default EmailVerificationModal;
