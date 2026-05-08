import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';

const Users = () => {
    const { users, loading } = useData();
    const [providers, setProviders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [activeTab, setActiveTab] = useState('Providers');
    const navigate = useNavigate();

    useEffect(() => {
        if (users) {
            const mappedUsers = users.map(u => ({
                ...u,
                id: u.id,
                name: u.full_name || u.displayName || u.email || 'Unknown',
                joined: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Recently',
                status: u.is_active === false ? 'Suspended' : 'Active',
                service: u.trade_category || 'N/A',
                rating: u.rating || 0
            }));
            setProviders(mappedUsers.filter(u => u.role === 'provider'));
            setCustomers(mappedUsers.filter(u => u.role === 'customer'));
        }
    }, [users]);

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
        toast.success(`User status updated to ${newStatus} (Simulated)`);
        // In a real app, we'd call a context method to update Supabase
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
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h2>
                    <p className="text-gray-500">Manage provider and customer accounts.</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                    {['Providers', 'Customers'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                                activeTab === tab
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Providers Table */}
            {activeTab === 'Providers' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-400 font-bold border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Service</th>
                                    <th className="px-6 py-4 text-center">Rating</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {providers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="material-icons text-4xl opacity-20">people</span>
                                                <p>No providers found.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    providers.map((user) => (
                                    <tr 
                                        key={user.id} 
                                        className="hover:bg-gray-50 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center font-bold text-green-700 border border-green-100 uppercase">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 flex items-center gap-1">
                                                        {user.name}
                                                        {user.isVerified && (
                                                            <span className="material-icons text-green-600 text-[14px]" title="Verified Provider">verified</span>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Joined {user.joined}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-700">{user.service}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-0.5">
                                               <span className="material-icons text-[16px] text-yellow-400">star</span>
                                               <span className="text-sm font-bold text-gray-900">{user.rating}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                user.status === 'Active' ? 'bg-green-100 text-green-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleStatus(user.id, user.status);
                                                }}
                                                className={`text-xs font-bold px-4 py-1.5 rounded-lg border transition-all ${
                                                    user.status === 'Active' 
                                                    ? 'text-red-600 border-red-100 hover:bg-red-50' 
                                                    : 'text-green-700 border-green-100 hover:bg-green-50'
                                                }`}
                                            >
                                                {user.status === 'Active' ? 'Suspend' : 'Activate'}
                                            </button>
                                        </td>
                                    </tr>
                                )))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Customers Table */}
            {activeTab === 'Customers' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-400 font-bold border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4 text-center">Requests</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {customers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="material-icons text-4xl opacity-20">people</span>
                                                <p>No customers found.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    customers.map((user) => (
                                    <tr 
                                        key={user.id} 
                                        className="hover:bg-gray-50 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center font-bold text-green-700 border border-green-100 uppercase">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">
                                                        {user.name}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Joined {user.joined}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-700">{user.email}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-gray-500 font-bold">-</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                user.status === 'Active' ? 'bg-green-100 text-green-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleStatus(user.id, user.status);
                                                }}
                                                className={`text-xs font-bold px-4 py-1.5 rounded-lg border transition-all ${
                                                    user.status === 'Active' 
                                                    ? 'text-red-600 border-red-100 hover:bg-red-50' 
                                                    : 'text-green-700 border-green-100 hover:bg-green-50'
                                                }`}
                                            >
                                                {user.status === 'Active' ? 'Suspend' : 'Activate'}
                                            </button>
                                        </td>
                                    </tr>
                                )))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;