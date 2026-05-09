import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import TopNavbar from '../../components/layout/TopNavbar';
import { useAuth } from '../../context/AuthContext';

const steps = [
    { step: 1, title: 'Share Your Link',    desc: 'Send your unique invite link to skilled professionals in your network.' },
    { step: 2, title: 'They Get Verified',  desc: 'Your referral completes onboarding and passes identity verification.' },
    { step: 3, title: 'You Get Paid',       desc: 'Earn a referral bonus once they complete their first 5 jobs.' },
];

const HeroDecoration = () => (
    <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none"
        viewBox="0 0 900 280"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
    >
        <circle cx="780" cy="40"  r="160" stroke="white" strokeWidth="1" />
        <circle cx="780" cy="40"  r="240" stroke="white" strokeWidth="0.5" />
        <circle cx="60"  cy="280" r="110" stroke="white" strokeWidth="0.7" />
        <circle cx="60"  cy="280" r="180" stroke="white" strokeWidth="0.4" />
        {[...Array(5)].map((_, row) =>
            [...Array(7)].map((_, col) => (
                <circle key={`${row}-${col}`} cx={24 + col * 26} cy={24 + row * 26} r="1.4" fill="white" />
            ))
        )}
    </svg>
);

const ProviderInviteFriends = () => {
    const { currentUser } = useAuth();
    const [copied, setCopied] = useState(false);

    const refCode = (currentUser?.uid || currentUser?.id || 'guest').substring(0, 8).toUpperCase();
    const inviteLink = `https://taskmate-ng.vercel.app/register?ref=${currentUser?.uid || currentUser?.id || 'guest'}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        toast.success('Invite link copied!');
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            <ProviderSidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopNavbar breadcrumbs={['Invite Friends']} />

                <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
                    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">

                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl overflow-hidden shadow-sm border border-gray-100"
                        >
                            {/* ── Dark hero top ── */}
                            <div className="relative bg-[#0F172A] overflow-hidden">
                                <HeroDecoration />
                                <div className="absolute right-0 top-0 w-72 h-72 bg-[#10B981] opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                                <div className="relative z-10 px-8 sm:px-12 py-10 sm:py-14 flex flex-col lg:flex-row items-center gap-10">

                                    {/* Left text */}
                                    <div className="flex-1 min-w-0 text-center lg:text-left">
                                        <div className="inline-flex items-center gap-2 bg-[#10B981]/15 border border-[#10B981]/20 text-[#10B981] text-xs font-bold px-3 py-1.5 rounded-full mb-5 tracking-wide uppercase">
                                            <span className="material-icons-outlined text-sm">celebration</span>
                                            Referral Programme
                                        </div>
                                        <h1 className="text-2xl sm:text-3xl font-bold text-white leading-snug mb-3">
                                            Grow the Network,{' '}
                                            <span className="text-[#10B981]">Boost Your Earnings</span>
                                        </h1>
                                        <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto lg:mx-0">
                                            Invite skilled professionals to TaskMate. When they complete their first 5 jobs, you earn a referral bonus deposited directly to your balance.
                                        </p>

                                        <div className="mt-6 inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                                            <div className="w-9 h-9 bg-[#10B981]/20 rounded-xl flex items-center justify-center shrink-0">
                                                <span className="material-icons-outlined text-[#10B981] text-lg">redeem</span>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-white font-bold text-sm">Earn per referral</p>
                                                <p className="text-slate-400 text-xs">After their first 5 completed jobs</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right — invite card */}
                                    <div className="w-full lg:w-80 shrink-0">
                                        <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-5 space-y-4">
                                            <div>
                                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Referral Code</p>
                                                <div className="flex items-center justify-between bg-white/[0.08] border border-white/10 rounded-xl px-4 py-2.5">
                                                    <span className="text-white font-mono font-bold text-lg tracking-widest">{refCode}</span>
                                                    <span className="material-icons-outlined text-slate-400 text-base">tag</span>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Invite Link</p>
                                                <div className="bg-white/[0.08] border border-white/10 rounded-xl px-3 py-2.5">
                                                    <p className="text-xs text-slate-300 truncate font-mono">{inviteLink}</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 pt-1">
                                                <button
                                                    onClick={handleCopy}
                                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                                        copied
                                                            ? 'bg-[#10B981] text-white'
                                                            : 'bg-white text-[#0F172A] hover:bg-gray-100'
                                                    }`}
                                                >
                                                    <span className="material-icons-outlined text-base">{copied ? 'check' : 'content_copy'}</span>
                                                    {copied ? 'Copied!' : 'Copy Link'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (navigator.share) {
                                                            navigator.share({ title: 'Join TaskMate', text: 'Join TaskMate as a service provider!', url: inviteLink });
                                                        } else {
                                                            handleCopy();
                                                        }
                                                    }}
                                                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white transition-colors"
                                                    title="Share"
                                                >
                                                    <span className="material-icons-outlined text-base">share</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* ── White bottom — how it works ── */}
                            <div className="bg-white px-8 sm:px-12 py-10">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">How it works</p>
                                <h2 className="text-lg font-bold text-gray-900 mb-8">Three simple steps</h2>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    {steps.map((s, idx) => (
                                        <div key={s.step} className="relative">
                                            {idx < steps.length - 1 && (
                                                <div className="hidden sm:block absolute top-3 left-full w-6 border-t-2 border-dashed border-gray-200 z-10" />
                                            )}
                                            <div className="flex flex-col gap-2">
                                                <span className="text-xs font-bold text-[#10B981] uppercase tracking-widest">Step {s.step}</span>
                                                <h3 className="font-bold text-[#10B981]">{s.title}</h3>
                                                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Info strip */}
                                <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 border border-gray-100 rounded-xl px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <span className="material-icons-outlined text-[#10B981]">info</span>
                                        <p className="text-sm text-gray-500">
                                            Bonuses are credited within <span className="font-semibold text-gray-700">7 days</span> after your referee completes 5 jobs.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleCopy}
                                        className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-[#0F172A] text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-colors whitespace-nowrap"
                                    >
                                        <span className="material-icons-outlined text-base">content_copy</span>
                                        Copy My Link
                                    </button>
                                </div>
                            </div>

                        </motion.div>
                    </div>
                </main>
            </div>

            <ProviderMobileNavBar />
        </div>
    );
};

export default ProviderInviteFriends;
