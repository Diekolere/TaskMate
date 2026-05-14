import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import TopNavbar from '../../components/layout/TopNavbar';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { uploadFile, generateFilePath } from '../../lib/supabase';

const CreateServicePost = () => {
    const navigate = useNavigate();
    const routerLocation = useLocation();
    const { currentUser } = useAuth();
    const { createServicePost, updateServicePost } = useData();
    const fileInputRef = useRef(null);
    const [category, setCategory] = useState('');
    const [locationField, setLocationField] = useState('');
    const [content, setContent] = useState('');
    const [tagsInput, setTagsInput] = useState('');
    const [imagePreview, setImagePreview] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        const ep = routerLocation.state?.editPost;
        if (ep && ep.id != null) {
            setEditingId(ep.id);
            setCategory(ep.category || ep.title || '');
            setLocationField(ep.location || '');
            setContent(ep.description || '');
            setTagsInput(Array.isArray(ep.tags) ? ep.tags.join(', ') : '');
            setImagePreview(ep.image || '');
            setSelectedFile(null);
        } else {
            setEditingId(null);
            setCategory('');
            setLocationField('');
            setContent('');
            setTagsInput('');
            setImagePreview('');
            setSelectedFile(null);
        }
    }, [routerLocation.pathname, routerLocation.state?.editPost]);

    const displayName = currentUser?.displayName || currentUser?.full_name || 'Your name';
    const avatarSrc = currentUser?.photoURL || currentUser?.avatar_url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=f0fdf4&color=15803d&size=200`;

    const handleImage = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Please choose an image file');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be under 5MB');
            return;
        }
        setSelectedFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const clearImage = () => {
        if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
        setImagePreview('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handlePublish = async () => {
        if (!content.trim()) {
            toast.error('Write something for your post');
            return;
        }
        setSubmitting(true);
        try {
            let finalImageUrl = imagePreview;

            // Upload if it's a new file (blob)
            if (selectedFile) {
                const path = generateFilePath(currentUser.id, selectedFile.name);
                finalImageUrl = await uploadFile('service-posts', path, selectedFile);
            }

            const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
            const title = category.trim() || 'Service update';
            const description = content.trim();

            const postPayload = {
                category: category.trim(),
                location: locationField.trim(),
                caption: description,
                images: finalImageUrl ? [finalImageUrl] : [],
                tags: tags
            };

            if (editingId != null) {
                await updateServicePost(editingId, postPayload);
                toast.success('Post updated');
            } else {
                await createServicePost(postPayload);
                toast.success('Post published');
            }
            navigate('/provider/profile?tab=services');
        } catch (error) {
            console.error('Publish error:', error);
            toast.error(editingId != null ? 'Could not update post' : 'Could not publish post');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex font-sans text-gray-900">
            <ProviderSidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopNavbar breadcrumbs={['Profile', editingId != null ? 'Edit post' : 'New post']} />
                <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
                    <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto">

                        <div className="bg-white border border-gray-200 rounded-2xl sm:rounded-[20px] overflow-hidden shadow-sm">
                            <div className="p-4 sm:p-6 flex items-start justify-between gap-2">
                                <div className="flex gap-3 sm:gap-4 items-start min-w-0 flex-1">
                                    <div className="relative shrink-0">
                                        <img src={avatarSrc} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-100" />
                                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                                            <span className="material-icons text-blue-500 text-[12px] sm:text-[14px]" title="Verified">verified</span>
                                        </div>
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <h3 className="font-extrabold text-[14px] sm:text-[15px] text-gray-900 tracking-wide">{displayName}</h3>
                                        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-x-1 text-[11px] sm:text-[12px] text-gray-500 font-medium">
                                            <input
                                                type="text"
                                                value={category}
                                                onChange={e => setCategory(e.target.value)}
                                                placeholder="Category (e.g. Electrical)"
                                                className="max-w-[180px] rounded-lg border border-gray-200 px-2 py-1.5 text-gray-800 font-medium outline-none focus:border-[#10B981] text-[12px]"
                                            />
                                            <span className="hidden sm:inline text-gray-300">•</span>
                                            <span className="inline-flex items-center gap-1 min-w-0">
                                                <span className="material-icons-outlined text-[14px] shrink-0">location_on</span>
                                                <input
                                                    type="text"
                                                    value={locationField}
                                                    onChange={e => setLocationField(e.target.value)}
                                                    placeholder="Location"
                                                    className="min-w-0 flex-1 sm:max-w-[220px] rounded-lg border border-gray-200 px-2 py-1.5 text-gray-800 outline-none focus:border-[#10B981] text-[12px]"
                                                />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="text-gray-400 hover:text-gray-900 p-1.5 sm:p-2 rounded-full hover:bg-gray-50 shrink-0"
                                    aria-label="Close"
                                >
                                    <span className="material-icons-outlined text-[20px]">close</span>
                                </button>
                            </div>

                            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                                <textarea
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    placeholder="Share what you worked on, tips for customers, or a recent project…"
                                    rows={5}
                                    className="w-full text-[14px] sm:text-[15px] text-gray-800 leading-relaxed font-medium mb-3 sm:mb-4 bg-transparent border border-gray-200 rounded-xl px-3 py-3 outline-none focus:border-gray-400 resize-y min-h-[120px]"
                                />

                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
                                {imagePreview ? (
                                    <div className="relative w-full h-48 sm:h-64 md:h-72 rounded-xl sm:rounded-2xl overflow-hidden mb-3 sm:mb-4 border border-gray-100 bg-gray-50">
                                        <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={clearImage}
                                            className="absolute top-2 right-2 bg-white/90 text-gray-800 rounded-full p-1.5 shadow border border-gray-200 hover:bg-white"
                                        >
                                            <span className="material-icons-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full h-36 sm:h-44 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 text-sm font-semibold hover:border-gray-300 hover:bg-gray-50/50 transition-colors mb-3 sm:mb-4 flex flex-col items-center justify-center gap-1"
                                    >
                                        <span className="material-icons-outlined text-2xl">add_photo_alternate</span>
                                        Add photo (optional)
                                    </button>
                                )}

                                <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Hashtags</label>
                                <input
                                    type="text"
                                    value={tagsInput}
                                    onChange={e => setTagsInput(e.target.value)}
                                    placeholder="Smart Home, Rewiring — comma separated"
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#10B981] text-gray-800"
                                />
                                <p className="text-xs text-gray-400 mt-1">Shown as #tags like on the feed</p>
                            </div>

                            <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-end gap-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="text-[13px] sm:text-sm font-bold text-gray-500 px-4 py-2.5 rounded-xl hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={handlePublish}
                                    className="text-[12px] sm:text-sm font-extrabold bg-[#10B981] text-white px-5 sm:px-6 py-2.5 rounded-lg sm:rounded-xl hover:bg-[#059669] transition-colors disabled:opacity-50"
                                >
                                    {submitting ? (editingId != null ? 'Saving…' : 'Publishing…') : (editingId != null ? 'Save changes' : 'Publish')}
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            <ProviderMobileNavBar />
        </div>
    );
};

export default CreateServicePost;
