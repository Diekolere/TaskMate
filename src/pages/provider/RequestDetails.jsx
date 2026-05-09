import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import TopNavbar from '../../components/layout/TopNavbar';

const DEBT_LIMIT = 5000;

const rejectionReasons = [
    'Price is too low',
    'Schedule conflict',
    'Location is too far',
    'Service not offered',
    'Other',
];

const RequestDetails = () => {
    const { id } = useParams();
    const { currentUser } = useAuth();
    const { jobs, isSimulated } = useData();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [request, setRequest] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [customReason, setCustomReason] = useState('');

    useEffect(() => {
        if (!id) return;
        const found = jobs.find(j => j.id === id);
        if (found) {
            setRequest(found);
            setLoading(false);
        } else {
            setTimeout(() => {
                const retry = jobs.find(j => j.id === id);
                if (retry) setRequest(retry);
                else { toast.error('Request not found'); navigate('/provider/requests'); }
                setLoading(false);
            }, 800);
        }
    }, [id, jobs, navigate]);

    const isRestricted = (currentUser?.commissionBalance || 0) > DEBT_LIMIT;

    const handleAccept = async () => {
        if (!currentUser) return;
        if (isRestricted) {
            toast.error('Account Restricted', { description: `Clear your commission debt of ₦${DEBT_LIMIT.toLocaleString()} to accept jobs.` });
            return;
        }
        try {
            if (isSimulated) await new Promise(r => setTimeout(r, 600));
            toast.success('Job Accepted!', { description: "Find it in 'My Jobs'." });
            navigate('/provider/jobs');
        } catch {
            toast.error('Failed to accept job');
        }
    };

    const handleDecline = async () => {
        if (!rejectReason) { toast.error('Please select a reason'); return; }
        if (rejectReason === 'Other' && !customReason) { toast.error('Please specify a reason'); return; }
        try {
            if (isSimulated) await new Promise(r => setTimeout(r, 600));
            toast.success('Job Declined');
            setShowRejectModal(false);
            navigate('/provider/requests');
        } catch {
            toast.error('Failed to decline job');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <span className="material-icons-outlined animate-spin text-3xl text-[#10B981]">progress_activity</span>
        </div>
    );

    if (!request) return (
        <div className="min-h-screen bg-white flex items-center justify-center flex-col gap-3">
            <p className="text-gray-500 text-sm">Request not found</p>
            <Link to="/provider/requests" className="text-[#10B981] font-bold hover:underline text-sm">← Back to Requests</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-white flex font-sans">
            <ProviderSidebar />

            {/* Decline Modal */}
            <AnimatePresence>
                {showRejectModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowRejectModal(false)}
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
                                    <h3 className="text-lg font-bold text-gray-900">Decline Request</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">Help the customer by sharing why you can't accept.</p>
                                </div>
                                <button onClick={() => setShowRejectModal(false)} className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
                                    <span className="material-icons-outlined text-lg">close</span>
                                </button>
                            </div>

                            <div className="space-y-2 mb-6">
                                {rejectionReasons.map(reason => (
                                    <label key={reason} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                                        rejectReason === reason ? 'border-[#10B981] bg-[#10B981]/5' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="rejectReason"
                                            value={reason}
                                            checked={rejectReason === reason}
                                            onChange={e => setRejectReason(e.target.value)}
                                            className="accent-[#10B981] w-4 h-4 shrink-0"
                                        />
                                        <span className="text-sm font-semibold text-gray-800">{reason}</span>
                                    </label>
                                ))}
                                {rejectReason === 'Other' && (
                                    <textarea
                                        className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] outline-none text-sm mt-2 resize-none"
                                        placeholder="Please specify…"
                                        rows="3"
                                        value={customReason}
                                        onChange={e => setCustomReason(e.target.value)}
                                    />
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setShowRejectModal(false)} className="flex-1 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleDecline} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20">
                                    Decline Job
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopNavbar breadcrumbs={['Job Requests', 'Request Details']} />

                <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
                    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
                            {/* Main Content */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                    <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                                        <h2 className="text-xl font-bold text-gray-900">
                                            {request.title || 'Service Request'}
                                        </h2>
                                        <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-xl border border-amber-100 uppercase tracking-wide">
                                            {request.status || 'Open'}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
                                        <span className="flex items-center gap-1.5">
                                            <span className="material-icons-outlined text-base">schedule</span>
                                            {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'Recently'}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="material-icons-outlined text-base">location_on</span>
                                            {request.location_name || 'Remote / TBD'}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm mb-2">Description</h3>
                                        <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            {request.description || 'No description provided.'}
                                        </p>
                                    </div>

                                    {request.images && request.images.length > 0 && (
                                        <div className="mt-5 grid grid-cols-2 gap-3">
                                            {request.images.map((img, idx) => (
                                                <div key={idx} className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
                                                    <img src={img} alt={`Job ${idx}`} className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Card */}
                            <div className="space-y-5">
                                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm lg:sticky lg:top-24">
                                    {/* Budget */}
                                    <div className="text-center pb-5 mb-5 border-b border-gray-100">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Estimated Budget</p>
                                        <p className="text-4xl font-bold text-[#10B981]">
                                            ₦{Number(request.budget_estimate || 0).toLocaleString()}
                                        </p>
                                    </div>

                                    {/* Customer Info */}
                                    <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl mb-5">
                                        <div className="w-10 h-10 bg-[#0F172A] text-white rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                                            {(request.customer_id || 'C')[0].toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-900">Customer</p>
                                            <p className="text-xs text-gray-400">ID: {String(request.customer_id || 'Unknown').substring(0, 8)}</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="space-y-3">
                                        <button
                                            onClick={handleAccept}
                                            disabled={isRestricted}
                                            className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                                                isRestricted
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'bg-[#0F172A] text-white hover:bg-slate-700 shadow-lg shadow-slate-900/10'
                                            }`}
                                        >
                                            {isRestricted ? 'Account Restricted' : 'Accept Job'}
                                        </button>
                                        <button
                                            onClick={() => setShowRejectModal(true)}
                                            className="w-full py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold rounded-xl transition-colors"
                                        >
                                            Decline Request
                                        </button>
                                    </div>

                                    {isRestricted && (
                                        <p className="text-xs text-red-500 text-center mt-3 leading-snug">
                                            Clear your ₦{DEBT_LIMIT.toLocaleString()} commission debt to accept new jobs.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
            </div>

            <ProviderMobileNavBar />
        </div>
    );
};

export default RequestDetails;
