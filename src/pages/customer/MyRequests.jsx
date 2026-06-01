import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import CategoryIcon from '../../components/ui/CategoryIcon';
import Sidebar from '../../components/layout/Sidebar';
import TopNavbar from '../../components/layout/TopNavbar';
import MobileNavBar from '../../components/layout/MobileNavBar';

import { format } from 'date-fns';
import { useJobs } from '../../context/JobContext';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import CategoryFilterSelect from '../../components/ui/CategoryFilterSelect';

const MyRequests = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { requests: allRequests, loading, customerJobsHasMore, loadMoreCustomerJobs } = useJobs();
    const [activeTab, setActiveTab] = useState('All');
    const [showStatusLegend, setShowStatusLegend] = useState(false);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    useEffect(() => {
        const handleResize = () => { if (window.innerWidth >= 640) setShowStatusLegend(false); };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {

    }, [location.state, location.pathname, location.search, navigate]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'bg-green-50 text-green-700 border-green-200';
            case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'Scheduled': return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'Cancelled': return 'bg-red-50 text-red-700 border-red-200';
            case 'Open': return 'bg-gray-50 text-gray-400 border-gray-100';
            case 'Interested': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'provider_accepted': return 'bg-amber-50 text-amber-700 border-amber-200';
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

    const getStatusDotColor = (status) => {
        const s = String(status || '').toLowerCase();
        if (['completed', 'payment_released', 'payment_secured'].includes(s)) return 'bg-green-500';
        if (['in_progress'].includes(s)) return 'bg-blue-500';
        if (['negotiating'].includes(s)) return 'bg-purple-500';
        if (['awaiting_payment', 'interested', 'provider_accepted'].includes(s)) return 'bg-amber-500';
        if (['cancelled', 'declined', 'rejected'].includes(s)) return 'bg-red-500';
        return 'bg-gray-300'; // Open / Pending / Default
    };

    const isTerminalHistory = (r) => {
        const s = String(r.status || '').toLowerCase();
        return ['cancelled', 'declined', 'rejected', 'payment_released'].includes(s);
    };

    const isPrivateForCustomer = (r) => String(r.request_type || r.visibility || '').toLowerCase() === 'private';
    const isPublicForCustomer = (r) => String(r.request_type || r.visibility || '').toLowerCase() === 'public';

    const filteredByTab = activeTab === 'All'
        ? allRequests
        : activeTab === 'History'
            ? allRequests.filter(isTerminalHistory)
            : activeTab === 'Private'
                ? allRequests.filter(isPrivateForCustomer)
                : activeTab === 'Public'
                    ? allRequests.filter(isPublicForCustomer)
                    : allRequests.filter(r => !isTerminalHistory(r));

    const filteredRequests = filteredByTab.filter(r => {
        if (categoryFilter && (r.serviceType || r.category || '').toLowerCase() !== categoryFilter.toLowerCase()) return false;
        
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            (r.title || r.serviceType || r.category || '').toLowerCase().includes(q) ||
            (r.location || '').toLowerCase().includes(q) ||
            (r.providerName || '').toLowerCase().includes(q)
        );
    });

    const loadMoreRef = useIntersectionObserver(loadMoreCustomerJobs, customerJobsHasMore && !loading);

    return (
        <div className="flex min-h-screen bg-white font-sans text-gray-900">
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
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setShowStatusLegend(true)}
                                    className="sm:hidden w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <span className="material-icons-outlined text-[20px]">info</span>
                                </button>
                                <Link
                                    to="/customer/post-request"
                                    className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-bold text-white bg-[#10B981] px-4 py-2.5 rounded-xl hover:bg-[#059669] transition-colors shadow-sm"
                                >
                                    <span className="material-icons-outlined text-[16px]">add</span>
                                    New Request
                                </Link>
                            </div>
                        </div>

                        {/* Tabs — underline style */}
                        <div className="flex gap-6 border-b border-gray-100 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                            {[
                                { id: 'All', count: allRequests.length },
                                { id: 'Public', count: allRequests.filter(isPublicForCustomer).length },
                                { id: 'Private', count: allRequests.filter(isPrivateForCustomer).length },
                                { id: 'Active', count: allRequests.filter(r => !isTerminalHistory(r)).length },
                                { id: 'History', count: allRequests.filter(isTerminalHistory).length },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`pb-3 text-sm font-semibold transition-all border-b-2 -mb-px flex items-center gap-1.5 whitespace-nowrap ${
                                        activeTab === tab.id
                                            ? 'border-[#10B981] text-[#10B981]'
                                            : 'border-transparent text-gray-400 hover:text-gray-700'
                                    }`}
                                >
                                    {tab.id}
                                    {tab.count > 0 && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-gray-100 text-gray-400'}`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Search & Filter */}
                        <div className="flex flex-row gap-2 sm:gap-3 mt-4 sm:mt-6 mb-2">
                            <div className="relative flex-1">
                                <span className="material-icons-outlined absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px] sm:text-[20px]">search</span>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search by service, location or provider..."
                                    className="w-full pl-8 sm:pl-10 pr-3 py-2 sm:py-3 bg-white border border-gray-200 rounded-xl text-[13px] sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all"
                                />
                            </div>
                            
                            <CategoryFilterSelect 
                                value={categoryFilter} 
                                onChange={setCategoryFilter} 
                                className="shrink-0 w-[140px] sm:w-48" 
                            />
                        </div>

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
                                                else navigate(`/customer/request-status/${req.id}`);
                                            }}
                                            className={`py-5 cursor-pointer group hover:bg-gray-50/60 transition-colors rounded-xl px-1 -mx-1 ${
                                                index !== 0 ? 'border-t border-gray-100' : ''
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
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

                                            {/* Status — Dot on mobile, Pill on desktop */}
                                            <div className="shrink-0 flex items-center">
                                                <div className={`sm:hidden w-2.5 h-2.5 rounded-full ${getStatusDotColor(req.status)}`} />
                                                <span className={`hidden sm:inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold border whitespace-nowrap ${getStatusColor(req.status)}`}>
                                                    {formatStatus(req.status)}
                                                </span>
                                            </div>

                                            <span className="material-icons text-[18px] text-gray-300 group-hover:text-gray-400 shrink-0 transition-colors ml-2 sm:ml-0">chevron_right</span>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Infinite Scroll Trigger */}
                                <div ref={loadMoreRef} className="py-4 flex justify-center">
                                    {loading && (
                                        <div className="w-5 h-5 border-2 border-gray-300 border-t-[#10B981] rounded-full animate-spin"></div>
                                    )}
                                </div>
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

            {/* Status Legend Modal (Mobile Only) */}
            <AnimatePresence>
                {showStatusLegend && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowStatusLegend(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
                        >
                            <div className="w-12 h-1 bg-gray-100 rounded-full mx-auto mb-6 sm:hidden" />
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-black text-gray-900">Status Guide</h3>
                                <button onClick={() => setShowStatusLegend(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400">
                                    <span className="material-icons text-lg">close</span>
                                </button>
                            </div>
                            <div className="space-y-5">
                                {[
                                    { color: 'bg-green-500', label: 'Success / Paid', sub: 'Payment secured or job finished.' },
                                    { color: 'bg-blue-500', label: 'In Progress', sub: 'Job has started and is currently active.' },
                                    { color: 'bg-purple-500', label: 'In Discussion', sub: 'You are currently negotiating with a pro.' },
                                    { color: 'bg-amber-500', label: 'Action Required', sub: 'Provider accepted, needs payment.' },
                                    { color: 'bg-gray-300', label: 'Open / Pending', sub: 'Waiting for providers to show interest.' },
                                    { color: 'bg-red-500', label: 'Terminated', sub: 'Request has been cancelled or rejected.' },
                                ].map(item => (
                                    <div key={item.label} className="flex items-start gap-3">
                                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${item.color}`} />
                                        <div>
                                            <p className="text-[14px] font-bold text-gray-900 leading-tight">{item.label}</p>
                                            <p className="text-xs text-gray-400 font-medium mt-0.5">{item.sub}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button 
                                onClick={() => setShowStatusLegend(false)}
                                className="w-full mt-8 py-3.5 bg-[#0F172A] text-white rounded-2xl text-sm font-bold active:scale-[0.98] transition-all"
                            >
                                Got it
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MyRequests;
