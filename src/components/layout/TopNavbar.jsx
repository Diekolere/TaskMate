import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const TopNavbar = ({ breadcrumbs = [] }) => {
    const { currentUser } = useAuth();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    const notifications = [
        { id: 1, title: 'New Request Update', message: 'Provider has accepted your request.', time: '10 mins ago', read: false },
        { id: 2, title: 'Payment Successful', message: 'Your payment of ₦8,500 was successful.', time: '1 hour ago', read: false },
        { id: 3, title: 'Profile Updated', message: 'Your profile changes have been saved.', time: '2 days ago', read: true },
    ];

    // Helper to get path from label
    const getPath = (label) => {
        const map = {
            'Customer': '/customer/dashboard',
            'Feed': '/customer/dashboard',
            'Explore Providers': '/customer/browse',
            'Providers': '/customer/browse',
            'My Requests': '/customer/requests',
            'Saved': '/customer/saved',
            'Settings': '/customer/settings',
            'Post Request': '/customer/post-request',
            'Dashboard': '/customer/dashboard'
        };
        return map[label] || '#';
    };

    return (
        <div className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-[14px] font-medium">
                {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                        {index === breadcrumbs.length - 1 ? (
                            <span className="text-slate-900 font-bold">
                                {crumb}
                            </span>
                        ) : (
                            <Link 
                                to={getPath(crumb)} 
                                className="text-slate-400 hover:text-[#10B981] transition-colors"
                            >
                                {crumb}
                            </Link>
                        )}
                        {index < breadcrumbs.length - 1 && (
                            <span className="material-icons text-[16px] text-slate-300">chevron_right</span>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Right Side: Actions and Profile */}
            <div className="flex items-center gap-6">
                
                {/* Notification Bell */}
                <div className="relative">
                    <button 
                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                        className="relative p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-50 flex items-center justify-center"
                    >
                        <span className="material-icons-outlined text-[24px]">notifications</span>
                        {/* Notification Badge */}
                        <span className="absolute top-1.5 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>

                    {/* Notifications Dropdown */}
                    {isNotificationsOpen && (
                        <div className="absolute right-[-1rem] sm:right-0 mt-3 w-screen sm:w-80 max-w-[calc(100vw-2rem)] sm:max-w-none bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-extrabold text-[15px] text-gray-900">Notifications</h3>
                                <button className="text-[12px] font-bold text-[#10B981] hover:text-[#059669]">Mark all as read</button>
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.map((notif) => (
                                    <div key={notif.id} className={`px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3 ${!notif.read ? 'bg-blue-50/30' : ''}`}>
                                        <div className="mt-1 h-2 w-2 rounded-full bg-[#10B981] shrink-0 opacity-0 relative top-1.5">
                                            {!notif.read && <div className="absolute -inset-0 bg-[#10B981] rounded-full"></div>}
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold text-gray-900 mb-0.5">{notif.title}</p>
                                            <p className="text-[12px] font-medium text-gray-500 leading-snug">{notif.message}</p>
                                            <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-wider">{notif.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="px-5 py-3 text-center border-t border-gray-100">
                                <button className="text-[13px] font-extrabold text-gray-600 hover:text-gray-900">View all notifications</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-8 w-px bg-gray-100 mx-2"></div>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex flex-col text-right">
                        <span className="text-[13px] font-bold text-slate-900 leading-none">
                            {currentUser?.displayName || 'User'}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 mt-1">
                            {currentUser?.email || 'user@taskmate.com'}
                        </span>
                    </div>
                    <div className="h-10 w-10 rounded-full border-2 border-[#10B981]/20 p-0.5">
                        <img 
                            alt="Profile" 
                            className="h-full w-full rounded-full object-cover" 
                            src={currentUser?.photoURL || currentUser?.avatar_url || "https://ui-avatars.com/api/?name=" + (currentUser?.displayName || 'User')} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopNavbar;
