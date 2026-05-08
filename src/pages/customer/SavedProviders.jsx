import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
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
                            rating: data.rating || 'New',
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
        <div className="flex h-screen bg-[#F8F9FA] font-sans text-gray-900">
            <Sidebar />
            <Tutorial steps={tutorialSteps} tutorialKey="customerSavedProviders" />
            
            <main className="flex-1 overflow-hidden flex flex-col min-w-0">
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        
                        {/* Header */}
                        <div className="flex items-end justify-between mb-8">
                            <div>
                                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Saved Providers</h1>
                                <p className="mt-1 text-sm text-gray-500">Service professionals you've bookmarked for later.</p>
                            </div>
                            <Link to="/customer/browse" id="tour-browse-more" className="hidden sm:inline-flex items-center text-sm font-bold text-green-700 hover:text-green-800">
                                Browse more
                                <span className="material-icons-outlined text-lg ml-1">arrow_forward</span>
                            </Link>
                        </div>

                        {loading ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[1,2,3,4].map(i => (
                                    <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-3xl"></div>
                                ))}
                             </div>
                        ) : savedProviders.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="tour-saved-providers-grid">
                                {savedProviders.map((provider) => (
                                    <div key={provider.id} className="group bg-white rounded-3xl p-4 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 border border-gray-100 transition-all duration-300 relative flex flex-col">
                                        
                                        {/* Image Header */}
                                        <div className="relative mb-4">
                                            <div className="h-48 rounded-2xl overflow-hidden bg-gray-100">
                                                <img 
                                                    src={provider.image} 
                                                    alt={provider.name} 
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            </div>
                                            <button 
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    toggleSavedProvider(provider.id);
                                                }}
                                                className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm text-red-500 hover:scale-110 transition-transform active:scale-95"
                                            >
                                                <span className="material-icons text-xl">favorite</span>
                                            </button>
                                            {provider.verified && (
                                                <div className="absolute bottom-3 left-3 bg-blue-600 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
                                                    <span className="material-icons-outlined text-xs">verified</span>
                                                    Verified
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 flex flex-col">
                                            <div className="flex justify-between items-start mb-1">
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{provider.name}</h3>
                                                    <p className="text-sm font-medium text-gray-500">{provider.service}</p>
                                                </div>
                                                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                                                    <span className="material-icons text-yellow-500 text-sm">star</span>
                                                    <span className="text-xs font-bold text-gray-900">{provider.rating}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 text-sm text-gray-400 mt-2 mb-4">
                                                <span className="material-icons-outlined text-base">location_on</span>
                                                <span className="truncate">{provider.location}</span>
                                            </div>

                                            <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-gray-400 font-medium uppercase">Rate</p>
                                                    <div className="flex items-baseline gap-0.5">
                                                        <span className="text-lg font-black text-gray-900">{provider.rate}</span>
                                                    </div>
                                                </div>
                                                <Link 
                                                    to={`/customer/provider/${provider.id}`}
                                                    className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/20"
                                                >
                                                    View
                                                </Link>
                                            </div>
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
                                <Link to="/customer/browse" className="inline-flex items-center bg-green-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-800 transition-all shadow-lg shadow-green-700/20 hover:scale-[1.02]">
                                    Browse Providers
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
                <MobileNavBar />
            </main>
        </div>
    );
};

export default SavedProviders;