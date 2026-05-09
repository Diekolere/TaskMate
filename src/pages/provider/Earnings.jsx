import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import TopNavbar from '../../components/layout/TopNavbar';

const Earnings = () => {
    const { jobs } = useData();
    const { currentUser } = useAuth();
    const [commissionBalance, setCommissionBalance] = useState(0);

    useEffect(() => {
        if (currentUser) setCommissionBalance(currentUser.commissionBalance || 0);
    }, [currentUser]);

    const { transactions, weeklyData, totalEarnings, monthlyEarnings, maxVal } = useMemo(() => {
        if (!currentUser) return { transactions: [], weeklyData: Array(7).fill(0), totalEarnings: 0, monthlyEarnings: 0, maxVal: 1000 };

        const userId = currentUser.uid || currentUser.id;
        const completed = jobs.filter(job =>
            (job.providerId === userId || job.provider_id === userId) &&
            (job.status === 'Completed' || job.status === 'Paid')
        );

        const now = new Date();
        const monthlyEarnings = completed.reduce((acc, job) => {
            let d = job.completedAt instanceof Date ? job.completedAt : (job.completedAt ? new Date(job.completedAt) : null);
            if (!d && job.updatedAt) d = job.updatedAt instanceof Date ? job.updatedAt : new Date(job.updatedAt);
            if (d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
                return acc + (Number(job.finalAmount) || Number(job.budget) || 0);
            }
            return acc;
        }, 0);

        const allTimeEarnings = completed.reduce((acc, job) => acc + (Number(job.finalAmount) || Number(job.budget) || 0), 0);

        const weekData = Array(7).fill(0);
        completed.forEach(job => {
            let d = job.completedAt instanceof Date ? job.completedAt : (job.completedAt ? new Date(job.completedAt) : null);
            if (!d && job.updatedAt) d = job.updatedAt instanceof Date ? job.updatedAt : new Date(job.updatedAt);
            if (d) weekData[d.getDay()] += (Number(job.finalAmount) || Number(job.budget) || 0);
        });

        const txs = completed.map(job => ({
            id: job.id,
            type: 'credit',
            description: `Job: ${job.serviceType || job.title}`,
            date: job.completedAt instanceof Date ? job.completedAt.toLocaleDateString() : (job.completedAt ? new Date(job.completedAt).toLocaleDateString() : 'Recently'),
            amount: `₦${(Number(job.finalAmount) || Number(job.budget) || 0).toLocaleString()}`,
            status: 'Completed',
        })).sort((a, b) => new Date(b.date) - new Date(a.date));

        return { transactions: txs, weeklyData: weekData, totalEarnings: allTimeEarnings, monthlyEarnings, maxVal: Math.max(...weekData, 1000) };
    }, [jobs, currentUser]);

    const commissionPct = Math.min((commissionBalance / 5000) * 100, 100);

    return (
        <div className="min-h-screen bg-white flex font-sans">
            <ProviderSidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopNavbar breadcrumbs={['Earnings']} />

                <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
                    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

                            {/* Outstanding Commission */}
                            <div className="bg-[#0F172A] text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <span className="material-icons-outlined text-9xl">account_balance_wallet</span>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-1">Outstanding Commission</p>
                                    <h2 className="text-3xl font-bold mb-5">
                                        {(commissionBalance || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                                    </h2>
                                    <button className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                                        Pay Commission
                                        <span className="material-icons-outlined text-base">payments</span>
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

                            {/* Weekly Chart */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Weekly Trend</p>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {weeklyData.reduce((a, b) => a + b, 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                                    </h2>
                                </div>
                                <div className="flex items-end justify-between h-20 gap-1.5 mt-4">
                                    {weeklyData.map((val, i) => (
                                        <div key={i} className="flex flex-col items-center gap-1 flex-1">
                                            <div
                                                className="w-full bg-[#10B981]/15 hover:bg-[#10B981]/30 rounded-t transition-colors"
                                                style={{ height: `${Math.max((val / (maxVal || 1)) * 100, 4)}%` }}
                                            />
                                            <span className="text-[9px] text-gray-400 font-semibold">{'SMTWTFS'[i]}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Commission Limit Bar */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-gray-900">Commission Debt Limit</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">Account restricted when this limit is exceeded</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">₦{commissionBalance.toLocaleString()} / ₦5,000</p>
                                    <p className={`text-xs font-semibold mt-0.5 ${commissionPct > 80 ? 'text-red-500' : 'text-[#10B981]'}`}>
                                        {commissionPct.toFixed(0)}% used
                                    </p>
                                </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div
                                    className={`h-2.5 rounded-full transition-all ${commissionPct > 80 ? 'bg-red-500' : 'bg-[#10B981]'}`}
                                    style={{ width: `${commissionPct}%` }}
                                />
                            </div>
                        </div>

                        {/* Transaction History */}
                        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900">Commission History</h3>
                                <button className="text-sm font-semibold text-gray-400 hover:text-gray-700 transition-colors">View All</button>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {transactions.length > 0 ? (
                                    transactions.map((trx) => (
                                        <div key={trx.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-9 h-9 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center shrink-0">
                                                    <span className="material-icons-outlined text-base">check_circle</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 truncate">{trx.description}</p>
                                                    <p className="text-xs text-gray-400">{trx.date} · #{trx.id.substring(0, 8)}</p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0 ml-4">
                                                <p className="text-sm font-bold text-gray-900">{trx.amount}</p>
                                                <p className="text-xs text-[#10B981] font-semibold capitalize">{trx.status}</p>
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

                        {/* Payment Method */}
                        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Payment Method</h3>
                                <button className="text-sm font-semibold text-[#10B981] hover:underline">Change</button>
                            </div>
                            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100">
                                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                                    <span className="material-icons-outlined text-gray-400">credit_card</span>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">Mastercard •••• 4291</p>
                                    <p className="text-xs text-gray-500">Expires 12/26</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
            </div>

            <ProviderMobileNavBar />
        </div>
    );
};

export default Earnings;
