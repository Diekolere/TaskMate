import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const TopNavbar = ({ breadcrumbs = [] }) => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-[14px] font-medium">
                {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                        <span className={`${index === breadcrumbs.length - 1 ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                            {crumb}
                        </span>
                        {index < breadcrumbs.length - 1 && (
                            <span className="material-icons text-[16px] text-slate-300">chevron_right</span>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Right Side: Actions and Profile */}
            <div className="flex items-center gap-6">
                <button 
                    onClick={() => navigate('/customer/post-request')}
                    className="hidden sm:flex items-center gap-2 text-[13px] font-bold text-white bg-[#10B981] px-5 py-2.5 rounded-xl hover:bg-[#059669] transition-all shadow-sm"
                >
                    <span className="material-icons text-[18px]">add</span>
                    Post Request
                </button>

                <div className="h-8 w-px bg-gray-100 mx-2"></div>

                <div className="flex items-center gap-3">
                    <div className="flex flex-col text-right">
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
