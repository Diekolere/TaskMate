import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationPanel from './NotificationPanel';
import { useNotifications } from '../../context/NotificationContext';


const TopNavbar = ({ breadcrumbs = [] }) => {
    const { currentUser, logout } = useAuth();
    const { notifications, markAllNotificationsRead, markNotificationRead } = useNotifications();
    const navigate = useNavigate();
    const [notifDropOpen, setNotifDropOpen] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [pushVisible, setPushVisible] = useState(false);
    const [pushDismissed, setPushDismissed] = useState(false);
    const [activeToast, setActiveToast] = useState(null);
    const profileRef = useRef(null);
    const prevNotifsLength = useRef(notifications.length);

    const isProvider = currentUser?.role === 'provider';
    const unreadCount = notifications.filter(n => !n.is_read).length;

    // Detect new actionable notifications
    useEffect(() => {
        if (notifications.length > prevNotifsLength.current) {
            const latest = notifications[0];
            // Only show toast if it has a CTA and isn't read
            if (latest && (latest.cta_path || latest.cta_label) && !latest.is_read) {
                setActiveToast(latest);
                setPushVisible(true);
                setPushDismissed(false);
                
                // Auto-dismiss after 8 seconds
                const timer = setTimeout(() => {
                    setPushVisible(false);
                }, 8000);
                return () => clearTimeout(timer);
            }
        }
        prevNotifsLength.current = notifications.length;
    }, [notifications]);

    // Close profile dropdown on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target))
                setIsProfileOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleLogout = async () => {
        setIsProfileOpen(false);
        await logout();
        navigate('/');
    };

    const getPath = (label) => {
        const map = {
            'Customer': '/customer/dashboard',
            'Feed': '/customer/dashboard',
            'Explore Providers': '/customer/browse',
            'Providers': '/customer/browse',
            'My Requests': '/customer/requests',
            'Saved': '/customer/saved',
            'Saved Providers': '/customer/saved',
            'Post Request': '/customer/post-request',
            'Overview': '/provider/dashboard',
            'Dashboard': currentUser?.role === 'provider' ? '/provider/dashboard' : '/customer/dashboard',
            'Job Requests': '/provider/requests',
            'My Jobs': '/provider/jobs',
            'Jobs': '/provider/jobs',
            'Earnings': '/provider/earnings',
            'Schedule': '/provider/schedule',
            'Profile': currentUser?.role === 'provider' ? '/provider/profile' : '/customer/profile',
            'Settings': currentUser?.role === 'provider' ? '/provider/settings' : '/customer/settings',
            'Job Details': '#',
            'Request Details': '#',
        };
        return map[label] || '#';
    };

    const openPanel = () => { setNotifDropOpen(false); setPanelOpen(true); };

    return (
        <>
            <div className="h-14 sm:h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-[100] isolate">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-1 sm:gap-2 text-[12px] sm:text-[14px] font-medium min-w-0 overflow-hidden">
                    {breadcrumbs.map((crumb, index) => {
                        const isString = typeof crumb === 'string';
                        const label = isString ? crumb : crumb.label;
                        const path = isString ? getPath(crumb) : crumb.path;
                        
                        return (
                            <React.Fragment key={index}>
                                {index === breadcrumbs.length - 1 ? (
                                    <span className="text-slate-900 font-bold truncate">{label}</span>
                                ) : (
                                    <Link to={path} className="text-slate-400 hover:text-[#10B981] transition-colors shrink-0">
                                        {label}
                                    </Link>
                                )}
                                {index < breadcrumbs.length - 1 && (
                                    <span className="material-icons text-[14px] sm:text-[16px] text-slate-300 shrink-0">chevron_right</span>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3 sm:gap-6 shrink-0">

                    {/* Notification Bell */}
                    <div className="relative">
                        <button
                            onClick={() => { setNotifDropOpen(v => !v); setIsProfileOpen(false); }}
                            className="relative p-1.5 sm:p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-50 flex items-center justify-center"
                        >
                            <span className="material-icons-outlined text-[22px] sm:text-[24px]">notifications</span>
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 sm:top-1.5 sm:right-2 h-2 w-2 sm:h-2.5 sm:w-2.5 bg-red-500 rounded-full border-2 border-white" />
                            )}
                        </button>

                        {/* Mini dropdown */}
                        <AnimatePresence>
                            {notifDropOpen && (
                                <>
                                    <div className="fixed inset-0 z-[105] bg-transparent" onClick={() => setNotifDropOpen(false)} aria-hidden="true" />
                                    <motion.div
                                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                        transition={{ duration: 0.15 }}
                                        className="fixed left-2 right-2 top-14 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[110]"
                                    >
                                        <div className="bg-[#10B981] px-5 py-4 flex items-center justify-between">
                                            <h3 className="font-extrabold text-[15px] text-white">Notifications</h3>
                                            <button
                                                onClick={markAllNotificationsRead}
                                                className="text-[12px] font-bold text-white/80 hover:text-white transition-colors"
                                            >
                                                Mark all as read
                                            </button>
                                        </div>
                                        <div className="max-h-[60vh] sm:max-h-72 overflow-y-auto">
                                            {notifications.length === 0 && (
                                                <div className="p-10 text-center text-gray-400 text-sm">No notifications yet</div>
                                            )}
                                            {notifications.map(notif => {
                                                const isUnread = !notif.is_read;
                                                return (
                                                <div key={notif.id}
                                                    onClick={() => {
                                                        markNotificationRead(notif.id);
                                                        if (notif.cta_path) {
                                                            navigate(notif.cta_path);
                                                            setNotifDropOpen(false);
                                                        }
                                                    }}
                                                    className={`px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3 ${isUnread ? 'bg-[#10B981]/[0.03]' : ''}`}>
                                                    {/* Icon */}
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 relative ${notif.icon_bg || 'bg-gray-100'}`}>
                                                        <span className={`material-icons-outlined text-[15px] ${notif.icon_color || 'text-gray-400'}`}>{notif.icon || 'info'}</span>
                                                        {isUnread && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#10B981] rounded-full border border-white" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[13px] font-bold text-gray-900 mb-0.5">{notif.title}</p>
                                                        <p className="text-[12px] font-medium text-gray-500 leading-snug">{notif.body}</p>
                                                    </div>
                                                </div>
                                                );
                                            })}
                                        </div>
                                        <div className="px-5 py-3 text-center border-t border-gray-100">
                                            <button
                                                onClick={openPanel}
                                                className="text-[13px] font-extrabold text-gray-600 hover:text-gray-900 transition-colors"
                                            >
                                                View all notifications
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="h-6 sm:h-8 w-px bg-gray-100 hidden sm:block" />

                    {/* Profile */}
                    <div className="relative" ref={profileRef}>
                        <button
                            onClick={() => { setIsProfileOpen(v => !v); setNotifDropOpen(false); }}
                            className="flex items-center gap-3 cursor-pointer"
                        >
                            <div className="hidden sm:flex flex-col text-right">
                                <span className="text-[13px] font-bold text-slate-900 leading-none">{currentUser?.displayName || 'User'}</span>
                                <span className="text-[11px] font-medium text-slate-500 mt-1">{currentUser?.email || 'user@taskmate.com'}</span>
                            </div>
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border-2 border-[#10B981]/20 p-0.5">
                                <img
                                    alt="Profile"
                                    className="h-full w-full rounded-full object-cover"
                                    src={currentUser?.photoURL || currentUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.displayName || 'User')}`}
                                />
                            </div>
                        </button>

                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-10">
                                <div className="px-4 py-3 border-b border-gray-100 sm:hidden">
                                    <p className="text-[13px] font-bold text-gray-900 truncate">{currentUser?.displayName || 'User'}</p>
                                    <p className="text-[11px] font-medium text-gray-500 truncate">{currentUser?.email || 'user@taskmate.com'}</p>
                                </div>
                                <Link
                                    to={currentUser?.role === 'provider' ? '/provider/settings' : '/customer/settings'}
                                    onClick={() => setIsProfileOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <span className="material-icons-outlined text-[18px] text-gray-400">settings</span>
                                    Settings
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-semibold text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                                >
                                    <span className="material-icons-outlined text-[18px]">logout</span>
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Universal Actionable Toast */}
            <AnimatePresence>
                {pushVisible && activeToast && !pushDismissed && (
                    <motion.div
                        key="active-toast"
                        initial={{ x: 80, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 80, opacity: 0 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                        className="fixed top-16 sm:top-20 right-2 sm:right-4 z-[108] w-[calc(100vw-1rem)] sm:w-80 max-w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                    >
                        <div className={`h-1 bg-gradient-to-r ${activeToast.icon_color?.includes('emerald') || activeToast.icon_color?.includes('green') ? 'from-[#10B981] to-[#059669]' : 'from-blue-500 to-blue-700'}`} />
                        <div className="p-4 flex gap-3">
                            <div className={`w-10 h-10 ${activeToast.icon_bg || 'bg-gray-100'} rounded-xl flex items-center justify-center shrink-0`}>
                                <span className={`material-icons ${activeToast.icon_color || 'text-gray-400'} text-xl`}>{activeToast.icon || 'notifications'}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-[13px] font-bold text-gray-900 leading-snug">{activeToast.title}</p>
                                    <button
                                        onClick={() => { setPushVisible(false); setPushDismissed(true); }}
                                        className="text-gray-300 hover:text-gray-500 transition-colors shrink-0"
                                    >
                                        <span className="material-icons text-base">close</span>
                                    </button>
                                </div>
                                <p className="text-[12px] text-gray-500 mt-0.5 leading-snug line-clamp-2">{activeToast.body}</p>
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => { 
                                            setPushVisible(false); 
                                            setPushDismissed(true); 
                                            if (activeToast.cta_path) navigate(activeToast.cta_path);
                                            markNotificationRead(activeToast.id);
                                        }}
                                        className="flex-1 py-2 bg-[#0F172A] hover:bg-slate-700 text-white text-[11px] font-bold rounded-lg transition-all"
                                    >
                                        {activeToast.cta_label || 'View Details'}
                                    </button>
                                    <button
                                        onClick={() => { setPushVisible(false); setPushDismissed(true); markNotificationRead(activeToast.id); }}
                                        className="px-3 py-2 border border-gray-200 text-[11px] font-semibold text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        {activeToast.secondary_label || 'Later'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Full notification panel (slide from right) */}
            <NotificationPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
        </>
    );
};

export default TopNavbar;
