import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Tutorial from '../../components/ui/Tutorial';

const MyJobs = () => {
    const { jobs: allJobs } = useData();
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('active');

    const tutorialSteps = [
        {
            target: '#tour-provider-jobs-tabs',
            content: 'Switch between your active ongoing jobs and those you have already completed or canceled.',
            disableBeacon: true,
        },
        {
            target: '#tour-provider-jobs-list',
            content: 'Here are the details for your assigned jobs. Click "View Details" to update the job status or communicate with the customer.',
        }
    ];

    // Filter jobs assigned to current provider
    const myJobs = allJobs.filter(j => j.providerId === currentUser?.uid);

    // Context Data
    const activeJobs = myJobs.filter(j => !['Completed', 'Canceled'].includes(j.status));
    const completedJobs = myJobs.filter(j => ['Completed', 'Canceled'].includes(j.status));

    const displayJobs = activeTab === 'active' ? activeJobs : completedJobs;

    return (
        <div className="min-h-screen bg-white flex font-sans text-text-light">
            <Tutorial steps={tutorialSteps} tutorialKey="providerJobs" />
            <ProviderSidebar />
            <ProviderMobileNavBar />

            <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 md:px-8 h-16 flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-800">My Jobs</h1>
                    <div className="flex gap-2">
                         <Link to="/provider/schedule" className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors">
                            <span className="material-symbols-outlined text-lg">calendar_month</span>
                            Calendar
                         </Link>
                    </div>
                </header>

                <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
                    {/* Tabs */}
                    <div className="border-b border-gray-200" id="tour-provider-jobs-tabs">
                        <div className="flex gap-8 overflow-x-auto no-scrollbar">
                            <button 
                                onClick={() => setActiveTab('active')}
                                className={`group flex flex-col items-center pb-3 min-w-[100px] cursor-pointer transition-colors ${activeTab === 'active' ? 'text-primary' : 'text-gray-500 hover:text-gray-800'}`}
                            >
                                <span className="font-bold text-sm mb-3">Active Jobs ({activeJobs.length})</span>
                                <div className={`h-0.5 w-full rounded-full transition-colors ${activeTab === 'active' ? 'bg-primary' : 'bg-transparent group-hover:bg-gray-200'}`}></div>
                            </button>
                            <button 
                                onClick={() => setActiveTab('completed')}
                                className={`group flex flex-col items-center pb-3 min-w-[100px] cursor-pointer transition-colors ${activeTab === 'completed' ? 'text-primary' : 'text-gray-500 hover:text-gray-800'}`}
                            >
                                <span className="font-bold text-sm mb-3">Completed ({completedJobs.length})</span>
                                <div className={`h-0.5 w-full rounded-full transition-colors ${activeTab === 'completed' ? 'bg-primary' : 'bg-transparent group-hover:bg-gray-200'}`}></div>
                            </button>
                        </div>
                    </div>

                    {/* Jobs List */}
                    <div className="space-y-4" id="tour-provider-jobs-list">
                        <AnimatePresence mode="wait">
                            {displayJobs.length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-12 text-center"
                                >
                                    <div className="bg-gray-100 p-4 rounded-full mb-4">
                                        <span className="material-symbols-outlined text-4xl text-gray-400">work_off</span>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900">No jobs found</h3>
                                    <p className="text-gray-500">You don't have any {activeTab} jobs at the moment.</p>
                                </motion.div>
                            ) : (
                                displayJobs.map((job) => (
                                    <motion.div
                                        key={job.id}
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        transition={{ duration: 0.2 }}
                                        className="group bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary/50 transition-all"
                                    >
                                        <div className="flex flex-col md:flex-row gap-5 items-start">
                                            {/* Icon */}
                                            <div className="size-14 rounded-xl bg-primary/10 text-primary flex-shrink-0 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-3xl">
                                                    {job.serviceType?.toLowerCase().includes('clean') ? 'cleaning_services' : 
                                                     job.serviceType?.toLowerCase().includes('repair') ? 'home_repair_service' : 'handyman'}
                                                </span>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 w-full">
                                                <div className="flex flex-wrap justify-between items-start mb-1">
                                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">{job.serviceType || job.title}</h3>
                                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                                                        activeTab === 'active' 
                                                            ? 'bg-blue-50 text-blue-700 border-blue-100' 
                                                            : 'bg-green-50 text-green-700 border-green-100'
                                                    }`}>
                                                        {job.status.toUpperCase()}
                                                    </span>
                                                </div>
                                                <p className="text-gray-500 text-sm mb-3">
                                                    ID: #{job.id.substring(0, 6)} • {job.createdAt ? new Date(job.createdAt.seconds * 1000).toLocaleDateString() : 'Date N/A'}
                                                </p>
                                                
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
                                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                                        <span className="material-symbols-outlined text-lg text-gray-400">person</span>
                                                        <span className="font-medium">{job.customerName || 'Customer'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                                        <span className="material-symbols-outlined text-lg text-gray-400">location_on</span>
                                                        <span>{job.location}</span>
                                                    </div>
                                                </div>
                                                
                                                <p className="text-sm text-gray-500 mt-3 line-clamp-1">
                                                    {job.description}
                                                </p>
                                            </div>

                                            {/* Action */}
                                            <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 mt-2 md:mt-0 pl-0 md:pl-4 md:border-l border-gray-100">
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Budget</p>
                                                    <p className="text-2xl font-black text-primary">{job.budget || 'Negotiable'}</p>
                                                </div>
                                                <Link 
                                                    to={`/provider/jobs/${job.id}`}
                                                    className="w-full md:w-auto bg-white border border-gray-200 hover:border-primary hover:text-primary text-gray-700 font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                                                >
                                                    <span>View Details</span>
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MyJobs;
