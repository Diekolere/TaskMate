import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import TopNavbar from '../../components/layout/TopNavbar';
import ServicePosts from '../../components/provider/ServicePosts';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
    const { currentUser, updateUserProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('details');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [newService, setNewService] = useState({ name: '', rate: '', unit: '' });
    const [newSkill, setNewSkill] = useState('');

    const [profile, setProfile] = useState({
        name: '', email: '', phone: '', location: '', bio: '',
        rating: 0, jobsCompleted: 0, memberSince: '', successRate: 0,
        avatar: '', banner: null, reviews: [], servicesList: [], skills: [], servicePosts: [],
    });

    useEffect(() => {
        if (currentUser) {
            setProfile({
                name: currentUser.displayName || currentUser.full_name || '',
                email: currentUser.email || '',
                phone: currentUser.phoneNumber || currentUser.phone_number || '',
                location: currentUser.address || '',
                bio: currentUser.description || currentUser.bio || '',
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
                        image: 'https://images.unsplash.com/photo-1621905167918-48416bd8575a?w=400&h=300&fit=crop',
                        rating: 4.8,
                        reviews: 89,
                    },
                ],
            });
        }
    }, [currentUser]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateUserProfile({ displayName: profile.name, phoneNumber: profile.phone, address: profile.location, bio: profile.bio, description: profile.bio, services: profile.servicesList, skills: profile.skills, successRate: profile.successRate });
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
            toast.success(`${type === 'avatar' ? 'Profile picture' : 'Banner'} updated!`, { id: toastId });
        }, 800);
    };

    const avatarSrc = profile.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'Provider')}&background=f0fdf4&color=15803d&size=200`;

    const tabs = ['details', 'services', 'reviews'];

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

                        {/* Two Column Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Sidebar - Profile Card */}
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-6 space-y-5">
                                    {/* Avatar */}
                                    <div className="flex flex-col items-center relative group">
                                        <img
                                            src={avatarSrc}
                                            alt={profile.name}
                                            className="w-32 h-32 rounded-full border-4 shadow-lg object-cover bg-white"
                                            onError={e => { e.target.src = `https://ui-avatars.com/api/?name=P&background=f0fdf4&color=15803d&size=200`; }}
                                        />
                                        {isEditing && (
                                            <button
                                                onClick={e => { e.stopPropagation(); document.getElementById('file-input-avatar').click(); }}
                                                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <span className="material-icons-outlined text-white">photo_camera</span>
                                            </button>
                                        )}
                                         </div>

                                    {/* Name & Specialty */}
                                    {isEditing ? (
                                        <div className="space-y-2 text-center">
                                            <input
                                                name="name"
                                                value={profile.name}
                                                onChange={handleChange}
                                                className="text-xl font-bold text-gray-900 border-b border-gray-300 focus:border-[#10B981] outline-none bg-transparent w-full pb-1 text-center"
                                                placeholder="Your Name"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Specialty • Experience"
                                                className="text-sm text-[#10B981] font-semibold border-b border-gray-300 focus:border-[#10B981] outline-none bg-transparent w-full pb-1 text-center"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-center">
                                                <h2 className="text-2xl font-bold text-gray-900">{profile.name || 'Your Name'}</h2>
                                                <p className="text-sm text-[#10B981] font-semibold mt-1">
                                                    {profile.servicesList.length > 0 ? profile.servicesList[0]?.name : 'Professional'} • {profile.jobsCompleted}+ years exp.
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="text-center p-2.5 bg-slate-50 rounded-lg border border-gray-100">
                                            <p className="text-lg font-bold text-gray-900">{parseFloat(profile.rating).toFixed(1)}</p>
                                            <p className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Rating</p>
                                        </div>
                                        <div className="text-center p-2.5 bg-slate-50 rounded-lg border border-gray-100">
                                            <p className="text-lg font-bold text-gray-900">{profile.jobsCompleted}</p>
                                            <p className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Tasks</p>
                                        </div>
                                        <div className="text-center p-2.5 bg-slate-50 rounded-lg border border-gray-100">
                                            <p className="text-lg font-bold text-gray-900">{profile.successRate}%</p>
                                            <p className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Success</p>
                                        </div>
                                    </div>

                                    {/* About Section */}
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

                                    {/* Specialties */}
                                    <div className="border-t border-gray-100 pt-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-bold text-gray-900 uppercase tracking-wide text-xs">Specialties</h4>
                                            {isEditing && (
                                                <button
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

                                    {/* Contact Info */}
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

                                    {/* Edit Button */}
                                    <div className="flex gap-2 border-t border-gray-100 pt-5">
                                        {isEditing ? (
                                            <>
                                                <button onClick={() => setIsEditing(false)} disabled={loading} className="flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50">
                                                    Cancel
                                                </button>
                                                <button onClick={handleSave} disabled={loading} className="flex-1 px-4 py-2.5 rounded-lg bg-[#10B981] text-white text-xs font-bold hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                                    {loading && <span className="material-icons-outlined animate-spin text-xs">progress_activity</span>}
                                                    Save
                                                </button>
                                            </>
                                        ) : (
                                            <button onClick={() => setIsEditing(true)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
                                                <span className="material-icons-outlined text-xs">edit</span>
                                                Edit Profile
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Content - Main Area */}
                            <div className="lg:col-span-2 space-y-6">

                                {/* Tabs */}
                                <div className="flex border-b border-gray-100 overflow-x-auto">
                                    {tabs.map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`px-6 py-3 text-sm font-semibold transition-all whitespace-nowrap border-b-2 -mb-px capitalize ${activeTab === tab
                                                ? 'border-[#10B981] text-[#10B981]'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content */}
                                {activeTab === 'details' && (
                                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                                        <div>
                                            <h3 className="font-bold text-gray-900 uppercase tracking-wide text-xs border-b border-gray-100 pb-3 mb-4">Verification Status</h3>
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="bg-[#10B981]/10 text-[#10B981] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">Verified</span>
                                            </div>
                                            <div className="space-y-3">
                                                {['Identity Verified (NIN)', 'Address Verified', 'Background Check Cleared'].map(item => (
                                                    <div key={item} className="flex items-center gap-3 text-sm text-gray-700">
                                                        <span className="material-icons-outlined text-[#10B981] text-lg">check_circle</span>
                                                        {item}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'services' && (
                                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                        {/* Create Service Post Banner */}
                                        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl border-2 border-teal-200 p-8 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-6">
                                            <div className="flex items-center gap-6 flex-1">
                                                <div className="flex-shrink-0">
                                                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-[#10B981] text-white">
                                                        <span className="material-icons text-2xl">add</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 mb-1">Create a service post</h3>
                                                    <p className="text-sm text-teal-700">Market your skills and attract more clients by listing a new specialty.</p>
                                                </div>
                                            </div>
                                            <button className="px-6 py-2.5 bg-[#10B981] text-white rounded-lg font-semibold hover:bg-green-600 transition-colors text-sm whitespace-nowrap">
                                                Create
                                            </button>
                                        </div>

                                        {/* Service Posts Grid */}
                                        {profile.servicePosts && profile.servicePosts.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {profile.servicePosts.map((post, idx) => (
                                                    <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                                        {/* Post Image */}
                                                        {post.image && (
                                                            <img src={post.image} alt={post.title} className="w-full h-48 object-cover" />
                                                        )}

                                                        {/* Post Content */}
                                                        <div className="p-5">
                                                            <h4 className="font-bold text-gray-900 text-lg mb-2">{post.title || 'Service Post'}</h4>
                                                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{post.description || 'No description provided.'}</p>

                                                            {/* Rating and Edit */}
                                                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="material-icons text-amber-400 text-lg">star</span>
                                                                    <span className="font-semibold text-gray-900">{parseFloat(post.rating || profile.rating || 0).toFixed(1)}</span>
                                                                    <span className="text-sm text-gray-500">({post.reviews || 0})</span>
                                                                </div>
                                                                <button className="text-[#10B981] hover:text-green-600 font-semibold text-sm flex items-center gap-1 transition-colors">
                                                                    Edit Post
                                                                    <span className="material-icons text-sm">edit</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
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
        </div>
    );
};

export default Profile;
