import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import TopNavbar from '../../components/layout/TopNavbar';
import MobileNavBar from '../../components/layout/MobileNavBar';
import { useData } from '../../context/DataContext';
import { format } from 'date-fns';

const MyRequests = () => {
    const navigate = useNavigate();
    const { requests: allRequests } = useData();
    const [activeTab, setActiveTab] = useState('All');

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'bg-green-50 text-green-700 border-green-200';
            case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'Scheduled': return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'Cancelled': return 'bg-red-50 text-red-700 border-red-200';
            case 'Open': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'Interested': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'Declined': return 'bg-red-50 text-red-700 border-red-200';
            case 'Rejected': return 'bg-red-50 text-red-700 border-red-200';
            case 'negotiating': return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'awaiting_payment': return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'payment_secured': return 'bg-green-50 text-green-700 border-green-200';
            case 'payment_released': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Completed': return 'check_circle';
            case 'In Progress': return 'autorenew';
            case 'Scheduled': return 'event';
            case 'Cancelled': return 'cancel';
            case 'Open': return 'radio_button_unchecked';
            case 'Interested': return 'people';
            case 'Declined': return 'block';
            case 'Rejected': return 'block';
            case 'negotiating': return 'chat';
            case 'awaiting_payment': return 'payment';
            case 'payment_secured': return 'lock';
            case 'payment_released': return 'check_circle';
            default: return 'pending';
        }
    };

    const formatStatus = (status) => {
        switch (status) {
            case 'interested': return 'Providers Interested';
            case 'negotiating': return 'Negotiating';
            case 'awaiting_payment': return 'Awaiting Payment';
            case 'payment_secured': return 'Payment Secured';
            case 'payment_released': return 'Payment Released';
            default: return status;
        }
    };

    const filteredRequests = activeTab === 'All' 
        ? allRequests 
        : activeTab === 'History' 
            ? allRequests.filter(r => ['Completed', 'Cancelled', 'Declined', 'Rejected', 'payment_released'].includes(r.status))
            : allRequests.filter(r => ['Open', 'Interested', 'Pending', 'negotiating', 'awaiting_payment', 'payment_secured', 'in_progress'].includes(r.status));

    return (
        <div className="flex h-screen bg-white font-sans text-gray-900">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopNavbar breadcrumbs={['Customer', 'My Requests']} />
                
                <main className="flex-1 overflow-y-auto bg-white">
                    <div className="max-w-[900px] mx-auto px-4 sm:px-8 py-6 sm:py-10 pb-24 md:pb-10">
                        
                        {/* Header */}
                        <div className="flex items-end justify-between mb-6 sm:mb-8">
                            <div>
                                <h1 className="text-[24px] sm:text-[32px] font-extrabold text-gray-900 tracking-tight">My Requests</h1>
                                <p className="mt-1 text-[13px] sm:text-[15px] font-medium text-gray-500">Track and manage all your service requests.</p>
                            </div>
                            <Link 
                                to="/customer/post-request" 
                                className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-bold text-white bg-[#10B981] px-4 py-2.5 rounded-xl hover:bg-[#059669] transition-colors shadow-sm"
                            >
                                <span className="material-icons-outlined text-[16px]">add</span>
                                New Request
                            </Link>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 sm:mb-8 w-full sm:w-auto sm:inline-flex">
                            {['All', 'Active', 'History'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 sm:flex-none px-5 sm:px-7 py-2 sm:py-2.5 rounded-lg text-[13px] font-bold transition-all duration-200 ${
                                        activeTab === tab
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Request Count */}
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">
                                {filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'}
                            </p>
                        </div>

                        {/* Request List */}
                        {filteredRequests.length > 0 ? (
                            <div className="flex flex-col">
                                {filteredRequests.map((req, index) => {
                                    const date = req.createdAt && req.createdAt.toDate ? format(req.createdAt.toDate(), 'MMM dd') : 'Just now';
                                    const providerName = req.providerName || null;
                                    
                                    return (
                                        <div 
                                            key={req.id}
                                            onClick={() => {
                                                if (req.status === 'negotiating') {
                                                    navigate(`/customer/negotiation/${req.id}`);
                                                } else if (req.status === 'awaiting_payment') {
                                                    navigate(`/customer/payment/${req.id}`);
                                                } else if (req.status === 'Completed') {
                                                    navigate(`/customer/service-review/${req.id}`);
                                                } else {
                                                    navigate(`/customer/request-status/${req.id}`);
                                                }
                                            }}
                                            className={`flex items-center gap-3 sm:gap-4 py-3.5 sm:py-4 px-2 -mx-2 rounded-xl cursor-pointer group hover:bg-gray-50 transition-colors ${
                                                index !== filteredRequests.length - 1 ? 'border-b border-gray-100' : ''
                                            }`}
                                        >
                                            {/* Status Icon */}
                                            <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                req.status === 'Completed' ? 'bg-green-50' :
                                                req.status === 'In Progress' ? 'bg-blue-50' :
                                                req.status === 'Open' ? 'bg-orange-50' :
                                                req.status === 'Cancelled' || req.status === 'Declined' || req.status === 'Rejected' ? 'bg-red-50' :
                                                'bg-gray-50'
                                            }`}>
                                                <span className={`material-icons-outlined text-[18px] sm:text-[20px] ${
                                                    req.status === 'Completed' ? 'text-green-600' :
                                                    req.status === 'In Progress' ? 'text-blue-600' :
                                                    req.status === 'Open' ? 'text-orange-600' :
                                                    req.status === 'Cancelled' || req.status === 'Declined' || req.status === 'Rejected' ? 'text-red-500' :
                                                    'text-gray-400'
                                                }`}>{getStatusIcon(req.status)}</span>
                                            </div>

                                            {/* Request Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                                    <h3 className="text-[14px] sm:text-[15px] font-bold text-gray-900 truncate group-hover:text-[#10B981] transition-colors">
                                                        {req.title || req.category}
                                                    </h3>
                                                    <span className="text-[14px] sm:text-[15px] font-extrabold text-gray-900 shrink-0">
                                                        ₦{Number(req.budget).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] sm:text-[12px] font-medium text-gray-500">
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStatusColor(req.status)}`}>
                                                        {formatStatus(req.status)}
                                                    </span>
                                                    <span className="text-gray-300">•</span>
                                                    <span>{date}</span>
                                                    {providerName && (
                                                        <>
                                                            <span className="text-gray-300 hidden sm:inline">•</span>
                                                            <span className="hidden sm:inline truncate">{providerName}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Chevron */}
                                            <span className="material-icons text-[18px] text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors">chevron_right</span>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                                    <span className="material-icons-outlined text-gray-400 text-3xl">assignment_late</span>
                                </div>
                                <h3 className="text-lg font-extrabold text-gray-900">No requests found</h3>
                                <p className="text-[14px] font-medium text-gray-500 mt-1.5">You don't have any {activeTab.toLowerCase()} requests yet.</p>
                                <Link to="/customer/post-request" className="inline-block mt-6 px-6 py-2.5 bg-[#10B981] text-white rounded-xl text-[13px] font-bold hover:bg-[#059669] transition-colors shadow-sm">
                                    Post a New Request
                                </Link>
                            </div>
                        )}

                    </div>
                </main>
                <MobileNavBar />
            </div>
        </div>
    );
};

export default MyRequests;
