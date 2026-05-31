import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Sidebar from '../../components/layout/Sidebar';
import TopNavbar from '../../components/layout/TopNavbar';
import MobileNavBar from '../../components/layout/MobileNavBar';
import { supabase } from '../../lib/supabase';
import { useNotifications } from '../../context/NotificationContext';


const JobOTP = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const { sendNotification } = useNotifications();

    const [job, setJob] = useState(null);
    const [otp, setOtp] = useState('');
    const [status, setStatus] = useState('loading'); // 'loading' | 'waiting' | 'started' | 'expired'
    const [secondsLeft, setSecondsLeft] = useState(0);

    const fetchJobDetails = async () => {
        const { data } = await supabase.from('jobs').select('*').eq('id', jobId).single();
        if (data) setJob(data);
    };

    useEffect(() => {
        fetchJobDetails();
    }, [jobId]);

    const digits = otp ? otp.split('') : ['', '', '', ''];
    const secs = secondsLeft;
    const pad = n => String(n).padStart(2, '0');

    const generateAndSaveOTP = async () => {
        try {
            const newOTP = Math.floor(1000 + Math.random() * 9000).toString();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
            
            const { data: updatedJob, error } = await supabase
                .from('jobs')
                .update({ 
                    otp_code: newOTP, 
                    otp_expires_at: expiresAt 
                })
                .eq('id', jobId)
                .select('worker_id, title')
                .single();

            if (error) throw error;
            
            setOtp(newOTP);
            setSecondsLeft(15 * 60);
            setStatus('waiting');

            if (updatedJob && updatedJob.worker_id) {
                await sendNotification(updatedJob.worker_id, {
                    type: 'system',
                    title: 'Enter Job OTP to Start',
                    body: `The customer is ready. Ask them for the 4-digit code and enter it to start "${updatedJob.title}".`,
                    icon: 'lock_open',
                    iconBg: 'bg-green-50',
                    iconColor: 'text-[#10B981]',
                    ctaPath: `/provider/job-start/${jobId}`,
                    ctaLabel: 'Enter OTP'
                });
            }
        } catch (error) {
            console.error('Failed to generate OTP:', error);
            toast.error('Failed to generate start code');
        }
    };

    useEffect(() => {
        generateAndSaveOTP();
    }, [jobId]);

    // Timer logic
    useEffect(() => {
        if (status !== 'waiting' || secondsLeft <= 0) return;
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
    }, [status, secondsLeft]);

    // Listen for status change via realtime
    useEffect(() => {
        if (status !== 'waiting') return;
        
        const channel = supabase
            .channel(`job_status_${jobId}`)
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'jobs',
                filter: `id=eq.${jobId}`
            }, (payload) => {
                if (payload.new.status === 'in_progress') {
                    setStatus('started');
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [status, jobId]);
    // Auto-navigate after success
    useEffect(() => {
        if (status !== 'started') return;
        const t = setTimeout(() => {
            navigate(`/customer/request-status/${jobId}`, { replace: true, state: { jobStarted: true, jobId } });
        }, 3000);
        return () => clearTimeout(t);
    }, [status, jobId, navigate]);
    const resetWaiting = () => {
        generateAndSaveOTP();
    };

    if (status === 'loading') return null;

    return (
        <div className="flex min-h-screen bg-white font-sans text-gray-900">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <TopNavbar breadcrumbs={['Customer', { label: 'Request Details', path: `/customer/request-status/${jobId}` }, 'Job Code']} />

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
                                            <span className="material-icons text-lg text-amber-500">schedule</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Waiting for provider</p>
                                            <p className="text-xs text-gray-400">They enter this code on their device to start the job</p>
                                        </div>
                                        <div className="ml-auto text-right shrink-0">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Expires in</p>
                                            <p className={`text-sm font-mono font-bold tabular-nums ${secs <= 10 ? 'text-red-500' : 'text-gray-700'}`}>
                                                {pad(Math.floor(secs / 60))}:{pad(secs % 60)}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-[11px] text-gray-400 text-center mt-6 max-w-sm leading-relaxed">
                                        When your provider enters the code, you’ll continue automatically.
                                    </p>

                                    <p className="text-xs text-gray-400 text-center mt-6 max-w-xs leading-relaxed">
                                        Your payment of <span className="font-semibold text-gray-600">₦{Number(job?.final_budget || job?.budget_estimate || 0).toLocaleString()}</span> is held safely by TaskMate until the job is confirmed complete.
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
