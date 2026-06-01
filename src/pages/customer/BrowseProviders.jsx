import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import TopNavbar from '../../components/layout/TopNavbar';
import MobileNavBar from '../../components/layout/MobileNavBar';
import { useAuth } from '../../context/AuthContext';

import { supabase } from '../../lib/supabase';
import { useProvider } from '../../context/ProviderContext';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

const BrowseProviders = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { getProviders, savedProviderIds, toggleSavedProvider, getAvailableCategories } = useProvider();
    const [providers, setProviders] = useState([]);
    const [displayCount, setDisplayCount] = useState(15);
    const [loading, setLoading] = useState(true);
    const [availableCats, setAvailableCats] = useState([]);
    
    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    
    // ... existing filters states ...
    const [searchQuery, setSearchQuery] = useState('');
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isRatingOpen, setIsRatingOpen] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [sortFilter, setSortFilter] = useState('Highest Rated');
    const [ratingFilter, setRatingFilter] = useState('Any Rating');
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const categories = [
        "Plumbing", "Electrical", "Furniture (Carpentry)", "Cleaning", "Painting",
        "HVAC", "Moving", "Roofing", "Appliance Repair", "Landscaping", "Laundry"
    ];

    const toggleCategory = (cat) => {
        if (selectedCategories.includes(cat)) {
            setSelectedCategories(selectedCategories.filter(c => c !== cat));
        } else {
            setSelectedCategories([...selectedCategories, cat]);
        }
    };

    // 1. Get User Location on Mount
    useEffect(() => {
        // Use user's saved coordinates if available, otherwise prompt browser
        if (currentUser?.latitude && currentUser?.longitude) {
            setUserLocation({ lat: currentUser.latitude, lng: currentUser.longitude });
        } else if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setLocationError(null);
                },
                (error) => {
                    console.warn("Geolocation denied or error:", error);
                    setLocationError("Please enable location services to find providers near you.");
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
        } else {
            setLocationError("Geolocation is not supported by your browser.");
        }
    }, [currentUser]);

    // 2. Fetch Providers using PostGIS RPC
    useEffect(() => {
        const fetchProviders = async () => {
            setLoading(true);
            
            // Still get available categories for the dropdown
            const avail = await getAvailableCategories();
            setAvailableCats(avail);

            // Wait for location. If error, we can't search by proximity easily, but we can still show a message or empty state.
            if (!userLocation && !locationError) {
                // Still waiting for location permission/fetch
                return;
            }

            if (locationError) {
                // If location failed, we might fallback to empty or show the error.
                setProviders([]);
                setLoading(false);
                return;
            }

            // Map Sort Filter to RPC format
            let rpcSort = 'rating';
            if (sortFilter === 'Nearest') rpcSort = 'distance';
            if (sortFilter === 'Most Jobs Done') rpcSort = 'jobs';

            // Map Rating Filter
            let rpcMinRating = 0;
            if (ratingFilter !== 'Any Rating') {
                rpcMinRating = parseFloat(ratingFilter.split('+')[0]);
            }

            try {
                const mappedCategories = [];
                selectedCategories.forEach(c => {
                    const low = c.toLowerCase();
                    const cap = c.charAt(0).toUpperCase() + c.slice(1);
                    
                    if (low.includes('furniture') || low.includes('carpentry')) {
                        mappedCategories.push('carpentry', 'Carpentry', 'Furniture (Carpentry)', 'furniture (carpentry)');
                    } else if (low.includes('appliance')) {
                        mappedCategories.push('appliance repair', 'Appliance Repair', 'Appliance repair');
                    } else {
                        mappedCategories.push(low, cap, c);
                    }
                });

                // Call the new RPC
                const { data, error } = await supabase.rpc('get_providers_in_radius', {
                    user_lat: userLocation.lat,
                    user_lng: userLocation.lng,
                    radius_meters: 50000, // 50km
                    category_filters: mappedCategories.length > 0 ? mappedCategories : null,
                    min_rating: rpcMinRating,
                    sort_by: rpcSort
                });

                if (error) throw error;

                // Client-side text search and strict cumulative filters
                let finalData = data || [];

                // 1. Enforce category strictly
                if (mappedCategories.length > 0) {
                    finalData = finalData.filter(p => {
                        const cats = p.trade_category || (p.category ? [p.category] : []);
                        if (!cats.length) return false;
                        return cats.some(c => {
                            if (!c) return false;
                            const clow = c.toLowerCase();
                            return mappedCategories.some(mc => mc.toLowerCase() === clow);
                        });
                    });
                }

                // 2. Enforce rating strictly
                if (rpcMinRating > 0) {
                    finalData = finalData.filter(p => Number(p.rating || 0) >= rpcMinRating);
                }

                // 3. Search query
                if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase();
                    finalData = finalData.filter(p => 
                        (p.display_name?.toLowerCase().includes(q)) ||
                        (p.full_name?.toLowerCase().includes(q)) ||
                        (p.bio?.toLowerCase().includes(q)) ||
                        (p.trade_category && p.trade_category.some(tc => tc.toLowerCase().includes(q))) ||
                        (p.category && p.category.toLowerCase().includes(q))
                    );
                }

                // 4. Sort strictly
                if (sortFilter === 'Highest Rated') {
                    finalData.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
                } else if (sortFilter === 'Most Jobs Done') {
                    finalData.sort((a, b) => Number(b.completed_jobs || 0) - Number(a.completed_jobs || 0));
                } else if (sortFilter === 'Nearest') {
                    // if distance is provided by RPC
                    if (finalData.length > 0 && finalData[0].distance != null) {
                        finalData.sort((a, b) => Number(a.distance || 0) - Number(b.distance || 0));
                    }
                }

                // Format data to match previous component structure expectations
                const formatted = finalData.map(p => ({
                    ...p,
                    displayName: p.display_name,
                    photoURL: p.photo_url,
                    completedJobs: p.completed_jobs,
                    skills: p.trade_category || [p.category]
                }));

                setProviders(formatted);
                setDisplayCount(15);
            } catch (err) {
                console.error("Error fetching providers:", err);
                setProviders([]);
            } finally {
                setLoading(false);
            }
        };

        // Only run fetch if we have location or an error state
        if (userLocation || locationError) {
            fetchProviders();
        }
    }, [selectedCategories, sortFilter, ratingFilter, searchQuery, userLocation, locationError, getAvailableCategories]);

    useEffect(() => {
        const channel = supabase
            .channel('provider-profiles-browse-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'provider_profiles'
                },
                async () => {
                    const avail = await getAvailableCategories();
                    setAvailableCats(avail);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [getAvailableCategories]);

    const loadMoreRef = useIntersectionObserver(() => setDisplayCount(prev => prev + 15), providers.length > displayCount);

    return (
        <div className="flex min-h-screen bg-white font-sans text-gray-900">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <TopNavbar breadcrumbs={['Customer', 'Explore Providers']} />

                {/* Main Content Area */}
                <main className="relative z-0 flex-1 overflow-y-auto bg-white">
                    <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8 pb-24 md:pb-10 flex flex-col gap-1 sm:gap-6">
                        
                        {/* Header Section */}
                        <div className="mb-1 sm:mb-6">
                            <h1 className="text-[20px] sm:text-[28px] font-extrabold tracking-tight text-gray-900 mb-0.5 sm:mb-1">Explore Providers</h1>
                            <p className="text-[12px] sm:text-[13px] font-medium text-gray-400 mb-3 sm:mb-6">Find and hire skilled professionals near you.</p>

                            {/* Search Bar + Filter Toggle */}
                            <div className="flex items-center gap-2 mb-1 sm:mb-4">
                                <div className="flex-1 flex items-center bg-white rounded-xl px-4 py-2.5 sm:py-3.5 border border-gray-200 group focus-within:border-gray-400 focus-within:shadow-sm transition-all cursor-text w-full">
                                    <span className="material-icons-outlined text-[18px] text-gray-400 group-focus-within:text-gray-600">search</span>
                                    <input 
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-transparent border-none outline-none text-[15px] text-gray-800 ml-3 w-full placeholder:text-gray-400 font-medium"
                                        placeholder="Search by name, skill, or keyword..."
                                    />
                                    <span className="text-[10px] bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 ml-2 font-mono font-bold text-gray-500 shrink-0 hidden sm:inline">⌘K</span>
                                </div>
                                <button 
                                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                                    className={`sm:hidden w-11 h-11 flex items-center justify-center rounded-xl border transition-all shrink-0 ${showMobileFilters ? 'bg-[#0F172A] border-[#0F172A] text-white shadow-md' : 'bg-white border-gray-200 text-gray-500'}`}
                                >
                                    <span className="material-icons-outlined text-[20px]">{showMobileFilters ? 'close' : 'filter_list'}</span>
                                </button>
                            </div>

                            {/* Filter Pills */}
                            <div className={`flex items-center flex-wrap gap-3 relative transition-all duration-300 ${showMobileFilters ? 'mb-4 mt-1 opacity-100' : 'max-h-0 sm:max-h-none opacity-0 sm:opacity-100 overflow-hidden sm:overflow-visible'}`}>
                                {/* Category Dropdown (Multiple Selection) */}
                                <div className="relative">
                                    <button 
                                        onClick={() => { setIsCategoryOpen(!isCategoryOpen); setIsSortOpen(false); setIsRatingOpen(false); }}
                                        className="flex items-center gap-2 bg-white border border-gray-200 text-[13px] font-semibold text-gray-700 rounded-xl px-4 py-2 sm:py-2.5 hover:border-gray-300 transition-colors shadow-sm"
                                    >
                                        {selectedCategories.length === 0 ? 'Category' : `Category (${selectedCategories.length})`}
                                        <span className="material-icons-outlined text-[16px] text-gray-500">expand_more</span>
                                    </button>
                                    {isCategoryOpen && (
                                        <div className="absolute top-full left-0 mt-2 w-[calc(100vw-2rem)] sm:w-[280px] bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-10 max-h-[350px] overflow-y-auto">
                                            {categories.map(cat => {
                                                const isAvail = availableCats.includes(cat.toLowerCase());
                                                return (
                                                    <div 
                                                        key={cat}
                                                        onClick={() => isAvail && toggleCategory(cat)}
                                                        className={`w-full flex items-center justify-between gap-3 px-5 py-2.5 transition-colors group ${isAvail ? 'hover:bg-gray-50 cursor-pointer' : 'opacity-60 cursor-not-allowed bg-gray-50'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedCategories.includes(cat) ? 'bg-[#10B981] border-[#10B981]' : isAvail ? 'border-gray-300 group-hover:border-[#34D399]' : 'border-gray-200'}`}>
                                                                {selectedCategories.includes(cat) && <span className="material-icons text-[12px] text-white font-bold">check</span>}
                                                            </div>
                                                            <span className={`text-[13px] font-bold ${selectedCategories.includes(cat) ? 'text-gray-900' : 'text-gray-600'}`}>{cat}</span>
                                                        </div>
                                                        {!isAvail && <span className="text-[10px] uppercase font-bold text-gray-400">No Providers</span>}
                                                    </div>
                                                );
                                            })}
                                            {selectedCategories.length > 0 && (
                                                <div className="px-5 pt-3 pb-1 mt-2 border-t border-gray-100">
                                                    <button onClick={() => { setSelectedCategories([]); setIsCategoryOpen(false); }} className="text-[11px] font-bold text-red-500 hover:text-red-700">Clear Selections</button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Rating Filter Dropdown */}
                                <div className="relative">
                                    <button 
                                        onClick={() => { setIsRatingOpen(!isRatingOpen); setIsCategoryOpen(false); setIsSortOpen(false); }}
                                        className="flex items-center gap-2 bg-white border border-gray-200 text-[13px] font-semibold text-gray-700 rounded-xl px-4 py-2 sm:py-2.5 hover:border-gray-300 transition-colors shadow-sm"
                                    >
                                        <span className="material-icons text-[16px] text-yellow-500">star</span>
                                        {ratingFilter}
                                        <span className="material-icons-outlined text-[16px] text-gray-500">expand_more</span>
                                    </button>
                                    {isRatingOpen && (
                                        <div className="absolute top-full left-0 mt-2 w-[160px] bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-10">
                                            {['Any Rating', '4.5+', '4.0+', '3.5+'].map(opt => (
                                                <button key={opt} onClick={() => { setRatingFilter(opt); setIsRatingOpen(false); }} className="w-full text-left px-4 py-2.5 text-[13px] font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">{opt}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Active Green Filter / Sort */}
                                <div className="relative">
                                    <button 
                                        onClick={() => { setIsSortOpen(!isSortOpen); setIsCategoryOpen(false); setIsRatingOpen(false); }}
                                        className="flex items-center gap-2 bg-[#10B981] border border-[#10B981] text-[13px] font-semibold text-white rounded-xl px-4 py-2 sm:py-2.5 hover:bg-[#059669] transition-colors shadow-sm"
                                    >
                                        {sortFilter}
                                        <span className="material-icons-outlined text-[16px] text-white">expand_more</span>
                                    </button>
                                    {isSortOpen && (
                                        <div className="absolute top-full left-0 mt-2 w-[200px] bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-10">
                                            {['Highest Rated', 'Most Jobs Done', 'Nearest'].map(opt => (
                                                <button key={opt} onClick={() => { setSortFilter(opt); setIsSortOpen(false); }} className="w-full text-left px-4 py-2.5 text-[13px] font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">{opt}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Clear All */}
                                {(selectedCategories.length > 0 || sortFilter !== 'Highest Rated' || ratingFilter !== 'Any Rating' || searchQuery !== '') && (
                                    <button 
                                        onClick={() => { setSelectedCategories([]); setSortFilter('Highest Rated'); setRatingFilter('Any Rating'); setSearchQuery(''); }}
                                        className="text-[13px] font-semibold text-gray-500 underline ml-2 hover:text-gray-900 transition-colors"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Providers List (Horizontal Rules) */}
                        <div>
                            {loading ? (
                                <div className="py-20 flex justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                </div>
                            ) : locationError ? (
                                <div className="py-20 text-center px-4">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4 text-red-500">
                                        <span className="material-icons-outlined text-3xl">location_off</span>
                                    </div>
                                    <h3 className="text-lg font-extrabold text-gray-900">Location Access Required</h3>
                                    <p className="text-[14px] font-medium text-gray-500 mt-1.5 max-w-sm mx-auto">{locationError}</p>
                                    <button 
                                        onClick={() => window.location.reload()}
                                        className="mt-6 bg-[#0F172A] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-700 transition-colors"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : providers.length === 0 ? (
                                <div className="py-20 text-center">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                                        <span className="material-icons-outlined text-gray-300 text-3xl">search_off</span>
                                    </div>
                                    <h3 className="text-lg font-extrabold text-gray-900">No nearby providers found</h3>
                                    <p className="text-[14px] font-medium text-gray-500 mt-1.5 max-w-sm mx-auto">
                                        We scan for providers within a 50km radius and none was found. Try adjusting your filters or search terms.
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col relative">
                                    {providers.slice(0, displayCount).map((provider, index) => (
                                        <div 
                                            key={provider.id} 
                                            onClick={() => navigate(`/customer/provider/${provider.id}`)}
                                            className={`py-5 flex items-center gap-4 transition-colors hover:bg-gray-50/60 px-1 rounded-xl -mx-1 cursor-pointer group ${index !== providers.length - 1 ? 'border-b border-gray-100' : ''}`}
                                        >
                                            {/* Avatar */}
                                            <img 
                                                src={provider.photoURL || provider.avatar_url || `https://ui-avatars.com/api/?name=${provider.displayName || 'Artisan'}&background=random`} 
                                                alt={provider.displayName} 
                                                className="w-11 h-11 rounded-full border border-gray-200 object-cover shrink-0" 
                                            />
                                            
                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <h3 className="text-[15px] font-bold text-gray-900 truncate group-hover:text-[#10B981] transition-colors">
                                                            {provider.displayName || provider.full_name || 'Artisan'}
                                                        </h3>
                                                        <span className="material-icons text-[#10B981] text-[15px] shrink-0" title="Verified">verified</span>
                                                    </div>
                                                    <div className="flex sm:hidden items-center gap-0.5 shrink-0">
                                                        <span className="material-icons text-yellow-500 text-[14px]">star</span>
                                                        <span className="text-[12px] font-bold text-gray-500">{provider.rating != null ? Number(provider.rating).toFixed(1) : '0.0'}</span>
                                                    </div>
                                                </div>
                                                <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5 truncate">
                                                    {(() => {
                                                        const cats = provider.trade_category && provider.trade_category.length > 0 ? provider.trade_category : (provider.category && provider.category !== 'None' ? [provider.category] : null);
                                                        if (!cats) return <span>Uncategorized</span>;
                                                        return (<>
                                                            <span className="truncate font-bold text-gray-700 capitalize">{cats[0].toLowerCase()}</span>
                                                            {cats.length > 1 && <span className="bg-[#10B981] text-white px-1.5 py-0.5 rounded-md text-[9px] font-bold shrink-0 ml-1">+{cats.length - 1}</span>}
                                                        </>);
                                                    })()}
                                                    <span className="text-gray-200">·</span>
                                                    <span className="truncate">{provider.location || 'Lagos, Nigeria'}</span>
                                                </p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <div className="flex items-center gap-1 text-[11px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                                                        <span className="material-icons-outlined text-[12px] text-gray-300">task_alt</span>
                                                        {provider.completedJobs} jobs
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Rating + Chevron */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                <div className="hidden sm:flex items-center gap-1 bg-yellow-50 px-2.5 py-1 rounded-lg border border-yellow-100">
                                                    <span className="material-icons text-yellow-500 text-[16px]">star</span>
                                                    <span className="font-bold text-[13px] text-gray-900">{provider.rating != null ? Number(provider.rating).toFixed(1) : '0.0'}</span>
                                                </div>
                                                <span className="material-icons text-[18px] text-gray-300 group-hover:text-gray-400 transition-colors shrink-0">chevron_right</span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Infinite Scroll Trigger */}
                                    <div ref={loadMoreRef} className="py-4 flex justify-center">
                                        {providers.length > displayCount && (
                                            <div className="w-5 h-5 border-2 border-gray-300 border-t-[#10B981] rounded-full animate-spin"></div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </main>
                <MobileNavBar />
            </div>
        </div>
    );
};

export default BrowseProviders;
