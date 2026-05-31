import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useJobs } from '../../context/JobContext';
import { useAdmin } from '../../context/AdminContext';


const Commission = () => {
    const { requests } = useJobs();
  const { loading } = useAdmin();
    const [transactions, setTransactions] = useState([]);
    const [totalRevenue, setTotalRevenue] = useState(0);

    useEffect(() => {
        if (requests) {
            let revenue = 0;
            const completed = requests.filter(r => r.status === 'Completed' || r.status === 'Paid');
            const data = completed.map(req => {
                const commission = (Number(req.budget) || 0) * 0.06; // 6% Commission
                revenue += commission;
                return {
                    ...req,
                    commission,
                    rawDate: req.updatedAt || req.createdAt
                };
            }).sort((a, b) => {
                const dateA = a.rawDate instanceof Date ? a.rawDate : (a.rawDate?.toDate ? a.rawDate.toDate() : new Date(a.rawDate));
                const dateB = b.rawDate instanceof Date ? b.rawDate : (b.rawDate?.toDate ? b.rawDate.toDate() : new Date(b.rawDate));
                return dateB - dateA;
            });

            setTransactions(data);
            setTotalRevenue(revenue);
        }
    }, [requests]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in relative z-0 font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Commission & Revenue</h2>
                    <p className="text-gray-500">Track platform earnings from completed jobs.</p>
                </div>
                
                <div className="bg-green-50 px-6 py-4 rounded-2xl border border-green-100 flex flex-col items-end shadow-sm">
                    <span className="text-[10px] text-green-600 font-black uppercase tracking-widest">Total Revenue</span>
                    <span className="text-3xl font-black text-green-700">{formatCurrency(totalRevenue)}</span>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                    <h3 className="font-bold text-gray-900">Recent Transactions</h3>
                    <span className="text-[10px] font-black text-gray-500 bg-white border border-gray-100 px-3 py-1.5 rounded-full uppercase tracking-wider">{transactions.length} Completed Jobs</span>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-gray-50/50 text-[10px] uppercase text-gray-400 font-black tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Job ID</th>
                                <th className="px-6 py-4">Service</th>
                                <th className="px-6 py-4">Provider</th>
                                <th className="px-6 py-4 text-right">Job Amount</th>
                                <th className="px-6 py-4 text-right">Commission (6%)</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {transactions.length > 0 ? (
                                transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 font-mono text-[10px] text-gray-400">{tx.id.slice(0, 8).toUpperCase()}</td>
                                        <td className="px-6 py-4 font-bold text-gray-900">{tx.category || tx.title}</td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">
                                            {tx.providerName || tx.serviceProvider || 'Unknown Provider'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                                            {formatCurrency(tx.budget || 0)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-green-700">
                                            + {formatCurrency(tx.commission)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-100 text-green-800">
                                                Paid
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-24 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="material-icons text-4xl opacity-10">payments</span>
                                            <p className="font-bold">No completed jobs found yet.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Commission;
