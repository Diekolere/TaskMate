import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import CategoryIcon from '../../components/ui/CategoryIcon';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import TopNavbar from '../../components/layout/TopNavbar';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

const InboundRequests = () => {
    const { currentUser } = useAuth();
    const { jobs } = useData();
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('all'); // 'all' | 'upcoming' | 'private'

    const requests = jobs.filter(j => {
        const s = String(j.status || '').toLowerCase();
        const type = String(j.request_type || j.visibility || (j.providerId ? 'private' : 'public')).toLowerCase();
        const isPublicOpen = type === 'public' && s === 'open';
        // Only show private requests that are still PENDING. Once they are accepted/negotiating, they move to My Jobs.
        const isPrivatePending = type === 'private' && j.providerId === (currentUser?.id || currentUser?.uid) && s === 'pending';
        return isPublicOpen || isPrivatePending;
    });

    const upcomingCount = requests.filter(r => !!r.scheduledDate).length;
    const privateCount = requests.filter(r => String(r.request_type || r.visibility || (r.providerId ? 'private' : 'public')).toLowerCase() === 'private').length;

    const filtered = requests.filter(r => {
        const type = String(r.request_type || r.visibility || (r.providerId ? 'private' : 'public')).toLowerCase();
        const matchesTab =
            tab === 'upcoming' ? !!r.scheduledDate :
            tab === 'private' ? type === 'private' :
            true;
        if (!matchesTab) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            (r.title || r.serviceType || '').toLowerCase().includes(q) ||
            (r.location || '').toLowerCase().includes(q) ||
            (r.customerName || '').toLowerCase().includes(q)
        );
    });

    const sorted = [...filtered].sort((a, b) => {
        if (tab === 'upcoming') {
            // Sort by scheduled date ascending
            return (a.scheduledDate || '').localeCompare(b.scheduledDate || '');
        }
        const da = a.createdAt?.seconds ? a.createdAt.seconds : 0;
        const db = b.createdAt?.seconds ? b.createdAt.seconds : 0;
        return db - da;
    });

    return (
        <div className="min-h-screen bg-white flex font-sans">
            <ProviderSidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopNavbar breadcrumbs={['Job Requests']} />

                <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
                    <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">

                        {/* Header */}
                        <div>
                            <h1 className="text-[22px] sm:text-[28px] font-extrabold text-gray-900 tracking-tight">Job Requests</h1>
                            <p className="mt-1 text-[13px] font-medium text-gray-400">Public requests nearby and private requests sent directly to you.</p>
                        </div>

                        {/* Tabs — underline style */}
                        <div className="flex gap-6 border-b border-gray-100">
                            <button
                                onClick={() => setTab('all')}
                                className={`pb-3 text-sm font-semibold transition-all border-b-2 -mb-px ${tab === 'all' ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
                            >
                                All Requests
                            </button>
                            <button
                                onClick={() => setTab('private')}
                                className={`pb-3 text-sm font-semibold transition-all border-b-2 -mb-px flex items-center gap-1.5 ${tab === 'private' ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
                            >
                                Private
                                {privateCount > 0 && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === 'private' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-gray-100 text-gray-400'}`}>
                                        {privateCount}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setTab('upcoming')}
                                className={`pb-3 text-sm font-semibold transition-all border-b-2 -mb-px flex items-center gap-1.5 ${tab === 'upcoming' ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
                            >
                                Upcoming
                                {upcomingCount > 0 && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === 'upcoming' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-gray-100 text-gray-400'}`}>
                                        {upcomingCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <span className="material-icons-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search by service, location or customer..."
                                className="w-full pl-10 pr-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all"
                            />
                        </div>

                        {/* Count */}
                        {sorted.length > 0 && (
                            <p className="text-xs text-gray-400 font-medium">
                                <span className="font-bold text-gray-700">{sorted.length}</span> {sorted.length === 1 ? 'request' : 'requests'} available
                            </p>
                        )}

                        {/* Request List */}
                        <AnimatePresence mode="popLayout">
                            {sorted.length === 0 ? (
                                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                        <span className="material-icons-outlined text-2xl text-gray-300">inbox</span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-sm">No requests found</h3>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {search ? 'Try a different search term.' : 'Check back later for new opportunities.'}
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    {sorted.map((req, idx) => (
                                        <Link
                                            key={req.id}
                                            to={`/provider/requests/${req.id}`}
                                            className={`flex items-center gap-4 py-5 group hover:bg-gray-50/60 transition-colors rounded-xl px-1 -mx-1 ${idx !== 0 ? 'border-t border-gray-100' : ''}`}
                                        >
                                            <CategoryIcon category={req.serviceType || req.category} size="md" />

                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-[15px] font-bold text-gray-900 truncate group-hover:text-[#10B981] transition-colors mb-1">
                                                    {req.serviceType || req.title}
                                                </h3>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                    <span className="truncate max-w-[100px] sm:max-w-[180px]">{req.customerName || 'Customer'}</span>
                                                    {req.scheduledDate ? (
                                                        <>
                                                            <span>·</span>
                                                            <span className="text-blue-500 font-semibold flex items-center gap-0.5 shrink-0">
                                                                <span className="material-icons-outlined text-[11px]">event</span>
                                                                {new Date(req.scheduledDate + 'T00:00:00').toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>·</span>
                                                            <span className="truncate max-w-[100px] shrink-0">{req.location || 'Location TBD'}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Badges */}
                                            <div className="shrink-0 flex items-center gap-1.5">
                                                {(req.urgency === 'High' || req.urgency === 'high') && !req.scheduledDate && (
                                                    <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-red-100 hidden sm:inline">
                                                        Urgent
                                                    </span>
                                                )}
                                                <span className="bg-blue-50 text-blue-600 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-blue-100 whitespace-nowrap">
                                                    {String(req.status || 'open').replace(/_/g, ' ').replace(/\b\w/g, m => m.toUpperCase())}
                                                </span>
                                            </div>

                                            <span className="material-icons text-gray-300 group-hover:text-gray-400 text-lg shrink-0 transition-colors">chevron_right</span>
                                        </Link>
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

export default InboundRequests;
