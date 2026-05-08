import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import { useData } from '../../context/DataContext';
import { toast } from 'sonner';

const VerificationDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { verifications, loading: dataLoading } = useData();
    const [verification, setVerification] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!dataLoading && verifications) {
            const ver = verifications.find(v => v.id === id);
            if (ver) {
                setVerification(ver);
            } else {
                toast.error("Verification request not found");
                navigate('/admin/verifications');
            }
            setLoading(false);
        }
    }, [id, verifications, dataLoading, navigate]);

    const handleApprove = async () => {
        toast.success("Provider approved! (Simulated)");
        setVerification(prev => ({ ...prev, status: 'approved' }));
        setTimeout(() => navigate('/admin/verifications'), 1500);
    };

    const handleReject = async () => {
        const reason = window.prompt("Please provide a reason for rejecting this application:");
        if (reason === null) return;
        if (!reason.trim()) {
            toast.error("A rejection reason is required.");
            return;
        }

        toast.success("Provider rejected (Simulated)");
        setVerification(prev => ({ ...prev, status: 'rejected', rejectionReason: reason.trim() }));
        setTimeout(() => navigate('/admin/verifications'), 1500);
    };

    if (loading || dataLoading) return (
        <div className="flex justify-center items-center h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
        </div>
    );

    if (!verification) return null;

    const renderDocuments = () => {
        const docs = verification.documents || {
            idFront: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
            businessLicense: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop'
        };
        
        return Object.entries(docs).map(([key, url]) => (
            <DocumentItem 
                key={key} 
                title={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                type={key} 
                url={url} 
            />
        ));
    };

    return (
        <div className="space-y-6 animate-fade-in font-sans p-6">
             <div className="flex flex-col gap-2">
                <Breadcrumbs 
                   items={[
                    { label: 'Verifications', path: '/admin/verifications' },
                    { label: 'Review Application', path: `/admin/verifications/${id}` }
                ]} 
                />
                 <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Review Application</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* User Info */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex items-start gap-6">
                         <div className="h-20 w-20 rounded-2xl bg-green-50 flex items-center justify-center text-green-700 font-black text-3xl uppercase border border-green-100 shadow-inner">
                             {(verification.providerName || '?').charAt(0)}
                         </div>
                         <div className="flex-1">
                             <h2 className="text-2xl font-black text-gray-900 tracking-tight">{verification.providerName || 'Unknown Name'}</h2>
                             <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Provider Onboarding Application</p>
                             <div className="flex flex-wrap gap-4 mt-6 text-sm">
                                 <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                                     <span className="material-icons text-sm text-gray-400">email</span> 
                                     <span className="font-bold text-gray-700">{verification.email}</span>
                                </div>
                                 <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                                     <span className="material-icons text-sm text-gray-400">calendar_today</span> 
                                     <span className="font-bold text-gray-700">Submitted: {new Date(verification.submittedAt).toLocaleDateString()}</span>
                                </div>
                             </div>
                         </div>
                    </div>
                    
                    {/* Documents List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                            <div>
                                <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Submitted Documents</h3>
                                <p className="text-xs text-gray-400 font-medium mt-1">Review all attached files for authenticity.</p>
                            </div>
                            <span className="bg-green-700 text-white px-4 py-1.5 rounded-full text-[10px] font-black border border-green-700 uppercase tracking-wider shadow-sm">
                                {Object.keys(verification.documents || {}).length || 2} File(s)
                            </span>
                        </div>
                        <ul className="divide-y divide-gray-50">
                            {renderDocuments()}
                        </ul>
                    </div>
                </div>

                <div className="space-y-8">
                     <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 sticky top-6">
                        <h3 className="font-black text-gray-900 mb-6 uppercase tracking-widest text-xs border-b border-gray-50 pb-4">Admin Decision</h3>
                        <p className="text-xs text-gray-500 mb-8 leading-relaxed font-medium">
                            <strong className="text-gray-900 block mb-1">Approve:</strong> Grants "Verified" badge and full access to platform jobs.<br/><br/>
                            <strong className="text-gray-900 block mb-1">Reject:</strong> Sends notification to provider to resubmit documents.
                        </p>
                        
                        <div className="space-y-4">
                            {verification.status === 'pending' ? (
                                <>
                                    <button 
                                        onClick={handleApprove}
                                        className="w-full py-4 px-4 rounded-xl bg-green-700 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-700/20 hover:bg-green-800 transition-all hover:-translate-y-0.5 flex justify-center items-center gap-2 active:scale-[0.98]"
                                    >
                                        <span className="material-icons text-sm">check_circle</span>
                                        Approve Provider
                                    </button>
                                     <button 
                                        onClick={handleReject}
                                        className="w-full py-4 px-4 rounded-xl bg-white border border-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all flex justify-center items-center gap-2 active:scale-[0.98]"
                                    >
                                        <span className="material-icons text-sm">cancel</span>
                                        Reject Provider
                                    </button>
                                </>
                            ) : (
                                <div className={`text-center py-5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                                    verification.status === 'approved' 
                                        ? 'bg-green-50 text-green-700 border-green-200' 
                                        : 'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                    Status: {verification.status}
                                </div>
                            )}
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

const DocumentItem = ({ title, type, url }) => (
    <li className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-all group">
        <div className="flex items-center gap-5">
            <div className="h-14 w-14 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-green-700 group-hover:text-white transition-all border border-gray-100 shadow-sm">
                <span className="material-icons">description</span>
            </div>
            <div>
                <p className="font-bold text-gray-900">{title}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{type}</p>
            </div>
        </div>
        <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-green-700 hover:text-white bg-green-50 hover:bg-green-700 px-5 py-2.5 rounded-xl border border-green-100 transition-all shadow-sm"
        >
            <span>View</span>
            <span className="material-icons text-xs">open_in_new</span>
        </a>
    </li>
);

export default VerificationDetails;
