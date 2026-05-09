import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import TopNavbar from '../../components/layout/TopNavbar';
import CategoryIcon from '../../components/ui/CategoryIcon';

const DEBT_LIMIT = 5000;

const rejectionReasons = ['Price is too low','Schedule conflict','Location is too far','Service not offered','Other'];

/* ─── In-app negotiate panel (provider perspective) ────── */
function NegotiatePanel({ request, onClose }) {
    const { currentUser } = useAuth();
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const [messages, setMessages] = useState([
        {
            id: 1, from: 'system',
            text: `You accepted this job. Send your opening price to start negotiating.`,
            time: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [showPriceInput, setShowPriceInput] = useState(false);
    const [priceOffer, setPriceOffer] = useState('');
    const [agreed, setAgreed] = useState(false);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
    useEffect(() => { inputRef.current?.focus(); }, []);

    const send = (text, extra = {}) => {
        if (!text.trim()) return;
        setMessages(prev => [...prev, { id: Date.now(), from: 'provider', text, time: new Date(), ...extra }]);
        setInput('');

        // Simulate customer reply
        setTimeout(() => {
            const reply = extra.isPriceProposal
                ? `That's a bit high. Would you accept ₦${Math.floor(Number(extra.price) * 0.88).toLocaleString()}?`
                : `Thanks for the update. Let me know if you need anything else.`;
            setMessages(prev => [...prev, {
                id: Date.now() + 1, from: 'customer',
                text: reply, time: new Date(),
                ...(extra.isPriceProposal ? { isPriceProposal: true, price: Math.floor(Number(extra.price) * 0.88) } : {}),
            }]);
        }, 1400);
    };

    const sendPrice = () => {
        if (!priceOffer) return;
        send(`I can do this job for ₦${Number(priceOffer).toLocaleString()}.`, { isPriceProposal: true, price: Number(priceOffer) });
        setShowPriceInput(false);
        setPriceOffer('');
    };

    const handleAcceptCounter = (price) => {
        setAgreed(true);
        toast.success(`Price agreed at ₦${Number(price).toLocaleString()}`);
        setMessages(prev => [...prev, {
            id: Date.now(), from: 'system',
            text: `✓ Price agreed at ₦${Number(price).toLocaleString()}. Await customer payment to begin.`,
            time: new Date(),
        }]);
    };

    const fmt = (d) => format(new Date(d), 'h:mm a');

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 z-40 sm:hidden" onClick={onClose} />

            <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 flex flex-col"
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                        <span className="material-icons text-gray-500 text-xl">arrow_back</span>
                    </button>
                    <div className="w-9 h-9 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {(request.customerName || request.title || 'C')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm leading-tight truncate">
                            {request.customerName || 'Customer'}
                        </p>
                        <p className="text-xs text-[#10B981] font-semibold">Negotiating · {request.title}</p>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
                    {messages.map(msg => (
                        <div key={msg.id}
                            className={`flex ${msg.from === 'provider' ? 'justify-end' : msg.from === 'system' ? 'justify-center' : 'justify-start'}`}>
                            {msg.from === 'system' ? (
                                <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-4 py-2 rounded-full max-w-[85%] text-center leading-relaxed">
                                    {msg.text}
                                </span>
                            ) : (
                                <div className={`max-w-[78%] flex flex-col gap-1 ${msg.from === 'provider' ? 'items-end' : 'items-start'}`}>
                                    {msg.isPriceProposal ? (
                                        <div className={`rounded-2xl px-4 py-3.5 ${msg.from === 'provider'
                                            ? 'bg-[#0F172A] text-white rounded-br-sm'
                                            : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">Price Proposal</p>
                                            <p className="text-xl font-black">₦{Number(msg.price).toLocaleString()}</p>
                                            <p className="text-xs opacity-70 mt-0.5">{msg.text}</p>
                                            {msg.from === 'customer' && !agreed && (
                                                <div className="flex gap-2 mt-3">
                                                    <button onClick={() => handleAcceptCounter(msg.price)}
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
                                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.from === 'provider'
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
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                            className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-2">
                            <div className="flex-1 relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">₦</span>
                                <input type="number" value={priceOffer} onChange={e => setPriceOffer(e.target.value)}
                                    placeholder="Your price" autoFocus
                                    className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] bg-white" />
                            </div>
                            <button onClick={sendPrice} className="h-10 px-4 bg-[#0F172A] text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors">Send</button>
                            <button onClick={() => setShowPriceInput(false)} className="h-10 w-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-100 transition-colors">
                                <span className="material-icons text-lg">close</span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Input bar */}
                <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2 bg-white">
                    <button onClick={() => setShowPriceInput(v => !v)} title="Propose a price"
                        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-[#10B981]">
                        <span className="material-icons text-xl">attach_money</span>
                    </button>
                    <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
                        placeholder="Message…"
                        className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none text-gray-800 placeholder-gray-400" />
                    <button onClick={() => send(input)} disabled={!input.trim()}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-[#0F172A] disabled:opacity-30 text-white hover:bg-slate-700 transition-colors">
                        <span className="material-icons text-[18px]">send</span>
                    </button>
                </div>
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

    const [loading, setLoading] = useState(true);
    const [request, setRequest] = useState(null);
    const [accepted, setAccepted] = useState(false);
    const [negotiating, setNegotiating] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [customReason, setCustomReason] = useState('');

    useEffect(() => {
        if (!id) return;
        const found = jobs.find(j => j.id === id);
        if (found) { setRequest(found); setLoading(false); }
        else {
            setTimeout(() => {
                const retry = jobs.find(j => j.id === id);
                if (retry) setRequest(retry);
                else {
                    // Demo fallback so the page is always testable
                    setRequest({
                        id, title: 'Fix Kitchen Sink Leak', category: 'Plumbing',
                        status: 'Open', description: 'The pipe under the kitchen sink is leaking heavily and needs urgent attention. Water is pooling under the cabinet.',
                        location: 'Lekki Phase 1, Lagos', customerName: 'Adaeze Okafor',
                        budget_estimate: 12000, urgency: 'high',
                        createdAt: new Date(),
                    });
                }
                setLoading(false);
            }, 600);
        }
    }, [id, jobs]);

    const isRestricted = (currentUser?.commissionBalance || 0) > DEBT_LIMIT;

    const handleAccept = async () => {
        if (isRestricted) { toast.error(`Clear your ₦${DEBT_LIMIT.toLocaleString()} commission balance to accept jobs.`); return; }
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
        ? format(request.createdAt, 'MMM dd, yyyy')
        : request.created_at ? new Date(request.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Recently';

    const normalizedStatus = String(request.status || 'open').toLowerCase();
    const statusColors = {
        open: 'bg-blue-50 text-blue-700 border-blue-100',
        pending: 'bg-amber-50 text-amber-700 border-amber-100',
        in_progress: 'bg-purple-50 text-purple-700 border-purple-100',
        completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    };
    const statusColor = statusColors[normalizedStatus] || 'bg-gray-100 text-gray-600 border-gray-200';

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
                                    <textarea className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] outline-none text-sm mt-2 resize-none"
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

            <main className="flex-1 overflow-hidden flex flex-col min-w-0">
                <TopNavbar breadcrumbs={['Job Requests', 'Details']} />

                <div className="flex-1 overflow-y-auto bg-white">
                    <div className="max-w-[860px] mx-auto w-full px-4 sm:px-8 py-6 sm:py-10 pb-24 md:pb-10">

                        {/* Header */}
                        <div className="mb-10 pb-8 border-b border-gray-100">
                            {/* Category + meta */}
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
                                {request.title || 'Service Request'}
                            </h1>

                            {/* Status + actions row */}
                            <div className="flex flex-wrap items-center gap-3">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg border font-bold text-xs ${accepted ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' : statusColor}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 shrink-0" />
                                    {accepted ? 'Accepted' : (request.status || 'Open')}
                                </span>

                                {(request.urgency === 'high' || request.urgency === 'High') && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border font-bold text-xs bg-red-50 text-red-600 border-red-100">
                                        <span className="material-icons text-sm">priority_high</span>
                                        Urgent
                                    </span>
                                )}

                                {!accepted ? (
                                    <>
                                        <button onClick={handleAccept} disabled={isRestricted}
                                            className="inline-flex items-center gap-2 bg-[#0F172A] hover:bg-slate-700 text-white font-bold text-sm px-5 py-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
                                            <span className="material-icons text-base">check_circle</span>
                                            Accept Job
                                        </button>
                                        <button onClick={() => setShowRejectModal(true)}
                                            className="inline-flex items-center gap-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold text-sm px-5 py-2 rounded-xl transition-colors">
                                            Decline
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => setNegotiating(true)}
                                        className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-sm px-5 py-2 rounded-xl transition-all shadow-sm shadow-green-500/20">
                                        <span className="material-icons text-base">chat</span>
                                        Open Negotiation Chat
                                    </button>
                                )}
                            </div>

                            {/* Description */}
                            {request.description && (
                                <p className="mt-5 text-sm text-gray-500 leading-relaxed max-w-xl">{request.description}</p>
                            )}
                        </div>

                        {/* Request meta — clean list */}
                        <div className="mb-8">
                            <h2 className="text-[15px] font-bold text-gray-900 mb-1">Job Details</h2>
                            <p className="text-xs text-gray-400 mb-5">Review all details before accepting</p>

                            <div>
                                {[
                                    { icon: 'handyman', label: 'Category', value: request.category || 'General Service' },
                                    { icon: 'location_on', label: 'Location', value: request.location || 'Not specified' },
                                    { icon: 'schedule', label: 'Posted', value: dateStr },
                                    ...(request.scheduledDate ? [{ icon: 'event', label: 'Scheduled For', value: new Date(request.scheduledDate + 'T00:00:00').toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }] : []),
                                    { icon: 'person', label: 'Customer', value: request.customerName || 'Anonymous' },
                                ].map((item, idx, arr) => (
                                    <div key={item.label} className={`flex items-center gap-4 py-3.5 ${idx !== arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                        <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                                            <span className="material-icons-outlined text-gray-400 text-base">{item.icon}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{item.label}</p>
                                            <p className="text-sm font-semibold text-gray-900 truncate">{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Accepted nudge */}
                        {accepted && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                className="rounded-2xl bg-[#10B981]/5 border border-[#10B981]/20 px-5 py-4 flex items-start gap-4">
                                <span className="material-icons text-[#10B981] text-xl mt-0.5 shrink-0">check_circle</span>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Job accepted successfully</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Open the negotiation chat to send your price proposal to the customer.</p>
                                    <button onClick={() => setNegotiating(true)}
                                        className="mt-3 inline-flex items-center gap-1.5 bg-[#0F172A] hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
                                        <span className="material-icons text-sm">chat</span>
                                        Start Negotiation
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {isRestricted && (
                            <div className="mt-6 rounded-2xl bg-red-50 border border-red-100 px-5 py-4 flex items-start gap-3">
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

            {/* Negotiate slide-over */}
            <AnimatePresence>
                {negotiating && (
                    <NegotiatePanel request={request} onClose={() => setNegotiating(false)} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default RequestDetails;
