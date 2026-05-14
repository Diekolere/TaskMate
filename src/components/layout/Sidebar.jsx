import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    // Customer Navigation Items
    const customerNav = [
        { icon: 'home', label: 'Feed', href: '/customer/dashboard' },
        { icon: 'explore', label: 'Explore Providers', href: '/customer/browse' },
        { icon: 'assignment', label: 'Requests', href: '/customer/requests' }, 
        { icon: 'favorite_border', label: 'Saved', href: '/customer/saved' },
        { icon: 'settings', label: 'Settings', href: '/customer/settings' },
    ];

    // Provider Navigation Items
    const providerNav = [
        { icon: 'dashboard', label: 'Overview', href: '/provider/dashboard' },
        { icon: 'mail_outline', label: 'Requests', href: '/provider/requests' },
        { icon: 'work_outline', label: 'My Jobs', href: '/provider/jobs' },
        { icon: 'account_balance_wallet', label: 'Earnings', href: '/provider/earnings' },
        { icon: 'person_outline', label: 'Profile', href: '/provider/profile' },
        { icon: 'settings', label: 'Settings', href: '/provider/settings' },
    ];

    const navItems = currentUser?.role === 'provider' ? providerNav : customerNav;

    return (
        <aside 
            className={`hidden md:flex flex-col bg-white border-r border-gray-100 h-screen sticky top-0 shrink-0 pb-8 transition-all duration-300 ease-in-out z-[110] ${isCollapsed ? 'w-[80px]' : 'w-[260px]'}`}
        >
            {/* Logo */}
            <div className={`flex items-center h-20 border-b border-gray-100 mb-6 w-full relative ${isCollapsed ? 'justify-center px-2' : 'justify-between px-6'}`}>
                <Link to={currentUser?.role === 'provider' ? '/provider/dashboard' : '/customer/dashboard'} className="flex items-center gap-2.5">
                    <img 
                        alt="TaskMate Icon" 
                        className={`object-contain transition-all duration-300 ${isCollapsed ? 'h-8 w-8' : 'h-8 w-8'}`} 
                        src="/icon.png" 
                    />
                    <span className={`text-[26px] font-extrabold text-slate-900 tracking-tight font-serif ${isCollapsed ? 'hidden' : 'block'}`}>TaskMate</span>
                </Link>
                {!isCollapsed && (
                    <button onClick={() => setIsCollapsed(true)} className="text-gray-400 hover:text-gray-900 transition-colors">
                        <span className="material-icons-outlined text-sm">chevron_left</span>
                    </button>
                )}
            </div>

            {/* Toggle Button for Collapsed State */}
            {isCollapsed && (
                <button 
                    onClick={() => setIsCollapsed(false)}
                    className="absolute top-10 -right-3 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 shadow-sm z-10"
                >
                    <span className="material-icons-outlined text-[10px]">chevron_right</span>
                </button>
            )}

            {/* Nav Items */}
            <nav className={`flex-1 w-full flex flex-col gap-1.5 ${isCollapsed ? 'items-center px-2' : 'px-6'}`}>
                {navItems.map((item, idx) => {
                    const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
                    return (
                        <Link 
                            key={idx}
                            to={item.href} 
                            className={`flex items-center rounded-xl transition-all duration-200 group w-full ${
                                isCollapsed ? 'justify-center p-2.5' : 'px-3.5 py-2.5 gap-3'
                            } ${
                                isActive 
                                    ? 'bg-[#0F172A] text-white shadow-sm' 
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                            }`}
                            title={isCollapsed ? item.label : ""}
                        >
                            <span className={`material-icons-outlined text-[20px] transition-colors shrink-0 ${isActive ? 'text-[#10B981]' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                {item.icon}
                            </span>
                            {!isCollapsed && <span className={`font-bold text-[13px] tracking-wide ${isActive ? 'text-white' : ''}`}>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Actions - Merged Profile and Logout */}
            <div className={`w-full flex flex-col mt-auto pt-6 border-t border-gray-100 ${isCollapsed ? 'items-center px-2' : 'px-6'}`}>
                <button 
                    onClick={handleLogout}
                    className={`flex items-center rounded-xl transition-all duration-200 group hover:bg-red-50 w-full ${
                        isCollapsed ? 'justify-center p-3' : 'px-3 py-3 gap-3'
                    }`}
                    title={isCollapsed ? "Logout" : ""}
                >
                    {!isCollapsed ? (
                        <>
                            <img alt="Profile" className="h-8 w-8 rounded-full object-cover shrink-0 border border-gray-200" src={currentUser?.photoURL || currentUser?.avatar_url || "https://ui-avatars.com/api/?name=" + (currentUser?.displayName || 'User')} />
                            <div className="flex flex-col text-left overflow-hidden flex-1">
                                <span className="text-[13px] font-bold text-gray-900 truncate group-hover:text-red-600 transition-colors">{currentUser?.displayName || 'User'}</span>
                                <span className="text-[11px] font-medium text-gray-500 truncate group-hover:text-red-400 transition-colors">Sign Out</span>
                            </div>
                            <span className="material-icons-outlined text-[20px] text-gray-400 group-hover:text-red-600 transition-colors">logout</span>
                        </>
                    ) : (
                        <span className="material-icons-outlined text-[22px] text-slate-400 group-hover:text-red-500 transition-colors">logout</span>
                    )}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
