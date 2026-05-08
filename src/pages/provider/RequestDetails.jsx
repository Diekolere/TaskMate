import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import Breadcrumbs from '../../components/ui/Breadcrumbs';

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

    const rejectionReasons = [
        "Price is too low",
        "Schedule conflict",
        "Location is too far",
        "Service not offered",
        "Other"
    ];

    useEffect(() => {
        if (!id) return;
        
        // Find the job from context
        const foundJob = jobs.find(j => j.id === id);
        if (foundJob) {
            setRequest(foundJob);
            setLoading(false);
        } else {
            // Simulate network delay if not found immediately (could be fetching)
            setTimeout(() => {
                const retryJob = jobs.find(j => j.id === id);
                if (retryJob) {
                    setRequest(retryJob);
                } else {
                    toast.error("Request not found");
                    navigate('/provider/requests');
                }
                setLoading(false);
            }, 1000);
        }
    }, [id, jobs, navigate]);

    const handleDecline = async () => {
        if (!currentUser) return;
        if (!rejectReason) {
            toast.error("Please select a reason");
            return;
        }

        const finalReason = rejectReason === 'Other' ? customReason : rejectReason;
        if (rejectReason === 'Other' && !customReason) {
            toast.error("Please specify the reason");
            return;
        }
        
        try {
            if (isSimulated) {
                await new Promise(resolve => setTimeout(resolve, 800));
            } else {
                // Here you would call a backend function or supabase to decline
                // await supabase.from('jobs').update({ status: 'declined', ... }).eq('id', id);
            }
            
            toast.success("Job Declined");
            setShowRejectModal(false);
            navigate(`/provider/requests`);
        } catch (error) {
            console.error("Error declining job:", error);
            toast.error("Failed to decline job");
        }
    };
    
    if (loading) return (
        <div className="min-h-screen bg-cream flex font-sans text-charcoal items-center justify-center">
             <span className="material-icons animate-spin text-4xl text-lime-dark">autorenew</span>
        </div>
    );
    
    if (!request) return <div className="p-8 text-center text-charcoal">Request not found</div>;

    const breadcrumbItems = [
        { label: 'Dashboard', href: '/provider/dashboard' },
        { label: 'Requests', href: '/provider/requests' },
        { label: `View Request #${String(request.id).substring(0,6)}`, href: '#' }
    ];

    const DEBT_LIMIT = 5000;
    const isRestricted = (currentUser?.commissionBalance || 0) > DEBT_LIMIT;

    const handleAccept = async () => {
        if (!currentUser) return;
        
        if (isRestricted) {
            toast.error("Account Restricted", {
                description: `You have exceeded the commission debt limit of ₦${DEBT_LIMIT.toLocaleString()}. Please clear your debt to accept new jobs.`
            });
            return;
        }
        
        try {
            if (isSimulated) {
                await new Promise(resolve => setTimeout(resolve, 800));
            } else {
                // await supabase.from('jobs').update({ status: 'scheduled', worker_id: currentUser.id }).eq('id', id);
            }

            toast.success("Job Accepted!", {
                 description: "You can find this job in 'My Jobs'."
            });
            navigate(`/provider/jobs`);
        } catch (error) {
            console.error("Error accepting job:", error);
            toast.error("Failed to accept job");
        }
    };

    return (
        <div className="min-h-screen bg-cream flex font-sans text-charcoal">
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/80 p-4 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl border border-charcoal/5"
                    >
                        <h3 className="text-2xl font-black text-charcoal tracking-tight mb-2">Decline Request</h3>
                        <p className="text-sm text-charcoal/50 mb-6 font-medium leading-relaxed">
                            Please let the customer know why you cannot accept this job. This helps them adjust their request.
                        </p>
                        
                        <div className="space-y-3 mb-8">
                            {rejectionReasons.map((reason) => (
                                <label key={reason} className="flex items-center gap-3 p-4 rounded-2xl border border-charcoal/10 hover:bg-cream cursor-pointer transition-colors">
                                    <input 
                                        type="radio" 
                                        name="rejectReason"
                                        value={reason}
                                        checked={rejectReason === reason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        className="text-lime-dark focus:ring-lime-dark"
                                    />
                                    <span className="text-charcoal font-bold text-sm">{reason}</span>
                                </label>
                            ))}
                            
                            {rejectReason === 'Other' && (
                                <textarea
                                    className="w-full p-4 border border-charcoal/10 bg-cream/50 rounded-2xl focus:ring-4 focus:ring-lime/10 focus:border-lime outline-none text-sm mt-3 font-medium text-charcoal"
                                    placeholder="Please specify..."
                                    rows="3"
                                    value={customReason}
                                    onChange={(e) => setCustomReason(e.target.value)}
                                ></textarea>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => setShowRejectModal(false)}
                                className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-charcoal/50 hover:bg-charcoal/5 rounded-2xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleDecline}
                                className="flex-1 py-4 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                            >
                                Decline Job
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
            
            <ProviderSidebar />
            
            <div className="flex-1 flex flex-col min-w-0">
                <ProviderMobileNavBar />

                <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
                     <header className="bg-white/80 backdrop-blur-md border-b border-charcoal/5 h-20 flex items-center justify-between px-6 md:px-10 sticky top-0 z-10">
                        <div className="flex items-center gap-4">
                            <Link to="/provider/requests" className="md:hidden p-2 -ml-2 text-charcoal/40 hover:text-charcoal bg-cream rounded-xl">
                                <span className="material-icons">arrow_back</span>
                            </Link>
                            <h1 className="text-2xl font-black text-charcoal tracking-tight">Request Details</h1>
                        </div>
                     </header>

                     <div className="p-6 md:p-10 max-w-5xl mx-auto">
                        <Breadcrumbs items={breadcrumbItems} />

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                            {/* Main Content */}
                            <div className="lg:col-span-2 space-y-8">
                                <div className="bg-white rounded-[2rem] p-8 border border-charcoal/5 shadow-sm">
                                    <div className="flex justify-between items-start mb-6">
                                        <h2 className="text-3xl font-display font-black text-charcoal tracking-tight">
                                            {request.title || 'Service Request'}
                                        </h2>
                                        <span className="px-4 py-1.5 bg-orange-100 text-orange-700 text-[10px] font-black rounded-xl uppercase tracking-widest">
                                            {request.status || 'Open'}
                                        </span>
                                    </div>
                                    
                                    <div className="flex flex-wrap items-center gap-4 text-charcoal/50 mb-8 text-sm font-medium">
                                        <span className="flex items-center gap-1.5">
                                            <span className="material-icons text-lg">schedule</span>
                                            {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'Recently'}
                                        </span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-charcoal/20"></span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="material-icons text-lg">location_on</span>
                                            {request.location_name || 'Remote/TBD'}
                                        </span>
                                    </div>

                                    <div className="prose prose-sm max-w-none text-charcoal/70 font-medium">
                                        <h3 className="text-charcoal font-black text-lg mb-3 tracking-tight">Description</h3>
                                        <p className="leading-relaxed bg-cream/50 p-6 rounded-2xl border border-charcoal/5 text-[15px]">
                                            {request.description || 'No description provided.'}
                                        </p>
                                    </div>

                                    {request.images && request.images.length > 0 && (
                                        <div className="mt-8 grid grid-cols-2 gap-4">
                                           {request.images.map((img, idx) => (
                                               <div key={idx} className="aspect-video bg-cream rounded-2xl overflow-hidden border border-charcoal/5">
                                                    <img src={img} alt={`Job ${idx}`} className="w-full h-full object-cover"/>
                                               </div>
                                           ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sidebar/Action Card */}
                            <div className="space-y-6">
                                <div className="bg-white rounded-[2rem] p-8 border border-charcoal/5 shadow-sm sticky top-32">
                                    <div className="text-center mb-8 pb-8 border-b border-charcoal/5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-charcoal/40 mb-2">Estimated Budget</p>
                                        <p className="text-4xl font-display font-black text-lime-dark tracking-tight">
                                            ₦{Number(request.budget_estimate || 0).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex items-center gap-4 p-4 bg-cream rounded-2xl">
                                            <div className="w-12 h-12 bg-charcoal text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-inner">
                                                {(request.customer_id || 'C')[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-charcoal">Customer</p>
                                                <p className="text-xs text-charcoal/50 font-medium tracking-wide">ID: {String(request.customer_id || 'Unknown').substring(0,8)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 mt-8">
                                        <button 
                                            onClick={handleAccept}
                                            disabled={isRestricted}
                                            className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                isRestricted 
                                                ? 'bg-charcoal/5 text-charcoal/40 cursor-not-allowed' 
                                                : 'btn-lime shadow-lg shadow-lime/20 justify-center'
                                            }`}
                                        >
                                            {isRestricted ? 'Restricted' : 'Accept Job'}
                                        </button>
                                        <button 
                                            onClick={() => setShowRejectModal(true)}
                                            className="w-full py-4 bg-white text-charcoal/70 text-[10px] font-black uppercase tracking-widest border border-charcoal/10 rounded-2xl hover:bg-cream transition-colors block text-center"
                                        >
                                            Decline Request
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                     </div>
                </main>
            </div>
        </div>
    );
};

export default RequestDetails;
