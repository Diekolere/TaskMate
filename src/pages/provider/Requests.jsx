import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Tutorial from '../../components/ui/Tutorial';

const InboundRequests = () => {
    const { currentUser } = useAuth();
    const { jobs } = useData();
    const [filter, setFilter] = useState('all');

    const tutorialSteps = [
        {
            target: '#tour-request-filters',
            content: 'Use these filters to easily search for specific requests or sort them based on your preferences.',
            disableBeacon: true,
        },
        {
            target: '#tour-request-list',
            content: 'Here you can see all available customer requests. Click "View Details" to see more information or accept the job.',
        }
    ];

    // Context Data for New Requests
    // Show jobs that are 'Open' OR 'Pending' (assigned to me)
    const requests = jobs.filter(j => 
        j.status === 'Open' || 
        (j.status === 'Pending' && j.providerId === currentUser?.uid)
    );

    return (
        <div className="min-h-screen bg-white flex font-sans text-text-light">
            <ProviderSidebar />
            <ProviderMobileNavBar />
            <Tutorial steps={tutorialSteps} tutorialKey="providerRequests" />

            <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 md:px-8 h-16 flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-800">Job Requests</h1>
                    <div className="flex gap-2">
                         <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors">
                            <span className="material-symbols-outlined text-lg">tune</span>
                            Filter
                         </button>
                    </div>
                </header>

                <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
                    {/* Search & Sort Toolbar */}
                    <div className="flex flex-col md:flex-row gap-4" id="tour-request-filters">
                        <div className="relative flex-1">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                            <input 
                                type="text" 
                                placeholder="Search by customer, location, or Job ID" 
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                             <button className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium whitespace-nowrap hover:border-primary transition-colors flex items-center gap-2">
                                Sort by Date <span className="material-symbols-outlined text-lg">expand_more</span>
                             </button>
                             <button className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium whitespace-nowrap hover:border-primary transition-colors flex items-center gap-2">
                                Sort by Price <span className="material-symbols-outlined text-lg">expand_more</span>
                             </button>
                        </div>
                    </div>

                    {/* Requests List */}
                    <div className="space-y-4" id="tour-request-list">
                        <AnimatePresence>
                            {requests.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
                                        <span className="material-symbols-outlined text-4xl text-gray-400">hourglass_empty</span>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900">No new requests found</h3>
                                    <p className="text-gray-500">Check back later for new opportunities.</p>
                                </div>
                            ) : (
                                requests.map((req, idx) => (
                                <motion.article
                                    key={req.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="group bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary/50 transition-all"
                                >
                                    <div className="flex flex-col md:flex-row gap-5 items-start">
                                        {/* Icon */}
                                        <div className="size-14 rounded-xl bg-orange-50 text-orange-600 flex-shrink-0 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-3xl">
                                                {req.serviceType?.toLowerCase().includes('clean') ? 'cleaning_services' : 
                                                 req.serviceType?.toLowerCase().includes('repair') ? 'home_repair_service' : 'handyman'}
                                            </span>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 w-full">
                                            <div className="flex flex-wrap justify-between items-start mb-1">
                                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">{req.serviceType || req.title}</h3>
                                                {/* Urgency Badge */}
                                                {req.urgency === 'High' && (
                                                     <span className="bg-red-50 text-red-600 text-xs font-bold px-2.5 py-1 rounded-md border border-red-100">URGENT</span>
                                                )}
                                            </div>
                                            <p className="text-gray-500 text-sm mb-3">
                                                ID: #{req.id.substring(0, 6)} • Posted {req.createdAt ? new Date(req.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
                                            </p>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
                                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                                    <span className="material-symbols-outlined text-lg text-gray-400">person</span>
                                                    <span className="font-medium">{req.customerName || 'Customer'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                                    <span className="material-symbols-outlined text-lg text-gray-400">location_on</span>
                                                    <span>{req.location}</span>
                                                </div>
                                            </div>
                                            
                                            <p className="text-sm text-gray-500 mt-3 line-clamp-1">
                                                {req.description}
                                            </p>
                                        </div>

                                        {/* Action */}
                                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 mt-2 md:mt-0 pl-0 md:pl-4 md:border-l border-gray-100">
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Est. Budget</p>
                                                <p className="text-2xl font-black text-primary">{req.budget || 'Negotiable'}</p>
                                            </div>
                                            <Link 
                                                to={`/provider/requests/${req.id}`}
                                                className="w-full md:w-auto bg-primary text-white hover:bg-primary-dark font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2"
                                            >
                                                <span>View Details</span>
                                                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                            </Link>
                                        </div>
                                    </div>
                                </motion.article>
                            )))}
                        </AnimatePresence>
                    </div>

                    <div className="flex justify-center mt-8">
                        <button className="text-gray-500 hover:text-gray-900 font-medium text-sm flex items-center gap-2 transition-colors">
                            Load more requests
                            <span className="material-symbols-outlined">expand_more</span>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default InboundRequests;
