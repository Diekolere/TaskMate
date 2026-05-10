import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/layout/Sidebar';
import TopNavbar from '../../components/layout/TopNavbar';
import MobileNavBar from '../../components/layout/MobileNavBar';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { MOCK_PROVIDERS } from '../../lib/mocks';
import { getPriceRange, getFairnessLabel, getMatchScore, getSmartPriceLabel } from '../../lib/aiData';

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
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const [messages, setMessages] = useState([
        { id: 1, from: 'provider', text: `Hi! I've reviewed your request and I'm ready to help.`, time: new Date(Date.now() - 900000) },
        { id: 2, from: 'provider', text: `I can complete this job for ₦${Number(provider.proposed_price || 12000).toLocaleString()}.`, time: new Date(Date.now() - 840000), isPriceProposal: true, price: provider.proposed_price || 12000 },
    ]);
    const [input, setInput] = useState('');
    const [showPriceInput, setShowPriceInput] = useState(false);
    const [priceOffer, setPriceOffer] = useState('');
    const [agreed, setAgreed] = useState(false);

    /* Finalise / Reject */
    const [showFinalizeInput, setShowFinalizeInput] = useState(false);
    const [finalizePrice, setFinalizePrice] = useState('');
    const [finalized, setFinalized] = useState(false);
    const [rejected, setRejected] = useState(false);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
    useEffect(() => { inputRef.current?.focus(); }, []);

    const addMsg = (msg) => setMessages(prev => [...prev, { id: Date.now() + Math.random(), time: new Date(), ...msg }]);
    const fmt = (d) => format(new Date(d), 'h:mm a');

    const send = (text, extra = {}) => {
        if (!text.trim()) return;
        addMsg({ from: 'customer', text, ...extra });
        setInput('');
        setTimeout(() => {
            addMsg({ from: 'provider', text: extra.isPriceProposal ? `That works for me! Let's go ahead.` : `Got it — I'll be there right on time.` });
        }, 1200);
    };

    const sendPrice = () => {
        if (!priceOffer) return;
        send(`I'd like to propose ₦${Number(priceOffer).toLocaleString()} for this job.`, { isPriceProposal: true, price: Number(priceOffer) });
        setShowPriceInput(false); setPriceOffer('');
    };

    const handleAccept = (price) => {
        setAgreed(true);
        toast.success(`Deal agreed at ₦${Number(price).toLocaleString()} — proceed to payment.`);
        addMsg({ from: 'system', text: `✓ Price agreed at ₦${Number(price).toLocaleString()}. Proceed to payment.` });
    };

    /* Finalise flow */
    const triggerFinalize = () => { setShowFinalizeInput(true); setShowPriceInput(false); };
    const submitFinalize = () => {
        const p = Number(finalizePrice);
        if (!p) return;
        setShowFinalizeInput(false);
        addMsg({ from: 'system', text: `You sent a finalise request at ₦${p.toLocaleString()}.` });
        setTimeout(() => addMsg({ from: 'provider_confirm', text: `Customer wants to finalise at ₦${p.toLocaleString()}. Do you agree?`, finalizePrice: p }), 1000);
    };
    const confirmFinalize = (price) => {
        setFinalized(true);
        addMsg({ from: 'system', text: `✓ Job finalised at ₦${Number(price).toLocaleString()}. Tap "Proceed to Payment" to secure the booking.` });
        toast.success(`Deal agreed at ₦${Number(price).toLocaleString()}`);
        setTimeout(() => onFinalized?.(price), 1200);
    };
    const declineFinalize = () => addMsg({ from: 'system', text: 'Provider declined. Negotiation continues.' });
    const handleReject = () => { setRejected(true); addMsg({ from: 'system', text: 'You rejected this offer. The provider has been notified.' }); };

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
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.from === 'customer' ? 'justify-end' : msg.from === 'system' ? 'justify-center' : 'justify-start'}`}>
                            {msg.from === 'system' ? (
                                <span className="bg-gray-100 text-gray-500 text-[11px] font-semibold px-4 py-2 rounded-full max-w-[85%] text-center leading-relaxed">
                                    {msg.text}
                                </span>
                            ) : msg.from === 'provider_confirm' ? (
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
                                <div className={`max-w-[78%] flex flex-col gap-1 ${msg.from === 'customer' ? 'items-end' : 'items-start'}`}>
                                    {msg.isPriceProposal ? (
                                        <div className={`rounded-2xl px-4 py-3.5 w-full ${msg.from === 'customer' ? 'bg-[#0F172A] text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                                            <p className="text-[9px] font-bold uppercase tracking-wider opacity-50 mb-1">Price Proposal</p>
                                            <p className="text-xl font-black mb-0.5">₦{Number(msg.price).toLocaleString()}</p>
                                            <p className="text-xs opacity-60">{msg.text}</p>
                                            {/* Fairness score badge */}
                                            {msg.price && category && (() => {
                                                const fair = getFairnessLabel(msg.price, category);
                                                if (!fair) return null;
                                                return (
                                                    <span className={`mt-2 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                        msg.from === 'customer' ? 'bg-white/15 text-white' : `${fair.bg} ${fair.color}`
                                                    }`}>
                                                        {fair.icon} {fair.label}
                                                    </span>
                                                );
                                            })()}
                                            {msg.from === 'provider' && !agreed && !finalized && !rejected && (
                                                <div className="flex gap-2 mt-3">
                                                    <button onClick={() => handleAccept(msg.price)}
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
                                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.from === 'customer' ? 'bg-[#0F172A] text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
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
    const { currentUser } = useAuth();
    const { requests, getProviders, isSimulated, releasePayment } = useData();
    const [request, setRequest] = useState(null);
    const [interestedProviders, setInterestedProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [negotiatingWith, setNegotiatingWith] = useState(null);
    const [finalizedDeal, setFinalizedDeal] = useState(null); // { price, provider }

    useEffect(() => {
        if (!id) return;
        if (requests.length === 0 && !isSimulated) { setLoading(true); return; }

        const found = requests.find(r => r.id === id);
        const req = found || {
            id,
            title: 'Fix Bathroom Plumbing',
            category: 'Plumbing',
            status: 'negotiating',
            description: 'Pipes under the bathroom sink are leaking and need urgent attention.',
            location: 'Lekki Phase 1, Lagos',
            budget_estimate: 12000,
            agreedPrice: 11000,
            urgency: 'high',
            createdAt: new Date(),
        };

            setRequest(req);
            
        const interested = MOCK_PROVIDERS.slice(0, 3).map((p, i) => ({
            ...p,
            proposed_price: req.agreedPrice || Math.floor(Number(req.budget_estimate || 10000) * (0.85 + i * 0.1)),
            message: [
                "I'm experienced in this and can start immediately!",
                "Great reviews — can complete this efficiently.",
                "Professional work guaranteed. Happy to discuss."
            ][i],
            verified: true,
            phone_number: ['+234-801-234-5678', '+234-802-345-6789', '+234-803-456-7890'][i],
        }));

        if (isSimulated) {
            setInterestedProviders(interested);
        } else {
                getProviders('All').then(allProviders => {
                setInterestedProviders(allProviders.slice(0, 3).map(p => ({
                    ...p,
                    proposed_price: Math.floor(Number(req.budget_estimate || 10000) * (0.85 + Math.random() * 0.3)),
                    message: "I'm interested and would like to discuss the details.",
                    verified: p.provider_profiles?.verification_status === 'verified',
                })));
            }).catch(() => setInterestedProviders(interested));
        }

        setLoading(false);
    }, [id, requests, getProviders, isSimulated]);

    if (loading) return (
            <div className="flex h-screen items-center justify-center bg-white">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#10B981]" />
            </div>
        );

    if (!request) return (
             <div className="flex h-screen items-center justify-center bg-white flex-col gap-4">
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
        <div className="flex h-screen bg-white font-sans text-gray-900">
            <Sidebar />
            
            <main className="flex-1 overflow-hidden flex flex-col min-w-0">
                <TopNavbar breadcrumbs={['Customer', 'My Requests', 'Details']} />

                <div className="flex-1 overflow-y-auto bg-white">
                    <div className="max-w-5xl mx-auto w-full p-4 sm:p-6 md:p-8 pb-24 md:pb-10">

                        {/* Page header */}
                        <div className="mb-10 pb-8 border-b border-gray-100">
                            {/* Category + date row */}
                            <div className="flex items-center gap-2 mb-3">
                                {request.category && (
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{request.category}</span>
                                )}
                                <span className="text-gray-200">·</span>
                                <span className="text-xs text-gray-400">{dateStr}</span>
                                {request.location && (
                                    <>
                                        <span className="text-gray-200">·</span>
                                        <span className="flex items-center gap-0.5 text-xs text-gray-400">
                                            <span className="material-icons-outlined text-sm leading-none">location_on</span>
                                            {request.location}
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

                            {/* Job flow shortcuts — start code & completion */}
                            {(normalizedStatus === 'payment_secured' || normalizedStatus === 'in_progress' || normalizedStatus === 'completed') && (
                                <div className="mt-5 flex flex-wrap items-center gap-2 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                    <span className="text-xs font-semibold text-gray-500 mr-1">Quick actions:</span>
                                    {(normalizedStatus === 'payment_secured' || normalizedStatus === 'in_progress') && (
                                        <Link
                                            to={`/customer/job-otp/${id}`}
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#10B981] bg-white border border-[#10B981]/30 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
                                        >
                                            <span className="material-icons-outlined text-[14px]">vpn_key</span>
                                            {normalizedStatus === 'payment_secured' ? 'Job start code' : 'View / renew job code'}
                                        </Link>
                                    )}
                                    {normalizedStatus === 'completed' && (
                                        <Link
                                            to={`/customer/confirm/${id}`}
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F172A] bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <span className="material-icons-outlined text-[14px]">task_alt</span>
                                            Confirm completion or dispute
                                        </Link>
                                    )}
                                </div>
                            )}

                            {request.description && (
                                <p className="mt-5 text-sm text-gray-500 leading-relaxed max-w-xl">{request.description}</p>
                            )}

                            {/* AI Price Estimator */}
                            {request.category && (() => {
                                const range = getPriceRange(request.category);
                                const label = getSmartPriceLabel(request.title, request.description, request.category);
                                return (
                                    <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl px-3.5 py-2">
                                        <span className="material-icons-outlined text-[16px]">auto_graph</span>
                                        <span className="text-[12px] font-bold">Market rate for described job:</span>
                                        <span className="text-[12px] font-semibold">₦{range.min.toLocaleString()} – ₦{range.max.toLocaleString()}</span>
                                    </div>
                                );
                            })()}
                            </div>

                        {/* Interested providers — hidden once payment is secured (job is booked) */}
                        {normalizedStatus !== 'payment_secured' && (
                            <>
                        {/* Section label */}
                        <div className="mb-6">
                            <h2 className="text-[15px] font-bold text-gray-900 mb-0.5">
                                {finalizedDeal
                                    ? 'Deal agreed'
                                    : interestedProviders.length > 0
                                        ? `${interestedProviders.length} provider${interestedProviders.length !== 1 ? 's' : ''} interested`
                                        : 'Interested Providers'}
                            </h2>
                            <p className="text-xs text-gray-400">
                                {finalizedDeal
                                    ? `Finalised with ${finalizedDeal.provider.full_name} at ₦${Number(finalizedDeal.price).toLocaleString()} — proceed to payment above`
                                    : 'Tap Negotiate to chat and agree on a price'}
                            </p>
                        </div>

                        {/* Provider list — no card, just dividers */}
                        {interestedProviders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-12 h-12 mb-4 bg-gray-50 rounded-full flex items-center justify-center">
                                    <span className="material-icons-outlined text-2xl text-gray-300">people</span>
                                </div>
                                <p className="text-sm font-semibold text-gray-500">No providers yet</p>
                                <p className="text-xs text-gray-400 mt-1">Providers nearby will be notified of your request</p>
                            </div>
                        ) : (
                            <div>
                                {interestedProviders.map((provider, idx) => (
                                    <motion.div
                                        key={provider.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.04 }}
                                        className={`flex items-center gap-4 py-5 ${idx !== 0 ? 'border-t border-gray-100' : ''}`}
                                    >
                                        {/* Avatar */}
                                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                                            {provider.avatar_url
                                                ? <img src={provider.avatar_url} alt={provider.full_name} className="w-full h-full object-cover" />
                                                : <span className="material-icons text-gray-400 text-xl">person</span>}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                                <span className="font-bold text-gray-900 text-[15px] truncate">
                                                    {provider.full_name || provider.displayName}
                                                </span>
                                                {provider.verified && (
                                                    <span className="material-icons text-[#10B981] text-sm shrink-0">verified</span>
                                                )}
                                                <span className="flex items-center gap-0.5 bg-green-50 px-1.5 py-0.5 rounded-md border border-green-100 shrink-0">
                                                    <span className="material-icons-outlined text-[11px] text-[#10B981]">bolt</span>
                                                    <span className="text-[10px] font-bold text-[#10B981]">{getMatchScore(provider, request.category)}% match</span>
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-400">
                                                <span className="truncate">{provider.category || 'General Service'}</span>
                                                <span className="hidden sm:inline text-gray-200">·</span>
                                                <span className="hidden sm:inline truncate">{provider.location || 'Lagos, Nigeria'}</span>
                                                {(provider.provider_profiles?.average_rating || provider.rating) && (
                                                    <span className="flex items-center gap-0.5">
                                                        <span className="material-icons text-yellow-400 text-xs">star</span>
                                                        <span className="font-semibold text-gray-500">
                                                            {(provider.provider_profiles?.average_rating || provider.rating)?.toFixed(1)}
                                                        </span>
                                                    </span>
                                            )}
                                            </div>
                                        </div>

                                        {/* Proposed price */}
                                        <div className="shrink-0 text-right">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none mb-1">Proposed</p>
                                            <p className="text-base font-black text-[#10B981]">
                                                ₦{Number(provider.proposed_price || 0).toLocaleString()}
                                            </p>
                            </div>
                            
                                        {/* Action */}
                                        {finalizedDeal?.provider?.id === provider.id ? (
                                            <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#10B981]/10 text-[#10B981] text-xs font-bold border border-[#10B981]/20">
                                                <span className="material-icons text-sm">check_circle</span>
                                                <span className="hidden sm:inline">Agreed</span>
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => !finalizedDeal && setNegotiatingWith(provider)}
                                                disabled={!!finalizedDeal}
                                                className="shrink-0 h-9 px-4 rounded-xl bg-[#0F172A] hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors flex items-center gap-1.5">
                                                <span className="material-icons text-base">chat</span>
                                                <span className="hidden sm:inline">Negotiate</span>
                                            </button>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        )}
                            </>
                        )}
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
