import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import TopNavbar from '../../components/layout/TopNavbar';
import MobileNavBar from '../../components/layout/MobileNavBar';
import { useData } from '../../context/DataContext';

const SavedProviders = () => {
    const { savedProviderIds, toggleSavedProvider, getProviders } = useData();
    const [savedProviders, setSavedProviders] = useState([]);
    const [loading, setLoading] = useState(true);

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
            
            <div className="flex-1 overflow-hidden flex flex-col min-w-0">
                <TopNavbar breadcrumbs={['Customer', 'Saved Providers']} />
                
                <main className="flex-1 overflow-y-auto bg-white">
                    <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8 pb-24 md:pb-10 space-y-6">
                        
                        {/* Header */}
                        <div className="flex items-end justify-between">
                            <div>
                                <h1 className="text-[22px] sm:text-[28px] font-extrabold text-gray-900 tracking-tight">Saved Providers</h1>
                                <p className="mt-1 text-[13px] font-medium text-gray-400">Service professionals you've bookmarked for later.</p>
                            </div>
                            <Link to="/customer/browse" id="tour-browse-more" className="hidden sm:inline-flex items-center gap-1 text-[13px] font-bold text-[#10B981] hover:text-[#059669] transition-colors">
                                Browse more
                                <span className="material-icons-outlined text-[16px]">arrow_forward</span>
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
                                    <div key={provider.id} className={`py-5 flex items-center gap-4 transition-colors hover:bg-gray-50/60 px-1 rounded-xl -mx-1 ${index !== savedProviders.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                        
                                        {/* Provider Info (Left) */}
                                        <div className="flex gap-4 items-center flex-1 min-w-0">
                                            <img src={provider.image} alt={provider.name} className="w-11 h-11 rounded-full border border-gray-200 object-cover shrink-0" />
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <h3 className="text-[15px] font-bold text-gray-900 truncate">
                                                        {provider.name}
                                                    </h3>
                                                    {provider.verified && <span className="material-icons text-[#10B981] text-[15px] shrink-0" title="Verified">verified</span>}
                                                </div>
                                                <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5 truncate">
                                                    <span className="text-gray-700 font-semibold">{provider.service}</span> 
                                                    <span className="text-gray-200">·</span> 
                                                    <span className="truncate">{provider.location}</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Rating */}
                                        {provider.rating && (
                                            <div className="flex items-center gap-1 bg-yellow-50 px-2.5 py-1 rounded-lg border border-yellow-100 shrink-0">
                                                <span className="material-icons text-yellow-500 text-[16px]">star</span>
                                                <span className="font-bold text-[13px] text-gray-900">{provider.rating}</span>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex items-center shrink-0">
                                            <Link 
                                                to={`/customer/provider/${provider.id}`} 
                                                className="h-9 flex items-center justify-center px-4 text-[12px] font-bold bg-[#0F172A] text-white rounded-xl hover:bg-slate-700 transition-all shadow-sm"
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
                                <h3 className="text-lg font-extrabold text-gray-900 mb-2">No saved providers yet</h3>
                                <p className="text-[14px] font-medium text-gray-500 max-w-md mx-auto mb-8">Found someone you like? Tap the bookmark icon on their profile to save them here for quick access later.</p>
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
