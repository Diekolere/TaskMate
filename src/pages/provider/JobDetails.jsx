import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { supabase } from '../../lib/supabase';
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

const normTimelineStatus = (s) => {
    const val = String(s || '').toLowerCase();
    return val === 'completed' ? 'completed' : val;
};

// ── Timeline steps ───────────────────────────────────────────────
const buildTimeline = (status) => {
    const steps = [
        { key: 'negotiating',     label: 'Negotiation' },
        { key: 'awaiting_payment', label: 'Payment' },
        { key: 'payment_secured', label: 'Job Locked' },
        { key: 'in_progress',     label: 'In Progress' },
        { key: 'completed',       label: 'Review' },
        { key: 'payment_released',label: 'Paid' },
    ];
    
    const order = ['negotiating', 'awaiting_payment', 'payment_secured', 'in_progress', 'completed', 'payment_released'];
    const currentStatus = normTimelineStatus(status);
    
    let currentIdx = order.indexOf(currentStatus);
    if (currentIdx === -1) {
        if (['open', 'interested'].includes(currentStatus)) currentIdx = 0;
        else currentIdx = 1;
    }

    return steps.map((s, i) => ({
        ...s,
        done: i < currentIdx,
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
    const [showAllDetails, setShowAllDetails] = useState(false);
    const [showFinancials, setShowFinancials] = useState(false);
    const [customerProfile, setCustomerProfile] = useState(null);

    useEffect(() => {
        const fetchCustomer = async () => {
            const targetId = job?.customer_id || job?.customerId;
            if (!targetId) return;
            
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', targetId)
                .single();
            if (data) setCustomerProfile(data);
        };
        fetchCustomer();
    }, [job?.customer_id, job?.customerId]);

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
                                        <span className="bg-[#0F172A] text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">{job.category || 'None'}</span>
                                        <span className="text-gray-200">·</span>
                                        <span className="flex items-center gap-1">
                                            <span className="material-icons-outlined text-sm">location_on</span>
                                            {location}
                                        </span>
                                    </div>
                                    {job.description && (
                                        <p className="text-[15px] text-gray-500 mt-4 leading-relaxed max-w-2xl font-medium">
                                            {job.description}
                                        </p>
                                    )}

                                    {/* View More Details Toggle */}
                                    <div className="mt-8">
                                        <button 
                                            onClick={() => setShowAllDetails(!showAllDetails)}
                                            className="flex items-center gap-2 text-[#10B981] font-bold text-sm hover:opacity-80 transition-all"
                                        >
                                            <span className="material-icons text-lg">{showAllDetails ? 'expand_less' : 'expand_more'}</span>
                                            {showAllDetails ? 'Hide details' : 'View more details'}
                                        </button>

                                        <AnimatePresence>
                                            {showAllDetails && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="pt-8 space-y-8">
                                                        {/* Photos */}
                                                        {images.length > 0 && (
                                                            <div className="space-y-4">
                                                                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Photos</h4>
                                                                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                                                    {images.map((src, i) => (
                                                                        <button key={i} onClick={() => setLightbox(i)}
                                                                            className="w-48 sm:w-64 aspect-[4/3] rounded-2xl overflow-hidden border border-gray-100 shrink-0 shadow-sm hover:opacity-95 transition-opacity">
                                                                            <img src={src} alt={`Job ${i + 1}`} className="w-full h-full object-cover" />
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Job Details Grid */}
                                                        <div className="space-y-4">
                                                            <div className="flex flex-col gap-0.5">
                                                                <h4 className="text-[15px] font-black text-gray-900">Job Details</h4>
                                                            </div>
                                                            
                                                            <div className="divide-y divide-gray-100 border-y border-gray-100 mt-4">
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                                                                    <div className="py-5 flex items-center gap-4">
                                                                        <span className="material-icons-outlined text-gray-400 text-lg">build</span>
                                                                        <div>
                                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</p>
                                                                            <p className="text-sm font-bold text-gray-900">{job.category || 'None'}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="py-5 sm:pl-8 flex items-center gap-4">
                                                                        <span className="material-icons-outlined text-gray-400 text-lg">location_on</span>
                                                                        <div>
                                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location</p>
                                                                            <p className="text-sm font-bold text-gray-900">{location}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                                                                    <div className="py-5 flex items-center gap-4">
                                                                        <span className="material-icons-outlined text-gray-400 text-lg">person</span>
                                                                        <div>
                                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</p>
                                                                            <p className="text-sm font-bold text-gray-900">{job.customerName || 'Customer'}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="py-5 sm:pl-8 flex items-center gap-4">
                                                                        <span className="material-icons-outlined text-gray-400 text-lg">schedule</span>
                                                                        <div>
                                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Job ID</p>
                                                                            <p className="text-[11px] font-bold text-gray-500 truncate">{job.id}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Customer Info Section (Compact & Subtle) ── */}
                        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-1">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg overflow-hidden border border-gray-200 shadow-sm shrink-0">
                                    {customerProfile?.avatar_url || job.customerPhoto ? (
                                        <img src={customerProfile?.avatar_url || job.customerPhoto} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        (customerProfile?.full_name || job.customerName || 'C').charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="space-y-0.5">
                                    <h3 className="text-[17px] font-bold text-gray-900 leading-tight">{customerProfile?.full_name || job.customerName || 'Customer'}</h3>
                                    <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                        <span className="material-icons text-[14px] text-gray-400">location_on</span>
                                        {customerProfile?.location || job.customerLocation || job.location_name || 'Lagos, Nigeria'}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowNegotiation(true)}
                                className="px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-[#10B981]/10 flex items-center justify-center gap-2"
                            >
                                <span className="material-icons text-base">chat</span>
                                Message Customer
                            </button>
                        </div>

                        {/* ── Horizontal Progress Stepper ── */}
                        <div className="mb-12 px-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">Job Timeline</p>
                            <div className="overflow-x-auto pb-8 pt-4 -mx-2 px-2 scrollbar-hide">
                                <div className="flex items-center justify-between relative min-w-[500px] sm:min-w-0 w-full">
                                    {/* Connector Line */}
                                    <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-100 -z-0" />
                                    
                                    {timeline.map((step, i) => (
                                        <div key={step.key} className="flex flex-col items-center gap-2 relative z-10 flex-1 shrink-0">
                                            <div className={`w-8 h-8 rounded-full border-4 border-white flex items-center justify-center transition-all ${
                                                step.active ? 'bg-[#10B981] ring-4 ring-[#10B981]/10' :
                                                step.done   ? 'bg-[#10B981]' : 'bg-gray-200'
                                            }`}>
                                                {step.done && !step.active ? (
                                                    <span className="material-icons text-white text-[14px]">check</span>
                                                ) : step.active ? (
                                                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                                ) : null}
                                            </div>
                                            <p className={`text-[10px] font-bold text-center whitespace-nowrap px-2 ${
                                                step.active ? 'text-[#10B981]' : 
                                                step.done ? 'text-gray-900' : 'text-gray-400'
                                            }`}>
                                                {step.label}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── Action Area (Above Secondary Grid) ── */}
                        <div className="space-y-4 mb-8">
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <button
                                            onClick={() => setProgressOpen(v => !v)}
                                            className="w-full h-full py-4 bg-[#0F172A] hover:bg-slate-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
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
                                            className="w-full py-4 border-2 border-gray-100 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                                        >
                                            <span className="material-icons text-base text-[#10B981]">check_circle</span>
                                            Mark Job as Complete
                                        </button>
                                    ) : (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                                            <p className="text-sm font-bold text-gray-900">Confirm completion?</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleMarkComplete}
                                                    disabled={completing}
                                                    className="flex-1 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50"
                                                >
                                                    Yes, I'm done
                                                </button>
                                                <button
                                                    onClick={() => setConfirmComplete(false)}
                                                    className="px-4 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl text-sm"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
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

                        {/* ── Financial Section Toggle ── */}
                        <div className="mb-4">
                            <button
                                onClick={() => setShowFinancials(v => !v)}
                                className="flex items-center gap-2 text-gray-400 font-bold text-[11px] uppercase tracking-widest hover:text-[#10B981] transition-all px-1"
                            >
                                <span className="material-icons text-base">{showFinancials ? 'expand_less' : 'payments'}</span>
                                {showFinancials ? 'Hide Financials' : 'View Financial Overview'}
                            </button>
                        </div>

                        <AnimatePresence>
                            {showFinancials && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    className="overflow-hidden"
                                >
                                    <div className="py-6 px-1 space-y-6 border-b border-gray-100 mb-8">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-500 font-medium">Agreed Price</span>
                                                    <span className="font-bold text-gray-900">₦{agreedPrice.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-gray-500 font-medium">Service Fee</span>
                                                        <span className="text-[9px] bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded font-bold">10%</span>
                                                    </div>
                                                    <span className="text-gray-400 font-bold">− ₦{commission.toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <div className="sm:pl-8 sm:border-l border-gray-100 flex flex-col justify-center">
                                                <span className="font-bold text-gray-900 uppercase tracking-wider text-[10px]">Estimated Payout</span>
                                                <div className="flex items-baseline gap-1 mt-1">
                                                    <span className="font-black text-[#10B981] text-3xl tracking-tight">₦{takeHome.toLocaleString()}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase">Net</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
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
