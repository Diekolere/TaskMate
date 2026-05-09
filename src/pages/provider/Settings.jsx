import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import { Toaster, toast } from 'sonner';

const Settings = () => {
    const [notifications, setNotifications] = useState({
        emailMatches: true,
        smsMatches: false,
        paymentAlerts: true,
        promotions: false
    });

    const handleToggle = (key) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
        toast.success('Preferences updated');
    };

    return (
        <div className="min-h-screen bg-white flex font-sans text-gray-800">
            <ProviderSidebar />
            <ProviderMobileNavBar />
            <Toaster position="top-right" />

            <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
                <header className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 md:px-8 h-16 flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-800">Settings</h1>
                </header>

                <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-8">
                    
                    {/* Account Settings */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Account</h2>
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
                            <Link to="/provider/profile" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                                <span className="font-medium text-gray-700">Edit Profile</span>
                                <span className="material-symbols-outlined text-gray-400">arrow_forward_ios</span>
                            </Link>
                            <Link to="/provider/settings/password" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                                <span className="font-medium text-gray-700">Change Password</span>
                                <span className="material-symbols-outlined text-gray-400">arrow_forward_ios</span>
                            </Link>
                            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left">
                                <span className="font-medium text-gray-700">Two-Factor Authentication</span>
                                <span className="text-sm text-green-600 font-medium">Enabled</span>
                            </button>
                        </div>
                    </section>

                    {/* Notifications */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Notifications</h2>
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">Email Job Alerts</p>
                                    <p className="text-sm text-gray-500">Receive emails about new jobs in your area</p>
                                </div>
                                <button 
                                    onClick={() => handleToggle('emailMatches')}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${notifications.emailMatches ? 'bg-primary' : 'bg-gray-300'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${notifications.emailMatches ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </button>
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">SMS Notifications</p>
                                    <p className="text-sm text-gray-500">Receive text messages for urgent updates</p>
                                </div>
                                <button 
                                    onClick={() => handleToggle('smsMatches')}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${notifications.smsMatches ? 'bg-primary' : 'bg-gray-300'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${notifications.smsMatches ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </button>
                            </div>

                             <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">Payment Alerts</p>
                                    <p className="text-sm text-gray-500">Get notified when you get paid</p>
                                </div>
                                <button 
                                    onClick={() => handleToggle('paymentAlerts')}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${notifications.paymentAlerts ? 'bg-primary' : 'bg-gray-300'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${notifications.paymentAlerts ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Support & Legal */}
                    <section>
                         <h2 className="text-lg font-bold text-gray-900 mb-4">Support & Legal</h2>
                         <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
                            <Link to="/provider/support" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                                <span className="font-medium text-gray-700">Help Center</span>
                                <span className="material-symbols-outlined text-gray-400">arrow_forward_ios</span>
                            </Link>
                             <Link to="/privacy" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                                <span className="font-medium text-gray-700">Privacy Policy</span>
                                <span className="material-symbols-outlined text-gray-400">arrow_forward_ios</span>
                            </Link>
                             <Link to="/terms" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                                <span className="font-medium text-gray-700">Terms of Service</span>
                                <span className="material-symbols-outlined text-gray-400">arrow_forward_ios</span>
                            </Link>
                         </div>
                    </section>

                    {/* Danger Zone */}
                    <div className="pt-6">
                        <button className="w-full py-4 text-red-600 font-bold bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">logout</span>
                            Log Out
                        </button>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default Settings;
