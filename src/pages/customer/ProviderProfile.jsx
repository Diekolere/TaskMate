import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

import Sidebar from '../../components/layout/Sidebar';
import MobileNavBar from '../../components/layout/MobileNavBar';
import TopNavbar from '../../components/layout/TopNavbar';
import { supabase } from '../../lib/supabase';
import { useProvider } from '../../context/ProviderContext';

const ProviderProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { savedProviderIds, toggleSavedProvider, getProviders, getServicePosts } = useProvider();
    const [activeTab, setActiveTab] = useState('details');
    const [expandedPost, setExpandedPost] = useState(null);
    const [provider, setProvider] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProvider = async () => {
            try {
                const allProviders = await getProviders('All');
                const data = allProviders.find(p => p.id === id || p.uid === id);
                
                if (data) {
                    const firstService = (data.services && data.services[0]?.name) || (data.category !== 'None' ? data.category : null) || 'Professional';
                    const years = data.provider_profiles?.years_experience ?? data.jobsCompleted ?? 0;
                    const fallbackTagline = `${firstService} • ${years}+ years exp.`;

                    setProvider({
                        id: data.id || data.uid,
                        name: data.displayName || data.full_name || 'Provider',
                        email: data.email || '',
                        phone: data.phoneNumber || data.phone_number || '',
                        role: data.category || 'None',
                        verified: data.isVerified || false,
                        location: data.location_name || data.address || 'Location Hidden',
                        distance: 'Nearby', 
                        avatar: data.photoURL || data.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.displayName || 'Provider')}&background=f0fdf4&color=15803d&size=200`,
                        banner: data.banner || null,
                        tagline: (data.tagline && String(data.tagline).trim()) || fallbackTagline,
                        rating: data.rating ?? null,
                        reviewCount: Array.isArray(data.reviews) ? data.reviews.length : 0,
                        jobsCompleted: data.jobsCompleted || 0,
                        successRate: data.successRate || 96,
                        memberSince: data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'long' }) : '—',
                        hourlyRate: data.hourlyRate ? `₦${Number(data.hourlyRate).toLocaleString()}` : (data.hourly_rate_min ? `₦${Number(data.hourly_rate_min).toLocaleString()}` : "Negotiable"),
                        bio: data.description || data.bio || "No bio provided.",
                        skills: data.skills || (data.services ? data.services.map(s => s.name) : (data.trade_category || [])),
                        yearsOfExperience: data.years_experience || data.yearsOfExperience || 'N/A',
                        category: data.category || 'None',
                        reviews: data.reviews || [], 
                        servicePosts: [] // Will be fetched separately
                    });

                    getServicePosts(data.id || data.uid).then(posts => {
                        setProvider(prev => ({
                            ...prev,
                            servicePosts: posts.map(p => ({
                                ...p,
                                title: p.category || 'Service Post',
                                description: p.caption,
                                image: p.images?.[0] || '',
                                createdAt: p.created_at
                            }))
                        }));
                    });

                    // Fetch reviews
                    supabase
                        .from('reviews')
                        .select('*, reviewer:profiles!reviewer_id(full_name, avatar_url)')
                        .eq('provider_id', data.id || data.uid)
                        .order('created_at', { ascending: false })
                        .then(({ data: liveReviews }) => {
                            if (liveReviews) {
                                setProvider(prev => ({ ...prev, reviews: liveReviews, reviewCount: liveReviews.length }));
                            }
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

    useEffect(() => {
        if (!expandedPost) return;
        const onKey = (e) => {
            if (e.key === 'Escape') setExpandedPost(null);
        };
        window.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [expandedPost]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#10B981]"></div>
            </div>
        );
    }

    if (!provider) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white flex-col gap-4 font-sans">
                <p className="text-gray-500">Provider not found.</p>
                <button onClick={() => navigate('/customer/browse')} className="text-[#10B981] font-bold hover:underline">Back to Browse</button>
            </div>
        );
    }

    const tabs = [
        { id: 'details', label: 'Details' },
        { id: 'services', label: 'Service posts' },
        { id: 'reviews', label: `Reviews${provider.reviewCount > 0 ? ` (${provider.reviewCount})` : ''}` },
    ];

    const postMetaTime = (post) => {
        if (!post?.createdAt) return 'Recently';
        try {
            return new Date(post.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return 'Recently';
        }
    };

    return (
        <div className="flex min-h-screen bg-white font-sans text-gray-900">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopNavbar breadcrumbs={['Customer', 'Provider Profile']} />

                <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
                    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
                        <div className="max-w-4xl mx-auto space-y-6">
                            
                            <div className="space-y-5">
                                {/* Banner */}
                                <div className="relative h-32 sm:h-40 rounded-2xl overflow-hidden bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200">
                                    {provider.banner && (
                                        <img 
                                            src={provider.banner} 
                                            alt="Cover" 
                                            className="absolute inset-0 w-full h-full object-cover" 
                                            onError={e => { e.target.style.display = 'none'; }}
                                        />
                                    )}
                                    <div className="absolute top-4 right-4 z-10">
                                        <button 
                                            onClick={() => toggleSavedProvider(id)}
                                            className="flex items-center justify-center h-10 w-10 bg-white/50 backdrop-blur-md rounded-full hover:bg-white/80 transition-all border border-white/20 active:scale-95 shadow-sm"
                                        >
                                            <span className={`material-icons ${savedProviderIds.includes(id) ? 'text-red-500' : 'text-gray-700'}`}>
                                                {savedProviderIds.includes(id) ? 'favorite' : 'favorite_border'}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* Avatar & Info */}
                                <div className="space-y-5 px-0">
                                    <div className="flex flex-col items-center relative group -mt-14 sm:-mt-16">
                                        <div className="relative">
                                            <img
                                                src={provider.avatar}
                                                alt={provider.name} 
                                                className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover bg-white relative z-10"
                                                onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.name)}&background=f0fdf4&color=15803d&size=200`; }}
                                            />
                                            {provider.verified && (
                                                <div className="absolute bottom-1 right-1 bg-blue-500 text-white p-1 rounded-full border-[3px] border-white shadow-sm z-20" title="Verified Provider">
                                                    <span className="material-icons-outlined text-sm block">verified</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <h2 className="text-2xl font-bold text-gray-900">{provider.name}</h2>
                                        <p className="text-sm text-[#10B981] font-semibold mt-1 px-2">
                                            {provider.tagline}
                                        </p>
                                        <div className="flex items-center justify-center gap-3 mt-3 text-[13px] text-gray-500">
                                            <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-full font-medium">
                                                <span className="material-icons-outlined text-gray-400 text-base">location_on</span>
                                                {provider.location}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 max-w-lg mx-auto">
                                        <div className="text-center p-2.5 bg-white rounded-lg">
                                            <p className="text-lg font-bold text-gray-900">{provider.rating != null ? parseFloat(provider.rating).toFixed(1) : '0.0'}</p>
                                            <p className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Rating</p>
                                        </div>
                                        <div className="text-center p-2.5 bg-white rounded-lg">
                                            <p className="text-lg font-bold text-gray-900">{provider.jobsCompleted}</p>
                                            <p className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Tasks</p>
                                        </div>
                                        <div className="text-center p-2.5 bg-white rounded-lg">
                                            <p className="text-lg font-bold text-gray-900">{provider.successRate}%</p>
                                            <p className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Success</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-2 mb-8">
                                <button
                                    onClick={() => navigate('/customer/post-request', { state: { providerId: id, providerName: provider.name, category: provider.category } })}
                                    className="w-full py-3.5 bg-[#10B981] text-white font-bold rounded-xl hover:bg-[#059669] transition-all flex items-center justify-center gap-2 shadow-sm shadow-[#10B981]/20"
                                >
                                    Request Service
                                    <span className="material-icons-outlined text-[18px]">arrow_forward</span>
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="space-y-6">
                                <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-hide whitespace-nowrap">
                                    {tabs.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`px-6 py-3 text-sm font-semibold transition-all whitespace-nowrap border-b-2 -mb-px ${activeTab === tab.id
                                                ? 'border-[#10B981] text-[#10B981]'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content */}
                                {activeTab === 'details' && (
                                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                                        <div>
                                            <h4 className="font-bold text-gray-900 uppercase tracking-wide text-xs mb-3">About</h4>
                                            <p className="text-xs text-gray-600 leading-relaxed">
                                                {provider.bio || 'No bio provided yet.'}
                                            </p>
                                        </div>

                                        <div className="border-t border-gray-100 pt-5">
                                            <h4 className="font-bold text-gray-900 uppercase tracking-wide text-xs mb-3">Specialties</h4>
                                            {provider.skills && provider.skills.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {provider.skills.map((skill, idx) => (
                                                        <div key={idx} className="px-3 py-1 bg-[#10B981]/10 text-[#10B981] rounded-full text-xs font-semibold border border-[#10B981]/20 flex items-center gap-2">
                                                            {skill}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-500">No specialties listed.</p>
                                            )}
                                        </div>

                                        <div className="border-t border-gray-100 pt-5 space-y-3">
                                            <div>
                                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Email</p>
                                                <p className="text-xs text-gray-700">{provider.email || '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Phone</p>
                                                <p className="text-xs text-gray-700">{provider.phone || '—'}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'services' && (
                                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                        {provider.servicePosts && provider.servicePosts.length > 0 ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                                                {provider.servicePosts.map((post, idx) => (
                                                    <div key={post.id ?? idx} className="relative w-full aspect-[3/4]">
                                                        <div className="absolute inset-0 rounded-xl sm:rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                                                            {post.image ? (
                                                                <img
                                                                    src={post.image}
                                                                    alt=""
                                                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                                                />
                                                            ) : (
                                                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 bg-gradient-to-b from-slate-100 to-slate-200">
                                                                    <span className="material-icons-outlined text-3xl text-gray-400" aria-hidden>image</span>
                                                                    <span className="text-[11px] font-semibold text-gray-500 text-center line-clamp-2">{post.title || 'Post'}</span>
                                                                </div>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => setExpandedPost(post)}
                                                                className="absolute inset-0 z-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#10B981]"
                                                                aria-label={`Open post details`}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                                                <span className="material-icons-outlined text-3xl text-gray-200">work</span>
                                                <p className="text-sm text-gray-400 mt-2">No service posts available.</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {activeTab === 'reviews' && (
                                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                        {provider.reviews && provider.reviews.length > 0 ? (
                                            provider.reviews.map((review, idx) => (
                                                <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981] font-bold text-sm border border-[#10B981]/10 overflow-hidden shrink-0">
                                                                {review.reviewer?.avatar_url ? (
                                                                    <img src={review.reviewer.avatar_url} alt="Reviewer" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    (review.reviewer?.full_name || review.user || 'C').charAt(0).toUpperCase()
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-900 text-sm">{review.reviewer?.full_name || review.user || 'Customer'}</p>
                                                                <p className="text-xs text-gray-400">{review.date || (review.created_at && new Date(review.created_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })) || 'Recent'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex">
                                                            {[...Array(5)].map((_, i) => (
                                                                <span key={i} className={`material-icons-outlined text-sm ${i < (review.rating || 0) ? 'text-amber-400' : 'text-gray-200'}`}>star</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-600 leading-relaxed mb-3">{review.comment || review.text}</p>
                                                    {review.tags && review.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {review.tags.map((tag, i) => (
                                                                <span key={i} className="px-2 py-1 bg-gray-50 border border-gray-100 rounded-md text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                                                <span className="material-icons-outlined text-3xl text-gray-200">reviews</span>
                                                <p className="text-sm text-gray-400 mt-2">No reviews yet.</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
                <MobileNavBar />

                {/* Expanded post modal */}
                {expandedPost && (
                    <div
                        className="fixed inset-0 z-[150] overflow-y-auto overscroll-contain bg-black/50"
                        onClick={() => setExpandedPost(null)}
                        role="presentation"
                    >
                        <div
                            className="min-h-[100dvh] w-full flex items-center justify-center p-3 sm:p-6"
                            role="presentation"
                        >
                            <div
                                className="bg-white border border-gray-200 rounded-2xl sm:rounded-[20px] shadow-xl w-full max-w-lg sm:max-w-xl my-4 sm:my-0 flex flex-col overflow-visible"
                                onClick={e => e.stopPropagation()}
                                role="dialog"
                                aria-modal="true"
                            >
                                <div className="p-4 sm:p-6 flex items-start justify-between gap-2 border-b border-gray-50">
                                    <div className="flex gap-3 sm:gap-4 items-center min-w-0 flex-1">
                                        <div className="relative shrink-0">
                                            <img src={provider.avatar} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-100" />
                                            {provider.verified && (
                                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                                                    <span className="material-icons text-blue-500 text-[12px] sm:text-[14px]">verified</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-extrabold text-[14px] sm:text-[15px] text-gray-900 tracking-wide truncate">
                                                {provider.name}
                                            </h3>
                                            <div className="flex items-center flex-wrap gap-x-1 text-[11px] sm:text-[12px] text-gray-500 font-medium mt-0.5">
                                                <span>{expandedPost.category || provider.category}</span>
                                                <span className="text-gray-300">•</span>
                                                <span className="inline-flex items-center max-w-[10rem] sm:max-w-none truncate">
                                                    <span className="material-icons-outlined text-[14px] mr-0.5 shrink-0">location_on</span>
                                                    {expandedPost.location || provider.location || '—'}
                                                </span>
                                                <span className="text-gray-300">•</span>
                                                <span>{postMetaTime(expandedPost)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setExpandedPost(null)}
                                        className="text-gray-400 hover:text-gray-900 p-1.5 sm:p-2 rounded-full hover:bg-gray-50 shrink-0"
                                    >
                                        <span className="material-icons-outlined text-[20px]">close</span>
                                    </button>
                                </div>

                                <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-4">
                                    <p className="text-[14px] sm:text-[15px] text-gray-800 leading-relaxed font-medium mb-3 sm:mb-4">
                                        {expandedPost.description || expandedPost.title || 'No description.'}
                                    </p>
                                    {expandedPost.image && (
                                        <div className="w-full h-48 sm:h-64 md:h-72 rounded-xl sm:rounded-2xl overflow-hidden mb-3 sm:mb-4 border border-gray-100 bg-gray-50">
                                            <img src={expandedPost.image} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    {Array.isArray(expandedPost.tags) && expandedPost.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                                            {expandedPost.tags.map(tag => (
                                                <span
                                                    key={tag}
                                                    className="text-[10px] sm:text-xs font-bold text-blue-700 bg-blue-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg border border-blue-100/50 tracking-wide"
                                                >
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-t border-gray-100 shrink-0">
                                    <div className="flex gap-4 sm:gap-6">
                                        <span className="flex items-center gap-1.5 sm:gap-2 text-gray-500">
                                            <span className="material-icons-outlined text-[20px] sm:text-[22px]">favorite_border</span>
                                            <span className="text-[13px] sm:text-sm font-bold">{expandedPost.likes ?? 0}</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center gap-1 text-amber-500 text-[13px] sm:text-sm font-bold">
                                            <span className="material-icons text-base sm:text-lg">star</span>
                                            {parseFloat(expandedPost.rating ?? provider.rating ?? 0).toFixed(1)}
                                            <span className="text-gray-500 font-semibold">({expandedPost.reviews ?? 0})</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProviderProfile;

