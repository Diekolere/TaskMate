import React from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from './OnboardingLayout';
import { useProviderOnboarding } from '../../../context/ProviderOnboardingContext';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'sonner';

const IdentityVerification = () => {
    const navigate = useNavigate();
    const { onboardingData, files, updateFiles } = useProviderOnboarding();
    const { updateUserProfile } = useAuth();
    const [loading, setLoading] = React.useState(false);

    const documents = { idFront: files.idFront, businessLicense: files.businessLicense };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) updateFiles({ [type]: file });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!documents.idFront) { toast.error('Government ID is required'); return; }
        setLoading(true);
        const toastId = toast.loading('Submitting your application…');
        setTimeout(async () => {
            await updateUserProfile({
                displayName: onboardingData.businessName || onboardingData.fullName,
                businessName: onboardingData.businessName,
                phoneNumber: onboardingData.phoneNumber,
                category: onboardingData.category,
                description: onboardingData.description,
                address: onboardingData.location || onboardingData.address,
                role: 'provider',
                onboardingCompleted: true,
                isVerified: false,
                verificationStatus: 'pending',
                rating: 0,
                jobsCompleted: 0,
            });
            toast.success('Application submitted!', { id: toastId });
            navigate('/provider/onboarding/status');
            setLoading(false);
        }, 2000);
    };

    const SidebarContent = (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
            <div className="flex items-center gap-2 mb-4">
                <span className="material-icons text-[#10B981]">verified_user</span>
                <h3 className="font-semibold text-gray-900">Why Verify?</h3>
            </div>
            <ul className="space-y-4">
                {['Earn the Verified badge trusted by all customers.', 'Get priority listing in search results.', 'Enable secure in-app payments via Squad.', 'Access dispute resolution support.'].map((t, i) => (
                    <li key={i} className="flex gap-3">
                        <span className="material-icons text-[#10B981] text-sm mt-0.5">check_circle</span>
                        <p className="text-sm text-gray-600">{t}</p>
                    </li>
                ))}
            </ul>
            <div className="mt-6 pt-5 border-t border-gray-100 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#6C47FF"/><path d="M16 7C11.029 7 7 11.029 7 16s4.029 9 9 9 9-4.029 9-9-4.029-9-9-9zm0 15.3A6.307 6.307 0 0 1 9.7 16 6.307 6.307 0 0 1 16 9.7 6.307 6.307 0 0 1 22.3 16 6.307 6.307 0 0 1 16 22.3z" fill="white"/><circle cx="16" cy="16" r="3" fill="white"/></svg>
                <p className="text-xs text-gray-400">KYC powered by <span className="font-bold text-[#6C47FF]">Squad</span></p>
            </div>
        </div>
    );

    return (
        <OnboardingLayout title="Identity Verification" step={3} sidebar={SidebarContent}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 sm:p-10">
                    <form onSubmit={handleSubmit} className="space-y-8">

                        <div className="bg-[#10B981]/5 border border-[#10B981]/20 rounded-xl p-5 flex items-start gap-4">
                            <span className="material-icons text-[#10B981] shrink-0">verified_user</span>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">Why verification?</h3>
                                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                    To maintain a safe and trusted community, we verify the identity of all service providers. Your documents are encrypted and stored securely.
                                </p>
                            </div>
                        </div>

                        {/* Government ID */}
                        <div>
                            <h3 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                                <span className="material-icons-outlined text-gray-400 text-lg">badge</span>
                                Government Issued ID
                            </h3>
                            <p className="text-sm text-gray-400 mb-4">NIN slip, Voter's card, Driver's licence, or Passport.</p>
                            <div className="border-2 border-dashed border-gray-200 hover:border-[#10B981] rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-[#10B981]/5 transition-all cursor-pointer group relative">
                                <input type="file" onChange={(e) => handleFileChange(e, 'idFront')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*,.pdf" />
                                {documents.idFront ? (
                                    <div className="flex flex-col items-center text-[#10B981]">
                                        <span className="material-icons text-4xl mb-2">check_circle</span>
                                        <span className="font-semibold text-gray-900 text-center text-sm">{documents.idFront.name}</span>
                                        <span className="text-xs text-gray-400 mt-1">Click to change</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <span className="material-icons text-[#10B981] text-2xl">cloud_upload</span>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900">Click to upload or drag and drop</p>
                                        <p className="text-xs text-gray-400 mt-1">PNG, JPG or PDF · max 5 MB</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Business License (optional) */}
                        <div>
                            <h3 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                                <span className="material-icons-outlined text-gray-400 text-lg">workspace_premium</span>
                                Business License <span className="text-gray-400 font-normal text-sm">(optional)</span>
                            </h3>
                            <div className="border-2 border-dashed border-gray-200 hover:border-[#10B981] rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-[#10B981]/5 transition-all cursor-pointer group relative">
                                <input type="file" onChange={(e) => handleFileChange(e, 'businessLicense')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*,.pdf" />
                                {documents.businessLicense ? (
                                    <div className="flex flex-col items-center text-[#10B981]">
                                        <span className="material-icons text-3xl mb-1">check_circle</span>
                                        <span className="font-semibold text-gray-900 text-sm">{documents.businessLicense.name}</span>
                                    </div>
                                ) : (
                                    <>
                                        <span className="material-icons text-gray-300 group-hover:text-[#10B981] text-3xl mb-2 transition-colors">upload_file</span>
                                        <p className="text-sm font-medium text-gray-500">Click to upload</p>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 flex justify-between items-center border-t border-gray-100">
                            <button type="button" onClick={() => navigate('/provider/onboarding/step-2')} className="text-gray-500 font-bold hover:text-gray-900 transition-colors">
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !documents.idFront}
                                className="bg-[#0F172A] hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {loading ? <><span className="material-icons text-sm animate-spin">autorenew</span> Submitting…</> : <>Submit Application <span className="material-icons text-sm">arrow_forward</span></>}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </OnboardingLayout>
    );
};

export default IdentityVerification;
