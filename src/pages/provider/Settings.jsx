import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import TopNavbar from '../../components/layout/TopNavbar';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Toggle = ({ checked, onChange }) => (
    <button
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-[#10B981]' : 'bg-gray-200'}`}
    >
        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
);

const Settings = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState({
        emailMatches: true,
        smsMatches: false,
        paymentAlerts: true,
        promotions: false,
    });

    const handleToggle = (key) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
        toast.success('Preference updated');
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const accountLinks = [
        { label: 'Edit Profile', href: '/provider/profile', icon: 'person_outline' },
        { label: 'Change Password', href: '/provider/settings/password', icon: 'lock_outline' },
        { label: 'Two-Factor Authentication', href: null, icon: 'security', badge: 'Enabled' },
    ];

    const legalLinks = [
        { label: 'Help Center', href: '/provider/support', icon: 'help_outline' },
        { label: 'Privacy Policy', href: '/privacy', icon: 'policy' },
        { label: 'Terms of Service', href: '/terms', icon: 'description' },
    ];

    const notifItems = [
        { key: 'emailMatches', label: 'Email Job Alerts', desc: 'Receive emails about new jobs in your area' },
        { key: 'smsMatches', label: 'SMS Notifications', desc: 'Receive texts for urgent updates' },
        { key: 'paymentAlerts', label: 'Payment Alerts', desc: 'Get notified when you get paid' },
    ];

    return (
        <div className="min-h-screen bg-white flex font-sans">
            <ProviderSidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopNavbar breadcrumbs={['Settings']} />

                <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
                    <div className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto space-y-8">

                        {/* Account */}
                        <section>
                            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Account</h2>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                                {accountLinks.map(item => (
                                    item.href ? (
                                        <Link key={item.label} to={item.href} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50/80 transition-colors group">
                                            <span className="material-icons-outlined text-gray-400 text-lg group-hover:text-[#10B981] transition-colors">{item.icon}</span>
                                            <span className="text-sm font-semibold text-gray-700 flex-1">{item.label}</span>
                                            <span className="material-icons-outlined text-gray-300 text-base">chevron_right</span>
                                        </Link>
                                    ) : (
                                        <div key={item.label} className="flex items-center gap-3 px-5 py-4">
                                            <span className="material-icons-outlined text-gray-400 text-lg">{item.icon}</span>
                                            <span className="text-sm font-semibold text-gray-700 flex-1">{item.label}</span>
                                            {item.badge && <span className="text-xs font-bold text-[#10B981] bg-[#10B981]/10 px-2.5 py-1 rounded-lg">{item.badge}</span>}
                                        </div>
                                    )
                                ))}
                            </div>
                        </section>

                        {/* Notifications */}
                        <section>
                            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Notifications</h2>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                                {notifItems.map(item => (
                                    <div key={item.key} className="flex items-center justify-between px-5 py-4 gap-4">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                                        </div>
                                        <Toggle checked={notifications[item.key]} onChange={() => handleToggle(item.key)} />
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Support & Legal */}
                        <section>
                            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Support & Legal</h2>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                                {legalLinks.map(item => (
                                    <Link key={item.label} to={item.href} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50/80 transition-colors group">
                                        <span className="material-icons-outlined text-gray-400 text-lg group-hover:text-[#10B981] transition-colors">{item.icon}</span>
                                        <span className="text-sm font-semibold text-gray-700 flex-1">{item.label}</span>
                                        <span className="material-icons-outlined text-gray-300 text-base">chevron_right</span>
                                    </Link>
                                ))}
                            </div>
                        </section>

                        {/* Sign Out */}
                        <button
                            onClick={handleLogout}
                            className="w-full py-4 text-red-600 font-semibold bg-red-50 hover:bg-red-100 rounded-2xl transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                            <span className="material-icons-outlined text-base">logout</span>
                            Sign Out
                        </button>

                    </div>
                </main>
            </div>

            <ProviderMobileNavBar />
        </div>
    );
};

export default Settings;
