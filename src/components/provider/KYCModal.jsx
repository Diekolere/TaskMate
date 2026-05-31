import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';


import BANKS from '../../data/banks.json';
import { useEarnings } from '../../context/EarningsContext';

const STEPS = [
    { id: 1, label: 'Identity' },
    { id: 2, label: 'Bank' },
    { id: 3, label: 'Success' },
];

/* ── Custom bank dropdown ────────────────────────────── */
function BankSelect({ value, onChange }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef();
    const searchRef = useRef();

    const filtered = BANKS.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

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
                    {value?.name || 'Select your bank'}
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
                        {/* Search */}
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

                        {/* List */}
                        <div className="max-h-52 overflow-y-auto py-1.5">
                            {filtered.length > 0 ? filtered.map(bank => (
                                <button
                                    key={bank.code}
                                    type="button"
                                    onClick={() => select(bank)}
                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between group ${
                                        value?.code === bank.code
                                            ? 'bg-[#10B981]/8 text-[#10B981] font-semibold'
                                            : 'text-gray-700 hover:bg-gray-50 font-medium'
                                    }`}
                                >
                                    {bank.name}
                                    {value?.code === bank.code && <span className="material-icons text-[#10B981] text-base">check</span>}
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

/* ── Main modal ──────────────────────────────────────── */
export default function KYCModal({ open, onClose, onComplete }) {
    const { currentUser, updateUserProfile, updateProviderProfile } = useAuth();
    const { submitKYC, verifyBankAccount } = useEarnings();
    const [step, setStep] = useState(1);
    const [dir, setDir] = useState(1);

    const [bvn, setBvn] = useState('');
    const [nin, setNin] = useState('');
    const [bvnVerified, setBvnVerified] = useState(false);
    const [verifyingBvn, setVerifyingBvn] = useState(false);
    const [ninVerified, setNinVerified] = useState(false);
    const [verifyingNin, setVerifyingNin] = useState(false);

    const [bank, setBank] = useState(null);
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [fetchingAccount, setFetchingAccount] = useState(false);
    const [accountVerified, setAccountVerified] = useState(false);

    const [selfieFile, setSelfieFile] = useState(null);
    const [selfiePreview, setSelfiePreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const selfieRef = useRef();

    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    const goTo = (n) => { setDir(n > step ? 1 : -1); setStep(n); };

    const [verifiedData, setVerifiedData] = useState(null);

    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]); // Truncate prefix
        reader.onerror = error => reject(error);
    });

    const calculateAge = (dateString) => {
        if (!dateString) return 0;
        const today = new Date();
        const birthDate = new Date(dateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const handleVerifyIdentity = async (type) => {
        const val = type === 'bvn' ? bvn : nin;
        if (val.length !== 11) { toast.error(`${type.toUpperCase()} must be 11 digits`); return; }
        if (!selfieFile) { toast.error('Please take a selfie first'); return; }
        
        type === 'bvn' ? setVerifyingBvn(true) : setVerifyingNin(true);
        try {
            const base64 = await toBase64(selfieFile);
            const res = await submitKYC({ 
                type, 
                value: val, 
                selfie_image: base64 
            });
            
            console.log(`Frontend ${type.toUpperCase()} Response:`, res);
            const isMatch = res?.entity?.selfie_verification?.match || res?.entity?.selfie_verification?.confidence_value >= 90;

            if (res?.entity && isMatch) {
                // Check Age
                const retrievedDob = res.entity.date_of_birth || res.entity.dob;
                const age = calculateAge(retrievedDob);
                
                if (age < 18) {
                    toast.error('Verification failed: You must be at least 18 years old to use this platform.');
                    return;
                }

                setVerifiedData(res.entity);
                type === 'bvn' ? setBvnVerified(true) : setNinVerified(true);
                toast.success('Identity & Face Matched!');
            } else {
                toast.error(res?.error || 'Identity match failed. Please ensure your face is clear.');
            }
        } catch (err) {
            toast.error('Verification failed. Try again.');
        } finally {
            type === 'bvn' ? setVerifyingBvn(false) : setVerifyingNin(false);
        }
    };

    const handleFetchAccount = async () => {
        if (accountNumber.length !== 10) { toast.error('Account number must be 10 digits'); return; }
        if (!bank) { toast.error('Select a bank first'); return; }
        setFetchingAccount(true);
        try {
            const data = await verifyBankAccount(bank.code, accountNumber);
            setAccountName(data.account_name);
            setAccountVerified(true);
        } catch (err) {
            toast.error(err.message || 'Could not verify account');
        } finally {
            setFetchingAccount(false);
        }
    };

    const handleNext = () => {
        if (step === 1 && !bvnVerified && !ninVerified) { toast.error('Verify your identity to continue'); return; }
        if (step === 2 && !accountVerified) { toast.error('Verify your bank account to continue'); return; }
        if (step === 2) { handleSubmit(); return; }
        goTo(step + 1);
    };

    const handleSelfieChange = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setSelfieFile(f);
        setSelfiePreview(URL.createObjectURL(f));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await updateProviderProfile({ 
                kyc_completed: true, 
                verification_status: 'verified', 
                bank_name: bank.name,
                account_number: accountNumber,
                account_name: accountName,
                dob: verifiedData?.date_of_birth || verifiedData?.dob,
                // Add bvn_verified or nin_verified based on which one was used
                [bvnVerified ? 'bvn_verified' : 'nin_verified']: true
            });
            
            toast.success('KYC Completed!', { description: 'Your account is now active.' });
            onComplete?.();
            onClose?.();
        } catch (error) {
            toast.error('Finalization failed. Please try again.');
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const variants = {
        enter: (d) => ({ opacity: 0, x: d > 0 ? 36 : -36 }),
        center: { opacity: 1, x: 0 },
        exit: (d) => ({ opacity: 0, x: d > 0 ? -36 : 36 }),
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-start justify-center overflow-y-auto py-6 px-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-[520px] overflow-visible my-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-8 pt-8 pb-6 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-black text-gray-900 tracking-tight leading-tight">Identity Verification</h2>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 -mt-1">
                            <span className="material-icons text-lg">close</span>
                        </button>
                    </div>

                    <div className="flex items-center">
                        {STEPS.map((s, i) => (
                            <React.Fragment key={s.id}>
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                        step > s.id ? 'bg-[#10B981] text-white' :
                                        step === s.id ? 'bg-[#0F172A] text-white' :
                                        'bg-gray-100 text-gray-400'
                                    }`}>
                                        {step > s.id ? <span className="material-icons text-sm">check</span> : s.id}
                                    </div>
                                    <span className={`text-[10px] font-semibold ${step === s.id ? 'text-gray-900' : 'text-gray-400'}`}>{s.label}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`flex-1 h-px mx-3 mb-5 transition-colors ${step > s.id ? 'bg-[#10B981]' : 'bg-gray-100'}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <div className="px-8 py-8 min-h-[340px] overflow-visible">
                    <AnimatePresence mode="wait" custom={dir}>
                        {step === 1 && (
                            <motion.div key="s1" custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Verify your identity</h3>
                                    <p className="text-sm text-gray-400 mt-1">Provide your ID and a selfie for instant face-matching.</p>
                                </div>

                                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-5 text-center">
                                    {selfiePreview ? (
                                        <div className="relative w-32 h-32 mx-auto mb-3">
                                            <img src={selfiePreview} className="w-full h-full object-cover rounded-full border-4 border-white shadow-md" alt="Selfie" />
                                            {!bvnVerified && !ninVerified && (
                                                <button onClick={() => { setSelfiePreview(null); setSelfieFile(null); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600 transition-colors">
                                                    <span className="material-icons text-xs">close</span>
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <button onClick={() => selfieRef.current?.click()} className="w-16 h-16 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-3 hover:bg-green-50 transition-colors group">
                                            <span className="material-icons text-gray-400 group-hover:text-[#10B981] text-2xl">add_a_photo</span>
                                        </button>
                                    )}
                                    <input ref={selfieRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleSelfieChange} />
                                    <p className="text-sm font-bold text-gray-700">{selfiePreview ? 'Selfie captured' : 'Take a selfie'}</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Verification Number (BVN)</label>
                                        <div className="flex gap-2">
                                            <input type="text" inputMode="numeric" maxLength={11} value={bvn} onChange={e => { setBvn(e.target.value.replace(/\D/g, '')); if (bvnVerified) setBvnVerified(false); }} placeholder="Enter 11-digit BVN" className="flex-1 h-12 px-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal" />
                                            <button type="button" onClick={() => handleVerifyIdentity('bvn')} disabled={verifyingBvn || bvnVerified || bvn.length !== 11 || !selfieFile} className={`h-12 px-5 rounded-xl text-sm font-bold transition-all shrink-0 ${bvnVerified ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' : 'bg-[#0F172A] text-white hover:bg-slate-700 disabled:opacity-30'}`}>
                                                {verifyingBvn ? <span className="material-icons text-base animate-spin">autorenew</span> : bvnVerified ? <span className="material-icons text-base">check</span> : 'Verify'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-px bg-gray-100 flex-1" /><span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">OR</span><div className="h-px bg-gray-100 flex-1" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">National Identity Number (NIN)</label>
                                        <div className="flex gap-2">
                                            <input type="text" inputMode="numeric" maxLength={11} value={nin} onChange={e => { setNin(e.target.value.replace(/\D/g, '')); if (ninVerified) setNinVerified(false); }} placeholder="Enter 11-digit NIN" className="flex-1 h-12 px-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal" />
                                            <button type="button" onClick={() => handleVerifyIdentity('nin')} disabled={verifyingNin || ninVerified || nin.length !== 11 || !selfieFile} className={`h-12 px-5 rounded-xl text-sm font-bold transition-all shrink-0 ${ninVerified ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' : 'bg-[#0F172A] text-white hover:bg-slate-700 disabled:opacity-30'}`}>
                                                {verifyingNin ? <span className="material-icons text-base animate-spin">autorenew</span> : ninVerified ? <span className="material-icons text-base">check</span> : 'Verify'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {(bvnVerified || ninVerified) && (
                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-4">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0"><span className="material-icons text-[#10B981]">verified</span></div>
                                        <div>
                                            <p className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest">Identity Matched</p>
                                            <p className="text-sm font-bold text-gray-900 uppercase">{verifiedData?.first_name} {verifiedData?.last_name}</p>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="s2" custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="space-y-6 overflow-visible">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Where should we send payments?</h3>
                                    <p className="text-sm text-gray-400 mt-1">Earnings are settled securely via Squad.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Bank</label>
                                    <BankSelect value={bank} onChange={(b) => { setBank(b); if (accountVerified) { setAccountVerified(false); setAccountName(''); } }} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Account Number</label>
                                    <div className="flex gap-2">
                                        <input type="text" inputMode="numeric" maxLength={10} value={accountNumber} onChange={e => { setAccountNumber(e.target.value.replace(/\D/g, '')); if (accountVerified) { setAccountVerified(false); setAccountName(''); } }} placeholder="10-digit account number" className="flex-1 h-12 px-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal" />
                                        <button type="button" onClick={handleFetchAccount} disabled={fetchingAccount || accountVerified || accountNumber.length !== 10 || !bank} className={`h-12 px-5 rounded-xl text-sm font-bold transition-all shrink-0 ${accountVerified ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' : 'bg-[#0F172A] text-white hover:bg-slate-700 disabled:opacity-30'}`}>
                                            {fetchingAccount ? <span className="material-icons text-base animate-spin">autorenew</span> : accountVerified ? <span className="material-icons text-base">check</span> : 'Fetch'}
                                        </button>
                                    </div>
                                </div>
                                {accountName && (
                                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 bg-[#10B981]/5 border border-[#10B981]/20 rounded-xl px-4 py-3">
                                        <span className="material-icons text-[#10B981] text-lg">account_circle</span>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Account Name</p>
                                            <p className="text-sm font-bold text-gray-900">{accountName}</p>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="px-8 pb-8 flex items-center justify-between">
                    {step > 1 ? (
                        <button onClick={() => goTo(step - 1)} disabled={submitting} className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
                            <span className="material-icons text-base">arrow_back</span> Back
                        </button>
                    ) : <div />}
                    <button onClick={handleNext} disabled={submitting} className={`h-12 px-8 font-bold text-sm rounded-xl transition-all flex items-center gap-2 shadow-sm ${step === 2 ? 'bg-[#10B981] hover:bg-[#059669] text-white' : 'bg-[#0F172A] hover:bg-slate-700 text-white'}`}>
                        {submitting ? <span className="material-icons text-base animate-spin">autorenew</span> : null}
                        {step === 2 ? (submitting ? 'Finalizing...' : 'Complete Setup') : 'Continue'}
                        {step < 2 && !submitting && <span className="material-icons text-base">arrow_forward</span>}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
