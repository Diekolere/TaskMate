import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import { useJobs } from '../../context/JobContext';
import { useAdmin } from '../../context/AdminContext';


const RequestDetails = () => {
    const { id } = useParams();
    const { requests } = useJobs();
  const { users, loading: dataLoading } = useAdmin();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!dataLoading && requests) {
            const req = requests.find(r => r.id === id);
            
            if (req) {
                // Find customer and provider in users list if available
                let customer = { id: req.customerId, name: req.customerName || 'Unknown', email: 'N/A' };
                let provider = null;

                if (users) {
                    const c = users.find(u => u.id === req.customerId);
                    if (c) customer = { id: c.id, name: c.full_name || c.displayName || 'User', email: c.email };

                    if (req.providerId) {
                        const p = users.find(u => u.id === req.providerId);
                        if (p) provider = { id: p.id, name: p.full_name || p.displayName || 'Provider', service: p.trade_category || 'Service', email: p.email };
                    }
                }
                
                // Simple timeline based on status
                const timeline = [
                    { status: 'Request Created', date: req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Recently', completed: true },
                    { status: 'In Progress', date: req.status === 'In Progress' ? 'Active' : '-', completed: req.status === 'In Progress' || req.status === 'Completed' || req.status === 'Paid' },
                    { status: 'Completed', date: (req.status === 'Completed' || req.status === 'Paid') ? 'Done' : '-', completed: req.status === 'Completed' || req.status === 'Paid' },
                ];

                setRequest({
                    id: req.id,
                    status: req.status || 'Open',
                    service: req.category || req.title || 'Service',
                    amount: req.budget ? `₦${Number(req.budget).toLocaleString()}` : 'N/A',
                    description: req.description || 'No Description provided',
                    location: req.location || req.location_name || 'No Location',
                    timeline: timeline,
                    customer,
                    provider
                });
            }
            setLoading(false);
        }
    }, [id, requests, users, dataLoading]);

    if (loading || dataLoading) return <div className="p-10 text-center font-bold text-gray-500 animate-pulse">Loading request details...</div>;
    if (!request) return <div className="p-10 text-center font-bold text-red-500">Request not found</div>;

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-800';
            case 'Paid': return 'bg-green-100 text-green-800';
            case 'In Progress': return 'bg-blue-100 text-blue-800';
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in font-sans p-6">
             <div className="flex flex-col gap-2">
                <Breadcrumbs 
                    items={[
                        { label: 'Requests', path: '/admin/requests' },
                        { label: request.id.toUpperCase(), path: `/admin/requests/${id}` }
                    ]} 
                />
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Request #{request.id.slice(0,8).toUpperCase()}</h1>
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(request.status)}`}>
                        {request.status}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Request Overview */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 border-b border-gray-50 pb-4">Overview</h3>
                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Service Type</p>
                                <p className="font-bold text-gray-900 text-xl">{request.service}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Agreed Amount</p>
                                <p className="font-black text-green-700 text-xl">{request.amount}</p>
                            </div>
                        </div>
                        <div>
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">Description</p>
                             <p className="text-gray-700 bg-gray-50/50 p-6 rounded-2xl border border-gray-100 font-medium leading-relaxed">
                                {request.description}
                             </p>
                        </div>
                        <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Service Location</p>
                                <div className="flex items-center gap-2 text-gray-900 font-bold">
                                    <span className="material-icons text-green-700 text-sm">location_on</span>
                                    {request.location}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-8">Request Timeline</h3>
                        <div className="relative border-l-2 border-gray-100 ml-4 space-y-10">
                            {request.timeline.map((item, i) => (
                                <div key={i} className="relative pl-10">
                                    <span className={`absolute -left-[11px] top-0 h-5 w-5 rounded-full border-4 border-white shadow-sm ${
                                        item.completed ? 'bg-green-600' : 'bg-gray-200'
                                    }`}></span>
                                    <h4 className={`text-sm font-black uppercase tracking-wider ${item.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {item.status}
                                    </h4>
                                    <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">{item.date}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-8">
                    {/* Customer Card */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 group">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Customer</h3>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-12 w-12 bg-green-50 text-green-700 rounded-xl flex items-center justify-center font-black border border-green-100 uppercase">
                                {(request.customer.name || '?').charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">{request.customer.name}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{request.customer.email}</p>
                            </div>
                        </div>
                        <Link to={`/admin/users/${request.customer.id}`} className="text-[10px] font-black text-green-700 hover:text-green-800 uppercase tracking-widest flex items-center gap-2">
                            View Profile <span className="material-icons text-xs">arrow_forward</span>
                        </Link>
                    </div>

                    {/* Provider Card */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 group">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Assigned Provider</h3>
                        {request.provider ? (
                             <>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="h-12 w-12 bg-green-700 text-white rounded-xl flex items-center justify-center font-black shadow-lg shadow-green-700/20 uppercase">
                                        {request.provider.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">{request.provider.name}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{request.provider.service}</p>
                                    </div>
                                </div>
                                <Link to={`/admin/users/${request.provider.id}`} className="text-[10px] font-black text-green-700 hover:text-green-800 uppercase tracking-widest flex items-center gap-2">
                                    View Profile <span className="material-icons text-xs">arrow_forward</span>
                                </Link>
                             </>
                        ) : (
                            <div className="text-center py-6 border border-dashed border-gray-100 rounded-xl">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No provider assigned</p>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Admin Actions</h3>
                        <div className="space-y-4">
                            <button className="w-full py-4 px-4 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-[0.98]">
                                Resolve Dispute
                            </button>
                             <button className="w-full py-4 px-4 rounded-xl border border-red-100 text-red-600 bg-red-50 text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all active:scale-[0.98]">
                                Cancel Request
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestDetails;
