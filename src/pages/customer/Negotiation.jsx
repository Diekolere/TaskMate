import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { supabase } from '../../lib/supabase';
import Sidebar from '../../components/layout/Sidebar';
import TopNavbar from '../../components/layout/TopNavbar';
import MobileNavBar from '../../components/layout/MobileNavBar';

const Negotiation = () => {
    const { id } = useParams();
    const { currentUser } = useAuth();
    const {
        requests,
        jobs,
        messages: liveMessages,
        fetchMessages,
        sendMessage: sendLiveMessage,
        finalizeAgreement,
        sendNotification,
    } = useData();
    const navigate = useNavigate();

    const [job, setJob] = useState(null);
    const [otherUser, setOtherUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [proposedBudget, setProposedBudget] = useState('');
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [finalBudget, setFinalBudget] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    // Load job from context or directly from DB
    useEffect(() => {
        const allJobs = [...requests, ...jobs];
        const foundJob = allJobs.find(j => j.id === id);
        if (foundJob) {
            setJob(foundJob);
            setLoading(false);
        } else {
            supabase.from('jobs').select('*').eq('id', id).single().then(({ data, error }) => {
                if (data) setJob(data);
                else { toast.error('Job not found'); navigate('/customer/dashboard'); }
                setLoading(false);
            });
        }
    }, [id, requests, jobs, navigate]);

    // Load the other party's profile (the provider for customer view)
    useEffect(() => {
        if (!job) return;
        const otherId = job.worker_id;
        if (!otherId) return;
        supabase.from('profiles')
            .select('id, full_name, avatar_url, phone_number')
            .eq('id', otherId)
            .single()
            .then(({ data }) => { if (data) setOtherUser(data); });
    }, [job]);

    // Fetch messages on mount
    useEffect(() => {
        if (id) fetchMessages(id);
    }, [id, fetchMessages]);

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Map live messages to display format
    useEffect(() => {
        const filtered = liveMessages.filter(m => m.job_id === id);
        setMessages(filtered.map(m => ({
            id: m.id,
            sender_id: m.sender_id,
            isMe: m.sender_id === currentUser?.id,
            message: m.message,
            timestamp: new Date(m.created_at),
            type: m.type,
            budget: m.metadata?.budget,
        })));
    }, [liveMessages, id, currentUser?.id]);

    const sendMessage = useCallback(async () => {
        const text = newMessage.trim();
        if (!text || sending) return;
        setSending(true);
        try {
            await sendLiveMessage(id, text, 'text');
            setNewMessage('');
            // Notify provider of new message
            const targetId = job?.worker_id;
            if (targetId && targetId !== currentUser.id) {
                await sendNotification(targetId, {
                    type: 'message',
                    title: 'New Message',
                    body: `${currentUser.full_name}: "${text.substring(0, 60)}${text.length > 60 ? '…' : ''}"`,
                    icon: 'chat',
                    iconBg: 'bg-blue-100',
                    iconColor: 'text-blue-600',
                    ctaPath: `/provider/negotiate/${id}`,
                });
            }
        } finally {
            setSending(false);
        }
    }, [newMessage, sending, sendLiveMessage, id, job, currentUser, sendNotification]);

    const proposeBudget = useCallback(async () => {
        if (!proposedBudget || isNaN(proposedBudget)) { toast.error('Enter a valid amount'); return; }
        const amount = Number(proposedBudget);
        await sendLiveMessage(id, `I propose ₦${amount.toLocaleString()} for this job.`, 'budget_proposal', { budget: amount });
        setProposedBudget('');
        // Notify provider
        const targetId = job?.worker_id;
        if (targetId && targetId !== currentUser.id) {
            await sendNotification(targetId, {
                type: 'job_update',
                title: 'Customer Proposed a Budget',
                body: `${currentUser.full_name} proposed ₦${amount.toLocaleString()} for "${job?.title}"`,
                icon: 'payments',
                iconBg: 'bg-purple-100',
                iconColor: 'text-purple-600',
                ctaPath: `/provider/negotiate/${id}`,
            });
        }
    }, [proposedBudget, sendLiveMessage, id, job, currentUser, sendNotification]);

    const handleAcceptOffer = async () => {
        if (!finalBudget || isNaN(finalBudget)) { toast.error('Enter the agreed budget'); return; }
        try {
            await finalizeAgreement(id, Number(finalBudget));
            toast.success('Agreement finalized! Proceed to payment.');
            navigate(`/customer/payment/${id}`);
        } catch { toast.error('Failed to finalize agreement'); }
        setShowAcceptModal(false);
    };

    const getStatusBadge = (status) => {
        const cfg = {
            provider_accepted: { text: 'Provider Accepted', color: 'bg-blue-50 text-blue-700 border-blue-100' },
            negotiating: { text: 'Negotiating', color: 'bg-amber-50 text-amber-700 border-amber-100' },
            awaiting_payment: { text: 'Awaiting Payment', color: 'bg-purple-50 text-purple-700 border-purple-100' },
            payment_secured: { text: 'Payment Secured', color: 'bg-green-50 text-green-700 border-green-100' },
        }[status] || { text: status, color: 'bg-gray-50 text-gray-700 border-gray-100' };
        return <span className={`px-3 py-1 text-xs font-bold rounded-xl border uppercase tracking-wide ${cfg.color}`}>{cfg.text}</span>;
    };

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <span className="material-icons-outlined animate-spin text-3xl text-[#10B981]">progress_activity</span>
        </div>
    );

    if (!job) return (
        <div className="min-h-screen bg-white flex items-center justify-center flex-col gap-3">
            <p className="text-gray-500 text-sm">Job not found</p>
            <button onClick={() => navigate(-1)} className="text-[#10B981] font-bold hover:underline text-sm">← Go Back</button>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-white font-sans text-gray-900">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopNavbar breadcrumbs={['Negotiation']} />

                <main className="flex-1 overflow-y-auto relative p-4 sm:p-6 lg:p-10 pb-24 md:pb-10">
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-8">
                            <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm text-gray-500 hover:text-[#10B981] mb-4 transition-colors font-bold">
                                <span className="material-icons-outlined text-lg mr-1">arrow_back</span>
                                Back
                            </button>
                            <div className="flex flex-wrap justify-between items-start gap-4">
                                <div>
                                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Negotiation</h1>
                                    <p className="mt-2 text-gray-500 font-medium">Discuss details for "{job.title}"</p>
                                </div>
                                {getStatusBadge(job.status)}
                            </div>
                        </div>

                        {/* Provider Info Card */}
                        {otherUser && (
                            <div className="mb-8 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-100 p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden flex items-center justify-center border-2 border-white shadow-sm">
                                            {otherUser.avatar_url
                                                ? <img src={otherUser.avatar_url} alt={otherUser.full_name} className="w-full h-full object-cover" />
                                                : <span className="material-icons text-2xl text-gray-400">person</span>}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">{otherUser.full_name}</h3>
                                            <p className="text-sm text-gray-500">Service Provider</p>
                                        </div>
                                    </div>
                                    {otherUser.phone_number && (
                                        <a
                                            href={`tel:${otherUser.phone_number}`}
                                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl transition-colors"
                                        >
                                            <span className="material-icons">call</span>
                                            Call Now
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Task Summary */}
                            <div className="lg:col-span-1">
                                <div className="bg-white shadow-sm rounded-3xl overflow-hidden border border-gray-100 sticky top-6">
                                    <div className="p-6">
                                        <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
                                            <span className="material-icons-outlined text-[#10B981]">assignment</span>
                                            <h2 className="text-lg font-bold text-gray-900">Task Summary</h2>
                                        </div>
                                        <div className="space-y-4 mt-4">
                                            {[
                                                { label: 'Title', value: job.title },
                                                { label: 'Category', value: job.category },
                                                { label: 'Location', value: job.location_name },
                                                { label: 'Original Budget', value: `₦${Number(job.budget_estimate || 0).toLocaleString()}`, bold: true },
                                                { label: 'Urgency', value: job.urgency || 'Medium' },
                                            ].map(({ label, value, bold }) => (
                                                <div key={label}>
                                                    <p className="text-sm font-bold text-gray-700">{label}</p>
                                                    <p className={`text-sm text-gray-600 capitalize ${bold ? 'text-xl font-bold text-[#10B981]' : ''}`}>{value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Live Chat Area */}
                            <div className="lg:col-span-2">
                                <div className="bg-white shadow-sm rounded-3xl overflow-hidden border border-gray-100 flex flex-col" style={{ minHeight: '520px' }}>
                                    {/* Header */}
                                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                                        <span className="text-sm font-bold text-gray-700">Live Negotiation Chat</span>
                                    </div>

                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4" style={{ maxHeight: '380px' }}>
                                        {messages.length === 0 && (
                                            <div className="text-center py-16 text-gray-400">
                                                <span className="material-icons-outlined text-4xl mb-2 block opacity-30">chat_bubble_outline</span>
                                                <p className="text-sm font-medium">No messages yet. Say hello!</p>
                                            </div>
                                        )}
                                        <AnimatePresence initial={false}>
                                            {messages.map((msg) => (
                                                <motion.div
                                                    key={msg.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl ${msg.isMe ? 'bg-[#10B981] text-white' : 'bg-gray-100 text-gray-900'}`}>
                                                        {msg.type === 'budget_proposal' && (
                                                            <p className="text-xs font-bold opacity-70 mb-0.5 uppercase tracking-wide">💰 Budget Proposal</p>
                                                        )}
                                                        <p className="text-sm">{msg.message}</p>
                                                        <p className="text-xs opacity-50 mt-1">
                                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Input */}
                                    <div className="p-4 sm:p-6 border-t border-gray-100 space-y-3">
                                        {/* Budget Proposal */}
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">₦</span>
                                                <input
                                                    type="number"
                                                    value={proposedBudget}
                                                    onChange={e => setProposedBudget(e.target.value)}
                                                    placeholder="Propose new budget..."
                                                    className="block w-full rounded-xl border-gray-200 pl-8 focus:border-[#10B981] focus:ring-4 focus:ring-green-50 sm:text-sm py-3 px-4 border focus:outline-none transition-all"
                                                />
                                            </div>
                                            <button onClick={proposeBudget} className="px-6 py-3 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-bold rounded-xl transition-all">Propose</button>
                                        </div>

                                        {/* Text Message */}
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={e => setNewMessage(e.target.value)}
                                                onKeyPress={e => e.key === 'Enter' && sendMessage()}
                                                placeholder="Type your message..."
                                                className="flex-1 rounded-xl border-gray-200 focus:border-[#10B981] focus:ring-4 focus:ring-green-50 sm:text-sm py-3 px-4 border focus:outline-none transition-all"
                                            />
                                            <button
                                                onClick={sendMessage}
                                                disabled={sending || !newMessage.trim()}
                                                className="px-6 py-3 bg-gray-900 hover:bg-gray-700 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition-all"
                                            >
                                                {sending ? '…' : 'Send'}
                                            </button>
                                        </div>

                                        {/* Accept Final Offer (customer only) */}
                                        {(job.status === 'negotiating' || job.status === 'provider_accepted') && (
                                            <div className="pt-2 border-t border-gray-100">
                                                <button
                                                    onClick={() => setShowAcceptModal(true)}
                                                    className="w-full py-3.5 border border-transparent shadow-xl shadow-green-600/20 text-sm font-bold rounded-xl text-white bg-[#10B981] hover:bg-[#059669] transition-all"
                                                >
                                                    ✓ Accept Final Offer & Proceed to Payment
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Accept Modal */}
                <AnimatePresence>
                    {showAcceptModal && (
                        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAcceptModal(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl z-10">
                                <div className="flex items-start justify-between mb-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Accept Final Offer</h3>
                                        <p className="text-sm text-gray-500 mt-0.5">Confirm the agreed budget to proceed to payment.</p>
                                    </div>
                                    <button onClick={() => setShowAcceptModal(false)} className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
                                        <span className="material-icons-outlined text-lg">close</span>
                                    </button>
                                </div>
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Final Agreed Budget (₦)</label>
                                        <input
                                            type="number"
                                            value={finalBudget}
                                            onChange={e => setFinalBudget(e.target.value)}
                                            placeholder="Enter agreed amount"
                                            className="block w-full rounded-xl border-gray-200 focus:border-[#10B981] focus:ring-4 focus:ring-green-50 sm:text-sm py-3 px-4 border focus:outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowAcceptModal(false)} className="flex-1 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                                    <button onClick={handleAcceptOffer} className="flex-1 py-3 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-green-600/20">Confirm Agreement</button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <MobileNavBar />
            </div>
        </div>
    );
};

export default Negotiation;
