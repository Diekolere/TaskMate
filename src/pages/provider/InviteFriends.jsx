import React, { useState } from 'react';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import { toast, Toaster } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import Tutorial from '../../components/ui/Tutorial';

const ProviderInviteFriends = () => {
    const { currentUser } = useAuth();
    const [copied, setCopied] = useState(false);

    const tutorialSteps = [
        {
            target: '#tour-invite-link',
            content: 'Copy this unique referral link and share it with other skilled professionals.',
            disableBeacon: true,
        },
        {
            target: '#tour-invite-steps',
            content: 'Here is how it works: share your link, they get verified, and you get paid a referral bonus!',
        }
    ];

    // Simple invite link based on user uid
    const inviteLink = `https://taskmate-ng.vercel.app/provider-invite/${currentUser?.uid || 'guest'}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        toast.success("Invite link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-white flex font-sans text-gray-800">
            <Toaster position="top-right" />
            <ProviderSidebar />
            <ProviderMobileNavBar />
            <Tutorial steps={tutorialSteps} tutorialKey="providerInviteFriends" />
            
            <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
                <div className="mx-auto max-w-4xl p-6 md:p-10 lg:pl-10 lg:pr-10 pt-8 lg:pt-8 w-full">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 text-center"
                    >
                        <div className="size-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-4xl">celebration</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Grow the Network, Boost Your Earnings</h1>
                        <p className="text-gray-500 mb-8 max-w-lg mx-auto text-lg">
                            Know other skilled professionals? Invite them to join TaskMate. When they sign up and complete their first 5 jobs, you'll earn a bonus!
                        </p>

                        <div className="max-w-md mx-auto bg-gray-50 rounded-2xl p-4 flex items-center justify-between border border-gray-200" id="tour-invite-link">
                            <span className="text-gray-600 truncate mr-4">{inviteLink}</span>
                            <button 
                                onClick={handleCopy}
                                className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-xl font-medium transition-colors whitespace-nowrap"
                            >
                                {copied ? 'Copied!' : 'Copy Link'}
                            </button>
                        </div>

                        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8" id="tour-invite-steps">
                            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 relative">
                                <div className="absolute -top-4 -left-4 size-8 bg-white border-2 border-primary text-primary rounded-full flex items-center justify-center font-bold">1</div>
                                <span className="material-symbols-outlined text-primary text-4xl mb-4 block">send</span>
                                <h3 className="font-bold text-lg mb-2 text-gray-900">Share Your Link</h3>
                                <p className="text-gray-500 text-sm">Send your unique invite link to other service providers you trust.</p>
                            </div>
                            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 relative">
                                <div className="absolute -top-4 -left-4 size-8 bg-white border-2 border-primary text-primary rounded-full flex items-center justify-center font-bold">2</div>
                                <span className="material-symbols-outlined text-primary text-4xl mb-4 block">how_to_reg</span>
                                <h3 className="font-bold text-lg mb-2 text-gray-900">They Get Verified</h3>
                                <p className="text-gray-500 text-sm">Your friends complete the onboarding and verification process.</p>
                            </div>
                            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 relative">
                                <div className="absolute -top-4 -left-4 size-8 bg-white border-2 border-primary text-primary rounded-full flex items-center justify-center font-bold">3</div>
                                <span className="material-symbols-outlined text-primary text-4xl mb-4 block">payments</span>
                                <h3 className="font-bold text-lg mb-2 text-gray-900">You Get Paid</h3>
                                <p className="text-gray-500 text-sm">Enjoy a referral bonus deposited directly into your earnings balance.</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default ProviderInviteFriends;
