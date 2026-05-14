import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

/* Replicates KYC modal step 2 only — `KYCModal.jsx` is unchanged; this file inlines the same bank UI. */
const BANKS = [
    'Access Bank', 'Ecobank', 'Fidelity Bank', 'First Bank of Nigeria',
    'FCMB', 'GTBank', 'Heritage Bank', 'Keystone Bank', 'Polaris Bank',
    'Stanbic IBTC', 'Sterling Bank', 'UBA', 'Union Bank', 'Unity Bank',
    'Wema Bank', 'Zenith Bank', 'Kuda Bank', 'Opay', 'Palmpay', 'Moniepoint',
];

function BankSelect({ value, onChange }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef();
    const searchRef = useRef();

    const filtered = BANKS.filter(b => b.toLowerCase().includes(search.toLowerCase()));

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (open) setTimeout(() => searchRef.current?.focus(), 50);
    }, [open]);

    const select = (bank) => { onChange(bank); setOpen(false); setSearch(''); };

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className={`w-full h-12 px-4 border rounded-xl text-sm flex items-center justify-between transition-all ${
                    open ? 'border-[#10B981] ring-2 ring-[#10B981]/20' : 'border-gray-200 hover:border-gray-300'
                } bg-white`}
            >
                <span className={value ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                    {value || 'Select your bank'}
                </span>
                <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.18 }}
                    className="material-icons text-gray-400 text-base shrink-0"
                >
                    expand_more
                </motion.span>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scaleY: 0.96 }}
                        animate={{ opacity: 1, y: 0, scaleY: 1 }}
                        exit={{ opacity: 0, y: -6, scaleY: 0.96 }}
                        transition={{ duration: 0.15 }}
                        style={{ transformOrigin: 'top' }}
                        className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[200] overflow-hidden"
                    >
                        <div className="px-3 pt-3 pb-2 border-b border-gray-50">
                            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                                <span className="material-icons text-gray-400 text-base">search</span>
                                <input
                                    ref={searchRef}
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search banks…"
                                    className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
                                />
                            </div>
                        </div>

                        <div className="max-h-52 overflow-y-auto py-1.5">
                            {filtered.length > 0 ? filtered.map(bank => (
                                <button
                                    key={bank}
                                    type="button"
                                    onClick={() => select(bank)}
                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between group ${
                                        value === bank
                                            ? 'bg-[#10B981]/8 text-[#10B981] font-semibold'
                                            : 'text-gray-700 hover:bg-gray-50 font-medium'
                                    }`}
                                >
                                    {bank}
                                    {value === bank && <span className="material-icons text-[#10B981] text-base">check</span>}
                                </button>
                            )) : (
                                <p className="text-sm text-gray-400 text-center py-6">No banks found</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ── Same badge as KYC modal (not imported — keeps KYC file untouched) ── */
function SquadBadge() {
    return (
        <div className="flex items-center gap-2">
            <span className="text-sm sm:text-[15px] font-medium text-gray-500">Powered by</span>
            <img src="/squad.png" alt="Squad" className="h-[18px] sm:h-5 w-auto object-contain" />
        </div>
    );
}

export default function EditPayoutAccountModal({ open, onClose, onSaved }) {
    const { currentUser, updateUserProfile, updateProviderProfile } = useAuth();
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [fetchingAccount, setFetchingAccount] = useState(false);
    const [accountVerified, setAccountVerified] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    useEffect(() => {
        if (!open || !currentUser) return;
        const b = (currentUser.bankName || '').trim();
        const n = (currentUser.accountNumber || '').trim();
        const a = (currentUser.accountName || '').trim();
        setBankName(b);
        setAccountNumber(n);
        setAccountName(a);
        setAccountVerified(!!(b && n && a));
    }, [open, currentUser]);

    const handleFetchAccount = () => {
        if (accountNumber.length !== 10) { toast.error('Account number must be 10 digits'); return; }
        if (!bankName) { toast.error('Select a bank first'); return; }
        setFetchingAccount(true);
        setTimeout(() => {
            setAccountName((currentUser?.full_name || currentUser?.displayName || 'IBRAHIM MUSA').toUpperCase());
            setAccountVerified(true);
            setFetchingAccount(false);
        }, 1400);
    };

    const handleSave = async () => {
        if (!accountVerified || !accountName) {
            toast.error('Verify your bank account with Fetch before saving');
            return;
        }
        setSaving(true);
        try {
            await updateProviderProfile({ 
                bank_name: bankName, 
                account_number: accountNumber, 
                account_name: accountName 
            });
            toast.success('Payout account updated');
            onSaved?.();
            onClose?.();
        } catch {
            toast.error('Could not save — try again');
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-start justify-center overflow-y-auto py-6 px-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-[520px] overflow-visible my-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="px-8 pt-8 pb-6 border-b border-gray-100">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight leading-tight mb-2">Edit payout details</h2>
                            <SquadBadge />
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 shrink-0 -mt-1"
                        >
                            <span className="material-icons text-lg">close</span>
                        </button>
                    </div>
                </div>

                <div className="px-8 py-8 space-y-6 overflow-visible">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Bank</label>
                        <BankSelect
                            value={bankName}
                            onChange={(b) => { setBankName(b); if (accountVerified) { setAccountVerified(false); setAccountName(''); } }}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Account Number</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={10}
                                value={accountNumber}
                                onChange={e => {
                                    setAccountNumber(e.target.value.replace(/\D/g, ''));
                                    if (accountVerified) { setAccountVerified(false); setAccountName(''); }
                                }}
                                placeholder="10-digit account number"
                                className="flex-1 h-12 px-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal"
                            />
                            <button
                                type="button"
                                onClick={handleFetchAccount}
                                disabled={fetchingAccount || accountVerified || accountNumber.length !== 10 || !bankName}
                                className={`h-12 px-5 rounded-xl text-sm font-bold transition-all shrink-0 ${
                                    accountVerified
                                        ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20'
                                        : 'bg-[#0F172A] text-white hover:bg-slate-700 disabled:opacity-30'
                                }`}
                            >
                                {fetchingAccount ? <span className="material-icons text-base animate-spin">autorenew</span>
                                    : accountVerified ? <span className="material-icons text-base">check</span>
                                    : 'Fetch'}
                            </button>
                        </div>
                    </div>

                    {accountName && (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 bg-[#10B981]/5 border border-[#10B981]/20 rounded-xl px-4 py-3"
                        >
                            <span className="material-icons text-[#10B981] text-lg">account_circle</span>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Account Name</p>
                                <p className="text-sm font-bold text-gray-900">{accountName}</p>
                            </div>
                        </motion.div>
                    )}
                </div>

                <div className="px-8 pb-8 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-12 px-6 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || !accountVerified}
                        className="h-12 px-8 bg-[#0F172A] hover:bg-slate-700 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-2 disabled:opacity-40"
                    >
                        {saving ? <span className="material-icons text-base animate-spin">autorenew</span> : null}
                        Save payout account
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
