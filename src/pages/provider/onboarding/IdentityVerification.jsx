import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from './OnboardingLayout';
import { useProviderOnboarding } from '../../../context/ProviderOnboardingContext';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'sonner';

const IdentityVerification = () => {
  const navigate = useNavigate();
  const { onboardingData, files, updateFiles } = useProviderOnboarding();
  const { updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Use files from context, defaulting to null if not set
  const documents = {
      idFront: files.idFront,
      businessLicense: files.businessLicense
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
        updateFiles({ [type]: file });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!documents.idFront) {
        toast.error("Government ID is required");
        return;
    }

    setLoading(true);
    const toastId = toast.loading("Submitting your application...");

    try {
        // Simulated submission
        setTimeout(async () => {
            // Mock profile update
            const providerData = {
                displayName: onboardingData.businessName || onboardingData.fullName, 
                businessName: onboardingData.businessName,
                phoneNumber: onboardingData.phoneNumber,
                category: onboardingData.category,
                description: onboardingData.description,
                address: onboardingData.location && typeof onboardingData.location === 'string' ? onboardingData.location : onboardingData.address,
                role: 'provider',
                onboardingCompleted: true,
                isVerified: false,
                verificationStatus: 'pending',
                rating: 0,
                jobsCompleted: 0
            };

            await updateUserProfile(providerData);

            toast.success("Application submitted successfully!", { id: toastId });
            navigate('/provider/onboarding/status');
            setLoading(false);
        }, 2000);

    } catch (error) {
        console.error("Submission error:", error);
        toast.error("Failed to submit application", { id: toastId });
        setLoading(false);
    }
  };

  const SidebarContent = (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
       <div className="flex items-center gap-2 mb-4">
           <span className="material-icons text-green-700">verified_user</span>
           <h3 className="font-semibold text-gray-900">Why Verify?</h3>
       </div>
       <ul className="space-y-4">
           <li className="flex gap-3">
               <span className="material-icons text-green-500 text-sm mt-0.5">check_circle</span>
               <p className="text-sm text-gray-600">Be trusted by 100% of customers due to the "Verified Badge".</p>
           </li>
           <li className="flex gap-3">
               <span className="material-icons text-green-500 text-sm mt-0.5">check_circle</span>
               <p className="text-sm text-gray-600">Get priority listing in search results when users filter for "Verified Pros".</p>
           </li>
            <li className="flex gap-3">
               <span className="material-icons text-green-500 text-sm mt-0.5">check_circle</span>
               <p className="text-sm text-gray-600">Ensure payment security and dispute resolution support.</p>
           </li>
       </ul>
       <div className="mt-6 pt-6 border-t border-gray-100">
           <h4 className="font-semibold text-gray-800 mb-2 text-sm">Uploading Tips:</h4>
           <p className="text-xs text-gray-500">Ensure all 4 corners of the document are visible. Avoid glare or shadows. Text must be readable.</p>
       </div>
    </div>
  );

  return (
    <OnboardingLayout title="Identity Verification" step={3} sidebar={SidebarContent}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            <div className="bg-green-50 border border-green-100 rounded-xl p-6 flex flex-col sm:flex-row items-start gap-4">
              <div className="bg-white p-2 rounded-full shadow-sm">
                <span className="material-icons text-green-700">verified_user</span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Why verification?</h3>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  To maintain a safe and trusted community for our customers, we verify the identity of all service providers. Your documents are encrypted and stored securely.
                </p>
              </div>
            </div>

            <div className="space-y-8">
              {/* Government ID */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                 <span className="material-icons text-gray-400">badge</span>
                 Government Issued ID
                </h3>
                
                <div className="border-2 border-dashed border-gray-200 hover:border-green-700 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-green-50/30 transition-all cursor-pointer group relative">
                  <input 
                    type="file" 
                    onChange={(e) => handleFileChange(e, 'idFront')}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept="image/*,.pdf"
                  />
                  
                  {documents.idFront ? (
                    <div className="flex flex-col items-center text-green-700">
                        <span className="material-icons text-4xl mb-2">check_circle</span>
                        <span className="font-semibold text-gray-900 text-center">{documents.idFront.name}</span>
                        <span className="text-xs text-gray-500 mt-1">Click to change file</span>
                    </div>
                  ) : (
                    <>
                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="material-icons text-green-700 text-2xl">cloud_upload</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 text-center">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-500 mt-2">SVG, PNG, JPG or PDF (max. 5MB)</p>
                    </>
                  )}
                </div>
              </div>

               {/* Business License */}
               <div>
                 <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="material-icons text-gray-400">workspace_premium</span>
                    Business License (Optional)
                 </h3>
                
                 <div className="border-2 border-dashed border-gray-200 hover:border-green-700 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-green-50/30 transition-all cursor-pointer group relative">
                   <input 
                     type="file" 
                     onChange={(e) => handleFileChange(e, 'businessLicense')}
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                     accept="image/*,.pdf"
                   />
                   {documents.businessLicense ? (
                    <div className="flex flex-col items-center text-green-700">
                        <span className="material-icons text-4xl mb-2">check_circle</span>
                        <span className="font-semibold text-gray-900 text-center">{documents.businessLicense.name}</span>
                        <span className="text-xs text-gray-500 mt-1">Click to change file</span>
                    </div>
                  ) : (
                    <>
                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="material-icons text-gray-400 group-hover:text-green-700 transition-colors text-2xl">cloud_upload</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 text-center">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-500 mt-2">SVG, PNG, JPG or PDF (max. 5MB)</p>
                    </>
                   )}
                 </div>
               </div>
            </div>

            <div className="pt-6 flex justify-between items-center">
               <button
                  type="button"
                  onClick={() => navigate('/provider/onboarding/step-2')}
                  className="text-gray-500 font-bold hover:text-gray-900 transition-colors"
                >
                  Back
               </button>
              <button
                type="submit"
                className={`bg-green-700 hover:bg-green-800 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-green-700/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2
                  ${loading || !documents.idFront ? 'opacity-50 cursor-not-allowed hover:bg-green-700 hover:scale-100' : ''}`}
                disabled={loading || !documents.idFront}
              >
                {loading ? 'Submitting...' : 'Submit Application'}
                {loading ? <span className="material-icons text-sm font-bold animate-spin">progress_activity</span> : <span className="material-icons text-sm font-bold">check</span>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default IdentityVerification;
