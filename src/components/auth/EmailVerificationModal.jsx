import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, MailCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

const EmailVerificationModal = ({ isOpen, onClose, email }) => {
    const { resendVerification } = useAuth();
    const [isResending, setIsResending] = useState(false);
    const [resent, setResent] = useState(false);

    const handleResend = async () => {
        if (!email || isResending) return;
        setIsResending(true);
        try {
            await resendVerification(email);
            setResent(true);
            setTimeout(() => setResent(false), 5000);
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
                    className="absolute inset-0 bg-[#0F172A]/50 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 16 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-[420px] bg-white rounded-3xl shadow-2xl overflow-hidden"
                >
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all z-10"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Body */}
                    <div className="px-8 pt-10 pb-8 text-center">

                        {/* Icon */}
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <MailCheck className="w-8 h-8 text-[#1a2b3c]" strokeWidth={1.5} />
                        </div>

                        {/* Heading */}
                        <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">
                            Check your inbox
                        </h2>
                        <p className="text-sm text-gray-500 leading-relaxed mb-1">
                            We sent a verification link to
                        </p>
                        <p className="text-sm font-semibold text-gray-800 mb-7 truncate px-4">
                            {email || 'your email address'}
                        </p>

                        {/* Primary CTA */}
                        <button
                            onClick={() => window.open('https://mail.google.com', '_blank')}
                            className="w-full py-3.5 px-4 bg-[#1a2b3c] text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors mb-3"
                        >
                            Open Gmail
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full py-3 text-sm text-gray-400 font-medium hover:text-gray-600 transition-colors"
                        >
                            I'll do it later
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-4 border-t border-gray-100 bg-gray-50/60 flex items-center justify-center gap-2">
                        <p className="text-xs text-gray-400">
                            Didn't receive it?{' '}
                            <button
                                onClick={handleResend}
                                disabled={isResending || resent}
                                className="font-semibold text-[#1a2b3c] hover:text-[#7AC142] transition-colors disabled:opacity-60 inline-flex items-center gap-1"
                            >
                                {isResending
                                    ? <><Loader2 className="w-3 h-3 animate-spin inline" /> Resending…</>
                                    : resent
                                    ? '✓ Sent!'
                                    : <><RefreshCw className="w-3 h-3 inline" /> Resend</>
                                }
                            </button>
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default EmailVerificationModal;
