import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import CategoryIcon from '../../components/ui/CategoryIcon';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import TopNavbar from '../../components/layout/TopNavbar';

import { useAuth } from '../../context/AuthContext';
import { useJobs } from '../../context/JobContext';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

const statusConfig = {
    Completed:  { bg: 'bg-[#10B981]/10', text: 'text-[#10B981]', border: 'border-[#10B981]/20' },
    Canceled:   { bg: 'bg-red-50',        text: 'text-red-600',    border: 'border-red-100' },
    Scheduled:  { bg: 'bg-blue-50',       text: 'text-blue-700',   border: 'border-blue-100' },
    Pending:    { bg: 'bg-amber-50',      text: 'text-amber-700',  border: 'border-amber-100' },
    provider_accepted: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
    negotiating: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
    awaiting_payment: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100' },
    payment_secured: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100' },
    payment_released: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
    default:    { bg: 'bg-gray-50',       text: 'text-gray-600',   border: 'border-gray-200' },
};

const getStatusStyle = (status) => statusConfig[status] || statusConfig.default;

const MyJobs = () => {
    const { jobs: allJobs, loading, providerJobsHasMore, loadMoreProviderJobs } = useJobs();
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('active');

    // Jobs where the deal is sealed or in progress — includes negotiation phase as it's an active engagement
    const MY_JOBS_STATUSES = ['provider_accepted', 'negotiating', 'awaiting_payment', 'payment_secured', 'in_progress', 'Completed', 'Canceled', 'payment_released'];
    const myJobs = allJobs.filter(j =>
        j.providerId === currentUser?.uid &&
        MY_JOBS_STATUSES.includes(j.status)
    );
    const activeJobs = myJobs.filter(j => !['Completed', 'Canceled', 'payment_released'].includes(j.status));
    const completedJobs = myJobs.filter(j => ['Completed', 'Canceled', 'payment_released'].includes(j.status));
    const displayJobs = activeTab === 'active' ? activeJobs : completedJobs;

    const tabs = [
        { key: 'active', label: 'Active', count: activeJobs.length },
        { key: 'completed', label: 'Completed', count: completedJobs.length },
    ];

    const loadMoreRef = useIntersectionObserver(loadMoreProviderJobs, providerJobsHasMore && !loading);

    return (
        <div className="min-h-screen bg-white flex font-sans">
            <ProviderSidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopNavbar breadcrumbs={['My Jobs']} />

                <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
                    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">

                        {/* Tabs — underline style */}
                        <div className="flex gap-6 border-b border-gray-100 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                            {tabs.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`pb-3 text-sm font-semibold flex items-center gap-1.5 transition-all border-b-2 -mb-px whitespace-nowrap shrink-0 ${
                                        activeTab === tab.key
                                            ? 'border-[#10B981] text-[#10B981]'
                                            : 'border-transparent text-gray-400 hover:text-gray-700'
                                    }`}
                                >
                                    {tab.label}
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-gray-100 text-gray-400'}`}>
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Jobs List */}
                        <AnimatePresence mode="wait">
                            {displayJobs.length === 0 ? (
                                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                        <span className="material-icons-outlined text-2xl text-gray-300">work_off</span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-sm">No {activeTab} jobs</h3>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {activeTab === 'active' ? 'Browse requests to start accepting jobs.' : 'Completed jobs will appear here.'}
                                    </p>
                                    {activeTab === 'active' && (
                                        <Link to="/provider/requests" className="mt-4 px-5 py-2.5 bg-[#0F172A] text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-colors">
                                            Browse Requests
                                        </Link>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    {displayJobs.map((job, idx) => {
                                        const style = getStatusStyle(job.status);
                                        const dateStr = job.createdAt ? new Date(job.createdAt.seconds * 1000).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : 'Date N/A';
                                        return (
                                            <Link
                                                key={job.id}
                                                to={`/provider/jobs/${job.id}`}
                                                className={`flex items-center gap-3 py-4 group hover:bg-gray-50/60 transition-colors rounded-xl px-1 -mx-1 ${idx !== 0 ? 'border-t border-gray-100' : ''}`}
                                            >
                                                <CategoryIcon category={job.serviceType || job.category} size="md" />

                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-[14px] font-bold text-gray-900 truncate group-hover:text-[#10B981] transition-colors mb-0.5">
                                                        {job.serviceType || job.title}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                                                        <span className="truncate max-w-[100px] sm:max-w-[180px]">{job.customerName || 'Customer'}</span>
                                                        <span>·</span>
                                                        <span className="shrink-0">{dateStr}</span>
                                                    </div>
                                                </div>

                                                <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-lg border whitespace-nowrap ${style.bg} ${style.text} ${style.border}`}>
                                                    {job.status}
                                                </span>

                                                <span className="material-icons text-gray-300 group-hover:text-gray-400 text-lg shrink-0 transition-colors">chevron_right</span>
                                            </Link>
                                        );
                                    })}
                                    
                                    {/* Infinite Scroll Trigger */}
                                    <div ref={loadMoreRef} className="py-4 flex justify-center">
                                        {loading && (
                                            <div className="w-5 h-5 border-2 border-gray-300 border-t-[#10B981] rounded-full animate-spin"></div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </div>
                </main>
            </div>

            <ProviderMobileNavBar />
        </div>
    );
};

export default MyJobs;
