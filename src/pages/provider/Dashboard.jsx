import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import TopNavbar from '../../components/layout/TopNavbar';
import KYCModal from '../../components/provider/KYCModal';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

const categoryIcon = (cat) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('plumb')) return 'plumbing';
    if (c.includes('clean')) return 'cleaning_services';
    if (c.includes('elec')) return 'electrical_services';
    return 'handyman';
};

const ProviderDashboard = () => {
    const { currentUser } = useAuth();
    const { jobs } = useData();

    const isVerified = currentUser?.isVerified || currentUser?.is_verified || true;
    const kycCompleted = currentUser?.kycCompleted ?? true;
    const [kycOpen, setKycOpen] = useState(false);

    const st = (v) => String(v || '').toLowerCase().replace(/\s+/g, '_');

    const completedJobs = jobs.filter(j =>
        (j.providerId === currentUser?.id || j.provider_id === currentUser?.id) &&
        ['completed', 'payment_released'].includes(st(j.status))
    );

    const totalEarnings = completedJobs.reduce((acc, j) => acc + (Number(j.finalAmount) || Number(j.budget) || 0), 0);

    const now = new Date();
    const monthlyJobs = completedJobs.filter(j => {
        const d = j.completedAt ? new Date(j.completedAt) : (j.updatedAt instanceof Date ? j.updatedAt : null);
        return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const nearbyRequests = jobs.filter(j =>
        st(j.status) === 'open' ||
        (st(j.status) === 'pending' && (j.providerId === currentUser?.id || j.provider_id === currentUser?.id))
    );

    const schedule = jobs.filter(j =>
        ['scheduled', 'in_progress'].includes(st(j.status)) &&
        (j.providerId === currentUser?.id || j.provider_id === currentUser?.id)
    );


    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const firstName = (currentUser?.displayName || currentUser?.full_name || 'Provider').split(' ')[0];

    return (
        <div className="min-h-screen bg-white flex font-sans">
            <ProviderSidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopNavbar breadcrumbs={['Overview']} />

                <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
                    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">

                        {/* Account Review Banner */}
                        {!isVerified && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-amber-50 border border-amber-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-3"
                            >
                                <div className="bg-amber-100 p-2 rounded-xl shrink-0">
                                    <span className="material-icons-outlined text-amber-600 text-xl">pending_actions</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-amber-900 text-sm mb-0.5">Account Under Review</h3>
                                    <p className="text-amber-700 text-sm leading-relaxed">
                                        Your profile is being verified. Once approved (24–48 hrs) you can accept requests.
                                    </p>
                                </div>
                                <button className="shrink-0 px-4 py-2 bg-white text-amber-700 text-xs font-bold rounded-xl border border-amber-200 hover:bg-amber-50 transition-colors">
                                    Check Status
                                </button>
                            </motion.div>
                        )}

                        {/* ── Greeting ── */}
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                                    {greeting}, {firstName} 👋
                                </h2>
                                <p className="text-sm text-gray-400 mt-0.5">
                                    {now.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </p>
                            </div>

                            {/* Availability toggle — desktop only (sm+) */}
                            <label className={`hidden sm:flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm cursor-pointer select-none shrink-0 ${!isVerified ? 'opacity-40 pointer-events-none' : ''}`}>
                                <div className={`w-2 h-2 rounded-full shrink-0 ${isVerified ? 'bg-[#10B981] animate-pulse' : 'bg-gray-300'}`} />
                                <span className="text-sm font-semibold text-gray-700">Available</span>
                                <div className="relative">
                                    <input type="checkbox" className="sr-only peer" defaultChecked={isVerified} />
                                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-[17px] after:w-[17px] after:transition-all peer-checked:bg-[#10B981]" />
                                </div>
                            </label>
                        </div>

                        {/* ── KYC nudge ── */}
                        {!kycCompleted && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm"
                            >
                                <div className="flex items-start sm:items-center gap-3">
                                    <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                                        <span className="material-icons text-amber-500 text-lg">badge</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Identity verification required</p>
                                        <p className="text-xs text-gray-400 mt-0.5">Complete KYC to receive payments and access all jobs.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setKycOpen(true)}
                                    className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-[#0F172A] text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition-colors"
                                >
                                    <span className="material-icons text-sm">verified_user</span>
                                    Complete Now
                                </button>
                            </motion.div>
                        )}

                        {/* ── Stats — 2 cards, half each ── */}
                        <div className={`grid grid-cols-2 gap-3 sm:gap-5 ${!isVerified ? 'opacity-40 pointer-events-none select-none' : ''}`}>

                            {/* Dark — Total Earnings */}
                            <div className="bg-[#0F172A] text-white p-5 sm:p-6 rounded-2xl shadow-md relative overflow-hidden">
                                <div className="absolute -bottom-4 -right-4 opacity-[0.07] pointer-events-none">
                                    <span className="material-icons-outlined" style={{ fontSize: '6rem' }}>payments</span>
                                </div>
                                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider opacity-50 mb-2">Total Earnings</p>
                                <h2 className="text-2xl sm:text-3xl font-bold leading-none mb-3">
                                    ₦{totalEarnings.toLocaleString()}
                                </h2>
                                <p className="text-xs sm:text-sm opacity-50 font-medium">
                                    {completedJobs.length} job{completedJobs.length !== 1 ? 's' : ''} completed
                                </p>
                            </div>

                            {/* Green — This Month */}
                            <div className="bg-[#10B981] text-white p-5 sm:p-6 rounded-2xl shadow-md relative overflow-hidden">
                                <div className="absolute -bottom-4 -right-4 opacity-[0.1] pointer-events-none">
                                    <span className="material-icons-outlined" style={{ fontSize: '6rem' }}>assignment_turned_in</span>
                                </div>
                                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider opacity-70 mb-2">This Month</p>
                                <h2 className="text-2xl sm:text-3xl font-bold leading-none mb-3">
                                    {monthlyJobs.length}
                                    <span className="text-sm font-medium opacity-70 ml-1">jobs</span>
                                </h2>
                                <p className="text-xs sm:text-sm opacity-80 font-medium">
                                    {nearbyRequests.length} open nearby
                                </p>
                            </div>
                        </div>

                        {/* Availability toggle — mobile only, below cards */}
                        <label className={`sm:hidden flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-5 py-3.5 shadow-sm cursor-pointer select-none w-full ${!isVerified ? 'opacity-40 pointer-events-none' : ''}`}>
                            <div className="flex items-center gap-2.5">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${isVerified ? 'bg-[#10B981] animate-pulse' : 'bg-gray-300'}`} />
                                <span className="text-sm font-semibold text-gray-700">Available for jobs</span>
                            </div>
                            <div className="relative">
                                <input type="checkbox" className="sr-only peer" defaultChecked={isVerified} />
                                <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-[17px] after:w-[17px] after:transition-all peer-checked:bg-[#10B981]" />
                            </div>
                        </label>

                        {/* ── Main grid ── */}
                        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-5 ${!isVerified ? 'opacity-40 grayscale pointer-events-none select-none' : ''}`}>

                            {/* Requests list — 2/3 width on desktop */}
                            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                                        <h3 className="font-bold text-gray-900 text-sm">New Requests Nearby</h3>
                                    </div>
                                    <Link to="/provider/requests" className="text-xs font-bold text-[#10B981] hover:underline">
                                        View all
                                    </Link>
                                </div>

                                {nearbyRequests.length > 0 ? (
                                    <ul className="divide-y divide-gray-50">
                                        {nearbyRequests.slice(0, 5).map((job) => (
                                            <li key={job.id}>
                                                <Link
                                                    to={`/provider/requests/${job.id}`}
                                                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/70 transition-colors group"
                                                >
                                                    {/* Icon */}
                                                    <div className="size-9 rounded-xl bg-[#10B981]/10 text-[#10B981] shrink-0 flex items-center justify-center">
                                                        <span className="material-icons-outlined text-base">{categoryIcon(job.category)}</span>
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-gray-900 text-sm group-hover:text-[#10B981] transition-colors truncate">
                                                            {job.title || job.serviceType}
                                                        </p>
                                                        <p className="text-xs text-gray-400 truncate mt-0.5">
                                                            {job.location || 'No location'} · {job.urgency || 'Normal'}
                                                        </p>
                                                    </div>

                                                    {/* Budget */}
                                                    <div className="text-right shrink-0">
                                                        <p className="font-bold text-gray-900 text-sm">
                                                            ₦{Number(job.budget || 0).toLocaleString()}
                                                        </p>
                                                        <p className="text-[10px] text-[#10B981] font-semibold mt-0.5">Open</p>
                                                    </div>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="px-5 py-12 flex flex-col items-center text-center">
                                        <span className="material-icons-outlined text-3xl text-gray-200 mb-2">radar</span>
                                        <p className="font-semibold text-gray-700 text-sm">No requests nearby</p>
                                        <p className="text-xs text-gray-400 mt-1 max-w-xs">
                                            We're scanning your area. You'll be notified when a match is found.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Right column — 1/3 width on desktop, full on mobile */}
                            <div className="flex flex-col gap-4">

                                {/* Upcoming */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
                                        <h3 className="font-bold text-gray-900 text-sm">Upcoming</h3>
                                        <Link to="/provider/schedule" className="text-xs font-bold text-[#10B981] hover:underline">
                                            Calendar
                                        </Link>
                                    </div>
                                    {schedule.length > 0 ? (
                                        <ul className="divide-y divide-gray-50">
                                            {schedule.slice(0, 3).map((item, i) => (
                                                <li key={i}>
                                                    <Link to="/provider/jobs" className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/70 transition-colors">
                                                        <div className="flex flex-col items-center bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 shrink-0 text-center min-w-[2.2rem]">
                                                            <span className="text-[8px] font-bold text-red-400 uppercase leading-none">Today</span>
                                                            <span className="text-sm font-bold text-gray-900 leading-none mt-0.5">{now.getDate()}</span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                                                            <p className="text-xs text-gray-400 truncate">{item.location || 'Client location'}</p>
                                                        </div>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="px-5 py-8 text-center">
                                            <span className="material-icons-outlined text-2xl text-gray-200">event_busy</span>
                                            <p className="text-xs text-gray-400 mt-1">No upcoming jobs</p>
                                        </div>
                                    )}
                                </div>


                            </div>
                        </div>

                    </div>
                </main>
            </div>

            <ProviderMobileNavBar />

            <KYCModal
                open={kycOpen}
                onClose={() => setKycOpen(false)}
                onComplete={() => setKycOpen(false)}
            />
        </div>
    );
};

export default ProviderDashboard;
