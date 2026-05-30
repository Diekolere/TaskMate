import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import TopNavbar from '../../components/layout/TopNavbar';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { uploadFile, generateFilePath, supabase } from '../../lib/supabase';

const CATEGORIES_LIST = [
  "Plumbing", "Electrical", "Furniture (Carpentry)", "Cleaning", "Painting",
  "HVAC", "Moving", "Roofing", "Appliance Repair", "Landscaping", "Laundry"
];

const CATEGORY_STYLES = {
  'Plumbing': { text: 'text-blue-600', bg: 'bg-blue-50 border-blue-200/60' },
  'Electrical': { text: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200/60' },
  'Furniture (Carpentry)': { text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200/60' },
  'Cleaning': { text: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-200/60' },
  'Painting': { text: 'text-pink-600', bg: 'bg-pink-50 border-pink-200/60' },
  'HVAC': { text: 'text-[#10B981]', bg: 'bg-emerald-50 border-emerald-200/60' },
  'Moving': { text: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200/60' },
  'Roofing': { text: 'text-slate-700', bg: 'bg-slate-50 border-slate-200/60' },
  'Appliance Repair': { text: 'text-red-600', bg: 'bg-red-50 border-red-200/60' },
  'Landscaping': { text: 'text-green-700', bg: 'bg-green-50 border-green-200/60' },
  'Laundry': { text: 'text-purple-600', bg: 'bg-purple-50 border-purple-200/60' }
};

const Profile = () => {
  const { currentUser, updateUserProfile } = useAuth();
  const { getServicePosts, deleteServicePost: deleteServicePostDb } = useData();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('details'); 
    const [expandedPost, setExpandedPost] = useState(null);
  const [postMenuOpenId, setPostMenuOpenId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
    const [newService, setNewService] = useState({ name: '', rate: '', unit: '' });
    const [newSkill, setNewSkill] = useState('');

  const [profile, setProfile] = useState({
        name: '', email: '', phone: '', location: '', bio: '', tagline: '',
        rating: 0, jobsCompleted: 0, memberSince: '', successRate: 0,
        avatar: '', banner: null, reviews: [], servicesList: [], skills: [], servicePosts: [],
    });
  const [servicePosts, setServicePosts] = useState([]);
  const [liveReviews, setLiveReviews] = useState([]);

  // Fetch reviews from DB whenever currentUser loads
  useEffect(() => {
    if (!currentUser?.id) return;
    supabase
      .from('reviews')
      .select('*, reviewer:profiles!reviewer_id(full_name, avatar_url)')
      .eq('provider_id', currentUser.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setLiveReviews(data); });
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser) {
        const firstService = (currentUser.services && currentUser.services[0]?.name) || 'Professional';
        const years = currentUser.provider_profiles?.years_experience ?? currentUser.jobsCompleted ?? 0;
        const fallbackTagline = `${firstService} • ${years}+ years exp.`;
        setProfile({
        name: currentUser.displayName || currentUser.full_name || '',
        email: currentUser.email || '',
        phone: currentUser.phoneNumber || currentUser.phone_number || '',
        location: currentUser.address || '',
        bio: currentUser.description || currentUser.bio || '',
        tagline: (currentUser.tagline && String(currentUser.tagline).trim()) || fallbackTagline,
        rating: currentUser.rating || 0,
        jobsCompleted: currentUser.jobsCompleted || 0,
                successRate: currentUser.successRate || 96,
                memberSince: currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'long' }) : '—',
                avatar: currentUser.photoURL || currentUser.avatar_url || '',
        banner: currentUser.banner || null,
                reviews: currentUser.reviews || [],
                servicesList: currentUser.services || [],
                skills: currentUser.tradeCategory || [],
                servicePosts: [], // Will be fetched separately
            });
            
            getServicePosts(currentUser.id).then(posts => {
                setServicePosts(posts.map(p => ({
                    ...p,
                    title: p.category || 'Service Post',
                    description: p.caption,
                    image: p.images?.[0] || '',
                    createdAt: p.created_at
                })));
            });
        }
  }, [currentUser]);

    useEffect(() => {
        const t = searchParams.get('tab');
        if (t === 'services' || t === 'details' || t === 'reviews') {
            setActiveTab(t);
        }
    }, [searchParams]);

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

    useEffect(() => {
        if (postMenuOpenId == null) return;
        const handleDown = (e) => {
            if (!e.target.closest('[data-post-menu]')) {
                setPostMenuOpenId(null);
            }
        };
        document.addEventListener('mousedown', handleDown);
        return () => document.removeEventListener('mousedown', handleDown);
    }, [postMenuOpenId]);

  const handleSave = async () => {
    setLoading(true);
    try {
            await updateUserProfile({ displayName: profile.name, phoneNumber: profile.phone, address: profile.location, bio: profile.bio, description: profile.bio, tagline: profile.tagline, services: profile.servicesList, skills: profile.skills, successRate: profile.successRate });
      setIsEditing(false);
      toast.success('Profile updated successfully');
        } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }

    const toastId = toast.loading(`Uploading ${type}…`);
    try {
        const bucket = type === 'avatar' ? 'avatars' : 'service-posts'; // banner uses service-posts or generic
        const path = generateFilePath(currentUser.id, file.name);
        const publicUrl = await uploadFile(bucket, path, file);

        await updateUserProfile(type === 'avatar' ? { photoURL: publicUrl } : { banner: publicUrl });
        setProfile(prev => ({ ...prev, [type === 'avatar' ? 'avatar' : 'banner']: publicUrl }));
        toast.success(`${type === 'avatar' ? 'Profile picture' : 'Cover photo'} updated!`, { id: toastId });
    } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${type}`, { id: toastId });
    }
  };

    const avatarSrc = profile.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'Provider')}&background=f0fdf4&color=15803d&size=200`;

    const tabs = [
        { id: 'details', label: 'Details' },
        { id: 'services', label: 'Service posts' },
        { id: 'reviews', label: `Reviews${liveReviews.length > 0 ? ` (${liveReviews.length})` : ''}` },
    ];

    const postMetaTime = (post) => {
        if (!post?.createdAt) return 'Recently';
        try {
            return new Date(post.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return 'Recently';
        }
    };

    const postMenuId = (post, idx) => (post?.id != null ? `id:${post.id}` : `idx:${idx}`);

    const postIndexInList = (post) =>
        servicePosts.findIndex(p =>
            (post?.id != null && p?.id != null && p.id === post.id) || (post?.id == null && p === post));

    const deleteServicePost = async (post) => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        try {
            await deleteServicePostDb(post.id);
            setServicePosts(prev => prev.filter(p => p.id !== post.id));
            setPostMenuOpenId(null);
            setExpandedPost(null);
        } catch {
            toast.error('Could not delete post');
        }
    };

    const editServicePost = (post) => {
        setPostMenuOpenId(null);
        setExpandedPost(null);
        navigate('/provider/posts/new', { state: { editPost: post } });
    };

    const renderPostMenuPanel = (post, idxHint) => (
        <div
            className="absolute top-full right-0 mt-1 w-44 rounded-xl border border-gray-100 bg-white shadow-xl py-1 z-[120] overflow-hidden"
            role="menu"
        >
            <button
                type="button"
                role="menuitem"
                className="w-full text-left px-3 py-2.5 text-[13px] font-semibold text-gray-800 hover:bg-gray-50 flex items-center gap-2"
                onClick={() => editServicePost(post)}
            >
                <span className="material-icons-outlined text-lg text-gray-500">edit</span>
                Edit post
            </button>
            <button
                type="button"
                role="menuitem"
                className="w-full text-left px-3 py-2.5 text-[13px] font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                onClick={() => deleteServicePost(post, idxHint)}
            >
                <span className="material-icons-outlined text-lg">delete</span>
                Delete post
            </button>
        </div>
    );

  return (
        <div className="min-h-screen bg-white flex font-sans">
      <ProviderSidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopNavbar breadcrumbs={['Profile']} />

                <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
                    <div className="p-4  sm:p-6 md:p-8 max-w-7xl mx-auto">

                        {/* Hidden file inputs */}
                        <input type="file" id="file-input-avatar" className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'avatar')} />
                        <input type="file" id="file-input-cover" className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'cover')} />

                        {/* Profile hero — no card; sits on page background */}
                        <div className="max-w-4xl mx-auto space-y-6">
                            <div className="space-y-5">
                                <div className="relative h-32 sm:h-40 rounded-2xl overflow-hidden bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 group/banner">
                                    {profile.banner && (
                                        <img
                                            src={profile.banner}
                                            alt=""
                                            className="absolute inset-0 w-full h-full object-cover"
                                            onError={e => { e.target.style.display = 'none'; }}
                                        />
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover/banner:opacity-100 transition-opacity duration-150 pointer-events-none sm:group-hover/banner:pointer-events-auto bg-black/0 sm:group-hover/banner:bg-black/30">
                 <button 
                                            type="button"
                                            onClick={() => document.getElementById('file-input-cover').click()}
                                            className="pointer-events-auto shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-white/95 text-gray-800 text-xs font-semibold shadow-md border border-gray-200 hover:bg-white transition-colors"
                                        >
                                            <span className="material-icons-outlined text-sm">add_photo_alternate</span>
                                            {profile.banner ? 'Change cover' : 'Add cover photo'}
                </button>
             </div>
                                </div>

                                <div className="space-y-5 px-0">
                                    <div className="flex flex-col items-center relative group -mt-14 sm:-mt-16">
                                        <img
                                            src={avatarSrc}
                    alt={profile.name} 
                                            className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover bg-white relative z-10"
                                            onError={e => { e.target.src = `https://ui-avatars.com/api/?name=P&background=f0fdf4&color=15803d&size=200`; }}
                  />
                  {isEditing && (
                    <button 
                                                type="button"
                                                onClick={e => { e.stopPropagation(); document.getElementById('file-input-avatar').click(); }}
                                                className="absolute inset-0 top-0 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                    >
                                                <span className="material-icons-outlined text-white">photo_camera</span>
                    </button>
                  )}
                                    </div>

                                    <div className="text-center">
                                        <h2 className="text-2xl font-bold text-gray-900">{profile.name || 'Your Name'}</h2>
                                        <p className="text-sm text-[#10B981] font-semibold mt-1 px-2">
                                            {profile.tagline?.trim() || 'Professional • 0+ years exp.'}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 max-w-lg mx-auto">
                                        <div className="text-center p-2.5 bg-white rounded-lg">
                                            <p className="text-lg font-bold text-gray-900">{parseFloat(profile.rating).toFixed(1)}</p>
                                            <p className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Rating</p>
                                        </div>
                                        <div className="text-center p-2.5 bg-white rounded-lg">
                                            <p className="text-lg font-bold text-gray-900">{profile.jobsCompleted}</p>
                                            <p className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Tasks</p>
                                        </div>
                                        <div className="text-center p-2.5 bg-white rounded-lg">
                                            <p className="text-lg font-bold text-gray-900">{profile.successRate}%</p>
                                            <p className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Success</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Tabs */}
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
                                        {isEditing && (
                                            <div className="space-y-3 pb-5 border-b border-gray-100">
                                                <h3 className="font-bold text-gray-900 uppercase tracking-wide text-xs">Profile basics</h3>
                                                <div className="space-y-2">
                                                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Display name</label>
                                                    <input
                                                        name="name"
                                                        value={profile.name}
                                                        onChange={handleChange}
                        className="w-full p-2.5 border border-gray-200 rounded-lg focus:border-[#10B981] outline-none text-sm text-gray-900"
                        placeholder="Your name"
                      />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Headline</label>
                                                    <p className="text-[11px] text-gray-500 -mt-1 mb-1">Shown under your name (e.g. Professional • 5+ years exp.)</p>
                                                    <input
                                                        name="tagline"
                                                        value={profile.tagline}
                                                        onChange={handleChange}
                                                        className="w-full p-2.5 border border-gray-200 rounded-lg focus:border-[#10B981] outline-none text-sm text-[#10B981] font-semibold"
                                                        placeholder="Professional • 0+ years exp."
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500">Hover your photo or banner in the header to update pictures.</p>
                                            </div>
                                        )}

                                        <div className="border-t border-gray-100 pt-5">
                                            <h4 className="font-bold text-gray-900 uppercase tracking-wide text-xs mb-3">About</h4>
              {isEditing ? (
                    <textarea 
                        name="bio"
                        value={profile.bio}
                        onChange={handleChange}
                                                    className="w-full p-3 border border-gray-200 rounded-lg focus:border-[#10B981] outline-none text-xs text-gray-600 leading-relaxed min-h-[70px] resize-none"
                                                    placeholder="Tell customers about your experience…"
                    />
              ) : (
                                                <p className="text-xs text-gray-600 leading-relaxed">
                    {profile.bio || 'No bio provided yet.'}
                  </p>
              )}
          </div>

                                        <div className="border-t border-gray-100 pt-5">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-bold text-gray-900 uppercase tracking-wide text-xs">Specialties</h4>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {isEditing ? (
                                                    CATEGORIES_LIST.map((catName) => {
                                                        const isSelected = profile.skills.includes(catName);
                                                        const style = CATEGORY_STYLES[catName] || { text: 'text-gray-700', bg: 'bg-gray-50 border-gray-200/60' };
                                                        return (
                                                            <button
                                                                type="button"
                                                                key={catName}
                                                                onClick={() => {
                                                                    setProfile(prev => {
                                                                        const nextSkills = prev.skills.includes(catName)
                                                                            ? prev.skills.filter(s => s !== catName)
                                                                            : [...prev.skills, catName];
                                                                        return { ...prev, skills: nextSkills };
                                                                    });
                                                                }}
                                                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                                                    isSelected
                                                                        ? `${style.bg} ${style.text}`
                                                                        : 'bg-gray-50 text-gray-400 border-gray-200/60 hover:bg-gray-100 hover:text-gray-600'
                                                                }`}
                                                            >
                                                                {catName}
                                                            </button>
                                                        );
                                                    })
                                                ) : (
                                                    profile.skills.length > 0 ? (
                                                        profile.skills.map((skill, idx) => {
                                                            const style = CATEGORY_STYLES[skill] || { text: 'text-gray-700', bg: 'bg-gray-50 border-gray-200/60' };
                                                            return (
                                                                <div key={idx} className={`px-3 py-1 ${style.bg} ${style.text} rounded-full text-xs font-semibold border flex items-center gap-2`}>
                                                                    {skill}
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <p className="text-xs text-gray-500">No specialties listed.</p>
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-100 pt-5 space-y-3">
                                            <div>
                                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Email</p>
                                                <p className="text-xs text-gray-700">{profile.email}</p>
                  </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Phone</p>
                                                {isEditing ? (
                                                    <input name="phone" value={profile.phone} onChange={handleChange}
                                                        className="w-full p-2 border border-gray-200 rounded-lg focus:border-[#10B981] outline-none text-xs" />
                                                ) : (
                                                    <p className="text-xs text-gray-700">{profile.phone || '—'}</p>
                                                )}
                    </div>
                  </div>

                                        <div className="flex gap-2 border-t border-gray-100 pt-5">
                                            {isEditing ? (
                                                <>
                                                    <button type="button" onClick={() => setIsEditing(false)} disabled={loading} className="flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50">
                                                        Cancel
                                                    </button>
                                                    <button type="button" onClick={handleSave} disabled={loading} className="flex-1 px-4 py-2.5 rounded-lg bg-[#10B981] text-white text-xs font-bold hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                                        {loading && <span className="material-icons-outlined animate-spin text-xs">progress_activity</span>}
                                                        Save
                                                    </button>
                                                </>
                                            ) : (
                                                <button type="button" onClick={() => setIsEditing(true)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
                                                    <span className="material-icons-outlined text-xs">edit</span>
                                                    Edit Details
                                                </button>
                                            )}
                </div>
              </motion.div>
            )}

            {activeTab === 'services' && (
                                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                        <Link
                                            to="/provider/posts/new"
                                            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-500 hover:text-gray-900 transition-colors py-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981] focus-visible:ring-offset-2"
                                        >
                                            <span className="material-icons-outlined text-[18px] text-gray-400" aria-hidden>add</span>
                                            <span className="border-b border-dashed border-gray-300 hover:border-gray-600">New post</span>
                                        </Link>

                                        {/* Portrait image grid — 4 columns on md+ (taller than wide); tap opens feed-style detail */}
                                        {servicePosts && servicePosts.length > 0 ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                                                {servicePosts.map((post, idx) => {
                                                    const menuId = postMenuId(post, idx);
                                                    const isSameExpanded = expandedPost && (
                                                        (post.id != null && expandedPost.id === post.id) ||
                                                        (post.id == null && expandedPost === post)
                                                    );
                                                    return (
                                                    <div
                                                        key={post.id ?? idx}
                                                        className="relative w-full aspect-[3/4]"
                                                    >
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
                                                                onClick={() => { setPostMenuOpenId(null); setExpandedPost(post); }}
                                                                className="absolute inset-0 z-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#10B981]"
                                                                aria-label={`Open post: ${post.title || 'Service post'}. Full details in dialog.`}
                                                            />
                                                        </div>
                                                        <div className="absolute top-1.5 right-1.5 z-20" data-post-menu>
                                                            <button
                                                                type="button"
                                                                className="p-1.5 rounded-full bg-black/45 text-white hover:bg-black/60 backdrop-blur-[2px] shadow-sm flex items-center justify-center"
                                                                aria-label="Post options"
                                                                aria-expanded={postMenuOpenId === menuId}
                                                                aria-haspopup="menu"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setPostMenuOpenId(v => (v === menuId ? null : menuId));
                                                                }}
                                                            >
                                                                <span className="material-icons-outlined text-lg leading-none">more_vert</span>
                                                            </button>
                                                            {postMenuOpenId === menuId && !isSameExpanded ? renderPostMenuPanel(post, idx) : null}
                                                        </div>
                                                    </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                                                <span className="material-icons-outlined text-3xl text-gray-200">work</span>
                                                <p className="text-sm text-gray-400 mt-2">No service posts yet. Create your first post to showcase your work!</p>
                        </div>
                    )}
              </motion.div>
            )}

                        {activeTab === 'reviews' && (
                                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    {liveReviews.length > 0 ? (
                        liveReviews.map((review, idx) => (
                                                <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981] font-bold text-sm border border-[#10B981]/10 overflow-hidden shrink-0">
                                                                {review.reviewer?.avatar_url ? (
                                                                    <img src={review.reviewer.avatar_url} alt="Reviewer" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    (review.reviewer?.full_name || 'C').charAt(0).toUpperCase()
                                                                )}
                                                            </div>
                                        <div>
                                                                <p className="font-bold text-gray-900 text-sm">{review.reviewer?.full_name || 'Customer'}</p>
                                                                <p className="text-xs text-gray-400">{review.created_at ? new Date(review.created_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recent'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex">
                                                            {[...Array(5)].map((_, i) => (
                                                                <span key={i} className={`material-icons text-sm ${i < (review.rating || 0) ? 'text-amber-400' : 'text-gray-200'}`}>star</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {review.comment && <p className="text-sm text-gray-600 leading-relaxed mb-3">{review.comment}</p>}
                                                    {review.tags && review.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {review.tags.map((tag, i) => (
                                                                <span key={i} className="px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest">{tag}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                                                <span className="material-icons-outlined text-3xl text-gray-200">reviews</span>
                                                <p className="text-sm text-gray-400 mt-2">No reviews yet. Complete jobs to earn ratings!</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
                                        </div>

            <ProviderMobileNavBar />

            {/* Expanded post — matches customer Discovery Feed card (Dashboard) */}
            {expandedPost ? (() => {
                const expIdx = postIndexInList(expandedPost);
                const expMenuId = postMenuId(expandedPost, expIdx);
                return (
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
                        aria-labelledby="service-post-expanded-title"
                    >
                        <div className="p-4 sm:p-6 flex items-start justify-between gap-2 border-b border-gray-50 relative z-0 overflow-visible shrink-0">
                            <div className="flex gap-3 sm:gap-4 items-center min-w-0 flex-1">
                                <div className="relative shrink-0">
                                    <img src={avatarSrc} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-100" />
                                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                                        <span className="material-icons text-blue-500 text-[12px] sm:text-[14px]">verified</span>
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <h3 id="service-post-expanded-title" className="font-extrabold text-[14px] sm:text-[15px] text-gray-900 tracking-wide truncate">
                                        {profile.name || 'Your Name'}
                                    </h3>
                                    <div className="flex items-center flex-wrap gap-x-1 text-[11px] sm:text-[12px] text-gray-500 font-medium mt-0.5">
                                        <span>{expandedPost.category || profile.servicesList[0]?.name || 'Professional'}</span>
                                        <span className="text-gray-300">•</span>
                                        <span className="inline-flex items-center max-w-[10rem] sm:max-w-none truncate">
                                            <span className="material-icons-outlined text-[14px] mr-0.5 shrink-0">location_on</span>
                                            {expandedPost.location || profile.location || '—'}
                                        </span>
                                        <span className="text-gray-300">•</span>
                                        <span>{postMetaTime(expandedPost)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                                <div className="relative" data-post-menu>
                                    <button
                                        type="button"
                                        className="text-gray-400 hover:text-gray-900 p-1.5 sm:p-2 rounded-full hover:bg-gray-50"
                                        aria-label="Post options"
                                        aria-expanded={postMenuOpenId === expMenuId}
                                        aria-haspopup="menu"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPostMenuOpenId(v => (v === expMenuId ? null : expMenuId));
                                        }}
                                    >
                                        <span className="material-icons-outlined text-[20px]">more_vert</span>
                                    </button>
                                    {postMenuOpenId === expMenuId ? renderPostMenuPanel(expandedPost, expIdx) : null}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setExpandedPost(null)}
                                    className="text-gray-400 hover:text-gray-900 p-1.5 sm:p-2 rounded-full hover:bg-gray-50"
                                    aria-label="Close post details"
                                >
                                    <span className="material-icons-outlined text-[20px]">close</span>
                                </button>
                            </div>
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
                            <div className="flex gap-4 sm:gap-6" aria-hidden="true">
                                <span className="flex items-center gap-1.5 sm:gap-2 text-gray-500">
                                    <span className="material-icons-outlined text-[20px] sm:text-[22px]">favorite_border</span>
                                    <span className="text-[13px] sm:text-sm font-bold">{expandedPost.likes ?? 0}</span>
                                </span>
                                <span className="flex items-center gap-1.5 sm:gap-2 text-gray-500">
                                    <span className="material-icons-outlined text-[20px] sm:text-[22px]">chat_bubble_outline</span>
                                    <span className="text-[13px] sm:text-sm font-bold hidden sm:inline">Comment</span>
                                </span>
                                <span className="flex items-center gap-1.5 sm:gap-2 text-gray-500">
                                    <span className="material-icons-outlined text-[20px] sm:text-[22px]">share</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 text-amber-500 text-[13px] sm:text-sm font-bold">
                                    <span className="material-icons text-base sm:text-lg">star</span>
                                    {parseFloat(expandedPost.rating ?? profile.rating ?? 0).toFixed(1)}
                                    <span className="text-gray-500 font-semibold">({expandedPost.reviews ?? 0})</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
                );
            })() : null}
    </div>
  );
};

export default Profile;
