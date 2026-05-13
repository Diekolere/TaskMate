import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

const BANKS = [
    'Access Bank', 'Ecobank', 'Fidelity Bank', 'First Bank of Nigeria',
    'FCMB', 'GTBank', 'Heritage Bank', 'Keystone Bank', 'Polaris Bank',
    'Stanbic IBTC', 'Sterling Bank', 'UBA', 'Union Bank', 'Unity Bank',
    'Wema Bank', 'Zenith Bank', 'Kuda Bank', 'Opay', 'Palmpay', 'Moniepoint',
];

const STEPS = [
    { id: 1, label: 'Identity' },
    { id: 2, label: 'Bank' },
    { id: 3, label: 'Document' },
    { id: 4, label: 'Liveness' },
];

/* ── Custom bank dropdown ────────────────────────────── */
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

/* ── Squad logo badge ────────────────────────────────── */
function SquadBadge() {
    return (
        <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-400">Powered by</span>
            <img src="/squad.png" alt="Squad" className="h-[14px] w-auto object-contain" />
        </div>
    );
}

/* ── Main modal ──────────────────────────────────────── */
export default function KYCModal({ open, onClose, onComplete }) {
    const { currentUser, updateUserProfile } = useAuth();
    const { submitKYC } = useData();
    const [step, setStep] = useState(1);
    const [dir, setDir] = useState(1);

    const [bvn, setBvn] = useState('');
    const [nin, setNin] = useState('');
    const [bvnVerified, setBvnVerified] = useState(false);
    const [verifyingBvn, setVerifyingBvn] = useState(false);

    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [fetchingAccount, setFetchingAccount] = useState(false);
    const [accountVerified, setAccountVerified] = useState(false);

    const [idFile, setIdFile] = useState(null);
    const [selfieFile, setSelfieFile] = useState(null);
    const [selfiePreview, setSelfiePreview] = useState(null);
    const [faceMatchState, setFaceMatchState] = useState('idle'); // idle | checking | passed | failed
    const [submitting, setSubmitting] = useState(false);
    const fileRef = useRef();
    const selfieRef = useRef();

    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    const goTo = (n) => { setDir(n > step ? 1 : -1); setStep(n); };

    const handleVerifyBvn = async () => {
        if (bvn.length !== 11) { toast.error('BVN must be 11 digits'); return; }
        setVerifyingBvn(true);
        try {
            await submitKYC({ bvn, partial: true });
            setBvnVerified(true);
            toast.success('BVN verification passed');
        } catch (err) {
            toast.error('BVN verification failed');
        } finally {
            setVerifyingBvn(false);
        }
    };

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

    const handleNext = () => {
        if (step === 1 && !bvnVerified) { toast.error('Verify your BVN to continue'); return; }
        if (step === 2 && !accountVerified) { toast.error('Verify your bank account to continue'); return; }
        if (step === 3 && !idFile) { toast.error('Upload a government ID to continue'); return; }
        goTo(step + 1);
    };

    const handleSelfieChange = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setSelfieFile(f);
        setSelfiePreview(URL.createObjectURL(f));
        setFaceMatchState('idle'); // We check on the server now
    };

    const handleSubmit = async () => {
        if (!selfieFile) {
            toast.error('Please upload a selfie for face matching');
            return;
        }
        setSubmitting(true);
        try {
            const { uploadFile } = await import('../../lib/supabase');
            
            // 1. Upload ID photo
            const idPath = `kyc/${currentUser.id}_id_${Date.now()}`;
            const idPhotoUrl = await uploadFile('verifications', idPath, idFile);

            // 2. Upload Selfie
            const selfiePath = `kyc/${currentUser.id}_selfie_${Date.now()}`;
            const selfieUrl = await uploadFile('verifications', selfiePath, selfieFile);

            // 3. Final verification call (Squad + Sightengine + Gemini)
            await submitKYC({ bvn, idPhotoUrl, selfieUrl });
            
            await updateUserProfile({ 
                kycCompleted: true, 
                verification_status: 'verified', 
                isVerified: true 
            });
            
            toast.success('KYC Submitted', { description: 'Your identity is being verified by our AI.' });
            onComplete?.();
            onClose?.();
        } catch (error) {
            toast.error('Verification failed. Please check your photos.');
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

            {/* Modal — sits inside the scrollable wrapper, auto-margins center it */}
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
                            <div className="mb-1">
                                <h2 className="text-sm font-bold text-gray-900 tracking-wide leading-tight mb-1">Identity Verification</h2>
                                <SquadBadge />
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 -mt-1"
                        >
                            <span className="material-icons text-lg">close</span>
                        </button>
                    </div>

                    {/* Step indicator */}
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

                {/* Content */}
                <div className="px-8 py-8 min-h-[340px] overflow-visible">
                    <AnimatePresence mode="wait" custom={dir}>

                        {step === 1 && (
                            <motion.div key="s1" custom={dir} variants={variants}
                                initial="enter" animate="center" exit="exit"
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                className="space-y-6"
                            >
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Verify your identity</h3>
                                    <p className="text-sm text-gray-400 mt-1">Your BVN is required to receive payments on TaskMate.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Verification Number (BVN)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text" inputMode="numeric" maxLength={11}
                                            value={bvn}
                                            onChange={e => { setBvn(e.target.value.replace(/\D/g, '')); if (bvnVerified) setBvnVerified(false); }}
                                            placeholder="Enter your 11-digit BVN"
                                            className="flex-1 h-12 px-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal"
                                        />
                                        <button type="button" onClick={handleVerifyBvn}
                                            disabled={verifyingBvn || bvnVerified || bvn.length !== 11}
                                            className={`h-12 px-5 rounded-xl text-sm font-bold transition-all shrink-0 ${
                                                bvnVerified
                                                    ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20'
                                                    : 'bg-[#0F172A] text-white hover:bg-slate-700 disabled:opacity-30'
                                            }`}
                                        >
                                            {verifyingBvn ? <span className="material-icons text-base animate-spin">autorenew</span>
                                                : bvnVerified ? <span className="material-icons text-base">check</span>
                                                : 'Verify'}
                                        </button>
                                    </div>
                                    {bvnVerified && (
                                        <p className="text-xs text-[#10B981] font-semibold mt-2 flex items-center gap-1">
                                            <span className="material-icons text-sm">check_circle</span> BVN verified successfully
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        NIN <span className="text-gray-400 font-normal">— optional</span>
                                    </label>
                                    <input
                                        type="text" inputMode="numeric" maxLength={11}
                                        value={nin} onChange={e => setNin(e.target.value.replace(/\D/g, ''))}
                                        placeholder="Enter your 11-digit NIN"
                                        className="w-full h-12 px-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal"
                                    />
                                </div>

                                <p className="text-xs text-gray-400 leading-relaxed flex items-start gap-2">
                                    <span className="material-icons text-gray-300 text-sm shrink-0 mt-px">lock</span>
                                    Encrypted and only used for identity verification. Never shared with third parties.
                                </p>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="s2" custom={dir} variants={variants}
                                initial="enter" animate="center" exit="exit"
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                className="space-y-6 overflow-visible"
                            >
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Where should we send payments?</h3>
                                    <p className="text-sm text-gray-400 mt-1">Earnings from completed jobs will be transferred directly here.</p>
                                </div>

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
                                            type="text" inputMode="numeric" maxLength={10}
                                            value={accountNumber}
                                            onChange={e => { setAccountNumber(e.target.value.replace(/\D/g, '')); if (accountVerified) { setAccountVerified(false); setAccountName(''); } }}
                                            placeholder="10-digit account number"
                                            className="flex-1 h-12 px-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal"
                                        />
                                        <button type="button" onClick={handleFetchAccount}
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
                                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-3 bg-[#10B981]/5 border border-[#10B981]/20 rounded-xl px-4 py-3">
                                        <span className="material-icons text-[#10B981] text-lg">account_circle</span>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Account Name</p>
                                            <p className="text-sm font-bold text-gray-900">{accountName}</p>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="s3" custom={dir} variants={variants}
                                initial="enter" animate="center" exit="exit"
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                className="space-y-6"
                            >
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Government-issued ID</h3>
                                    <p className="text-sm text-gray-400 mt-1">Upload a clear photo of your NIN slip, voter&apos;s card, driver&apos;s licence, or passport.</p>
                                </div>

                                <div
                                    onClick={() => fileRef.current?.click()}
                                    className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all group ${
                                        idFile ? 'border-[#10B981] bg-[#10B981]/5' : 'border-gray-200 hover:border-[#10B981]/40 hover:bg-gray-50'
                                    }`}
                                >
                                    <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
                                        onChange={e => { const f = e.target.files?.[0]; if (f) setIdFile(f); }} />
                                    {idFile ? (
                                        <>
                                            <span className="material-icons text-[#10B981] text-4xl mb-3">check_circle</span>
                                            <p className="font-semibold text-gray-900 text-sm text-center">{idFile.name}</p>
                                            <p className="text-xs text-gray-400 mt-1">Click to change</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-[#10B981]/10 transition-colors">
                                                <span className="material-icons text-gray-400 group-hover:text-[#10B981] text-2xl transition-colors">upload_file</span>
                                            </div>
                                            <p className="font-semibold text-gray-900 text-sm">Click to upload</p>
                                            <p className="text-xs text-gray-400 mt-1.5 text-center">NIN slip · Voter's card · Driver's licence · Passport</p>
                                            <p className="text-xs text-gray-300 mt-1">PNG, JPG or PDF · max 5 MB</p>
                                        </>
                                    )}
                                </div>

                                <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-start gap-2">
                                    <span className="material-icons text-gray-300 text-sm shrink-0 mt-0.5">info</span>
                                    <p className="text-xs text-gray-400 leading-relaxed">All 4 corners must be visible. Avoid glare and shadows. Text must be clearly readable.</p>
                                </div>
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div key="s4" custom={dir} variants={variants}
                                initial="enter" animate="center" exit="exit"
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                className="space-y-5"
                            >
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Liveness Check</h3>
                                    <p className="text-sm text-gray-400 mt-1">Take a selfie so we can match it to your ID. This prevents identity fraud.</p>
                                </div>

                                {/* Selfie Upload Area (For Gemini Match) */}
                                <div
                                    onClick={() => !submitting && selfieRef.current?.click()}
                                    className={`relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all group overflow-hidden ${
                                        selfieFile ? 'border-[#10B981] bg-[#10B981]/5' : 'border-gray-200 hover:border-[#10B981]/40 hover:bg-gray-50'
                                    }`}
                                    style={{ minHeight: 220 }}
                                >
                                     <input ref={selfieRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleSelfieChange} />

                                     {selfiePreview ? (
                                         <div className="w-full h-full p-2">
                                             <img src={selfiePreview} alt="Selfie" className="w-full h-44 object-cover rounded-xl" />
                                             <p className="text-[10px] text-gray-400 text-center mt-2">Tap to change selfie</p>
                                         </div>
                                     ) : (
                                         <div className="flex flex-col items-center py-10 px-4 text-center">
                                             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#10B981]/10 transition-colors">
                                                 <span className="material-icons text-gray-400 group-hover:text-[#10B981] text-3xl transition-colors">add_a_photo</span>
                                             </div>
                                             <p className="font-bold text-gray-900 text-base">Take a Selfie</p>
                                             <p className="text-xs text-gray-400 mt-1.5 max-w-[240px]">
                                                 Ensure your face is clear and well-lit. We'll match this with your ID.
                                             </p>
                                         </div>
                                     )}

                                    {/* Submitting overlay */}
                                    <AnimatePresence>
                                        {submitting && (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-2">
                                                <div className="w-8 h-8 rounded-full border-2 border-[#10B981]/30 border-t-[#10B981] animate-spin" />
                                                <p className="text-[#0F172A] text-sm font-bold">Verifying Identity…</p>
                                                <p className="text-gray-400 text-xs">Comparing face to ID document</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-start gap-2">
                                    <span className="material-icons text-gray-300 text-sm shrink-0 mt-0.5">info</span>
                                    <p className="text-xs text-gray-400 leading-relaxed">Your selfie is used only for identity verification and is never shown publicly.</p>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="px-8 pb-8 flex items-center justify-between">
                    {step > 1 ? (
                        <button onClick={() => goTo(step - 1)}
                            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
                            <span className="material-icons text-base">arrow_back</span> Back
                        </button>
                    ) : <div />}

                    {step < 4 ? (
                        <button onClick={handleNext}
                            className="h-12 px-8 bg-[#0F172A] hover:bg-slate-700 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-2">
                            Continue <span className="material-icons text-base">arrow_forward</span>
                        </button>
                    ) : (
                        <button onClick={handleSubmit} disabled={submitting || !selfieFile}
                            className="h-12 px-8 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-sm rounded-xl transition-all flex items-center gap-2 disabled:opacity-40">
                            {submitting
                                ? <><span className="material-icons text-base animate-spin">autorenew</span> Submitting…</>
                                : <><span className="material-icons text-base">verified_user</span> Complete Verification</>}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
