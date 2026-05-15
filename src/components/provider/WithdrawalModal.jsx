import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const WithdrawalModal = ({ isOpen, onClose, currentBalance, payoutAccount, onPayoutComplete }) => {
    const { currentUser, updateProviderProfile } = useAuth();
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('amount'); // 'amount' | 'setup-pin' | 'confirm-setup' | 'verify-pin'
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');

    useEffect(() => {
        if (isOpen) {
            setStep('amount');
            setAmount('');
            setPin('');
            setConfirmPin('');
        }
    }, [isOpen]);

    // Amount Step Logic
    const [amountKobo, setAmountKobo] = useState('0');
    
    const formattedDisplayAmount = useMemo(() => {
        const val = Number(amountKobo) / 100;
        return val.toLocaleString('en-NG', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
        });
    }, [amountKobo]);

    const nairaValue = useMemo(() => Number(amountKobo) / 100, [amountKobo]);

    const handleAmountNext = () => {
        if (nairaValue < 100) {
            toast.error("Minimum withdrawal is ₦100.00");
            return;
        }
        if (nairaValue > currentBalance) {
            toast.error("Insufficient balance");
            return;
        }
        if (!payoutAccount) {
            toast.error("Please set up your payout bank account first");
            return;
        }

        if (!currentUser.transactionPin) {
            setStep('setup-pin');
        } else {
            setStep('verify-pin');
        }
    };

    // PIN Setup & Verify Logic
    const handleSetupNext = () => {
        if (pin.length !== 4) return;
        setStep('confirm-setup');
    };

    const handleFinalizeSetup = async () => {
        if (confirmPin !== pin) {
            toast.error("PINs do not match. Let's try again.");
            setStep('setup-pin');
            setPin('');
            setConfirmPin('');
            return;
        }

        setLoading(true);
        try {
            await updateProviderProfile({ transaction_pin: pin });
            toast.success("Transaction PIN set successfully!");
            setStep('verify-pin');
            setPin('');
            setConfirmPin('');
        } catch (error) {
            toast.error("Failed to set PIN");
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async () => {
        if (pin.length !== 4) return;

        if (pin !== currentUser.transactionPin) {
            toast.error("Incorrect Transaction PIN");
            setPin('');
            return;
        }

        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user?.id) throw new Error("Session expired");

            const payload = {
                action: 'initiate-payout',
                providerId: session?.user?.id,
                amount: nairaValue,
                bankCode: payoutAccount?.bankCode || "100004",
                accountNumber: payoutAccount?.accountNumber,
                accountName: payoutAccount?.accountName
            };

            const { data: result, error: invokeError } = await supabase.functions.invoke('squad', {
                body: payload
            });

            if (invokeError) {
                if (invokeError.context) {
                    try {
                        const body = await invokeError.context.json();
                        toast.error(body.message || "Withdrawal failed");
                    } catch (e) {
                        toast.error(invokeError.message || "Connection error");
                    }
                } else {
                    toast.error(invokeError.message || "Withdrawal failed");
                }
                setLoading(false);
                return;
            }

            if (result?.success) {
                toast.success('Withdrawal successful!');
                onPayoutComplete();
                onClose();
            } else {
                toast.error(result?.message || "Withdrawal failed");
            }
        } catch (error) {
            console.error("Withdrawal error:", error);
            toast.error(error.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const renderKeypad = (val, setVal, onConfirm, type = 'pin') => {
        const handleKey = (key) => {
            if (key === 'backspace') {
                if (type === 'amount') {
                    setAmountKobo(prev => prev.length <= 1 ? '0' : prev.slice(0, -1));
                } else {
                    setVal(prev => prev.slice(0, -1));
                }
            } else if (key === 'done') {
                onConfirm();
            } else {
                if (type === 'amount') {
                    setAmountKobo(prev => {
                        if (prev === '0') return key.toString();
                        if (prev.length >= 9) return prev;
                        return prev + key;
                    });
                } else {
                    if (val.length < 4) setVal(prev => prev + key);
                }
            }
        };

        const isDoneDisabled = type === 'amount' ? nairaValue < 100 : val.length < 4;

        return (
            <div className="grid grid-cols-3 gap-3 max-w-[300px] mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'backspace', 0, 'done'].map((key) => (
                    <button
                        key={key}
                        onClick={() => handleKey(key)}
                        disabled={key === 'done' && isDoneDisabled}
                        className={`h-16 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${
                            key === 'done' 
                                ? 'bg-[#10B981] text-white shadow-lg shadow-[#10B981]/30 disabled:opacity-30 disabled:shadow-none' 
                                : key === 'backspace'
                                    ? 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                    : 'bg-gray-50 text-gray-900 font-bold text-xl hover:bg-gray-100'
                        }`}
                    >
                        {key === 'backspace' ? (
                            <span className="material-icons-outlined text-xl">backspace</span>
                        ) : key === 'done' ? (
                            <span className="material-icons-outlined text-xl">check</span>
                        ) : key}
                    </button>
                ))}
            </div>
        );
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
                        className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-white rounded-[40px] w-[calc(100vw-32px)] max-w-md shadow-2xl border border-gray-100 overflow-visible"
                    >
                        {/* Header */}
                        <div className="px-8 pt-8 pb-6 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 rounded-t-[40px]">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                                    {step === 'amount' ? 'Withdrawal' : 'Secure Authorization'}
                                </h3>
                                {step === 'amount' && (
                                    <p className="text-sm text-gray-500 font-semibold mt-0.5">
                                        ₦{currentBalance.toLocaleString()} available
                                    </p>
                                )}
                            </div>
                            <button onClick={onClose} className="w-11 h-11 rounded-2xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 flex items-center justify-center transition-all">
                                <span className="material-icons-outlined text-xl">close</span>
                            </button>
                        </div>

                        <div className="px-8 pb-8">
                            <AnimatePresence mode="wait">
                                {step === 'amount' && (
                                    <motion.div 
                                        key="amount"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-6"
                                    >
                                        <div className="bg-gray-50/80 p-5 rounded-[24px] border border-gray-100/50">
                                            <p className="text-[10px] text-gray-400 font-black uppercase mb-3 tracking-widest">Payout Destination</p>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
                                                    <span className="material-icons-outlined text-[#10B981]">account_balance</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-gray-900 truncate text-sm uppercase tracking-tight">{payoutAccount?.accountName || '---'}</p>
                                                    <p className="text-xs text-gray-500 font-semibold">{payoutAccount?.accountNumber} • {payoutAccount?.bankName}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-3 pl-1">Amount to withdraw</label>
                                                <div className="relative group flex items-center bg-gray-50 border-2 border-transparent rounded-[24px] focus-within:bg-white focus-within:border-[#10B981] transition-all px-8">
                                                    <span className="font-black text-gray-400 text-xl mr-2">₦</span>
                                                    <input
                                                        type="tel"
                                                        value={formattedDisplayAmount}
                                                        onChange={(e) => {
                                                            const raw = e.target.value.replace(/[^0-9]/g, '');
                                                            if (raw.length <= 10) {
                                                                setAmountKobo(raw || '0');
                                                            }
                                                        }}
                                                        className="flex-1 py-6 bg-transparent font-black text-4xl text-gray-900 outline-none w-0"
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="flex justify-between items-center px-1">
                                                <button 
                                                    onClick={() => setAmountKobo(Math.round(currentBalance * 100).toString())}
                                                    className="text-[10px] font-black text-[#10B981] uppercase tracking-wider hover:opacity-70 transition-opacity bg-emerald-50 px-3 py-1.5 rounded-full"
                                                >
                                                    Max Balance
                                                </button>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                    Min ₦100.00
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleAmountNext}
                                            disabled={nairaValue < 100 || nairaValue > currentBalance}
                                            className="w-full py-6 bg-[#0F172A] text-white font-black rounded-[24px] shadow-xl shadow-[#0F172A]/20 hover:bg-black transition-all active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
                                        >
                                            Continue
                                            <span className="material-icons-outlined text-lg">arrow_forward</span>
                                        </button>
                                    </motion.div>
                                )}

                                {step === 'setup-pin' && (
                                    <div key="setup" className="space-y-6 pt-4 text-center">
                                        <h4 className="text-xl font-bold text-gray-900 mb-1">Create Your PIN</h4>
                                        <p className="text-xs text-gray-500 font-medium mb-6">Choose a 4-digit security code for withdrawals</p>
                                        <div className="flex justify-center gap-4 mb-8">
                                            {[1, 2, 3, 4].map((_, i) => (
                                                <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${pin.length > i ? 'bg-[#10B981] border-[#10B981] scale-125 shadow-lg shadow-[#10B981]/20' : 'border-gray-200'}`} />
                                            ))}
                                        </div>
                                        {renderKeypad(pin, setPin, handleSetupNext)}
                                    </div>
                                )}

                                {step === 'confirm-setup' && (
                                    <div key="confirm" className="space-y-6 pt-4 text-center">
                                        <h4 className="text-xl font-bold text-gray-900 mb-1">Confirm PIN</h4>
                                        <p className="text-xs text-gray-500 font-medium mb-6">Re-enter your 4-digit code to finalize</p>
                                        <div className="flex justify-center gap-4 mb-8">
                                            {[1, 2, 3, 4].map((_, i) => (
                                                <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${confirmPin.length > i ? 'bg-[#10B981] border-[#10B981] scale-125 shadow-lg shadow-[#10B981]/20' : 'border-gray-200'}`} />
                                            ))}
                                        </div>
                                        {renderKeypad(confirmPin, setConfirmPin, handleFinalizeSetup)}
                                        {loading && <div className="flex items-center justify-center gap-3 text-xs font-black text-[#10B981] uppercase tracking-widest mt-4">Saving...</div>}
                                    </div>
                                )}

                                {step === 'verify-pin' && (
                                    <div key="verify" className="space-y-6 pt-4 text-center">
                                        <h4 className="text-xl font-bold text-gray-900 mb-1">Authorize</h4>
                                        <p className="text-xs text-gray-500 font-medium mb-6">Enter your 4-digit transaction PIN</p>
                                        <div className="flex justify-center gap-4 mb-8">
                                            {[1, 2, 3, 4].map((_, i) => (
                                                <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${pin.length > i ? 'bg-[#10B981] border-[#10B981] scale-125 shadow-lg shadow-[#10B981]/20' : 'border-gray-200'}`} />
                                            ))}
                                        </div>
                                        {renderKeypad(pin, setPin, handleWithdraw)}
                                        {loading && <div className="flex items-center justify-center gap-3 text-xs font-black text-[#10B981] uppercase tracking-widest mt-4">Processing...</div>}
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default WithdrawalModal;
