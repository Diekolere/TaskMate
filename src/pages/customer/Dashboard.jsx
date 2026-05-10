import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import TopNavbar from '../../components/layout/TopNavbar';
import MobileNavBar from '../../components/layout/MobileNavBar';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    
    // Custom Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState('Category');
    const [sortFilter, setSortFilter] = useState('Relevance');

    // Mock Feed Data (Artisan Updates)
    const feedPosts = [
        {
            id: 1,
            artisan: { name: 'David O.', category: 'Electrical', location: 'Victoria Island, Lagos', avatar: 'https://ui-avatars.com/api/?name=David+O&background=random' },
            time: '2 hours ago',
            content: 'Just completed a full smart-home rewiring project. Installed automated lighting and security systems. Everything is running perfectly and energy efficient! ⚡🏡',
            image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=2070&auto=format&fit=crop',
            likes: 24,
            tags: ['Smart Home', 'Rewiring']
        },
        {
            id: 2,
            artisan: { name: 'Sarah M.', category: 'Interior Design', location: 'Lekki Phase 1', avatar: 'https://ui-avatars.com/api/?name=Sarah+M&background=random' },
            time: '5 hours ago',
            content: 'Transformed this living space with a modern minimalist approach. Focus was on natural light and neutral tones. Swipe to see the before and after! ✨',
            image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1974&auto=format&fit=crop',
            likes: 56,
            tags: ['Minimalist', 'Renovation']
        },
        {
            id: 3,
            artisan: { name: 'Emmanuel K.', category: 'Carpentry', location: 'Ikeja, Lagos', avatar: 'https://ui-avatars.com/api/?name=Emmanuel+K&background=random' },
            time: '1 day ago',
            content: 'Custom oak dining table finished and delivered today. Handcrafted joints and a durable matte finish. Built to last generations. 🪚🪵',
            image: 'https://images.unsplash.com/photo-1622372738946-62e02505feb3?q=80&w=2032&auto=format&fit=crop',
            likes: 41,
            tags: ['Custom Furniture', 'Woodworking']
        }
    ];

    const recommendedArtisans = [
        { name: 'Michael T.', category: 'Plumbing', rating: 4.9, jobs: 120 },
        { name: 'Grace A.', category: 'Cleaning', rating: 4.8, jobs: 85 },
        { name: 'John P.', category: 'Painting', rating: 5.0, jobs: 42 }
    ];

    return (
        <div className="flex min-h-screen bg-white font-sans text-gray-900">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <TopNavbar breadcrumbs={['Customer', 'Feed']} />
                
                {/* Main Content Area */}
                <main className="relative z-0 flex-1 overflow-y-auto bg-white">
                    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-8 py-6 sm:py-10 pb-24 md:pb-10 flex flex-col xl:flex-row gap-8 xl:gap-12">
                        
                        {/* Feed Column */}
                        <div className="flex-1 max-w-3xl">
                            {/* Header & Search Area */}
                            <div className="mb-6 sm:mb-10">
                                <h1 className="text-[24px] sm:text-[32px] font-extrabold tracking-tight text-gray-900 mb-4 sm:mb-6">Discovery Feed</h1>

                                {/* Simple Search Bar */}
                                <div className="flex items-center bg-white rounded-xl px-4 py-3.5 border border-gray-200 group focus-within:border-gray-400 focus-within:shadow-sm transition-all cursor-text mb-4 w-full">
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
                            <div className="space-y-4 sm:space-y-8">
                                {feedPosts.map(post => (
                                    <div key={post.id} className="bg-white border border-gray-200 rounded-2xl sm:rounded-[20px] overflow-hidden hover:shadow-md transition-shadow">
                                        {/* Post Header */}
                                        <div className="p-4 sm:p-6 flex items-start justify-between gap-2">
                                            <div className="flex gap-3 sm:gap-4 items-center cursor-pointer group min-w-0">
                                                <div className="relative shrink-0">
                                                    <img src={post.artisan.avatar} alt={post.artisan.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-transparent group-hover:border-gray-200 transition-colors" />
                                                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                                                        <span className="material-icons text-blue-500 text-[12px] sm:text-[14px]" title="Verified Artisan">verified</span>
                                                    </div>
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-extrabold text-[14px] sm:text-[15px] text-gray-900 group-hover:underline tracking-wide truncate">{post.artisan.name}</h3>
                                                    <div className="flex items-center flex-wrap gap-x-1 text-[11px] sm:text-[12px] text-gray-500 font-medium mt-0.5">
                                                        <span>{post.artisan.category}</span>
                                                        <span className="text-gray-300">•</span>
                                                        <span className="hidden sm:inline-flex items-center"><span className="material-icons-outlined text-[14px] mr-0.5">location_on</span>{post.artisan.location}</span>
                                                        <span className="hidden sm:inline text-gray-300">•</span>
                                                        <span>{post.time}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="text-gray-400 hover:text-gray-900 transition-colors p-1.5 sm:p-2 rounded-full hover:bg-gray-50 shrink-0">
                                                <span className="material-icons-outlined text-[20px]">more_horiz</span>
                                            </button>
                                        </div>

                                        {/* Post Content */}
                                        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                                            <p className="text-[14px] sm:text-[15px] text-gray-800 leading-relaxed font-medium mb-3 sm:mb-4">{post.content}</p>
                                            
                                            {post.image && (
                                                <div className="w-full h-48 sm:h-64 md:h-80 rounded-xl sm:rounded-2xl overflow-hidden mb-3 sm:mb-4 border border-gray-100 bg-gray-50">
                                                    <img src={post.image} alt="Post media" className="w-full h-full object-cover" />
                                                </div>
                                            )}

                                            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                                                {post.tags.map(tag => (
                                                    <span key={tag} className="text-[10px] sm:text-xs font-bold text-blue-700 bg-blue-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg border border-blue-100/50 tracking-wide">#{tag}</span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Post Footer/Actions */}
                                        <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-t border-gray-100">
                                            <div className="flex gap-4 sm:gap-6">
                                                <button className="flex items-center gap-1.5 sm:gap-2 text-gray-500 hover:text-gray-900 transition-colors group">
                                                    <span className="material-icons-outlined text-[20px] sm:text-[22px] group-hover:text-red-500 transition-colors">favorite_border</span>
                                                    <span className="text-[13px] sm:text-sm font-bold">{post.likes}</span>
                                                </button>
                                                <button className="flex items-center gap-1.5 sm:gap-2 text-gray-500 hover:text-gray-900 transition-colors group">
                                                    <span className="material-icons-outlined text-[20px] sm:text-[22px]">chat_bubble_outline</span>
                                                    <span className="text-[13px] sm:text-sm font-bold hidden sm:inline">Comment</span>
                                                </button>
                                                <button className="flex items-center gap-1.5 sm:gap-2 text-gray-500 hover:text-gray-900 transition-colors group">
                                                    <span className="material-icons-outlined text-[20px] sm:text-[22px]">share</span>
                                                </button>
                                            </div>
                                            <button onClick={() => navigate(`/customer/provider/${post.id}`)} className="text-[12px] sm:text-sm font-extrabold bg-white border-2 border-gray-200 text-gray-900 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl hover:border-gray-900 transition-all">
                                                View Profile
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                
                                {/* Loading Indicator */}
                                <div className="py-10 flex justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar - Recommended */}
                        <div className="w-full xl:w-[350px] shrink-0">
                            {/* Need a Pro Card */}
                            <div className="bg-[#0F172A] rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-6 sm:mb-8 shadow-lg relative overflow-hidden group">
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
                                        <div key={idx} className="flex items-center justify-between group cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-lime-400 rounded-full flex items-center justify-center font-black text-[#0F172A] text-sm shrink-0 border-2 border-white shadow-sm group-hover:scale-110 transition-transform">
                                                    {artisan.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <h3 className="font-extrabold text-[15px] text-gray-900 group-hover:text-[#10B981] transition-colors">{artisan.name}</h3>
                                                    <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wide">{artisan.category}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-1">
                                                    <span className="material-icons text-yellow-400 text-[16px]">star</span>
                                                    <span className="text-[13px] font-black text-gray-900">{artisan.rating}</span>
                                                </div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">{artisan.jobs} jobs</p>
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
