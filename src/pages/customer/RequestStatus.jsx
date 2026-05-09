import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/layout/Sidebar';
import TopNavbar from '../../components/layout/TopNavbar';
import MobileNavBar from '../../components/layout/MobileNavBar';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useData } from '../../context/DataContext';
import { MOCK_PROVIDERS } from '../../lib/mocks';

const RequestStatus = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { requests, getProviders, isSimulated, releasePayment } = useData();
    const [request, setRequest] = useState(null);
    const [interestedProviders, setInterestedProviders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id || requests.length === 0) {
             if (requests.length === 0 && !isSimulated) setLoading(true);
             else setLoading(false);
             return;
        }
        
        const req = requests.find(r => r.id === id);
        if (req) {
            setRequest(req);
            
            // Load interested providers from mock data
            if (isSimulated) {
                // In simulation, show 3 random providers as interested
                const interested = MOCK_PROVIDERS.slice(0, 3).map(p => ({
                    ...p,
                    proposed_price: Math.floor(Number(req.budget_estimate || 10000) * (0.85 + Math.random() * 0.3)),
                    message: [
                        "I'm experienced in this service and can start immediately!",
                        "I have great reviews and can complete this efficiently.",
                        "Professional work guaranteed. Happy to discuss your needs."
                    ][Math.floor(Math.random() * 3)],
                    verified: true,
                    phone_number: ['+234-801-234-5678', '+234-802-345-6789', '+234-803-456-7890'][Math.floor(Math.random() * 3)]
                }));
                setInterestedProviders(interested);
            } else {
                // In real mode, fetch from database
                getProviders('All').then(allProviders => {
                    const interested = allProviders.slice(0, 3).map(p => ({
                        ...p,
                        proposed_price: Math.floor(Number(req.budget_estimate || 10000) * (0.85 + Math.random() * 0.3)),
                        message: "I'm interested in your request and would like to discuss the details.",
                        verified: p.provider_profiles?.verification_status === 'verified'
                    }));
                    setInterestedProviders(interested);
                }).catch(err => console.error("Error fetching providers:", err));
            }
        }
        setLoading(false);
    }, [id, requests, getProviders, isSimulated]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#10B981]"></div>
            </div>
        );
    }

    if (!request) {
        return (
             <div className="flex h-screen items-center justify-center bg-white flex-col gap-4">
                <p className="text-gray-500 font-bold">Request not found.</p>
                <button onClick={() => navigate('/customer/dashboard')} className="text-[#10B981] font-bold hover:underline">Back to Dashboard</button>
            </div>
        );
    }
    
    const dateStr = request.createdAt instanceof Date ? format(request.createdAt, 'MMM dd, yyyy h:mm a') : 'Just now';

    const normalizedStatus = String(request.status || '').toLowerCase();
    const releaseEnabled = normalizedStatus === 'completed';

    const getFriendlyStatus = (status) => {
        switch (String(status).toLowerCase()) {
            case 'open': return 'Open Request';
            case 'interested': return 'Providers Interested';
            case 'negotiating': return 'Negotiating';
            case 'awaiting_payment': return 'Awaiting Payment';
            case 'payment_secured': return 'Payment Secured';
            case 'payment_released': return 'Payment Released';
            case 'completed': return 'Completed';
            default: return status;
        }
    };

    const getStatusBadgeColor = (status) => {
        switch (String(status).toLowerCase()) {
            case 'open': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'interested': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'negotiating': return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'awaiting_payment': return 'bg-orange-50 text-orange-700 border-orange-100';
            case 'payment_secured': return 'bg-green-50 text-green-700 border-green-100';
            case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    const handleRelease = async () => {
        try {
            await releasePayment(id);
            toast.success('Payment released to provider successfully!');
            setRequest(prev => ({ ...prev, status: 'payment_released' }));
        } catch (error) {
            toast.error('Failed to release payment.');
        }
    };

    const handleCallProvider = (phoneNumber) => {
        if (phoneNumber) {
            window.location.href = `tel:${phoneNumber}`;
        }
    };

    const handleNegotiate = (providerId, providerName) => {
        navigate(`/customer/negotiation/${id}?provider=${providerId}`);
    };

    return (
        <div className="flex h-screen bg-white font-sans text-gray-900">
            <Sidebar />
            
            <main className="flex-1 overflow-hidden flex flex-col min-w-0">
                <TopNavbar breadcrumbs={['Customer', 'My Requests', 'Request Details']} />

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 pb-24 md:pb-10 bg-white">
                    <div className="max-w-6xl mx-auto">
                        {/* Header */}
                        <div className="mb-10">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                                        {request.title}
                                    </h1>
                                    <p className="mt-1.5 text-[12px] sm:text-sm font-medium text-gray-500">
                                        Order ID: <span className="font-bold text-gray-700">#{request.id.slice(0, 8).toUpperCase()}</span> • Placed on {dateStr}
                                    </p>
                                </div>
                                <div className={`px-4 py-2 rounded-full border font-bold text-sm ${getStatusBadgeColor(request.status)}`}>
                                    {getFriendlyStatus(request.status)}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main Content - Providers List */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Status Message */}
                                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-100 p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
                                            <span className="material-icons text-blue-600 text-xl">info</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-sm">Providers Interested</h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {interestedProviders.length > 0 
                                                    ? `${interestedProviders.length} provider${interestedProviders.length !== 1 ? 's' : ''} interested in your request. Click "Negotiate" to start discussing terms directly with any provider.`
                                                    : "No providers interested yet. Check back soon!"
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Providers Cards */}
                                <div className="space-y-4">
                                    <AnimatePresence mode="popLayout">
                                        {interestedProviders.length === 0 ? (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="text-center py-12"
                                            >
                                                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <span className="material-icons-outlined text-3xl text-gray-400">people</span>
                                                </div>
                                                <p className="text-gray-500 font-medium">No providers interested yet</p>
                                            </motion.div>
                                        ) : (
                                            interestedProviders.map((provider, idx) => (
                                                <motion.div
                                                    key={provider.id}
                                                    initial={{ opacity: 0, y: 16 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#10B981]/30 transition-all overflow-hidden"
                                                >
                                                    <div className="p-6 flex flex-col sm:flex-row gap-6">
                                                        {/* Provider Avatar */}
                                                        <div className="w-20 h-20 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden border-2 border-gray-50 flex items-center justify-center">
                                                            {provider.avatar_url ? (
                                                                <img src={provider.avatar_url} alt={provider.full_name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="material-icons text-3xl text-gray-400">person</span>
                                                            )}
                                                        </div>

                                                        {/* Provider Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                                <div>
                                                                    <h3 className="text-lg font-bold text-gray-900">
                                                                        {provider.full_name || provider.displayName}
                                                                    </h3>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <div className="flex items-center gap-1 text-yellow-500">
                                                                            <span className="material-icons text-sm">star</span>
                                                                            <span className="font-bold text-sm text-gray-900">
                                                                                {provider.provider_profiles?.average_rating?.toFixed(1) || 'New'}
                                                                            </span>
                                                                        </div>
                                                                        {provider.verified && (
                                                                            <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold">
                                                                                <span className="material-icons text-xs">verified</span>
                                                                                Verified
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right flex-shrink-0">
                                                                    <p className="text-xs text-gray-500 font-medium mb-1">Proposed Price</p>
                                                                    <p className="text-2xl font-black text-[#10B981]">
                                                                        ₦{Number(provider.proposed_price || 0).toLocaleString()}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Message */}
                                                            <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                                                                "{provider.message}"
                                                            </p>

                                                            {/* Phone Number */}
                                                            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Contact</p>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="material-icons text-gray-400 text-sm">phone</span>
                                                                    <p className="text-sm font-bold text-gray-900">{provider.phone_number}</p>
                                                                </div>
                                                            </div>

                                                            {/* Action Buttons */}
                                                            <div className="flex flex-col sm:flex-row gap-3 mt-4">
                                                                <button
                                                                    onClick={() => handleCallProvider(provider.phone_number)}
                                                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                                                >
                                                                    <span className="material-icons text-base">call</span>
                                                                    Call
                                                                </button>
                                                                <button
                                                                    onClick={() => handleNegotiate(provider.id, provider.full_name)}
                                                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-[#10B981] hover:bg-[#059669] transition-colors flex-1 sm:flex-none"
                                                                >
                                                                    <span className="material-icons text-base">chat</span>
                                                                    Negotiate
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Sidebar - Request Details */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-[#0F172A] rounded-3xl shadow-lg border border-gray-800 p-8">
                                    <h2 className="text-xl font-extrabold text-white mb-6 tracking-tight flex items-center gap-2">
                                        <span className="material-icons-outlined text-[#10B981]">assignment</span>
                                        Request Details
                                    </h2>
                                    <dl className="grid grid-cols-1 gap-y-6">
                                        <div className="border-b border-gray-800 pb-4">
                                            <dt className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Service Type</dt>
                                            <dd className="text-[14px] font-extrabold text-white">{request.category}</dd>
                                        </div>
                                        <div className="border-b border-gray-800 pb-4">
                                            <dt className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Your Budget</dt>
                                            <dd className="text-[18px] font-black text-white">₦{Number(request.budget_estimate || request.budget || 0).toLocaleString()}</dd>
                                        </div>
                                        <div className="border-b border-gray-800 pb-4">
                                            <dt className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description</dt>
                                            <dd className="text-[13px] font-medium text-gray-300 mt-1 leading-relaxed">
                                                {request.description}
                                            </dd>
                                        </div>
                                        <div className="border-b border-gray-800 pb-4">
                                            <dt className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Location</dt>
                                            <dd className="text-[13px] font-bold text-white flex items-start mt-1">
                                                <span className="material-icons-outlined text-[#10B981] mr-1.5 text-[16px]">location_on</span>
                                                {request.location_name || 'No location provided'}
                                            </dd>
                                        </div>
                                        {request.image && (
                                            <div>
                                                <dt className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Attachment</dt>
                                                <dd>
                                                    <img src={request.image} alt="Request attachment" className="w-full object-cover rounded-xl border border-gray-700 shadow-sm opacity-90" />
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>

                                <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <span className="material-icons-outlined text-[#10B981] text-2xl">security</span>
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-[13px] font-extrabold text-green-900">Pro Tip</h3>
                                            <div className="mt-1.5 text-[12px] font-medium text-green-800 leading-relaxed">
                                                <p>You can call or negotiate directly with any interested provider. Choose the one you're most comfortable with!</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <MobileNavBar />
            </main>
        </div>
    );
};

export default RequestStatus;
