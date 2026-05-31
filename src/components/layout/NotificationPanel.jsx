import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import { toast } from 'sonner';

import { supabase } from '../../lib/supabase';
import { useNotifications } from '../../context/NotificationContext';

// ── OTP Entry Mini-modal ─────────────────────────────────────────
function OTPModal({ jobId, onClose }) {
    const navigate = useNavigate();
    const [digits, setDigits] = useState(['', '', '', '']);
    const [phase, setPhase] = useState('idle'); // idle | error | success | verifying
    const [shake, setShake] = useState(false);
    const inputRefs = [useRef(), useRef(), useRef(), useRef()];

    useEffect(() => { inputRefs[0].current?.focus(); }, []);

    const handleDigit = (index, val) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...digits];
        next[index] = val;
        setDigits(next);
        if (val && index < 3) inputRefs[index + 1].current?.focus();
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0)
            inputRefs[index - 1].current?.focus();
    };

    const handleVerify = async () => {
        const entered = digits.join('');
        if (entered.length < 4) { toast.error('Enter all 4 digits'); return; }
        
        setPhase('verifying');
        try {
            const { data: job, error: fetchError } = await supabase
                .from('jobs')
                .select('otp_code, otp_expires_at')
                .eq('id', jobId)
                .single();

            if (fetchError || !job) throw new Error('Could not find job details');

            const isExpired = job.otp_expires_at && new Date(job.otp_expires_at) < new Date();

            if (entered === job.otp_code && !isExpired) {
                const { error: updateError } = await supabase
                    .from('jobs')
                    .update({ 
                        status: 'in_progress', 
                        started_at: new Date().toISOString() 
                    })
                    .eq('id', jobId);

                if (updateError) throw updateError;

                setPhase('success');
                toast.success('Job started! Good luck.');
                setTimeout(() => { onClose(); navigate('/provider/jobs'); }, 2000);
            } else {
                setPhase('error');
                setShake(true);
                setTimeout(() => {
                    setShake(false); setPhase('idle');
                    setDigits(['', '', '', '']);
                    inputRefs[0].current?.focus();
                }, 700);
                toast.error(isExpired ? 'Code has expired. Ask the customer to generate a new one.' : 'Wrong code — ask the customer to show you their screen.');
            }
        } catch (error) {
            console.error('Verification error:', error);
            toast.error(error.message || 'Verification failed');
            setPhase('idle');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[140] flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.92, y: 24 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.92, y: 24 }}
                transition={{ type: 'spring', damping: 22, stiffness: 320 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
                {/* Header */}
                <div className="bg-[#10B981] px-6 py-5 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/>
                            </svg>
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">Enter Job Start Code</p>
                            <p className="text-white/85 text-xs mt-0.5">Ask the customer to show their screen</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors mt-0.5">
                        <span className="material-icons text-xl">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 flex flex-col items-center">
                    {phase === 'success' ? (
                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center py-4">
                            <div className="w-16 h-16 bg-[#10B981] rounded-full flex items-center justify-center mb-4 shadow-lg shadow-[#10B981]/30">
                                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                                    <path d="M20 6L9 17l-5-5"/>
                                </svg>
                            </div>
                            <p className="font-bold text-gray-900 text-lg">Job is Live!</p>
                            <p className="text-gray-400 text-sm mt-1">Taking you to My Jobs…</p>
                        </motion.div>
                    ) : (
                        <>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">4-Digit Code</p>
                            <motion.div
                                animate={shake ? { x: [-6, 6, -6, 6, 0] } : {}}
                                transition={{ duration: 0.35 }}
                                className="flex gap-3 mb-6"
                            >
                                {digits.map((d, i) => (
                                    <input
                                        key={i} ref={inputRefs[i]}
                                        type="text" inputMode="numeric" maxLength={1} value={d}
                                        onChange={e => handleDigit(i, e.target.value)}
                                        onKeyDown={e => handleKeyDown(i, e)}
                                        className={`w-14 h-16 text-center text-3xl font-black rounded-2xl border-2 focus:outline-none transition-all tabular-nums
                                            ${phase === 'error' ? 'border-red-400 bg-red-50 text-red-600' : d ? 'border-[#10B981] bg-[#10B981]/5 text-[#0F172A]' : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-[#10B981]'}`}
                                    />
                                ))}
                            </motion.div>
                            <button
                                onClick={handleVerify}
                                disabled={digits.join('').length < 4}
                                className="w-full py-3.5 bg-[#0F172A] hover:bg-slate-700 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-40 shadow-md flex items-center justify-center gap-2"
                            >
                                <span className="material-icons text-base">play_circle</span>
                                Start Job
                            </button>
                            <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
                                This confirms the customer is present. Payment releases after completion.
                            </p>
                        </>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

// ── Main Notification Panel ──────────────────────────────────────
export default function NotificationPanel({ open, onClose }) {
    const { currentUser } = useAuth();
    const { notifications, markNotificationRead, markAllNotificationsRead } = useNotifications();
    const navigate = useNavigate();
    const isProvider = currentUser?.role === 'provider';

    const [otpJobId, setOtpJobId] = useState(null);
    const openOTPModal = (jobId) => { setOtpJobId(jobId); };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const handleMarkAll = async () => {
        await markAllNotificationsRead();
    };

    const handleNotifClick = async (notif) => {
        if (!notif.is_read) await markNotificationRead(notif.id);
        if (notif.cta_path) {
            // Handle OTP modals specially
            if (notif.cta_path.startsWith('otp:')) {
                openOTPModal(notif.cta_path.replace('otp:', ''));
            } else {
                navigate(notif.cta_path);
                onClose();
            }
        }
    };

    const formatTime = (ts) => {
        if (!ts) return '';
        const d = new Date(ts);
        const diff = Math.floor((Date.now() - d.getTime()) / 1000);
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
        return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
    };

    return (
        <>
            <AnimatePresence>
                {open && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="notif-backdrop"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[120]"
                            style={{ background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(2px)' }}
                            onClick={onClose}
                        />

                        {/* Slide-in panel */}
                        <motion.div
                            key="notif-panel"
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                            className="fixed right-0 top-0 bottom-0 z-[130] w-full max-w-sm bg-white shadow-2xl flex flex-col"
                        >
                            {/* Header */}
                            <div className="bg-[#10B981] px-6 py-5 flex items-center justify-between shrink-0">
                                <div>
                                    <h2 className="text-white font-bold text-base">Notifications</h2>
                                    {unreadCount > 0 && (
                                        <p className="text-white/70 text-xs mt-0.5">{unreadCount} unread</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    {unreadCount > 0 && (
                                        <button onClick={handleMarkAll} className="text-white/80 text-xs font-bold hover:text-white transition-colors">
                                            Mark all as read
                                        </button>
                                    )}
                                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                                        <span className="material-icons text-xl">close</span>
                                    </button>
                                </div>
                            </div>


                            {/* Notification list */}
                            <div className="flex-1 overflow-y-auto">
                                {notifications.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-48 gap-3 text-gray-400">
                                        <span className="material-icons-outlined text-4xl text-gray-200">notifications_none</span>
                                        <p className="text-sm font-medium">No notifications yet</p>
                                    </div>
                                )}
                                {notifications.map((notif) => {
                                    const isUnread = !notif.is_read;
                                    return (
                                        <div key={notif.id}
                                            onClick={() => handleNotifClick(notif)}
                                            className={`px-6 py-4 border-b border-gray-50 transition-colors cursor-pointer ${isUnread ? 'bg-[#10B981]/[0.03] hover:bg-[#10B981]/[0.06]' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className="flex gap-3.5">
                                                {/* Icon */}
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${notif.icon_bg || 'bg-gray-100'}`}>
                                                    <span className={`material-icons-outlined text-base ${notif.icon_color || 'text-gray-400'}`}>{notif.icon || 'info'}</span>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="text-[13px] font-bold text-gray-900 leading-snug">{notif.title}</p>
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            {isUnread && <div className="w-2 h-2 bg-[#10B981] rounded-full" />}
                                                            <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatTime(notif.created_at)}</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">{notif.body}</p>

                                                    {/* CTA button */}
                                                    {notif.cta_path && (
                                                        <button
                                                            onClick={e => { e.stopPropagation(); handleNotifClick(notif); }}
                                                            className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F172A] hover:bg-slate-700 text-white text-[11px] font-bold rounded-lg transition-all shadow-sm"
                                                        >
                                                            <span className="material-icons text-[12px]">arrow_forward</span>
                                                            {notif.cta_label || 'View'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Footer */}
                            <div className="shrink-0 border-t border-gray-100 px-6 py-4 bg-white">
                                <p className="text-center text-[11px] text-gray-400">
                                    Notifications are cleared after 30 days
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* OTP entry modal */}
            <AnimatePresence>
                {otpJobId && (
                    <OTPModal key="otp-modal" jobId={otpJobId} onClose={() => setOtpJobId(null)} />
                )}
            </AnimatePresence>
        </>
    );
}
