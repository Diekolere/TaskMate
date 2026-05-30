import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { supabase } from '../../lib/supabase';
import VoiceRecorder from '../ui/VoiceRecorder';
import AudioPlayer from '../ui/AudioPlayer';
import RejectionModal from '../ui/RejectionModal';

const NairaSVG = ({ className = 'w-4 h-4' }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M6 4v16M18 4v16" />
        <path d="M6 4l12 16" />
        <line x1="4" y1="9" x2="20" y2="9" />
        <line x1="4" y1="15" x2="20" y2="15" />
    </svg>
);

export default function ProviderNegotiationDrawer({ job, onClose }) {
    const { currentUser } = useAuth();
    const { messages: allMessages, fetchMessages, sendMessage, deleteMessage, finalizeAgreement, reopenNegotiation } = useData();
    const messagesEndRef = useRef(null);

    const [input, setInput] = useState('');
    const [showPriceInput, setShowPriceInput] = useState(false);
    const [priceOffer, setPriceOffer] = useState('');
    const [showFinalizeInput, setShowFinalizeInput] = useState(false);
    const [finalizePrice, setFinalizePrice] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [finalized, setFinalized] = useState(false);
    const [rejected, setRejected] = useState(false);
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [customerProfile, setCustomerProfile] = useState(null);

    useEffect(() => {
        const fetchCustomer = async () => {
            const targetId = job?.customer_id || job?.customerId;
            if (!targetId) return;
            const { data } = await supabase.from('profiles').select('*').eq('id', targetId).single();
            if (data) setCustomerProfile(data);
        };
        fetchCustomer();
    }, [job?.customer_id, job?.customerId]);

    // Filter messages for this specific job AND this specific provider thread
    const seen = new Set();
    const messages = allMessages
        .filter(message => {
            // Must match job ID
            if (message.job_id !== job.id) return false;
            
            // For providers:
            // 1. Message's provider_id matches my ID (Standard thread isolation)
            // 2. OR message's provider_id is NULL AND I am the primary worker (Private requests)
            const isTargetedProvider = message.provider_id === currentUser?.id;
            const isPrivateThread = !message.provider_id && job.worker_id === currentUser?.id;
            
            return isTargetedProvider || isPrivateThread;
        })
        .filter((message) => {
            const key = message.id || `${message.sender_id}-${message.created_at}-${message.message}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

    useEffect(() => {
        if (!job?.id || !currentUser?.id) return;
        fetchMessages(job.id, currentUser.id);
    }, [job?.id, currentUser?.id, fetchMessages]);

    // Sync state with message history
    useEffect(() => {
        const lastStatus = [...messages].reverse().find(m => m.type === 'system' && (m.message.includes('Job finalised') || m.message.includes('Price agreed') || m.message.includes('Provider rejected') || m.message.includes('reopened negotiation') || m.message.includes('Customer rejected')));
        if (lastStatus) {
            if (lastStatus.message.includes('Job finalised') || lastStatus.message.includes('Price agreed')) { setFinalized(true); setRejected(false); }
            else if (lastStatus.message.includes('rejected')) { setRejected(true); setFinalized(false); }
            else { setFinalized(false); setRejected(false); }
        }
    }, [messages.length]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    const formatTime = (value) => {
        try {
            return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return 'Now';
        }
    };

    const sendText = async () => {
        const text = input.trim();
        if (!text) return;
        await sendMessage(job.id, text, 'text', {}, currentUser.id);
        setInput('');
    };

    const sendProposal = async () => {
        const amount = Number(priceOffer);
        if (!amount) return;
        await sendMessage(job.id, `I propose ₦${amount.toLocaleString()} for this job.`, 'price_proposal', { price: amount }, currentUser.id);
        setPriceOffer('');
        setShowPriceInput(false);
    };

    const handleAccept = async (price) => {
        const agreedPrice = Number(price);
        if (!agreedPrice) return;
        setAgreed(true);
        await finalizeAgreement(job.id, agreedPrice);
        await sendMessage(job.id, `Price agreed at ₦${agreedPrice.toLocaleString()}. Proceed to payment.`, 'system', {}, currentUser.id);
    };

    const submitFinalize = async () => {
        const amount = Number(finalizePrice);
        if (!amount) return;
        setShowFinalizeInput(false);
        setFinalizePrice('');
        await sendMessage(job.id, `Provider sent a finalise request at ₦${amount.toLocaleString()}.`, 'finalize_request', { finalizePrice: amount }, currentUser.id);
    };

    const confirmFinalize = async (price) => {
        const agreedPrice = Number(price);
        if (!agreedPrice) return;
        setFinalized(true);
        await finalizeAgreement(job.id, agreedPrice);
        await sendMessage(job.id, `Job finalised at ₦${agreedPrice.toLocaleString()}. Awaiting customer payment.`, 'system', {}, currentUser.id);
    };

    const declineFinalize = async () => {
        await sendMessage(job.id, 'Provider declined the finalise request. Negotiation continues.', 'system', {}, currentUser.id);
    };

    const handleReject = () => {
        setShowRejectionModal(true);
    };

    const submitRejection = async (reason) => {
        setRejected(true);
        setShowRejectionModal(false);
        await sendMessage(job.id, `Provider rejected the offer. Reason: ${reason}`, 'system', {}, currentUser.id);
    };

    const handleRenegotiate = async () => {
        setFinalized(false);
        setRejected(false);
        setAgreed(false);
        await reopenNegotiation(job.id, 'provider', customerProfile?.id || job.customer_id, job.title, currentUser.full_name || currentUser.displayName);
        await sendMessage(job.id, 'Provider reopened negotiation.', 'system', {}, currentUser.id);
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 z-[140]"
                onClick={onClose}
            />

            <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-[150] flex flex-col"
            >
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 shrink-0">
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                        <span className="material-icons text-gray-500 text-xl">arrow_back</span>
                    </button>
                    <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                        {customerProfile?.avatar_url || job.customerPhoto
                            ? <img src={customerProfile?.avatar_url || job.customerPhoto} alt={customerProfile?.full_name || job.customerName || 'Customer'} className="w-full h-full object-cover" />
                            : <span className="material-icons text-gray-400 text-xl">person</span>
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm leading-tight truncate">{customerProfile?.full_name || job.customerName || 'Customer'}</p>
                        <p className={`text-[11px] font-bold ${finalized ? 'text-[#10B981]' : rejected ? 'text-red-500' : 'text-[#10B981]'}`}>
                            {finalized ? 'Finalised' : rejected ? 'Rejected' : 'Online · Negotiating'}
                        </p>
                    </div>
                    <a href={`tel:${customerProfile?.phone_number || job.customerPhone}`} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0">
                        <span className="material-icons text-gray-500 text-xl">call</span>
                    </a>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                            <span className="material-icons-outlined text-4xl mb-2 opacity-30">chat_bubble_outline</span>
                            <p className="text-sm font-medium">No messages yet. Start the negotiation.</p>
                        </div>
                    )}

                    {messages.map((message, index) => {
                        const isMe = message.sender_id === currentUser?.id;
                        const isSystem = message.type === 'system';
                        const price = Number(message.metadata?.price || message.metadata?.proposed_price || message.metadata?.budget || message.price || 0);
                        const isProposal = message.type === 'price_proposal' || message.type === 'budget_proposal';
                        const finalizeRequestPrice = Number(message.metadata?.finalizePrice || 0);
                        const isFinalizeRequest = message.type === 'finalize_request' || finalizeRequestPrice > 0;

                        return (
                            <div key={`${message.id || 'message'}-${message.created_at || index}`} className={`flex w-full ${isSystem ? 'justify-center' : isMe ? 'justify-end' : 'justify-start'}`}>
                                {isSystem ? (
                                    message.message.includes('rejected') ? (
                                        <span className="bg-red-50 text-red-500 text-[11px] font-semibold px-4 py-2 rounded-full max-w-[85%] text-center leading-relaxed">
                                            {message.message}
                                        </span>
                                    ) : (
                                        <span className="bg-gray-100 text-gray-500 text-[11px] font-semibold px-4 py-2 rounded-full max-w-[85%] text-center leading-relaxed">
                                            {message.message}
                                        </span>
                                    )
                                ) : !isMe && isFinalizeRequest ? (
                                    <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3.5 max-w-[85%]">
                                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-1.5">Finalise Request</p>
                                        <p className="text-sm text-gray-800 mb-3">{message.message}</p>
                                        {!finalized && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => confirmFinalize(finalizeRequestPrice)}
                                                    className="flex-1 bg-[#10B981] text-white text-xs font-bold py-2 rounded-xl hover:bg-[#059669] transition-colors"
                                                >
                                                    Yes, Confirm
                                                </button>
                                                <button
                                                    onClick={declineFinalize}
                                                    className="flex-1 bg-white text-gray-600 border border-gray-200 text-xs font-bold py-2 rounded-xl hover:bg-gray-50 transition-colors"
                                                >
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
                                                <p className="text-xl font-black mb-0.5">₦{price.toLocaleString()}</p>
                                                <p className="text-xs opacity-60">{message.message}</p>
                                                {!isMe && !agreed && !finalized && !rejected && (
                                                    <div className="flex gap-2 mt-3">
                                                        <button
                                                            onClick={() => handleAccept(price)}
                                                            className="flex-1 bg-[#10B981] text-white text-xs font-bold py-2 rounded-xl hover:bg-[#059669] transition-colors"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setShowPriceInput(true);
                                                                setShowFinalizeInput(false);
                                                            }}
                                                            className="flex-1 bg-white text-gray-700 border border-gray-200 text-xs font-bold py-2 rounded-xl hover:bg-gray-50 transition-colors"
                                                        >
                                                            Counter
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ) : message.type === 'voice' ? (
                                            <div className="relative group/msg w-full flex justify-end">
                                                {isMe && !isFinalizeRequest && !isSystem && (
                                                    <button onClick={() => deleteMessage(message.id)} className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full sm:flex hidden">
                                                        <span className="material-icons-outlined text-sm">delete</span>
                                                    </button>
                                                )}
                                                <div className={`px-4 py-2.5 rounded-2xl ${isMe ? 'bg-[#0F172A] text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                                                    <AudioPlayer src={message.metadata?.audioUrl} durationProp={message.metadata?.duration} isMe={isMe} />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative group/msg w-full flex justify-end">
                                                {isMe && !isFinalizeRequest && !isSystem && (
                                                    <button onClick={() => deleteMessage(message.id)} className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full sm:flex hidden">
                                                        <span className="material-icons-outlined text-sm">delete</span>
                                                    </button>
                                                )}
                                                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-[#0F172A] text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                                                    {message.message}
                                                </div>
                                            </div>
                                        )}
                                        <span className="text-[10px] text-gray-400 px-1">{formatTime(message.created_at)}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <AnimatePresence>
                    {(showPriceInput || showFinalizeInput) && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                            className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-2 shrink-0"
                        >
                            <span className="text-gray-400 shrink-0"><NairaSVG className="w-4 h-4" /></span>
                            <input
                                type="number"
                                autoFocus
                                value={showFinalizeInput ? finalizePrice : priceOffer}
                                onChange={(e) => showFinalizeInput ? setFinalizePrice(e.target.value) : setPriceOffer(e.target.value)}
                                placeholder={showFinalizeInput ? 'Finalise at...' : 'Your counter offer'}
                                className="flex-1 pl-1 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] bg-white"
                            />
                            <button
                                onClick={showFinalizeInput ? submitFinalize : sendProposal}
                                className="h-10 px-4 bg-[#0F172A] text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors"
                            >
                                Send
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* Glassmorphic Finalise / Reject bar */}
                {(!finalized && !rejected && !agreed) ? (
                    <div className="flex shrink-0 border-t border-gray-100 overflow-hidden">
                        <button onClick={() => { setShowFinalizeInput(true); setShowPriceInput(false); }}
                            className="flex-1 py-3 text-sm font-bold text-emerald-600 bg-emerald-500/[0.07] backdrop-blur-sm hover:bg-emerald-500/[0.14] transition-colors">
                            Finalise
                        </button>
                        <div className="w-px bg-gray-200 shrink-0" />
                        <button onClick={handleReject}
                            className="flex-1 py-3 text-sm font-bold text-red-500 bg-red-500/[0.07] backdrop-blur-sm hover:bg-red-500/[0.14] transition-colors">
                            Reject
                        </button>
                    </div>
                ) : (
                    <div className="flex shrink-0 border-t border-gray-100 overflow-hidden">
                        <button onClick={handleRenegotiate}
                            className="flex-1 py-3 text-sm font-bold text-amber-600 bg-amber-500/[0.07] backdrop-blur-sm hover:bg-amber-500/[0.14] transition-colors">
                            Renegotiate
                        </button>
                    </div>
                )}

                <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2 bg-white shrink-0 relative">
                    {/* We replace the Naira icon with the VoiceRecorder */}
                    <div className="shrink-0 flex items-center justify-center">
                        <VoiceRecorder 
                            onVoiceRecorded={async (audioUrl, duration) => {
                                await sendMessage(job.id, 'Voice note', 'voice', { audioUrl, duration }, currentUser.id);
                            }} 
                        />
                    </div>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendText()}
                        placeholder="Message..."
                        className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none text-gray-800 placeholder-gray-400"
                    />
                    <button
                        onClick={sendText}
                        disabled={!input.trim()}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-[#0F172A] disabled:opacity-30 text-white hover:bg-slate-700 transition-colors shrink-0"
                    >
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
