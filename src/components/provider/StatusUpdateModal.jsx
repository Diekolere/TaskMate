import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StatusUpdateModal = ({ isOpen, onClose, onUpdate, currentStatus }) => {
    const [selectedStatus, setSelectedStatus] = useState(currentStatus || 'on_way');
    const [note, setNote] = useState('');

    const statuses = [
        { id: 'on_way', label: 'On my way', sub: 'Estimated arrival 15m', icon: 'directions_car' },
        { id: 'arrived', label: 'Arrived', sub: 'At customer location', icon: 'location_on' },
        { id: 'started', label: 'Started work', sub: 'Job in progress', icon: 'construction' },
        { id: 'parts', label: 'Parts needed', sub: 'Work paused pending materials', icon: 'shopping_cart' },
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-[520px] bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-200"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white sticky top-0 z-20">
                        <div>
                            <h2 className="text-xl font-bold leading-tight text-gray-900">Update Job Status</h2>
                            <p className="text-sm text-gray-500 mt-1">Order #TM-9021 • Chinedu Okafor</p>
                        </div>
                        <button onClick={onClose} className="group p-2 rounded-full hover:bg-gray-100 transition-colors">
                            <span className="material-symbols-outlined text-gray-400 group-hover:text-gray-900">close</span>
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <p className="text-gray-900 text-base font-medium leading-normal pb-4">Current Progress</p>
                        <div className="flex flex-col gap-3">
                            {statuses.map((status) => (
                                <label 
                                    key={status.id}
                                    className={`group relative flex items-start gap-4 rounded-xl border p-4 cursor-pointer transition-all ${
                                        selectedStatus === status.id 
                                        ? 'border-primary bg-primary/5 shadow-sm' 
                                        : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="pt-0.5">
                                        <input 
                                            type="radio" 
                                            name="job_status" 
                                            value={status.id}
                                            checked={selectedStatus === status.id}
                                            onChange={() => setSelectedStatus(status.id)}
                                            className="text-primary focus:ring-primary border-gray-300"
                                        />
                                    </div>
                                    <div className="flex flex-col grow">
                                        <span className={`text-sm font-bold leading-normal transition-colors ${
                                            selectedStatus === status.id ? 'text-gray-900' : 'text-gray-700 group-hover:text-primary'
                                        }`}>
                                            {status.label}
                                        </span>
                                        <span className="text-gray-500 text-xs leading-normal mt-0.5">{status.sub}</span>
                                    </div>
                                    <span className={`material-symbols-outlined text-[20px] transition-opacity ${
                                        selectedStatus === status.id ? 'opacity-100 text-primary' : 'opacity-0'
                                    }`}>
                                        {status.icon}
                                    </span>
                                </label>
                            ))}
                        </div>

                        <div className="mt-8">
                            <label className="text-gray-900 text-base font-medium leading-normal pb-2 block" htmlFor="quick-note">
                                Quick Note <span className="text-gray-400 font-normal text-sm">(Optional)</span>
                            </label>
                            <div className="relative">
                                <textarea 
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="w-full min-h-[120px] resize-none rounded-xl border border-gray-200 bg-white p-4 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm text-sm" 
                                    placeholder="Add details about the status update for the customer..."
                                />
                                <div className="absolute bottom-3 right-3 pointer-events-none">
                                    <span className="material-symbols-outlined text-gray-300">edit_note</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-100 bg-gray-50">
                        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end w-full">
                            <button 
                                onClick={onClose}
                                className="flex-1 sm:flex-none sm:min-w-[100px] cursor-pointer items-center justify-center rounded-lg h-11 px-6 bg-transparent border border-gray-200 text-gray-700 text-sm font-bold hover:bg-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => onUpdate(selectedStatus, note)}
                                className="flex-1 sm:flex-none sm:min-w-[140px] cursor-pointer items-center justify-center rounded-lg h-11 px-6 bg-primary hover:bg-green-400 text-primary-content text-sm font-bold shadow-lg shadow-primary/20 transition-all transform active:scale-95 flex gap-2"
                            >
                                <span>Send Update</span>
                                <span className="material-symbols-outlined text-[18px]">send</span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default StatusUpdateModal;
