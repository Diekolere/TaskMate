import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import { useAuth } from '../../context/AuthContext';
import { Toaster, toast } from 'sonner';
import { supabase } from '../../lib/supabase';

const ChangePassword = () => {
    const navigate = useNavigate();
    const { currentUser, isSimulated } = useAuth();
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError("New passwords don't match");
            setIsLoading(false);
            return;
        }

        if (formData.newPassword.length < 8) {
            setError("Password must be at least 8 characters long");
            setIsLoading(false);
            return;
        }

        try {
            if (isSimulated) {
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                // Call Supabase update password (this assumes user is already logged in)
                // Note: Verifying current password requires a re-auth flow or edge function usually, 
                // but supabase allows update directly if session is valid
                const { error } = await supabase.auth.updateUser({ password: formData.newPassword });
                if (error) throw error;
            }

            setSuccess(true);
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            toast.success("Password changed successfully");
            
            setTimeout(() => {
                navigate('/provider/settings');
            }, 2000);

        } catch (error) {
            console.error("Error changing password:", error);
            setError("Failed to change password: " + error.message);
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const breadcrumbItems = [
        { label: 'Settings', href: '/provider/settings' },
        { label: 'Change Password', href: '/provider/settings/password' }
    ];

    return (
        <div className="flex min-h-screen bg-cream font-sans text-charcoal">
            <ProviderSidebar />
            <Toaster position="top-right" />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <ProviderMobileNavBar />

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-2xl mx-auto">
                        <Breadcrumbs items={breadcrumbItems} />

                        <div className="bg-white rounded-[2rem] shadow-sm border border-charcoal/10 overflow-hidden mt-6">
                            <div className="px-8 py-6 border-b border-charcoal/5">
                                <div className="flex items-start gap-3">
                                    <span className="material-icons text-charcoal/70 text-3xl shrink-0 mt-0.5" aria-hidden>lock</span>
                                    <div>
                                        <h1 className="text-2xl font-black text-charcoal tracking-tight">Change Password</h1>
                                        <p className="text-sm text-charcoal/50 mt-1 font-medium">Ensure your account is using a long, random password to stay secure.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8">
                                {success && (
                                    <div className="mb-6 bg-lime/20 border border-lime text-charcoal px-4 py-3 rounded-xl flex items-center gap-3">
                                        <span className="material-icons text-lime-dark">check_circle</span>
                                        <p className="font-bold text-sm">Password changed successfully!</p>
                                    </div>
                                )}

                                {error && (
                                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
                                        <span className="material-icons text-red-500">error</span>
                                        <p className="font-bold text-sm">{error}</p>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-charcoal/40 ml-1">Current Password</label>
                                        <input
                                            type="password"
                                            name="currentPassword"
                                            value={formData.currentPassword}
                                            onChange={handleChange}
                                            className="w-full px-5 py-4 bg-cream/50 border border-charcoal/10 rounded-2xl focus:outline-none focus:border-lime focus:ring-4 focus:ring-lime/10 transition-all font-medium text-charcoal"
                                            placeholder="Enter your current password"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-charcoal/40 ml-1">New Password</label>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={formData.newPassword}
                                            onChange={handleChange}
                                            className="w-full px-5 py-4 bg-cream/50 border border-charcoal/10 rounded-2xl focus:outline-none focus:border-lime focus:ring-4 focus:ring-lime/10 transition-all font-medium text-charcoal"
                                            placeholder="Enter new password"
                                            required
                                        />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-charcoal/30 ml-1">Minimum 8 characters</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-charcoal/40 ml-1">Confirm New Password</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="w-full px-5 py-4 bg-cream/50 border border-charcoal/10 rounded-2xl focus:outline-none focus:border-lime focus:ring-4 focus:ring-lime/10 transition-all font-medium text-charcoal"
                                            placeholder="Confirm new password"
                                            required
                                        />
                                    </div>

                                    <div className="pt-6 flex items-center gap-4 border-t border-charcoal/5 mt-8">
                                        <button
                                            type="button"
                                            onClick={() => navigate('/provider/settings')}
                                            className="px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-charcoal/40 hover:bg-charcoal/5 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="flex-1 btn-lime justify-center rounded-2xl py-4"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <span className="material-icons animate-spin text-lg">autorenew</span>
                                                    Saving...
                                                </>
                                            ) : (
                                                'Change Password'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ChangePassword;
