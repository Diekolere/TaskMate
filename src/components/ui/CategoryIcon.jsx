import React from 'react';

const icons = {
    plumbing: {
        color: 'bg-blue-50 text-blue-500',
        svg: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 3v6a2 2 0 0 0 2 2h3" />
                <path d="M19 3v6a2 2 0 0 1-2 2h-3" />
                <path d="M10 13h4" />
                <path d="M10 13v6a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-6" />
                <path d="M14 13v6a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-6" />
                <circle cx="12" cy="13" r="1" fill="currentColor" stroke="none" />
            </svg>
        ),
    },
    electrical: {
        color: 'bg-yellow-50 text-yellow-500',
        svg: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" fillOpacity="0.15" />
                <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
        ),
    },
    cleaning: {
        color: 'bg-teal-50 text-teal-500',
        svg: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21l9-9" />
                <path d="M12.22 6.22L16 2.5a1 1 0 0 1 1.41 0l4.09 4.08a1 1 0 0 1 0 1.42L17.72 11.8" />
                <path d="M5.5 14.5c-.83 2.17-.5 4.17 1 5.5 1.83 1.67 5 1.33 6.5-1l1-3-5.5-5.5-3 1z" />
            </svg>
        ),
    },
    carpentry: {
        color: 'bg-orange-50 text-orange-500',
        svg: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
        ),
    },
    painting: {
        color: 'bg-purple-50 text-purple-500',
        svg: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 3H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
                <path d="M12 11v9" />
                <path d="M9 21h6" />
                <path d="M7 7h0" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M12 7h0" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M17 7h0" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
        ),
    },
    moving: {
        color: 'bg-indigo-50 text-indigo-500',
        svg: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="1" />
                <path d="M16 8h4l3 5v3h-7V8z" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
        ),
    },
    landscaping: {
        color: 'bg-green-50 text-green-600',
        svg: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22V12" />
                <path d="M12 12C12 12 7 9 7 5a5 5 0 0 1 10 0c0 4-5 7-5 7z" fill="currentColor" fillOpacity="0.12" />
                <path d="M12 16C12 16 8 14 6 11" />
                <path d="M12 16C12 16 16 14 18 11" />
            </svg>
        ),
    },
    hvac: {
        color: 'bg-sky-50 text-sky-500',
        svg: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="2" x2="12" y2="6" />
                <line x1="12" y1="18" x2="12" y2="22" />
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                <line x1="2" y1="12" x2="6" y2="12" />
                <line x1="18" y1="12" x2="22" y2="12" />
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                <circle cx="12" cy="12" r="4" />
            </svg>
        ),
    },
    security: {
        color: 'bg-slate-50 text-slate-500',
        svg: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" fillOpacity="0.1" />
                <path d="M9 12l2 2 4-4" />
            </svg>
        ),
    },
    general: {
        color: 'bg-gray-100 text-gray-500',
        svg: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
        ),
    },
};

const keyMap = {
    plumbing: 'plumbing',
    electrical: 'electrical',
    electric: 'electrical',
    cleaning: 'cleaning',
    'cleaning services': 'cleaning',
    carpentry: 'carpentry',
    woodwork: 'carpentry',
    painting: 'painting',
    'painting & decorating': 'painting',
    decorating: 'painting',
    moving: 'moving',
    landscaping: 'landscaping',
    gardening: 'landscaping',
    hvac: 'hvac',
    'hvac & ac repair': 'hvac',
    'ac repair': 'hvac',
    'air conditioning': 'hvac',
    security: 'security',
    'home security': 'security',
};

export function getCategoryKey(category = '') {
    const lower = category.toLowerCase().trim();
    return keyMap[lower] || 'general';
}

/**
 * CategoryIcon — renders the correct SVG icon in a coloured square
 * size: 'sm' (32px) | 'md' (44px, default) | 'lg' (52px)
 */
export default function CategoryIcon({ category = '', size = 'md' }) {
    const key = getCategoryKey(category);
    const icon = icons[key] || icons.general;

    const dim = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-13 h-13' : 'w-11 h-11';
    const svg = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : 'w-5 h-5';

    return (
        <div className={`${dim} ${icon.color} rounded-xl shrink-0 flex items-center justify-center`}>
            <span className={svg}>{icon.svg}</span>
        </div>
    );
}
