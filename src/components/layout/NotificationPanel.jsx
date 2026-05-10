import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

// Deterministic OTP (must match JobOTP.jsx + JobStart.jsx)
const generateOTP = (id = '') => {
    const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return String((hash % 9000) + 1000);
};

// Static demo + simulation entries (real provider-driven completes go in `tm_customer_notifs`)
const buildCustomerStaticNotifs = (navigate) => [
    {
        id: 'n-demo-provider-complete',
        type: 'job_complete',
        unread: true,
        icon: 'task_alt',
        iconBg: 'bg-[#10B981]/10',
        iconColor: 'text-[#10B981]',
        title: 'Ibrahim Musa marked job as complete',
        body: 'Release payment or settle a dispute within 48 hours.',
        time: 'Demo',
        action: {
            label: 'Review & release',
            onClick: () => navigate('/customer/confirm/job-paid-01'),
        },
    },
    {
        id: 'n1', type: 'job', unread: true,
        icon: 'handshake', iconBg: 'bg-[#10B981]/10', iconColor: 'text-[#10B981]',
        title: 'Offer accepted',
        body: 'Ibrahim Musa accepted your negotiated price of ₦11,000.',
        time: '5 mins ago',
        action: null,
    },
    {
        id: 'n2', type: 'payment', unread: true,
        icon: 'payments', iconBg: 'bg-blue-50', iconColor: 'text-blue-500',
        title: 'Payment confirmed',
        body: 'Your payment of ₦11,000 has been received and is held in escrow.',
        time: '1 hour ago',
        action: null,
    },
    {
        id: 'n3', type: 'system', unread: false,
        icon: 'info', iconBg: 'bg-gray-100', iconColor: 'text-gray-500',
        title: 'Profile saved',
        body: 'Your profile changes have been saved successfully.',
        time: '2 days ago',
        action: null,
    },
];

const PROVIDER_NOTIFS = (navigate, openOTPModal) => [
    {
        id: 'pn1', type: 'job_ready', unread: true,
        icon: 'key', iconBg: 'bg-[#10B981]/10', iconColor: 'text-[#10B981]',
        title: 'Customer is ready',
        body: 'Diekolere Olaitan has paid and is waiting for you. Enter the start code to begin.',
        time: 'Just now',
        action: {
            label: 'Enter Start Code',
            onClick: () => openOTPModal('demo-001'),
        },
    },
    {
        id: 'pn2', type: 'negotiation', unread: true,
        icon: 'forum', iconBg: 'bg-violet-50', iconColor: 'text-violet-500',
        title: 'Counter offer received',
        body: 'A customer countered your quote of ₦15,000 with ₦12,500 for the plumbing job.',
        time: '22 mins ago',
        action: {
            label: 'View Negotiation',
            onClick: () => navigate('/provider/requests/job-2'),
        },
    },
    {
        id: 'pn3', type: 'payment', unread: false,
        icon: 'account_balance_wallet', iconBg: 'bg-blue-50', iconColor: 'text-blue-500',
        title: 'Payout sent',
        body: '₦13,500 has been sent to your Zenith Bank account ending in 4421.',
        time: '3 hours ago',
        action: null,
    },
    {
        id: 'pn4', type: 'system', unread: false,
        icon: 'verified', iconBg: 'bg-amber-50', iconColor: 'text-amber-500',
        title: 'KYC under review',
        body: 'Your identity documents are being reviewed. This usually takes 24–48 hours.',
        time: '1 day ago',
        action: null,
    },
];

// ── OTP Entry Mini-modal ─────────────────────────────────────────
function OTPModal({ jobId, onClose }) {
    const navigate = useNavigate();
    const correctOTP = generateOTP(jobId);
    const [digits, setDigits] = useState(['', '', '', '']);
    const [phase, setPhase] = useState('idle'); // idle | error | success
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

    const handleVerify = () => {
        const entered = digits.join('');
        if (entered.length < 4) { toast.error('Enter all 4 digits'); return; }
        if (entered === correctOTP) {
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
            toast.error('Wrong code — ask the customer to show you their screen.');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center p-4"
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
                            <p className="text-slate-400 text-xs mt-0.5">Ask the customer to show their screen</p>
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
    const navigate = useNavigate();
    const isProvider = currentUser?.role === 'provider';

    const [otpJobId, setOtpJobId] = useState(null);
    const [read, setRead] = useState(new Set());
    const [lsNotifs, setLsNotifs] = useState([]);

    const openOTPModal = (jobId) => { setOtpJobId(jobId); };

    // Pick up any notifications written by the provider (e.g. job complete)
    useEffect(() => {
        if (isProvider) return;
        const load = () => {
            const stored = JSON.parse(localStorage.getItem('tm_customer_notifs') || '[]');
            const enriched = stored.map(n => ({
                ...n,
                action: n.jobId ? {
                    label: 'Review & Release',
                    onClick: () => navigate(`/customer/confirm/${n.jobId}`),
                } : null,
            }));
            setLsNotifs(enriched);
        };
        load();
        window.addEventListener('tm-customer-notifs', load);
        return () => window.removeEventListener('tm-customer-notifs', load);
    }, [isProvider, navigate]);

    const notifications = isProvider
        ? PROVIDER_NOTIFS(navigate, openOTPModal)
        : [...lsNotifs, ...buildCustomerStaticNotifs(navigate)];

    const unreadCount = notifications.filter(n => n.unread && !read.has(n.id)).length;

    const markAll = () => setRead(new Set(notifications.map(n => n.id)));

    const handleAction = (notif) => {
        setRead(r => new Set([...r, notif.id]));
        notif.action?.onClick();
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
                            className="fixed inset-0 z-[60]"
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
                            className="fixed right-0 top-0 bottom-0 z-[70] w-full max-w-sm bg-white shadow-2xl flex flex-col"
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
                                        <button onClick={markAll} className="text-white/80 text-xs font-bold hover:text-white transition-colors">
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
                                {notifications.map((notif, idx) => {
                                    const isUnread = notif.unread && !read.has(notif.id);
                                    return (
                                        <div key={notif.id}
                                            onClick={() => setRead(r => new Set([...r, notif.id]))}
                                            className={`px-6 py-4 border-b border-gray-50 transition-colors cursor-pointer ${isUnread ? 'bg-[#10B981]/[0.03] hover:bg-[#10B981]/[0.06]' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className="flex gap-3.5">
                                                {/* Icon */}
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${notif.iconBg}`}>
                                                    <span className={`material-icons-outlined text-base ${notif.iconColor}`}>{notif.icon}</span>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="text-[13px] font-bold text-gray-900 leading-snug">{notif.title}</p>
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            {isUnread && <div className="w-2 h-2 bg-[#10B981] rounded-full" />}
                                                            <span className="text-[10px] text-gray-400 whitespace-nowrap">{notif.time}</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">{notif.body}</p>

                                                    {/* Action button */}
                                                    {notif.action && (
                                                        <button
                                                            onClick={e => { e.stopPropagation(); handleAction(notif); onClose(); }}
                                                            className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F172A] hover:bg-slate-700 text-white text-[11px] font-bold rounded-lg transition-all shadow-sm"
                                                        >
                                                            <span className="material-icons text-[12px]">arrow_forward</span>
                                                            {notif.action.label}
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
