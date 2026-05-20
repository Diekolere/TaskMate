import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

const CATEGORIES = [
  { name: 'Plumbing', icon: 'water_drop', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', activeBg: 'bg-blue-100' },
  { name: 'Electrical', icon: 'bolt', color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-100', activeBg: 'bg-yellow-100' },
  { name: 'Furniture (Carpentry)', icon: 'chair', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', activeBg: 'bg-amber-100' },
  { name: 'Cleaning', icon: 'cleaning_services', color: 'text-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-100', activeBg: 'bg-cyan-100' },
  { name: 'Painting', icon: 'format_paint', color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-100', activeBg: 'bg-pink-100' },
  { name: 'HVAC', icon: 'ac_unit', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', activeBg: 'bg-emerald-100' },
  { name: 'Moving', icon: 'local_shipping', color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100', activeBg: 'bg-indigo-100' },
  { name: 'Roofing', icon: 'roofing', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100', activeBg: 'bg-slate-100' },
  { name: 'Appliance Repair', icon: 'kitchen', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', activeBg: 'bg-red-100' },
  { name: 'Landscaping', icon: 'yard', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', activeBg: 'bg-green-100' },
  { name: 'Laundry', icon: 'local_laundry_service', color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100', activeBg: 'bg-purple-100' },
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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#1a2b3c]/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="p-6 sm:p-8 border-b border-gray-100 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1a2b3c] font-serif mb-2">
              Welcome to TaskMate!
            </h2>
            <p className="text-gray-500 text-sm sm:text-base">
              Before you can start finding jobs, tell us what services you offer. You can select multiple.
            </p>
          </div>

          <div className="p-6 sm:p-8 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {CATEGORIES.map((cat) => {
                const isSelected = selected.includes(cat.name);
                return (
                  <button
                    key={cat.name}
                    onClick={() => toggleCategory(cat.name)}
                    className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                      isSelected 
                        ? `border-[#0F172A] ${cat.activeBg} shadow-sm transform scale-[0.98]` 
                        : `border-transparent ${cat.bg} hover:shadow-md hover:-translate-y-1`
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-[#0F172A] rounded-full flex items-center justify-center">
                        <span className="material-icons text-[14px] text-white font-bold">check</span>
                      </div>
                    )}
                    <span className={`material-icons text-3xl mb-2 ${isSelected ? 'text-[#0F172A]' : cat.color}`}>
                      {cat.icon}
                    </span>
                    <span className={`text-sm font-bold text-center ${isSelected ? 'text-[#0F172A]' : 'text-gray-700'}`}>
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6 sm:p-8 border-t border-gray-100 bg-gray-50 flex justify-end">
            <button
              onClick={handleSave}
              disabled={selected.length === 0 || loading}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#0F172A] text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="animate-spin w-5 h-5" /> Saving...</>
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
