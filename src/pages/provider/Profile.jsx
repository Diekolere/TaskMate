import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import TopNavbar from '../../components/layout/TopNavbar';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
    const { currentUser, updateUserProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('details');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    const [profile, setProfile] = useState({
        name: '', email: '', phone: '', location: '', bio: '',
        rating: 0, jobsCompleted: 0, memberSince: '',
        avatar: '', banner: null, reviews: [],
    });
    const [services, setServices] = useState([]);
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [newService, setNewService] = useState({ name: '', rate: '', unit: 'per hour' });

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
                memberSince: currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'long' }) : '—',
                avatar: currentUser.photoURL || currentUser.avatar_url || '',
                banner: currentUser.banner || null,
                reviews: currentUser.reviews || [],
            });
            if (currentUser.services) setServices(currentUser.services);
        }
    }, [currentUser]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateUserProfile({ displayName: profile.name, phoneNumber: profile.phone, address: profile.location, bio: profile.bio, description: profile.bio, services });
            setIsEditing(false);
            toast.success('Profile updated successfully');
        } catch {
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleAddService = () => {
        if (!newService.name || !newService.rate) { toast.error('Please fill in service name and rate'); return; }
        const service = { ...newService, id: Date.now() };
        const updated = [...services, service];
        setServices(updated);
        setNewService({ name: '', rate: '', unit: 'per hour' });
        setShowServiceModal(false);
        updateUserProfile({ services: updated }).then(() => toast.success('Service added')).catch(() => toast.error('Failed to save service'));
    };

    const handleDeleteService = (id) => {
        const updated = services.filter(s => s.id !== id);
        setServices(updated);
        updateUserProfile({ services: updated }).then(() => toast.success('Service removed')).catch(() => toast.error('Failed'));
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
                    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">

                        {/* Hidden file inputs */}
                        <input type="file" id="file-input-avatar" className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'avatar')} />
                        <input type="file" id="file-input-cover" className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'cover')} />

                        {/* Profile Header Card */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            {/* Banner */}
                            <div
                                className={`h-32 sm:h-40 bg-gradient-to-br from-[#0F172A] to-slate-600 relative group ${isEditing ? 'cursor-pointer' : ''}`}
                                onClick={() => isEditing && document.getElementById('file-input-cover').click()}
                            >
                                {profile.banner && <img src={profile.banner} alt="Banner" className="w-full h-full object-cover" />}
                                {isEditing && (
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-white text-sm font-semibold">
                                            <span className="material-icons-outlined text-base">upload</span>
                                            Change Banner
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="px-5 sm:px-8 pb-6 relative">
                                <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-12 sm:-mt-14 mb-5 gap-4">
                                    {/* Avatar */}
                                    <div className="relative group shrink-0">
                                        <img
                                            src={avatarSrc}
                                            alt={profile.name}
                                            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-md object-cover bg-white"
                                            onError={e => { e.target.src = `https://ui-avatars.com/api/?name=P&background=f0fdf4&color=15803d&size=200`; }}
                                        />
                                        {isEditing && (
                                            <button
                                                onClick={e => { e.stopPropagation(); document.getElementById('file-input-avatar').click(); }}
                                                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-4 border-transparent"
                                            >
                                                <span className="material-icons-outlined text-white">photo_camera</span>
                                            </button>
                                        )}
                                        {!isEditing && <div className="absolute bottom-1 right-1 w-5 h-5 bg-[#10B981] border-2 border-white rounded-full"></div>}
                                    </div>

                                    {/* Name/location or edit fields */}
                                    <div className="flex-1 w-full">
                                        {isEditing ? (
                                            <div className="space-y-2 max-w-sm">
                                                <input
                                                    name="name" value={profile.name} onChange={handleChange}
                                                    className="text-xl font-bold text-gray-900 border-b border-gray-300 focus:border-[#10B981] outline-none bg-transparent w-full pb-1"
                                                    placeholder="Your Name"
                                                />
                                                <input
                                                    name="location" value={profile.location} onChange={handleChange}
                                                    className="text-sm text-gray-500 border-b border-gray-300 focus:border-[#10B981] outline-none bg-transparent w-full pb-1"
                                                    placeholder="City, State"
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                <h2 className="text-xl font-bold text-gray-900">{profile.name || 'Your Name'}</h2>
                                                <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                                    <span className="material-icons-outlined text-base">location_on</span>
                                                    {profile.location || 'Location not set'}
                                                </p>
                                            </>
                                        )}
                                    </div>

                                    {/* Stats */}
                                    <div className="flex gap-3 mt-2 sm:mt-0">
                                        <div className="text-center px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
                                            <p className="text-lg font-bold text-gray-900">{parseFloat(profile.rating).toFixed(1)}</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Rating</p>
                                        </div>
                                        <div className="text-center px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
                                            <p className="text-lg font-bold text-gray-900">{profile.jobsCompleted}</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Jobs</p>
                                        </div>
                                    </div>

                                    {/* Edit/Save Actions */}
                                    <div className="flex gap-2">
                                        {isEditing ? (
                                            <>
                                                <button onClick={() => setIsEditing(false)} disabled={loading} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50">
                                                    Cancel
                                                </button>
                                                <button onClick={handleSave} disabled={loading} className="px-5 py-2 rounded-xl bg-[#0F172A] text-white text-sm font-bold hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                                                    {loading && <span className="material-icons-outlined animate-spin text-sm">progress_activity</span>}
                                                    Save
                                                </button>
                                            </>
                                        ) : (
                                            <button onClick={() => setIsEditing(true)} className="px-5 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                                                <span className="material-icons-outlined text-base">edit</span>
                                                Edit Profile
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Bio */}
                                {isEditing ? (
                                    <textarea
                                        name="bio" value={profile.bio} onChange={handleChange}
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/10 outline-none text-sm text-gray-600 leading-relaxed min-h-[90px] resize-none"
                                        placeholder="Tell customers about your experience and skills…"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-600 leading-relaxed max-w-3xl">
                                        {profile.bio || 'No bio provided yet. Click Edit Profile to add one.'}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 overflow-x-auto">
                            {tabs.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-3 text-sm font-semibold transition-all whitespace-nowrap border-b-2 -mb-px capitalize ${
                                        activeTab === tab
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
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                    <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-3">Contact Information</h3>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Email Address</p>
                                        <p className="text-sm font-medium text-gray-600">{profile.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Phone Number</p>
                                        {isEditing ? (
                                            <input name="phone" value={profile.phone} onChange={handleChange}
                                                className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#10B981] outline-none" />
                                        ) : (
                                            <p className="text-sm font-medium text-gray-900">{profile.phone || '—'}</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Member Since</p>
                                        <p className="text-sm font-medium text-gray-900">{profile.memberSince}</p>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                        <h3 className="font-bold text-gray-900">Verification Status</h3>
                                        <span className="bg-[#10B981]/10 text-[#10B981] px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide">Verified</span>
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
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-900">Services Offered</h3>
                                    <button onClick={() => setShowServiceModal(true)} className="text-sm font-semibold text-[#10B981] flex items-center gap-1 hover:underline">
                                        <span className="material-icons-outlined text-base">add</span>
                                        Add Service
                                    </button>
                                </div>

                                {showServiceModal && (
                                    <div className="p-5 bg-gray-50 border-b border-gray-100 space-y-4">
                                        <h4 className="font-bold text-gray-800 text-sm">New Service</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <input placeholder="Service name" value={newService.name}
                                                onChange={e => setNewService({ ...newService, name: e.target.value })}
                                                className="border border-gray-200 rounded-xl p-2.5 text-sm focus:border-[#10B981] outline-none"
                                            />
                                            <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#10B981]">
                                                <span className="bg-gray-50 px-3 py-2.5 text-gray-500 text-sm border-r border-gray-200">₦</span>
                                                <input type="number" placeholder="Rate" value={newService.rate}
                                                    onChange={e => setNewService({ ...newService, rate: e.target.value })}
                                                    className="w-full p-2.5 text-sm outline-none"
                                                />
                                            </div>
                                            <select value={newService.unit}
                                                onChange={e => setNewService({ ...newService, unit: e.target.value })}
                                                className="border border-gray-200 rounded-xl p-2.5 text-sm focus:border-[#10B981] outline-none bg-white"
                                            >
                                                <option>per hour</option>
                                                <option>per visit</option>
                                                <option>per project</option>
                                                <option>per item</option>
                                            </select>
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => setShowServiceModal(false)} className="px-4 py-2 text-gray-500 text-sm hover:bg-gray-100 rounded-xl">Cancel</button>
                                            <button onClick={handleAddService} className="px-5 py-2 bg-[#0F172A] text-white text-sm font-semibold rounded-xl hover:bg-slate-700">Add Service</button>
                                        </div>
                                    </div>
                                )}

                                <div className="divide-y divide-gray-50">
                                    {services.length > 0 ? services.map(service => (
                                        <div key={service.id || Math.random()} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{service.name}</p>
                                                <p className="text-xs text-gray-400 capitalize">{service.unit}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <p className="font-bold text-gray-900 text-sm">
                                                    {isNaN(service.rate) ? service.rate : `₦${Number(service.rate).toLocaleString()}`}
                                                </p>
                                                <button onClick={() => handleDeleteService(service.id)}
                                                    className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50">
                                                    <span className="material-icons-outlined text-base">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="p-10 text-center text-gray-300">
                                            <span className="material-icons-outlined text-3xl">design_services</span>
                                            <p className="text-sm mt-2 text-gray-400">No services listed. Add services to attract customers.</p>
                                        </div>
                                    )}
                                </div>
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
                </main>
            </div>

            <ProviderMobileNavBar />
        </div>
    );
};

export default Profile;
