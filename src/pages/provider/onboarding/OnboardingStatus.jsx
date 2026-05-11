import React from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from './OnboardingLayout';
import { motion } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';

const OnboardingStatus = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  
  const status = currentUser?.isVerified ? 'approved' : (currentUser?.verificationStatus || 'pending');

  const handleLogout = async () => {
    try {
        await logout();
        navigate('/login');
    } catch (error) {
        console.error("Failed to logout", error);
    }
  };

  if (status === 'approved') {
      return (
        <OnboardingLayout title="Application Status" step={4}>
            <div className="bg-surface-light rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col items-center justify-center p-12 min-h-[400px]">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center max-w-lg"
                >
                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 relative">
                        <span className="material-symbols-outlined text-4xl text-green-500">check_circle</span>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Approved!</h2>
                    <p className="text-gray-500 mb-8">
                        Congratulations! Your provider account has been verified. You can now access the dashboard and start accepting jobs.
                    </p>

                    <button 
                        onClick={() => navigate('/provider/dashboard')}
                        className="w-full py-3 px-4 bg-primary hover:bg-green-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-green-200"
                    >
                        Go to Dashboard
                    </button>
                </motion.div>
            </div>
        </OnboardingLayout>
      );
  }

  if (status === 'rejected') {
      return (
        <OnboardingLayout title="Application Status" step={4}>
            <div className="bg-surface-light rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col items-center justify-center p-12 min-h-[400px]">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center max-w-lg"
                >
                    <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6 relative">
                        <span className="material-symbols-outlined text-4xl text-red-500">error</span>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Not Approved</h2>
                    <p className="text-gray-700 mb-4">
                        Unfortunately, your provider application was rejected. Please review the reason below.
                    </p>

                    {currentUser?.rejectionReason && (
                        <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-8 w-full text-left">
                            <p className="text-red-800 font-semibold mb-1">Reason for Rejection:</p>
                            <p className="text-red-700">{currentUser.rejectionReason}</p>
                        </div>
                    )}

                    <div className="flex flex-col w-full gap-3">
                        <button 
                            onClick={() => navigate('/provider/onboarding/step-1')}
                            className="w-full py-3 px-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-green-700 transition-colors"
                        >
                            Update Profile & Resubmit
                        </button>
                        <button 
                            onClick={handleLogout}
                            className="w-full py-3 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">logout</span>
                            Sign Out
                        </button>
                    </div>
                </motion.div>
            </div>
        </OnboardingLayout>
      );
  }

  return (
    <OnboardingLayout title="Application Status" step={4}>
      <div className="bg-surface-light rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col items-center justify-center p-12 min-h-[400px]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            key="pending"
            className="flex flex-col items-center text-center max-w-lg"
          >
            <div className="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center mb-6 relative">
                <span className="material-symbols-outlined text-4xl text-yellow-500">pending_actions</span>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Submission Under Review</h2>
            <p className="text-gray-500 mb-8">
                Thank you for applying to join TaskMate! We represent quality and trust, so we carefully review every provider.
            </p>

            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-left w-full mb-8">
                <div className="flex gap-4">
                    <span className="material-symbols-outlined text-blue-500 mt-1">info</span>
                    <div>
                        <h3 className="font-semibold text-blue-900 text-sm mb-1">What happens next?</h3>
                        <p className="text-sm text-blue-700 leading-relaxed">
                            Our team will verify your documents and profile details. This typically takes <strong>24-48 hours</strong>. 
                            You will be notified via email once your account is approved.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col w-full gap-3">
                 <button 
                  onClick={handleLogout}
                  className="w-full py-3 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                 >
                  <span className="material-symbols-outlined">logout</span>
                  Sign Out
                 </button>
            </div>
          </motion.div>
      </div>
     
    </OnboardingLayout>
  );
};

export default OnboardingStatus;
