import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { useAuth } from '../../context/AuthContext';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import TopNavbar from '../../components/layout/TopNavbar';
import EditPayoutAccountModal from '../../components/provider/EditPayoutAccountModal';
import WithdrawalModal from '../../components/provider/WithdrawalModal';
import { supabase } from '../../lib/supabase';
import TransactionDrawer from '../../components/provider/TransactionDrawer';
import { useJobs } from '../../context/JobContext';

function BankBuildingIllustration({ className }) {
    return (
        <svg className={className} viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M60 8L12 28v6h96v-6L60 8z" fill="white" fillOpacity="0.12" />
            <path d="M60 8L12 28v2l48-18 48 18v-2L60 8z" fill="white" fillOpacity="0.06" />
            <path d="M20 34h80v52H20V34zm8 8v36h12V42H28zm16 0v36h12V42H44zm16 0v36h12V42H60zm16 0v36h12V42H76z" fill="white" fillOpacity="0.08" />
            <path d="M28 42h12v36H28V42zm16 0h12v36H44V42zm16 0h12v36H60V42zm16 0h12v36H76V42z" fill="white" fillOpacity="0.04" />
            <path d="M52 86h16v8H52v-8z" fill="white" fillOpacity="0.1" />
            <rect x="16" y="86" width="88" height="6" rx="2" fill="white" fillOpacity="0.07" />
        </svg>
    );
}

