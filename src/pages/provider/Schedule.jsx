import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

const Schedule = () => {
    const { jobs: allJobs } = useData();
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('upcoming');

    const breadcrumbItems = [
        { label: 'Dashboard', href: '/provider/dashboard' },
        { label: 'Schedule', href: '#' },
    ];

    const handleAction = (action, jobTitle) => {
        if (action === 'start') {
            toast.success(`Started job: ${jobTitle}`, {
                description: 'Good luck! Remember to track your time.',
                duration: 4000,
            });
        } else if (action === 'call') {
            toast.info(`Calling customer...`, {
                description: 'Connecting you securely.',
            });
        }
    };

    // Filter jobs assigned to me
    const myJobs = allJobs.filter(j => j.providerId === currentUser?.uid);

    // Helper to format date groups
    const groupByDate = (jobsList) => {
        const groups = {};
        jobsList.forEach(job => {
            const dateObj = job.createdAt?.seconds ? new Date(job.createdAt.seconds * 1000) : new Date();
            const date = dateObj.toDateString();
            
            if (!groups[date]) groups[date] = [];
            
            const timeStart = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            groups[date].push({
                id: job.id,
                title: job.title || job.serviceType || 'Service Request',
                customer: job.customerName || 'Customer',
                time: `${timeStart} - Est.`, // Format to prevent crash on split('-')
                address: job.location || 'No address',
                status: job.status?.toLowerCase() || 'pending',
                price: job.budget || '—',
                type: job.category || 'General'
            });
        });
        
        // Convert to array
        return Object.keys(groups).map(date => ({ 
            date, 
            jobs: groups[date] 
        }));
    };

    const upcomingJobs = myJobs.filter(j => ['confirmed', 'scheduled', 'in-progress', 'in progress', 'started'].includes(j.status?.toLowerCase()));
    const pendingJobs = myJobs.filter(j => ['pending', 'awaiting', 'open'].includes(j.status?.toLowerCase()));
    const historyJobs = myJobs.filter(j => ['completed', 'cancelled'].includes(j.status?.toLowerCase()));

    const scheduleData = {
        upcoming: groupByDate(upcomingJobs),
        pending: groupByDate(pendingJobs),
        history: groupByDate(historyJobs)
    };


    return (
        <div className="min-h-screen bg-white flex font-sans text-text-light">
            <ProviderSidebar />
            <ProviderMobileNavBar />

            <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
                 {/* Header */}
                 <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
                    <div className="h-16 flex items-center justify-between px-4 md:px-8">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-semibold text-gray-800">My Schedule</h1>
                        </div>
                        <div className="flex gap-2">
                             <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                                 <span className="material-symbols-outlined">calendar_month</span>
                             </button>
                             <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                                 <span className="material-symbols-outlined">filter_list</span>
                             </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="px-4 md:px-8 flex gap-6 overflow-x-auto no-scrollbar">
                        {['upcoming', 'pending', 'history'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-3 text-sm font-bold capitalize whitespace-nowrap border-b-2 transition-colors ${
                                    activeTab === tab 
                                    ? 'border-primary text-primary' 
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                 </header>

                 <div className="p-4 md:p-8 max-w-4xl mx-auto">
                    <Breadcrumbs items={breadcrumbItems} />

                    <div className="space-y-8 mt-6">
                        {scheduleData[activeTab]?.map((group, idx) => (
                            <div key={idx}>
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 pl-1">{group.date}</h3>
                                <div className="space-y-4">
                                    {group.jobs.map((job) => (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={job.id} 
                                            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:border-gray-300 transition-all"
                                        >
                                            <div className="p-5 flex flex-col md:flex-row gap-5">
                                                {/* Time Column */}
                                                <div className="flex flex-row md:flex-col items-center md:items-start gap-3 md:w-32 shrink-0">
                                                    <div className={`px-2 py-1 rounded-md text-xs font-bold uppercase
                                                        ${job.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                                                          job.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                          job.status === 'completed' ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-600'
                                                        }`}>
                                                        {job.status}
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-900">{job.time.split('-')[0]}</p>
                                                    <p className="text-xs text-gray-500 hidden md:block">{job.time.split('-')[1]}</p>
                                                </div>

                                                {/* Main Details */}
                                                <div className="flex-1 border-l-0 md:border-l border-gray-100 md:pl-5">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-bold text-gray-900 text-lg">{job.title}</h4>
                                                        <span className="font-bold text-primary">{job.price}</span>
                                                    </div>
                                                    
                                                    <div className="space-y-2 mb-4">
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <span className="material-symbols-outlined text-lg text-gray-400">person</span>
                                                            {job.customer}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <span className="material-symbols-outlined text-lg text-gray-400">location_on</span>
                                                            {job.address}
                                                        </div>
                                                    </div>

                                                    {/* Actions (Only for Upcoming) */}
                                                    {activeTab === 'upcoming' && (
                                                        <div className="flex gap-3 pt-3 border-t border-gray-50">
                                                            <button 
                                                                onClick={() => handleAction('call', job.title)}
                                                                className="flex-1 py-3 md:py-2 flex items-center justify-center gap-2 rounded-xl bg-gray-50 text-gray-700 text-sm font-bold hover:bg-gray-100 transition-colors"
                                                            >
                                                                <span className="material-symbols-outlined text-lg">call</span>
                                                                Call
                                                            </button>
                                                            <Link 
                                                                to={`/provider/jobs/${job.id}`}
                                                                className="flex-1 py-3 md:py-2 flex items-center justify-center gap-2 rounded-xl bg-gray-50 text-gray-700 text-sm font-bold hover:bg-gray-100 transition-colors"
                                                            >
                                                                <span className="material-symbols-outlined text-lg">info</span>
                                                                Details
                                                            </Link>
                                                            {job.status === 'confirmed' && (
                                                                <button 
                                                                    onClick={() => handleAction('start', job.title)}
                                                                    className="flex-[2] py-3 md:py-2 flex items-center justify-center gap-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark shadow-md shadow-primary/20 transition-all"
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
                        ))}

                        {/* Empty State */}
                        {scheduleData[activeTab]?.length === 0 && (
                            <div className="text-center py-20 opacity-50">
                                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">event_busy</span>
                                <p className="text-gray-500 font-medium">No jobs found in this section</p>
                            </div>
                        )}
                    </div>
                 </div>
            </main>
        </div>
    );
};

export default Schedule;

