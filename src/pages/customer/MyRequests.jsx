import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import CategoryIcon from '../../components/ui/CategoryIcon';
import Sidebar from '../../components/layout/Sidebar';
import TopNavbar from '../../components/layout/TopNavbar';
import MobileNavBar from '../../components/layout/MobileNavBar';
import { useData } from '../../context/DataContext';
import { format } from 'date-fns';

const MyRequests = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { requests: allRequests } = useData();
    const [activeTab, setActiveTab] = useState('All');

    useEffect(() => {
        if (!location.state?.jobStarted) return;
        toast.success('Job started', {
            description: 'When your provider finishes, you’ll get a notification to confirm or dispute within 48 hours.',
        });
        navigate(location.pathname + location.search, { replace: true, state: {} });
    }, [location.state, location.pathname, location.search, navigate]);

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
            case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'payment_released': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'completed': return 'bg-amber-50 text-amber-800 border-amber-200';
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
            case 'in_progress': return 'autorenew';
            case 'payment_released': return 'check_circle';
            case 'completed': return 'task_alt';
            default: return 'pending';
        }
    };

    const formatStatus = (status) => {
        switch (String(status || '').toLowerCase()) {
            case 'interested': return 'Providers Interested';
            case 'negotiating': return 'Negotiating';
            case 'awaiting_payment': return 'Awaiting Payment';
            case 'payment_secured': return 'Payment Secured';
            case 'in_progress': return 'In Progress';
            case 'payment_released': return 'Payment Released';
            case 'completed': return 'Awaiting confirmation';
            default: return status;
        }
    };

    const isTerminalHistory = (r) => {
        const s = String(r.status || '').toLowerCase();
        return ['cancelled', 'declined', 'rejected', 'payment_released'].includes(s);
    };

    const isPrivateForCustomer = (r) => String(r.request_type || r.visibility || '').toLowerCase() === 'private';

    const filteredRequests = activeTab === 'All'
        ? allRequests
        : activeTab === 'History'
            ? allRequests.filter(isTerminalHistory)
            : activeTab === 'Private'
                ? allRequests.filter(isPrivateForCustomer)
                : allRequests.filter(r => !isTerminalHistory(r));

    return (
        <div className="flex h-screen bg-white font-sans text-gray-900">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopNavbar breadcrumbs={['Customer', 'My Requests']} />
                
                <main className="flex-1 overflow-y-auto bg-white">
                    <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8 pb-24 md:pb-10 space-y-6">

                        {/* Header */}
                        <div className="flex items-end justify-between">
                            <div>
                                <h1 className="text-[22px] sm:text-[28px] font-extrabold text-gray-900 tracking-tight">My Requests</h1>
                                <p className="mt-1 text-[13px] font-medium text-gray-400">Track and manage all your service requests.</p>
                            </div>
                            <Link
                                to="/customer/post-request"
                                className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-bold text-white bg-[#10B981] px-4 py-2.5 rounded-xl hover:bg-[#059669] transition-colors shadow-sm"
                            >
                                <span className="material-icons-outlined text-[16px]">add</span>
                                New Request
                            </Link>
                        </div>

                        {/* Tabs — underline style */}
                        <div className="flex gap-6 border-b border-gray-100">
                            {['All', 'Private', 'Active', 'History'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`pb-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
                                        activeTab === tab
                                            ? 'border-[#10B981] text-[#10B981]'
                                            : 'border-transparent text-gray-400 hover:text-gray-700'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Count */}
                        {filteredRequests.length > 0 && (
                            <p className="text-xs text-gray-400 font-medium">
                                <span className="font-bold text-gray-700">{filteredRequests.length}</span> {filteredRequests.length === 1 ? 'request' : 'requests'}
                            </p>
                        )}

                        {/* Request List */}
                        {filteredRequests.length > 0 ? (
                            <div>
                                {filteredRequests.map((req, index) => {
                                    const date = req.createdAt && req.createdAt.toDate ? format(req.createdAt.toDate(), 'MMM dd') : 'Just now';

                                    return (
                                        <div
                                            key={req.id}
                                            onClick={() => {
                                                const st = String(req.status || '').toLowerCase();
                                                if (req.status === 'awaiting_payment' || st === 'awaiting_payment') navigate(`/customer/payment/${req.id}`);
                                                else if (st === 'completed') navigate(`/customer/confirm/${req.id}`);
                                                else if (st === 'payment_released') navigate(`/customer/service-review/${req.id}`);
                                                else navigate(`/customer/request-status/${req.id}`);
                                            }}
                                            className={`flex items-center gap-4 py-5 cursor-pointer group hover:bg-gray-50/60 transition-colors rounded-xl px-1 -mx-1 ${
                                                index !== 0 ? 'border-t border-gray-100' : ''
                                            }`}
                                        >
                                            {/* Category icon */}
                                            <CategoryIcon category={req.category || req.serviceType} size="md" />

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-[15px] font-bold text-gray-900 truncate group-hover:text-[#10B981] transition-colors mb-1">
                                                    {req.title || req.category}
                                                </h3>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                    <span className="truncate max-w-[120px] sm:max-w-none">{req.category || 'Service'}</span>
                                                    <span className="text-gray-200">·</span>
                                                    <span className="shrink-0">{date}</span>
                                                </div>
                                                {(() => {
                                                    const st = String(req.status || '').toLowerCase();
                                                    const showCode = st === 'payment_secured' || st === 'in_progress';
                                                    const showConfirm = st === 'completed';
                                                    if (!showCode && !showConfirm) return null;
                                                    return (
                                                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2" onClick={e => e.stopPropagation()}>
                                                            {showCode && (
                                                                <Link to={`/customer/job-otp/${req.id}`} className="text-[11px] font-bold text-[#10B981] hover:underline">
                                                                    {st === 'payment_secured' ? 'Job start code' : 'View / renew job code'}
                                                                </Link>
                                                            )}
                                                            {showConfirm && (
                                                                <Link to={`/customer/confirm/${req.id}`} className="text-[11px] font-bold text-[#0F172A] hover:underline">
                                                                    Confirm or dispute
                                                                </Link>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            {/* Status pill */}
                                            <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold border whitespace-nowrap ${getStatusColor(req.status)}`}>
                                                {formatStatus(req.status)}
                                            </span>

                                            <span className="material-icons text-[18px] text-gray-300 group-hover:text-gray-400 shrink-0 transition-colors">chevron_right</span>
                                        </div>
                                    );
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
