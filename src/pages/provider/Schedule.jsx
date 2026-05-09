import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import TopNavbar from '../../components/layout/TopNavbar';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

const Schedule = () => {
    const { jobs: allJobs } = useData();
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('upcoming');

    const handleAction = (action, jobTitle) => {
        if (action === 'start') toast.success(`Started: ${jobTitle}`, { description: 'Good luck! Track your time carefully.' });
        else if (action === 'call') toast.info('Calling customer…', { description: 'Connecting you securely.' });
    };

    const myJobs = allJobs.filter(j => j.providerId === currentUser?.uid);

    const groupByDate = (list) => {
        const groups = {};
        list.forEach(job => {
            const dateObj = job.createdAt?.seconds ? new Date(job.createdAt.seconds * 1000) : new Date();
            const date = dateObj.toDateString();
            if (!groups[date]) groups[date] = [];
            const timeStart = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            groups[date].push({
                id: job.id,
                title: job.title || job.serviceType || 'Service Request',
                customer: job.customerName || 'Customer',
                time: `${timeStart} - Est.`,
                address: job.location || 'No address',
                status: job.status?.toLowerCase() || 'pending',
                price: job.budget || '—',
            });
        });
        return Object.keys(groups).map(date => ({ date, jobs: groups[date] }));
    };

    const upcomingJobs = myJobs.filter(j => ['confirmed', 'scheduled', 'in-progress', 'in progress', 'started'].includes(j.status?.toLowerCase()));
    const pendingJobs = myJobs.filter(j => ['pending', 'awaiting', 'open'].includes(j.status?.toLowerCase()));
    const historyJobs = myJobs.filter(j => ['completed', 'cancelled'].includes(j.status?.toLowerCase()));

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

    const statusColor = (status) => {
        const map = {
            confirmed: 'bg-[#10B981]/10 text-[#10B981]',
            pending: 'bg-amber-50 text-amber-700',
            completed: 'bg-gray-100 text-gray-600',
        };
        return map[status] || 'bg-blue-50 text-blue-600';
    };

    return (
        <div className="min-h-screen bg-white flex font-sans">
            <ProviderSidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopNavbar breadcrumbs={['Schedule']} />

                <main className="flex-1 overflow-y-auto pb-24 md:pb-0">

                    {/* Tabs — sticky under navbar */}
                    <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
                        <div className="px-4 sm:px-6 md:px-8 max-w-4xl mx-auto flex gap-1 overflow-x-auto">
                            {tabs.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                                        activeTab === tab.key
                                            ? 'border-[#10B981] text-[#10B981]'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${activeTab === tab.key ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-gray-100 text-gray-500'}`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-8">
                        {scheduleData[activeTab]?.length > 0 ? (
                            scheduleData[activeTab].map((group, idx) => (
                                <div key={idx}>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 pl-1">{group.date}</h3>
                                    <div className="space-y-4">
                                        {group.jobs.map(job => (
                                            <motion.div
                                                key={job.id}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:border-gray-200 transition-all"
                                            >
                                                <div className="p-5 flex flex-col sm:flex-row gap-5">
                                                    {/* Time + Status */}
                                                    <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:w-28 shrink-0">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${statusColor(job.status)}`}>
                                                            {job.status}
                                                        </span>
                                                        <p className="text-sm font-bold text-gray-900">{job.time.split('-')[0]}</p>
                                                    </div>

                                                    {/* Details */}
                                                    <div className="flex-1 sm:border-l sm:border-gray-100 sm:pl-5 min-w-0">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="font-bold text-gray-900 text-[15px]">{job.title}</h4>
                                                            <span className="font-bold text-[#10B981] text-sm shrink-0 ml-2">₦{typeof job.price === 'number' ? job.price.toLocaleString() : job.price}</span>
                                                        </div>
                                                        <div className="space-y-1.5 mb-4">
                                                            <p className="text-sm text-gray-500 flex items-center gap-1.5">
                                                                <span className="material-icons-outlined text-base text-gray-400">person</span>
                                                                {job.customer}
                                                            </p>
                                                            <p className="text-sm text-gray-500 flex items-center gap-1.5">
                                                                <span className="material-icons-outlined text-base text-gray-400">location_on</span>
                                                                {job.address}
                                                            </p>
                                                        </div>

                                                        {activeTab === 'upcoming' && (
                                                            <div className="flex gap-2 pt-3 border-t border-gray-50">
                                                                <button
                                                                    onClick={() => handleAction('call', job.title)}
                                                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 text-gray-700 text-xs font-semibold hover:bg-gray-100 transition-colors"
                                                                >
                                                                    <span className="material-icons-outlined text-sm">call</span>
                                                                    Call
                                                                </button>
                                                                <Link to={`/provider/jobs/${job.id}`}
                                                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 text-gray-700 text-xs font-semibold hover:bg-gray-100 transition-colors"
                                                                >
                                                                    <span className="material-icons-outlined text-sm">info</span>
                                                                    Details
                                                                </Link>
                                                                {job.status === 'confirmed' && (
                                                                    <button
                                                                        onClick={() => handleAction('start', job.title)}
                                                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10B981] text-white text-xs font-bold hover:bg-[#059669] transition-colors shadow-sm"
                                                                    >
                                                                        Start Job
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20">
                                <span className="material-icons-outlined text-5xl text-gray-200">event_busy</span>
                                <p className="text-gray-400 font-medium mt-3 text-sm">No jobs in this section</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <ProviderMobileNavBar />
        </div>
    );
};

export default Schedule;
