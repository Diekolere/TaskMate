import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import TopNavbar from '../../components/layout/TopNavbar';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

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

const categoryIcon = (job) => {
    const t = (job.serviceType || job.category || '').toLowerCase();
    if (t.includes('clean')) return 'cleaning_services';
    if (t.includes('repair') || t.includes('fix')) return 'home_repair_service';
    if (t.includes('plumb')) return 'plumbing';
    if (t.includes('elec')) return 'electrical_services';
    return 'handyman';
};

const MyJobs = () => {
    const { jobs: allJobs } = useData();
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('active');

    const myJobs = allJobs.filter(j => j.providerId === currentUser?.uid);
    const activeJobs = myJobs.filter(j => !['Completed', 'Canceled', 'payment_released'].includes(j.status));
    const completedJobs = myJobs.filter(j => ['Completed', 'Canceled', 'payment_released'].includes(j.status));
    const displayJobs = activeTab === 'active' ? activeJobs : completedJobs;

    const tabs = [
        { key: 'active', label: 'Active', count: activeJobs.length },
        { key: 'completed', label: 'Completed', count: completedJobs.length },
    ];

    return (
        <div className="min-h-screen bg-white flex font-sans">
            <ProviderSidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopNavbar breadcrumbs={['My Jobs']} />

                <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
                    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">

                        {/* Tabs */}
                        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                            {tabs.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                                        activeTab === tab.key
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {tab.label}
                                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${activeTab === tab.key ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-gray-200 text-gray-500'}`}>
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Jobs List */}
                        <div className="space-y-4">
                            <AnimatePresence mode="wait">
                                {displayJobs.length === 0 ? (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex flex-col items-center justify-center py-16 text-center"
                                    >
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                            <span className="material-icons-outlined text-3xl text-gray-300">work_off</span>
                                        </div>
                                        <h3 className="font-bold text-gray-900">No {activeTab} jobs</h3>
                                        <p className="text-sm text-gray-400 mt-1">
                                            {activeTab === 'active'
                                                ? 'Browse requests to start accepting jobs.'
                                                : 'Completed jobs will appear here.'}
                                        </p>
                                        {activeTab === 'active' && (
                                            <Link to="/provider/requests" className="mt-4 px-5 py-2.5 bg-[#0F172A] text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-colors">
                                                Browse Requests
                                            </Link>
                                        )}
                                    </motion.div>
                                ) : (
                                    displayJobs.map((job, idx) => {
                                        const style = getStatusStyle(job.status);
                                        return (
                                            <motion.div
                                                key={job.id}
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ delay: idx * 0.04, duration: 0.2 }}
                                                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all"
                                            >
                                                <div className="p-5 flex flex-col sm:flex-row gap-4 items-start">
                                                    {/* Icon */}
                                                    <div className="size-12 rounded-xl bg-[#10B981]/10 text-[#10B981] shrink-0 flex items-center justify-center">
                                                        <span className="material-icons-outlined text-2xl">{categoryIcon(job)}</span>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap justify-between items-start gap-2 mb-1">
                                                            <h3 className="font-bold text-gray-900 text-[15px] group-hover:text-[#10B981] transition-colors">
                                                                {job.serviceType || job.title}
                                                            </h3>
                                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wide ${style.bg} ${style.text} ${style.border}`}>
                                                                {job.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-400 mb-2">
                                                            ID #{job.id.substring(0, 6)} · {job.createdAt ? new Date(job.createdAt.seconds * 1000).toLocaleDateString() : 'Date N/A'}
                                                        </p>
                                                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-gray-600">
                                                            <span className="flex items-center gap-1.5">
                                                                <span className="material-icons-outlined text-base text-gray-400">person</span>
                                                                {job.customerName || 'Customer'}
                                                            </span>
                                                            <span className="flex items-center gap-1.5">
                                                                <span className="material-icons-outlined text-base text-gray-400">location_on</span>
                                                                {job.location || 'Location TBD'}
                                                            </span>
                                                        </div>
                                                        {job.description && (
                                                            <p className="text-sm text-gray-500 mt-2 line-clamp-1">{job.description}</p>
                                                        )}
                                                    </div>

                                                    {/* Budget + Action */}
                                                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 sm:pl-4 sm:border-l border-gray-100">
                                                        <div className="text-right">
                                                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Budget</p>
                                                            <p className="text-xl font-bold text-[#10B981]">
                                                                {job.budget ? `₦${Number(job.budget).toLocaleString()}` : 'Negotiable'}
                                                            </p>
                                                        </div>
                                                        <Link
                                                            to={job.status === 'negotiating' || job.status === 'provider_accepted' ? `/provider/negotiation/${job.id}` : `/provider/jobs/${job.id}`}
                                                            className="border border-gray-200 hover:border-[#10B981] hover:text-[#10B981] text-gray-700 font-semibold text-sm px-5 py-2.5 rounded-xl transition-all whitespace-nowrap"
                                                        >
                                                            {job.status === 'negotiating' || job.status === 'provider_accepted' ? 'Negotiate' : 'View Details'}
                                                        </Link>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </AnimatePresence>
                        </div>

                    </div>
                </main>
            </div>

            <ProviderMobileNavBar />
        </div>
    );
};

export default MyJobs;
