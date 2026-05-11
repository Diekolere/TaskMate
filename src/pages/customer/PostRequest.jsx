import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/layout/Sidebar';
import TopNavbar from '../../components/layout/TopNavbar';
import MobileNavBar from '../../components/layout/MobileNavBar';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import useImageModeration from '../../hooks/useImageModeration';
import { enrichDescription } from '../../lib/aiData';

const reverseGeocode = async (lat, lon, retries = 2) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 6000);
            const res = await fetch(url, {
                signal: controller.signal,
                headers: { 'Accept-Language': 'en' }
            });
            clearTimeout(timeout);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (data?.display_name) return data.display_name;
            throw new Error('No display_name in response');
        } catch (err) {
            if (attempt === retries) throw err;
            await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        }
    }
    return null;
};

// ── Custom calendar ──────────────────────────────────────────────────────────
const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function Calendar({ value, onChange }) {
    const today = new Date(); today.setHours(0,0,0,0);
    const init = value ? new Date(value) : new Date();
    const [viewYear, setViewYear] = useState(init.getFullYear());
    const [viewMonth, setViewMonth] = useState(init.getMonth());

    const prev = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y-1)) : setViewMonth(m => m-1);
    const next = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y+1)) : setViewMonth(m => m+1);

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();
    const cells = [...Array(firstDay).fill(null), ...Array.from({length: daysInMonth}, (_,i) => i+1)];

    const selDate = value ? new Date(value) : null;
    if (selDate) selDate.setHours(0,0,0,0);

    const select = (d) => {
        if (!d) return;
        const clicked = new Date(viewYear, viewMonth, d); clicked.setHours(0,0,0,0);
        if (clicked < today) return;
        onChange(clicked.toISOString().split('T')[0]);
    };
    const isToday = (d) => d && d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
    const isSel = (d) => d && selDate && d === selDate.getDate() && viewMonth === selDate.getMonth() && viewYear === selDate.getFullYear();
    const isPast = (d) => d && new Date(viewYear, viewMonth, d) < today;

    return (
        <div className="select-none">
            <div className="flex items-center justify-between mb-4">
                <button type="button" onClick={prev} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                    <span className="material-icons-outlined text-gray-400 text-[18px]">chevron_left</span>
                </button>
                <p className="text-sm font-bold text-gray-900">{MONTH_NAMES[viewMonth]} {viewYear}</p>
                <button type="button" onClick={next} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                    <span className="material-icons-outlined text-gray-400 text-[18px]">chevron_right</span>
                </button>
            </div>

            <div className="grid grid-cols-7 mb-1">
                {DAY_NAMES.map(d => <div key={d} className="text-center text-[10px] font-bold text-gray-300 uppercase py-1">{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-y-0.5">
                {cells.map((d, i) => (
                    <button key={i} type="button" onClick={() => select(d)} disabled={!d || isPast(d)}
                        className={`h-8 w-full flex items-center justify-center rounded-lg text-[13px] font-semibold transition-all
                            ${!d ? 'pointer-events-none' : ''}
                            ${isPast(d) ? 'text-gray-200 cursor-not-allowed' : ''}
                            ${isSel(d) ? 'bg-[#10B981] text-white shadow-sm' : ''}
                            ${isToday(d) && !isSel(d) ? 'text-[#10B981] ring-2 ring-[#10B981]/25 bg-green-50' : ''}
                            ${d && !isPast(d) && !isSel(d) && !isToday(d) ? 'text-gray-700 hover:bg-gray-100' : ''}
                        `}>
                        {d || ''}
                    </button>
                ))}
            </div>

            {value && (
                <button type="button" onClick={() => onChange(null)}
                    className="mt-3 text-[11px] font-semibold text-gray-300 hover:text-red-400 transition-colors w-full text-center">
                    Clear date
                </button>
            )}
        </div>
    );
}

// ── Image slot ───────────────────────────────────────────────────────────────
function ImageSlot({ index, preview, approved, checking, onRemove }) {
    if (!preview) {
        return (
            <div className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1.5 bg-gray-50">
                <span className="material-icons-outlined text-gray-200 text-2xl">image</span>
                <p className="text-[10px] font-semibold text-gray-300">Photo {index + 1}</p>
            </div>
        );
    }
    return (
        <div className="relative aspect-square rounded-xl overflow-hidden group">
            <img src={preview} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
            {checking && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1">
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <p className="text-white text-[9px] font-bold">Checking…</p>
                </div>
            )}
            {approved && !checking && (
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    <span className="material-icons-outlined text-[10px]">verified</span> OK
                </div>
            )}
            <button type="button" onClick={onRemove}
                className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <span className="material-icons-outlined text-[12px]">close</span>
            </button>
        </div>
    );
}

// ── Urgency options ──────────────────────────────────────────────────────────
const URGENCY_OPTIONS = [
    { val: 'low',    icon: 'hourglass_empty', label: 'Low',       sub: 'Within a week',   color: 'green' },
    { val: 'medium', icon: 'schedule',        label: 'Medium',    sub: 'Within 48 hrs',   color: 'green' },
    { val: 'high',   icon: 'priority_high',   label: 'Emergency', sub: 'ASAP',            color: 'red'   },
];

// ── Field style shorthand ────────────────────────────────────────────────────
const FIELD = "block w-full rounded-xl border border-gray-200 py-3 px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/15 transition-all bg-white";
const LABEL = "block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-2";

const CATEGORIES = ['Plumbing','Electrical','Cleaning','Moving','Painting','Carpentry','Landscaping','Other'];

const CATEGORY_META = {
    Plumbing:    { icon: 'water_drop',    color: 'text-blue-500',   bg: 'bg-blue-50' },
    Electrical:  { icon: 'bolt',          color: 'text-yellow-500', bg: 'bg-yellow-50' },
    Cleaning:    { icon: 'cleaning_services', color: 'text-cyan-500',   bg: 'bg-cyan-50' },
    Moving:      { icon: 'local_shipping', color: 'text-indigo-500', bg: 'bg-indigo-50' },
    Painting:    { icon: 'format_paint',  color: 'text-pink-500',   bg: 'bg-pink-50' },
    Carpentry:   { icon: 'handyman',      color: 'text-amber-600',  bg: 'bg-amber-50' },
    Landscaping: { icon: 'yard',          color: 'text-green-600',  bg: 'bg-green-50' },
    Other:       { icon: 'build',         color: 'text-gray-500',   bg: 'bg-gray-100' },
};

function CategorySelect({ value, onChange, disabled }) {
    const [open, setOpen] = useState(false);
    const ref = useRef();

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selected = value ? CATEGORY_META[value] : null;

    return (
        <div ref={ref} className="relative">
            <button type="button" disabled={disabled}
                onClick={() => !disabled && setOpen(o => !o)}
                className={`w-full flex items-center gap-2.5 px-4 py-3 border rounded-xl text-sm transition-all ${
                    open ? 'border-[#10B981] ring-2 ring-[#10B981]/15' : 'border-gray-200 hover:border-gray-300'
                } ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white cursor-pointer'}`}>
                {selected ? (
                    <>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${selected.bg}`}>
                            <span className={`material-icons-outlined text-[14px] ${selected.color}`}>{selected.icon}</span>
                        </div>
                        <span className="flex-1 text-left font-medium text-gray-900">{value}</span>
                    </>
                ) : (
                    <span className="flex-1 text-left text-gray-400">Select a category</span>
                )}
                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }}
                    className="material-icons-outlined text-gray-300 text-[18px] shrink-0">expand_more</motion.span>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scaleY: 0.96 }}
                        animate={{ opacity: 1, y: 0, scaleY: 1 }}
                        exit={{ opacity: 0, y: -6, scaleY: 0.96 }}
                        transition={{ duration: 0.14 }}
                        style={{ transformOrigin: 'top' }}
                        className="absolute z-30 top-[calc(100%+6px)] left-0 right-0 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden"
                    >
                        {CATEGORIES.map(cat => {
                            const meta = CATEGORY_META[cat];
                            const sel = value === cat;
                            return (
                                <button key={cat} type="button"
                                    onClick={() => { onChange(cat); setOpen(false); }}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                        sel ? 'bg-green-50 text-[#10B981]' : 'text-gray-700 hover:bg-gray-50'
                                    }`}>
                                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}>
                                        <span className={`material-icons-outlined text-[15px] ${meta.color}`}>{meta.icon}</span>
                                    </div>
                                    <span className={`font-medium ${sel ? 'text-[#10B981]' : ''}`}>{cat}</span>
                                    {sel && <span className="ml-auto material-icons-outlined text-[#10B981] text-[16px]">check</span>}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Form body (shared between modal and page) ────────────────────────────────
function PostRequestForm({ onClose, isModal }) {
    const navigate = useNavigate();
    const location = useLocation();

    const editingRequest = location.state?.request;
    const providerId = location.state?.providerId || editingRequest?.providerId;
    const providerName = location.state?.providerName || editingRequest?.providerName;
    const initialCategory = location.state?.category || editingRequest?.category;

    const { createRequest } = useData();
    const { currentUser } = useAuth();
    const { checkImage } = useImageModeration();

    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState(editingRequest?.title || '');
    const [description, setDescription] = useState(editingRequest?.description || '');
    const [category, setCategory] = useState(initialCategory || '');
    const [urgency, setUrgency] = useState(editingRequest?.urgency || null);
    const [scheduledDate, setScheduledDate] = useState(editingRequest?.scheduledDate || null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [enriching, setEnriching] = useState(false);
    const [address, setAddress] = useState(editingRequest?.location || currentUser?.location_name || '');
    const fileInputRef = useRef();

    const initImages = () => {
        const existing = editingRequest?.images || [];
        return Array.from({length: 3}, (_, i) => ({
            preview: existing[i] || null,
            approved: !!existing[i],
            checking: false,
        }));
    };
    const [images, setImages] = useState(initImages);

    // Geolocation on mount
    useEffect(() => {
        if (address) return;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => {
                reverseGeocode(pos.coords.latitude, pos.coords.longitude)
                    .then(name => name && setAddress(name))
                    .catch(() => toast.info('Could not auto-detect address. Please enter it manually.'));
            }, () => {});
        }
    }, []);

    // Multi-image selection
    const handleFilesSelected = async (files) => {
        const slots = images.filter(i => !i.preview).map((_, si) => si); // empty slot indices
        const toProcess = Array.from(files).slice(0, slots.length); // max fill empty slots
        if (toProcess.length === 0) { toast.error('All photo slots are filled'); return; }

        // Immediately show previews with checking state
        const previews = toProcess.map(f => URL.createObjectURL(f));
        setImages(prev => {
            const updated = [...prev];
            toProcess.forEach((f, pi) => {
                const idx = slots[pi];
                updated[idx] = { preview: previews[pi], approved: false, checking: true };
            });
            return updated;
        });

        // Run moderation in parallel
        await Promise.all(toProcess.map(async (file, pi) => {
            const idx = slots[pi];
            const { passed, reason } = await checkImage(file);
            setImages(prev => {
                const updated = [...prev];
                if (passed) {
                    updated[idx] = { ...updated[idx], approved: true, checking: false };
                } else {
                    updated[idx] = { preview: null, approved: false, checking: false };
                    toast.error(`Photo ${idx + 1} removed`, { description: reason });
                }
                return updated;
            });
        }));
    };

    const handleRemoveImage = (idx) => {
        setImages(prev => prev.map((img, i) => i === idx ? { preview: null, approved: false, checking: false } : img));
    };

    const handleEnrich = async () => {
        if (!description.trim()) { toast.error('Write a description first'); return; }
        setEnriching(true);
        await new Promise(r => setTimeout(r, 1200));
        setDescription(enrichDescription(description, category));
        setEnriching(false);
        toast.success('Description improved');
    };

    const formatDate = (iso) => {
        if (!iso) return null;
        return new Date(iso).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) { toast.error('Please add a task title'); return; }
        if (!description.trim()) { toast.error('Please describe the task'); return; }
        setLoading(true);

        const imagePreviews = images.filter(i => i.preview).map(i => i.preview);
        const data = {
            title: title.trim(), category, description: description.trim(),
            location: address,
            urgency: urgency || 'medium',
            scheduledDate: scheduledDate || null,
            images: imagePreviews,
            image: imagePreviews[0] || null,
            providerId: providerId || null,
            providerName: providerName || null,
            status: providerId ? 'pending' : 'open',
            customerPhone: currentUser?.phoneNumber || null,
        };

        try {
            if (editingRequest) {
                toast.info('Update logic not yet migrated to Supabase.');
            } else {
                data.timeline = [{ title: 'Request Posted', description: 'Your request has been submitted.', time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}), date: new Date().toDateString(), status: 'completed' }];
                await createRequest(data);
                toast.success('Request posted!');
            }
            onClose ? onClose() : navigate('/customer/requests');
        } catch (err) {
            console.error(err);
            toast.error('Failed to post request.');
        } finally {
            setLoading(false);
        }
    };

    const filledCount = images.filter(i => i.preview).length;

    return (
        <form onSubmit={handleSubmit} className="flex flex-col">
            {/* ── Body ── */}
            <div className="space-y-7">

                {/* Title + Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <label className={LABEL} htmlFor="title">Task Title</label>
                        <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)}
                            placeholder="e.g., Fix leaking sink in kitchen"
                            className={FIELD} />
                    </div>
                    <div>
                        <label className={LABEL}>Category</label>
                        <CategorySelect value={category} onChange={setCategory} disabled={!!initialCategory} />
                        {initialCategory && <p className="text-xs text-gray-400 mt-1.5">Category is pre-set for this provider.</p>}
                    </div>
                </div>

                {/* Description */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className={LABEL.replace('mb-2','')}>Description</label>
                        <button type="button" onClick={handleEnrich} disabled={enriching || !description.trim()}
                            className="flex items-center gap-1 text-[11px] font-bold text-[#10B981] hover:text-[#059669] bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                            {enriching
                                ? <div className="w-3 h-3 rounded-full border-2 border-[#10B981]/30 border-t-[#10B981] animate-spin" />
                                : <span className="material-icons-outlined text-[13px]">auto_fix_high</span>}
                            {enriching ? 'Improving...' : 'Improve with AI'}
                        </button>
                    </div>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                        placeholder="Describe the task in detail - what's the problem, any specific requirements..."
                        className={`${FIELD} resize-none`} />
                </div>

                {/* Photos */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label className={LABEL.replace('mb-2','mb-0')}>Photos <span className="text-gray-300 normal-case font-medium tracking-normal text-[11px]">(optional, up to 3)</span></label>
                        <span className="text-[11px] font-medium text-gray-400">{filledCount}/3</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {images.map((img, idx) => (
                            <ImageSlot key={idx} index={idx} preview={img.preview}
                                approved={img.approved} checking={img.checking}
                                onRemove={() => handleRemoveImage(idx)} />
                        ))}
                    </div>

                    {filledCount < 3 && (
                        <button type="button" onClick={() => fileInputRef.current?.click()}
                            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-gray-200 hover:border-[#10B981]/50 hover:bg-green-50/40 transition-all text-sm font-semibold text-gray-400 hover:text-[#10B981]">
                            <span className="material-icons-outlined text-[18px]">add_photo_alternate</span>
                            {filledCount === 0 ? 'Add photos' : 'Add more photos'}
                        </button>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                        onChange={e => { handleFilesSelected(e.target.files); e.target.value = ''; }} />
                    <p className="text-[11px] text-gray-300 font-medium mt-2 flex items-center gap-1">
                        <span className="material-icons-outlined text-[11px] text-[#10B981]">security</span>
                        AI content moderation runs on every upload.
                    </p>
                </div>

                {/* Schedule + Urgency — side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

                    {/* Schedule */}
                    <div>
                        <label className={LABEL}>Book in Advance <span className="text-gray-300 normal-case font-medium tracking-normal text-[11px]">(optional)</span></label>
                        <div className="rounded-2xl border border-gray-200 overflow-hidden">
                            <button type="button" onClick={() => setShowCalendar(v => !v)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${scheduledDate ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-400'}`}>
                                    <span className="material-icons-outlined text-[17px]">event</span>
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-0.5">Preferred Date</p>
                                    <p className={`text-sm font-semibold ${scheduledDate ? 'text-gray-900' : 'text-gray-300'}`}>
                                        {scheduledDate ? formatDate(scheduledDate) : 'No date selected'}
                                    </p>
                                </div>
                                <motion.span animate={{ rotate: showCalendar ? 180 : 0 }} transition={{ duration: 0.18 }}
                                    className="material-icons-outlined text-gray-300 text-[18px] shrink-0">expand_more</motion.span>
                            </button>

                            <AnimatePresence>
                                {showCalendar && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
                                        className="overflow-hidden border-t border-gray-100">
                                        <div className="p-4">
                                            <Calendar value={scheduledDate}
                                                onChange={d => { setScheduledDate(d); if (d) setShowCalendar(false); }} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <p className="text-[11px] text-gray-300 font-medium mt-2">Providers with availability on this date are ranked higher.</p>
                    </div>

                    {/* Urgency — horizontal cards */}
                    <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <label className={LABEL.replace('mb-2','mb-0')}>Urgency <span className="text-gray-300 normal-case font-medium tracking-normal text-[11px]">(optional)</span></label>
                            {urgency && (
                                <button type="button" onClick={() => setUrgency(null)}
                                    className="text-[11px] font-semibold text-gray-300 hover:text-red-400 transition-colors">
                                    Clear
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-3 gap-2.5 h-[calc(100%-2rem)]">
                            {URGENCY_OPTIONS.map(({ val, label, sub }) => {
                                const sel = urgency === val;
                                const styles = {
                                    low:    { base: 'bg-yellow-400 border-yellow-400', active: 'bg-yellow-500 border-yellow-500 ring-2 ring-yellow-300', label: 'text-white', sub: 'text-yellow-100', dot: 'bg-white/30' },
                                    medium: { base: 'bg-orange-400 border-orange-400', active: 'bg-orange-500 border-orange-500 ring-2 ring-orange-300', label: 'text-white', sub: 'text-orange-100', dot: 'bg-white/30' },
                                    high:   { base: 'bg-red-500 border-red-500',       active: 'bg-red-600 border-red-600 ring-2 ring-red-300',           label: 'text-white', sub: 'text-red-100',    dot: 'bg-white/30' },
                                };
                                const s = styles[val];
                                return (
                                    <button key={val} type="button" onClick={() => setUrgency(sel ? null : val)}
                                        className={`relative flex flex-col items-center justify-center gap-1 px-2 rounded-2xl border-2 transition-all text-center w-full h-full min-h-[80px] ${sel ? s.active : s.base}`}>
                                        <p className={`text-[13px] font-bold leading-tight ${s.label}`}>{label}</p>
                                        <p className={`text-[10px] leading-tight ${s.sub}`}>{sub}</p>
                                        {sel && (
                                            <div className={`absolute top-2 right-2 w-3.5 h-3.5 rounded-full flex items-center justify-center ${s.dot}`}>
                                                <span className="material-icons-outlined text-white text-[9px]">check</span>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* Location — text only, no map */}
                <div>
                    <label className={LABEL}>Service Location</label>
                    <div className="relative">
                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 material-icons-outlined text-gray-300 text-[19px]">place</span>
                        <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                            placeholder="Enter the service address"
                            className={`${FIELD} pl-10 pr-36`} />
                        <button type="button"
                            onClick={() => {
                                if (!navigator.geolocation) return;
                                navigator.geolocation.getCurrentPosition(pos => {
                                    reverseGeocode(pos.coords.latitude, pos.coords.longitude)
                                        .then(name => name && setAddress(name))
                                        .catch(() => toast.error('Location lookup failed. Enter address manually.'));
                                });
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#10B981] text-[11px] font-bold flex items-center gap-1 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                            <span className="material-icons-outlined text-[13px]">my_location</span>
                            Use my location
                        </button>
                    </div>
                </div>

            </div>

            {/* ── Footer buttons ── */}
            <div className="flex items-center justify-end border-t border-gray-100 pt-6 mt-7">
                <button type="submit" disabled={loading}
                    className="px-8 py-2.5 text-sm font-bold rounded-xl text-white bg-[#10B981] hover:bg-[#059669] flex items-center gap-2 transition-all shadow-sm shadow-[#10B981]/25 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading
                        ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        : <><span className="material-icons-outlined text-[15px]">send</span>Post Request</>
                    }
                </button>
            </div>
        </form>
    );
}

// ── Main export ──────────────────────────────────────────────────────────────
const PostRequest = () => {
    const navigate = useNavigate();
    const close = () => navigate('/customer/requests');

    return (
        <div className="flex h-screen bg-white font-sans text-gray-900">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopNavbar breadcrumbs={['Customer', 'Post Request']} />

                <main className="flex-1 overflow-y-auto bg-white">
                    <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8 pb-24 md:pb-10">

                        {/* Page header */}
                        <div className="mb-8">
                            <button onClick={close} className="inline-flex items-center text-xs font-semibold text-gray-400 hover:text-[#10B981] transition-colors mb-3">
                                <span className="material-icons-outlined text-base mr-1">arrow_back</span>
                                My Requests
                            </button>
                            <h1 className="text-[22px] sm:text-[28px] font-extrabold text-gray-900 tracking-tight">Post a Request</h1>
                            <p className="mt-1 text-[13px] font-medium text-gray-400">Describe your task and let skilled providers come to you.</p>
                        </div>

                        <PostRequestForm onClose={close} isModal={false} />
                    </div>
                </main>

                <MobileNavBar />
            </div>
        </div>
    );
};

export default PostRequest;
