import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import EarningsChart from './EarningsChart';

const EarningsChartModal = ({ isOpen, onClose, weeklyData, maxVal }) => {
    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop with Full Screen Blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative bg-white rounded-[32px] w-full max-w-3xl overflow-hidden shadow-2xl"
                    >
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">Earnings Analysis</h3>
                                <p className="text-sm text-gray-500 font-medium">Detailed weekly performance breakdown</p>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="w-12 h-12 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all active:scale-90"
                            >
                                <span className="material-icons-outlined text-gray-500">close</span>
                            </button>
                        </div>

                        <div className="p-6 md:p-8 bg-white">
                            <div className="rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                <EarningsChart 
                                    data={weeklyData} 
                                    height={280} 
                                    showXAxis={true} 
                                    showYAxis={true} 
                                    showDots={true} 
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default EarningsChartModal;
