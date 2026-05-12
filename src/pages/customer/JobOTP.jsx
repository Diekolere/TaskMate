import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Sidebar from '../../components/layout/Sidebar';
import TopNavbar from '../../components/layout/TopNavbar';
import MobileNavBar from '../../components/layout/MobileNavBar';

/** Demo: short window for testing — switch to e.g. 20 * 60 for production */
const OTP_EXPIRY_SECONDS = 10;

// Deterministic 4-digit OTP from job ID for demo consistency
const generateOTP = (id = '') => {
    const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return String((hash % 9000) + 1000);
};

const JobOTP = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const otp = generateOTP(jobId);
    const digits = otp.split('');

    const [status, setStatus] = useState('waiting'); // 'waiting' | 'started' | 'expired'
    const [secondsLeft, setSecondsLeft] = useState(OTP_EXPIRY_SECONDS);
    /** Bump when generating a new code so the simulated provider timeout re-runs */
    const [codeRound, setCodeRound] = useState(0);

    useEffect(() => {
        if (status !== 'waiting') return;
        const tick = setInterval(() => {
            setSecondsLeft(s => {
                if (s <= 1) {
                    setStatus('expired');
                    return 0;
                }
                return s - 1;
            });
        }, 1000);
        return () => clearInterval(tick);
    }, [status, codeRound]);

    /**
     * Demo: simulate provider entering the code partway through the window — only after the customer
     * taps “Generate new code” (codeRound > 0). First window lets the countdown reach 0 so “Timed out” works.
     */
    useEffect(() => {
        if (status !== 'waiting') return;
        if (codeRound === 0) return;
        const simulateMs = Math.min(5000, Math.max(2500, (OTP_EXPIRY_SECONDS * 1000) - 2000));
        const t = setTimeout(() => {
            setStatus(s => (s === 'waiting' ? 'started' : s));
        }, simulateMs);
        return () => clearTimeout(t);
    }, [status, codeRound]);

    useEffect(() => {
        if (status !== 'started') return;
        const t = setTimeout(() => {
            navigate('/customer/requests', { replace: true, state: { jobStarted: true, jobId } });
            toast.success('Job started', {
                description: 'When your provider finishes, you’ll get a notification to confirm or dispute within 48 hours.',
            });
        }, 3000);
        return () => clearTimeout(t);
    }, [status, jobId, navigate]);

    const secs = secondsLeft;
    const pad = n => String(n).padStart(2, '0');

    const resetWaiting = () => {
        setSecondsLeft(OTP_EXPIRY_SECONDS);
        setStatus('waiting');
        setCodeRound(r => r + 1);
    };

    return (
        <div className="flex min-h-screen bg-white font-sans text-gray-900">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <TopNavbar breadcrumbs={['Customer', { label: 'Active Job', path: `/customer/request/${jobId}` }, 'Job Code']} />

                <main className="flex-1 overflow-y-auto bg-white pb-24 md:pb-0">
                    <div className="max-w-lg mx-auto px-4 py-12 sm:py-16 flex flex-col items-center">

                        <AnimatePresence mode="wait">
                            {status === 'expired' && (
                                <motion.div
                                    key="expired"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center text-center w-full"
                                >
                                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 8v4m0 4h.01" />
                                        </svg>
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-2">Timed out</h2>
                                    <p className="text-sm text-gray-400 max-w-xs mb-8">
                                        This job start code is no longer valid. Generate a new code and show it to your provider before it expires again.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={resetWaiting}
                                        className="px-6 py-3 bg-[#0F172A] text-white font-bold rounded-xl text-sm hover:bg-slate-700 transition-all shadow-md"
                                    >
                                        Generate new code
                                    </button>
                                </motion.div>
                            )}

                            {status === 'waiting' && (
                                <motion.div
                                    key="waiting"
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -16 }}
                                    className="w-full flex flex-col items-center"
                                >
                                    <div className="relative mb-8">
                                        <div className="w-20 h-20 bg-[#10B981]/10 rounded-full flex items-center justify-center animate-pulse">
                                            <span className="material-icons text-[#10B981] text-4xl">lock</span>
                                        </div>
                                        <div className="absolute inset-0 rounded-full border-2 border-[#10B981]/30 animate-ping" />
                                    </div>

                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Job Start Code</p>
                                    <h2 className="text-xl font-bold text-gray-900 text-center mb-8">
                                        Show this code to your provider
                                    </h2>

                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full text-center mb-6">
                                        <div className="flex justify-center gap-3 mb-4">
                                            {digits.map((d, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.08 }}
                                                    className="w-16 h-20 bg-gray-50 border-2 border-[#10B981]/30 rounded-2xl flex items-center justify-center"
                                                >
                                                    <span className="text-4xl font-black text-[#0F172A] tabular-nums">{d}</span>
                                                </motion.div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-400">Show this to your provider · Do not share with anyone else</p>
                                    </div>

                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 w-full flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${secs <= 3 ? 'bg-red-50' : 'bg-amber-50'}`}>
                                            <span className={`material-icons text-lg ${secs <= 3 ? 'text-red-500' : 'text-amber-500'}`}>schedule</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Waiting for provider</p>
                                            <p className="text-xs text-gray-400">They enter this code on their device to start the job</p>
                                        </div>
                                        <div className="ml-auto text-right shrink-0">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Expires in</p>
                                            <p className={`text-sm font-mono font-bold tabular-nums ${secs <= 3 ? 'text-red-500' : 'text-gray-700'}`}>
                                                00:{pad(secs)}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-[11px] text-gray-400 text-center mt-4 max-w-sm leading-relaxed">
                                        {codeRound === 0
                                            ? 'This code expires when the timer hits 0 — then you can generate a new one. After that, the demo simulates your provider entering the code.'
                                            : 'When your provider enters the code, you’ll continue automatically. (Demo simulates this while there’s no live connection.)'}
                                    </p>

                                    <p className="text-xs text-gray-400 text-center mt-6 max-w-xs leading-relaxed">
                                        Your payment of <span className="font-semibold text-gray-600">₦{(15000).toLocaleString()}</span> is held safely by TaskMate until the job is confirmed complete.
                                    </p>
                                </motion.div>
                            )}

                            {status === 'started' && (
                                <motion.div
                                    key="started"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center text-center"
                                >
                                    <div className="w-20 h-20 bg-[#10B981] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-[#10B981]/30">
                                        <span className="material-icons text-white text-4xl">play_circle</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Job started</h2>
                                    <p className="text-gray-500 text-sm">Your provider has entered the code. The job is now in progress.</p>
                                    <div className="mt-6 flex items-center gap-2 text-sm text-[#10B981]">
                                        <div className="w-4 h-4 rounded-full border-2 border-[#10B981] border-t-transparent animate-spin" />
                                        Taking you to your requests…
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </div>
                </main>
                <MobileNavBar />
            </div>
        </div>
    );
};

export default JobOTP;
