import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/layout/Sidebar';
import TopNavbar from '../../components/layout/TopNavbar';
import MobileNavBar from '../../components/layout/MobileNavBar';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

import { useAuth } from '../../context/AuthContext';
import { getCategoryIcon, getCategoryColors } from '../../lib/utils';
import VoiceRecorder from '../../components/ui/VoiceRecorder';
import AudioPlayer from '../../components/ui/AudioPlayer';
import RejectionModal from '../../components/ui/RejectionModal';

import { getPriceRange, getFairnessLabel, getSmartPriceLabel } from '../../lib/aiData';
import { useMessages } from '../../context/MessageContext';
import { useJobs } from '../../context/JobContext';
import { useProvider } from '../../context/ProviderContext';

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
function NegotiatePanel({ provider, requestId, request, category, onClose, onFinalized }) {
    const { messages: allMessages, fetchMessages, sendMessage, deleteMessage } = useMessages();
  const { finalizeAgreement, reopenNegotiation } = useJobs();
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
    const [showRejectionModal, setShowRejectionModal] = useState(false);

    // Filter messages for this specific job AND this specific provider thread
    const messages = allMessages.filter(m => {
        if (m.job_id !== requestId) return false;
        
        // 1. Matches this specific provider thread
        if (m.provider_id === provider?.id) return true;
        
        // 2. Fallback: message has no provider_id but this provider is the primary worker (Private requests)
        if (!m.provider_id && request?.worker_id === provider?.id) return true;
        
        return false;
    });

    useEffect(() => {
        if (!requestId || !provider?.id) return;
        fetchMessages(requestId, provider.id);
    }, [requestId, provider?.id, fetchMessages]);

    // Sync state with message history to prevent "Yes, Confirm" from showing on previously finalized deals
    useEffect(() => {
        const lastStatus = [...messages].reverse().find(m => m.type === 'system' && (m.message.includes('Job finalised') || m.message.includes('Price agreed') || m.message.includes('Customer rejected') || m.message.includes('reopened negotiation') || m.message.includes('Provider rejected')));
        if (lastStatus) {
            if (lastStatus.message.includes('Job finalised') || lastStatus.message.includes('Price agreed')) { setFinalized(true); setRejected(false); }
            else if (lastStatus.message.includes('rejected')) { setRejected(true); setFinalized(false); }
            else { setFinalized(false); setRejected(false); }
        }
    }, [messages.length]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

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
        try {
            const msgType = extra.isVoice ? 'voice' : (extra.isPriceProposal ? 'price_proposal' : 'text');
            await sendMessage(requestId, text, msgType, extra, provider.id);
            setInput('');
            // Immediately refresh messages after sending
            await fetchMessages(requestId, provider.id);
            // toast.success removed
        } catch (error) {
            console.error('Failed to send message:', error);
            toast.error('Failed to send message. Please try again.');
        }
    };

    const sendPrice = () => {
        if (!priceOffer) return;
        send(`I'd like to propose ₦${Number(priceOffer).toLocaleString()} for this job.`, { isPriceProposal: true, price: Number(priceOffer) });
        setShowPriceInput(false); setPriceOffer('');
    };

    const handleAccept = async (price) => {
        setAgreed(true);
        await finalizeAgreement(requestId, price, provider.id);
        await sendMessage(requestId, `✓ Price agreed at ₦${Number(price).toLocaleString()}. Proceed to payment.`, 'system', {}, provider.id);
    };

    /* Finalise flow */
    const triggerFinalize = () => { setShowFinalizeInput(true); setShowPriceInput(false); };
    const submitFinalize = async () => {
        const p = Number(finalizePrice);
        if (!p) return;
        setShowFinalizeInput(false);
        await sendMessage(requestId, `Customer sent a finalise request at ₦${p.toLocaleString()}.`, 'system', { finalizePrice: p }, provider.id);
    };
    
    const confirmFinalize = async (price) => {
        setFinalized(true);
        await finalizeAgreement(requestId, price, provider.id);
        await sendMessage(requestId, `✓ Job finalised at ₦${Number(price).toLocaleString()}. Tap "Proceed to Payment" to secure the booking.`, 'system', {}, provider.id);
        setTimeout(() => onFinalized?.(price), 1200);
    };

    const declineFinalize = () => {
        sendMessage(requestId, 'Customer declined the finalise request. Negotiation continues.', 'system', {}, provider.id);
    };

    const handleReject = () => {
        setShowRejectionModal(true);
    };

    const submitRejection = (reason) => {
        setRejected(true);
        setShowRejectionModal(false);
        sendMessage(requestId, `Customer rejected the offer. Reason: ${reason}`, 'system', {}, provider.id);
    };

    const handleRenegotiate = async () => {
        setFinalized(false);
        setRejected(false);
        setAgreed(false);
        await reopenNegotiation(requestId, 'customer', provider.id, request.title, currentUser.full_name || currentUser.displayName);
        await sendMessage(requestId, 'Customer reopened negotiation.', 'system', {}, provider.id);
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
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0 z-10" type="button">
                        <span className="material-icons text-gray-500 text-xl">arrow_back</span>
                    </button>
                    <Link to={`/customer/provider/${provider.id}`} className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center shrink-0 hover:ring-2 hover:ring-[#10B981]/40 transition-all">
                        {provider.photoURL || provider.avatar_url ? <img src={provider.photoURL || provider.avatar_url} alt={provider.full_name || provider.displayName} className="w-full h-full object-cover" /> : <span className="material-icons text-gray-400 text-xl">person</span>}
                    </Link>
                    <div className="flex-1 min-w-0">
                        <Link to={`/customer/provider/${provider.id}`} className="font-bold text-gray-900 text-sm leading-tight truncate hover:text-[#10B981] transition-colors block">
                            {provider.full_name || provider.displayName}
                        </Link>
                        <p className={`text-xs font-semibold ${finalized ? 'text-[#10B981]' : rejected ? 'text-red-500' : 'text-[#10B981]'}`}>
                            {finalized ? 'Finalised ✓' : rejected ? 'Rejected' : 'Online · Negotiating'}
                        </p>
                    </div>
                    <a href={`tel:${provider.phone_number}`} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0">
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
                            <div key={msg.id} className={`flex ${isSystem ? 'justify-center' : (isMe ? 'justify-end' : 'justify-start')}`}>
                                {isSystem ? (
                                    msg.message.includes('rejected') ? (
                                        <span className="bg-red-50 text-red-500 text-[11px] font-semibold px-4 py-2 rounded-full max-w-[85%] text-center leading-relaxed">
                                            {msg.message}
                                        </span>
                                    ) : (
                                        <span className="bg-gray-100 text-gray-500 text-[11px] font-semibold px-4 py-2 rounded-full max-w-[85%] text-center leading-relaxed">
                                            {msg.message}
                                        </span>
                                    )
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
                                        ) : msg.type === 'voice' ? (
                                            <div className="relative group/msg w-full flex justify-end">
                                                <div className={`px-4 py-2.5 rounded-2xl ${isMe ? 'bg-[#0F172A] text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                                                    <AudioPlayer src={msg.metadata?.audioUrl} durationProp={msg.metadata?.duration} isMe={isMe} />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative group/msg w-full flex justify-end">
                                                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-[#0F172A] text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                                                    {msg.message}
                                                </div>
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
                {(!finalized && !rejected && !agreed) ? (
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
                ) : !['payment_secured', 'in_progress', 'payment_released', 'completed'].includes(String(request?.status || '').toLowerCase()) && (
                    <div className="flex shrink-0 border-t border-gray-100 overflow-hidden">
                        <button onClick={handleRenegotiate}
                            className="flex-1 py-3 text-sm font-bold text-amber-600 bg-amber-500/[0.07] backdrop-blur-sm hover:bg-amber-500/[0.14] transition-colors">
                            Renegotiate
                        </button>
                    </div>
                )}

                {/* Message input bar */}
                <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2 bg-white shrink-0 relative">
                    <div className="shrink-0 flex items-center justify-center">
                        <VoiceRecorder 
                            disabled={rejected}
                            onVoiceRecorded={async (audioUrl, duration) => {
                                await send('Voice note', { isVoice: true, audioUrl, duration });
                            }} 
                        />
                    </div>
                    <input ref={inputRef} type="text" value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
                        placeholder="Message…" disabled={rejected}
                        className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none text-gray-800 placeholder-gray-400 disabled:opacity-40" />
                    <button onClick={() => send(input)} disabled={!input.trim() || rejected}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-[#0F172A] disabled:opacity-30 text-white hover:bg-slate-700 transition-colors">
                        <span className="material-icons text-[18px]">send</span>
                    </button>
                </div>
            </motion.div>

            <RejectionModal 
                isOpen={showRejectionModal} 
                onClose={() => setShowRejectionModal(false)} 
                onSubmit={submitRejection} 
            />
        </>
    );
}

/* ─── Main page ────────────────────────────────────────── */
const RequestStatus = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const { requests, releasePayment, getJobMatches, inviteMatchedProvider, deleteJob } = useJobs();
  const { getProviders, getProviderProfile, getInterestedProviders } = useProvider();
  const { messages } = useMessages();
    const [request, setRequest] = useState(null);
    const [interestedProviders, setInterestedProviders] = useState([]);
    const [aiMatchedProviders, setAiMatchedProviders] = useState([]);
    const [invitedPros, setInvitedPros] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [negotiatingWith, setNegotiatingWith] = useState(null);
    const [expandedProviderId, setExpandedProviderId] = useState(null);
    const [activeTab, setActiveTab] = useState('recommended');
    const [finalizedDeal, setFinalizedDeal] = useState(null); // { price, provider }
    const [isLive, setIsLive] = useState(true); // Tracks if real-time subscriptions should be active
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
    const [showJobStartedSuccess, setShowJobStartedSuccess] = useState(false);
    const [showAllDetails, setShowAllDetails] = useState(false);

    useEffect(() => {
        if (!request || !messages) return;
        const jobMessages = messages.filter(m => m.job_id === request.id);
        const lastStatusMsg = [...jobMessages].reverse().find(m => m.type === 'system' && (m.message.includes('✓ Job finalised at ₦') || m.message.includes('reopened negotiation')));
        
        if (lastStatusMsg && lastStatusMsg.message.includes('✓ Job finalised at ₦')) {
            const priceMatch = lastStatusMsg.message.match(/₦([\d,]+)/);
            if (priceMatch) {
                const price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
                const provId = lastStatusMsg.provider_id || lastStatusMsg.sender_id || request.worker_id;
                setFinalizedDeal({ price, provider: { id: provId } });
            }
        } else {
            setFinalizedDeal(null);
        }
    }, [messages, request]);

    useEffect(() => {
        if (location.state?.paymentConfirmed) {
            setShowPaymentSuccess(true);
            navigate(location.pathname, { replace: true, state: {} });
        }
        if (location.state?.jobStarted) {
            setShowJobStartedSuccess(true);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, location.pathname, navigate]);

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
        
        const currentStatus = String(req.status || '').toLowerCase();
        
        // Determine if we should fetch interested providers
        const isPublicOpen = req.request_type === 'public' && currentStatus === 'open';
        
        if (isPublicOpen) {
            // For public+open: Fetch providers who accepted from job_applications
            getInterestedProviders(req.id)
                .then(interestedProvs => {
                    setInterestedProviders(interestedProvs);
                })
                .catch(() => setInterestedProviders([]));
            
            supabase.from('job_applications')
                .select('provider_id')
                .eq('job_id', req.id)
                .eq('status', 'invited')
                .then(({data}) => {
                    if (data) setInvitedPros(new Set(data.map(d => d.provider_id)));
                });
            
            // Also fetch AI Matched Providers
            getJobMatches(req.id)
                .then(matches => setAiMatchedProviders(matches))
                .catch(() => setAiMatchedProviders([]));
        } else if (req.worker_id) {
            // For private or finalized public: Show only assigned provider
            getProviderProfile(req.worker_id).then(assigned => {
                if (assigned) {
                    setInterestedProviders([{
                        ...assigned,
                        proposed_price: req.agreedPrice || req.budget_estimate,
                        message: "Targeted provider for this request.",
                        verified: assigned.isVerified,
                        isAccepted: true,
                    }]);
                }
            }).catch(() => setInterestedProviders([]));
        } else {
            // No worker assigned and not public+open
            setInterestedProviders([]);
            setAiMatchedProviders([]);
        }

        setLoading(false);
    }, [id, requests, getProviders, getInterestedProviders, getJobMatches]);

    // ── Polling for interested providers & matches (real-time updates) ─────────────────
    useEffect(() => {
        if (!isLive) return; // Optimization: Stop polling if user is inactive
        if (!request || request.request_type !== 'public' || String(request.status || '').toLowerCase() !== 'open') {
            return; // Only poll for public+open requests
        }

        const refreshInterestedProviders = async () => {
            try {
                const providers = await getInterestedProviders(request.id);
                setInterestedProviders(providers);
            } catch (err) {
                console.error('Failed to refresh interested providers:', err);
            }
        };

        const refreshMatchedProviders = async () => {
            try {
                const matches = await getJobMatches(request.id);
                setAiMatchedProviders(matches);
            } catch (err) {
                console.error('Failed to refresh matched providers:', err);
            }
        };

        refreshInterestedProviders(); // Initial fetch
        refreshMatchedProviders();

        const applicationsChannel = supabase
            .channel(`job_applications_${request.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'job_applications', filter: `job_id=eq.${request.id}` }, () => {
                refreshInterestedProviders();
            })
            .subscribe();

        const matchesChannel = supabase
            .channel(`job_matches_${request.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'job_matches', filter: `job_id=eq.${request.id}` }, () => {
                refreshMatchedProviders();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(applicationsChannel);
            supabase.removeChannel(matchesChannel);
        };
    }, [request?.id, request?.request_type, request?.status, getInterestedProviders, getJobMatches, isLive]);

    // ── Hybrid Realtime Optimization (Visibility + Idle + Activity) ──────────
    useEffect(() => {
        let timeoutId;
        
        const resetIdleTimer = () => {
            clearTimeout(timeoutId);
            // 5 minutes of strict idle time before disconnecting
            timeoutId = setTimeout(() => {
                setIsLive(false);
            }, 5 * 60 * 1000);
        };

        const handleActivity = () => {
            if (!document.hidden) {
                setIsLive(prev => {
                    if (!prev) return true; // Reconnect automatically on user interaction after timeout
                    return prev;
                });
                resetIdleTimer();
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setIsLive(false); // Disconnect Realtime when document.hidden === true
                clearTimeout(timeoutId);
            } else {
                setIsLive(true); // Reconnect when visible again
                resetIdleTimer();
            }
        };

        // Initial setup
        if (!document.hidden) resetIdleTimer();
        else setIsLive(false);

        // Throttle activity listener to save CPU
        let throttleTimer;
        const throttledActivity = () => {
            if (throttleTimer) return;
            throttleTimer = setTimeout(() => {
                handleActivity();
                throttleTimer = null;
            }, 1000);
        };

        window.addEventListener('mousemove', throttledActivity);
        window.addEventListener('keydown', throttledActivity);
        window.addEventListener('touchstart', throttledActivity);
        window.addEventListener('scroll', throttledActivity);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearTimeout(timeoutId);
            clearTimeout(throttleTimer);
            window.removeEventListener('mousemove', throttledActivity);
            window.removeEventListener('keydown', throttledActivity);
            window.removeEventListener('touchstart', throttledActivity);
            window.removeEventListener('scroll', throttledActivity);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

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
    const STATUS_COLOR = { open: 'bg-gray-50 text-gray-500 border-gray-200', interested: 'bg-amber-50 text-amber-700 border-amber-200', negotiating: 'bg-purple-50 text-purple-700 border-purple-200', awaiting_payment: 'bg-orange-50 text-orange-700 border-orange-200', payment_secured: 'bg-green-50 text-green-700 border-green-200', in_progress: 'bg-blue-50 text-blue-700 border-blue-200', payment_released: 'bg-emerald-50 text-emerald-700 border-emerald-200', completed: 'bg-amber-50 text-amber-800 border-amber-200', cancelled: 'bg-red-50 text-red-700 border-red-200', rejected: 'bg-red-50 text-red-700 border-red-200' };

    const handleRelease = async () => {
        try {
            await releasePayment(id);
            setRequest(prev => ({ ...prev, status: 'payment_released' }));
        } catch { toast.error('Failed to release payment.'); }
    };

    const handleDeleteRequest = async () => {
        setIsDeleting(true);
        try {
            await deleteJob(id);
            navigate('/customer/requests');
        } catch (error) {
            console.error("Failed to delete request:", error);
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-white font-sans text-gray-900">
            <Sidebar />
            
            <main className="flex-1 overflow-hidden flex flex-col min-w-0">
                <TopNavbar breadcrumbs={['Customer', 'My Requests', 'Details']} />

                <div className="flex-1 overflow-y-auto bg-white relative">
                    <div className="max-w-5xl mx-auto w-full p-4 sm:p-6 md:p-8 pb-24 md:pb-10">

                        {/* Inactivity Optimization Banner */}
                        {!isLive && (
                            <div className="mb-6 bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center justify-between shadow-sm cursor-pointer hover:bg-amber-100/50 transition-colors" onClick={() => setIsLive(true)}>
                                <div className="flex items-center gap-3">
                                    <span className="material-icons text-amber-500">pause_circle_outline</span>
                                    <div>
                                        <p className="text-sm font-bold text-amber-800">Live updates paused to save battery</p>
                                        <p className="text-xs text-amber-600 mt-0.5">Click anywhere to resume real-time matching.</p>
                                    </div>
                                </div>
                                <button className="px-4 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 transition-colors">
                                    Resume
                                </button>
                            </div>
                        )}

                        {/* Inline Notifications */}
                        <AnimatePresence>
                            {showPaymentSuccess && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0, marginBottom: 0 }} 
                                    animate={{ opacity: 1, height: 'auto', marginBottom: 24 }} 
                                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    className="p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-4 relative overflow-hidden mb-6"
                                >
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                                        <span className="material-icons text-[#10B981]">verified</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[13px] font-bold text-[#10B981] leading-tight">Payment confirmed</p>
                                        <p className="text-[12px] font-medium text-green-700/80 mt-0.5">Funds are held securely. You can find your job start code in the actions below.</p>
                                    </div>
                                    <button onClick={() => setShowPaymentSuccess(false)} className="text-green-300 hover:text-green-500 transition-colors">
                                        <span className="material-icons text-lg">close</span>
                                    </button>
                                </motion.div>
                            )}

                            {showJobStartedSuccess && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0, marginBottom: 0 }} 
                                    animate={{ opacity: 1, height: 'auto', marginBottom: 24 }} 
                                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4 relative overflow-hidden mb-6"
                                >
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                                        <span className="material-icons text-blue-600">play_circle</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[13px] font-bold text-blue-700 leading-tight">Job is Live!</p>
                                        <p className="text-[12px] font-medium text-blue-600/80 mt-0.5">Your provider has started the job. You'll be notified when they complete it.</p>
                                    </div>
                                    <button onClick={() => setShowJobStartedSuccess(false)} className="text-blue-300 hover:text-blue-500 transition-colors">
                                        <span className="material-icons text-lg">close</span>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

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
                                {(normalizedStatus === 'open' || normalizedStatus === 'pending') && (
                                    <button 
                                        onClick={() => setShowDeleteModal(true)}
                                        className="inline-flex items-center gap-1 mt-1 px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                        title="Delete Request"
                                    >
                                        <span className="material-icons text-[14px]">delete_outline</span>
                                        Delete Request
                                    </button>
                                )}
                            </div>

                            {/* CTA row — only after negotiation is finalised or awaiting payment */}
                            {(finalizedDeal || normalizedStatus === 'awaiting_payment' || releaseEnabled) && (
                                <div className="flex flex-wrap items-center gap-3 mb-1">
                                    {(finalizedDeal || normalizedStatus === 'awaiting_payment') && (
                                        <button 
                                            onClick={() => {
                                                const price = finalizedDeal?.price || request.agreedPrice || request.agreed_price || request.budget_estimate || 0;
                                                const prov = finalizedDeal?.provider || interestedProviders[0] || { id: request.worker_id };
                                                navigate(`/customer/payment/${request.id}`, { state: { agreedPrice: price, provider: prov } });
                                            }}
                                            className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-md shadow-[#10B981]/20">
                                            <span className="material-icons text-base">lock</span>
                                            Make Payment · ₦{Number(finalizedDeal?.price || request.agreedPrice || request.agreed_price || request.budget_estimate || 0).toLocaleString()}
                                        </button>
                                    )}
                                    {releaseEnabled && (
                                        <Link to={`/customer/confirm/${id}`}
                                            className="inline-flex items-center gap-2 bg-[#0F172A] hover:bg-slate-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-md shadow-slate-900/10">
                                            <span className="material-icons text-base">payments</span>
                                            Confirm & Release Payment
                                        </Link>
                                    )}
                                </div>
                            )}

                            {/* Job flow shortcuts */}
                            {normalizedStatus === 'payment_secured' && (
                                <div className="mt-8 py-3 px-4 flex flex-wrap items-center gap-4 bg-gray-50/50 rounded-xl border border-gray-100/80">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Actions</span>
                                    <Link
                                        to={`/customer/job-otp/${id}`}
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#10B981] hover:text-[#059669] transition-colors"
                                    >
                                        <span className="material-icons-outlined text-[18px]">vpn_key</span>
                                        Get Job start code
                                    </Link>
                                </div>
                            )}

                            {/* 🎉 Provider Accepted or Negotiating — Chat CTA */}
                            {(normalizedStatus === 'provider_accepted' || normalizedStatus === 'negotiating') && (
                                <div className="mt-8 p-5 sm:p-6 bg-emerald-50/40 rounded-2xl border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                                            <span className="material-icons text-emerald-600 text-2xl">{normalizedStatus === 'negotiating' ? 'chat' : 'handshake'}</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-base tracking-tight">
                                                {normalizedStatus === 'negotiating' ? 'Negotiation in Progress' : 'Provider Accepted!'}
                                            </h3>
                                            <p className="text-[13px] text-gray-600 mt-0.5">
                                                {normalizedStatus === 'negotiating' ? 'Continue the conversation to finalize the price.' : 'Start negotiating to agree on a price and secure the booking.'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const prov = interestedProviders[0];
                                            if (prov) setNegotiatingWith(prov);
                                            else toast.error("Provider details not loaded yet.");
                                        }}
                                        className="inline-flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-sm shadow-emerald-500/20 whitespace-nowrap"
                                    >
                                        <span className="material-icons text-base">chat</span>
                                        {normalizedStatus === 'negotiating' ? 'Continue Negotiating' : 'Start Negotiating'}
                                    </button>
                                </div>
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
                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">Coming soon</span>
                                    </div>
                                );
                            })()}

                            {/* View More Details Toggle */}
                            <div className="mt-6">
                                <button 
                                    onClick={() => setShowAllDetails(!showAllDetails)}
                                    className="flex items-center gap-2 text-[13px] font-bold text-[#10B981] hover:text-[#059669] transition-all"
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
                                            <div className="pt-6 space-y-8">
                                                {/* Photos */}
                                                {(request.images?.length > 0 || request.image) && (
                                                    <div className="space-y-4">
                                                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Photos</h4>
                                                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                                            {(request.images || [request.image]).map((img, i) => (
                                                                <div key={i} className="w-48 sm:w-64 aspect-[4/3] rounded-2xl overflow-hidden border border-gray-100 shrink-0 shadow-sm">
                                                                    <img src={img} alt={`Job ${i}`} className="w-full h-full object-cover" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Job Details Grid (Like 3rd image) */}
                                                <div className="space-y-4">
                                                    <div className="flex flex-col gap-0.5">
                                                        <h4 className="text-[15px] font-black text-gray-900">Job Details</h4>
                                                    </div>
                                                    
                                                    <div className="divide-y divide-gray-100 border-y border-gray-100">
                                                        {/* Row 1 */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                                                            <div className="p-5 flex items-center gap-4">
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${getCategoryColors(request.category).bg} ${getCategoryColors(request.category).color} ${getCategoryColors(request.category).border}`}>
                                                                    <span className="material-icons-outlined text-lg">{getCategoryIcon(request.category)}</span>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</p>
                                                                    <p className="text-sm font-bold text-gray-900">{request.category}</p>
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

                                                        {/* Row 2 */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                                                            <div className="p-5 flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                                                    <span className="material-icons-outlined text-lg">person</span>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</p>
                                                                    <p className="text-sm font-bold text-gray-900">You (Owner)</p>
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

                                                        {/* Row 3 (Full Width) */}
                                                        <div className="p-5 flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                                                <span className="material-icons-outlined text-lg">priority_high</span>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Urgency</p>
                                                                <p className="text-sm font-bold text-gray-900 capitalize">{request.urgency || 'Low'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                {request.description && (
                                                    <div className="space-y-4">
                                                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Task Description</h4>
                                                        <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">{request.description}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* ── Filter Tabs & Providers (Public + Open) ──────────────── */}
                        {request.request_type === 'public' && normalizedStatus === 'open' ? (
                            <div className="mt-8 mb-8">
                                <div className="flex items-center gap-6 border-b border-gray-100 mb-6">
                                    <button 
                                        onClick={() => setActiveTab('recommended')}
                                        className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'recommended' ? 'text-[#10B981]' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            Recommended Matches
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'recommended' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                                                {aiMatchedProviders.length}
                                            </span>
                                        </div>
                                        {activeTab === 'recommended' && (
                                            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#10B981] rounded-t-full" />
                                        )}
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('interested')}
                                        className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'interested' ? 'text-[#10B981]' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            Interested Providers
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'interested' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                                                {interestedProviders.length}
                                            </span>
                                        </div>
                                        {activeTab === 'interested' && (
                                            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#10B981] rounded-t-full" />
                                        )}
                                    </button>
                                </div>

                                {/* Recommended Matches */}
                                {activeTab === 'recommended' && aiMatchedProviders.length > 0 && (
                                    <div className="space-y-0">
                                        {aiMatchedProviders.map((match, idx) => {
                                            const p = match.provider || {};
                                            const pp = match.provider_profile || {};
                                            return (
                                                <div key={match.id} className="py-5 border-b border-gray-100 last:border-0 relative">
                                                    <div className="flex items-start gap-4">
                                                        {/* Avatar */}
                                                        <div className="w-12 h-12 rounded-full border border-gray-200 overflow-hidden shrink-0">
                                                            <img 
                                                                src={p.photoURL || p.avatar_url || `https://ui-avatars.com/api/?name=${p.full_name || 'Artisan'}&background=random&color=334155`} 
                                                                alt={p.full_name} 
                                                                className="w-full h-full object-cover" 
                                                            />
                                                        </div>

                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0 pr-0 sm:pr-24">
                                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                                <div className="flex items-center gap-1.5 min-w-0">
                                                                    <h3 className="text-[15px] font-bold text-gray-900 truncate">
                                                                        {p.full_name}
                                                                    </h3>
                                                                    <span className="material-icons text-[#10B981] text-[15px] shrink-0" title="Verified">verified</span>
                                                                    <div className="flex items-center bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100 shrink-0 ml-1">
                                                                        <span className="font-bold text-[10px] text-emerald-600 uppercase tracking-wide">{match.match_score}% Match</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex sm:hidden items-center gap-0.5 shrink-0">
                                                                    <span className="material-icons text-yellow-500 text-[14px]">star</span>
                                                                    <span className="text-[12px] font-bold text-gray-500">{pp.average_rating != null ? Number(pp.average_rating).toFixed(1) : '0.0'}</span>
                                                                </div>
                                                            </div>

                                                            {/* Category & Location */}
                                                            <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5 truncate mt-1">
                                                                {(() => {
                                                                    const cats = pp.trade_category || [];
                                                                    if (!cats.length) return <span>Uncategorized</span>;
                                                                    return (<>
                                                                        <span className="truncate font-bold text-gray-700 capitalize">{cats[0].toLowerCase()}</span>
                                                                        {cats.length > 1 && <span className="bg-[#10B981] text-white px-1.5 py-0.5 rounded-md text-[9px] font-bold shrink-0 ml-1">+{cats.length - 1}</span>}
                                                                    </>);
                                                                })()}
                                                                <span className="text-gray-200">·</span>
                                                                <span className="truncate">{p.location || 'Lagos, Nigeria'}</span>
                                                            </p>

                                                            {/* Jobs & Rationale */}
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 mt-2.5">
                                                                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 shrink-0 self-start">
                                                                    <span className="material-icons-outlined text-[12px] text-gray-400">task_alt</span>
                                                                    {pp.completed_jobs_count || '0'} jobs
                                                                </div>
                                                                <span className="text-[12px] text-gray-700 sm:truncate leading-snug">
                                                                    <span className="font-bold text-gray-900 mr-1">Rationale:</span>
                                                                    {match.ai_rationale}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Desktop Star Rating */}
                                                        <div className="hidden sm:flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-100 shrink-0">
                                                            <span className="material-icons text-yellow-500 text-[14px]">star</span>
                                                            <span className="font-bold text-[12px] text-gray-900">{pp.average_rating != null ? Number(pp.average_rating).toFixed(1) : '0.0'}</span>
                                                        </div>
                                                    </div>

                                                    {/* Invite Button */}
                                                    <div className="mt-3 sm:mt-0 sm:absolute sm:bottom-5 sm:right-0">
                                                        <button 
                                                            disabled={invitedPros.has(match.provider_id)}
                                                            onClick={async () => {
                                                                const success = await inviteMatchedProvider(request.id, match.provider_id, request.title);
                                                                if (success) {
                                                                    setInvitedPros(prev => new Set(prev).add(match.provider_id));
                                                                }
                                                            }}
                                                            className="w-full sm:w-auto py-2 sm:py-1.5 px-4 bg-[#10B981] text-white text-xs font-bold rounded-xl sm:rounded-lg hover:bg-[#059669] disabled:opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                                        >
                                                            <span className="material-icons text-[14px]">
                                                                {invitedPros.has(match.provider_id) ? 'check' : 'person_add'}
                                                            </span>
                                                            {invitedPros.has(match.provider_id) ? 'Invited' : 'Invite'}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Interested Providers */}
                                {activeTab === 'interested' && interestedProviders.length > 0 && (
                                    <div className="space-y-0">
                                        {interestedProviders.map((p, idx) => (
                                            <div key={p.id} className="py-5 border-b border-gray-100 last:border-0 relative">
                                                <div className="flex items-start gap-4">
                                                    {/* Avatar */}
                                                    <div className="w-12 h-12 rounded-full border border-gray-200 overflow-hidden shrink-0">
                                                        <img 
                                                            src={p.photoURL || p.avatar_url || `https://ui-avatars.com/api/?name=${p.displayName || p.full_name || 'Artisan'}&background=random&color=334155`} 
                                                            alt={p.displayName || p.full_name} 
                                                            className="w-full h-full object-cover" 
                                                        />
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0 pr-0 sm:pr-24">
                                                        <div className="flex items-center justify-between gap-2 mb-0.5">
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <h3 className="text-[15px] font-bold text-gray-900 truncate transition-colors">
                                                                    {p.full_name || p.displayName}
                                                                </h3>
                                                                <span className="material-icons text-[#10B981] text-[15px] shrink-0" title="Verified">verified</span>
                                                            </div>
                                                            <div className="flex sm:hidden items-center gap-0.5 shrink-0">
                                                                <span className="material-icons text-yellow-500 text-[14px]">star</span>
                                                                <span className="text-[12px] font-bold text-gray-500">{p.rating != null ? Number(p.rating).toFixed(1) : '0.0'}</span>
                                                            </div>
                                                        </div>

                                                        {/* Category & Location */}
                                                        <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5 truncate mt-1">
                                                            {(() => {
                                                                const cats = p.trade_category && p.trade_category.length > 0 ? p.trade_category : (p.category && p.category !== 'None' ? [p.category] : null);
                                                                if (!cats) return <span className="bg-[#0F172A] text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">None</span>;
                                                                return (<>
                                                                    <span className="bg-[#0F172A] text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0">{cats[0]}</span>
                                                                    {cats.length > 1 && <span className="bg-[#10B981] text-white px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0">+{cats.length - 1}</span>}
                                                                </>);
                                                            })()}
                                                            <span className="text-gray-200">·</span>
                                                            <span className="truncate">{p.location || 'Lagos, Nigeria'}</span>
                                                        </p>

                                                        {/* Jobs */}
                                                        <div className="flex items-center gap-2 mt-2.5">
                                                            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 shrink-0">
                                                                <span className="material-icons-outlined text-[12px] text-gray-400">task_alt</span>
                                                                {p.completedJobs || '0'} jobs
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Desktop Star Rating */}
                                                    <div className="hidden sm:flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-100 shrink-0">
                                                        <span className="material-icons text-yellow-500 text-[14px]">star</span>
                                                        <span className="font-bold text-[12px] text-gray-900">{p.rating != null ? Number(p.rating).toFixed(1) : '0.0'}</span>
                                                    </div>
                                                </div>

                                                {/* Negotiate Button */}
                                                <div className="mt-3 sm:mt-0 sm:absolute sm:bottom-5 sm:right-0">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setNegotiatingWith(p); }}
                                                        className="w-full sm:w-auto py-2 sm:py-1.5 px-4 bg-[#0F172A] text-white text-xs font-bold rounded-xl sm:rounded-lg hover:bg-slate-700 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                                    >
                                                        <span className="material-icons text-[14px]">chat</span>
                                                        {['payment_secured', 'in_progress', 'payment_released', 'completed'].includes(normalizedStatus) ? 'Message' : 'Negotiate'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Fallback for private or non-open public requests */
                            (request.request_type === 'private' || ['interested', 'provider_accepted', 'negotiating', 'awaiting_payment', 'payment_secured'].includes(normalizedStatus)) && interestedProviders.length > 0 ? (
                                <div className="mt-8 mb-8">
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                                        {request.request_type === 'private' ? 'Targeted Provider' : normalizedStatus === 'provider_accepted' ? 'Providers who accepted' : 'Interested Providers'}
                                    </h3>
                                    <div className="space-y-0">
                                        {interestedProviders.map((p, idx) => (
                                            <div key={p.id} className="py-5 border-b border-gray-100 last:border-0 relative">
                                                <div className="flex items-start gap-4">
                                                    {/* Avatar */}
                                                    <div className="w-12 h-12 rounded-full border border-gray-200 overflow-hidden shrink-0">
                                                        <img 
                                                            src={p.photoURL || p.avatar_url || `https://ui-avatars.com/api/?name=${p.displayName || p.full_name || 'Artisan'}&background=random&color=334155`} 
                                                            alt={p.displayName || p.full_name} 
                                                            className="w-full h-full object-cover" 
                                                        />
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0 pr-0 sm:pr-24">
                                                        <div className="flex items-center justify-between gap-2 mb-0.5">
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <h3 className="text-[15px] font-bold text-gray-900 truncate">
                                                                    {p.full_name || p.displayName}
                                                                </h3>
                                                                <span className="material-icons text-[#10B981] text-[15px] shrink-0" title="Verified">verified</span>
                                                            </div>
                                                            <div className="flex sm:hidden items-center gap-0.5 shrink-0">
                                                                <span className="material-icons text-yellow-500 text-[14px]">star</span>
                                                                <span className="text-[12px] font-bold text-gray-500">{p.rating != null ? Number(p.rating).toFixed(1) : '0.0'}</span>
                                                            </div>
                                                        </div>

                                                        {/* Category & Location */}
                                                        <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5 truncate mt-1">
                                                            {(() => {
                                                                const cats = p.trade_category && p.trade_category.length > 0 ? p.trade_category : (p.category && p.category !== 'None' ? [p.category] : null);
                                                                if (!cats) return <span className="bg-[#0F172A] text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">None</span>;
                                                                return (<>
                                                                    <span className="bg-[#0F172A] text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0">{cats[0]}</span>
                                                                    {cats.length > 1 && <span className="bg-[#10B981] text-white px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0">+{cats.length - 1}</span>}
                                                                </>);
                                                            })()}
                                                            <span className="text-gray-200">·</span>
                                                            <span className="truncate">{p.location || 'Lagos, Nigeria'}</span>
                                                        </p>

                                                        {/* Jobs */}
                                                        <div className="flex items-center gap-2 mt-2.5">
                                                            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 shrink-0">
                                                                <span className="material-icons-outlined text-[12px] text-gray-400">task_alt</span>
                                                                {p.completedJobs || '0'} jobs
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Desktop Star Rating */}
                                                    <div className="hidden sm:flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-100 shrink-0">
                                                        <span className="material-icons text-yellow-500 text-[14px]">star</span>
                                                        <span className="font-bold text-[12px] text-gray-900">{p.rating != null ? Number(p.rating).toFixed(1) : '0.0'}</span>
                                                    </div>
                                                </div>

                                                {/* Negotiate Button */}
                                                <div className="mt-3 sm:mt-0 sm:absolute sm:bottom-5 sm:right-0">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setNegotiatingWith(p); }}
                                                        className="w-full sm:w-auto py-2 sm:py-1.5 px-4 bg-[#0F172A] text-white text-xs font-bold rounded-xl sm:rounded-lg hover:bg-slate-700 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                                    >
                                                        <span className="material-icons text-[14px]">chat</span>
                                                        {['payment_secured', 'in_progress', 'payment_released', 'completed'].includes(normalizedStatus) ? 'Message' : 'Negotiate'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null
                        )}

                    </div>
                </div>
                <MobileNavBar />
            </main>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                                    <span className="material-icons text-red-600">delete_forever</span>
                                </div>
                                <h3 className="text-xl font-black text-gray-900 mb-2">Delete Request?</h3>
                                <p className="text-sm text-gray-500 font-medium">
                                    Are you sure you want to permanently delete this request? This action cannot be undone.
                                </p>
                            </div>
                            <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={isDeleting}
                                    className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteRequest}
                                    disabled={isDeleting}
                                    className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 min-w-[120px] flex items-center justify-center"
                                >
                                    {isDeleting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        "Yes, I'm sure"
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Negotiate slide-over */}
            <AnimatePresence>
                {negotiatingWith && (
                    <NegotiatePanel
                        provider={negotiatingWith}
                        requestId={id}
                        request={request}
                        category={request?.category}
                        onClose={() => {
                            setNegotiatingWith(null);
                            // Remove ?negotiate=true from URL to prevent auto-reopening
                            const params = new URLSearchParams(location.search);
                            params.delete('negotiate');
                            const newSearch = params.toString() ? `?${params.toString()}` : '';
                            window.history.replaceState(null, '', newSearch || location.pathname);
                        }}
                        onFinalized={(price) => {
                            setFinalizedDeal({ price, provider: negotiatingWith });
                            setNegotiatingWith(null);
                            // Remove ?negotiate=true from URL
                            const params = new URLSearchParams(location.search);
                            params.delete('negotiate');
                            const newSearch = params.toString() ? `?${params.toString()}` : '';
                            window.history.replaceState(null, '', newSearch || location.pathname);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default RequestStatus;
