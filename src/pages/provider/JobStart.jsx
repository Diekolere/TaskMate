import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import TopNavbar from '../../components/layout/TopNavbar';

// Must match customer side
const generateOTP = (id = '') => {
    const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return String((hash % 9000) + 1000);
};

const JobStart = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const correctOTP = generateOTP(jobId);

    const [digits, setDigits] = useState(['', '', '', '']);
    const [status, setStatus] = useState('idle'); // 'idle' | 'error' | 'success'
    const [shake, setShake] = useState(false);
    const inputRefs = [useRef(), useRef(), useRef(), useRef()];

    const handleDigit = (index, val) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...digits];
        next[index] = val;
        setDigits(next);
        if (val && index < 3) inputRefs[index + 1].current?.focus();
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    const handleVerify = () => {
        const entered = digits.join('');
        if (entered.length < 4) { toast.error('Enter all 4 digits'); return; }

        if (entered === correctOTP) {
            setStatus('success');
            toast.success('Job started! Good luck.');
            setTimeout(() => navigate('/provider/jobs'), 2500);
        } else {
            setStatus('error');
            setShake(true);
            setTimeout(() => { setShake(false); setStatus('idle'); setDigits(['', '', '', '']); inputRefs[0].current?.focus(); }, 800);
            toast.error('Incorrect code. Ask the customer to show you their screen.');
        }
    };

    return (
        <div className="min-h-screen bg-white flex font-sans">
            <ProviderSidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopNavbar breadcrumbs={['Jobs', 'Start Job']} />

                <main className="flex-1 overflow-y-auto pb-24 md:pb-0 bg-white">
                    <div className="max-w-md mx-auto px-4 py-12 sm:py-16 flex flex-col items-center">

                        <AnimatePresence mode="wait">
                            {status === 'success' ? (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center text-center"
                                >
                                    <div className="w-20 h-20 bg-[#10B981] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-[#10B981]/30">
                                        <span className="material-icons text-white text-4xl">check</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Job is Live!</h2>
                                    <p className="text-gray-500 text-sm">The job clock has started. Do your best work!</p>
                                    <div className="mt-6 flex items-center gap-2 text-sm text-[#10B981]">
                                        <div className="w-4 h-4 rounded-full border-2 border-[#10B981] border-t-transparent animate-spin" />
                                        Taking you to your jobs…
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="form"
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full flex flex-col items-center"
                                >
                                    <div className="w-16 h-16 bg-[#0F172A] rounded-2xl flex items-center justify-center mb-6 shadow-md">
                                        <span className="material-icons text-[#10B981] text-3xl">key</span>
                                    </div>

                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Job Start</p>
                                    <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Enter the customer's code</h2>
                                    <p className="text-sm text-gray-400 text-center mb-10">
                                        Ask your customer to open their TaskMate app and show you their 4-digit job code.
                                    </p>

                                    {/* OTP inputs */}
                                    <motion.div
                                        animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
                                        transition={{ duration: 0.4 }}
                                        className="flex gap-3 mb-8"
                                    >
                                        {digits.map((d, i) => (
                                            <input
                                                key={i}
                                                ref={inputRefs[i]}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={d}
                                                onChange={e => handleDigit(i, e.target.value)}
                                                onKeyDown={e => handleKeyDown(i, e)}
                                                className={`w-16 h-20 text-center text-4xl font-black rounded-2xl border-2 focus:outline-none transition-all tabular-nums
                                                    ${status === 'error' ? 'border-red-400 bg-red-50 text-red-600' : d ? 'border-[#10B981] bg-[#10B981]/5 text-[#0F172A]' : 'border-gray-200 bg-white text-gray-900 focus:border-[#10B981]'}`}
                                            />
                                        ))}
                                    </motion.div>

                                    <button
                                        onClick={handleVerify}
                                        disabled={digits.join('').length < 4}
                                        className="w-full py-4 bg-[#0F172A] hover:bg-slate-700 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-40 shadow-md flex items-center justify-center gap-2"
                                    >
                                        <span className="material-icons text-base">play_circle</span>
                                        Start Job
                                    </button>

                                    <p className="text-xs text-gray-400 text-center mt-6 leading-relaxed max-w-xs">
                                        This code confirms the customer is present and consents to the job starting. Payment is released after completion.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>
            </div>

            <ProviderMobileNavBar />
        </div>
    );
};

export default JobStart;
