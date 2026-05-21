import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { supabase } from '../../lib/supabase';
import { getCategoryIcon, getCategoryColors } from '../../lib/utils';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import ProviderNegotiationDrawer from '../../components/provider/ProviderNegotiationDrawer';
import TopNavbar from '../../components/layout/TopNavbar';
import { getPriceRange, getFairnessLabel, getSmartPriceLabel } from '../../lib/aiData';

const DEBT_LIMIT = 5000;
const rejectionReasons = ['Price is too low', 'Schedule conflict', 'Location is too far', 'Service not offered', 'Other'];

/* ─── Main page ─────────────────────────────────────────── */
const RequestDetails = () => {
    const { id } = useParams();
    const { currentUser } = useAuth();
    const { jobs, acceptJob, updateJobStatus } = useData();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [loading, setLoading] = useState(true);
    const [request, setRequest] = useState(null);
    const [accepted, setAccepted] = useState(false);
    const [isInvited, setIsInvited] = useState(false);
    const [accepting, setAccepting] = useState(false);
    const [showNegotiation, setShowNegotiation] = useState(false);
    const [negotiating, setNegotiating] = useState(false);
    const [finalizedPrice, setFinalizedPrice] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [lightboxImg, setLightboxImg] = useState(null);
    const [showAllDetails, setShowAllDetails] = useState(false);

    // Handle negotiation chat opening
    useEffect(() => {
        if (location.state?.openChat) {
            setShowNegotiation(true);
        }
    }, [location.state]);

    // Polling / Real-time status check
    useEffect(() => {
        if (!id || !currentUser?.id) return;

        const fetchRequestStatus = async () => {
            try {
                const { supabase } = await import('../../lib/supabase');
                
                // 1. Fetch Job Details
                const { data: jobData, error: jobError } = await supabase
                    .from('jobs')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (jobData) {
                    setRequest(jobData);
                }

                // 2. Fetch Application Status (The true "Accepted" state for providers)
                const { data: appData, error: appError } = await supabase
                    .from('job_applications')
                    .select('status')
                    .eq('job_id', id)
                    .eq('provider_id', currentUser.id)
                    .maybeSingle();

                if (appData) {
                    const isAccepted = ['accepted', 'negotiating', 'finalized'].includes(appData.status);
                    if (isAccepted) {
                        setAccepted(true);
                    }
                    if (appData.status === 'invited') {
                        setIsInvited(true);
                    }
                }

                setLoading(false);
            } catch (err) {
                console.error('Error fetching request status:', err);
            }
        };

        fetchRequestStatus();
        
        // Poll every 4 seconds to keep UI in sync
        const interval = setInterval(fetchRequestStatus, 4000);
        return () => clearInterval(interval);
    }, [id, currentUser?.id]);

    const isRestricted = (currentUser?.commissionBalance || 0) > DEBT_LIMIT;

    const handleAccept = async () => {
        if (isRestricted) { 
            toast.error(`Clear your ₦${DEBT_LIMIT.toLocaleString()} commission balance first.`); 
            return; 
        }
        
        setAccepting(true);
        try {
            await acceptJob(id);
            toast.success('Request accepted! You can now start negotiating with the customer.');
            setAccepted(true);
        } catch (error) { 
            console.error('Accept job error:', error);
            toast.error(error?.message || 'Failed to accept job. Please try again.');
            setAccepted(false);
        } finally {
            setAccepting(false);
        }
    };

    const handleDecline = async () => {
        if (!rejectReason) { toast.error('Please select a reason'); return; }
        if (rejectReason === 'Other' && !customReason) { toast.error('Please add a note'); return; }
        try {
            await updateJobStatus(id, 'cancelled');
            setShowRejectModal(false);
            navigate('/provider/requests');
        } catch { toast.error('Failed to decline request'); }
    };
    
    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#10B981]" />
        </div>
    );
    
    if (!request) return (
        <div className="min-h-screen bg-white flex items-center justify-center flex-col gap-3">
            <p className="text-gray-500 text-sm font-medium">Request not found</p>
            <Link to="/provider/requests" className="text-[#10B981] font-bold hover:underline text-sm">← Back</Link>
        </div>
    );

    const dateStr = request.createdAt instanceof Date
        ? format(request.createdAt, 'MMM d, yyyy')
        : request.created_at
            ? new Date(request.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'Recently';

    const normalizedStatus = String(request.status || 'open').toLowerCase();
    const statusColors = { 
        open: 'bg-gray-50 text-gray-500 border-gray-200', 
        pending: 'bg-gray-50 text-gray-500 border-gray-200',
        interested: 'bg-amber-50 text-amber-700 border-amber-200', 
        negotiating: 'bg-purple-50 text-purple-700 border-purple-200', 
        awaiting_payment: 'bg-orange-50 text-orange-700 border-orange-200', 
        payment_secured: 'bg-green-50 text-green-700 border-green-200', 
        in_progress: 'bg-blue-50 text-blue-700 border-blue-200', 
        payment_released: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
        completed: 'bg-amber-50 text-amber-800 border-amber-200', 
        cancelled: 'bg-red-50 text-red-700 border-red-200', 
        rejected: 'bg-red-50 text-red-700 border-red-200' 
    };

    const images = Array.isArray(request.images) ? request.images.filter(Boolean) : [];

    const detailPairs = [
        [
            { icon: 'handyman', label: 'Category', value: request.category || 'None' },
            { icon: 'location_on', label: 'Location', value: request.location || request.location_name || 'Not specified' },
        ],
        [
            { icon: 'person', label: 'Customer', value: request.customerName || 'Anonymous' },
            { icon: 'schedule', label: 'Posted', value: dateStr },
        ],
        ...(request.scheduledDate || request.urgency ? [[
            request.scheduledDate
                ? { icon: 'event', label: 'Scheduled For', value: new Date(request.scheduledDate + 'T00:00:00').toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'long' }) }
                : null,
            request.urgency
                ? { icon: 'priority_high', label: 'Urgency', value: request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1) }
                : null,
        ].filter(Boolean)] : []),
    ];

    return (
        <div className="flex min-h-screen bg-white font-sans">
            <ProviderSidebar />

            {/* Decline modal */}
            <AnimatePresence>
            {showRejectModal && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowRejectModal(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
                            className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl z-10">
                            <div className="flex items-start justify-between mb-5">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">Decline Request</h3>
                                    <p className="text-sm text-gray-400 mt-0.5">Help the customer understand why.</p>
                                </div>
                                <button onClick={() => setShowRejectModal(false)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                                    <span className="material-icons-outlined text-lg">close</span>
                                </button>
                            </div>
                            <div className="space-y-2 mb-6">
                                {rejectionReasons.map(r => (
                                    <label key={r} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${rejectReason === r ? 'border-[#10B981] bg-[#10B981]/5' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                                        <input type="radio" name="rejectReason" value={r} checked={rejectReason === r} onChange={e => setRejectReason(e.target.value)} className="accent-[#10B981] w-4 h-4 shrink-0" />
                                        <span className="text-sm font-semibold text-gray-800">{r}</span>
                                </label>
                            ))}
                            {rejectReason === 'Other' && (
                                    <textarea className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] outline-none text-sm resize-none"
                                        placeholder="Please specify…" rows="3" value={customReason} onChange={e => setCustomReason(e.target.value)} />
                            )}
                        </div>
                            <div className="flex gap-3">
                                <button onClick={() => setShowRejectModal(false)} className="flex-1 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                                <button onClick={handleDecline} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-colors">Decline Job</button>
                        </div>
                    </motion.div>
                </div>
            )}
            </AnimatePresence>

            {/* Image lightbox */}
            <AnimatePresence>
                {lightboxImg && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[160] bg-black/80 flex items-center justify-center p-6"
                        onClick={() => setLightboxImg(null)}>
                        <img src={lightboxImg} alt="" className="max-w-full max-h-full rounded-xl object-contain shadow-2xl" onClick={e => e.stopPropagation()} />
                        <button onClick={() => setLightboxImg(null)} className="absolute top-5 right-5 w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors">
                            <span className="material-icons text-xl">close</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="flex-1 overflow-hidden flex flex-col min-w-0">
                <TopNavbar breadcrumbs={['Job Requests', 'Details']} />

                <div className="flex-1 overflow-y-auto pb-24 md:pb-0 bg-white">
                    <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">
                        {/* Invited Banner */}
                        {isInvited && !accepted && (
                            <div className="mb-6 bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-start gap-3">
                                <div className="bg-emerald-100 text-emerald-600 w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                                    <span className="material-icons-outlined">star</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-emerald-900 text-sm">You were specifically invited to this job!</h3>
                                    <p className="text-emerald-700 text-xs mt-0.5">The customer thinks you're a great fit. Accept the job below to start negotiating.</p>
                                </div>
                            </div>
                        )}

                        {/* ── Header ── */}
                        <div className="mb-10 pb-8 border-b border-gray-100">
                            {/* Category + date + location row — wraps as single unit */}
                            <div className="flex flex-wrap items-center gap-1.5 mb-3">
                                {request.category && <span className="text-gray-700 text-[13px] font-bold capitalize whitespace-nowrap">{request.category.toLowerCase()}</span>}
                                {(request.category || dateStr || request.location || request.location_name) && <span className="text-gray-200">·</span>}
                                <span className="text-xs text-gray-400 whitespace-nowrap">{dateStr}</span>
                                {(request.location || request.location_name) && (
                                    <>
                                        <span className="text-gray-200 hidden sm:inline">·</span>
                                        <span className="flex items-center gap-0.5 text-xs text-gray-400 w-full sm:w-auto sm:flex-wrap">
                                            <span className="material-icons-outlined text-sm leading-none">location_on</span>
                                            <span className="truncate">{request.location || request.location_name}</span>
                                        </span>
                                    </>
                                )}
                            </div>
                                    
                            {/* Title + status badge inline */}
                            <div className="flex items-start gap-3 flex-wrap mb-4">
                                <h1 className="text-2xl sm:text-[30px] font-black tracking-tight text-gray-900 leading-tight">
                                    {request.title || 'Service Request'}
                                </h1>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-semibold text-[11px] mt-1 shrink-0 ${
                                    finalizedPrice ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                    : accepted ? 'bg-slate-100 text-slate-600 border-slate-200'
                                    : statusColors[normalizedStatus] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 shrink-0" />
                                    {finalizedPrice ? 'Finalised' : accepted ? 'Accepted' : (request.status || 'Open')}
                                        </span>
                                {(request.urgency === 'high' || request.urgency === 'High') && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-semibold text-[11px] mt-1 bg-red-50 text-red-500 border-red-100 shrink-0">
                                        <span className="material-icons text-sm leading-none">priority_high</span>
                                        Urgent
                                        </span>
                                )}
                                    </div>

                            {/* Description */}
                            {request.description && (
                                <p className="text-[15px] text-gray-500 leading-relaxed max-w-2xl mt-4">{request.description}</p>
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
                                                                <button key={i} onClick={() => setLightboxImg(src)}
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
                                                        <h4 className="text-[15px] font-black text-gray-900">Job Parameters</h4>
                                                    </div>
                                                    
                                                    <div className="divide-y divide-gray-100 border-y border-gray-100 rounded-xl overflow-hidden border-x">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                                                            <div className="p-5 flex items-center gap-4">
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${getCategoryColors(request.category).bg} ${getCategoryColors(request.category).color} ${getCategoryColors(request.category).border}`}>
                                                                    <span className="material-icons-outlined text-lg">{getCategoryIcon(request.category)}</span>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</p>
                                                                    <p className="text-sm font-bold text-gray-900">{request.category || 'None'}</p>
                                                                </div>
                                                            </div>
                                                            <div className="p-5 flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                                                    <span className="material-icons-outlined text-lg">location_on</span>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location</p>
                                                                    <p className="text-sm font-bold text-gray-900">{request.location || 'Not specified'}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                                                            <div className="p-5 flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                                                    <span className="material-icons-outlined text-lg">person</span>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</p>
                                                                    <p className="text-sm font-bold text-gray-900">{request.customerName || 'Anonymous'}</p>
                                                                </div>
                                                            </div>
                                                            <div className="p-5 flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                                                    <span className="material-icons-outlined text-lg">schedule</span>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Posted</p>
                                                                    <p className="text-sm font-bold text-gray-900">{dateStr}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {(request.scheduledDate || request.urgency) && (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                                                                {request.scheduledDate ? (
                                                                    <div className="p-5 flex items-center gap-4">
                                                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                                                            <span className="material-icons-outlined text-lg">event</span>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Scheduled</p>
                                                                            <p className="text-sm font-bold text-gray-900">{new Date(request.scheduledDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</p>
                                                                        </div>
                                                                    </div>
                                                                ) : <div className="p-5" />}
                                                                {request.urgency ? (
                                                                    <div className="p-5 flex items-center gap-4">
                                                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                                                            <span className="material-icons-outlined text-lg text-red-400">priority_high</span>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Urgency</p>
                                                                            <p className="text-sm font-bold text-gray-900 capitalize">{request.urgency}</p>
                                                                        </div>
                                                                    </div>
                                                                ) : <div className="p-5" />}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* ── Accept / Decline / Negotiate Actions ── */}
                        <div className="flex items-center gap-3 pt-2 pb-4">
                            {!accepted && !finalizedPrice ? (
                                <>
                                    <button onClick={handleAccept} disabled={isRestricted || accepting}
                                        className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] disabled:opacity-40 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-sm shadow-green-500/20">
                                        {accepting ? (
                                            <>
                                                <span className="material-icons text-base animate-spin">hourglass_top</span>
                                                Accepting...
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-icons text-base">check_circle</span>
                                                Accept Job
                                            </>
                                        )}
                                    </button>
                                    <button onClick={() => setShowRejectModal(true)} disabled={accepting}
                                        className="inline-flex items-center gap-1.5 border border-red-200 hover:bg-red-50 text-red-500 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors disabled:opacity-40">
                                        <span className="material-icons text-base">cancel</span>
                                        Decline
                                    </button>
                                </>
                            ) : !finalizedPrice ? (
                                <button onClick={() => setShowNegotiation(true)}
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-sm px-8 py-3 rounded-xl transition-all shadow-sm shadow-green-500/20">
                                    <span className="material-icons text-base">chat</span>
                                    Open Negotiation Chat
                                </button>
                            ) : null}
                        </div>

                        {isRestricted && (
                            <div className="mt-4 rounded-2xl bg-red-50 border border-red-100 px-5 py-4 flex items-start gap-3">
                                <span className="material-icons text-red-500 text-xl shrink-0 mt-0.5">warning</span>
                                <div>
                                    <p className="text-sm font-bold text-red-700">Account Restricted</p>
                                    <p className="text-xs text-red-500 mt-0.5">Clear your ₦{DEBT_LIMIT.toLocaleString()} outstanding commission to accept new jobs.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <AnimatePresence>
                {showNegotiation && (
                    <ProviderNegotiationDrawer
                        job={request}
                        onClose={() => setShowNegotiation(false)}
                    />
                )}
            </AnimatePresence>

            <ProviderMobileNavBar />

        </div>
    );
};

export default RequestDetails;
