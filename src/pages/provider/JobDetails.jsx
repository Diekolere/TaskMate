import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import TopNavbar from '../../components/layout/TopNavbar';
import ProviderNegotiationDrawer from '../../components/provider/ProviderNegotiationDrawer';
const COMMISSION = 0.10;
const AUTO_RELEASE_HOURS = 48;



// ── Status config ────────────────────────────────────────────────
const STATUS_CONFIG = {
    payment_secured:  { label: 'Payment Secured',  bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200',  dot: 'bg-green-500' },
    in_progress:      { label: 'In Progress',       bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500 animate-pulse' },
    Completed:        { label: 'Completed',         bg: 'bg-[#10B981]/10', text: 'text-[#10B981]', border: 'border-[#10B981]/20', dot: 'bg-[#10B981]' },
    /** Same as `Completed` — `DataContext.completeJob` uses lowercase */
    completed:        { label: 'Completed',         bg: 'bg-[#10B981]/10', text: 'text-[#10B981]', border: 'border-[#10B981]/20', dot: 'bg-[#10B981]' },
    payment_released: { label: 'Payout Released',  bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    Canceled:         { label: 'Canceled',          bg: 'bg-red-50',     text: 'text-red-600',    border: 'border-red-200',    dot: 'bg-red-500' },
};
const getStatusCfg = s => STATUS_CONFIG[s] || { label: s, bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' };

const normTimelineStatus = (s) => (String(s).toLowerCase() === 'completed' ? 'Completed' : String(s));

// ── Timeline steps ───────────────────────────────────────────────
const buildTimeline = (status) => {
    const steps = [
        { key: 'requested',       label: 'Request Received' },
        { key: 'payment_secured', label: 'Payment Secured' },
        { key: 'in_progress',     label: 'Job Started' },
        { key: 'Completed',       label: 'Work Completed' },
        { key: 'payment_released',label: 'Payout Released' },
    ];
    const order = ['requested', 'payment_secured', 'in_progress', 'Completed', 'payment_released'];
    const currentIdx = order.indexOf(normTimelineStatus(status)) === -1 ? 1 : order.indexOf(normTimelineStatus(status));
    return steps.map((s, i) => ({
        ...s,
        done: i <= currentIdx,
        active: i === currentIdx,
    }));
};

// ── Progress options for in_progress ────────────────────────────
const PROGRESS_OPTS = [
    { key: 'started',  label: 'Work started',    icon: 'construction' },
    { key: 'paused',   label: 'Paused — sourcing parts', icon: 'pause_circle' },
    { key: 'resumed',  label: 'Work resumed',    icon: 'play_circle' },
];



export default function JobDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const routeLocation = useLocation();
    const { currentUser } = useAuth();
    const { jobs, completeJob, updateJobStatus } = useData();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lightbox, setLightbox] = useState(null);
    const [progressOpen, setProgressOpen] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [confirmComplete, setConfirmComplete] = useState(false);
    const [showNegotiation, setShowNegotiation] = useState(false);

    useEffect(() => {
        const found = jobs.find(j => j.id === id);
        setJob(found || null);
        setLoading(false);
    }, [id, jobs]);

    useEffect(() => {
        const params = new URLSearchParams(routeLocation.search);
        if (params.get('negotiate') === 'true' || routeLocation.pathname.startsWith('/provider/negotiation/')) {
            setShowNegotiation(true);
        }
    }, [routeLocation.pathname, routeLocation.search]);

    const agreedPrice = job?.agreedPrice || job?.budget_estimate || job?.budget || 0;
    const commission  = Math.round(agreedPrice * COMMISSION);
    const takeHome    = agreedPrice - commission;

    const handleProgressUpdate = async (opt) => {
        setProgressOpen(false);
        try {
            const currentTimeline = job?.timeline || [];
            const newEvent = {
                id: Date.now().toString(),
                label: opt.label,
                key: opt.key,
                timestamp: new Date().toISOString(),
                icon: opt.icon
            };
            const updatedTimeline = [...currentTimeline, newEvent];
            await updateJobStatus(id, job.status, { timeline: updatedTimeline });
            setJob(prev => ({ ...prev, timeline: updatedTimeline }));
        } catch (error) {
            toast.error('Failed to update progress');
        }
    };

    const handleMarkComplete = async () => {
        setCompleting(true);
        setConfirmComplete(false);
        try {
            await completeJob(id);
            const providerName = currentUser?.full_name || currentUser?.displayName || 'Your provider';
            // Simulate pushing a notification to the customer via localStorage
            const existing = JSON.parse(localStorage.getItem('tm_customer_notifs') || '[]');
            existing.unshift({
                id: `complete-${id}-${Date.now()}`,
                icon: 'task_alt',
                iconBg: 'bg-[#10B981]/10',
                iconColor: 'text-[#10B981]',
                title: `${providerName} marked job as complete`,
                body: `Confirm release or open a dispute within 48 hours.`,
                time: 'Just now',
                unread: true,
                jobId: id,
            });
            localStorage.setItem('tm_customer_notifs', JSON.stringify(existing));
            window.dispatchEvent(new CustomEvent('tm-customer-notifs'));
            setJob(j => ({ ...j, status: 'completed' }));
        } catch {
            toast.error('Failed to update job status.');
        } finally {
            setCompleting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <span className="material-icons-outlined animate-spin text-3xl text-[#10B981]">progress_activity</span>
        </div>
    );

    if (!job) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
            <p className="text-sm text-gray-500">Job not found.</p>
            <Link to="/provider/jobs" className="text-[#10B981] font-bold text-sm hover:underline">← Back to My Jobs</Link>
        </div>
    );

    const cfg       = getStatusCfg(job.status);
    const timeline  = buildTimeline(job.status);
    const images    = job.images || job.photos || [];
    const location  = typeof job.location === 'string' ? job.location : job.location?.address || job.location_name || 'Not specified';

    const closeNegotiation = () => {
        setShowNegotiation(false);
        if (routeLocation.pathname.startsWith('/provider/negotiation/') || routeLocation.search.includes('negotiate=true')) {
            navigate(`/provider/jobs/${id}`, { replace: true });
        }
    };

    return (
        <div className="min-h-screen bg-white flex font-sans">
            <ProviderSidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopNavbar breadcrumbs={['My Jobs', 'Job Details']} />

                <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
                    <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">

                        {/* ── Header ───────────────────────────────── */}
                        <div className="max-w-3xl">
                            <Link to="/provider/jobs" className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-[#10B981] transition-colors mb-3">
                                <span className="material-icons text-sm">arrow_back</span>
                                My Jobs
                            </Link>

                            <div className="flex items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h1 className="text-[26px] sm:text-[32px] font-black text-gray-900 tracking-tight leading-tight">
                                            {job.title || job.serviceType || 'Job'}
                                        </h1>
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                            {cfg.label}
                                        </span>
                                        {job.urgency === 'high' && (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg">
                                                <span className="material-icons text-[13px]">bolt</span> Urgent
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest">
                                        <span>{job.category || 'Service'}</span>
                                        <span className="text-gray-200">·</span>
                                        <span className="flex items-center gap-1">
                                            <span className="material-icons-outlined text-sm">location_on</span>
                                            {location}
                                        </span>
                                    </div>
                                    {job.description && (
                                        <p className="text-sm text-gray-500 mt-4 leading-relaxed max-w-2xl font-medium">
                                            {job.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Main grid ────────────────────────────── */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                            {/* Left — 2 cols */}
                            <div className="lg:col-span-2 space-y-6">

                                {/* Action area — Prominent at the top of main column */}
                                <div className="space-y-4">
                                    {/* payment_secured → Enter Start Code */}
                                    {job.status === 'payment_secured' && (
                                        <Link
                                            to={`/provider/job-start/${job.id}`}
                                            className="w-full py-4 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-[#10B981]/20 flex items-center justify-center gap-2"
                                        >
                                            <span className="material-icons text-base">key</span>
                                            Enter Customer's Start Code
                                        </Link>
                                    )}

                                    {/* in_progress → Update progress + Mark complete */}
                                    {job.status === 'in_progress' && (
                                        <>
                                            <div className="relative">
                                                <button
                                                    onClick={() => setProgressOpen(v => !v)}
                                                    className="w-full py-3.5 bg-[#0F172A] hover:bg-slate-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                                                >
                                                    <span className="material-icons text-base">sync</span>
                                                    Update Progress
                                                    <span className={`material-icons text-base transition-transform ${progressOpen ? 'rotate-180' : ''}`}>expand_more</span>
                                                </button>
                                                <AnimatePresence>
                                                    {progressOpen && (
                                                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                                                            className="absolute z-10 left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
                                                            {PROGRESS_OPTS.map(opt => (
                                                                <button key={opt.key} onClick={() => handleProgressUpdate(opt)}
                                                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 font-semibold hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                                                                    <span className="material-icons-outlined text-[#10B981] text-base">{opt.icon}</span>
                                                                    {opt.label}
                                                                </button>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                            {!confirmComplete ? (
                                                <button
                                                    onClick={() => setConfirmComplete(true)}
                                                    className="w-full py-3.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <span className="material-icons text-base text-[#10B981]">check_circle</span>
                                                    Mark Job as Complete
                                                </button>
                                            ) : (
                                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                                                    <p className="text-sm font-bold text-gray-900">Confirm completion?</p>
                                                    <p className="text-xs text-gray-500 leading-relaxed">The customer will be notified to release payment or raise a dispute. Only confirm if the work is fully done.</p>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={handleMarkComplete}
                                                            disabled={completing}
                                                            className="flex-1 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                                                        >
                                                            {completing
                                                                ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                : <span className="material-icons text-sm">check</span>
                                                            }
                                                            Yes, I'm done
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmComplete(false)}
                                                            className="px-4 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-white transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Completed → waiting message */}
                                    {(job.status === 'completed' || job.status === 'Completed') && (
                                        <div className="bg-[#10B981]/5 border border-[#10B981]/20 rounded-xl p-4 flex items-start gap-3">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0 mt-0.5">
                                                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                                                <path d="M7.5 12l3 3 6-6" />
                                            </svg>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">Awaiting customer confirmation</p>
                                                <p className="text-xs text-gray-500 mt-0.5">Payment auto-releases after {AUTO_RELEASE_HOURS} hours if no dispute is raised.</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* payment_released → done */}
                                    {job.status === 'payment_released' && (
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                                            <span className="material-icons text-emerald-600 shrink-0">payments</span>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">Payout complete</p>
                                                <p className="text-xs text-gray-500 mt-0.5">₦{takeHome.toLocaleString()} was sent to your bank account.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Images */}
                                {images.length > 0 && (
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Job Photos</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {images.map((src, i) => (
                                                <button key={i} onClick={() => setLightbox(i)}
                                                    className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative group">
                                                    <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                        <span className="material-icons-outlined text-white opacity-0 group-hover:opacity-100 transition-opacity text-2xl">zoom_in</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Timeline moved to main column for better balance */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-5">Job Progress & History</p>
                                    <div className="relative pl-6 border-l-2 border-gray-100 space-y-6">
                                        {timeline.map((step, i) => (
                                            <div key={step.key} className="relative">
                                                <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-4 border-white ${
                                                    step.active ? 'bg-[#10B981] shadow-[0_0_0_4px_rgba(16,185,129,0.2)]' :
                                                    step.done   ? 'bg-[#10B981]' : 'bg-gray-200'
                                                }`} />
                                                <div>
                                                    <p className={`text-sm font-bold ${step.active ? 'text-[#10B981]' : step.done ? 'text-gray-900' : 'text-gray-300'}`}>
                                                        {step.label}
                                                    </p>
                                                    {step.active && <p className="text-[11px] text-gray-400 mt-0.5 font-medium">This is the current stage of the job.</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right — 1 col */}
                            <div className="space-y-5">

                                {/* Customer card */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Customer</p>
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden ring-2 ring-[#10B981]/20 flex items-center justify-center shrink-0">
                                            {job.customerPhoto
                                                ? <img src={job.customerPhoto} alt={job.customerName} className="w-full h-full object-cover" />
                                                : <span className="material-icons-outlined text-xl text-gray-400">person</span>
                                            }
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[15px] font-bold text-gray-900 flex items-center gap-1">
                                                {job.customerName || 'Customer'}
                                                <span className="material-icons-outlined text-blue-500 text-sm">verified</span>
                                            </p>
                                            <p className="text-xs text-gray-400 leading-relaxed">{job.customerLocation || location}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2.5">
                                        <button
                                            onClick={() => setShowNegotiation(true)}
                                            className="w-full py-3 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold flex items-center justify-center gap-2 text-[15px] transition-colors shadow-sm shadow-[#10B981]/20"
                                        >
                                            <span className="material-icons-outlined text-lg">chat</span>
                                            Send Message
                                        </button>
                                    </div>
                                </div>

                                {/* Financials */}
                                <div className="bg-[#0F172A] rounded-2xl p-5 text-white">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Your Earnings</p>
                                    <div className="space-y-2.5 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Agreed price</span>
                                            <span className="font-bold">₦{agreedPrice.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-400">
                                            <span>Platform fee (10%)</span>
                                            <span>− ₦{commission.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between pt-2.5 border-t border-white/10">
                                            <span className="font-bold text-white">You receive</span>
                                            <span className="font-black text-[#10B981] text-base">₦{takeHome.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">
                                        Released to your bank after customer confirms completion.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <AnimatePresence>
                {showNegotiation && (
                    <ProviderNegotiationDrawer
                        job={job}
                        onClose={() => setShowNegotiation(false)}
                    />
                )}
            </AnimatePresence>

            <ProviderMobileNavBar />

            {/* Lightbox */}
            <AnimatePresence>
                {lightbox !== null && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center p-4"
                        onClick={() => setLightbox(null)}>
                        <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-white/70 hover:text-white">
                            <span className="material-icons text-3xl">close</span>
                        </button>
                        <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            src={images[lightbox]} alt="Full view"
                            className="max-h-[85vh] max-w-full rounded-2xl object-contain"
                            onClick={e => e.stopPropagation()} />
                        <div className="absolute bottom-4 flex gap-2">
                            {images.map((_, i) => (
                                <button key={i} onClick={e => { e.stopPropagation(); setLightbox(i); }}
                                    className={`w-2 h-2 rounded-full transition-colors ${i === lightbox ? 'bg-white' : 'bg-white/30'}`} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
