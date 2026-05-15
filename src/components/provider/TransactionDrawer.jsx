import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const TransactionDrawer = ({ isOpen, onClose, ledger = [] }) => {
    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    {/* Backdrop with Deep Blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-md"
                    />

                    {/* Drawer Content - Sliding from Right */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col"
                    >
                        <div className="py-3 px-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">All Transactions</h3>
                            </div>
                            <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                                <span className="material-icons-outlined">close</span>
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {ledger.length > 0 ? (
                                ledger.map((item) => (
                                    <div key={item.id} className="p-4 rounded-2xl bg-gray-50/50 border border-gray-100 hover:border-gray-200 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                item.entry_type === 'credit' || item.entry_type === 'release' ? 'bg-emerald-100 text-emerald-600' : 
                                                item.entry_type === 'escrow' ? 'bg-blue-100 text-blue-600' :
                                                'bg-red-100 text-red-600'
                                            }`}>
                                                <span className="material-icons-outlined text-lg">
                                                    {item.entry_type === 'credit' || item.entry_type === 'release' ? 'north_east' : 
                                                     item.entry_type === 'escrow' ? 'shield' : 'south_west'}
                                                </span>
                                            </div>
                                            <p className={`font-bold ${
                                                item.entry_type === 'credit' || item.entry_type === 'release' ? 'text-emerald-600' : 
                                                item.entry_type === 'escrow' ? 'text-blue-600' :
                                                'text-red-600'
                                            }`}>
                                                {item.entry_type === 'credit' || item.entry_type === 'release' || item.entry_type === 'escrow' ? '+' : '-'} ₦{Math.abs(Number(item.amount || 0)).toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-xs">{item.description}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">
                                                {new Date(item.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })} · {item.source === 'escrow' ? 'Escrow' : 'Wallet'}
                                            </p>
                                            <div className="mt-2 pt-2 border-t border-gray-200/50 flex justify-between text-[9px] uppercase font-bold tracking-wider text-gray-400">
                                                <span>REF: {item.id.substring(0, 12)}</span>
                                                <span className="text-emerald-500">Completed</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 opacity-50">
                                    <span className="material-icons-outlined text-4xl mb-2">history</span>
                                    <p className="text-sm">No transactions yet</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default TransactionDrawer;
