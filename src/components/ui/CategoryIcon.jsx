import React from 'react';
import { getCategoryIcon, getCategoryColors } from '../../lib/utils';

/**
 * CategoryIcon — renders the emoji icon for the category
 * size: 'sm' (32px) | 'md' (44px, default) | 'lg' (52px)
 */
export default function CategoryIcon({ category = '', size = 'md' }) {
    const dim = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-13 h-13' : 'w-11 h-11';
    const textDim = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-lg';

    const colors = getCategoryColors(category);

    return (
        <div className={`${dim} ${colors.bg} ${colors.color} rounded-xl shrink-0 flex items-center justify-center border ${colors.border}`}>
            <span className={`material-icons-outlined ${textDim}`}>{getCategoryIcon(category)}</span>
        </div>
    );
}
