import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const defaultPost = {
    title: '',
    category: '',
    location: '',
    description: '',
    image: '',
    tags: '',
};

const ServicePosts = () => {
    const [posts, setPosts] = useState([]);
    const [post, setPost] = useState(defaultPost);

    const handleImageUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return;
        const url = URL.createObjectURL(file);
        setPost(prev => ({ ...prev, image: url }));
    };

    const handleRemoveImage = () => {
        setPost(prev => ({ ...prev, image: '' }));
    };

    const handleCreatePost = () => {
        if (!post.title || !post.category || !post.description) {
            return;
        }

        setPosts(prev => [
            {
                ...post,
                id: Date.now(),
                tags: post.tags.split(',').map(tag => tag.trim()).filter(Boolean),
                createdAt: new Date().toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }),
            },
            ...prev,
        ]);
        setPost(defaultPost);
    };

    return (
        <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 p-6 sm:p-7 border-b border-slate-200">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Service Showcase</p>
                        <h3 className="text-lg font-semibold text-slate-900">Create a service post</h3>
                        <p className="max-w-2xl text-sm leading-6 text-slate-500">
                            Share a recent project on your profile — opens the same composer customers see on the feed.
                        </p>
                    </div>
                    <Link
                        to="/provider/posts/new"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#10B981]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#10B981] hover:bg-[#10B981]/5 transition-colors shrink-0"
                    >
                        <span className="material-icons-outlined text-base">post_add</span>
                        New post
                    </Link>
                </div>
            </div>

            <div className="p-6 sm:p-7 space-y-6">
                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-4">
                        <label className="block text-sm font-semibold text-slate-700">Service headline</label>
                        <input
                            value={post.title}
                            onChange={e => setPost(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="E.g. Smart-home rewiring completed"
                            className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/15"
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="block text-sm font-semibold text-slate-700">Service category</label>
                        <input
                            value={post.category}
                            onChange={e => setPost(prev => ({ ...prev, category: e.target.value }))}
                            placeholder="E.g. Electrical, Plumbing, Carpentry"
                            className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/15"
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="block text-sm font-semibold text-slate-700">Location</label>
                        <input
                            value={post.location}
                            onChange={e => setPost(prev => ({ ...prev, location: e.target.value }))}
                            placeholder="E.g. Victoria Island, Lagos"
                            className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/15"
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="block text-sm font-semibold text-slate-700">Project image</label>
                        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                            {post.image ? (
                                <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white">
                                    <img src={post.image} alt="Project preview" className="h-56 w-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="absolute right-3 top-3 inline-flex items-center justify-center rounded-full bg-white/90 p-2 text-slate-700 shadow-sm hover:bg-white"
                                    >
                                        <span className="material-icons-outlined text-base">close</span>
                                    </button>
                                </div>
                            ) : (
                                <label className="group flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[24px] border-2 border-dashed border-slate-300 bg-white/80 px-4 py-8 text-center transition hover:border-[#10B981] hover:text-[#10B981]">
                                    <span className="material-icons-outlined text-4xl text-slate-400 group-hover:text-[#10B981]">cloud_upload</span>
                                    <span className="text-sm font-semibold text-slate-700">Upload a project image</span>
                                    <span className="text-xs text-slate-400">PNG, JPG, JPEG. Max 5MB</span>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                </label>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-700">Description</label>
                    <textarea
                        value={post.description}
                        onChange={e => setPost(prev => ({ ...prev, description: e.target.value }))}
                        rows={5}
                        placeholder="Describe the project, outcome and value delivered…"
                        className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none transition focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/15 resize-none"
                    />
                </div>

                <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-700">Tags</label>
                    <input
                        value={post.tags}
                        onChange={e => setPost(prev => ({ ...prev, tags: e.target.value }))}
                        placeholder="#SmartHome, #Rewiring"
                        className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/15"
                    />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm leading-6 text-slate-500">
                        Publish your update with an image, location and short description to engage customers.
                    </p>
                    <button
                        type="button"
                        onClick={handleCreatePost}
                        disabled={!post.title || !post.category || !post.description}
                        className="inline-flex items-center justify-center rounded-2xl bg-[#0F172A] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-200/40 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                    >
                        Publish Post
                    </button>
                </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 p-5 space-y-4">
                {posts.length === 0 ? (
                    <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
                        <p className="font-semibold text-slate-900">No service posts yet</p>
                        <p className="text-sm mt-2">Use the form above to share a recent project or service update.</p>
                    </div>
                ) : (
                    posts.map(postItem => (
                        <article key={postItem.id} className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden transition hover:shadow-md">
                            <div className="space-y-5 p-6">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <p className="text-xl font-semibold text-slate-900">{postItem.title}</p>
                                        <p className="text-sm text-slate-500 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">{postItem.category} · {postItem.location || 'Location not set'}</p>
                                    </div>
                                    <span className="inline-flex items-center rounded-full bg-[#10B981]/10 px-4 py-2 text-sm font-semibold text-[#10B981]">
                                        {postItem.createdAt}
                                    </span>
                                </div>
                                {postItem.image && (
                                    <div className="overflow-hidden rounded-[24px] border border-slate-100 bg-slate-100">
                                        <img src={postItem.image} alt={postItem.title} className="h-64 w-full object-cover" />
                                    </div>
                                )}
                                <p className="text-sm leading-7 text-slate-600">{postItem.description}</p>
                                {postItem.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {postItem.tags.map(tag => (
                                            <span key={tag} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">#{tag.replace(/^#/, '')}</span>
                                        ))}
                                    </div>
                                )}
                                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                    <button type="button" className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-2 text-slate-700 transition hover:bg-slate-100">
                                        <span className="material-icons-outlined text-base">thumb_up</span>
                                        Like
                                    </button>
                                    <button type="button" className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-2 text-slate-700 transition hover:bg-slate-100">
                                        <span className="material-icons-outlined text-base">chat_bubble_outline</span>
                                        Comment
                                    </button>
                                    <button type="button" className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-2 text-slate-700 transition hover:bg-slate-100">
                                        <span className="material-icons-outlined text-base">share</span>
                                        Share
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))
                )}
            </div>
        </div>
    );
};

export default ServicePosts;
