import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Sidebar from '../../components/layout/Sidebar';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import TopNavbar from '../../components/layout/TopNavbar';
import MobileNavBar from '../../components/layout/MobileNavBar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';

const Negotiation = () => {
    const { id } = useParams();
    const { currentUser } = useAuth();
    const {
        requests,
        jobs,
        startNegotiation,
        finalizeAgreement,
        isSimulated
    } = useData();
    const navigate = useNavigate();

    const [job, setJob] = useState(null);
    const [provider, setProvider] = useState(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [proposedBudget, setProposedBudget] = useState('');
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [finalBudget, setFinalBudget] = useState('');
    const messagesEndRef = useRef(null);

    const isCustomer = currentUser?.role === 'customer';
    const isProvider = currentUser?.role === 'provider';

    useEffect(() => {
        const allJobs = [...requests, ...jobs];
        const foundJob = allJobs.find(j => j.id === id);
        if (foundJob) {
            setJob(foundJob);
            
            // Load provider info for negotiation
            if (isSimulated && isCustomer) {
                // Mock provider for customer
                setProvider({
                    id: 'mock-provider-1',
                    full_name: 'Ibrahim Musa',
                    avatar_url: 'https://i.pravatar.cc/150?u=p1',
                    rating: 4.8,
                    phone_number: '+234-801-234-5678',
                    verified: true
                });
            }
            
            setLoading(false);
            // Start negotiation if not already started
            if ((foundJob.status === 'provider_accepted' || foundJob.status === 'interested') && isCustomer) {
                startNegotiation(id);
            }
        } else {
            setTimeout(() => {
                const retry = allJobs.find(j => j.id === id);
                if (retry) {
                    setJob(retry);
                    if (isSimulated && isCustomer) {
                        setProvider({
                            id: 'mock-provider-1',
                            full_name: 'Ibrahim Musa',
                            avatar_url: 'https://i.pravatar.cc/150?u=p1',
                            rating: 4.8,
                            phone_number: '+234-801-234-5678',
                            verified: true
                        });
                    }
                    if ((retry.status === 'provider_accepted' || retry.status === 'interested') && isCustomer) {
                        startNegotiation(id);
                    }
                } else {
                    toast.error('Job not found');
                    navigate(isCustomer ? '/customer/dashboard' : '/provider/jobs');
                }
                setLoading(false);
            }, 800);
        }
    }, [id, requests, jobs, isCustomer, startNegotiation, navigate, isSimulated]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Mock messages for demo
    useEffect(() => {
        if (job && isSimulated) {
            setMessages([
                {
                    id: 1,
                    sender: isCustomer ? 'provider' : 'customer',
                    message: `Hi! I'm interested in your ${job.title} request.`,
                    timestamp: new Date(Date.now() - 3600000),
                    type: 'text'
                },
                {
                    id: 2,
                    sender: isCustomer ? 'provider' : 'customer',
                    message: `I can do this for ₦${job.budget_estimate || 'negotiable'}.`,
                    timestamp: new Date(Date.now() - 1800000),
                    type: 'budget_proposal',
                    budget: job.budget_estimate
                }
            ]);
        }
    }, [job, isCustomer, isSimulated]);

    const sendMessage = () => {
        if (!newMessage.trim()) return;

        const message = {
            id: Date.now(),
            sender: isCustomer ? 'customer' : 'provider',
            message: newMessage,
            timestamp: new Date(),
            type: 'text'
        };

        setMessages(prev => [...prev, message]);
        setNewMessage('');
    };

    const proposeBudget = () => {
        if (!proposedBudget || isNaN(proposedBudget)) {
            toast.error('Please enter a valid budget amount');
            return;
        }

        const message = {
            id: Date.now(),
            sender: isCustomer ? 'customer' : 'provider',
            message: `I propose ₦${Number(proposedBudget).toLocaleString()} for this job.`,
            timestamp: new Date(),
            type: 'budget_proposal',
            budget: Number(proposedBudget)
        };

        setMessages(prev => [...prev, message]);
        setProposedBudget('');
    };

    const handleAcceptOffer = async () => {
        if (!finalBudget || isNaN(finalBudget)) {
            toast.error('Please enter the agreed budget amount');
            return;
        }

        try {
            await finalizeAgreement(id, Number(finalBudget));
            toast.success('Agreement finalized! Proceeding to payment.');
            navigate(`/customer/payment/${id}`);
        } catch (error) {
            toast.error('Failed to finalize agreement');
        }
        setShowAcceptModal(false);
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            provider_accepted: { text: 'Provider Accepted', color: 'bg-blue-50 text-blue-700 border-blue-100' },
            negotiating: { text: 'Negotiating', color: 'bg-amber-50 text-amber-700 border-amber-100' },
            awaiting_payment: { text: 'Awaiting Payment', color: 'bg-purple-50 text-purple-700 border-purple-100' },
            payment_secured: { text: 'Payment Secured', color: 'bg-green-50 text-green-700 border-green-100' }
        };
        const config = statusConfig[status] || { text: status, color: 'bg-gray-50 text-gray-700 border-gray-100' };
        return (
            <span className={`px-3 py-1 text-xs font-bold rounded-xl border uppercase tracking-wide ${config.color}`}>
                {config.text}
            </span>
        );
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

    const SidebarComponent = isCustomer ? Sidebar : ProviderSidebar;
    const MobileNavComponent = isCustomer ? MobileNavBar : ProviderMobileNavBar;

    return (
        <div className="flex min-h-screen bg-white font-sans text-gray-900">
            <SidebarComponent />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopNavbar breadcrumbs={['Negotiation']} />

                <main className="flex-1 overflow-y-auto relative p-4 sm:p-6 lg:p-10 pb-24 md:pb-10">
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-8">
                            <button
                                onClick={() => navigate(-1)}
                                className="inline-flex items-center text-sm text-gray-500 hover:text-[#10B981] mb-4 transition-colors font-bold"
                            >
                                <span className="material-icons-outlined text-lg mr-1">arrow_back</span>
                                Back
                            </button>
                            <div className="flex flex-wrap justify-between items-start gap-4">
                                <div>
                                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                                        Negotiation
                                    </h1>
                                    <p className="mt-2 text-gray-500 font-medium">
                                        Discuss details and agree on final terms for "{job.title}"
                                    </p>
                                </div>
                                {getStatusBadge(job.status)}
                            </div>
                        </div>

                        {/* Provider Info Bar */}
                        {isCustomer && provider && (
                            <div className="mb-8 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-100 p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden flex items-center justify-center border-2 border-white shadow-sm">
                                            {provider.avatar_url ? (
                                                <img src={provider.avatar_url} alt={provider.full_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="material-icons text-2xl text-gray-400">person</span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">{provider.full_name}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <div className="flex items-center gap-1 text-yellow-500">
                                                    <span className="material-icons text-sm">star</span>
                                                    <span className="font-bold text-sm text-gray-900">{Number(provider.rating || 0).toFixed(1)}</span>
                                                </div>
                                                {provider.verified && (
                                                    <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold">
                                                        <span className="material-icons text-xs">verified</span>
                                                        Verified
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                <span className="material-icons text-base text-blue-600">phone</span>
                                                {provider.phone_number}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => window.location.href = `tel:${provider.phone_number}`}
                                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl transition-colors"
                                    >
                                        <span className="material-icons">call</span>
                                        Call Now
                                    </button>
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
                                            <div>
                                                <p className="text-sm font-bold text-gray-700">Title</p>
                                                <p className="text-sm text-gray-600">{job.title}</p>
                                            </div>

                                            <div>
                                                <p className="text-sm font-bold text-gray-700">Category</p>
                                                <p className="text-sm text-gray-600">{job.category}</p>
                                            </div>

                                            <div>
                                                <p className="text-sm font-bold text-gray-700">Location</p>
                                                <p className="text-sm text-gray-600">{job.location_name}</p>
                                            </div>

                                            <div>
                                                <p className="text-sm font-bold text-gray-700">Original Budget</p>
                                                <p className="text-xl font-bold text-[#10B981]">
                                                    ₦{Number(job.budget_estimate || 0).toLocaleString()}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-sm font-bold text-gray-700">Urgency</p>
                                                <p className="text-sm text-gray-600 capitalize">{job.urgency || 'Medium'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div className="lg:col-span-2">
                                <div className="bg-white shadow-sm rounded-3xl overflow-hidden border border-gray-100">
                                    {/* Messages */}
                                    <div className="h-[50vh] min-h-[300px] max-h-[440px] overflow-y-auto p-4 sm:p-6 space-y-4">
                                        <AnimatePresence>
                                            {messages.map((msg) => (
                                                <motion.div
                                                    key={msg.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={`flex ${msg.sender === (isCustomer ? 'customer' : 'provider') ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                                                        msg.sender === (isCustomer ? 'customer' : 'provider')
                                                            ? 'bg-[#10B981] text-white'
                                                            : 'bg-gray-100 text-gray-900'
                                                    }`}>
                                                        <p className="text-sm">{msg.message}</p>
                                                        <p className="text-xs opacity-70 mt-1">
                                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Message Input */}
                                    <div className="p-4 sm:p-6 border-t border-gray-100">
                                        <div className="space-y-4">
                                            {/* Budget Proposal */}
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <div className="flex-1 relative">
                                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                                        <span className="text-gray-500 font-bold sm:text-sm">₦</span>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        value={proposedBudget}
                                                        onChange={(e) => setProposedBudget(e.target.value)}
                                                        placeholder="Propose new budget..."
                                                        className="block w-full rounded-xl border-gray-200 pl-8 focus:border-[#10B981] focus:ring-4 focus:ring-green-50 sm:text-sm py-3 px-4 border focus:outline-none transition-all"
                                                    />
                                                </div>
                                                <button
                                                    onClick={proposeBudget}
                                                    className="w-full sm:w-auto px-6 py-3 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-bold rounded-xl transition-all"
                                                >
                                                    Propose
                                                </button>
                                            </div>

                                            {/* Text Message */}
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <input
                                                    type="text"
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                                    placeholder="Type your message..."
                                                    className="flex-1 rounded-xl border-gray-200 focus:border-[#10B981] focus:ring-4 focus:ring-green-50 sm:text-sm py-3 px-4 border focus:outline-none transition-all"
                                                />
                                                <button
                                                    onClick={sendMessage}
                                                    className="w-full sm:w-auto px-6 py-3 bg-gray-900 hover:bg-gray-700 text-white text-sm font-bold rounded-xl transition-all"
                                                >
                                                    Send
                                                </button>
                                            </div>

                                            {/* Accept Final Offer */}
                                            {job.status === 'negotiating' && (
                                                <div className="pt-4 border-t border-gray-100">
                                                    <button
                                                        onClick={() => setShowAcceptModal(true)}
                                                        className="w-full py-3.5 border border-transparent shadow-xl shadow-green-600/20 text-sm font-bold rounded-xl text-white bg-[#10B981] hover:bg-[#059669] transition-all"
                                                    >
                                                        Accept Final Offer
                                                    </button>
                                                </div>
                                            )}
                                        </div>
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
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowAcceptModal(false)}
                                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl z-10"
                            >
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
                                            onChange={(e) => setFinalBudget(e.target.value)}
                                            placeholder="Enter agreed amount"
                                            className="block w-full rounded-xl border-gray-200 focus:border-[#10B981] focus:ring-4 focus:ring-green-50 sm:text-sm py-3 px-4 border focus:outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={() => setShowAcceptModal(false)} className="flex-1 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
                                        Cancel
                                    </button>
                                    <button onClick={handleAcceptOffer} className="flex-1 py-3 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-green-600/20">
                                        Confirm Agreement
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <MobileNavComponent />
            </div>
        </div>
    );
};

export default Negotiation;
