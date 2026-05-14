import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import TopNavbar from '../../components/layout/TopNavbar';
import EditPayoutAccountModal from '../../components/provider/EditPayoutAccountModal';
import { supabase } from '../../lib/supabase';
import EarningsChart from '../../components/provider/EarningsChart';
import EarningsChartModal from '../../components/provider/EarningsChartModal';
import TransactionDrawer from '../../components/provider/TransactionDrawer';

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
    const { jobs } = useData();
    const { currentUser } = useAuth();
    const [commissionBalance, setCommissionBalance] = useState(0);
    const [walletBalance, setWalletBalance] = useState(0);
    const [payoutModalOpen, setPayoutModalOpen] = useState(false);
    const [payoutVersion, setPayoutVersion] = useState(0);
    const [ledger, setLedger] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showChartModal, setShowChartModal] = useState(false);
    const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setCommissionBalance(currentUser.commissionBalance || 0);
            fetchWalletData();
        }
    }, [currentUser]);

    const fetchWalletData = async () => {
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

            // 2. Fetch ledger history
            const { data: ledgerData, error: ledgerError } = await supabase
                .from('wallet_ledger')
                .select('*')
                .eq('provider_id', currentUser.id)
                .order('created_at', { ascending: false });
            
            if (!ledgerError) setLedger(ledgerData || []);

        } catch (error) {
            console.error('Wallet fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const { weeklyData, totalEarnings, monthlyEarnings, maxVal } = useMemo(() => {
        if (!currentUser) return { weeklyData: Array(7).fill(0), totalEarnings: 0, monthlyEarnings: 0, maxVal: 1000 };

        const credits = ledger.filter(item => item.entry_type === 'credit');
        const now = new Date();
        
        const monthlyEarnings = credits.reduce((acc, item) => {
            const d = new Date(item.created_at);
            if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
                return acc + Number(item.amount);
            }
            return acc;
        }, 0);

        const allTimeEarnings = credits.reduce((acc, item) => acc + Number(item.amount), 0);

        const weekData = Array(7).fill(0);
        credits.forEach(item => {
            const d = new Date(item.created_at);
            // Only count if within the current week
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            if (d >= startOfWeek) {
                weekData[d.getDay()] += Number(item.amount);
            }
        });

        return { weeklyData: weekData, totalEarnings: allTimeEarnings, monthlyEarnings, maxVal: Math.max(...weekData, 1000) };
    }, [ledger, currentUser]);

    const commissionPct = Math.min((commissionBalance / 5000) * 100, 100);

    const payoutAccount = useMemo(() => {
        if (!currentUser) return null;
        const bankName = currentUser.bankName?.trim();
        const accountNumber = currentUser.accountNumber?.trim();
        const accountName = currentUser.accountName?.trim();
        if (!bankName && !accountNumber && !accountName) return null;
        return { bankName, accountNumber, accountName };
    }, [currentUser, payoutVersion]);

    return (
        <div className="min-h-screen bg-white flex font-sans">
            <ProviderSidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopNavbar breadcrumbs={['Earnings']} />

                <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
                    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

                            {/* Available Wallet Balance (Squad Platform Wallet) */}
                            <div className="bg-[#0F172A] text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <span className="material-icons-outlined text-9xl">wallet</span>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">Available Balance</p>
                                    <h2 className="text-3xl font-bold mb-5">
                                        {(walletBalance || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                                    </h2>
                                    <p className="text-xs opacity-70 font-medium mb-4">From customer payments via your VA</p>
                                    <button className="w-full py-2.5 bg-[#1E40AF] hover:bg-[#1e3a8a] text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                                        Withdraw
                                        <span className="material-icons-outlined text-base">arrow_outward</span>
                                    </button>
                                </div>
                            </div>

                            {/* Total Earnings */}
                            <div className="bg-[#10B981] text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <span className="material-icons-outlined text-9xl">attach_money</span>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">Total Earnings</p>
                                    <h2 className="text-3xl font-bold mb-3">
                                        {totalEarnings.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                                    </h2>
                                    <p className="text-sm opacity-80 font-medium">
                                        This month: <span className="font-bold">₦{monthlyEarnings.toLocaleString()}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Weekly Chart - Clickable */}
                            <button 
                                onClick={() => setShowChartModal(true)}
                                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between text-left hover:border-[#10B981]/50 transition-all active:scale-[0.98] group"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Weekly Trend</p>
                                    <span className="material-icons-outlined text-gray-300 group-hover:text-[#10B981] transition-colors text-lg">zoom_in</span>
                                </div>
                                <div className="h-32 mt-auto relative w-full -mx-5 px-0">
                                    <EarningsChart 
                                        data={weeklyData} 
                                        height={120} 
                                        showXAxis={true} 
                                        showYAxis={false} 
                                        showDots={true} 
                                    />
                                </div>
                            </button>
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
                                <div className="divide-y divide-gray-50">
                                    {ledger.length > 0 ? (
                                        ledger.map((item) => (
                                            <div key={item.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                                                        item.entry_type === 'credit' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                                                    }`}>
                                                        <span className="material-icons-outlined text-base">
                                                            {item.entry_type === 'credit' ? 'add' : 'remove'}
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-gray-900 truncate">{item.description}</p>
                                                        <p className="text-xs text-gray-400">
                                                            {new Date(item.created_at).toLocaleDateString()} · #{item.id.substring(0, 8)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0 ml-4">
                                                    <p className={`text-sm font-bold ${
                                                        item.entry_type === 'credit' ? 'text-emerald-600' : 'text-red-600'
                                                    }`}>
                                                        {item.entry_type === 'credit' ? '+' : '-'} ₦{Number(item.amount).toLocaleString()}
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
            <EarningsChartModal 
                isOpen={showChartModal} 
                onClose={() => setShowChartModal(false)} 
                weeklyData={weeklyData} 
                maxVal={maxVal} 
            />

            <TransactionDrawer 
                isOpen={showHistoryDrawer} 
                onClose={() => setShowHistoryDrawer(false)} 
                ledger={ledger} 
            />
        </div>
    );
};

export default Earnings;
