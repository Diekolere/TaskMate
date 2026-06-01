import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const CATEGORIES = [
  "Plumbing", "Electrical", "Furniture (Carpentry)", "Cleaning", "Painting",
  "HVAC", "Moving", "Roofing", "Appliance Repair", "Landscaping", "Laundry"
];

export const CATEGORY_META = {
    Plumbing:              { icon: 'water_drop',             color: 'text-blue-500',   bg: 'bg-blue-50' },
    Electrical:            { icon: 'bolt',                   color: 'text-yellow-500', bg: 'bg-yellow-50' },
    'Furniture (Carpentry)': { icon: 'chair',                  color: 'text-amber-600',  bg: 'bg-amber-50' },
    Cleaning:              { icon: 'cleaning_services',       color: 'text-cyan-500',   bg: 'bg-cyan-50' },
    Painting:              { icon: 'format_paint',           color: 'text-pink-500',   bg: 'bg-pink-50' },
    HVAC:                  { icon: 'ac_unit',                color: 'text-emerald-500', bg: 'bg-emerald-50' },
    Moving:                { icon: 'local_shipping',         color: 'text-indigo-500', bg: 'bg-indigo-50' },
    Roofing:               { icon: 'roofing',                color: 'text-slate-600',  bg: 'bg-slate-50' },
    'Appliance Repair':    { icon: 'kitchen',                color: 'text-red-500',    bg: 'bg-red-50' },
    Landscaping:           { icon: 'yard',                   color: 'text-green-600',  bg: 'bg-green-50' },
    Laundry:               { icon: 'local_laundry_service',  color: 'text-purple-500', bg: 'bg-purple-50' },
};

export default function CategoryFilterSelect({ value, onChange, className = '' }) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef();

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className={`relative ${className}`}>
            <button type="button"
                onClick={() => setIsOpen(o => !o)}
                className={`w-full flex items-center justify-between px-3 py-2 sm:py-3 border rounded-xl text-[13px] sm:text-sm transition-all ${
                    isOpen ? 'border-[#10B981] ring-2 ring-[#10B981]/15' : 'border-gray-200 hover:border-gray-300'
                } bg-white`}
            >
                {value && CATEGORY_META[value] ? (
                    <div className="flex items-center gap-1.5 truncate">
                        <span className={`material-icons-outlined text-[14px] ${CATEGORY_META[value].color}`}>{CATEGORY_META[value].icon}</span>
                        <span className="font-medium text-gray-900 truncate">{value}</span>
                    </div>
                ) : (
                    <span className="text-gray-500 truncate">All Categories</span>
                )}
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.15 }}
                    className="material-icons-outlined text-gray-400 text-[16px] sm:text-[18px] shrink-0">expand_more</motion.span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scaleY: 0.96 }}
                        animate={{ opacity: 1, y: 0, scaleY: 1 }}
                        exit={{ opacity: 0, y: -6, scaleY: 0.96 }}
                        transition={{ duration: 0.14 }}
                        style={{ transformOrigin: 'top' }}
                        className="absolute z-30 right-0 sm:left-0 top-[calc(100%+6px)] w-48 sm:w-full bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden"
                    >
                        <button type="button"
                            onClick={() => { onChange(''); setIsOpen(false); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] sm:text-sm transition-colors ${
                                !value ? 'bg-green-50 text-[#10B981]' : 'text-gray-700 hover:bg-gray-50'
                            }`}>
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-gray-100">
                                <span className="material-icons-outlined text-[14px] text-gray-400">apps</span>
                            </div>
                            <span className={`font-medium ${!value ? 'text-[#10B981]' : ''}`}>All Categories</span>
                        </button>
                        {CATEGORIES.map(cat => {
                            const meta = CATEGORY_META[cat];
                            const sel = value === cat;
                            return (
                                <button key={cat} type="button"
                                    onClick={() => { onChange(cat); setIsOpen(false); }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] sm:text-sm transition-colors ${
                                        sel ? 'bg-green-50 text-[#10B981]' : 'text-gray-700 hover:bg-gray-50'
                                    }`}>
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${meta.bg}`}>
                                        <span className={`material-icons-outlined text-[14px] ${meta.color}`}>{meta.icon}</span>
                                    </div>
                                    <span className={`font-medium truncate ${sel ? 'text-[#10B981]' : ''}`}>{cat}</span>
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
