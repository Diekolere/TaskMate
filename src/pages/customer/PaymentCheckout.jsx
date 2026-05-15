import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Sidebar from '../../components/layout/Sidebar';
import TopNavbar from '../../components/layout/TopNavbar';
import MobileNavBar from '../../components/layout/MobileNavBar';
import { useData } from '../../context/DataContext';
import { supabase } from '../../lib/supabase';

const COMMISSION_RATE = 0.1;

/* Simulate Squad payment-verification call */
const verifySquadPayment = (reference) =>
    new Promise((resolve) => setTimeout(() => resolve({ status: 'success', reference }), 2200));

const PaymentCheckout = () => {
    const { requestId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { requests } = useData();

    const stateAgreedPrice = location.state?.agreedPrice;
    const stateProvider = location.state?.provider;

    const [request, setRequest] = useState(null);
    const [vAccount, setVAccount] = useState(null);       // virtual account details
    const [generating, setGenerating] = useState(true);   // generating account
    const [verifying, setVerifying] = useState(false);    // verifying transfer
    const [step, setStep] = useState('account');          // 'account' | 'verifying' | 'success'
    const [copied, setCopied] = useState(null);           // which field was copied
    const [fetchError, setFetchError] = useState(null);   // fetch error message

    useEffect(() => {
        const req = requests.find(r => r.id === requestId);
        const resolved = req || {
            id: requestId || 'demo-001',
            title: 'Fix Bathroom Plumbing',
            category: 'Plumbing',
            agreedPrice: stateAgreedPrice || 11000,
            providerName: stateProvider?.full_name || 'Ibrahim Musa',
            location: 'Lekki Phase 1, Lagos',
        };
        setRequest(resolved);

        // Fetch provider's static VA from database
        const fetchProviderVA = async () => {
            try {
                console.log('DEBUG: Initiating VA fetch for Request ID:', requestId);
                
                // Get the job to find provider_id
                const { data: job, error: jobError } = await supabase
                    .from('jobs')
                    .select('worker_id, status')
                    .eq('id', requestId)
                    .maybeSingle();

                console.log('DEBUG: Database Job record:', job);
                console.log('DEBUG: Navigation State Provider:', stateProvider);

                let providerId = job?.worker_id || stateProvider?.id;
                
                if (!providerId) {
                    console.log('DEBUG: Worker ID missing, attempting recovery from negotiations...');
                    const { data: latestNeg } = await supabase
                        .from('negotiations')
                        .select('provider_id')
                        .eq('job_id', requestId)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();
                    
                    if (latestNeg?.provider_id) {
                        providerId = latestNeg.provider_id;
                        console.log('DEBUG: Recovered Provider ID from negotiations:', providerId);
                    }
                }

                console.log('DEBUG: Resolved Provider ID:', providerId);
                
                if (!providerId) {
                    console.error('DEBUG ERROR: No provider ID found in DB, State, or Negotiations. Job Status:', job?.status);
                    throw new Error('Provider not assigned to this job');
                }

                // Fetch the provider's VA
                console.log('DEBUG: Fetching VA for Provider:', providerId);
                const { data: va, error: vaError } = await supabase
                    .from('virtual_accounts')
                    .select('*')
                    .eq('provider_id', providerId)
                    .maybeSingle();

                if (vaError) {
                    console.error('DEBUG: VA Fetch Error:', vaError);
                    throw new Error(`VA error: ${vaError.message}`);
                }
                console.log('DEBUG: Virtual Account found:', va);

                if (!va) {
                    console.log('VA not found, attempting to create one via Edge Function...');
                    // Get provider details to create VA
                    const { data: provider } = await supabase
                        .from('profiles')
                        .select('email, full_name, phone_number')
                        .eq('id', providerId)
                        .single();

                    if (!provider) {
                        throw new Error('Could not find provider profile details');
                    }

                    const names = (provider.full_name || 'Provider').split(' ');
                    const firstName = names[0];
                    const lastName = names.slice(1).join(' ') || 'TaskMate';

                    const { data: createData, error: createError } = await supabase.functions.invoke('squad', {
                         body: {
                             action: 'create-static-virtual-account',
                             providerId: providerId,
                             providerEmail: provider.email,
                             providerFirstName: firstName,
                             providerLastName: lastName,
                             providerPhone: provider.phone_number
                         }
                    });

                    if (createError || !createData?.success) {
                        console.error('VA Creation Error:', createError || createData);
                        throw new Error(createData?.error || 'Failed to create virtual account for provider');
                    }

                    // Calculate amount
                    const amount = Number(stateAgreedPrice || resolved.agreedPrice || resolved.proposed_price || resolved.budget_estimate || 11000);

                    // VA was created, use the returned data
                    setVAccount({
                        bank: createData.data.beneficiary_bank_name || 'GTBank',
                        accountNumber: createData.data.virtual_account_number,
                        accountName: createData.data.account_name || 'TaskMate Platform',
                        amount,
                        expiresIn: null,
                    });
                } else {
                    // Calculate amount
                    const amount = Number(stateAgreedPrice || resolved.agreedPrice || resolved.proposed_price || resolved.budget_estimate || 11000);

                    // VA already exists
                    setVAccount({
                        bank: va.beneficiary_bank_name || 'GTBank',
                        accountNumber: va.virtual_account_number,
                        accountName: va.account_name || 'TaskMate Platform',
                        amount,
                        expiresIn: null,
                    });
                }
                setFetchError(null);
                setGenerating(false);
            } catch (error) {
                console.error('Error fetching VA:', error);
                setFetchError(error.message);
                toast.error(error.message || 'Could not load payment details.');
                setGenerating(false);
            }
        };

        fetchProviderVA();
    }, [requestId, requests, stateAgreedPrice, stateProvider]);

    const amount = Number(stateAgreedPrice || request?.agreedPrice || request?.proposed_price || request?.budget_estimate || 11000);
    const commission = Math.round(amount * COMMISSION_RATE);
    const providerReceives = amount - commission;

    const copy = async (text, label) => {
        await navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleCertify = async () => {
        if (!vAccount?.accountNumber) {
            console.error('handleCertify aborted: No account number in state');
            toast.error('Payment details not fully loaded');
            return;
        }

        setVerifying(true);
        try {
            console.log('STEP 1: Initiating Sandbox Simulation for VA:', vAccount.accountNumber, 'Amount:', vAccount.amount);

            const { data, error } = await supabase.functions.invoke('squad', {
                body: {
                    action: 'simulate-va-payment',
                    virtual_account_number: vAccount.accountNumber,
                    amount: vAccount.amount
                }
            });

            console.log('STEP 2: Edge Function response received:', { data, error });

            if (error) {
                console.error('STEP 3: Supabase Function Error:', error);
                throw new Error('Edge Function failed to respond');
            }

            if (!data?.success) {
                console.error('STEP 3: Squad API Logic Error:', data);
                throw new Error(data?.message || 'Simulation failed at Squad API level');
            }

            console.log('STEP 4: Updating job status in DB...');
            await supabase
                .from('jobs')
                .update({ status: 'payment_secured' })
                .eq('id', requestId);

            console.log('STEP 5: Simulation successful! Redirecting...');
            setStep('success');
            
            setTimeout(() => {
                navigate(`/customer/request-status/${requestId}`, { replace: true, state: { paymentConfirmed: true, jobId: requestId } });
            }, 3000);

        } catch (error) {
            console.error('CRITICAL: handleCertify caught error:', error);
            toast.error(error.message || 'Verification failed');
            setStep('account');
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-white font-sans text-gray-900">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <TopNavbar breadcrumbs={['Customer', 'My Requests', 'Checkout']} />

                <main className="flex-1 overflow-y-auto bg-white pb-24 md:pb-0">
                    <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8 pb-24 md:pb-10">

                        {/* ── Success ── */}
                        <AnimatePresence mode="wait">
                            {step === 'success' && (
                                <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center justify-center py-24 text-center">
                                    <div className="w-20 h-20 bg-[#10B981] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#10B981]/30">
                                        <span className="material-icons text-white text-4xl">check</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Confirmed!</h2>
                                    <p className="text-gray-400 text-sm">Funds are held securely. Generating your job code…</p>
                                </motion.div>
                            )}

                            {/* ── Verifying ── */}
                            {step === 'verifying' && (
                                <motion.div key="verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-24 text-center gap-5">
                                    <div className="relative w-16 h-16">
                                        <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
                                        <div className="absolute inset-0 rounded-full border-4 border-[#10B981] border-t-transparent animate-spin" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 mb-1">Verifying your transfer…</h2>
                                        <p className="text-sm text-gray-400">Checking with Squad · this takes a few seconds</p>
                                    </div>
                                </motion.div>
                            )}

                            {/* ── Account / main ── */}
                            {step === 'account' && (
                                <motion.div key="account" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6">

                                    {/* Page title */}
                                    <div>
                                        <h1 className="text-[22px] sm:text-[28px] font-extrabold text-gray-900 tracking-tight">Secure Payment</h1>
                                        <p className="mt-1 text-sm text-gray-500">Transfer the exact amount to the account below to confirm your booking.</p>
                                    </div>

                                    {/* Payment card */}
                                    <div className="space-y-4">

                                        {generating ? (
                                            <div className="rounded-2xl border border-gray-100 p-12 flex flex-col items-center gap-4">
                                                <div className="relative w-10 h-10">
                                                    <div className="absolute inset-0 rounded-full border-[3px] border-gray-100" />
                                                    <div className="absolute inset-0 rounded-full border-[3px] border-[#10B981] border-t-transparent animate-spin" />
                                                </div>
                                                <p className="text-sm text-gray-400 font-medium">Generating your payment account…</p>
                                            </div>
                                        ) : fetchError ? (
                                            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex flex-col items-center gap-3">
                                                <span className="material-icons text-red-500 text-4xl">error_outline</span>
                                                <div className="text-center">
                                                    <p className="text-sm font-bold text-red-900 mb-1">Could not load payment details</p>
                                                    <p className="text-xs text-red-700 mb-4">{fetchError}</p>
                                                    <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors">
                                                        Retry
                                                    </button>
                                                </div>
                                            </div>
                                        ) : vAccount ? (
                                            <div className="rounded-2xl border border-gray-100 overflow-hidden">
                                                {/* Squad header */}
                                                <div className="bg-[#0F172A] px-6 py-5 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mb-1">Payment Account</p>
                                                        <p className="text-white font-black text-2xl">₦{amount.toLocaleString()}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 bg-white/10 border border-white/10 rounded-xl px-3 py-1.5">
                                                        <img src="/squad.png" alt="Squad" className="h-4 w-auto object-contain" />
                                                    </div>
                                                </div>

                                                {/* Account details — 1 per row */}
                                                <div className="p-5 space-y-0">
                                                    {[
                                                        { label: 'Bank', value: vAccount?.bank },
                                                        { label: 'Account Number', value: vAccount?.accountNumber, copyable: true, copyVal: vAccount?.accountNumber },
                                                        { label: 'Account Name', value: vAccount?.accountName },
                                                        { label: 'Amount', value: `₦${Number(vAccount?.amount).toLocaleString()}`, copyable: true, copyVal: String(vAccount?.amount) },
                                                    ].map((row, i, arr) => (
                                                        <div key={row.label}
                                                            className={`flex items-center justify-between py-3.5 ${i !== arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                                            <div>
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{row.label}</p>
                                                                <p className="text-sm font-semibold text-gray-600">{row.value}</p>
                                                            </div>
                                                            {row.copyable && (
                                                                <button onClick={() => copy(row.copyVal, row.label)}
                                                                    className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-all shrink-0 ml-4 ${copied === row.label ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                                                    <span className="material-icons text-sm">{copied === row.label ? 'check' : 'content_copy'}</span>
                                                                    <span>{copied === row.label ? 'Copied' : 'Copy'}</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Expiry notice */}
                                                <div className="mx-5 mb-5 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                                                    <span className="material-icons text-blue-500 text-base shrink-0">info</span>
                                                    <p className="text-xs text-blue-700 font-medium">
                                                        This account is <span className="font-bold">permanent</span> and belongs to the provider. Transfer the <span className="font-bold">exact amount</span> shown above.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="rounded-2xl border border-gray-100 p-12 flex flex-col items-center gap-4">
                                                <div className="relative w-10 h-10">
                                                    <div className="absolute inset-0 rounded-full border-[3px] border-gray-100" />
                                                    <div className="absolute inset-0 rounded-full border-[3px] border-[#10B981] border-t-transparent animate-spin" />
                                                </div>
                                                <p className="text-sm text-gray-400 font-medium">Loading payment details…</p>
                                            </div>
                                        )}

                                        {/* Certify button */}
                                        {!generating && (
                                            <button onClick={handleCertify} disabled={verifying}
                                                className="w-full py-4 bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-[#10B981]/20 flex items-center justify-center gap-2">
                                                <span className="material-icons text-base">verified</span>
                                                Confirm Transfer
                                            </button>
                                        )}

                                        {/* Help text */}
                                        <p className="text-xs text-gray-400 text-center">
                                            After transferring, tap the button above — we'll verify with Squad automatically.
                                        </p>
                                    </div>

                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>

                <MobileNavBar />
            </div>
        </div>
    );
};

export default PaymentCheckout;
