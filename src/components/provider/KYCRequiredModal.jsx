import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

/**
 * A polished modal that blocks provider access to feature pages
 * until KYC verification is completed. Opens the KYCModal on action.
 */
export default function KYCRequiredModal({ open, onStartKYC }) {
    const navigate = useNavigate();

    if (!open) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm"
                    onClick={() => navigate('/provider/dashboard')}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="relative bg-white rounded-3xl shadow-2xl w-full max-w-[380px] overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Content */}
                    <div className="px-8 pt-10 pb-6 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-5">
                            <span className="material-icons text-amber-500 text-3xl">verified_user</span>
                        </div>
                        
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-2">
                            Verification Required
                        </h2>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Complete your identity verification to access jobs, view requests, and receive payments.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="px-8 pb-8 space-y-3">
                        <button
                            onClick={onStartKYC}
                            className="w-full h-12 bg-[#0F172A] hover:bg-slate-700 text-white font-bold text-sm rounded-2xl transition-all shadow-md active:scale-[0.98]"
                        >
                            Verify Now
                        </button>
                        <button
                            onClick={() => navigate('/provider/dashboard')}
                            className="w-full h-10 text-gray-400 hover:text-gray-600 font-bold text-xs rounded-xl transition-colors"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
