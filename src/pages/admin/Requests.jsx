import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useJobs } from '../../context/JobContext';
import { useAdmin } from '../../context/AdminContext';

const Requests = () => {
    const { requests: rawRequests } = useJobs();
  const { loading } = useAdmin();
    const [requests, setRequests] = useState([]);
    const navigate = useNavigate();
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        if (rawRequests) {
            const mapped = rawRequests.map(req => ({
                ...req,
                customer: req.customerName || req.displayName || 'Unknown Customer',
                provider: req.providerName || (req.providerId ? 'Assigned' : 'Unassigned'),
                service: req.serviceType || req.title || 'None',
                status: req.status || 'Open',
                amount: req.budget ? `₦${Number(req.budget).toLocaleString()}` : 'Negotiable',
                date: req.createdAt instanceof Date ? req.createdAt.toLocaleDateString() : (req.createdAt?.toDate ? req.createdAt.toDate().toLocaleDateString() : 'N/A')
            }));
            setRequests(mapped);
        }
    }, [rawRequests]);

    const filteredRequests = filter === 'All' ? requests : requests.filter(req => req.status === filter);

    const handleAction = async (id, action) => {
        if (action === 'view') {
            navigate(`/admin/requests/${id}`);
        } else if (action === 'cancel') {
            if (window.confirm('Are you sure you want to cancel this request?')) {
                const { error } = await supabase.from('jobs').update({ status: 'cancelled' }).eq('id', id);
                if (error) { toast.error('Failed to cancel request'); return; }
                setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
                toast.success('Request cancelled successfully');
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-800';
            case 'In Progress': return 'bg-blue-100 text-blue-800';
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Open': return 'bg-purple-100 text-purple-800';
            case 'Cancelled': return 'bg-red-100 text-red-800';
            case 'Declined': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in p-6 font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Request Center</h2>
                    <p className="text-gray-500">Monitor and manage all service requests.</p>
                </div>
                 <div className="flex bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto no-scrollbar">
                    {['All', 'Open', 'In Progress', 'Completed', 'Cancelled'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                                filter === status
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-gray-50 text-[10px] uppercase text-gray-400 font-black tracking-widest border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Request ID</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Provider</th>
                                <th className="px-6 py-4">Service</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-20 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="material-icons text-4xl opacity-10">assignment</span>
                                            <p className="font-bold">No requests found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((req) => (
                                    <tr 
                                        key={req.id} 
                                        onClick={() => handleAction(req.id, 'view')}
                                        className="hover:bg-gray-50 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4 font-mono text-[10px] text-gray-400 font-bold group-hover:text-green-700 transition-colors">
                                            {req.id.slice(0, 8).toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900">{req.customer}</td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">
                                            {req.provider === 'Unassigned' ? (
                                                <span className="italic text-gray-400 font-normal">Unassigned</span>
                                            ) : (
                                                req.provider
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 font-medium truncate max-w-[150px]" title={req.service}>
                                            {req.service}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(req.status)}`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-gray-900">{req.amount}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAction(req.id, 'cancel');
                                                    }}
                                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                    title="Force Cancel"
                                                >
                                                    <span className="material-icons text-lg">cancel</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Requests;