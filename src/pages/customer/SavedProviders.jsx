import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import TopNavbar from '../../components/layout/TopNavbar';
import MobileNavBar from '../../components/layout/MobileNavBar';
import { useData } from '../../context/DataContext';
import Tutorial from '../../components/ui/Tutorial';

const SavedProviders = () => {
    const { savedProviderIds, toggleSavedProvider, getProviders } = useData();
    const [savedProviders, setSavedProviders] = useState([]);
    const [loading, setLoading] = useState(true);

    const tutorialSteps = [
        {
            target: '#tour-saved-providers-grid',
            content: 'These are the providers you have saved for later. You can view their profiles or remove them from this list.',
            disableBeacon: true,
        },
        {
            target: '#tour-browse-more',
            content: 'Click here to find and save more service providers.',
        }
    ];

    useEffect(() => {
        const fetchSavedProviders = async () => {
            if (savedProviderIds.length === 0) {
                setSavedProviders([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const allProviders = await getProviders('All');
                const providers = allProviders
                    .filter(p => savedProviderIds.includes(p.id) || savedProviderIds.includes(p.uid))
                    .map(data => {
                        return {
                            id: data.id || data.uid,
                            name: data.displayName || data.full_name || 'Provider',
                            service: data.category || 'Service Provider',
                            image: data.photoURL || data.avatar_url || `https://ui-avatars.com/api/?name=${data.displayName}&background=random`,
                            rating: data.rating || null,
                            rate: data.hourlyRate ? `₦${Number(data.hourlyRate).toLocaleString()}` : (data.hourly_rate_min ? `₦${Number(data.hourly_rate_min).toLocaleString()}` : 'Negotiable'),
                            location: data.address || data.location_name || 'Remote',
                            verified: data.isVerified || data.is_verified
                        };
                    });
                
                setSavedProviders(providers);
            } catch (error) {
                console.error("Error fetching saved providers:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSavedProviders();
    }, [savedProviderIds, getProviders]);

    return (
        <div className="flex h-screen bg-white font-sans text-gray-900">
            <Sidebar />
            <Tutorial steps={tutorialSteps} tutorialKey="customerSavedProviders" />
            
            <div className="flex-1 overflow-hidden flex flex-col min-w-0">
                <TopNavbar breadcrumbs={['Customer', 'Saved Providers']} />
                
                <main className="flex-1 overflow-y-auto bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-24 md:pb-10">
                        
                        {/* Header */}
                        <div className="flex items-end justify-between mb-6 sm:mb-8">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Saved Providers</h1>
                                <p className="mt-1 text-[13px] sm:text-sm text-gray-500">Service professionals you've bookmarked for later.</p>
                            </div>
                            <Link to="/customer/browse" id="tour-browse-more" className="hidden sm:inline-flex items-center text-sm font-bold text-[#10B981] hover:text-[#059669]">
                                Browse more
                                <span className="material-icons-outlined text-lg ml-1">arrow_forward</span>
                            </Link>
                        </div>

                        {loading ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[1,2,3,4].map(i => (
                                    <div key={i} className="h-64 bg-gray-50 animate-pulse rounded-3xl"></div>
                                ))}
                             </div>
                        ) : savedProviders.length > 0 ? (
                            <div className="flex flex-col relative z-0" id="tour-saved-providers-grid">
                                {savedProviders.map((provider, index) => (
                                    <div key={provider.id} className={`py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors hover:bg-gray-50/50 px-2 rounded-xl -mx-2 ${index !== savedProviders.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                        
                                        {/* Provider Info (Left) */}
                                        <div className="flex gap-5 items-center flex-1">
                                            <img src={provider.image} alt={provider.name} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border border-gray-200 object-cover shrink-0" />
                                            <div>
                                                <h3 className="font-extrabold text-[17px] text-gray-900 flex items-center gap-1.5 mb-1 tracking-wide group-hover:text-[#10B981] transition-colors">
                                                    {provider.name}
                                                    {provider.verified && <span className="material-icons text-[#10B981] text-[18px]" title="Verified">verified</span>}
                                                </h3>
                                                <p className="text-[13px] font-medium text-gray-500 flex items-center gap-1.5">
                                                    <span className="text-gray-700 font-bold">{provider.service}</span> 
                                                    <span className="text-gray-300">•</span> 
                                                    <span className="material-icons-outlined text-[14px]">location_on</span> {provider.location}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Stats (Middle) */}
                                        {provider.rating && (
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <span className="material-icons text-yellow-500 text-[18px]">star</span>
                                                <span className="font-extrabold text-[15px] text-gray-900">{provider.rating}</span>
                                            </div>
                                        )}

                                        {/* Actions (Right) */}
                                        <div className="flex items-center gap-3 shrink-0 mt-4 sm:mt-0">
                                            <Link 
                                                to={`/customer/provider/${provider.id}`} 
                                                className="h-10 flex items-center justify-center px-5 text-[13px] font-extrabold bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all shadow-sm"
                                            >
                                                View Profile
                                            </Link>
                                        </div>

                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-50 mb-6">
                                    <span className="material-icons-outlined text-gray-400 text-4xl">bookmark_border</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No saved providers yet</h3>
                                <p className="text-gray-500 max-w-md mx-auto mb-8">Found someone you like? Tap the heart icon on their profile to save them here for quick access later.</p>
                                <Link to="/customer/browse" className="inline-flex items-center bg-[#10B981] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#059669] transition-all shadow-lg shadow-[#10B981]/20 hover:scale-[1.02]">
                                    Explore Providers
                                </Link>
                            </div>
                        )}
                    </div>
                </main>
                <MobileNavBar />
            </div>
        </div>
    );
};

export default SavedProviders;