export const getCategoryIcon = (cat) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('plumb')) return 'plumbing';
    if (c.includes('clean')) return 'cleaning_services';
    if (c.includes('elec')) return 'electrical_services';
    if (c.includes('paint')) return 'format_paint';
    if (c.includes('weld')) return 'hardware';
    if (c.includes('carp')) return 'chair';
    if (c.includes('build') || c.includes('construct')) return 'construction';
    if (c.includes('mechanic')) return 'car_repair';
    if (c.includes('garden') || c.includes('landscap')) return 'grass';
    if (c.includes('roof')) return 'roofing';
    if (c.includes('pest')) return 'pest_control';
    if (c.includes('ac ') || c.includes('hvac')) return 'ac_unit';
    if (c.includes('appliance')) return 'kitchen';
    if (c.includes('mov')) return 'local_shipping';
    if (c.includes('laundry')) return 'local_laundry_service';
    return 'build'; // Fallback icon
};

export const getCategoryColors = (cat) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('plumb')) return { color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' };
    if (c.includes('clean')) return { color: 'text-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-100' };
    if (c.includes('elec')) return { color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-100' };
    if (c.includes('paint')) return { color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-100' };
    if (c.includes('weld')) return { color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' };
    if (c.includes('carp') || c.includes('furniture')) return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' };
    if (c.includes('build') || c.includes('construct')) return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' };
    if (c.includes('mechanic')) return { color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-200' };
    if (c.includes('garden') || c.includes('landscap')) return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' };
    if (c.includes('roof')) return { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100' };
    if (c.includes('pest')) return { color: 'text-lime-600', bg: 'bg-lime-50', border: 'border-lime-100' };
    if (c.includes('ac ') || c.includes('hvac')) return { color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' };
    if (c.includes('appliance')) return { color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' };
    if (c.includes('mov')) return { color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100' };
    if (c.includes('laundry')) return { color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' };
    return { color: 'text-gray-500', bg: 'bg-gray-100', border: 'border-gray-200' }; // Fallback colors
};

