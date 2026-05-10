import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const MobileNavBar = () => {
    const location = useLocation();
    
    const navItems = [
        { icon: 'home', label: 'Home', path: '/customer/dashboard' },
        { icon: 'explore', label: 'Explore', path: '/customer/browse' },
        { icon: 'add_circle', label: 'Post', path: '/customer/post-request', isMain: true },
        { icon: 'list_alt', label: 'Requests', path: '/customer/requests' },
        { icon: 'favorite_border', label: 'Saved', path: '/customer/saved' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[95] md:hidden">
            {/* Safe-area gradient fade */}
            <div className="absolute inset-x-0 bottom-full h-6 bg-gradient-to-t from-white/80 to-transparent pointer-events-none"></div>
            
            <nav className="flex items-center justify-around bg-white/95 backdrop-blur-xl border-t border-gray-100 px-2 py-2 shadow-[0_-2px_20px_rgba(0,0,0,0.06)]">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                    
                    if (item.isMain) {
                        return (
                            <Link 
                                key={item.label}
                                to={item.path}
                                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#10B981] text-white shadow-lg shadow-[#10B981]/30 transition-transform hover:scale-105 active:scale-95 -mt-4"
                            >
                                <span className="material-icons-outlined text-[24px]">{item.icon}</span>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.label}
                            to={item.path}
                            className={`relative flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-200 ${
                                isActive 
                                    ? 'text-[#10B981]' 
                                    : 'text-gray-400'
                            }`}
                        >
                            <span className="material-icons-outlined text-[22px]">{item.icon}</span>
                            <span className="text-[10px] font-bold leading-none">{item.label}</span>
                            {isActive && (
                                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full bg-[#10B981]"></span>
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
};

export default MobileNavBar;
