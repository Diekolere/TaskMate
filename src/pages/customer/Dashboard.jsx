import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import TopNavbar from '../../components/layout/TopNavbar';
import MobileNavBar from '../../components/layout/MobileNavBar';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useLocationHeartbeat } from '../../hooks/useLocationHeartbeat';
import { formatDistanceToNow } from 'date-fns';

const Dashboard = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { getAllServicePosts, getProviders } = useData();

    // Track customer location for optimal proximity matching
    useLocationHeartbeat();

    // Custom Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState('Category');
    const [sortFilter, setSortFilter] = useState('Relevance');
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [recommendedArtisans, setRecommendedArtisans] = useState([]);
    const [imageIndexes, setImageIndexes] = useState({});
    const [likedPosts, setLikedPosts] = useState({});
    const [openMenu, setOpenMenu] = useState(null);
    const [lastTapTime, setLastTapTime] = useState({});
    const [expandedPosts, setExpandedPosts] = useState({});
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    React.useEffect(() => {
        const loadFeed = async () => {
            setLoading(true);
            const data = await getAllServicePosts(categoryFilter === 'Category' ? null : categoryFilter);
            setPosts(data);

            // Also load some recommended providers
            const providers = await getProviders();
            setRecommendedArtisans(providers.slice(0, 3));
            setLoading(false);
        };
        loadFeed();
    }, [categoryFilter, getAllServicePosts, getProviders]);

    const filteredPosts = posts.filter(post => {
        if (!searchQuery) return true;
        const s = searchQuery.toLowerCase();
        return (
            post.caption?.toLowerCase().includes(s) ||
            post.profiles?.full_name?.toLowerCase().includes(s) ||
            post.category?.toLowerCase().includes(s)
        );
    });

    return (
        <div className="flex min-h-screen bg-white font-sans text-gray-900">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <TopNavbar breadcrumbs={['Customer', 'Feed']} />

                {/* Main Content Area */}
                <main className="relative z-0 flex-1 overflow-y-auto bg-white">
                    <div className="max-w-[1200px] mx-auto w-full px-0 sm:px-8 py-0 sm:py-10 pb-24 md:pb-10 flex flex-col xl:flex-row gap-0 xl:gap-12">

                        {/* Feed Column */}
                        <div className="flex-1 max-w-[580px]">
                            {/* Header & Search Area - Hidden on Mobile */}
                            <div className="hidden sm:block mb-10 px-0 pt-0">
                                <h1 className="text-[32px] font-extrabold tracking-tight text-gray-900 mb-6">Discovery Feed</h1>

                                {/* Search Bar + Filter Toggle */}
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="flex-1 flex items-center bg-white rounded-xl px-4 py-3.5 border border-gray-200 group focus-within:border-gray-400 focus-within:shadow-sm transition-all cursor-text w-full">
                                        <span className="material-icons-outlined text-[18px] text-gray-400 group-focus-within:text-gray-600">search</span>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="bg-transparent border-none outline-none text-[15px] text-gray-800 ml-3 w-full placeholder:text-gray-400 font-medium"
                                            placeholder="Search for artisans, updates, or keywords..."
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
                                <div className="flex items-center flex-wrap gap-3 relative">
                                    {/* Category Filter */}
                                    <div className="relative">
                                        <button
                                            onClick={() => { setIsCategoryOpen(!isCategoryOpen); setIsSortOpen(false); }}
                                            className="flex items-center gap-2 bg-white border border-gray-200 text-[13px] font-semibold text-gray-700 rounded-xl px-4 py-2.5 hover:border-gray-300 transition-colors shadow-sm"
                                        >
                                            {categoryFilter}
                                            <span className="material-icons-outlined text-[16px] text-gray-500">expand_more</span>
                                        </button>
                                        {isCategoryOpen && (
                                            <div className="absolute top-full left-0 mt-2 w-[200px] bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-10">
                                                {['All Categories', 'Electrical', 'Plumbing', 'Carpentry', 'Cleaning'].map(opt => (
                                                    <button key={opt} onClick={() => { setCategoryFilter(opt); setIsCategoryOpen(false); }} className="w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50">{opt}</button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Active Green Sort/View Filter */}
                                    <div className="relative">
                                        <button
                                            onClick={() => { setIsSortOpen(!isSortOpen); setIsCategoryOpen(false); }}
                                            className="flex items-center gap-2 bg-[#10B981] border border-[#10B981] text-[13px] font-semibold text-white rounded-xl px-4 py-2.5 hover:bg-[#059669] transition-colors shadow-sm"
                                        >
                                            {sortFilter}
                                            <span className="material-icons-outlined text-[16px] text-white">expand_more</span>
                                        </button>
                                        {isSortOpen && (
                                            <div className="absolute top-full left-0 mt-2 w-[180px] bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-10">
                                                {['Relevance', 'Following', 'Near You'].map(opt => (
                                                    <button key={opt} onClick={() => { setSortFilter(opt); setIsSortOpen(false); }} className="w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50">{opt}</button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Clear All */}
                                    {(categoryFilter !== 'Category' || sortFilter !== 'Relevance' || searchQuery !== '') && (
                                        <button
                                            onClick={() => { setCategoryFilter('Category'); setSortFilter('Relevance'); setSearchQuery(''); }}
                                            className="text-[13px] font-semibold text-gray-500 underline ml-2 hover:text-gray-900 transition-colors"
                                        >
                                            Clear all
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Feed Posts */}
                            <div className="space-y-0 sm:space-y-8">
                                {loading ? (
                                    <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#10B981] mb-4"></div>
                                        <p className="text-sm font-medium">Fetching the latest updates...</p>
                                    </div>
                                ) : filteredPosts.length === 0 ? (
                                    <div className="py-20 text-center">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                                            <span className="material-icons-outlined text-gray-300 text-3xl">rss_feed</span>
                                        </div>
                                        <h3 className="text-lg font-extrabold text-gray-900">No updates yet</h3>
                                        <p className="text-[14px] font-medium text-gray-500 mt-1.5">Check back later for new artisan updates in {categoryFilter === 'Category' ? 'all categories' : categoryFilter}.</p>
                                    </div>
                                ) : (
                                    filteredPosts.map(post => {
                                        const currentImageIndex = imageIndexes[post.id] || 0;
                                        const images = post.images || [];
                                        const hasMultipleImages = images.length > 1;

                                        const goToPreviousImage = (e) => {
                                            e.stopPropagation();
                                            setImageIndexes(prev => ({
                                                ...prev,
                                                [post.id]: (currentImageIndex - 1 + images.length) % images.length
                                            }));
                                        };

                                        const goToNextImage = (e) => {
                                            e.stopPropagation();
                                            setImageIndexes(prev => ({
                                                ...prev,
                                                [post.id]: (currentImageIndex + 1) % images.length
                                            }));
                                        };

                                        const handleDoubleTap = () => {
                                            const now = Date.now();
                                            const lastTap = lastTapTime[post.id] || 0;

                                            if (now - lastTap < 300) {
                                                // Double tap detected - set to liked
                                                setLikedPosts(prev => ({ ...prev, [post.id]: true }));
                                            }
                                            setLastTapTime(prev => ({ ...prev, [post.id]: now }));
                                        };

                                        const handleLikeClick = () => {
                                            const isCurrentlyLiked = likedPosts[post.id];
                                            setLikedPosts(prev => ({ ...prev, [post.id]: !isCurrentlyLiked }));
                                        };

                                        const currentLikeCount = (post.likes_count || 0) + (likedPosts[post.id] ? 1 : 0);

                                        return (
                                            <div key={post.id} className="bg-white border-y sm:border border-gray-100 sm:border-gray-200 sm:rounded-xl overflow-hidden sm:hover:border-gray-300 transition-all">
                                                {/* Post Header */}
                                                <div className="py-2.5 px-3 sm:py-3 sm:px-4 flex items-start justify-between gap-2">
                                                    <div className="flex gap-2 sm:gap-3 items-center cursor-pointer group min-w-0" onClick={() => navigate(`/customer/provider/${post.provider_id}`)}>
                                                        <div className="relative shrink-0">
                                                            <img src={post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${post.profiles?.full_name}&background=random`} alt={post.profiles?.full_name} className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-gray-200 group-hover:border-gray-300 transition-colors" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h3 className="font-bold text-[13px] sm:text-[14px] text-gray-900 group-hover:underline truncate">{post.profiles?.full_name}</h3>
                                                            <p className="text-[11px] text-gray-500 font-medium">
                                                                {post.category} • {formatDistanceToNow(new Date(post.created_at))} ago
                                                                {post.profiles?.location_name && ` • ${post.profiles.location_name}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="relative">
                                                        <button onClick={() => setOpenMenu(openMenu === post.id ? null : post.id)} className="text-gray-400 hover:text-gray-900 transition-colors p-1 shrink-0">
                                                            <span className="material-icons-outlined text-[18px]">more_horiz</span>
                                                        </button>
                                                        {openMenu === post.id && (
                                                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-max">
                                                                <button className="block w-full text-left px-4 py-2.5 text-[13px] font-medium text-gray-900 hover:bg-gray-50 border-b border-gray-100">
                                                                    <span className="material-icons-outlined text-[16px] align-middle mr-2">report</span>
                                                                    Report Post
                                                                </button>
                                                                <button className="block w-full text-left px-4 py-2.5 text-[13px] font-medium text-gray-900 hover:bg-gray-50">
                                                                    <span className="material-icons-outlined text-[16px] align-middle mr-2">bookmark_border</span>
                                                                    Save Post
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Post Caption & Info (Above Image) */}
                                                <div className="px-3 sm:px-4 pb-2">
                                                    <p className="text-[13px] sm:text-[14px] text-gray-900 leading-snug">
                                                        <span className="text-gray-800">
                                                            {post.caption?.length > 120 && !expandedPosts[post.id] 
                                                                ? `${post.caption.slice(0, 120)}...` 
                                                                : post.caption}
                                                        </span>
                                                        {post.caption?.length > 120 && (
                                                            <button 
                                                                onClick={() => setExpandedPosts(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                                                                className="text-gray-500 font-bold ml-1 hover:text-gray-700 transition-colors"
                                                            >
                                                                {expandedPosts[post.id] ? 'view less' : 'more'}
                                                            </button>
                                                        )}
                                                    </p>

                                                    {/* Tags */}
                                                    {post.tags && post.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                                            {post.tags.map(tag => (
                                                                <span key={tag} className="text-[11px] sm:text-xs font-semibold text-blue-600 hover:text-blue-700">#{tag}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Image Carousel */}
                                                <div className="relative bg-gray-50">
                                                    {images.length > 0 ? (
                                                        <>
                                                            <div className="w-full aspect-[4/3] overflow-hidden relative cursor-pointer" onClick={handleDoubleTap}>
                                                                <img src={images[currentImageIndex]} alt="Post media" className="w-full h-full object-cover" />

                                                                {/* Navigation Arrows */}
                                                                {hasMultipleImages && (
                                                                    <>
                                                                        <button
                                                                            onClick={goToPreviousImage}
                                                                            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 sm:p-2 transition-all"
                                                                        >
                                                                            <span className="material-icons-outlined text-[18px] sm:text-[20px]">chevron_left</span>
                                                                        </button>
                                                                        <button
                                                                            onClick={goToNextImage}
                                                                            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 sm:p-2 transition-all"
                                                                        >
                                                                            <span className="material-icons-outlined text-[18px] sm:text-[20px]">chevron_right</span>
                                                                        </button>
                                                                    </>
                                                                )}

                                                                {/* Carousel Dots */}
                                                                {hasMultipleImages && (
                                                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 items-center bg-black/40 px-2 py-1.5 rounded-full">
                                                                        {images.map((_, idx) => (
                                                                            <button
                                                                                key={idx}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setImageIndexes(prev => ({ ...prev, [post.id]: idx }));
                                                                                }}
                                                                                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-4 sm:w-5' : 'bg-white/50 hover:bg-white/75'
                                                                                    }`}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="w-full aspect-[4/3] flex items-center justify-center">
                                                            <span className="material-icons-outlined text-gray-300 text-5xl">image_not_supported</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Engagement Stats - Like Icon & Count */}
                                                <div className="px-4 sm:px-5 py-3 sm:py-4 flex items-center gap-3.5 border-b border-gray-100">
                                                    <button
                                                        onClick={handleLikeClick}
                                                        className="text-gray-600 hover:text-red-600 transition-colors flex items-center"
                                                        title="Like"
                                                    >
                                                        <span className="material-icons text-[24px] sm:text-[28px]" style={{ color: likedPosts[post.id] ? '#ef4444' : 'currentColor' }}>
                                                            {likedPosts[post.id] ? 'favorite' : 'favorite_border'}
                                                        </span>
                                                    </button>
                                                    <span className="text-[14px] sm:text-[15px] font-black text-gray-900">
                                                        {currentLikeCount} like{currentLikeCount !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Right Sidebar - Recommended (Hidden on Mobile) */}
                        <div className="hidden xl:block w-full xl:w-[350px] shrink-0">
                            {/* Need a Pro Card */}
                            <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#020617] rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-6 sm:mb-8 shadow-lg relative overflow-hidden group">
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                                <h2 className="text-[22px] sm:text-[28px] font-black text-white mb-3 sm:mb-4 tracking-tight">Need a Pro?</h2>
                                <p className="text-gray-300 text-sm leading-relaxed mb-8 font-medium">Describe your task and let our verified professionals send you their best offers.</p>
                                <button
                                    onClick={() => navigate('/customer/post-request')}
                                    className="w-full py-4 bg-white text-[#0F172A] rounded-2xl font-black text-[15px] hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-xl active:scale-[0.98]"
                                >
                                    Post Request Now
                                    <span className="material-icons-outlined text-[18px]">arrow_forward</span>
                                </button>
                            </div>

                            {/* Recommended Artisans */}
                            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-[13px] font-black text-gray-400 uppercase tracking-widest">Recommended</h2>
                                    <span className="material-icons-outlined text-gray-300 text-[18px]">verified_user</span>
                                </div>
                                <div className="space-y-8">
                                    {recommendedArtisans.map((artisan, idx) => (
                                        <div key={idx} className="flex items-center justify-between group cursor-pointer" onClick={() => navigate(`/customer/provider/${artisan.id}`)}>
                                            <div className="flex items-center gap-4 min-w-0">
                                                <img 
                                                    src={artisan.photoURL || artisan.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(artisan.displayName || artisan.name || 'Provider')}&background=random`}
                                                    alt={artisan.displayName || artisan.name}
                                                    className="w-11 h-11 rounded-full object-cover border border-gray-200 shadow-sm group-hover:border-[#10B981] transition-colors shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <h3 className="font-extrabold text-[15px] text-gray-900 group-hover:text-[#10B981] transition-colors truncate">{artisan.displayName || artisan.name || 'Provider'}</h3>
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        {(() => {
                                                            const cats = artisan.trade_category && artisan.trade_category.length > 0 ? artisan.trade_category : (artisan.category && artisan.category !== 'None' ? [artisan.category] : null);
                                                            if (!cats) return <span className="bg-[#0F172A] text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">None</span>;
                                                            return (<>
                                                                <span className="bg-[#0F172A] text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider truncate max-w-[120px]">{cats[0]}</span>
                                                                {cats.length > 1 && <span className="bg-[#10B981] text-white px-1.5 py-0.5 rounded-full text-[9px] font-bold shrink-0">+{cats.length - 1}</span>}
                                                            </>);
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0 ml-2">
                                                <div className="flex items-center gap-1 justify-end">
                                                    <span className="material-icons text-yellow-500 text-[16px]">star</span>
                                                    <span className="text-[13px] font-black text-gray-900">{artisan.rating != null ? Number(artisan.rating).toFixed(1) : '0.0'}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-md border border-gray-100 mt-1 justify-end">
                                                    <span className="material-icons-outlined text-[11px] text-gray-300">task_alt</span>
                                                    {artisan.completed_jobs || 0} jobs
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => navigate('/customer/browse')} className="w-full mt-10 py-3 bg-gray-50 text-gray-600 rounded-xl font-bold text-[13px] hover:bg-gray-100 hover:text-gray-900 transition-all border border-gray-100">
                                    Browse All Listings
                                </button>
                            </div>

                            {/* Organized Navigatables Footer */}
                            <div className="mt-12 px-2">
                                <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-8">
                                    <a href="#" className="text-[11px] font-black text-gray-400 hover:text-[#10B981] transition-colors uppercase tracking-widest">About TaskMate</a>
                                    <a href="#" className="text-[11px] font-black text-gray-400 hover:text-[#10B981] transition-colors uppercase tracking-widest">Help Center</a>
                                    <a href="#" className="text-[11px] font-black text-gray-400 hover:text-[#10B981] transition-colors uppercase tracking-widest">Privacy & Terms</a>
                                    <a href="#" className="text-[11px] font-black text-gray-400 hover:text-[#10B981] transition-colors uppercase tracking-widest">Trust & Safety</a>
                                </div>
                                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">© 2026 TaskMate Inc.</p>
                                    <div className="flex gap-3">
                                        <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-gray-300 hover:text-[#10B981] cursor-pointer transition-colors">
                                            <span className="material-icons text-[14px]">facebook</span>
                                        </div>
                                        <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-gray-300 hover:text-[#10B981] cursor-pointer transition-colors">
                                            <span className="material-icons text-[14px]">X</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
                <MobileNavBar />
            </div>
        </div>
    );
};

export default Dashboard;