const Earnings = () => {
    const { jobs } = useJobs();
    const { currentUser } = useAuth();
    const [commissionBalance, setCommissionBalance] = useState(0);
    const [walletBalance, setWalletBalance] = useState(0);
    const [escrowBalance, setEscrowBalance] = useState(0);
    const [payoutModalOpen, setPayoutModalOpen] = useState(false);
    const [payoutVersion, setPayoutVersion] = useState(0);
    const [ledger, setLedger] = useState([]);
    const [fullHistory, setFullHistory] = useState([]);
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [monthlyEarnings, setMonthlyEarnings] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
    const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setCommissionBalance(currentUser.commissionBalance || 0);
            fetchWalletData();
        }
    }, [currentUser, payoutVersion, fetchWalletData]);

    const handlePayoutComplete = () => {
        // Add a small delay to ensure DB triggers have finished
        setTimeout(() => {
            fetchWalletData();
        }, 800);
    };

    const fetchWalletData = useCallback(async () => {
        setLoading(true);
        try {
            if (!currentUser?.id) return;
            
            // 1. Fetch wallet balance
            const { data: profile, error: profileError } = await supabase
                .from('provider_profiles')
                .select('wallet_balance')
                .eq('id', currentUser.id)
                .single();
            
            if (!profileError) setWalletBalance(profile?.wallet_balance || 0);

            // 3. Fetch escrow balance (sum of held entries for this provider)
            const { data: escrowData } = await supabase
                .from('escrow_ledger')
                .select('net_amount, job_id, jobs(status)')
                .eq('provider_id', currentUser.id)
                .eq('entry_type', 'held');

            if (escrowData) {
                // Cross-reference: only include jobs that are still 'held' AND not yet completed/released in job status
                const { data: releasedJobs } = await supabase
                    .from('escrow_ledger')
                    .select('job_id')
                    .eq('provider_id', currentUser.id)
                    .eq('entry_type', 'released');

                const releasedJobIds = new Set((releasedJobs || []).map(r => r.job_id));
                const held = escrowData
                    .filter(e => {
                        const isReleased = releasedJobIds.has(e.job_id);
                        const isJobDone = e.jobs?.status === 'completed' || e.jobs?.status === 'payment_released';
                        return !isReleased && !isJobDone;
                    })
                    .reduce((sum, e) => sum + Number(e.net_amount || 0), 0);
                setEscrowBalance(held);
            }

            // 2. Fetch history (Merged Wallet Ledger + Escrow Ledger)
            const [ledgerRes, escrowLedgerRes] = await Promise.all([
                supabase
                    .from('wallet_ledger')
                    .select('*')
                    .eq('provider_id', currentUser.id)
                    .order('created_at', { ascending: false })
                    .limit(20),
                supabase
                    .from('escrow_ledger')
                    .select('*, jobs(title)')
                    .eq('provider_id', currentUser.id)
                    .order('created_at', { ascending: false })
                    .limit(20)
            ]);

            const walletHistory = (ledgerRes.data || []).map(item => ({
                ...item,
                source: 'wallet'
            }));

            const escrowHistory = (escrowLedgerRes.data || []).map(item => ({
                ...item,
                id: item.id,
                amount: item.gross_amount,
                description: item.entry_type === 'held' 
                    ? `Payment Held in Escrow: ${item.jobs?.title || 'Job Payment'}`
                    : `Escrow Released: ${item.jobs?.title || 'Job Payment'}`,
                entry_type: item.entry_type === 'held' ? 'escrow' : 'release',
                source: 'escrow'
            }));

            // Merge and sort by date
            const allTransactions = [...walletHistory, ...escrowHistory]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            setFullHistory(allTransactions);
            setLedger(allTransactions.slice(0, 15));

            // 4. Calculate total earnings correctly from full wallet_ledger history
            const { data: allWalletEntries } = await supabase
                .from('wallet_ledger')
                .select('amount, entry_type, metadata, created_at')
                .eq('provider_id', currentUser.id);

            if (allWalletEntries) {
                let allTime = 0;
                let monthly = 0;
                const now = new Date();

                for (const item of allWalletEntries) {
                    let netEarningForThisEntry = 0;

                    if (item.entry_type === 'credit') {
                        // Both Old and New records: add the credit amount
                        // Old record credit is Net. New record credit is Gross.
                        netEarningForThisEntry = Number(item.amount);
                    } else if (item.entry_type === 'debit' && item.metadata?.type === 'commission') {
                        // Is this a commission debit for a New record?
                        const relatedCredit = allWalletEntries.find(c => 
                            c.entry_type === 'credit' && 
                            c.metadata?.job_id === item.metadata?.job_id
                        );
                        if (relatedCredit && Number(relatedCredit.amount) === Number(relatedCredit.metadata?.gross)) {
                            // New Record: we must subtract this commission debit (it's negative, so we add it)
                            netEarningForThisEntry = Number(item.amount);
                        } else {
                            // Old Record: credit was already Net, so ignore this phantom debit
                            netEarningForThisEntry = 0;
                        }
                    }

                    if (netEarningForThisEntry !== 0) {
                        allTime += netEarningForThisEntry;
                        const d = new Date(item.created_at);
                        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
                            monthly += netEarningForThisEntry;
                        }
                    }
                }
                
                setTotalEarnings(allTime);
                setMonthlyEarnings(monthly);
            }
            
        } catch (error) {
            console.error('Wallet fetch error:', error);
        } finally {
            setLoading(false);
        }
    }, [currentUser?.id]);



    const commissionPct = Math.min((commissionBalance / 5000) * 100, 100);

    const payoutAccount = useMemo(() => {
        if (!currentUser) return null;
        const bankName = currentUser.bankName?.trim();
        const bankCode = currentUser.bankCode?.trim();
        const accountNumber = currentUser.accountNumber?.trim();
        const accountName = currentUser.accountName?.trim();
        if (!bankName && !accountNumber && !accountName) return null;
        return { bankName, bankCode, accountNumber, accountName };
    }, [currentUser, payoutVersion]);

    return (
        <div className="min-h-screen bg-white flex font-sans">
            <ProviderSidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopNavbar breadcrumbs={['Earnings']} />

                <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
                    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">
                        {/* Dynamic Greeting */}
                        <div className="mb-2">
                            <h1 className="text-2xl font-bold text-gray-900">
                                {(() => {
                                    const hour = new Date().getHours();
                                    if (hour < 12) return 'Good morning';
                                    if (hour < 17) return 'Good afternoon';
                                    return 'Good evening';
                                })()}, {currentUser?.full_name?.split(' ')[0] || 'Provider'}! 👋
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">Here's what's happening with your earnings today.</p>
                        </div>

                        {/* Summary Cards — 3 column grid on desktop, unique layout on mobile */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">

                            {/* In Escrow — Hero card on mobile */}
                            <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-sky-400 to-blue-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <span className="material-icons-outlined text-9xl">shield</span>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-xs font-semibold uppercase tracking-wider opacity-90 mb-1">In Escrow</p>
                                    <h2 className="text-3xl font-bold mb-3">
                                        {(escrowBalance || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                                    </h2>
                                    <div className="flex items-center gap-1.5 bg-black/10 backdrop-blur-sm px-3 py-1.5 rounded-lg w-fit">
                                        <span className="material-icons-outlined text-white text-sm">lock</span>
                                        <p className="text-[10px] text-white font-medium leading-none">
                                            Held until customer releases payment
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Available Wallet Balance */}
                            <div className="col-span-1 bg-[#0F172A] text-white p-5 sm:p-6 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <span className="material-icons-outlined text-7xl">account_balance_wallet</span>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">Available</p>
                                    <h2 className="text-xl sm:text-2xl font-bold mb-4">
                                        {(walletBalance || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                                    </h2>
                                    <button 
                                        onClick={() => setShowWithdrawalModal(true)}
                                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px] sm:text-xs transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        Withdraw
                                        <span className="material-icons-outlined text-sm">arrow_outward</span>
                                    </button>
                                </div>
                            </div>

                            {/* Total Earnings */}
                            <div className="col-span-1 bg-[#10B981] text-white p-5 sm:p-6 rounded-2xl shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <span className="material-icons-outlined text-7xl">payments</span>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">Total Paid</p>
                                    <h2 className="text-xl sm:text-2xl font-bold mb-3">
                                        {totalEarnings.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                                    </h2>
                                    <p className="text-[10px] opacity-80 font-medium truncate">
                                        Month: <span className="font-bold">₦{monthlyEarnings.toLocaleString()}</span>
                                    </p>
                                </div>
                            </div>

                        </div>

                        {/* Transaction History (2/3) + payout account (1/3) */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
                            <div className="min-w-0 lg:col-span-2 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                                    <h3 className="font-bold text-gray-900">Transaction History</h3>
                                    <button 
                                        type="button" 
                                        onClick={() => setShowHistoryDrawer(true)}
                                        className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                                    >
                                        View All
                                    </button>
                                </div>
                                <div className="divide-y divide-gray-50 max-h-[450px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                                    {ledger.length > 0 ? (
                                        ledger.map((item) => (
                                            <div key={item.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                                                        item.entry_type === 'credit' || item.entry_type === 'release' ? 'bg-emerald-100 text-emerald-600' : 
                                                        item.entry_type === 'escrow' ? 'bg-blue-100 text-blue-600' :
                                                        'bg-red-100 text-red-600'
                                                    }`}>
                                                        <span className="material-icons-outlined text-base">
                                                            {item.entry_type === 'credit' || item.entry_type === 'release' ? 'north_east' : 
                                                             item.entry_type === 'escrow' ? 'shield' : 'south_west'}
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-gray-900 truncate">{item.description}</p>
                                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                                            {new Date(item.created_at).toLocaleDateString()} · {item.source === 'escrow' ? 'Escrow' : 'Wallet'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0 ml-4">
                                                    <p className={`text-sm font-bold ${
                                                        item.entry_type === 'credit' || item.entry_type === 'release' ? 'text-emerald-600' : 
                                                        item.entry_type === 'escrow' ? 'text-blue-600' :
                                                        'text-red-600'
                                                    }`}>
                                                        {item.entry_type === 'credit' || item.entry_type === 'release' || item.entry_type === 'escrow' ? '+' : '-'} ₦{Math.abs(Number(item.amount || 0)).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-12 text-center text-gray-300">
                                            <span className="material-icons-outlined text-4xl">account_balance_wallet</span>
                                            <p className="text-sm mt-2 text-gray-400">No transactions yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="min-w-0 lg:col-span-1">
                                <div className="relative rounded-2xl overflow-hidden bg-[#0F172A] text-white shadow-lg border border-slate-800/80">
                                    <svg
                                        className="absolute z-[2] pointer-events-none -left-[2.25rem] -top-[2.25rem] sm:-left-[2.75rem] sm:-top-[2.75rem] w-[7.5rem] h-[7.5rem] sm:w-[8.75rem] sm:h-[8.75rem]"
                                        viewBox="0 0 100 100"
                                        aria-hidden
                                    >
                                        <circle cx="50" cy="50" r="50" fill="white" fillOpacity="0.05" />
                                    </svg>
                                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/25 to-transparent pointer-events-none z-[1]" />
                                    <div className="absolute z-[2] pointer-events-none -right-[2.25rem] -bottom-[2.25rem] sm:-right-[2.75rem] sm:-bottom-[2.75rem]">
                                        <BankBuildingIllustration className="w-[7.5rem] h-auto sm:w-[8.75rem]" />
                                    </div>

                                    <div className="relative z-10 p-5 border-b border-white/10 flex items-start justify-between gap-3">
                                        <div className="min-w-0 pr-2">
                                            <h3 className="font-bold text-white text-[15px] leading-snug">Payout account</h3>
                                            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">From KYC — payouts settle here</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setPayoutModalOpen(true)}
                                            className="shrink-0 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-colors text-white"
                                            title="Edit bank details"
                                        >
                                            <span className="material-icons-outlined text-[20px]">edit</span>
                                        </button>
                                    </div>

                                    <div className="relative z-10 p-5 pt-4">
                                        {payoutAccount ? (
                                            <dl className="space-y-4">
                                                {payoutAccount.bankName ? (
                                                    <div>
                                                        <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Bank</dt>
                                                        <dd className="text-sm font-semibold text-white">{payoutAccount.bankName}</dd>
                                                    </div>
                                                ) : null}
                                                {payoutAccount.accountName ? (
                                                    <div>
                                                        <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Account name</dt>
                                                        <dd className="text-sm font-semibold text-white/95">{payoutAccount.accountName}</dd>
                                                    </div>
                                                ) : null}
                                                {payoutAccount.accountNumber ? (
                                                    <div>
                                                        <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Account number</dt>
                                                        <dd className="text-sm font-mono font-semibold text-white tracking-wide">{payoutAccount.accountNumber}</dd>
                                                    </div>
                                                ) : null}
                                            </dl>
                                        ) : (
                                            <div className="text-center py-6 px-1">
                                                <div className="w-11 h-11 mx-auto rounded-xl bg-white/10 flex items-center justify-center mb-3">
                                                    <span className="material-icons-outlined text-white/70 text-2xl">account_balance</span>
                                                </div>
                                                <p className="text-sm font-semibold text-white">No payout account yet</p>
                                                <p className="text-xs text-slate-400 mt-1 mb-4">Add the bank you verified during KYC.</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setPayoutModalOpen(true)}
                                                    className="inline-flex items-center justify-center gap-1.5 text-sm font-bold text-[#10B981] hover:text-emerald-400"
                                                >
                                                    Add account
                                                    <span className="material-icons-outlined text-base">arrow_forward</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
            </div>

            <EditPayoutAccountModal
                open={payoutModalOpen}
                onClose={() => setPayoutModalOpen(false)}
                onSaved={() => setPayoutVersion(v => v + 1)}
            />

            <ProviderMobileNavBar />

            {/* ── Modular UI Components (Portals) ── */}
            <TransactionDrawer 
                isOpen={showHistoryDrawer} 
                onClose={() => setShowHistoryDrawer(false)} 
                ledger={ledger} 
            />

            <WithdrawalModal
                isOpen={showWithdrawalModal}
                onClose={() => setShowWithdrawalModal(false)}
                currentBalance={walletBalance}
                payoutAccount={payoutAccount}
                onPayoutComplete={handlePayoutComplete}
            />
        </div>
    );
};

export default Earnings;
