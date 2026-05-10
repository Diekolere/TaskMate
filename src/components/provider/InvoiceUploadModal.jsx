import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const InvoiceUploadModal = ({ isOpen, onClose, onUpload }) => {
    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [amount, setAmount] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    if (!isOpen) return null;

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) setFile(droppedFile);
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) setFile(selectedFile);
    };

    const handleSubmit = () => {
        if (!file || !amount) {
            toast.error("Please provide both a file and the amount.");
            return;
        }
        onUpload(file, amount);
        setFile(null);
        setAmount('');
        onClose();
    };

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
                    className="relative w-full max-w-[480px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200"
                >
                    <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                        <h2 className="text-lg font-bold text-gray-900">Record Payment</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                            <span className="material-symbols-outlined text-gray-500">close</span>
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Amount Input */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Final Amount Collected (₦)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₦</span>
                                <input 
                                    type="number" 
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-gray-900 font-bold text-lg"
                                    placeholder="0.00"
                                />
                            </div>
                            {amount && (
                                <p className="text-xs text-orange-600 mt-2 font-bold flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">info</span>
                                    Commission Fee (10%): ₦{(amount * 0.1).toLocaleString()}
                                </p>
                            )}
                        </div>

                        {/* File Upload Area */}
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Proof of Payment <span className="text-red-500">*</span></label>
                            <div 
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                                    isDragging ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept=".pdf,.jpg,.png"
                                    onChange={handleFileChange}
                                />
                                
                                {file ? (
                                    <div className="text-center">
                                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2 text-primary">
                                            <span className="material-symbols-outlined">description</span>
                                        </div>
                                        <p className="text-sm font-bold text-gray-900 line-clamp-1">{file.name}</p>
                                        <p className="text-xs text-green-600 mt-1">Ready to upload</p>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                            className="mt-3 text-xs text-red-500 hover:underline font-bold"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                                            <span className="material-symbols-outlined">receipt_long</span>
                                        </div>
                                        <p className="text-sm font-bold text-gray-700">Upload Receipt / Transfer Proof</p>
                                        <p className="text-xs text-gray-400 mt-1">JPG or PNG (max. 5MB)</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex gap-3 justify-end">
                        <button 
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-bold hover:bg-gray-50 transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSubmit}
                            disabled={!amount || !file}
                            className="px-6 py-2.5 rounded-lg bg-primary text-primary-content font-bold shadow-lg shadow-primary/20 hover:bg-green-400 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <span>Complete Job</span>
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default InvoiceUploadModal;
