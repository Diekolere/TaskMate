import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import TopNavbar from '../../components/layout/TopNavbar';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { currentUser, updateUserProfile } = useAuth();
    const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('details'); 
    const [expandedPost, setExpandedPost] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
    const [newService, setNewService] = useState({ name: '', rate: '', unit: '' });
    const [newSkill, setNewSkill] = useState('');

  const [profile, setProfile] = useState({
        name: '', email: '', phone: '', location: '', bio: '', tagline: '',
        rating: 0, jobsCompleted: 0, memberSince: '', successRate: 0,
        avatar: '', banner: null, reviews: [], servicesList: [], skills: [], servicePosts: [],
    });

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
                skills: currentUser.skills || [],
                servicePosts: currentUser.servicePosts || [
                    {
                        id: 1,
                        title: 'Smart Home Installation',
                        description: 'Complete setup of smart lighting, security cameras, and intelligent thermostats for...',
                        image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=300&fit=crop',
                        rating: 5.0,
                        reviews: 42,
                    },
                    {
                        id: 2,
                        title: 'Emergency Diagnostic',
                        description: 'Rapid response troubleshooting for power outages, circuit trips, and electrical...',
                        image: 'https://images.unsplash.com/photo-1621905167918-48416bd8575a?w=600&h=800&fit=crop&q=80',
                        rating: 4.8,
                        reviews: 89,
                    },
                ],
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
        setTimeout(async () => {
            const url = URL.createObjectURL(file);
            await updateUserProfile(type === 'avatar' ? { photoURL: url } : { banner: url });
            setProfile(prev => ({ ...prev, [type === 'avatar' ? 'avatar' : 'banner']: url }));
            toast.success(`${type === 'avatar' ? 'Profile picture' : 'Cover photo'} updated!`, { id: toastId });
        }, 800);
    };

    const avatarSrc = profile.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'Provider')}&background=f0fdf4&color=15803d&size=200`;

    const tabs = [
        { id: 'details', label: 'Details' },
        { id: 'services', label: 'Service posts' },
        { id: 'reviews', label: 'Reviews' },
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
                                <div className="flex border-b border-gray-100 overflow-x-auto">
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
                                                {isEditing && (
              <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (newSkill.trim()) {
                                                                setProfile(prev => ({ ...prev, skills: [...prev.skills, newSkill] }));
                                                                setNewSkill('');
                                                            }
                                                        }}
                                                        className="text-[#10B981] hover:text-green-600 text-xs font-semibold"
                                                    >
                                                        + Add
              </button>
                                                )}
                  </div>
                    {isEditing ? (
                        <input 
                                                    type="text"
                                                    value={newSkill}
                                                    onChange={e => setNewSkill(e.target.value)}
                                                    placeholder="Add a specialty…"
                                                    className="w-full p-2 border border-gray-200 rounded-lg focus:border-[#10B981] outline-none text-xs mb-2"
                                                    onKeyPress={e => {
                                                        if (e.key === 'Enter' && newSkill.trim()) {
                                                            setProfile(prev => ({ ...prev, skills: [...prev.skills, newSkill] }));
                                                            setNewSkill('');
                                                        }
                                                    }}
                                                />
                                            ) : null}
                                            <div className="flex flex-wrap gap-2">
                                                {profile.skills.map((skill, idx) => (
                                                    <div key={idx} className="px-3 py-1 bg-[#10B981]/10 text-[#10B981] rounded-full text-xs font-semibold border border-[#10B981]/20 flex items-center gap-2">
                                                        {skill}
                                                        {isEditing && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setProfile(prev => ({ ...prev, skills: prev.skills.filter((_, i) => i !== idx) }))}
                                                                className="hover:text-green-700"
                                                            >
                                                                <span className="material-icons-outlined text-xs">close</span>
                                                            </button>
                    )}
                  </div>
                                                ))}
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
                                        {profile.servicePosts && profile.servicePosts.length > 0 ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                                                {profile.servicePosts.map((post, idx) => (
                    <button 
                                                        key={post.id ?? idx}
                                                        type="button"
                                                        onClick={() => setExpandedPost(post)}
                                                        className="group relative w-full aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981] focus-visible:ring-offset-2 shadow-sm hover:shadow-md transition-shadow text-left"
                                                        aria-label={`Open post: ${post.title || 'Service post'}. Full details in dialog.`}
                                                    >
                                                        {post.image ? (
                                                            <img
                                                                src={post.image}
                                                                alt=""
                                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3 bg-gradient-to-b from-slate-100 to-slate-200">
                                                                <span className="material-icons-outlined text-3xl text-gray-400" aria-hidden>image</span>
                                                                <span className="text-[11px] font-semibold text-gray-500 text-center line-clamp-2">{post.title || 'Post'}</span>
                    </div>
                 )}
                                </button>
                                                ))}
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
                    {profile.reviews && profile.reviews.length > 0 ? (
                        profile.reviews.map((review, idx) => (
                                                <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981] font-bold text-sm border border-[#10B981]/10">
                                                                {(review.user || 'C').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                                                <p className="font-bold text-gray-900 text-sm">{review.user || 'Customer'}</p>
                                                                <p className="text-xs text-gray-400">{review.date || (review.createdAt && new Date(review.createdAt).toLocaleDateString())}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex">
                                                            {[...Array(5)].map((_, i) => (
                                                                <span key={i} className={`material-icons-outlined text-sm ${i < (review.rating || 0) ? 'text-amber-400' : 'text-gray-200'}`}>star</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-600 leading-relaxed">{review.comment || review.text}</p>
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
            {expandedPost && (
                <div
                    className="fixed inset-0 z-[100] flex items-start justify-center sm:items-center p-3 sm:p-6 bg-black/50 overflow-y-auto"
                    onClick={() => setExpandedPost(null)}
                    role="presentation"
                >
                    <div
                        className="bg-white border border-gray-200 rounded-2xl sm:rounded-[20px] overflow-hidden shadow-xl w-full max-w-lg sm:max-w-xl my-4 sm:my-0"
                        onClick={e => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="service-post-expanded-title"
                    >
                        <div className="p-4 sm:p-6 flex items-start justify-between gap-2 border-b border-gray-50">
                            <div className="flex gap-3 sm:gap-4 items-center min-w-0">
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
                            <button
                                type="button"
                                onClick={() => setExpandedPost(null)}
                                className="text-gray-400 hover:text-gray-900 p-1.5 sm:p-2 rounded-full hover:bg-gray-50 shrink-0"
                                aria-label="Close post details"
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

                        <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-t border-gray-100">
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
            )}
    </div>
  );
};

export default Profile;
