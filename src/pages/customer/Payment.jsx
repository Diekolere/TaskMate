import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Sidebar from '../../components/layout/Sidebar';
import TopNavbar from '../../components/layout/TopNavbar';
import MobileNavBar from '../../components/layout/MobileNavBar';

const Payment = () => {
    const { id } = useParams();
    const { currentUser } = useAuth();
    const { requests, securePayment, isSimulated } = useData();
    const navigate = useNavigate();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [cardNumber, setCardNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');
    const [cardName, setCardName] = useState('');

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
        if (!cardNumber || !expiryDate || !cvv || !cardName) {
            toast.error('Please fill in all payment details');
            return;
        }

        setProcessing(true);
        try {
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            await securePayment(id);
            toast.success('Payment secured successfully! Funds are now held in escrow.');
            navigate('/customer/dashboard');
        } catch (error) {
            toast.error('Payment failed. Please try again.');
        } finally {
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
        <div className="flex h-screen bg-white font-sans text-gray-900">
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
                            {/* Payment Form */}
                            <div className="space-y-6">
                                <div className="bg-white shadow-sm rounded-3xl overflow-hidden border border-gray-100 p-6">
                                    <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
                                        <span className="material-icons-outlined text-[#10B981]">credit_card</span>
                                        <h2 className="text-lg font-bold text-gray-900">Payment Details</h2>
                                    </div>

                                    <div className="space-y-4 mt-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Card Number</label>
                                            <input
                                                type="text"
                                                value={cardNumber}
                                                onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 '))}
                                                placeholder="1234 5678 9012 3456"
                                                maxLength="19"
                                                className="block w-full rounded-xl border-gray-200 focus:border-[#10B981] focus:ring-4 focus:ring-green-50 sm:text-sm py-3.5 px-4 border focus:outline-none transition-all"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Expiry Date</label>
                                                <input
                                                    type="text"
                                                    value={expiryDate}
                                                    onChange={(e) => setExpiryDate(e.target.value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/, '$1/'))}
                                                    placeholder="MM/YY"
                                                    maxLength="5"
                                                    className="block w-full rounded-xl border-gray-200 focus:border-[#10B981] focus:ring-4 focus:ring-green-50 sm:text-sm py-3.5 px-4 border focus:outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">CVV</label>
                                                <input
                                                    type="text"
                                                    value={cvv}
                                                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                                                    placeholder="123"
                                                    maxLength="4"
                                                    className="block w-full rounded-xl border-gray-200 focus:border-[#10B981] focus:ring-4 focus:ring-green-50 sm:text-sm py-3.5 px-4 border focus:outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Cardholder Name</label>
                                            <input
                                                type="text"
                                                value={cardName}
                                                onChange={(e) => setCardName(e.target.value)}
                                                placeholder="John Doe"
                                                className="block w-full rounded-xl border-gray-200 focus:border-[#10B981] focus:ring-4 focus:ring-green-50 sm:text-sm py-3.5 px-4 border focus:outline-none transition-all"
                                            />
                                        </div>
                                    </div>
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