import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import TopNavbar from '../../components/layout/TopNavbar';

const DEBT_LIMIT = 5000;
const rejectionReasons = ['Price is too low', 'Schedule conflict', 'Location is too far', 'Service not offered', 'Other'];

/* ── Naira SVG icon ─────────────────────────────────────── */
const NairaSVG = ({ className = 'w-4 h-4' }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M6 4v16M18 4v16" />
        <path d="M6 4l12 16" />
        <line x1="4" y1="9" x2="20" y2="9" />
        <line x1="4" y1="15" x2="20" y2="15" />
    </svg>
);

/* ─── Negotiate panel ─────────────────────────────────── */
function NegotiatePanel({ request, onClose, onFinalized }) {
    const messagesEndRef = useRef(null);
    const priceInputRef = useRef(null);

    const [phase, setPhase] = useState('open_price');
    const [startPrice, setStartPrice] = useState('');

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [showCounterInput, setShowCounterInput] = useState(false);
    const [counterPrice, setCounterPrice] = useState('');

    const [showFinalizeInput, setShowFinalizeInput] = useState(false);
    const [finalizePrice, setFinalizePrice] = useState('');
    const [finalized, setFinalized] = useState(false);
    const [rejected, setRejected] = useState(false);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
    useEffect(() => { if (phase === 'open_price') priceInputRef.current?.focus(); }, [phase]);

    const fmt = (d) => format(new Date(d), 'h:mm a');
    const addMsg = (msg) => setMessages(prev => [...prev, { id: Date.now() + Math.random(), time: new Date(), ...msg }]);

    const handleOpenPrice = () => {
        const p = Number(startPrice);
        if (!p || p <= 0) return;
        setPhase('chat');
        addMsg({ from: 'provider', text: `I can complete this job for ₦${p.toLocaleString()}.`, isPriceProposal: true, price: p });
        setTimeout(() => {
            const counter = Math.floor(p * 0.87);
            addMsg({ from: 'customer', text: `That's a bit above my budget. How about ₦${counter.toLocaleString()}?`, isPriceProposal: true, price: counter });
        }, 1600);
    };

    const send = () => {
        if (!input.trim()) return;
        addMsg({ from: 'provider', text: input });
        setInput('');
        setTimeout(() => addMsg({ from: 'customer', text: 'Understood, I appreciate the update.' }), 1200);
    };

    const sendCounter = () => {
        const p = Number(counterPrice);
        if (!p) return;
        addMsg({ from: 'provider', text: `My best price is ₦${p.toLocaleString()}.`, isPriceProposal: true, price: p });
        setShowCounterInput(false); setCounterPrice('');
        setTimeout(() => addMsg({ from: 'customer', text: `Alright, ₦${p.toLocaleString()} works for me. Let's do it!` }), 1400);
    };

    const acceptCustomerPrice = (price) => {
        addMsg({ from: 'system', text: `You accepted ₦${Number(price).toLocaleString()}. Waiting for customer to finalise.` });
    };

    const triggerFinalize = () => { setShowFinalizeInput(true); setShowCounterInput(false); };
    const submitFinalize = () => {
        const p = Number(finalizePrice);
        if (!p) return;
        setShowFinalizeInput(false);
        addMsg({ from: 'system', text: `You sent a finalise request at ₦${p.toLocaleString()}.` });
        setTimeout(() => addMsg({ from: 'customer_confirm', text: `Provider wants to finalise this job at ₦${p.toLocaleString()}. Do you agree?`, finalizePrice: p }), 1000);
    };
    const confirmFinalize = (price) => {
        setFinalized(true);
        addMsg({ from: 'system', text: `✓ Job finalised at ₦${Number(price).toLocaleString()}. Awaiting customer payment.` });
        onFinalized?.(price);
        toast.success(`Job finalised at ₦${Number(price).toLocaleString()}`);
    };
    const declineFinalize = () => addMsg({ from: 'system', text: 'Customer declined. Negotiation continues.' });
    const handleReject = () => { setRejected(true); addMsg({ from: 'system', text: 'You rejected this offer. The customer has been notified.' }); };

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 z-40 sm:hidden" onClick={onClose} />

            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 flex flex-col">

                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 shrink-0">
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                        <span className="material-icons text-gray-500 text-xl">arrow_back</span>
                    </button>
                    <div className="w-9 h-9 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {(request.customerName || 'C')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm leading-tight truncate">{request.customerName || 'Customer'}</p>
                        <p className={`text-xs font-semibold ${finalized ? 'text-[#10B981]' : rejected ? 'text-red-500' : 'text-[#10B981]'}`}>
                            {finalized ? 'Finalised ✓' : rejected ? 'Rejected' : 'Negotiating'}
                        </p>
                    </div>
                </div>

                {/* Opening price prompt */}
                {phase === 'open_price' ? (
                    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6">
                        <NairaSVG className="w-8 h-8 text-gray-300" />
                        <div>
                            <h3 className="text-base font-bold text-gray-900 mb-1">Set your opening price</h3>
                            <p className="text-sm text-gray-400">This will be sent to the customer as your first proposal.</p>
                        </div>
                        <div className="w-full">
                            <div className="relative mb-3">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 flex items-center">
                                    <NairaSVG className="w-4 h-4" />
                                </span>
                                <input ref={priceInputRef} type="number" value={startPrice}
                                    onChange={e => setStartPrice(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleOpenPrice()}
                                    placeholder="0"
                                    className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl text-base font-bold focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all text-center tracking-wide" />
                            </div>
                            <button onClick={handleOpenPrice} disabled={!startPrice || Number(startPrice) <= 0}
                                className="w-full py-3 bg-[#0F172A] hover:bg-slate-700 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-30">
                                Send Proposal
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.from === 'provider' ? 'justify-end' : msg.from === 'system' ? 'justify-center' : 'justify-start'}`}>
                                    {msg.from === 'system' ? (
                                        <span className="bg-gray-100 text-gray-500 text-[11px] font-semibold px-4 py-2 rounded-full max-w-[88%] text-center leading-relaxed">
                                            {msg.text}
                                        </span>
                                    ) : msg.from === 'customer_confirm' ? (
                                        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3.5 max-w-[85%]">
                                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-1.5">Finalise Request</p>
                                            <p className="text-sm text-gray-800 mb-3">{msg.text}</p>
                                            {!finalized && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => confirmFinalize(msg.finalizePrice)}
                                                        className="flex-1 bg-[#10B981] text-white text-xs font-bold py-2 rounded-xl hover:bg-[#059669] transition-colors">
                                                        Yes, Confirm
                                                    </button>
                                                    <button onClick={declineFinalize}
                                                        className="flex-1 bg-white text-gray-600 border border-gray-200 text-xs font-bold py-2 rounded-xl hover:bg-gray-50 transition-colors">
                                                        No, Continue
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className={`max-w-[78%] flex flex-col gap-1 ${msg.from === 'provider' ? 'items-end' : 'items-start'}`}>
                                            {msg.isPriceProposal ? (
                                                <div className={`rounded-2xl px-4 py-3.5 w-full ${msg.from === 'provider' ? 'bg-[#0F172A] text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                                                    <p className="text-[9px] font-bold uppercase tracking-wider opacity-50 mb-1">Price Proposal</p>
                                                    <p className="text-xl font-black mb-0.5">₦{Number(msg.price).toLocaleString()}</p>
                                                    <p className="text-xs opacity-60">{msg.text}</p>
                                                    {msg.from === 'customer' && !finalized && !rejected && (
                                                        <div className="flex gap-2 mt-3">
                                                            <button onClick={() => acceptCustomerPrice(msg.price)}
                                                                className="flex-1 bg-[#10B981] text-white text-xs font-bold py-2 rounded-xl hover:bg-[#059669] transition-colors">
                                                                Accept
                                                            </button>
                                                            <button onClick={() => { setShowCounterInput(true); setShowFinalizeInput(false); }}
                                                                className="flex-1 bg-white text-gray-700 border border-gray-200 text-xs font-bold py-2 rounded-xl hover:bg-gray-50 transition-colors">
                                                                Counter
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.from === 'provider' ? 'bg-[#0F172A] text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                                                    {msg.text}
                                                </div>
                                            )}
                                            <span className="text-[10px] text-gray-400 px-1">{fmt(msg.time)}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Counter/finalise price slide-up */}
                        <AnimatePresence>
                            {(showCounterInput || showFinalizeInput) && (
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                                    className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-2 shrink-0">
                                    <span className="text-gray-400 shrink-0"><NairaSVG className="w-4 h-4" /></span>
                                    <input type="number" autoFocus
                                        value={showFinalizeInput ? finalizePrice : counterPrice}
                                        onChange={e => showFinalizeInput ? setFinalizePrice(e.target.value) : setCounterPrice(e.target.value)}
                                        placeholder={showFinalizeInput ? 'Finalise at…' : 'Your counter offer'}
                                        className="flex-1 pl-1 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] bg-white" />
                                    <button onClick={showFinalizeInput ? submitFinalize : sendCounter}
                                        className="h-10 px-4 bg-[#0F172A] text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors">
                                        Send
                                    </button>
                                    <button onClick={() => { setShowCounterInput(false); setShowFinalizeInput(false); }}
                                        className="h-10 w-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-100 transition-colors">
                                        <span className="material-icons text-lg">close</span>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Glassmorphic Finalise / Reject bar */}
                        {!finalized && !rejected && (
                            <div className="flex shrink-0 border-t border-gray-100 overflow-hidden">
                                <button onClick={triggerFinalize}
                                    className="flex-1 py-3 text-sm font-bold text-emerald-600 bg-emerald-500/[0.07] backdrop-blur-sm hover:bg-emerald-500/[0.14] transition-colors">
                                    Finalise
                                </button>
                                <div className="w-px bg-gray-200 shrink-0" />
                                <button onClick={handleReject}
                                    className="flex-1 py-3 text-sm font-bold text-red-500 bg-red-500/[0.07] backdrop-blur-sm hover:bg-red-500/[0.14] transition-colors">
                                    Reject
                                </button>
                            </div>
                        )}

                        {/* Message input */}
                        <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2 bg-white shrink-0">
                            <input type="text" value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                                placeholder="Message…" disabled={finalized || rejected}
                                className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none text-gray-800 placeholder-gray-400 disabled:opacity-40" />
                            <button onClick={send} disabled={!input.trim() || finalized || rejected}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#0F172A] disabled:opacity-30 text-white hover:bg-slate-700 transition-colors shrink-0">
                                <span className="material-icons text-[18px]">send</span>
                            </button>
                        </div>
                    </>
                )}
            </motion.div>
        </>
    );
}

