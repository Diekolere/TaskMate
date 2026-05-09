import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import MobileNavBar from '../../components/layout/MobileNavBar';
import { toast } from 'sonner';
import { useData } from '../../context/DataContext';

const ProviderProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { savedProviderIds, toggleSavedProvider, getProviders } = useData();
    const [activeTab, setActiveTab] = useState('About');
    const [provider, setProvider] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProvider = async () => {
            try {
                // Use the context method to fetch providers (handles simulation automatically)
                const allProviders = await getProviders('All');
                const data = allProviders.find(p => p.id === id || p.uid === id);
                
                if (data) {
                    setProvider({
                        id: data.id || data.uid,
                        name: data.displayName || data.full_name || 'Provider',
                        role: data.category || 'Service Provider',
                        verified: data.isVerified || false,
                        location: data.location_name || data.address || 'Location Hidden',
                        distance: 'Nearby', 
                        avatar: data.photoURL || data.avatar_url || `https://ui-avatars.com/api/?name=${data.displayName}&background=random`,
                        coverImage: data.banner || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop",
                        rating: data.rating || 'New',
                        reviewCount:  data.reviews?.length || 0,
                        jobsCompleted: data.jobsCompleted || 0,
                        hourlyRate: data.hourlyRate ? `₦${Number(data.hourlyRate).toLocaleString()}` : (data.hourly_rate_min ? `₦${Number(data.hourly_rate_min).toLocaleString()}` : "Negotiable"),
                        about: data.description || data.bio || "No description provided.",
                        skills: data.services ? data.services.map(s => s.name) : (data.trade_category || []), 
                        yearsOfExperience: data.years_experience || data.yearsOfExperience || 'N/A',
                        category: data.category || 'Service Provider',
                        reviews: data.reviews || [], 
                        portfolio: data.portfolio || []
                    });
                }
            } catch (error) {
                console.error("Error fetching provider details:", error);
                toast.error("Could not load provider profile.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProvider();
        }
    }, [id, getProviders]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
            </div>
        );
    }

    if (!provider) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 flex-col gap-4">
                <p className="text-gray-500">Provider not found.</p>
                <Link to="/customer/browse" className="text-green-700 font-bold hover:underline">Back to Browse</Link>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#F8F9FA] font-sans text-gray-900">
            <Sidebar />
            
            <main className="flex-1 overflow-hidden flex flex-col min-w-0">
                <div className="flex-1 overflow-y-auto pb-24 md:pb-10 relative">
                    
                    {/* Hero Banner */}
                    <div className="h-48 sm:h-72 w-full relative">
                        <img src={provider.coverImage} alt="Cover" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-90"></div>
                        
                        <div className="absolute top-6 left-6 z-10">
                            <Link to="/customer/browse" className="flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full hover:bg-white/30 transition-all border border-white/10 text-sm font-medium">
                                <span className="material-icons-outlined text-sm">arrow_back</span>
                                Back
                            </Link>
                        </div>

                        <div className="absolute top-6 right-6 z-10">
                            <button 
                                onClick={() => toggleSavedProvider(id)}
                                className="flex items-center justify-center h-10 w-10 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-all border border-white/10 active:scale-95"
                            >
                                <span className={`material-icons ${savedProviderIds.includes(id) ? 'text-red-500' : 'text-white'}`}>
                                    {savedProviderIds.includes(id) ? 'favorite' : 'favorite_border'}
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 -mt-16 sm:-mt-24 relative z-10">
                        <div className="flex flex-col lg:flex-row gap-8">
                            
                            {/* Left Column (Main Info) */}
                            <div className="flex-1 min-w-0">
                                {/* Profile Card */}
                                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-gray-200/50 p-4 sm:p-6 md:p-8 border border-white">
                                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                                        <div className="relative shrink-0">
                                            <img src={provider.avatar} alt={provider.name} className="w-20 h-20 sm:w-32 sm:h-32 rounded-xl sm:rounded-2xl object-cover shadow-lg border-4 border-white" />
                                            {provider.verified && (
                                                <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1.5 rounded-full border-4 border-white shadow-sm" title="Verified Provider">
                                                    <span className="material-icons-outlined text-sm block">verified</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0 pt-2">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div>
                                            <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{provider.name}</h1>
                                                    <p className="text-gray-500 font-medium">{provider.role}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-gray-900">{provider.rating}</div>
                                                        <div className="text-xs text-gray-400 font-medium">Rating</div>
                                                    </div>
                                                    <div className="w-px h-8 bg-gray-200"></div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-gray-900">{provider.jobsCompleted}</div>
                                                        <div className="text-xs text-gray-400 font-medium">Jobs</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 sm:gap-4 mt-4 sm:mt-6 text-[12px] sm:text-sm text-gray-500 flex-wrap">
                                                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
                                                    <span className="material-icons-outlined text-gray-400 text-lg">location_on</span>
                                                    {provider.location}
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
                                                    <span className="material-icons-outlined text-gray-400 text-lg">near_me</span>
                                                    {provider.distance}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tabs */}
                                    <div className="flex items-center gap-4 sm:gap-8 mt-6 sm:mt-10 border-b border-gray-100 overflow-x-auto no-scrollbar">
                                        {['About', 'Reviews', 'Portfolio'].map((tab) => (
                                            <button 
                                                key={tab}
                                                onClick={() => setActiveTab(tab)}
                                                className={`pb-4 text-sm font-bold border-b-2 transition-all ${
                                                    activeTab === tab 
                                                    ? 'border-green-700 text-green-700' 
                                                    : 'border-transparent text-gray-400 hover:text-gray-600'
                                                }`}
                                            >
                                                {tab}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="mt-8">
                                        {activeTab === 'About' && (
                                            <div className="space-y-8 animate-fade-in">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 mb-3">Biography</h3>
                                                    <p className="text-gray-600 leading-relaxed">{provider.about}</p>
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 mb-3">Skills & Expertise</h3>
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {provider.skills.map((skill, idx) => (
                                                            <span key={idx} className="px-4 py-2 bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold border border-gray-100">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Occupation</span>
                                                            <span className="block font-bold text-gray-900">{provider.category}</span>
                                                        </div>
                                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Experience</span>
                                                            <span className="block font-bold text-gray-900">{provider.yearsOfExperience} Years</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'Reviews' && (
                                            <div className="space-y-4 animate-fade-in">
                                                {provider.reviews.length > 0 ? (
                                                    provider.reviews.map((review, idx) => (
                                                        <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-2">
                                                                     <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold border border-green-200">
                                                                         {review.user ? review.user.charAt(0).toUpperCase() : 'C'}
                                                                     </div>
                                                                     <div className="font-bold text-gray-900">{review.user || 'Customer'}</div>
                                                                </div>
                                                                <span className="text-xs text-gray-400">{review.date || 'Recent'}</span>
                                                            </div>
                                                            <div className="flex items-center mb-2 text-yellow-500">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <span key={i} className={`material-icons-outlined text-sm ${i < (review.rating || 0) ? 'text-yellow-500' : 'text-gray-300'}`}>star</span>
                                                                ))}
                                                            </div>
                                                            <p className="text-gray-600 text-sm mb-2">{review.text || review.comment}</p>
                                                            {review.tags && review.tags.length > 0 && (
                                                                <div className="flex flex-wrap gap-2 text-xs">
                                                                    {review.tags.map((tag, i) => (
                                                                        <span key={i} className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-gray-500">{tag}</span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-8 text-gray-400">
                                                        <span className="material-icons-outlined text-4xl mb-2">rate_review</span>
                                                        <p>No reviews yet.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === 'Portfolio' && (
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-in">
                                                {provider.portfolio.map((img, idx) => (
                                                    <img key={idx} src={img} alt="Work" className="rounded-xl w-full h-40 object-cover hover:scale-[1.02] transition-transform cursor-pointer shadow-sm" />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column (Booking Request) */}
                            <div className="lg:w-96 shrink-0 space-y-6">
                                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 border border-white sticky top-6">
                                    <div className="flex items-baseline justify-between mb-6">
                                        <h3 className="text-lg font-bold text-gray-900">Booking Rate</h3>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-gray-900">{provider.hourlyRate}</span>
                                            <span className="text-sm text-gray-500 font-medium">/ hour</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <button 
                                            onClick={() => navigate('/customer/post-request', { state: { providerId: id, providerName: provider.name, category: provider.category } })}
                                            className="w-full py-4 bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-700/20 hover:bg-green-800 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                        >
                                            Request Service
                                            <span className="material-icons-outlined">arrow_forward</span>
                                        </button>
                                        <button 
                                            onClick={() => toast.info('Messaging feature coming soon!')}
                                            className="w-full py-4 bg-white text-gray-900 font-bold rounded-xl border-2 border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="material-icons-outlined">chat_bubble_outline</span>
                                            Message Provider
                                        </button>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-gray-100">
                                        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
                                            <span className="material-icons-outlined text-green-700 text-base">security</span>
                                            Secure payments & buyer protection
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
                <MobileNavBar />
            </main>
        </div>
    );
};

export default ProviderProfile;
