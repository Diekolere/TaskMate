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

/* ─── Negotiate slide-over panel ───────────────────────── */
function NegotiatePanel({ provider, requestId, onClose }) {
    const { currentUser } = useAuth();
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const [messages, setMessages] = useState([
        {
            id: 1, from: 'provider',
            text: `Hi! I've reviewed your request and I'm ready to help.`,
            time: new Date(Date.now() - 900000),
        },
        {
            id: 2, from: 'provider',
            text: `I can complete this job for ₦${Number(provider.proposed_price || 12000).toLocaleString()}.`,
            time: new Date(Date.now() - 840000),
            isPriceProposal: true,
            price: provider.proposed_price || 12000,
        },
    ]);
    const [input, setInput] = useState('');
    const [showPriceInput, setShowPriceInput] = useState(false);
    const [priceOffer, setPriceOffer] = useState('');
    const [agreed, setAgreed] = useState(false);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const send = (text, extra = {}) => {
        if (!text.trim()) return;
        setMessages(prev => [...prev, {
            id: Date.now(), from: 'customer',
            text, time: new Date(), ...extra,
        }]);
        setInput('');

        // Mock provider reply
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: Date.now() + 1, from: 'provider',
                text: extra.isPriceProposal
                    ? `That works for me! Let's go ahead.`
                    : `Got it — I'll be there right on time.`,
                time: new Date(),
            }]);
        }, 1200);
    };

    const sendPrice = () => {
        if (!priceOffer) return;
        send(`I'd like to propose ₦${Number(priceOffer).toLocaleString()} for this job.`, {
            isPriceProposal: true, price: Number(priceOffer),
        });
        setShowPriceInput(false);
        setPriceOffer('');
    };

    const handleAccept = (price) => {
        setAgreed(true);
        toast.success(`Deal agreed at ₦${Number(price).toLocaleString()} — proceed to payment.`);
        setMessages(prev => [...prev, {
            id: Date.now(), from: 'system',
            text: `✓ Price agreed at ₦${Number(price).toLocaleString()}. Proceed to payment.`,
            time: new Date(),
        }]);
    };

    const fmt = (d) => format(new Date(d), 'h:mm a');

    return (
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 z-40 sm:hidden"
                onClick={onClose}
            />

            {/* Panel */}
            <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 flex flex-col safe-top"
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                        <span className="material-icons text-gray-500 text-xl">arrow_back</span>
                    </button>
                    <Link to={`/customer/provider/${provider.id}`} className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center shrink-0 hover:ring-2 hover:ring-[#10B981]/40 transition-all">
                        {provider.avatar_url
                            ? <img src={provider.avatar_url} alt={provider.full_name} className="w-full h-full object-cover" />
                            : <span className="material-icons text-gray-400 text-xl">person</span>}
                    </Link>
                    <div className="flex-1 min-w-0">
                        <Link to={`/customer/provider/${provider.id}`} className="font-bold text-gray-900 text-sm leading-tight truncate hover:text-[#10B981] transition-colors block">
                            {provider.full_name || provider.displayName}
                        </Link>
                        <p className="text-xs text-[#10B981] font-semibold">Online · Negotiating</p>
                    </div>
                    <a href={`tel:${provider.phone_number}`}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                        <span className="material-icons text-gray-500 text-xl">call</span>
                    </a>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
                    {messages.map(msg => (
                        <div key={msg.id}
                            className={`flex ${msg.from === 'customer' ? 'justify-end' : msg.from === 'system' ? 'justify-center' : 'justify-start'}`}>
                            {msg.from === 'system' ? (
                                <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-4 py-2 rounded-full max-w-[85%] text-center">
                                    {msg.text}
                                </span>
                            ) : (
                                <div className={`max-w-[78%] ${msg.from === 'customer' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                    {msg.isPriceProposal ? (
                                        <div className={`rounded-2xl px-4 py-3.5 ${msg.from === 'customer'
                                            ? 'bg-[#0F172A] text-white rounded-br-sm'
                                            : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">
                                                Price Proposal
                                            </p>
                                            <p className="text-xl font-black">₦{Number(msg.price).toLocaleString()}</p>
                                            <p className="text-xs opacity-70 mt-0.5">{msg.text}</p>
                                            {msg.from === 'provider' && !agreed && (
                                                <div className="flex gap-2 mt-3">
                                                    <button
                                                        onClick={() => handleAccept(msg.price)}
                                                        className="flex-1 bg-[#10B981] text-white text-xs font-bold py-2 rounded-xl hover:bg-[#059669] transition-colors">
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => setShowPriceInput(true)}
                                                        className="flex-1 bg-white text-gray-700 border border-gray-200 text-xs font-bold py-2 rounded-xl hover:bg-gray-50 transition-colors">
                                                        Counter
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.from === 'customer'
                                            ? 'bg-[#0F172A] text-white rounded-br-sm'
                                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
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

                {/* Counter-price input */}
                <AnimatePresence>
                    {showPriceInput && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                            className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-2">
                            <div className="flex-1 relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">₦</span>
                                <input
                                    type="number"
                                    value={priceOffer}
                                    onChange={e => setPriceOffer(e.target.value)}
                                    placeholder="Your counter offer"
                                    className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] bg-white"
                                />
                            </div>
                            <button onClick={sendPrice}
                                className="h-10 px-4 bg-[#0F172A] text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors">
                                Send
                            </button>
                            <button onClick={() => setShowPriceInput(false)}
                                className="h-10 w-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-100 transition-colors">
                                <span className="material-icons text-lg">close</span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Input bar */}
                <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2 bg-white">
                    <button
                        onClick={() => setShowPriceInput(v => !v)}
                        title="Propose a price"
                        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-[#10B981]">
                        <span className="material-icons text-xl">attach_money</span>
                    </button>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
                        placeholder="Message…"
                        className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none text-gray-800 placeholder-gray-400"
                    />
                    <button
                        onClick={() => send(input)}
                        disabled={!input.trim()}
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

    useEffect(() => {
        if (!id || requests.length === 0) {
            if (requests.length === 0 && !isSimulated) setLoading(true);
            else setLoading(false);
            return;
        }
        const req = requests.find(r => r.id === id);
        if (req) {
            setRequest(req);
            if (isSimulated) {
                const interested = MOCK_PROVIDERS.slice(0, 3).map(p => ({
                    ...p,
                    proposed_price: Math.floor(Number(req.budget_estimate || 10000) * (0.85 + Math.random() * 0.3)),
                    message: [
                        "I'm experienced in this and can start immediately!",
                        "Great reviews — can complete this efficiently.",
                        "Professional work guaranteed. Happy to discuss."
                    ][Math.floor(Math.random() * 3)],
                    verified: true,
                    phone_number: ['+234-801-234-5678', '+234-802-345-6789', '+234-803-456-7890'][Math.floor(Math.random() * 3)],
                }));
                setInterestedProviders(interested);
            } else {
                getProviders('All').then(allProviders => {
                    const interested = allProviders.slice(0, 3).map(p => ({
                        ...p,
                        proposed_price: Math.floor(Number(req.budget_estimate || 10000) * (0.85 + Math.random() * 0.3)),
                        message: "I'm interested and would like to discuss the details.",
                        verified: p.provider_profiles?.verification_status === 'verified',
                    }));
                    setInterestedProviders(interested);
                }).catch(console.error);
            }
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
    const canPay = ['accepted', 'confirmed', 'negotiating', 'awaiting_payment'].includes(normalizedStatus);

    const STATUS_LABEL = { open: 'Open', interested: 'Providers Interested', negotiating: 'Negotiating', awaiting_payment: 'Awaiting Payment', payment_secured: 'Payment Secured', payment_released: 'Payment Released', completed: 'Completed' };
    const STATUS_COLOR = { open: 'bg-blue-50 text-blue-700 border-blue-100', interested: 'bg-amber-50 text-amber-700 border-amber-100', negotiating: 'bg-purple-50 text-purple-700 border-purple-100', awaiting_payment: 'bg-orange-50 text-orange-700 border-orange-100', payment_secured: 'bg-green-50 text-green-700 border-green-100', completed: 'bg-emerald-50 text-emerald-700 border-emerald-100' };

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
                    <div className="max-w-[860px] mx-auto w-full px-4 sm:px-8 py-6 sm:py-10 pb-24 md:pb-10">

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

                            {/* Title */}
                            <h1 className="text-2xl sm:text-[32px] font-black tracking-tight text-gray-900 leading-tight mb-4">
                                {request.title}
                            </h1>

                            {/* Status + CTA row */}
                            <div className="flex flex-wrap items-center gap-3">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg border font-bold text-xs ${STATUS_COLOR[normalizedStatus] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 shrink-0" />
                                    {STATUS_LABEL[normalizedStatus] || request.status}
                                </span>

                                {canPay && (
                                    <button
                                        onClick={() => navigate(`/customer/payment/${request.id}`)}
                                        className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-sm px-5 py-2 rounded-xl transition-all shadow-sm shadow-green-500/20">
                                        <span className="material-icons text-base">lock</span>
                                        Proceed to Payment
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

                            {request.description && (
                                <p className="mt-4 text-sm text-gray-500 leading-relaxed max-w-xl">{request.description}</p>
                            )}
                        </div>

                        {/* Section label */}
                        <div className="mb-4">
                            <h2 className="text-[15px] font-bold text-gray-900">
                                {interestedProviders.length > 0
                                    ? `${interestedProviders.length} provider${interestedProviders.length !== 1 ? 's' : ''} interested`
                                    : 'Interested Providers'}
                            </h2>
                            {interestedProviders.length > 0 && (
                                <p className="text-xs text-gray-400 mt-0.5">Tap Negotiate to chat and agree on a price</p>
                            )}
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
                                        className={`flex items-center gap-3 py-4 ${idx !== 0 ? 'border-t border-gray-100' : ''}`}
                                    >
                                        {/* Avatar */}
                                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                                            {provider.avatar_url
                                                ? <img src={provider.avatar_url} alt={provider.full_name} className="w-full h-full object-cover" />
                                                : <span className="material-icons text-gray-400 text-xl">person</span>}
                                        </div>

                                        {/* Info — grows, truncates cleanly */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1 mb-0.5">
                                                <span className="font-bold text-gray-900 text-[14px] sm:text-[15px] truncate">
                                                    {provider.full_name || provider.displayName}
                                                </span>
                                                {provider.verified && (
                                                    <span className="material-icons text-[#10B981] text-sm shrink-0">verified</span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-gray-400">
                                                <span className="truncate">{provider.category || 'General Service'}</span>
                                                <span className="hidden sm:inline">·</span>
                                                <span className="hidden sm:inline">{provider.location || 'Lagos, Nigeria'}</span>
                                                {(provider.provider_profiles?.average_rating || provider.rating) && (
                                                    <span className="flex items-center gap-0.5">
                                                        <span className="material-icons text-yellow-400 text-[11px]">star</span>
                                                        <span className="font-semibold text-gray-500">
                                                            {(provider.provider_profiles?.average_rating || provider.rating)?.toFixed(1)}
                                                        </span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Proposed price — visible on all screens */}
                                        <div className="shrink-0 text-right">
                                            <p className="text-[9px] sm:text-[10px] text-gray-400 font-semibold uppercase tracking-wider leading-none mb-0.5">Proposed</p>
                                            <p className="text-sm sm:text-base font-black text-[#10B981]">
                                                ₦{Number(provider.proposed_price || 0).toLocaleString()}
                                            </p>
                                        </div>

                                        {/* Action */}
                                        <button
                                            onClick={() => setNegotiatingWith(provider)}
                                            className="shrink-0 h-9 px-3 sm:px-4 rounded-xl bg-[#0F172A] hover:bg-slate-700 text-white text-sm font-bold transition-colors flex items-center gap-1.5">
                                            <span className="material-icons text-base">chat</span>
                                            <span className="hidden sm:inline">Negotiate</span>
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
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
                        onClose={() => setNegotiatingWith(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default RequestStatus;
