import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

const WithdrawalModal = ({ isOpen, onClose, currentBalance, payoutAccount, onPayoutComplete }) => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const handleWithdraw = async () => {
        if (!amount || Number(amount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (Number(amount) > currentBalance) {
            toast.error("Insufficient balance");
            return;
        }

        if (!payoutAccount) {
            toast.error("Please set up your payout bank account first");
            return;
        }

        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            console.log('[WithdrawalModal] Initiating payout call...', {
                amount,
                providerId: session?.user?.id,
                bankCode: payoutAccount?.bankCode
            });

            const { data: result, error: invokeError } = await supabase.functions.invoke('squad', {
                body: {
                    action: 'initiate-payout',
                    providerId: session?.user?.id,
                    amount: Number(amount),
                    bankCode: payoutAccount.bankCode || "000013", // Fallback for testing
                    accountNumber: payoutAccount.accountNumber,
                    accountName: payoutAccount.accountName,
                    remark: `TaskMate Withdrawal - ${session?.user?.id.substring(0, 5)}`
                }
            });

            console.log('[WithdrawalModal] Invoke result:', { result, invokeError });

            if (invokeError) throw invokeError;

            if (result?.success) {
                onPayoutComplete();
                onClose();
            } else {
                toast.error(result?.message || "Withdrawal failed");
            }
        } catch (error) {
            console.error("Withdrawal error:", error);
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl"
                    >
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">Withdraw Funds</h3>
                                <p className="text-sm text-gray-500 font-medium">Available: ₦{currentBalance.toLocaleString()}</p>
                            </div>
                            <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                                <span className="material-icons-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            {/* Bank Preview */}
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-2 tracking-wider">Sending to</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100">
                                        <span className="material-icons-outlined text-gray-400">account_balance</span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-900 truncate">{payoutAccount?.accountName || '---'}</p>
                                        <p className="text-xs text-gray-500">{payoutAccount?.accountNumber} • {payoutAccount?.bankName}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Amount to Withdraw (₦)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">₦</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full pl-10 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-xl focus:border-[#10B981] focus:bg-white outline-none transition-all"
                                    />
                                </div>
                                <div className="flex justify-between mt-2">
                                    <button 
                                        onClick={() => setAmount(currentBalance.toString())}
                                        className="text-[10px] font-bold text-[#10B981] uppercase hover:underline"
                                    >
                                        Withdraw Max
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleWithdraw}
                                disabled={loading || !amount || Number(amount) <= 0}
                                className="w-full py-4 bg-[#0F172A] text-white font-bold rounded-2xl shadow-xl shadow-gray-200 hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        Confirm Withdrawal
                                        <span className="material-icons-outlined text-lg">arrow_forward</span>
                                    </>
                                )}
                            </button>
                            
                            <p className="text-[10px] text-gray-400 text-center font-medium px-4 leading-relaxed">
                                Sandbox Mode: Funds will be simulated and reflected in your ledger immediately upon success.
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default WithdrawalModal;
