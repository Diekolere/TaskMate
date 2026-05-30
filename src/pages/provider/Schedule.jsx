import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import CategoryIcon from '../../components/ui/CategoryIcon';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import TopNavbar from '../../components/layout/TopNavbar';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

const Schedule = () => {
    const { jobs: allJobs } = useData();
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('upcoming');

    const userId = currentUser?.uid || currentUser?.id;

    const myJobs = useMemo(
        () =>
            allJobs.filter(
                j =>
                    j.providerId === userId ||
                    j.provider_id === userId ||
                    j.worker_id === userId
            ),
        [allJobs, userId]
    );

    const groupByDate = (list) => {
        const groups = {};
        list.forEach(job => {
            const raw = job.createdAt ?? job.created_at;
            const dateObj =
                raw?.seconds != null
                    ? new Date(raw.seconds * 1000)
                    : raw
                        ? new Date(raw)
                        : new Date();
            const date = dateObj.toDateString();
            if (!groups[date]) groups[date] = [];
            groups[date].push({
                id: job.id,
                title: job.title || job.serviceType || 'Service Request',
                category: job.category || job.serviceType,
                customer: job.customerName || 'Customer',
                address: job.location || job.location_name || 'No address',
                status: job.status,
            });
        });
        return Object.keys(groups)
            .sort((a, b) => new Date(b) - new Date(a))
            .map(date => ({ date, jobs: groups[date] }));
    };

    const st = (s) => String(s || '').toLowerCase();

    const upcomingJobs = myJobs.filter(j =>
        ['confirmed', 'scheduled', 'in-progress', 'in progress', 'started', 'in_progress', 'payment_secured'].includes(st(j.status))
    );
    const pendingJobs = myJobs.filter(j =>
        ['pending', 'awaiting', 'open', 'negotiating', 'awaiting_payment'].includes(st(j.status))
    );
    const historyJobs = myJobs.filter(j =>
        ['completed', 'cancelled', 'canceled', 'payment_released'].includes(st(j.status))
    );

    const getStatusBadge = (status) => {
        const s = st(status);
        const map = {
            open: { label: 'Open', classes: 'bg-gray-50 text-gray-500 border-gray-200' },
            interested: { label: 'Interested', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
            negotiating: { label: 'Negotiating', classes: 'bg-purple-50 text-purple-700 border-purple-200' },
            awaiting_payment: { label: 'Awaiting Payment', classes: 'bg-orange-50 text-orange-700 border-orange-200' },
            payment_secured: { label: 'Locked', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
            in_progress: { label: 'In Progress', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
            completed: { label: 'Review', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
            payment_released: { label: 'Paid', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            cancelled: { label: 'Cancelled', classes: 'bg-red-50 text-red-700 border-red-200' }
        };
        return map[s] || { label: status || 'Unknown', classes: 'bg-gray-50 text-gray-500 border-gray-200' };
    };

    const scheduleData = {
        upcoming: groupByDate(upcomingJobs),
        pending: groupByDate(pendingJobs),
        history: groupByDate(historyJobs),
    };

    const tabs = [
        { key: 'upcoming', label: 'Upcoming', count: upcomingJobs.length },
        { key: 'pending', label: 'Pending', count: pendingJobs.length },
        { key: 'history', label: 'History', count: historyJobs.length },
    ];

    const flatCount = scheduleData[activeTab]?.reduce((n, g) => n + g.jobs.length, 0) ?? 0;

    return (
        <div className="min-h-screen bg-white flex font-sans">
            <ProviderSidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopNavbar breadcrumbs={['Schedule']} />

                <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
                    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">

                        <div>
                            <h1 className="text-[22px] sm:text-[28px] font-extrabold text-gray-900 tracking-tight">Schedule</h1>
                            <p className="mt-1 text-[13px] font-medium text-gray-500">
                                Your upcoming work, organised by day—tap a row to open the job.
                            </p>
                        </div>

                        <div className="flex gap-6 border-b border-gray-100 overflow-x-auto scrollbar-hide whitespace-nowrap">
                            {tabs.map(tab => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`pb-3 text-sm font-semibold flex items-center gap-1.5 transition-all border-b-2 -mb-px whitespace-nowrap shrink-0 ${
                                        activeTab === tab.key
                                            ? 'border-[#10B981] text-[#10B981]'
                                            : 'border-transparent text-gray-400 hover:text-gray-700'
                                    }`}
                                >
                                    {tab.label}
                                    <span
                                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                            activeTab === tab.key ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-gray-100 text-gray-400'
                                        }`}
                                    >
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            {flatCount === 0 ? (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center py-20 text-center"
                                >
                                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                        <span className="material-icons-outlined text-2xl text-gray-300">event_busy</span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-sm">Nothing scheduled here</h3>
                                    <p className="text-xs text-gray-400 mt-1 max-w-xs">
                                        When you accept paid work, it shows under Upcoming with the date it was booked.
                                    </p>
                                    {activeTab === 'pending' && (
                                        <Link
                                            to="/provider/requests"
                                            className="mt-4 px-5 py-2.5 bg-[#0F172A] text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-colors"
                                        >
                                            Open job requests
                                        </Link>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
                                    {scheduleData[activeTab].map((group) => (
                                        <section key={group.date}>
                                            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 pl-1">
                                                {group.date}
                                            </h2>
                                            <div className="bg-white overflow-hidden">
                                                {group.jobs.map((job, idx) => (
                                                    <Link
                                                        key={job.id}
                                                        to={`/provider/jobs/${job.id}`}
                                                        className={`flex items-center gap-3 sm:gap-4 py-4 px-4 sm:px-5 min-w-0 transition-colors hover:bg-gray-50/80 group border-b border-gray-100 ${
                                                            idx === group.jobs.length - 1 ? 'border-b-0' : ''
                                                        }`}
                                                    >
                                                        <div className="shrink-0">
                                                            <CategoryIcon category={job.category} size="md" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-[15px] font-bold text-gray-900 truncate group-hover:text-[#10B981] transition-colors">
                                                                {job.title}
                                                            </h3>
                                                            <p className="text-[13px] text-gray-500 mt-0.5 flex items-center gap-1.5 min-w-0">
                                                                <span className="truncate">{job.customer}</span>
                                                                <span className="text-gray-300 shrink-0">·</span>
                                                                <span className="truncate text-gray-500">{job.address}</span>
                                                            </p>
                                                        </div>
                                                        <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getStatusBadge(job.status).classes}`}>
                                                            {getStatusBadge(job.status).label}
                                                        </span>
                                                        <span className="material-icons text-gray-300 group-hover:text-gray-400 text-xl shrink-0">chevron_right</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        </section>
                                    ))}
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

export default Schedule;
