import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import MobileNavBar from '../../components/layout/MobileNavBar';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { format } from 'date-fns';
import Tutorial from '../../components/ui/Tutorial';

const Dashboard = () => {
    const navigate = useNavigate();
    
    const tutorialSteps = [
        { target: '#tour-search', content: 'Use this search bar to quickly find the services or providers you need.', disableBeacon: true },
        { target: '#tour-ai', content: 'Meet your personal AI assistant! Click here to get instant help with your tasks or questions.', disableBeacon: false },
        { target: '#tour-stats', content: 'Here you can view a summary of your active tasks, completed tasks, and total spent.' },
        { target: '#tour-recommended', content: 'Discover top-rated professionals recommended just for you based on your needs.' },
        { target: '#tour-new-request', content: 'Click here whenever you are ready to post a new service request.' }
    ];
    const { currentUser } = useAuth();
    const { requests, getProviders } = useData();
    const [activeTab, setActiveTab] = useState('All');
    const [openDropdown, setOpenDropdown] = useState(null);
    const [recommendedProviders, setRecommendedProviders] = useState([]);

    useEffect(() => {
        const fetchRecommended = async () => {
            const allProviders = await getProviders('All');
            // Simple recommendation: Take first 4
            setRecommendedProviders(allProviders.slice(0, 4));
        };
        fetchRecommended();
    }, [getProviders]);

    // Filter requests
    const filteredRequests = activeTab === 'All' 
        ? requests 
        : requests.filter(req => req.status === activeTab);
    
    // Derived stats
    const activeTasksCount = requests.filter(r => ['In Progress', 'Scheduled', 'Open', 'Pending'].includes(r.status)).length; 
    const completedTasksCount = requests.filter(r => r.status === 'Completed').length;
    
    // Calculate Total Spent (Sum of completed requests budget)
    const totalSpent = requests
        .filter(r => r.status === 'Completed')
        .reduce((sum, r) => sum + (Number(r.budget) || 0), 0);

    // Get Recent Activity
    const recentActivity = [...requests]
        .sort((a, b) => {
            const dateA = a.updatedAt || a.createdAt || 0;
            const dateB = b.updatedAt || b.createdAt || 0;
            return (dateB instanceof Date ? dateB.getTime() : 0) - (dateA instanceof Date ? dateA.getTime() : 0);
        })
        .slice(0, 5);

    const toggleDropdown = (e, id) => {
        e.stopPropagation();
        setOpenDropdown(openDropdown === id ? null : id);
    };

    const handleRowClick = (id) => {
        navigate(`/customer/request-status/${id}`);
    };

    return (
        <div className="flex min-h-screen bg-[#F8F9FA] font-sans text-gray-900" onClick={() => setOpenDropdown(null)}>
            <Tutorial steps={tutorialSteps} tutorialKey="customerDashboard" />
            {/* Sidebar Component */}
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 md:hidden">
                    <div className="flex items-center gap-2">
                        <img alt="Logo" className="h-6 w-6" src="/icon.png" />
                        <span className="text-xl font-bold text-green-700">TaskMate</span>
                    </div>
                    <div className="flex items-center gap-3">
                         <button className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-600">
                             <span className="material-icons-outlined text-xl">notifications</span>
                         </button>
                         <img alt="Profile" className="h-8 w-8 rounded-full object-cover border border-gray-200" src={currentUser?.photoURL || currentUser?.avatar_url || "https://ui-avatars.com/api/?name=" + (currentUser?.displayName || 'User')} />
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 md:p-8 pb-24">
                    <div className="mx-auto max-w-7xl space-y-8">
                        
                        {/* 1. Welcome Section & Search */}
                        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
                                <p className="mt-2 text-gray-500">Welcome back, {currentUser?.displayName || currentUser?.full_name || 'User'}! Here is your daily activity.</p>
                            </div>
                            <div className="hidden md:flex items-center gap-4">
                                <div className="relative group">
                                    <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-700 transition-colors">search</span>
                                    <input 
                                        id="tour-search"
                                        className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100 transition-all md:w-72 shadow-sm" 
                                        placeholder="Find a service..." 
                                        type="text" 
                                    />
                                </div>
                                <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:bg-gray-50 transition-all relative">
                                    <span className="material-icons-outlined text-gray-600">notifications</span>
                                    <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-red-500 border border-white"></span>
                                </button>
                                <img alt="Profile" className="h-11 w-11 rounded-full object-cover border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform" src={currentUser?.photoURL || currentUser?.avatar_url || "https://ui-avatars.com/api/?name=" + (currentUser?.displayName || 'User')} />
                            </div>
                        </div>

                         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                             {/* Left Column (Stats + Table) */}
                             <div className="lg:col-span-2 space-y-8">
                                
                                {/* Stats Cards */}
                                <div id="tour-stats" className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                                    <div className="col-span-1 bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 hover:shadow-md transition-shadow">
                                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-green-50 flex items-center justify-center text-green-700 shrink-0">
                                            <span className="material-icons-outlined text-lg md:text-xl">pending_actions</span>
                                        </div>
                                        <div>
                                            <p className="text-xs md:text-sm font-medium text-gray-500">Active Tasks</p>
                                            <h3 className="text-xl md:text-2xl font-bold text-gray-900">{activeTasksCount}</h3>
                                        </div>
                                    </div>
                                    <div className="col-span-1 bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 hover:shadow-md transition-shadow">
                                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                            <span className="material-icons-outlined text-lg md:text-xl">task_alt</span>
                                        </div>
                                        <div>
                                            <p className="text-xs md:text-sm font-medium text-gray-500">Completed</p>
                                            <h3 className="text-xl md:text-2xl font-bold text-gray-900">{completedTasksCount}</h3>
                                        </div>
                                    </div>
                                    <div className="col-span-2 lg:col-span-1 bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 hover:shadow-md transition-shadow">
                                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                                            <span className="material-icons-outlined text-lg md:text-xl">account_balance_wallet</span>
                                        </div>
                                        <div className="min-w-0 w-full">
                                            <p className="text-xs md:text-sm font-medium text-gray-500">Total Spent</p>
                                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 truncate">₦{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h3>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Requests Table */}
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-gray-900">Active Requests</h2>
                                        <div className="flex items-center gap-3">
                                            <div className="hidden sm:flex rounded-lg bg-gray-100 p-1">
                                                {['All', 'In Progress', 'Scheduled'].map((tab) => (
                                                    <button
                                                        key={tab}
                                                        onClick={() => setActiveTab(tab)}
                                                        className={`rounded px-4 py-1.5 text-xs font-medium transition-all ${
                                                            activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                                                        }`}
                                                    >
                                                        {tab}
                                                    </button>
                                                ))}
                                            </div>
                                            <Link 
                                                id="tour-new-request"
                                                to="/customer/post-request"
                                                className="flex items-center gap-2 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-800 shadow-lg shadow-green-700/20 transition-all hover:scale-105"
                                            >
                                                <span className="material-icons-outlined text-lg">add</span>
                                                New Request
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm text-gray-500">
                                                <thead className="bg-gray-50/50 text-xs uppercase text-gray-400">
                                                    <tr>
                                                        <th className="px-6 py-4 font-semibold">Service</th>
                                                        <th className="px-6 py-4 font-semibold">Date</th>
                                                        <th className="px-6 py-4 font-semibold">Provider</th>
                                                        <th className="px-6 py-4 font-semibold">Status</th>
                                                        <th className="px-6 py-4 font-semibold text-right">Amount</th>
                                                        <th className="px-6 py-4 text-center font-semibold">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {filteredRequests.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                                                <div className="flex flex-col items-center">
                                                                    <span className="material-icons-outlined text-4xl text-gray-300 mb-2">assignment</span>
                                                                    <p>No requests found.</p>
                                                                    <Link to="/customer/post-request" className="text-green-700 hover:text-green-800 font-medium text-sm mt-2">Post your first request</Link>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                    filteredRequests.map((req) => {
                                                        const date = req.createdAt ? (req.createdAt instanceof Date ? format(req.createdAt, 'MMM dd, yyyy') : 'Recently') : 'Recently';
                                                        const providerName = req.providerName || "Pending...";
                                                        const providerAvatar = req.providerAvatar || `https://ui-avatars.com/api/?name=${providerName}&background=random`;
                                                        
                                                        return (
                                                        <tr 
                                                            key={req.id} 
                                                            className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                                                            onClick={() => handleRowClick(req.id)}
                                                        >
                                                            <td className="px-6 py-4">
                                                                <div>
                                                                    <div className="font-bold text-gray-900">{req.title || req.service || 'Untitled'}</div>
                                                                    <div className="text-xs text-gray-400">{req.category || 'General'}</div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 font-medium">{date}</td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <img src={providerAvatar} alt="" className="h-6 w-6 rounded-full bg-gray-200" />
                                                                    <span className="font-medium text-gray-900">{providerName}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                                                                    req.status === 'In Progress' ? 'bg-blue-50 text-blue-600' :
                                                                    req.status === 'Completed' ? 'bg-green-50 text-green-600' :
                                                                    req.status === 'Cancelled' ? 'bg-red-50 text-red-600' :
                                                                    'bg-orange-50 text-orange-600'
                                                                }`}>
                                                                    {req.status === 'In Progress' && <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>}
                                                                    {req.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right font-bold text-gray-900">₦{Number(req.budget).toLocaleString()}</td>
                                                            <td className="px-6 py-4 text-center relative">
                                                                <button 
                                                                    onClick={(e) => toggleDropdown(e, req.id)}
                                                                    className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                                                >
                                                                    <span className="material-icons-outlined">more_vert</span>
                                                                </button>
                                                                
                                                                {/* Dropdown Menu */}
                                                                {openDropdown === req.id && (
                                                                    <div className="absolute right-8 top-8 z-10 w-40 rounded-xl bg-white p-1 shadow-xl border border-gray-100 ring-1 ring-black ring-opacity-5 origin-top-right">
                                                                        <button onClick={() => navigate(`/customer/request-status/${req.id}`)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                                            <span className="material-icons-outlined text-sm">visibility</span>
                                                                            View Details
                                                                        </button>
                                                                        <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                                            <span className="material-icons-outlined text-sm">chat</span>
                                                                            Message
                                                                        </button>
                                                                        <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                                                                            <span className="material-icons-outlined text-sm">cancel</span>
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                        );
                                                    })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                             </div>

                             {/* Right Column (Timeline & Ads) */}
                             <div className="space-y-8">
                                {/* Recent Activity Timeline */}
                                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-gray-900">Recent Activity</h3>
                                        <button className="text-xs font-semibold text-green-700 hover:underline">View All</button>
                                    </div>
                                    <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-5 before:w-0.5 before:bg-gray-100">
                                        {recentActivity.length > 0 ? (
                                            recentActivity.map((activity) => {
                                                const hasTimeline = activity.timeline && activity.timeline.length > 0;
                                                const lastEvent = hasTimeline ? activity.timeline[activity.timeline.length - 1] : null;
                                                const eventTitle = lastEvent?.title || `Request ${activity.status}`;
                                                const eventDesc = lastEvent?.description || `Status updated to ${activity.status}`;
                                                const eventTime = activity.updatedAt ? (activity.updatedAt instanceof Date ? format(activity.updatedAt, 'MMM dd, h:mm a') : 'Recently') : 'Recently';

                                                return (
                                                    <div key={activity.id} className="relative pl-8 py-1 group cursor-pointer" onClick={() => navigate(`/customer/request-status/${activity.id}`)}>
                                                        <div className={`absolute left-[13px] top-1.5 h-3 w-3 rounded-full ring-4 ring-white ${
                                                            activity.status === 'Completed' ? 'bg-green-500' : 
                                                            activity.status === 'Cancelled' || activity.status === 'Declined' ? 'bg-red-500' : 
                                                            'bg-blue-500'
                                                        }`}></div>
                                                        
                                                        <p className="text-sm font-bold text-gray-900 leading-none mb-1 group-hover:text-green-700 transition-colors">
                                                            {eventTitle}
                                                        </p>
                                                        <p className="text-xs text-gray-500 truncate">{activity.title} - {eventDesc}</p>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1 block">
                                                            {eventTime}
                                                        </span>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-6 text-gray-500 text-sm">
                                                No recent activity
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Promo Card (Less intrusive) */}
                                <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white shadow-lg overflow-hidden relative">
                                    <div className="relative z-10">
                                        <span className="inline-block rounded-md bg-white/20 px-2 py-1 text-xs font-bold uppercase backdrop-blur-sm mb-3">Premium</span>
                                        <h3 className="text-lg font-bold">Refer & Earn ₦500</h3>
                                        <p className="mt-1 text-sm text-gray-300 opacity-90">Invite friends to TaskMate and earn bonus credits.</p>
                                        <button className="mt-4 text-xs font-bold bg-white text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">Invite Friends</button>
                                    </div>
                                    <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-green-700 rounded-full blur-3xl opacity-20"></div>
                                </div>
                             </div>
                         </div>

                        {/* 5. Recommendations (Redesigned) */}
                        <section id="tour-recommended">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Recommended For You</h2>
                                    <p className="text-sm text-gray-500">Top rated providers in your area</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
                                        <span className="material-icons-outlined text-lg">chevron_left</span>
                                    </button>
                                    <button className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
                                        <span className="material-icons-outlined text-lg">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Card Template */}
                                {recommendedProviders.length > 0 ? (
                                    recommendedProviders.map((provider) => (
                                    <Link to={`/customer/provider/${provider.id}`} key={provider.id} className="group bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                        <div className="flex items-start justify-between mb-4">
                                             <div className="relative">
                                                <img src={provider.photoURL || provider.avatar_url || `https://ui-avatars.com/api/?name=${provider.displayName}&background=random`} alt={provider.displayName} className="h-14 w-14 rounded-full object-cover border-2 border-white shadow-sm" />
                                                <div className="absolute -bottom-1 -right-1 bg-green-500 border-2 border-white w-4 h-4 rounded-full"></div>
                                             </div>
                                             <div className="flex flex-col items-end">
                                                 <span className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-lg text-xs font-bold">
                                                     <span className="material-icons-outlined text-[14px]">star</span> {provider.rating || 'New'}
                                                 </span>
                                                 <span className="text-[10px] text-gray-400 mt-1">{provider.jobsCompleted || 0} Jobs</span>
                                             </div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 group-hover:text-green-700 transition-colors truncate">{provider.displayName || provider.full_name || 'Service Provider'}</h3>
                                            <p className="text-xs text-gray-500 font-medium truncate">{provider.category || 'General'}</p>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Rate</span>
                                                <span className="text-sm font-bold text-gray-900">
                                                    {provider.hourlyRate ? `₦${Number(provider.hourlyRate).toLocaleString()}` : (provider.hourly_rate_min ? `₦${Number(provider.hourly_rate_min).toLocaleString()}` : 'Negotiable')}
                                                </span>
                                            </div>
                                            <button className="bg-gray-900 text-white p-2 rounded-lg group-hover:bg-green-700 transition-colors">
                                                <span className="material-icons-outlined text-lg">arrow_forward</span>
                                            </button>
                                        </div>
                                    </Link>
                                ))
                                ) : (
                                    <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-200 border-dashed">
                                        <div className="flex flex-col items-center">
                                            <span className="material-icons-outlined text-4xl text-gray-300 mb-2">person_search</span>
                                            <p>No recommended providers found in your area yet.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </main>
                <MobileNavBar />
            </div>
        </div>
    );
};

export default Dashboard;
