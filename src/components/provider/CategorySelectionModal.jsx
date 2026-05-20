import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

const CATEGORIES = [
  { name: 'Plumbing', icon: 'water_drop', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', activeBg: 'bg-blue-100', badgeBg: 'bg-blue-500' },
  { name: 'Electrical', icon: 'bolt', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', activeBg: 'bg-yellow-100', badgeBg: 'bg-yellow-600' },
  { name: 'Furniture (Carpentry)', icon: 'chair', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', activeBg: 'bg-amber-100', badgeBg: 'bg-amber-600' },
  { name: 'Cleaning', icon: 'cleaning_services', color: 'text-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-200', activeBg: 'bg-cyan-100', badgeBg: 'bg-cyan-500' },
  { name: 'Painting', icon: 'format_paint', color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-200', activeBg: 'bg-pink-100', badgeBg: 'bg-pink-500' },
  { name: 'HVAC', icon: 'ac_unit', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', activeBg: 'bg-emerald-100', badgeBg: 'bg-emerald-500' },
  { name: 'Moving', icon: 'local_shipping', color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-200', activeBg: 'bg-indigo-100', badgeBg: 'bg-indigo-500' },
  { name: 'Roofing', icon: 'roofing', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', activeBg: 'bg-slate-100', badgeBg: 'bg-slate-600' },
  { name: 'Appliance Repair', icon: 'kitchen', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', activeBg: 'bg-red-100', badgeBg: 'bg-red-500' },
  { name: 'Landscaping', icon: 'yard', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', activeBg: 'bg-green-100', badgeBg: 'bg-green-600' },
  { name: 'Laundry', icon: 'local_laundry_service', color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200', activeBg: 'bg-purple-100', badgeBg: 'bg-purple-500' },
];

export default function CategorySelectionModal({ open, onClose }) {
  const { updateProviderProfile } = useAuth();
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const toggleCategory = (name) => {
    setSelected(prev => 
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };

  const handleSave = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    try {
      await updateProviderProfile({ trade_category: selected });
      if (onClose) onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#1a2b3c]/60 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="p-5 sm:p-8 text-center pb-2 sm:pb-4">
            <h2 className="text-xl sm:text-3xl font-bold text-[#1a2b3c] font-serif mb-1.5 sm:mb-2">
              Welcome to TaskMate!
            </h2>
            <p className="text-gray-500 text-xs sm:text-base px-2 sm:px-6">
              Before you can start finding jobs, tell us what services you offer. You can select multiple.
            </p>
          </div>

          <div className="p-4 sm:p-8 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4">
              {CATEGORIES.map((cat) => {
                const isSelected = selected.includes(cat.name);
                return (
                  <button
                    key={cat.name}
                    onClick={() => toggleCategory(cat.name)}
                    className={`relative flex flex-col items-center justify-center p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all ${
                      isSelected 
                        ? `${cat.border} ${cat.activeBg} shadow-sm transform scale-[0.98]` 
                        : `border-gray-200/50 bg-gray-50/30 hover:bg-gray-50 hover:border-gray-200/80`
                    }`}
                  >
                    {isSelected && (
                      <div className={`absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-4 h-4 sm:w-5 sm:h-5 ${cat.badgeBg} rounded-full flex items-center justify-center`}>
                        <span className="material-icons text-[11px] sm:text-[14px] text-white font-bold">check</span>
                      </div>
                    )}
                    <span className={`material-icons text-2xl sm:text-3xl mb-1.5 sm:mb-2.5 transition-colors ${isSelected ? cat.color : 'text-gray-300'}`}>
                      {cat.icon}
                    </span>
                    <span className={`text-xs sm:text-sm font-bold text-center transition-colors ${isSelected ? 'text-gray-900' : 'text-gray-400'}`}>
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-5 sm:p-8 pt-2 sm:pt-4 bg-transparent flex justify-end">
            <button
              onClick={handleSave}
              disabled={selected.length === 0 || loading}
              className="w-full sm:w-auto px-8 py-3 bg-[#0F172A] text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {loading ? (
                <><Loader2 className="animate-spin w-4 h-4 sm:w-5 sm:h-5" /> Saving...</>
              ) : (
                'Save & Continue'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
