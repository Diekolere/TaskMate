import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import TopNavbar from '../../components/layout/TopNavbar';
import StatusUpdateModal from '../../components/provider/StatusUpdateModal';
import InvoiceUploadModal from '../../components/provider/InvoiceUploadModal';

const JobDetails = () => {
    const { id } = useParams();
    const { currentUser } = useAuth();
    const { jobs, isSimulated } = useData();
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [uploadedInvoice, setUploadedInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [job, setJob] = useState(null);

    useEffect(() => {
        if (!id || jobs.length === 0) {
            if (jobs.length === 0 && !isSimulated) setLoading(true);
            else setLoading(false);
            return;
        }
        const found = jobs.find(j => j.id === id);
        if (found) {
            setJob({
                ...found,
                timeline: found.timeline || [
                    { title: 'Request Received', time: found.createdAt instanceof Date ? found.createdAt.toLocaleString() : 'Recently', status: 'completed' },
                    { title: 'Provider Assigned', time: '—', status: 'current' },
                ],
                customer: {
                    name: found.customerName || 'Customer',
                    image: found.customerPhoto || '',
                    phone: found.customerPhone || null,
                    jobs: 0,
                },
                pricing: { total: `₦${Number(found.budget).toLocaleString()}`, method: 'Cash' },
                statusCode: found.status ? found.status.toLowerCase().replace(' ', '_') : 'pending',
            });
        }
        setLoading(false);
    }, [id, jobs, isSimulated]);

    const getStatusLabel = (code) => {
        const map = { on_way: 'On the way', arrived: 'Arrived', started: 'In Progress', parts: 'Paused (Parts)', completed: 'Completed' };
        return map[code] || 'Active';
    };

    const handleStatusUpdate = (statusCode) => {
        setIsStatusModalOpen(false);
        const label = getStatusLabel(statusCode);
        const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        toast.success(`Status updated to: ${label}`, { description: 'Customer has been notified.' });
        if (job) {
            const updated = job.timeline.map(t => t.status === 'current' ? { ...t, status: 'completed' } : t);
            updated.push({ title: label, time: `Today, ${time}`, status: 'current' });
            setJob({ ...job, status: label, statusCode, timeline: updated });
        }
    };

    const handleInvoiceUpload = (file, amount) => {
        setIsInvoiceModalOpen(false);
        toast.success('Job Completed', { description: `Commission of ₦${(amount * 0.1).toLocaleString()} added to outstanding balance.` });
        setJob({ ...job, status: 'Completed', statusCode: 'completed' });
        setUploadedInvoice({ name: file?.name || 'Payment Record', amount, date: new Date().toLocaleDateString() });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <span className="material-icons-outlined animate-spin text-3xl text-[#10B981]">progress_activity</span>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center flex-col gap-4">
                <p className="text-gray-500 text-sm">Job not found</p>
                <Link to="/provider/jobs" className="text-[#10B981] font-bold hover:underline text-sm">← Back to Jobs</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex font-sans">
            <ProviderSidebar />

            <StatusUpdateModal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} onUpdate={handleStatusUpdate} currentStatus={job.statusCode} />
            <InvoiceUploadModal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} onUpload={handleInvoiceUpload} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopNavbar breadcrumbs={['My Jobs', 'Job Details']} />

                <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
                    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">

                        {/* Page Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Link to="/provider/jobs" className="text-sm text-gray-400 hover:text-[#10B981] transition-colors flex items-center gap-1">
                                        <span className="material-icons-outlined text-base">arrow_back</span>
                                        My Jobs
                                    </Link>
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                                <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1">
                                    <span className="material-icons-outlined text-sm">tag</span>
                                    ID: #{job.id.substring(0, 12)}
                                </p>
                            </div>
                            <span className={`self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${
                                job.statusCode === 'completed'
                                    ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20'
                                    : 'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>
                                {job.statusCode !== 'completed' && <span className="size-2 rounded-full bg-blue-500 animate-pulse"></span>}
                                {job.status}
                            </span>
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Left — 2 cols */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Description */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <span className="material-icons-outlined text-[#10B981] text-lg">description</span>
                                        Issue Description
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed text-sm">{job.description || 'No description provided.'}</p>
                                </div>

                                {/* Photos */}
                                {job.photos && job.photos.length > 0 && (
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                            <span className="material-icons-outlined text-[#10B981] text-lg">image</span>
                                            Job Photos
                                        </h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {job.photos.slice(0, 2).map((photo, i) => (
                                                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                                                    <img className="w-full h-full object-cover" src={photo} alt={`Job ${i + 1}`} />
                                                </div>
                                            ))}
                                            {job.photos.length > 2 && (
                                                <div className="aspect-square rounded-xl overflow-hidden relative flex items-center justify-center bg-gray-100">
                                                    <img className="w-full h-full object-cover opacity-40" src={job.photos[2]} alt="More" />
                                                    <span className="absolute bg-gray-900/70 text-white text-sm font-bold px-3 py-1.5 rounded-full">+{job.photos.length - 2}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Location */}
                                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                                    <div className="p-6 pb-3">
                                        <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                                            <span className="material-icons-outlined text-[#10B981] text-lg">location_on</span>
                                            Location
                                        </h3>
                                        <p className="text-sm text-gray-600">{typeof job.location === 'string' ? job.location : job.location?.address || 'No location provided'}</p>
                                    </div>
                                    <div className="h-48 bg-gray-50 border-t border-gray-100 flex items-center justify-center text-gray-300">
                                        <span className="material-icons-outlined text-3xl">map</span>
                                        <span className="ml-2 text-sm">Map view</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right — 1 col */}
                            <div className="flex flex-col gap-5">
                                {/* Customer */}
                                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="size-12 rounded-full bg-gray-100 overflow-hidden ring-2 ring-[#10B981]/20 flex items-center justify-center">
                                            {job.customer.image
                                                ? <img className="w-full h-full object-cover" src={job.customer.image} alt={job.customer.name} />
                                                : <span className="material-icons-outlined text-2xl text-gray-400">person</span>
                                            }
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1">
                                                {job.customer.name}
                                                <span className="material-icons-outlined text-blue-500 text-sm">verified</span>
                                            </h3>
                                            <p className="text-xs text-gray-400">{job.customer.jobs} tasks completed</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {job.customer.phone ? (
                                            <a href={`tel:${job.customer.phone}`}
                                                className="w-full py-2.5 rounded-xl bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 hover:bg-[#10B981]/20 transition-colors flex items-center justify-center gap-2 font-semibold text-sm">
                                                <span className="material-icons-outlined text-base">call</span>
                                                {job.customer.phone}
                                            </a>
                                        ) : (
                                            <button disabled className="w-full py-2.5 rounded-xl bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed flex items-center justify-center gap-2 text-sm">
                                                <span className="material-icons-outlined text-base">no_cell</span>
                                                No phone number
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-gray-900 text-sm mb-5">Job Timeline</h3>
                                    <div className="relative pl-4 border-l-2 border-gray-100 space-y-6">
                                        {job.timeline.map((step, idx) => (
                                            <div key={idx} className="relative">
                                                <div className={`absolute -left-[21px] top-1 rounded-full size-4 border-4 border-white ${
                                                    step.status === 'completed' ? 'bg-[#10B981]' :
                                                    step.status === 'current' ? 'bg-[#10B981] animate-pulse shadow-[0_0_0_4px_rgba(16,185,129,0.2)]' :
                                                    'bg-gray-200'
                                                }`}></div>
                                                <div className={step.status === 'upcoming' ? 'opacity-40' : ''}>
                                                    <p className={`text-sm font-bold ${step.status === 'current' ? 'text-[#10B981]' : 'text-gray-900'}`}>{step.title}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">{step.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Financials & Actions */}
                                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
                                    <div className="flex justify-between items-end pb-4 border-b border-gray-100">
                                        <div>
                                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Est. Total</p>
                                            <p className="text-2xl font-bold text-[#10B981]">{job.pricing.total}</p>
                                        </div>
                                        <span className="text-xs bg-gray-100 px-2.5 py-1 rounded-lg text-gray-600 font-semibold">{job.pricing.method}</span>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        {job.statusCode !== 'completed' && (
                                            <button
                                                onClick={() => setIsStatusModalOpen(true)}
                                                className="w-full py-3 rounded-xl bg-[#0F172A] hover:bg-slate-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                                            >
                                                Update Status
                                                <span className="material-icons-outlined text-base">arrow_forward</span>
                                            </button>
                                        )}
                                        {job.statusCode === 'completed' ? (
                                            <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl p-3 flex items-start gap-2">
                                                <span className="material-icons-outlined text-[#10B981] text-lg shrink-0">check_circle</span>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">Job Completed</p>
                                                    {uploadedInvoice && (
                                                        <p className="text-xs text-gray-500 mt-0.5">Commission: <span className="font-bold">₦{(uploadedInvoice.amount * 0.1).toLocaleString()}</span></p>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setIsInvoiceModalOpen(true)}
                                                className="w-full py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700 font-semibold text-sm flex items-center justify-center gap-2"
                                            >
                                                <span className="material-icons-outlined text-base">payments</span>
                                                Record Payment & Complete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </main>
            </div>

            <ProviderMobileNavBar />
        </div>
    );
};

export default JobDetails;
