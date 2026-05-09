import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import TopNavbar from '../../components/layout/TopNavbar';
import MobileNavBar from '../../components/layout/MobileNavBar';
import { format } from 'date-fns';
import { useData } from '../../context/DataContext';

const RequestStatus = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { requests, getProviders, isSimulated } = useData();
    const [request, setRequest] = useState(null);
    const [providerData, setProviderData] = useState(null);
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
            
            // Fetch real provider data if assigned
            if (req.providerId || req.provider_id) {
                const pId = req.providerId || req.provider_id;
                getProviders('All').then(allProviders => {
                    const pData = allProviders.find(p => p.id === pId || p.uid === pId);
                    if (pData) setProviderData(pData);
                }).catch(err => console.error("Error fetching provider:", err));
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

    return (
        <div className="flex h-screen bg-white font-sans text-gray-900">
            <Sidebar />
            
            <main className="flex-1 overflow-hidden flex flex-col min-w-0">
                <TopNavbar breadcrumbs={['Customer', 'My Requests', 'Request Details']} />

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 pb-24 md:pb-10 bg-white">
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-10">
                            {/* Alert for Rejected/Declined Requests */}
                            {(request.status === 'Declined' || request.status === 'Rejected') && (
                                <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-5 rounded-r-2xl shadow-sm">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <span className="material-icons text-red-500">error</span>
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-sm font-bold text-red-800">Request Declined by Provider</h3>
                                            <div className="mt-2 text-sm text-red-700 font-medium">
                                                <p>The provider could not accept your request. Reason:</p>
                                                <p className="font-extrabold mt-1">"{request.rejectionReason || 'No reason provided'}"</p>
                                                <p className="mt-2">You can edit the request to address the feedback (e.g., adjust budget) and resubmit it.</p>
                                            </div>
                                            <div className="mt-4">
                                                <button
                                                    type="button"
                                                    onClick={() => navigate('/customer/post-request', { state: { request: request } })}
                                                    className="inline-flex items-center px-4 py-2 text-sm font-bold rounded-xl text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
                                                >
                                                    Edit & Resubmit
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                                        {request.title}
                                    </h1>
                                    <p className="mt-1.5 text-[12px] sm:text-sm font-medium text-gray-500">
                                        Order ID: <span className="font-bold text-gray-700">#{request.id.slice(0, 8).toUpperCase()}</span> • Placed on {dateStr}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-3 shrink-0">
                                    {request.status === 'Completed' && !request.review ? (
                                        <button 
                                            onClick={() => navigate(`/customer/service-review/${id}`)}
                                            className="inline-flex items-center px-5 py-2.5 shadow-sm text-sm font-bold rounded-xl text-white bg-[#10B981] hover:bg-[#059669] transition-colors"
                                            type="button"
                                        >
                                            <span className="material-icons-outlined text-sm mr-2">star</span>
                                            Leave Review
                                        </button>
                                    ) : request.status === 'Declined' || request.status === 'Rejected' ? (
                                        <button 
                                            onClick={() => navigate('/customer/post-request', { state: { request: request } })}
                                            className="inline-flex items-center px-5 py-2.5 text-sm font-bold rounded-xl shadow-sm text-white bg-[#10B981] hover:bg-[#059669] transition-colors" 
                                            type="button"
                                        >
                                            Edit Request
                                        </button>
                                    ) : (
                                        <>
                                            <button className="inline-flex items-center px-5 py-2.5 border border-gray-200 shadow-sm text-sm font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors" type="button">
                                                Report Issue
                                            </button>
                                            {request.status !== 'Completed' && request.status !== 'Cancelled' && request.status !== 'Declined' && request.status !== 'Rejected' && (
                                                <button className="inline-flex items-center px-5 py-2.5 text-sm font-bold rounded-xl shadow-sm text-white bg-red-500 hover:bg-red-600 transition-colors" type="button">
                                                    Cancel
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                {/* Provider Profile Card */}
                                {(request.providerId && (providerData || request.providerName)) && (request.status !== 'Declined' && request.status !== 'Rejected') && (
                                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row items-center gap-8">
                                        <div className="size-24 bg-gray-100 rounded-full flex-shrink-0 overflow-hidden border-2 border-gray-50">
                                            {(providerData?.photoURL || providerData?.avatar_url || request.providerPhoto) ? (
                                                <img src={providerData?.photoURL || providerData?.avatar_url || request.providerPhoto} alt={providerData?.displayName || request.providerName} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="material-icons text-5xl text-gray-400 w-full h-full flex items-center justify-center">person</span>
                                            )}
                                        </div>
                                        <div className="flex-1 text-center md:text-left">
                                            <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">{providerData?.displayName || providerData?.full_name || request.providerName || 'Provider Assigned'}</h3>
                                            <div className="flex items-center justify-center md:justify-start gap-1 text-yellow-500 my-1.5">
                                                <span className="material-icons text-sm">star</span>
                                                <span className="text-[15px] font-extrabold text-gray-900">{providerData?.rating ? Number(providerData.rating).toFixed(1) : 'New'}</span>
                                                <span className="text-[12px] font-bold text-gray-400 ml-1">
                                                    (Verified Provider)
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-gray-500">Your task has been assigned to this provider.</p>
                                        </div>
                                        <div className="flex flex-col gap-3 w-full md:w-auto">
                                            {(providerData?.phoneNumber || providerData?.phone_number || request.providerPhone) ? (
                                                <a 
                                                    href={`tel:${providerData?.phoneNumber || providerData?.phone_number || request.providerPhone}`}
                                                    className="inline-flex justify-center items-center px-6 py-3 border-2 border-[#10B981] shadow-sm text-[13px] font-extrabold rounded-xl text-white bg-[#10B981] hover:bg-[#059669] hover:border-[#059669] w-full md:w-auto transition-colors"
                                                >
                                                    <span className="material-icons text-[18px] mr-2">call</span>
                                                    Contact Provider
                                                </a>
                                            ) : (
                                                 <button 
                                                    className="inline-flex justify-center items-center px-6 py-3 border border-gray-200 shadow-sm text-[13px] font-extrabold rounded-xl text-gray-700 bg-white hover:bg-gray-50 w-full md:w-auto transition-colors"
                                                >
                                                    <span className="material-icons text-[18px] mr-2">chat</span>
                                                    Message
                                                </button>
                                            )}
                                            
                                            <button 
                                                onClick={() => navigate(`/customer/provider/${request.providerId}`)}
                                                className="inline-flex justify-center items-center px-6 py-3 text-[13px] font-extrabold rounded-xl text-[#10B981] bg-green-50 hover:bg-green-100 w-full md:w-auto transition-colors"
                                            >
                                                View Profile
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                                    <h2 className="text-xl font-extrabold text-gray-900 mb-8 tracking-tight flex items-center gap-2">
                                        <span className="material-icons-outlined text-[#10B981]">timeline</span>
                                        Request Timeline
                                    </h2>
                                    <div className="relative mt-8 mb-4">
                                        {/* Timeline - horizontal on desktop, vertical on mobile */}
                                        <div className="hidden sm:block">
                                            <div className="absolute top-4 left-4 right-4 h-[2px] bg-gray-100 -z-10"></div>
                                            <div className="flex justify-between w-full">
                                            {(request.timeline && request.timeline.length > 0) ? (
                                                request.timeline.map((event, index) => (
                                                    <div key={index} className="flex flex-col items-center relative group w-1/4">
                                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white z-10 transition-colors ${index <= request.timeline.length - 1 ? 'bg-[#10B981]' : 'bg-gray-200'}`}>
                                                            <span className="material-icons-outlined text-white text-[16px]">check</span>
                                                        </div>
                                                        <div className="mt-4 text-center">
                                                            <h3 className="text-[14px] font-extrabold text-gray-900 group-hover:text-[#10B981] transition-colors">{event.title}</h3>
                                                            <span className="text-[10px] font-bold text-gray-400 mt-1 block uppercase tracking-wider">{event.time || 'Recently'}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center relative w-1/4">
                                                    <div className="h-8 w-8 rounded-full bg-[#10B981] flex items-center justify-center ring-8 ring-white z-10 shadow-sm">
                                                        <span className="material-icons-outlined text-white text-[16px]">check</span>
                                                    </div>
                                                    <div className="mt-4 text-center">
                                                        <h3 className="text-[14px] font-extrabold text-gray-900">Request Sent</h3>
                                                        <span className="text-[10px] font-bold text-gray-400 mt-1 block uppercase tracking-wider">{dateStr}</span>
                                                    </div>
                                                </div>
                                            )}
                                            </div>
                                        </div>

                                        {/* Mobile vertical timeline */}
                                        <div className="sm:hidden space-y-0">
                                            {(request.timeline && request.timeline.length > 0) ? (
                                                request.timeline.map((event, index) => (
                                                    <div key={index} className="flex gap-4 items-start relative">
                                                        <div className="flex flex-col items-center">
                                                            <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${index <= request.timeline.length - 1 ? 'bg-[#10B981]' : 'bg-gray-200'}`}>
                                                                <span className="material-icons-outlined text-white text-[14px]">check</span>
                                                            </div>
                                                            {index < request.timeline.length - 1 && (
                                                                <div className="w-0.5 h-10 bg-gray-100 mt-1"></div>
                                                            )}
                                                        </div>
                                                        <div className="pb-6">
                                                            <h3 className="text-[13px] font-extrabold text-gray-900 leading-tight">{event.title}</h3>
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{event.time || 'Recently'}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex gap-4 items-start">
                                                    <div className="h-7 w-7 rounded-full bg-[#10B981] flex items-center justify-center shrink-0">
                                                        <span className="material-icons-outlined text-white text-[14px]">check</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-[13px] font-extrabold text-gray-900">Request Sent</h3>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{dateStr}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="lg:col-span-1 space-y-8">
                                <div className="bg-[#0F172A] rounded-3xl shadow-lg border border-gray-800 p-8">
                                    <h2 className="text-xl font-extrabold text-white mb-6 tracking-tight flex items-center gap-2">
                                        <span className="material-icons-outlined text-[#10B981]">assignment</span>
                                        Job Details
                                    </h2>
                                    <dl className="grid grid-cols-1 gap-y-6">
                                        <div className="border-b border-gray-800 pb-4">
                                            <dt className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Service Type</dt>
                                            <dd className="text-[14px] font-extrabold text-white">{request.category}</dd>
                                        </div>
                                        <div className="border-b border-gray-800 pb-4">
                                            <dt className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Budget</dt>
                                            <dd className="text-[18px] font-black text-white">₦{Number(request.budget).toLocaleString()}</dd>
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
                                                {request.location || 'No location provided'}
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
                                            <h3 className="text-[13px] font-extrabold text-green-900">Safety Tip</h3>
                                            <div className="mt-1.5 text-[12px] font-medium text-green-800 leading-relaxed">
                                                <p>For your safety, please ensure you verify the provider's identity before allowing entry to your premises.</p>
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
