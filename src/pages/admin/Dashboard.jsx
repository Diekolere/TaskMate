import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';

const AdminDashboard = () => {
    const { requests, verifications, users, loading } = useData();
    const [stats, setStats] = useState([
        { title: "Total Commission", value: "₦0.00", change: "+0%", icon: "monetization_on", color: "bg-green-600", trend: "up" },
        { title: "Pending Commission", value: "₦0.00", change: "0%", icon: "pending", color: "bg-orange-500", trend: "neutral" },
        { title: "Total Tasks", value: "0", change: "+0%", icon: "assignment", color: "bg-blue-600", trend: "up" },
        { title: "Active Providers", value: "0", change: "+0%", icon: "engineering", color: "bg-purple-600", trend: "up" },
    ]);
    const [commissionStats, setCommissionStats] = useState({ 
        current: 0, 
        goal: 100000, 
        progress: 0 
    });
    const [systemHealth, setSystemHealth] = useState({
        server: 'Operational',
        db: 'Connected',
        backup: 'Daily (Automated)',
        users: 0
    });
    const [recentCommissions, setRecentCommissions] = useState([]);

    useEffect(() => {
        if (!loading && requests && users && verifications) {
            // Calculate Total Tasks
            const totalTasks = requests.length;

            // Calculate Active Providers
            const activeProviders = users.filter(u => u.role === 'provider').length;

            // Calculate Total Revenue
            const completed = requests.filter(r => r.status === 'Completed' || r.status === 'Paid');
            const totalRev = completed.reduce((acc, req) => acc + (Number(req.budget) || 0) * 0.1, 0);

            // Weekly Revenue (Simplified for mock)
            const weeklyRev = totalRev * 0.4; 
            const progress = Math.min((weeklyRev / 100000) * 100, 100);

            setStats([
                { title: "Total Commission", value: `₦${totalRev.toLocaleString()}`, change: "+12%", icon: "monetization_on", color: "bg-green-600", trend: "up" },
                { title: "Pending Commission", value: "₦0.00", change: "0%", icon: "pending", color: "bg-orange-500", trend: "neutral" },
                { title: "Total Tasks", value: totalTasks.toString(), change: "+5%", icon: "assignment", color: "bg-blue-600", trend: "up" },
                { title: "Active Providers", value: activeProviders.toString(), change: "+2%", icon: "engineering", color: "bg-purple-600", trend: "up" },
            ]);

            setCommissionStats({
                current: weeklyRev,
                goal: 100000,
                progress: progress
            });

            setRecentCommissions(completed.slice(0, 5).map(req => ({
                id: req.id.slice(0, 8).toUpperCase(),
                provider: req.providerName || 'Unknown',
                job: req.category || 'Service',
                amount: `₦${((Number(req.budget) || 0) * 0.1).toLocaleString()}`,
                status: 'Paid'
            })));

            setSystemHealth({
                server: 'Operational',
                db: 'Connected',
                backup: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                users: users.length
            });
        }
    }, [requests, users, verifications, loading]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in font-sans p-6">
            {/* Page Header */}
            <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard Overview</h2>
                <p className="text-gray-500 mt-1">Welcome back to the TaskMate Admin Control Panel.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.title}</p>
                                <h3 className="text-2xl font-black text-gray-900 mt-1">{stat.value}</h3>
                            </div>
                            <div className={`h-12 w-12 rounded-xl ${stat.color} flex items-center justify-center text-white shadow-lg shadow-${stat.color.split('-')[1]}-600/20`}>
                                <span className="material-icons text-white text-xl">{stat.icon}</span>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-[10px] font-black uppercase tracking-wider">
                            <span className={`flex items-center ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                <span className="material-icons text-sm mr-1">{stat.trend === 'up' ? 'trending_up' : 'trending_down'}</span>
                                {stat.change}
                            </span>
                            <span className="text-gray-400 ml-2">vs last week</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Recent Verifications */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                            <h3 className="font-bold text-gray-900">Pending Verifications</h3>
                            <Link to="/admin/verifications" className="text-xs font-black text-green-700 hover:text-green-800 uppercase tracking-wider">View All</Link>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {verifications.length === 0 ? (
                                <p className="p-8 text-sm text-gray-400 text-center font-medium">No pending verifications</p>
                            ) : (
                                verifications.map((user) => (
                                    <div key={user.id} className="p-4 sm:px-6 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4 group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center font-bold text-green-700 border border-green-100 uppercase">
                                                {(user.providerName || '?').charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm group-hover:text-green-700 transition-colors">{user.providerName}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Applied {new Date(user.submittedAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Link to={`/admin/verifications/${user.id}`} className="text-[10px] font-black uppercase tracking-widest bg-gray-50 text-gray-600 px-4 py-2 rounded-lg border border-gray-100 hover:bg-green-700 hover:text-white hover:border-green-700 transition-all">
                                                Review
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Commission Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                         <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                            <h3 className="font-bold text-gray-900">Recent Commissions</h3>
                            <Link to="/admin/commission" className="text-xs font-black text-green-700 hover:text-green-800 uppercase tracking-wider">View Report</Link>
                        </div>
                        <div className="overflow-x-auto">
                            {recentCommissions.length === 0 ? (
                                <p className="p-12 text-center text-sm text-gray-400 font-medium">No recent commissions</p>
                            ) : (
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead className="text-[10px] text-gray-400 uppercase bg-gray-50 font-black tracking-widest border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4">ID</th>
                                            <th className="px-6 py-4">Provider</th>
                                            <th className="px-6 py-4">Job</th>
                                            <th className="px-6 py-4">Commission</th>
                                            <th className="px-6 py-4 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 text-gray-600">
                                        {recentCommissions.map((txn, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-mono text-[10px] text-gray-400">{txn.id}</td>
                                                <td className="px-6 py-4 font-bold text-gray-900">{txn.provider}</td>
                                                <td className="px-6 py-4 font-medium">{txn.job}</td>
                                                <td className="px-6 py-4 font-black text-green-700">{txn.amount}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                                        txn.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                                    }`}>
                                                        {txn.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Status/Updates */}
                <div className="space-y-8">
                    <div className="bg-gray-900 rounded-2xl p-8 text-white shadow-2xl shadow-gray-900/40 relative overflow-hidden">
                         <div className="relative z-10">
                            <h3 className="text-lg font-black uppercase tracking-widest mb-1">Weekly Target</h3>
                            <p className="text-gray-400 text-xs font-medium mb-8">Commission collected vs target.</p>
                            
                            <div className="flex items-end gap-2 mb-3">
                                <span className="text-4xl font-black">₦{commissionStats.current.toLocaleString()}</span>
                                <span className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">/ ₦{commissionStats.goal.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-2.5 mb-6">
                                <div className="bg-green-500 h-2.5 rounded-full shadow-lg shadow-green-500/20 transition-all duration-1000" style={{ width: `${commissionStats.progress}%` }}></div>
                            </div>
                            <button className="w-full bg-white text-gray-900 font-black py-3.5 rounded-xl hover:bg-green-50 transition-all text-[10px] uppercase tracking-widest">
                                Detailed Report
                            </button>
                         </div>
                         <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-green-500 rounded-full blur-3xl opacity-10"></div>
                         <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-10"></div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <h3 className="font-bold text-gray-900 mb-6 uppercase tracking-widest text-xs">System Health</h3>
                        <div className="space-y-5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400 font-bold uppercase tracking-wider">Server Status</span>
                                <span className="flex items-center gap-2 text-green-700 font-black uppercase tracking-wider">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    {systemHealth.server}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400 font-bold uppercase tracking-wider">Database</span>
                                <span className="text-green-700 font-black uppercase tracking-wider">{systemHealth.db}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400 font-bold uppercase tracking-wider">Last Sync</span>
                                <span className="text-gray-700 font-bold uppercase tracking-wider">{systemHealth.backup}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400 font-bold uppercase tracking-wider">Active Users</span>
                                <span className="text-gray-900 font-black uppercase tracking-wider">{systemHealth.users}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;