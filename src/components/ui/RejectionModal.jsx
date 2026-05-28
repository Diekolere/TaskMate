import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const REASONS = [
    { id: 'price_high', label: 'Price is too high' },
    { id: 'timeline', label: 'Timeline doesn\'t work' },
    { id: 'scope_unclear', label: 'Scope is unclear' },
    { id: 'other', label: 'Other' }
];

export default function RejectionModal({ isOpen, onClose, onSubmit }) {
    const [selectedReason, setSelectedReason] = useState('');
    const [otherText, setOtherText] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        let finalReason = '';
        if (selectedReason === 'other') {
            if (!otherText.trim()) return;
            finalReason = otherText.trim();
        } else {
            const r = REASONS.find(r => r.id === selectedReason);
            if (r) finalReason = r.label;
        }

        if (finalReason) {
            onSubmit(finalReason);
            setSelectedReason('');
            setOtherText('');
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden"
                >
                    <div className="p-5 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900 text-lg">Decline Offer</h3>
                        <p className="text-sm text-gray-500 mt-1">Please let the other party know why you are rejecting.</p>
                    </div>

                    <div className="p-5 space-y-3">
                        {REASONS.map((r) => (
                            <button
                                key={r.id}
                                onClick={() => setSelectedReason(r.id)}
                                className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                                    selectedReason === r.id
                                        ? 'border-red-500 bg-red-50 text-red-700'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {r.label}
                            </button>
                        ))}

                        {selectedReason === 'other' && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="pt-2"
                            >
                                <textarea
                                    autoFocus
                                    value={otherText}
                                    onChange={(e) => setOtherText(e.target.value)}
                                    placeholder="Type your reason..."
                                    className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 resize-none h-24"
                                />
                            </motion.div>
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedReason || (selectedReason === 'other' && !otherText.trim())}
                            className="flex-1 py-2.5 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors"
                        >
                            Submit
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
