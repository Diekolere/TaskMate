import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import TopNavbar from '../../components/layout/TopNavbar';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

const InboundRequests = () => {
    const { currentUser } = useAuth();
    const { jobs } = useData();
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('date');

    const requests = jobs.filter(j =>
        j.status === 'Open' ||
        (j.status === 'Pending' && j.providerId === currentUser?.uid)
    );

    const filtered = requests.filter(r => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            (r.title || r.serviceType || '').toLowerCase().includes(q) ||
            (r.location || '').toLowerCase().includes(q) ||
            (r.customerName || '').toLowerCase().includes(q)
        );
    });

    const sorted = [...filtered].sort((a, b) => {
        if (sortBy === 'price') return (Number(b.budget) || 0) - (Number(a.budget) || 0);
        const da = a.createdAt?.seconds ? a.createdAt.seconds : 0;
        const db = b.createdAt?.seconds ? b.createdAt.seconds : 0;
        return db - da;
    });

    const categoryIcon = (req) => {
        const type = (req.serviceType || req.category || '').toLowerCase();
        if (type.includes('clean')) return 'cleaning_services';
        if (type.includes('repair') || type.includes('fix')) return 'home_repair_service';
        if (type.includes('plumb')) return 'plumbing';
        if (type.includes('elec')) return 'electrical_services';
        return 'handyman';
    };

    return (
        <div className="min-h-screen bg-white flex font-sans">
            <ProviderSidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopNavbar breadcrumbs={['Job Requests']} />

                <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
                    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">

                        {/* Search & Sort */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <span className="material-icons-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search by service, location or customer…"
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all"
                                />
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <button
                                    onClick={() => setSortBy('date')}
                                    className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-colors whitespace-nowrap ${sortBy === 'date' ? 'bg-[#0F172A] text-white border-[#0F172A]' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                >
                                    By Date
                                </button>
                                <button
                                    onClick={() => setSortBy('price')}
                                    className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-colors whitespace-nowrap ${sortBy === 'price' ? 'bg-[#0F172A] text-white border-[#0F172A]' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                >
                                    By Price
                                </button>
                            </div>
                        </div>

                        {/* Count */}
                        {sorted.length > 0 && (
                            <p className="text-sm text-gray-500">
                                <span className="font-bold text-gray-900">{sorted.length}</span> {sorted.length === 1 ? 'request' : 'requests'} available
                            </p>
                        )}

                        {/* Request List */}
                        <div className="space-y-4">
                            <AnimatePresence mode="popLayout">
                                {sorted.length === 0 ? (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center justify-center py-16 text-center"
                                    >
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                            <span className="material-icons-outlined text-3xl text-gray-300">inbox</span>
                                        </div>
                                        <h3 className="font-bold text-gray-900">No requests found</h3>
                                        <p className="text-sm text-gray-400 mt-1">
                                            {search ? 'Try a different search term.' : 'Check back later for new opportunities.'}
                                        </p>
                                    </motion.div>
                                ) : (
                                    sorted.map((req, idx) => (
                                        <motion.article
                                            key={req.id}
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ delay: idx * 0.05, duration: 0.2 }}
                                            className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#10B981]/30 transition-all"
                                        >
                                            <div className="p-5 flex flex-col sm:flex-row gap-4 items-start">
                                                {/* Icon */}
                                                <div className="size-12 rounded-xl bg-orange-50 text-orange-500 shrink-0 flex items-center justify-center">
                                                    <span className="material-icons-outlined text-2xl">{categoryIcon(req)}</span>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap justify-between items-start gap-2 mb-1">
                                                        <h3 className="font-bold text-gray-900 group-hover:text-[#10B981] transition-colors text-[15px]">
                                                            {req.serviceType || req.title}
                                                        </h3>
                                                        {req.urgency === 'High' && (
                                                            <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-md border border-red-100 uppercase tracking-wide">
                                                                Urgent
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-400 mb-2">
                                                        ID #{req.id.substring(0, 6)} · Posted {req.createdAt ? new Date(req.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
                                                    </p>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-gray-600">
                                                        <span className="flex items-center gap-1.5">
                                                            <span className="material-icons-outlined text-base text-gray-400">person</span>
                                                            {req.customerName || 'Customer'}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <span className="material-icons-outlined text-base text-gray-400">location_on</span>
                                                            {req.location || 'Location TBD'}
                                                        </span>
                                                    </div>
                                                    {req.description && (
                                                        <p className="text-sm text-gray-500 mt-2 line-clamp-1">{req.description}</p>
                                                    )}
                                                </div>

                                                {/* Price + Action */}
                                                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 sm:pl-4 sm:border-l border-gray-100">
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Budget</p>
                                                        <p className="text-xl font-bold text-[#10B981]">
                                                            {req.budget ? `₦${Number(req.budget).toLocaleString()}` : 'Negotiable'}
                                                        </p>
                                                    </div>
                                                    <Link
                                                        to={`/provider/requests/${req.id}`}
                                                        className="bg-[#0F172A] text-white hover:bg-slate-700 font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                                                    >
                                                        View Details
                                                        <span className="material-icons-outlined text-base">arrow_forward</span>
                                                    </Link>
                                                </div>
                                            </div>
                                        </motion.article>
                                    ))
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

export default InboundRequests;