/* ─── Main page ─────────────────────────────────────────── */
const RequestDetails = () => {
    const { id } = useParams();
    const { currentUser } = useAuth();
    const { jobs, acceptJob, isSimulated } = useData();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [loading, setLoading] = useState(true);
    const [request, setRequest] = useState(null);
    const [accepted, setAccepted] = useState(false);
    const [negotiating, setNegotiating] = useState(false);
    const [finalizedPrice, setFinalizedPrice] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [lightboxImg, setLightboxImg] = useState(null);

    // Auto-open chat if navigated here with openChat flag (e.g. from JobDetails)
    useEffect(() => {
        if (location.state?.openChat) {
            setAccepted(true);
            setNegotiating(true);
        }
    }, [location.state]);

    useEffect(() => {
        if (!id) return;
        const found = jobs.find(j => j.id === id);
        if (found) { setRequest(found); setLoading(false); return; }
        setTimeout(() => {
            const retry = jobs.find(j => j.id === id);
            setRequest(retry || {
                id, title: 'Fix Kitchen Sink Leak', category: 'Plumbing',
                status: 'Open', description: 'The pipe under the kitchen sink is leaking heavily. Water is pooling under the cabinet and needs urgent attention.',
                location: 'Lekki Phase 1, Lagos', customerName: 'Adaeze Okafor',
                budget_estimate: 12000, urgency: 'high', createdAt: new Date(),
                images: [],
            });
            setLoading(false);
        }, 600);
    }, [id, jobs]);

    const isRestricted = (currentUser?.commissionBalance || 0) > DEBT_LIMIT;

    const handleAccept = async () => {
        if (isRestricted) { toast.error(`Clear your ₦${DEBT_LIMIT.toLocaleString()} commission balance first.`); return; }
        try {
            if (!isSimulated) await acceptJob(id);
            setAccepted(true);
            toast.success('Job accepted! Open the chat to negotiate.');
        } catch { toast.error('Failed to accept job'); }
    };

    const handleDecline = async () => {
        if (!rejectReason) { toast.error('Please select a reason'); return; }
        if (rejectReason === 'Other' && !customReason) { toast.error('Please add a note'); return; }
        if (isSimulated) await new Promise(r => setTimeout(r, 600));
        toast.success('Request declined');
            setShowRejectModal(false);
        navigate('/provider/requests');
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
        open: 'bg-blue-50 text-blue-600 border-blue-100',
        pending: 'bg-amber-50 text-amber-600 border-amber-100',
        in_progress: 'bg-purple-50 text-purple-600 border-purple-100',
        completed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    };

    const images = Array.isArray(request.images) ? request.images.filter(Boolean) : [];

    const detailPairs = [
        [
            { icon: 'handyman', label: 'Category', value: request.category || 'General Service' },
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
        <div className="flex h-screen bg-white font-sans">
            <ProviderSidebar />

            {/* Decline modal */}
            <AnimatePresence>
            {showRejectModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                        className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-6"
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

                <div className="flex-1 overflow-y-auto bg-white">
                    <div className="max-w-[800px] mx-auto w-full px-4 sm:px-8 py-6 sm:py-10 pb-24 md:pb-10">

                        {/* ── Header ── */}
                        <div className="mb-10 pb-8 border-b border-gray-100">
                            {/* Category · date · location */}
                            <div className="flex items-center gap-2 mb-3">
                                {request.category && <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{request.category}</span>}
                                <span className="text-gray-200">·</span>
                                <span className="text-xs text-gray-400">{dateStr}</span>
                                {(request.location || request.location_name) && (
                                    <>
                                        <span className="text-gray-200">·</span>
                                        <span className="flex items-center gap-0.5 text-xs text-gray-400">
                                            <span className="material-icons-outlined text-sm leading-none">location_on</span>
                                            {request.location || request.location_name}
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
                                <p className="text-sm text-gray-500 leading-relaxed max-w-xl">{request.description}</p>
                            )}

                            {/* Open negotiation if accepted */}
                            {accepted && !finalizedPrice && (
                                <div className="mt-5">
                                    <button onClick={() => setNegotiating(true)}
                                        className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-sm px-5 py-2 rounded-xl transition-all shadow-sm shadow-green-500/20">
                                        <span className="material-icons text-base">chat</span>
                                        Open Negotiation Chat
                                    </button>
                                </div>
                            )}
                            {finalizedPrice && (
                                <p className="mt-4 text-sm font-bold text-[#10B981]">
                                    ₦{Number(finalizedPrice).toLocaleString()} agreed — awaiting customer payment
                                </p>
                            )}
                                    </div>

                        {/* ── Images ── */}
                        {images.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-[15px] font-bold text-gray-900 mb-3">Photos</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                    {images.map((src, i) => (
                                        <button key={i} onClick={() => setLightboxImg(src)}
                                            className="aspect-video rounded-xl overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity">
                                            <img src={src} alt={`Attachment ${i + 1}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Job Details — 2 per row ── */}
                        <div className="mb-8">
                            <h2 className="text-[15px] font-bold text-gray-900 mb-0.5">Job Details</h2>
                            <p className="text-xs text-gray-400 mb-5">Review all information before accepting</p>

                            <div className="space-y-0">
                                {detailPairs.map((pair, rowIdx) => {
                                    const [left, right] = pair.length === 2 ? pair : [pair[0], null];
                                    return (
                                        <div key={rowIdx} className={`grid grid-cols-2 gap-x-6 ${rowIdx !== 0 ? 'border-t border-gray-100' : ''}`}>
                                            {[left, right].map((item, colIdx) => item ? (
                                                <div key={item.label} className={`flex items-center gap-3 py-4 ${colIdx === 0 && right ? 'border-r border-gray-100 pr-6' : ''}`}>
                                                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                                                        <span className="material-icons-outlined text-gray-400 text-base">{item.icon}</span>
                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{item.label}</p>
                                                        <p className="text-sm font-semibold text-gray-900 truncate">{item.value}</p>
                                            </div>
                                            </div>
                                            ) : <div key={colIdx} className="py-4" />)}
                                        </div>
                                    );
                                })}
                                        </div>
                                    </div>

                        {/* ── Accept / Decline — color-cued, after details ── */}
                        {!accepted && !finalizedPrice && (
                            <div className="flex items-center gap-3 pt-2 pb-4">
                                <button onClick={handleAccept} disabled={isRestricted}
                                    className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] disabled:opacity-40 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-sm shadow-green-500/20">
                                    <span className="material-icons text-base">check_circle</span>
                                    Accept Job
                                        </button>
                                <button onClick={() => setShowRejectModal(true)}
                                    className="inline-flex items-center gap-1.5 border border-red-200 hover:bg-red-50 text-red-500 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors">
                                    <span className="material-icons text-base">cancel</span>
                                    Decline
                                        </button>
                                    </div>
                        )}

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

            <ProviderMobileNavBar />

            <AnimatePresence>
                {negotiating && (
                    <NegotiatePanel
                        request={request}
                        onClose={() => setNegotiating(false)}
                        onFinalized={(price) => { setFinalizedPrice(price); setNegotiating(false); }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default RequestDetails;
