import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/layout/Sidebar';
import TopNavbar from '../../components/layout/TopNavbar';
import MobileNavBar from '../../components/layout/MobileNavBar';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

import { getPriceRange, getFairnessLabel, getSmartPriceLabel } from '../../lib/aiData';

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

/* ─── Negotiate slide-over panel ───────────────────────── */
function NegotiatePanel({ provider, requestId, category, onClose, onFinalized }) {
    const { messages: allMessages, fetchMessages, sendMessage, finalizeAgreement } = useData();
    const { currentUser } = useAuth();
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const [input, setInput] = useState('');
    const [showPriceInput, setShowPriceInput] = useState(false);
    const [priceOffer, setPriceOffer] = useState('');
    const [agreed, setAgreed] = useState(false);

    /* Finalise / Reject */
    const [showFinalizeInput, setShowFinalizeInput] = useState(false);
    const [finalizePrice, setFinalizePrice] = useState('');
    const [finalized, setFinalized] = useState(false);
    const [rejected, setRejected] = useState(false);

    // Filter messages for this specific job
    const messages = allMessages.filter(m => m.job_id === requestId);

    useEffect(() => {
        if (requestId) fetchMessages(requestId);
    }, [requestId, fetchMessages]);

    useEffect(() => {
        if (!requestId) return undefined;

        const intervalId = window.setInterval(() => {
            fetchMessages(requestId);
        }, 5000);

        return () => window.clearInterval(intervalId);
    }, [requestId, fetchMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const fmt = (d) => {
        try {
            return format(new Date(d), 'h:mm a');
        } catch (e) {
            return 'Just now';
        }
    };

    const send = async (text, extra = {}) => {
        if (!text.trim()) return;
        await sendMessage(requestId, text, extra.isPriceProposal ? 'price_proposal' : 'text', extra);
        setInput('');
    };

    const sendPrice = () => {
        if (!priceOffer) return;
        send(`I'd like to propose ₦${Number(priceOffer).toLocaleString()} for this job.`, { isPriceProposal: true, price: Number(priceOffer) });
        setShowPriceInput(false); setPriceOffer('');
    };

    const handleAccept = async (price) => {
        setAgreed(true);
        await finalizeAgreement(requestId, price);
        await sendMessage(requestId, `✓ Price agreed at ₦${Number(price).toLocaleString()}. Proceed to payment.`, 'system');
        toast.success(`Deal agreed at ₦${Number(price).toLocaleString()} — proceed to payment.`);
    };

    /* Finalise flow */
    const triggerFinalize = () => { setShowFinalizeInput(true); setShowPriceInput(false); };
    const submitFinalize = async () => {
        const p = Number(finalizePrice);
        if (!p) return;
        setShowFinalizeInput(false);
        await sendMessage(requestId, `Customer sent a finalise request at ₦${p.toLocaleString()}.`, 'system', { finalizePrice: p });
    };
    
    const confirmFinalize = async (price) => {
        setFinalized(true);
        await finalizeAgreement(requestId, price);
        await sendMessage(requestId, `✓ Job finalised at ₦${Number(price).toLocaleString()}. Tap "Proceed to Payment" to secure the booking.`, 'system');
        toast.success(`Deal agreed at ₦${Number(price).toLocaleString()}`);
        setTimeout(() => onFinalized?.(price), 1200);
    };

    const declineFinalize = () => {
        sendMessage(requestId, 'Customer declined the finalise request. Negotiation continues.', 'system');
    };

    const handleReject = () => {
        setRejected(true);
        sendMessage(requestId, 'Customer rejected the offer.', 'system');
    };

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 z-[140] sm:hidden" onClick={onClose} />

            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-[150] flex flex-col">

                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 shrink-0">
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                        <span className="material-icons text-gray-500 text-xl">arrow_back</span>
                    </button>
                    <Link to={`/customer/provider/${provider.id}`} className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center shrink-0 hover:ring-2 hover:ring-[#10B981]/40 transition-all">
                        {provider.avatar_url ? <img src={provider.avatar_url} alt={provider.full_name} className="w-full h-full object-cover" /> : <span className="material-icons text-gray-400 text-xl">person</span>}
                    </Link>
                    <div className="flex-1 min-w-0">
                        <Link to={`/customer/provider/${provider.id}`} className="font-bold text-gray-900 text-sm leading-tight truncate hover:text-[#10B981] transition-colors block">
                            {provider.full_name || provider.displayName}
                        </Link>
                        <p className={`text-xs font-semibold ${finalized ? 'text-[#10B981]' : rejected ? 'text-red-500' : 'text-[#10B981]'}`}>
                            {finalized ? 'Finalised ✓' : rejected ? 'Rejected' : 'Online · Negotiating'}
                        </p>
                    </div>
                    <a href={`tel:${provider.phone_number}`} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                        <span className="material-icons text-gray-500 text-xl">call</span>
                    </a>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
                    {messages.map(msg => {
                        const isMe = msg.sender_id === currentUser.id;
                        const isSystem = msg.type === 'system';
                        const isProposal = msg.type === 'price_proposal' || msg.metadata?.isPriceProposal;
                        const isFinalizeRequest = msg.type === 'finalize_request' || msg.metadata?.finalizePrice;

                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : isSystem ? 'justify-center' : 'justify-start'}`}>
                                {isSystem ? (
                                    <span className="bg-gray-100 text-gray-500 text-[11px] font-semibold px-4 py-2 rounded-full max-w-[85%] text-center leading-relaxed">
                                        {msg.message}
                                    </span>
                                ) : !isMe && isFinalizeRequest ? (
                                    <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3.5 max-w-[85%]">
                                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-1.5">Finalise Request</p>
                                        <p className="text-sm text-gray-800 mb-3">{msg.message}</p>
                                        {!finalized && (
                                            <div className="flex gap-2">
                                                <button onClick={() => confirmFinalize(msg.metadata?.finalizePrice || msg.message.match(/\d+/)[0])}
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
                                    <div className={`max-w-[78%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                                        {isProposal ? (
                                            <div className={`rounded-2xl px-4 py-3.5 w-full ${isMe ? 'bg-[#0F172A] text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                                                <p className="text-[9px] font-bold uppercase tracking-wider opacity-50 mb-1">Price Proposal</p>
                                                <p className="text-xl font-black mb-0.5">₦{Number(msg.metadata?.price || msg.metadata?.proposed_price).toLocaleString()}</p>
                                                <p className="text-xs opacity-60">{msg.message}</p>
                                                {/* Fairness score badge */}
                                                {(msg.metadata?.price || msg.metadata?.proposed_price) && category && (() => {
                                                    const fair = getFairnessLabel(msg.metadata?.price || msg.metadata?.proposed_price, category);
                                                    if (!fair) return null;
                                                    return (
                                                        <span className={`mt-2 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                            isMe ? 'bg-white/15 text-white' : `${fair.bg} ${fair.color}`
                                                        }`}>
                                                            {fair.icon} {fair.label}
                                                        </span>
                                                    );
                                                })()}
                                                {!isMe && !agreed && !finalized && !rejected && (
                                                    <div className="flex gap-2 mt-3">
                                                        <button onClick={() => handleAccept(msg.metadata?.price || msg.metadata?.proposed_price)}
                                                            className="flex-1 bg-[#10B981] text-white text-xs font-bold py-2 rounded-xl hover:bg-[#059669] transition-colors">
                                                            Accept
                                                        </button>
                                                        <button onClick={() => setShowPriceInput(true)}
                                                            className="flex-1 bg-white text-gray-700 border border-gray-200 text-xs font-bold py-2 rounded-xl hover:bg-gray-50 transition-colors">
                                                            Counter
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-[#0F172A] text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                                                {msg.message}
                                            </div>
                                        )}
                                        <span className="text-[10px] text-gray-400 px-1">{fmt(msg.created_at)}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Counter / finalise price input */}
                <AnimatePresence>
                    {(showPriceInput || showFinalizeInput) && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                            className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-2 shrink-0">
                            <span className="text-gray-400 shrink-0"><NairaSVG className="w-4 h-4" /></span>
                            <input type="number" autoFocus
                                value={showFinalizeInput ? finalizePrice : priceOffer}
                                onChange={e => showFinalizeInput ? setFinalizePrice(e.target.value) : setPriceOffer(e.target.value)}
                                placeholder={showFinalizeInput ? 'Finalise at…' : 'Your counter offer'}
                                className="flex-1 pl-1 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] bg-white" />
                            <button onClick={showFinalizeInput ? submitFinalize : sendPrice}
                                className="h-10 px-4 bg-[#0F172A] text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors">
                                Send
                            </button>
                            <button onClick={() => { setShowPriceInput(false); setShowFinalizeInput(false); }}
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

                {/* Message input bar */}
                <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2 bg-white shrink-0">
                    <button onClick={() => { setShowPriceInput(v => !v); setShowFinalizeInput(false); }} title="Counter offer"
                        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-[#10B981]">
                        <NairaSVG className="w-[18px] h-[18px]" />
                    </button>
                    <input ref={inputRef} type="text" value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
                        placeholder="Message…" disabled={finalized || rejected}
                        className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none text-gray-800 placeholder-gray-400 disabled:opacity-40" />
                    <button onClick={() => send(input)} disabled={!input.trim() || finalized || rejected}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-[#0F172A] disabled:opacity-30 text-white hover:bg-slate-700 transition-colors">
                        <span className="material-icons text-[18px]">send</span>
                    </button>
                </div>
            </motion.div>
        </>
    );
}

/* ─── Main page ────────────────────────────────────────── */
const RequestStatus = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const { requests, getProviders, releasePayment } = useData();
    const [request, setRequest] = useState(null);
    const [interestedProviders, setInterestedProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [negotiatingWith, setNegotiatingWith] = useState(null);
    const [finalizedDeal, setFinalizedDeal] = useState(null); // { price, provider }

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('negotiate') === 'true' && interestedProviders.length > 0 && !negotiatingWith) {
            setNegotiatingWith(interestedProviders[0]);
        }
    }, [location.search, interestedProviders, negotiatingWith]);

    useEffect(() => {
        if (!id) return;
        if (requests.length === 0) { setLoading(true); return; }

        const found = requests.find(r => r.id === id);
        const req = found || null;

        if (!req) {
            setLoading(false);
            return;
        }

        setRequest(req);
            
        getProviders('All').then(allProviders => {
            // If the job already has an assigned worker, find them
            if (req.worker_id) {
                const assigned = allProviders.find(p => p.id === req.worker_id);
                if (assigned) {
                    setInterestedProviders([{
                        ...assigned,
                        proposed_price: req.agreedPrice || req.budget_estimate,
                        message: "I'm working on your request.",
                        verified: assigned.isVerified,
                    }]);
                    return;
                }
            }

            // Otherwise, filter providers that match the job category (potential matches)
            const matches = allProviders.filter(p => 
                p.trade_category?.some(t => t.toLowerCase() === req.category?.toLowerCase())
            );
            
            setInterestedProviders(matches.slice(0, 3).map(p => ({
                ...p,
                proposed_price: req.agreedPrice || req.budget_estimate,
                message: "I'm interested and would like to discuss the details.",
                verified: p.isVerified,
            })));
        }).catch(() => setInterestedProviders([]));

        setLoading(false);
    }, [id, requests, getProviders]);

    if (loading) return (
            <div className="flex min-h-screen items-center justify-center bg-white">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#10B981]" />
            </div>
        );

    if (!request) return (
             <div className="flex min-h-screen items-center justify-center bg-white flex-col gap-4">
                <p className="text-gray-500 font-bold">Request not found.</p>
            <button onClick={() => navigate('/customer/dashboard')} className="text-[#10B981] font-bold hover:underline">
                Back to Dashboard
            </button>
            </div>
        );

    const dateStr = request.createdAt instanceof Date
        ? format(request.createdAt, 'MMM dd, yyyy')
        : 'Just now';

    const normalizedStatus = String(request.status || '').toLowerCase();
    const releaseEnabled = normalizedStatus === 'completed';
    const STATUS_LABEL = { open: 'Open', interested: 'Providers Interested', negotiating: 'Negotiating', awaiting_payment: 'Awaiting Payment', payment_secured: 'Payment Secured', in_progress: 'In Progress', payment_released: 'Payment Released', completed: 'Completed' };
    const STATUS_COLOR = { open: 'bg-blue-50 text-blue-700 border-blue-100', interested: 'bg-amber-50 text-amber-700 border-amber-100', negotiating: 'bg-purple-50 text-purple-700 border-purple-100', awaiting_payment: 'bg-orange-50 text-orange-700 border-orange-100', payment_secured: 'bg-green-50 text-green-700 border-green-100', in_progress: 'bg-blue-50 text-blue-700 border-blue-100', completed: 'bg-emerald-50 text-emerald-700 border-emerald-100' };

    const handleRelease = async () => {
        try {
            await releasePayment(id);
            toast.success('Payment released to provider successfully!');
            setRequest(prev => ({ ...prev, status: 'payment_released' }));
        } catch { toast.error('Failed to release payment.'); }
    };

    return (
        <div className="flex min-h-screen bg-white font-sans text-gray-900">
            <Sidebar />
            
            <main className="flex-1 overflow-hidden flex flex-col min-w-0">
                <TopNavbar breadcrumbs={['Customer', 'My Requests', 'Details']} />

                <div className="flex-1 overflow-y-auto bg-white">
                    <div className="max-w-5xl mx-auto w-full p-4 sm:p-6 md:p-8 pb-24 md:pb-10">

                        {/* Page header */}
                        <div className="mb-10 pb-8 border-b border-gray-100">
                            {/* Category + date + location row */}
                            <div className="flex flex-wrap items-center gap-1.5 mb-3">
                                {request.category && (
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{request.category}</span>
                                )}
                                {(request.category || dateStr || request.location) && <span className="text-gray-200">·</span>}
                                <span className="text-xs text-gray-400 whitespace-nowrap">{dateStr}</span>
                                {request.location && (
                                    <>
                                        <span className="text-gray-200 hidden sm:inline">·</span>
                                        <span className="flex items-center gap-0.5 text-xs text-gray-400 w-full sm:w-auto sm:flex-wrap">
                                            <span className="material-icons-outlined text-sm leading-none">location_on</span>
                                            <span className="truncate">{request.location}</span>
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* Title + status inline */}
                            <div className="flex items-start gap-3 flex-wrap mb-4">
                                <h1 className="text-2xl sm:text-[30px] font-black tracking-tight text-gray-900 leading-tight">
                                        {request.title}
                                    </h1>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-semibold text-[11px] mt-1 shrink-0 ${STATUS_COLOR[normalizedStatus] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 shrink-0" />
                                    {STATUS_LABEL[normalizedStatus] || request.status}
                                </span>
                            </div>

                            {/* CTA row — only after negotiation is finalised */}
                            {(finalizedDeal || releaseEnabled) && (
                                <div className="flex flex-wrap items-center gap-3 mb-1">
                                    {finalizedDeal && (
                                        <button 
                                            onClick={() => navigate(`/customer/payment/${request.id}`, { state: { agreedPrice: finalizedDeal.price, provider: finalizedDeal.provider } })}
                                            className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-sm px-5 py-2 rounded-xl transition-all shadow-sm shadow-green-500/20">
                                            <span className="material-icons text-base">lock</span>
                                            Proceed to Payment · ₦{Number(finalizedDeal.price).toLocaleString()}
                                        </button>
                                    )}
                                    {releaseEnabled && (
                                        <button onClick={handleRelease}
                                            className="inline-flex items-center gap-2 bg-[#0F172A] hover:bg-slate-700 text-white font-bold text-sm px-5 py-2 rounded-xl transition-all">
                                            <span className="material-icons text-base">payments</span>
                                            Release Payment
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Job flow shortcuts */}
                            {(normalizedStatus === 'payment_secured' || normalizedStatus === 'completed') && (
                                <div className="mt-8 py-4 flex flex-wrap items-center gap-3 border-t border-gray-50">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mr-2">Actions</span>
                                    {normalizedStatus === 'payment_secured' && (
                                        <Link
                                            to={`/customer/job-otp/${id}`}
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#10B981] hover:text-[#059669] transition-colors"
                                        >
                                            <span className="material-icons-outlined text-[18px]">vpn_key</span>
                                            Get Job start code
                                        </Link>
                                    )}
                                    {normalizedStatus === 'completed' && (
                                        <Link
                                            to={`/customer/confirm/${id}`}
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F172A] hover:text-slate-600 transition-colors"
                                        >
                                            <span className="material-icons-outlined text-[18px]">task_alt</span>
                                            Confirm completion
                                        </Link>
                                    )}
                                </div>
                            )}

                            {/* 🎉 Provider Accepted — Start Negotiating CTA */}
                            {normalizedStatus === 'provider_accepted' && (
                                <div className="mt-8 py-6 border-y border-emerald-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                            <span className="material-icons text-emerald-500 text-xl">handshake</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">Provider Accepted!</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Start negotiating to agree on a price and secure the booking.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (interestedProviders[0]) setNegotiatingWith(interestedProviders[0]);
                                            else toast.error("Provider details not loaded yet.");
                                        }}
                                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl text-sm transition-all shadow-sm shadow-[#10B981]/20 shrink-0"
                                    >
                                        <span className="material-icons text-base">chat</span>
                                        Start Negotiating
                                    </button>
                                </div>
                            )}

                            {request.description && (
                                <p className="mt-5 text-sm text-gray-500 leading-relaxed max-w-xl">{request.description}</p>
                            )}

                            {/* AI Price Estimator */}
                            {request.category && (() => {
                                const range = getPriceRange(request.category);
                                return (
                                    <div className="mt-6 flex flex-wrap items-center gap-3 text-gray-400">
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-icons-outlined text-[18px]">auto_graph</span>
                                            <span className="text-[11px] font-bold uppercase tracking-widest">Market rate</span>
                                        </div>
                                        <div className="h-4 w-px bg-gray-100" />
                                        <span className="text-sm font-black text-gray-900 tracking-tight">₦{range.min.toLocaleString()} – ₦{range.max.toLocaleString()}</span>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* ── Interested / Recommended Providers ──────────────── */}
                        <div className="mt-2">
                            {interestedProviders.length > 0 ? (
                                <div>
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                                        {request.worker_id ? 'Your Provider' : 'Interested Providers'}
                                    </h3>
                                    <div className="divide-y divide-gray-100">
                                        {interestedProviders.map(p => (
                                            <div key={p.id} className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-2">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-14 h-14 rounded-full bg-gray-50 overflow-hidden shrink-0 border border-gray-100">
                                                        {p.avatar_url ? <img src={p.avatar_url} alt={p.full_name} className="w-full h-full object-cover" /> : <span className="material-icons text-gray-400 text-2xl flex items-center justify-center h-full">person</span>}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-gray-900 text-base">{p.full_name}</p>
                                                            {p.isVerified && <span className="material-icons text-blue-500 text-[16px]">verified</span>}
                                                        </div>
                                                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{p.bio || 'Professional service provider'}</p>
                                                        <div className="flex items-center gap-3 mt-2.5">
                                                            <div className="flex items-center gap-1 text-[11px] font-bold text-gray-400">
                                                                <span className="material-icons text-[14px] text-amber-400">star</span>
                                                                {p.rating || '5.0'}
                                                            </div>
                                                            <div className="w-1 h-1 rounded-full bg-gray-200" />
                                                            <span className="text-[11px] font-black text-emerald-600 uppercase tracking-tight">₦{p.proposed_price?.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => setNegotiatingWith(p)}
                                                        className="px-6 py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-bold hover:bg-slate-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                                                    >
                                                        <span className="material-icons text-base">chat</span>
                                                        {normalizedStatus === 'open' ? 'Chat' : 'Negotiate'}
                                                    </button>
                                                    <Link 
                                                        to={`/customer/provider/${p.id}`}
                                                        className="w-10 h-10 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all flex items-center justify-center"
                                                        title="View Profile"
                                                    >
                                                        <span className="material-icons-outlined text-[18px]">account_circle</span>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : normalizedStatus === 'open' && (
                                <div className="text-center py-20">
                                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-5">
                                        <span className="material-icons text-gray-300">hourglass_top</span>
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-900 tracking-tight">Finding the best matches...</h3>
                                    <p className="text-xs text-gray-400 mt-1 max-w-[240px] mx-auto leading-relaxed">Top-rated providers in your area are being notified. You'll see them here shortly.</p>
                                    <Link to="/customer/browse" className="inline-flex items-center gap-1.5 text-[#10B981] font-bold text-xs mt-8 hover:underline uppercase tracking-widest">
                                        Browse manually
                                        <span className="material-icons text-sm">arrow_forward</span>
                                    </Link>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
                <MobileNavBar />
            </main>

            {/* Negotiate slide-over */}
            <AnimatePresence>
                {negotiatingWith && (
                    <NegotiatePanel
                        provider={negotiatingWith}
                        requestId={id}
                        category={request?.category}
                        onClose={() => setNegotiatingWith(null)}
                        onFinalized={(price) => {
                            setFinalizedDeal({ price, provider: negotiatingWith });
                            setNegotiatingWith(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default RequestStatus;
