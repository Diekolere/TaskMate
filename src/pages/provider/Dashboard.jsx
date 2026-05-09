import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Tutorial from '../../components/ui/Tutorial';

const ProviderDashboard = () => {
    const tutorialSteps = [
        { target: '#tour-availability', content: 'Let customers know if you are accepting requests today.' },
        { target: '#tour-earnings', content: 'Keep an eye on your commission and balances here.' },
        { target: '#tour-activity', content: 'Watch this area for your latest job requests.' }
    ];

    const { currentUser } = useAuth();
    const { jobs } = useData();
    
    // Derived state
    const isVerified = currentUser?.isVerified || currentUser?.is_verified || true; 
    
    // Calculate Earnings
    const completedJobs = jobs.filter(j => 
        (j.providerId === currentUser?.id || j.provider_id === currentUser?.id) && 
        (j.status === 'Completed' || j.status === 'Paid')
    );

    const totalEarnings = completedJobs.reduce((acc, job) => acc + (Number(job.finalAmount) || Number(job.budget) || 0), 0);

    // Filter logic: Show jobs that are 'Open' OR 'Pending' (directed to me)
    const nearbyRequests = jobs.filter(j => 
        j.status === 'Open' || 
        (j.status === 'Pending' && (j.providerId === currentUser?.id || j.provider_id === currentUser?.id))
    );
    
    const schedule = jobs.filter(j => (j.status === 'Scheduled' || j.status === 'In Progress') && (j.providerId === currentUser?.id || j.provider_id === currentUser?.id));
    
    const stats = {
        earnings: totalEarnings,
        jobs: completedJobs.length,
        completionRate: 0, 
        responseTime: '-'
    };

    // Create activities feed from jobs
    const activities = jobs
        .filter(j => j.providerId === currentUser?.id || j.provider_id === currentUser?.id)
        .sort((a, b) => {
             const dateA = a.updatedAt || a.createdAt || 0;
             const dateB = b.updatedAt || b.createdAt || 0;
             return (dateB instanceof Date ? dateB.getTime() : 0) - (dateA instanceof Date ? dateA.getTime() : 0);
        })
        .slice(0, 5)
        .map(job => ({
            id: job.id,
            type: job.status === 'Completed' ? 'payment' : 'job_update',
            title: job.status === 'Completed' ? 'Payment Received' : 'Job Update',
            message: job.status === 'Completed' ? `You earned ₦${job.budget}` : `Status: ${job.status} for ${job.title}`,
            time: job.updatedAt instanceof Date ? job.updatedAt.toLocaleDateString() : 'Recently'
        }));
    
  return (
    <div className="min-h-screen bg-white flex font-sans text-text-light">
      <Tutorial steps={tutorialSteps} tutorialKey="providerDashboard" />
      {/* Provider Sidebar */}
      <ProviderSidebar />

      {/* Mobile Nav */}
      <ProviderMobileNavBar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
         {/* Top Bar */}
         <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
            <div className="flex items-center gap-2 md:hidden">
                 <img alt="TaskMate Icon" className="h-8 w-8 object-contain rounded-lg" src="/icon.png" />
                 <span className="font-display font-bold text-gray-900 text-lg">TaskMate</span>
            </div>
            
            <h1 className="text-xl font-semibold text-gray-800 hidden md:block">Dashboard</h1>

            <div className="flex items-center gap-4">
               {/* User Menu */}
               <div className="flex items-center gap-3">
                   <div className="hidden md:block text-right">
                       <p className="text-sm font-semibold text-gray-900">{currentUser?.displayName || currentUser?.full_name || 'Provider'}</p>
                       <p className="text-xs text-gray-500">Provider ID: #{currentUser?.id?.substring(0,6) || 'TM-2024'}</p>
                   </div>
                   <div className="w-10 h-10 bg-green-700/10 rounded-full flex items-center justify-center text-green-700 font-bold border border-green-700/20">
                       {(currentUser?.displayName || currentUser?.full_name || 'P').charAt(0)}
                   </div>
               </div>
            </div>
         </header>

         <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            
            {/* 1. Account Status Banner */}
            {!isVerified && (
                <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 flex flex-col md:flex-row items-start gap-4 shadow-sm"
                >
                <div className="bg-yellow-100 p-2 rounded-full shrink-0">
                    <span className="material-icons-outlined text-yellow-600 text-2xl">pending_actions</span>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-yellow-800 mb-1">Account Under Review</h3>
                    <p className="text-yellow-700 text-sm leading-relaxed max-w-3xl">
                        Your profile is currently visible only to you. Once our team verifies your documents (within 24-48 hours), 
                        you will be able to accept requests and update your service details.
                    </p>
                    <div className="mt-4 flex gap-3">
                        <button className="px-4 py-2 bg-white text-yellow-700 text-sm font-semibold rounded-lg border border-yellow-200 hover:bg-yellow-50 transition-colors">
                            Check Status
                        </button>
                        <button className="px-4 py-2 text-yellow-700 text-sm font-semibold hover:underline">
                            Contact Support
                        </button>
                    </div>
                </div>
                </motion.div>
            )}

            {/* 2. Availability Toggle */}
             <div id="tour-availability" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
                    <p className="text-sm text-gray-500">Welcome back! Here's what's happening today.</p>
                </div>
                <div className={`bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3 ${!isVerified ? 'opacity-50 pointer-events-none' : ''}`}>
                    <span className="text-sm font-medium pl-2 text-gray-600">Status:</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked={isVerified} disabled={!isVerified} />
                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-700/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-700"></div>
                        <span className="ml-3 text-sm font-bold text-gray-700">Available</span>
                    </label>
                </div>
            </div>

            {/* 3. Stats Grid */}
            <div id="tour-earnings" className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${!isVerified ? 'opacity-60 pointer-events-none select-none grayscale-[0.5]' : ''}`}>
               {/* Earnings Card */}
               <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between h-48 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <span className="material-icons-outlined text-8xl text-green-700">payments</span>
                  </div>
                  <div className="flex justify-between items-start z-10">
                     <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Total Earnings</p>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">₦{stats.earnings.toLocaleString()}</h2>
                     </div>
                     <div className="p-2 bg-green-50 rounded-lg text-green-700">
                        <span className="material-icons-outlined">trending_up</span>
                     </div>
                  </div>
                  
                  <div className="flex items-end h-12 gap-1 mt-4 z-10 opacity-70">
                      {[10, 20, 15, 30, 25, 40, 35].map((h, i) => (
                          <div key={i} className="flex-1 bg-green-100 rounded-t-sm" style={{ height: `${h}%` }}></div>
                      ))}
                  </div>

                  <p className="text-xs text-gray-400 mt-3 font-medium flex items-center z-10">
                      <span className="material-icons-outlined text-sm mr-1">remove</span> 
                      No change vs last month
                  </p>
               </div>

                {/* Jobs Card */}
               <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between h-48">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Jobs Completed</p>
                        <h2 className="text-3xl font-bold text-gray-900">{stats.jobs}</h2>
                     </div>
                     <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <span className="material-icons-outlined">assignment_turned_in</span>
                     </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                            <span className="text-gray-500">Completion Rate</span>
                            <span className="text-blue-600">{stats.completionRate}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${stats.completionRate}%` }}></div>
                        </div>
                    </div>
                     <div className="flex justify-between text-xs pt-1 border-t border-gray-50">
                        <span className="text-gray-400">Avg. Response Time</span>
                        <span className="font-semibold text-gray-700">{stats.responseTime}</span>
                    </div>
                  </div>
               </div>

                {/* Pro Status Card */}
               <div className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-icons-outlined text-2xl">verified</span>
                                <h3 className="font-bold text-xl">Pro Tier</h3>
                            </div>
                            <p className="text-green-50 text-sm mb-4 leading-relaxed opacity-90">
                                Maintain good ratings to unlock top-tier benefits!
                            </p>
                        </div>
                        <button className="w-full py-2.5 bg-white text-green-700 font-bold rounded-xl text-sm shadow-md hover:bg-green-50 transition-colors">
                            View Benefits
                        </button>
                    </div>
               </div>
            </div>

            {/* 4. Main Activity Area (2 Columns) */}
            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 h-full ${!isVerified ? 'opacity-40 grayscale pointer-events-none select-none relative' : ''}`}>
                
                {/* LOCKED OVERLAY */}
                {!isVerified && (
                    <div className="absolute inset-0 top-12 z-10 flex items-center justify-center">
                         <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-gray-100 text-center max-w-sm">
                             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-icons-outlined text-3xl text-gray-400">lock</span>
                             </div>
                             <h3 className="text-lg font-bold text-gray-900 mb-2">Dashboard Locked</h3>
                             <p className="text-sm text-gray-500">
                                Detailed activity and requests will appear here once your account is fully approved.
                             </p>
                         </div>
                    </div>
                )}


                {/* News & Requests (Left Col) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                            New Requests Nearby
                        </h3>
                        <button className="text-sm text-green-700 font-bold hover:underline">View Map</button>
                    </div>

                    {nearbyRequests.length > 0 ? (
                        nearbyRequests.slice(0, 3).map((job) => (
                            <Link to={`/provider/requests`} key={job.id} className="block group">
                                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-5 items-start">
                                    <div className="size-14 rounded-xl bg-green-50 text-green-700 flex-shrink-0 flex items-center justify-center">
                                        <span className="material-icons-outlined text-3xl">
                                            {job.category === 'Plumbing' ? 'plumbing' : 
                                             job.category === 'Cleaning' ? 'cleaning_services' : 'handyman'}
                                        </span>
                                    </div>
                                    
                                    <div className="flex-1 w-full">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-lg font-bold text-gray-900 group-hover:text-green-700 transition-colors line-clamp-1">{job.title || job.serviceType}</h4>
                                            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md">₦{Number(job.budget).toLocaleString()}</span>
                                        </div>
                                        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{job.description}</p>
                                        
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <span className="material-icons-outlined text-base">location_on</span>
                                                {job.location || 'No location'}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="material-icons-outlined text-base">schedule</span>
                                                {job.urgency || 'Normal'}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="material-icons-outlined text-base">person</span>
                                                {job.customerName || 'Customer'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <span className="material-icons-outlined text-3xl text-gray-400">radar</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">No requests nearby</h3>
                            <p className="text-sm text-gray-500 max-w-xs mt-2">
                                We are scanning your area for new jobs. You will be notified when a request matches your profile.
                            </p>
                        </div>
                    )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Schedule */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4">Upcoming Schedule</h3>
                        <div className="space-y-4">
                             {schedule.length > 0 ? (
                                schedule.map((item, i) => (
                                    <Link to={`/provider/jobs`} key={i} className="flex gap-3 items-start p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                        <div className="flex flex-col items-center bg-white border border-gray-200 rounded-lg p-2 min-w-[3.5rem]">
                                            <span className="text-xs font-bold text-red-500">TODAY</span>
                                            <span className="text-lg font-bold text-gray-900">{new Date().getDate()}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 line-clamp-1">{item.title}</p>
                                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                <span className="material-icons-outlined text-sm">schedule</span>
                                                10:00 AM - 12:00 PM
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                 <span className="material-icons-outlined text-sm">location_on</span>
                                                 {item.location || 'Client Location'}
                                            </p>
                                        </div>
                                    </Link>
                                ))
                             ) : (
                                <div className="text-center py-6">
                                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <span className="material-icons-outlined text-gray-400">event_busy</span>
                                    </div>
                                    <p className="text-sm text-gray-500">No scheduled jobs.</p>
                                </div>
                             )}
                        </div>
                        <Link to="/provider/schedule" className="w-full mt-5 py-2.5 text-sm text-green-700 font-bold border border-green-700/20 rounded-xl hover:bg-green-700/5 transition-colors block text-center">
                            View Calendar
                        </Link>
                    </div>

                    {/* Recent Activity Timeline */}
                    <div id="tour-activity" className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                        <h3 className="font-bold text-gray-900 mb-4">Recent Activity</h3>
                        <div className="space-y-4">
                            {activities.length > 0 ? (
                                activities.map((activity, i) => (
                                    <div key={i} className="relative z-10 flex gap-4">
                                        <div className={`mt-1 h-2 w-2 rounded-full ring-4 ring-white ${activity.type === 'payment' ? 'bg-green-500' : 'bg-green-700'}`}></div>
                                        <div className="pb-4 border-l-2 border-gray-100 pl-4 last:border-0 last:pb-0 flex-1">
                                            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{activity.message}</p>
                                            <span className="text-[10px] text-gray-400 mt-1 block uppercase tracking-wider">{activity.time}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-400 text-center py-4">No recent activity.</p>
                            )}
                        </div>
                        <button className="w-full mt-4 text-xs font-bold text-gray-500 hover:text-gray-900">View All Activity</button>
                    </div>

                    {/* Support Card */}
                    <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-icons-outlined text-blue-600">headset_mic</span>
                            <h4 className="font-bold text-blue-900 text-sm">Need Help?</h4>
                        </div>
                        <p className="text-xs text-blue-700 mb-4 leading-relaxed">
                            Contact TaskMate support for assistance with jobs or payments.
                        </p>
                        <a href="#" className="text-xs font-bold text-blue-600 hover:underline flex items-center">
                            Contact Support 
                            <span className="material-icons-outlined text-sm ml-1">arrow_forward</span>
                        </a>
                    </div>
                </div>
            </div>
         </div>
      </main>
    </div>
  );
};

export default ProviderDashboard;
