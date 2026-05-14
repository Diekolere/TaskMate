import React, { useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import MobileNavBar from '../../components/layout/MobileNavBar';
import { toast, Toaster } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import Tutorial from '../../components/ui/Tutorial';

const InviteFriends = () => {
    const { currentUser } = useAuth();
    const [copied, setCopied] = useState(false);

    const tutorialSteps = [
        { target: '#tour-invite-banner', content: 'Share TaskMate with your friends and earn rewards when they complete tasks.', disableBeacon: true },
        { target: '#tour-invite-link', content: 'Here is your unique invite link. Click the button to copy it to your clipboard!' }
    ];

    // Simple invite link based on user uid
    const inviteLink = `https://taskmate-ng.vercel.app/invite/${currentUser?.uid || 'guest'}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex min-h-screen bg-[#F8F9FA] font-sans text-gray-900">
            <Tutorial steps={tutorialSteps} tutorialKey="inviteFriends" />
            <Toaster position="top-right" />
            <Sidebar />
            <MobileNavBar />
            
            <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
                <div className="mx-auto max-w-4xl p-6 md:p-10">
                    <motion.div 
                        id="tour-invite-banner"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center"
                    >
                        <div className="size-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-icons-outlined text-4xl">card_giftcard</span>
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 mb-4">Invite Friends, Get Rewarded</h1>
                        <p className="text-gray-500 mb-8 max-w-lg mx-auto">
                            Share TaskMate with your friends! When they sign up and complete their first service request, you'll both receive a $10 credit towards your next task.
                        </p>

                        <div id="tour-invite-link" className="max-w-md mx-auto bg-gray-50 rounded-2xl p-4 flex items-center justify-between border border-gray-200">
                            <span className="text-gray-600 truncate mr-4">{inviteLink}</span>
                            <button 
                                onClick={handleCopy}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-medium transition-colors whitespace-nowrap"
                            >
                                {copied ? 'Copied!' : 'Copy Link'}
                            </button>
                        </div>

                        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 bg-gray-50 rounded-2xl">
                                <span className="material-icons-outlined text-green-600 text-3xl mb-3">share</span>
                                <h3 className="font-bold text-lg mb-2">1. Share</h3>
                                <p className="text-gray-500 text-sm">Send your unique invite link to friends and family.</p>
                            </div>
                            <div className="p-6 bg-gray-50 rounded-2xl">
                                <span className="material-icons-outlined text-green-600 text-3xl mb-3">person_add</span>
                                <h3 className="font-bold text-lg mb-2">2. They Join</h3>
                                <p className="text-gray-500 text-sm">Your friends create an account using your link.</p>
                            </div>
                            <div className="p-6 bg-gray-50 rounded-2xl">
                                <span className="material-icons-outlined text-green-600 text-3xl mb-3">monetization_on</span>
                                <h3 className="font-bold text-lg mb-2">3. Earn</h3>
                                <p className="text-gray-500 text-sm">You both get rewards when they complete a task.</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default InviteFriends;
