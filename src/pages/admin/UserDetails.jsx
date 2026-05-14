import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import { useData } from '../../context/DataContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

const UserDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { users, requests, loading: dataLoading, updateUserStatus } = useData();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [clearingDebt, setClearingDebt] = useState(false);

    const handleToggleSuspension = async () => {
        const isCurrentlySuspended = user.status === 'Suspended';
        await updateUserStatus(user.id, isCurrentlySuspended);
        setUser(prev => ({ ...prev, status: isCurrentlySuspended ? 'Active' : 'Suspended' }));
    };

    const handleClearDebt = async () => {
        if (!confirm("Are you sure you want to clear this provider's commission debt?")) return;
        setClearingDebt(true);
        try {
            const { error } = await supabase.from('profiles').update({ commissionBalance: 0 }).eq('id', id);
            if (error) throw error;
            setUser(prev => ({ ...prev, commissionBalance: 0 }));
            toast.success("Debt cleared successfully");
        } catch (e) {
            toast.error("Failed to clear debt");
        } finally {
            setClearingDebt(false);
        }
    };

    useEffect(() => {
        if (!dataLoading && users && requests) {
            const u = users.find(usr => usr.id === id);
            if (!u) {
                toast.error("User not found");
                navigate('/admin/users');
                return;
            }

            const role = u.role;
            const userRequests = requests.filter(r => 
                role === 'provider' ? r.providerId === id : r.customerId === id
            );

            const completedRequests = userRequests.filter(r => r.status === 'Completed' || r.status === 'Paid');
            
            let earningsCalculated = 0;
            if (role === 'provider') {
                earningsCalculated = completedRequests.reduce((acc, curr) => acc + (Number(curr.budget) || 0) * 0.9, 0);
            } else {
                earningsCalculated = completedRequests.reduce((acc, curr) => acc + (Number(curr.budget) || 0), 0);
            }

            const recentActivity = userRequests.slice(0, 5).map(req => ({
                action: `${req.status} Request: ${req.title}`,
                date: req.updatedAt instanceof Date ? req.updatedAt.toLocaleDateString() : 'Recently'
            }));

            setUser({
                id: u.id,
                name: u.full_name || u.displayName || u.email,
                role: u.role,
                service: u.trade_category || 'N/A',
                rating: u.rating || 0,
                status: u.is_active === false ? 'Suspended' : 'Active',
                joined: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Recently',
                verified: u.isVerified || false,
                email: u.email,
                phone: u.phoneNumber || 'N/A',
                location: u.address || 'N/A',
                completedJobs: completedRequests.length,
                bio: u.bio || 'No bio available.',
                earnings: `₦${earningsCalculated.toLocaleString()}`,
                recentActivity: recentActivity.length > 0 ? recentActivity : [{ action: 'Joined Platform', date: 'Recently' }],
                commissionBalance: u.commissionBalance || 0
            });
            setLoading(false);
        }
    }, [id, users, requests, dataLoading, navigate]);

    if (loading || dataLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="space-y-6 animate-fade-in font-sans p-6">
            {/* Header with Breadcrumbs */}
            <div className="flex flex-col gap-2">
                <Breadcrumbs 
                    items={[
                        { label: 'Users', path: '/admin/users' },
                        { label: user.name, path: `/admin/users/${id}` }
                    ]} 
                />
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tighter">{user.name}</h1>
                    <div className="flex gap-3">
                        <button className="px-5 py-2.5 bg-white border border-gray-100 text-gray-900 font-bold rounded-xl hover:bg-gray-50 transition-all text-xs uppercase tracking-widest shadow-sm">
                            Edit Profile
                        </button>
                        <button 
                            onClick={handleToggleSuspension}
                            className={`px-5 py-2.5 font-black rounded-xl transition-all text-xs uppercase tracking-widest shadow-sm ${
                                user.status === 'Suspended' 
                                ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-100'
                                : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                            }`}
                        >
                             {user.status === 'Suspended' ? 'Reactivate User' : 'Suspend User'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Info Card */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                         <div className="flex items-start gap-8">
                            <div className="h-28 w-28 rounded-2xl bg-green-50 flex items-center justify-center text-4xl font-black text-green-700 border border-green-100 uppercase shadow-inner">
                                {user.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-4">
                                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">{user.role}</h3>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                        user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {user.status}
                                    </span>
                                    {user.verified && (
                                         <span className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 shadow-sm">
                                            <span className="material-icons text-sm">verified</span>
                                            Verified
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mt-6">
                                    <div className="group">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</p>
                                        <p className="font-bold text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-50 group-hover:border-green-700/10 transition-colors">{user.email}</p>
                                    </div>
                                    <div className="group">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Phone Number</p>
                                        <p className="font-bold text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-50 group-hover:border-green-700/10 transition-colors">{user.phone}</p>
                                    </div>
                                     <div className="group">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Primary Location</p>
                                        <p className="font-bold text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-50 group-hover:border-green-700/10 transition-colors">{user.location}</p>
                                    </div>
                                    <div className="group">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Joined Date</p>
                                        <p className="font-bold text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-50 group-hover:border-green-700/10 transition-colors">{user.joined}</p>
                                    </div>
                                </div>
                            </div>
                         </div>
                    </div>

                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Recent Activity</h3>
                        <div className="space-y-3">
                            {user.recentActivity.map((activity, i) => (
                                <div key={i} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 px-4 rounded-xl transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-green-700 group-hover:text-white transition-all shadow-sm">
                                            <span className="material-icons text-sm">history</span>
                                        </div>
                                        <span className="text-gray-900 font-bold group-hover:text-green-700 transition-colors">{activity.action}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{activity.date}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-8">
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8">Platform Performance</h3>
                        <div className="space-y-6">
                             <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    {user.role === 'provider' ? 'Total Earnings' : 'Total Spent'}
                                </span>
                                <span className="font-black text-gray-900 text-lg">{user.earnings}</span>
                             </div>

                             {user.role === 'provider' && (
                                <div className="border-t border-dashed pt-6 mt-6">
                                     <div className="flex justify-between items-center mb-4">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Commission Debt</span>
                                        <span className={`font-black text-lg ${user.commissionBalance > 5000 ? 'text-red-600' : 'text-green-700'}`}>
                                            ₦{Number(user.commissionBalance || 0).toLocaleString()}
                                        </span>
                                     </div>
                                     {user.commissionBalance > 0 && (
                                         <button 
                                            onClick={handleClearDebt}
                                            disabled={clearingDebt}
                                            className="w-full text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 py-3.5 rounded-xl hover:bg-red-600 hover:text-white transition-all border border-red-100 active:scale-[0.98] disabled:opacity-50"
                                         >
                                            {clearingDebt ? 'Processing...' : 'Clear Debt (Payment Received)'}
                                         </button>
                                     )}
                                     {user.commissionBalance > 5000 && (
                                         <p className="text-[10px] text-red-600 mt-3 font-bold uppercase tracking-widest text-center animate-pulse">
                                            Limit Exceeded (₦5,000)
                                         </p>
                                     )}
                                </div>
                             )}

                             <div className="flex justify-between items-center pt-6 border-t border-gray-50">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Jobs Completed</span>
                                <span className="font-black text-gray-900 text-lg">{user.completedJobs}</span>
                             </div>
                             <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Average Rating</span>
                                <div className="flex items-center gap-1.5 font-black text-gray-900 text-lg">
                                    <span>{user.rating}</span>
                                    <span className="material-icons text-yellow-400">star</span>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetails;
