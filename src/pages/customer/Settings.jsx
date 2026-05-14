import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import TopNavbar from '../../components/layout/TopNavbar';
import MobileNavBar from '../../components/layout/MobileNavBar';
import { toast, Toaster } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { supabase, uploadFile, generateFilePath } from '../../lib/supabase';

const Settings = () => {
    const { currentUser, updateUserProfile } = useAuth();
    const { createSupportTicket } = useData();
    const [activeTab, setActiveTab] = useState('Profile');
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);

    // Form states
    const [profileForm, setProfileForm] = useState({
        displayName: '',
        phoneNumber: '',
        address: '',
        photoURL: ''
    });

    useEffect(() => {
        if (currentUser) {
            setProfileForm({
                displayName: currentUser.displayName || currentUser.full_name || '',
                phoneNumber: currentUser.phoneNumber || currentUser.phone_number || '',
                address: currentUser.location || currentUser.address || '', 
                photoURL: currentUser.photoURL || currentUser.avatar_url || ''
            });
        }
    }, [currentUser]);

    const [securityForm, setSecurityForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [supportForm, setSupportForm] = useState({ subject: '', message: '' });

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB");
            return;
        }

        try {
            setIsLoading(true);
            const path = generateFilePath(currentUser.id, file.name);
            const publicUrl = await uploadFile('avatars', path, file);

            await updateUserProfile({ photoURL: publicUrl });
            setProfileForm(prev => ({ ...prev, photoURL: publicUrl }));
            toast.success("Profile picture updated!");
        } catch (error) {
            console.error("Error uploading photo:", error);
            toast.error("Failed to upload photo");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!profileForm.displayName) {
            toast.error("Name cannot be empty");
            return;
        }

        setIsLoading(true);
        try {
            await updateUserProfile({
                displayName: profileForm.displayName,
                phoneNumber: profileForm.phoneNumber,
                location: profileForm.address
            });
            toast.success("Profile updated successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveSecurity = async (e) => {
        e.preventDefault();
        
        if (securityForm.newPassword !== securityForm.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (securityForm.newPassword.length < 8) {
            toast.error("Password must be at least 8 characters long");
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: securityForm.newPassword });
            if (error) throw error;
            toast.success('Password updated successfully');
            setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error('Error updating password:', error);
            toast.error('Failed to update password: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendSupport = async (e) => {
        e.preventDefault();
        if (!supportForm.subject || !supportForm.message) {
            toast.error("Please fill in all fields");
            return;
        }
        
        setIsLoading(true);
        try {
            await createSupportTicket(supportForm.subject, supportForm.message, supportForm.category || 'general');
            setSupportForm({ subject: '', message: '', category: 'general' });
        } catch (error) {
            console.error('Error sending support message:', error);
            toast.error('Failed to send message. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderTabs = () => (
        <div className="border-b border-gray-100 mb-8 overflow-x-auto no-scrollbar">
            <nav className="flex gap-8 min-w-max">
                {['Profile', 'Security', 'Notifications', 'Support'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-4 px-1 text-sm font-bold border-b-2 transition-all ${
                            activeTab === tab 
                            ? 'border-[#10B981] text-[#10B981]' 
                            : 'border-transparent text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        {tab}
                        {tab === 'Support' && <span className="ml-2 bg-red-50 text-red-500 text-[10px] px-1.5 py-0.5 rounded-full">New</span>}
                    </button>
                ))}
            </nav>
        </div>
    );

    return (
        <div className="flex h-screen bg-white font-sans text-gray-900">
            <Sidebar />
            <Toaster position="top-right" richColors />
            
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopNavbar breadcrumbs={['Customer', 'Settings']} />
                
                <main className="flex-1 overflow-y-auto bg-white">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-24 md:pb-10">
                        {/* Page Heading */}
                        <div className="mb-8">
                            <h2 className="text-[22px] sm:text-[28px] font-extrabold text-gray-900 tracking-tight">Account Settings</h2>
                            <p className="mt-1 text-[13px] font-medium text-gray-400">Manage your personal information and security preferences.</p>
                        </div>
                        
                        {renderTabs()}
                        
                        {/* Profile Tab Content */}
                        {activeTab === 'Profile' && (
                            <div className="space-y-10 animate-fade-in">
                                {/* Profile Picture */}
                                <div className="flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current.click()}
                                        className="relative group rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/40"
                                        aria-label="Update profile photo"
                                    >
                                        <img
                                            src={profileForm.photoURL || "https://ui-avatars.com/api/?name=" + (currentUser?.displayName || 'User')}
                                            alt="Profile"
                                            className="h-24 w-24 rounded-full object-cover border-4 border-gray-50 shadow-sm group-hover:opacity-90 transition-opacity"
                                        />
                                        <div className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md border border-gray-100 text-[#10B981]">
                                            <span className="material-icons-outlined text-lg">edit</span>
                                        </div>
                                    </button>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                </div>
                                
                                {/* Personal Information Form */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                                            <span className="material-icons-outlined text-[#10B981]">person</span>
                                            Personal Information
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-gray-700">Full Name</label>
                                            <input 
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-green-50 focus:border-[#10B981] outline-none transition-all" 
                                                type="text" 
                                                placeholder="Enter your full name"
                                                value={profileForm.displayName || ''}
                                                onChange={(e) => setProfileForm({...profileForm, displayName: e.target.value})}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-gray-700">Email Address</label>
                                            <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed flex items-center gap-2">
                                                <span className="material-icons-outlined text-sm">lock</span>
                                                {currentUser?.email || 'masked@example.com'}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-gray-700">Phone Number</label>
                                            <div className="relative">
                                                <input 
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-green-50 focus:border-[#10B981] outline-none transition-all" 
                                                    type="tel" 
                                                    placeholder="+234 800 000 0000"
                                                    value={profileForm.phoneNumber || ''}
                                                    onChange={(e) => setProfileForm({...profileForm, phoneNumber: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 md:col-span-2">
                                            <label className="text-sm font-semibold text-gray-700">Address</label>
                                            <input 
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-green-50 focus:border-[#10B981] outline-none transition-all" 
                                                placeholder="Enter your address" 
                                                type="text" 
                                                value={profileForm.address || ''}
                                                onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                                    <button 
                                        onClick={handleSaveProfile}
                                        disabled={isLoading}
                                        className="px-8 py-3 bg-[#10B981] text-white font-bold rounded-xl shadow-lg shadow-[#10B981]/20 hover:bg-[#059669] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isLoading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Other tabs follow similar pattern... */}
                        {/* Security Tab */}
                        {activeTab === 'Security' && (
                            <div className="space-y-8 animate-fade-in">
                                <form onSubmit={handleSaveSecurity} className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                                    <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4">Change Password</h3>
                                    
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-gray-700">Current Password</label>
                                            <input 
                                                type="password" 
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-50 focus:border-[#10B981] outline-none transition-all"
                                                value={securityForm.currentPassword}
                                                onChange={e => setSecurityForm({...securityForm, currentPassword: e.target.value})}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-semibold text-gray-700">New Password</label>
                                                <input 
                                                    type="password" 
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-50 focus:border-[#10B981] outline-none transition-all"
                                                    value={securityForm.newPassword}
                                                    onChange={e => setSecurityForm({...securityForm, newPassword: e.target.value})}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-semibold text-gray-700">Confirm Password</label>
                                                <input 
                                                    type="password" 
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-50 focus:border-[#10B981] outline-none transition-all"
                                                    value={securityForm.confirmPassword}
                                                    onChange={e => setSecurityForm({...securityForm, confirmPassword: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2 flex justify-end">
                                        <button 
                                            type="submit"
                                            disabled={isLoading}
                                            className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
                                        >
                                            {isLoading ? 'Updating...' : 'Update Password'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                        
                        {/* Notifications and Support tabs should be updated similarly if needed */}
                        {activeTab === 'Notifications' && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 animate-fade-in">
                                {[
                                    { title: 'Task Updates', desc: 'Get notified when a provider accepts your request or completes a task.', default: true },
                                    { title: 'Promotional Emails', desc: 'Receive offers, discounts and news about TaskMate.', default: false },
                                    { title: 'Security Alerts', desc: 'Get notified about new sign-ins and suspicious activity.', default: true },
                                    { title: 'SMS Notifications', desc: 'Receive urgent updates via text message.', default: true },
                                ].map((item, idx) => (
                                    <div key={idx} className="p-6 flex items-start justify-between">
                                        <div>
                                            <h3 className="font-bold text-gray-900">{item.title}</h3>
                                            <p className="text-sm text-gray-500 mt-1 max-w-md">{item.desc}</p>
                                        </div>
                                        <button className={`w-12 h-6 rounded-full p-1 transition-colors ${item.default ? 'bg-[#10B981]' : 'bg-gray-200'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${item.default ? 'translate-x-6' : ''}`}></div>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'Support' && (
                            <div className="max-w-2xl mx-auto animate-fade-in">
                                <div className="bg-green-50 border border-green-100 rounded-2xl p-6 mb-8 text-center">
                                    <div className="w-12 h-12 bg-white text-[#10B981] rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                        <span className="material-icons-outlined">support_agent</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">Need Help?</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Our support team is available 24/7. Fill out the form below or email us at <a href="mailto:support@taskmate.ng" className="text-[#10B981] font-bold hover:underline">support@taskmate.ng</a>
                                    </p>
                                </div>

                                <form onSubmit={handleSendSupport} className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                                    <h3 className="text-xl font-bold text-gray-900">Report an Issue</h3>
                                    
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-gray-700">Subject</label>
                                            <select 
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-50 focus:border-[#10B981] outline-none transition-all bg-white"
                                                value={supportForm.subject}
                                                onChange={e => setSupportForm({...supportForm, subject: e.target.value})}
                                            >
                                                <option value="" disabled>Select an issue type</option>
                                                <option value="payment">Payment Issue</option>
                                                <option value="provider">Report a Provider</option>
                                                <option value="app">App Bug/Technical Issue</option>
                                                <option value="other">Other Inquiry</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-gray-700">Message</label>
                                            <textarea 
                                                rows="5"
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-50 focus:border-[#10B981] outline-none transition-all resize-none"
                                                placeholder="Describe your issue in detail..."
                                                value={supportForm.message}
                                                onChange={e => setSupportForm({...supportForm, message: e.target.value})}
                                            ></textarea>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <button 
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full py-3.5 bg-[#10B981] text-white font-bold rounded-xl shadow-lg shadow-[#10B981]/20 hover:bg-[#059669] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? (
                                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            ) : (
                                                <>
                                                    <span className="material-icons-outlined">send</span>
                                                    Submit Request
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                    </div>
                </main>
                <MobileNavBar />
            </div>
        </div>
    );
};

export default Settings;
