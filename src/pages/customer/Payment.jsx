import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

import Sidebar from '../../components/layout/Sidebar';
import TopNavbar from '../../components/layout/TopNavbar';
import MobileNavBar from '../../components/layout/MobileNavBar';
import { useJobs } from '../../context/JobContext';
import { useEarnings } from '../../context/EarningsContext';

const Payment = () => {
    const { id } = useParams();
    const { currentUser } = useAuth();
    const { requests } = useJobs();
  const { processPayment } = useEarnings();
    const navigate = useNavigate();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const foundJob = requests.find(j => j.id === id);
        if (foundJob && foundJob.status === 'awaiting_payment') {
            setJob(foundJob);
            setLoading(false);
        } else {
            setTimeout(() => {
                const retry = requests.find(j => j.id === id);
                if (retry && retry.status === 'awaiting_payment') {
                    setJob(retry);
                } else {
                    toast.error('Payment not available for this job');
                    navigate('/customer/dashboard');
                }
                setLoading(false);
            }, 800);
        }
    }, [id, requests, navigate]);

    const handlePayment = async () => {
        setProcessing(true);
        try {
            await processPayment(id, Number(job.final_budget || job.budget_estimate));
            // The processPayment method handles the window.location.href redirect
        } catch (error) {
            toast.error('Payment failed. Please try again.');
            setProcessing(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <span className="material-icons-outlined animate-spin text-3xl text-[#10B981]">progress_activity</span>
        </div>
    );

    if (!job) return (
        <div className="min-h-screen bg-white flex items-center justify-center flex-col gap-3">
            <p className="text-gray-500 text-sm">Job not found</p>
            <button onClick={() => navigate(-1)} className="text-[#10B981] font-bold hover:underline text-sm">← Go Back</button>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-white font-sans text-gray-900">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopNavbar breadcrumbs={['Customer', 'Payment']} />

                <main className="flex-1 overflow-y-auto relative p-4 sm:p-6 lg:p-10 pb-24 md:pb-10">
                    <div className="max-w-3xl mx-auto">
                        <div className="mb-8">
                            <button
                                onClick={() => navigate(-1)}
                                className="inline-flex items-center text-sm text-gray-500 hover:text-[#10B981] mb-4 transition-colors font-bold"
                            >
                                <span className="material-icons-outlined text-lg mr-1">arrow_back</span>
                                Back
                            </button>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                                Secure Payment
                            </h1>
                            <p className="mt-2 text-gray-500 font-medium">
                                Pay securely for "{job.title}". Funds will be held in escrow until service completion.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Payment Info */}
                            <div className="space-y-6">
                                <div className="bg-white shadow-sm rounded-3xl overflow-hidden border border-gray-100 p-6 flex flex-col justify-center items-center text-center">
                                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                                        <span className="material-icons-outlined text-[#10B981] text-3xl">shield</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-2">Secure Squad Checkout</h2>
                                    <p className="text-gray-500 text-sm mb-6">
                                        You will be redirected to our secure payment partner (Squad) to complete your transaction. TaskMate never stores your card details.
                                    </p>
                                </div>

                                <button
                                    onClick={handlePayment}
                                    disabled={processing}
                                    className="w-full py-4 border border-transparent shadow-xl shadow-green-600/20 text-sm font-bold rounded-xl text-white bg-[#10B981] hover:bg-[#059669] flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                                            Processing Payment...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-icons-outlined text-sm">lock</span>
                                            Pay Securely ₦{Number(job.final_budget || job.budget_estimate).toLocaleString()}
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Order Summary */}
                            <div className="space-y-6">
                                <div className="bg-white shadow-sm rounded-3xl overflow-hidden border border-gray-100 p-6">
                                    <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
                                        <span className="material-icons-outlined text-[#10B981]">receipt</span>
                                        <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
                                    </div>

                                    <div className="space-y-4 mt-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Service</span>
                                            <span className="text-sm font-bold text-gray-900">{job.title}</span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Provider</span>
                                            <span className="text-sm font-bold text-gray-900">{job.providerName || 'Assigned Provider'}</span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Agreed Budget</span>
                                            <span className="text-lg font-bold text-[#10B981]">
                                                ₦{Number(job.final_budget || job.budget_estimate).toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="border-t border-gray-100 pt-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold text-gray-900">Total</span>
                                                <span className="text-xl font-bold text-[#10B981]">
                                                    ₦{Number(job.final_budget || job.budget_estimate).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                                    <div className="flex items-start gap-3">
                                        <span className="material-icons-outlined text-blue-600 text-lg mt-0.5">info</span>
                                        <div>
                                            <p className="text-sm font-bold text-blue-900">Secure Escrow Payment</p>
                                            <p className="text-xs text-blue-700 mt-1">
                                                Your payment is held securely by TaskMate until the service is completed and you confirm satisfaction.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                <MobileNavBar />
            </div>
        </div>
    );
};

export default Payment;
