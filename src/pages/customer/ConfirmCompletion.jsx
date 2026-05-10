import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Sidebar from '../../components/layout/Sidebar';
import TopNavbar from '../../components/layout/TopNavbar';
import MobileNavBar from '../../components/layout/MobileNavBar';

const COMMISSION_RATE = 0.1;
const AUTO_RELEASE_HOURS = 48;
// Demo: count down from 47h 59m 45s
const DEMO_SECONDS_LEFT = AUTO_RELEASE_HOURS * 3600 - 15;

const DISPUTE_CATEGORIES = [
    'Work not completed',
    'Poor quality of work',
    'Provider did not show up',
    'Safety concern',
    'Other',
];

const ConfirmCompletion = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();

    const amount = 15000;
    const commission = Math.round(amount * COMMISSION_RATE);
    const providerReceives = amount - commission;

    const [secondsLeft, setSecondsLeft] = useState(DEMO_SECONDS_LEFT);
    const [phase, setPhase] = useState('pending');
    const [disputeReason, setDisputeReason] = useState('');
    const [disputeCategory, setDisputeCategory] = useState(DISPUTE_CATEGORIES[0]);
    const [categoryOpen, setCategoryOpen] = useState(false);

    useEffect(() => {
        if (phase !== 'pending') return;
        const t = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
        return () => clearInterval(t);
    }, [phase]);

    const hours = Math.floor(secondsLeft / 3600);
    const mins = Math.floor((secondsLeft % 3600) / 60);
    const secs = secondsLeft % 60;
    const pad = (n) => String(n).padStart(2, '0');

    const releasePercent = Math.round(((DEMO_SECONDS_LEFT - secondsLeft) / DEMO_SECONDS_LEFT) * 100);

    const handleRelease = () => {
        setPhase('released');
        toast.success('Payment released to provider!');
        setTimeout(() => navigate('/customer/dashboard'), 3000);
    };

    const handleDispute = () => {
        if (!disputeReason.trim()) { toast.error('Please describe the issue'); return; }
        setPhase('disputed');
        toast.success('Dispute submitted. Our team will review within 24 hours.');
        setTimeout(() => navigate('/customer/dashboard'), 3000);
    };

    return (
        <div className="flex min-h-screen bg-white font-sans text-gray-900">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <TopNavbar breadcrumbs={['Customer', 'My Requests', 'Confirm Completion']} />

                <main className="flex-1 overflow-y-auto bg-white pb-24 md:pb-0">
                    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14">

                        <AnimatePresence mode="wait">

                            {phase === 'released' && (
                                <motion.div key="released" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
                                    <div className="w-20 h-20 bg-[#10B981] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#10B981]/30">
                                        <span className="material-icons text-white text-4xl">payments</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Released</h2>
                                    <p className="text-gray-500">₦{providerReceives.toLocaleString()} has been sent to your provider. Thanks for using TaskMate!</p>
                                </motion.div>
                            )}

                            {phase === 'disputed' && (
                                <motion.div key="disputed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
                                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <span className="material-icons text-amber-600 text-4xl">gavel</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Dispute Submitted</h2>
                                    <p className="text-gray-500 max-w-sm mx-auto">Our team will review your case within 24 hours. Payment is held until resolved.</p>
                                </motion.div>
                            )}

                            {phase === 'pending' && (
                                <motion.div key="pending" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

                                    {/* Header */}
                                    <div className="text-center mb-8">
                                        <div className="w-16 h-16 bg-[#10B981]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                                                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                                                <path d="M7.5 12l3 3 6-6" />
                                            </svg>
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900">Provider marked job complete</h2>
                                        <p className="text-sm text-gray-400 mt-1">Review and release payment, or raise a dispute if there's an issue.</p>
                                    </div>

                                    {/* Auto-release countdown */}
                                    <div className="bg-[#0F172A] rounded-2xl p-6 text-white">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Auto-release in</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-black font-mono tabular-nums">{pad(hours)}:{pad(mins)}:{pad(secs)}</span>
                                                </div>
                                            </div>
                                            <div className="w-14 h-14 relative">
                                                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3" />
                                                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10B981" strokeWidth="3"
                                                        strokeDasharray={`${releasePercent} ${100 - releasePercent}`}
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-400">{releasePercent}%</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Payment releases automatically after {AUTO_RELEASE_HOURS} hours if no dispute is raised. You can release early by tapping the button below.
                                        </p>
                                    </div>

                                    {/* Payment breakdown */}
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Payment Breakdown</p>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Amount held in escrow</span>
                                                <span className="font-bold text-gray-900">₦{amount.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-gray-400">
                                                <span>Platform commission (10%)</span>
                                                <span>− ₦{commission.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-sm pt-3 border-t border-gray-100">
                                                <span className="font-bold text-gray-900">Provider receives</span>
                                                <span className="font-bold text-[#10B981] text-base">₦{providerReceives.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Release early CTA */}
                                    <button
                                        onClick={handleRelease}
                                        className="w-full py-4 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-[#10B981]/20 flex items-center justify-center gap-2"
                                    >
                                        <span className="material-icons text-base">send</span>
                                        Release Payment Now
                                    </button>

                                    {/* Dispute section */}
                                    {phase !== 'dispute' && (
                                        <button
                                            onClick={() => setPhase('dispute')}
                                            className="w-full py-3 border border-red-200 bg-red-50 hover:bg-red-100 text-sm font-semibold text-red-600 rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            <span className="material-icons text-base">flag</span>
                                            Something went wrong — Raise a Dispute
                                        </button>
                                    )}

                                </motion.div>
                            )}

                            {phase === 'dispute' && (
                                <motion.div key="dispute" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

                                    <button onClick={() => setPhase('pending')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-2">
                                        <span className="material-icons text-base">arrow_back</span> Back
                                    </button>

                                    <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-3">
                                        <span className="material-icons text-red-500 shrink-0">error_outline</span>
                                        <div>
                                            <p className="font-bold text-red-900 text-sm">Raise a Dispute</p>
                                            <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
                                                Payment will be frozen while our team reviews your case. False disputes may result in account restrictions.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Issue Category</label>
                                            <div className="relative">
                                                <button type="button" onClick={() => setCategoryOpen(v => !v)}
                                                    className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 font-medium bg-white hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200 transition-all">
                                                    <span>{disputeCategory}</span>
                                                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${categoryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                                <AnimatePresence>
                                                    {categoryOpen && (
                                                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                                                            className="absolute z-20 left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
                                                            {DISPUTE_CATEGORIES.map(cat => (
                                                                <button key={cat} type="button"
                                                                    onClick={() => { setDisputeCategory(cat); setCategoryOpen(false); }}
                                                                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${cat === disputeCategory ? 'bg-red-50 text-red-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}>
                                                                    {cat}
                                                                </button>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Describe the Issue <span className="text-red-400">*</span></label>
                                            <textarea
                                                rows={4}
                                                value={disputeReason}
                                                onChange={e => setDisputeReason(e.target.value)}
                                                placeholder="Explain clearly what went wrong…"
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 transition-colors resize-none"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleDispute}
                                        className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
                                    >
                                        <span className="material-icons text-base">gavel</span>
                                        Submit Dispute
                                    </button>
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

export default ConfirmCompletion;
