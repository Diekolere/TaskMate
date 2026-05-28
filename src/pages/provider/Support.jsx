import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import ProviderSidebar from '../../components/layout/ProviderSidebar';
import ProviderMobileNavBar from '../../components/layout/ProviderMobileNavBar';
import TopNavbar from '../../components/layout/TopNavbar';
import { useAuth } from '../../context/AuthContext';

const faqs = [
    { question: 'How do I get paid?', answer: 'Payments are processed weekly. Ensure your bank account details are up to date in the Earnings section.' },
    { question: 'How is my commission calculated?', answer: 'TaskMate charges a flat 6% commission on all completed jobs. View your breakdown in the Earnings tab.' },
    { question: 'Can I change my service area?', answer: 'Yes. Update your location in Profile settings to adjust the radius for job requests you receive.' },
    { question: 'What happens if a customer cancels?', answer: 'If a customer cancels within 24 hours of the scheduled time, you may be eligible for a cancellation fee.' },
    { question: 'How long does verification take?', answer: 'Verification is typically completed within 24–48 hours after you submit all required documents.' },
];

const Support = () => {
    const { currentUser } = useAuth();
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [expandedFaq, setExpandedFaq] = useState(null);
    const [formData, setFormData] = useState({ subject: '', category: 'general', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.subject || !formData.message) { toast.error('Please fill in all required fields'); return; }
        setIsSubmitting(true);
        setTimeout(() => {
            toast.success('Message sent! Our team will respond within 24 hours.');
            setIsContactModalOpen(false);
            setFormData({ subject: '', category: 'general', message: '' });
            setIsSubmitting(false);
        }, 1200);
    };

    return (
        <div className="min-h-screen bg-white flex font-sans">
            <ProviderSidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopNavbar breadcrumbs={['Help & Support']} />

                <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
                    <div className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto space-y-8">

                        {/* Contact Card */}
                        <div className="bg-[#10B981]/5 rounded-2xl p-8 border border-[#10B981]/10 text-center space-y-4">
                            <div className="w-14 h-14 bg-[#10B981]/10 text-[#10B981] rounded-2xl flex items-center justify-center mx-auto">
                                <span className="material-icons-outlined text-2xl">support_agent</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Need help with a job or payment?</h2>
                                <p className="text-sm text-gray-500 mt-1 leading-relaxed">Our support team is available 24/7 for any issues.</p>
                            </div>
                            <button
                                onClick={() => setIsContactModalOpen(true)}
                                className="bg-[#0F172A] hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-semibold text-sm transition-colors inline-flex items-center gap-2 shadow-sm"
                            >
                                <span className="material-icons-outlined text-base">mail</span>
                                Contact Support
                            </button>
                        </div>

                        {/* FAQ */}
                        <section>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Frequently Asked Questions</h3>
                            <div className="space-y-2">
                                {faqs.map((faq, i) => (
                                    <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                        <button
                                            onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                                            className="w-full text-left flex items-center justify-between px-5 py-4 gap-3 hover:bg-gray-50/80 transition-colors"
                                        >
                                            <span className="font-semibold text-gray-900 text-sm">{faq.question}</span>
                                            <span className={`material-icons-outlined text-gray-400 text-lg transition-transform shrink-0 ${expandedFaq === i ? 'rotate-180' : ''}`}>expand_more</span>
                                        </button>
                                        <AnimatePresence>
                                            {expandedFaq === i && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden"
                                                >
                                                    <p className="px-5 pb-4 text-sm text-gray-500 leading-relaxed border-t border-gray-50 pt-3">{faq.answer}</p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Legal */}
                        <section>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Legal & Privacy</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[{ label: 'Privacy Policy', href: '/privacy', icon: 'policy' }, { label: 'Terms of Service', href: '/terms', icon: 'description' }].map(item => (
                                    <Link key={item.label} to={item.href} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all group shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <span className="material-icons-outlined text-gray-400 text-lg group-hover:text-[#10B981] transition-colors">{item.icon}</span>
                                            <span className="font-semibold text-gray-700 text-sm">{item.label}</span>
                                        </div>
                                        <span className="material-icons-outlined text-gray-300 text-base group-hover:translate-x-0.5 transition-transform">chevron_right</span>
                                    </Link>
                                ))}
                            </div>
                        </section>

                    </div>
                </main>
            </div>

            <ProviderMobileNavBar />

            {/* Contact Modal */}
            <AnimatePresence>
                {isContactModalOpen && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsContactModalOpen(false)}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden"
                        >
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-base font-bold text-gray-900">Contact Support</h2>
                                <button onClick={() => setIsContactModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
                                    <span className="material-icons-outlined text-lg">close</span>
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Issue Type</label>
                                    <select name="category" value={formData.category} onChange={handleInputChange}
                                        className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] outline-none bg-white transition-all">
                                        <option value="general">General Inquiry</option>
                                        <option value="payment">Payment Issue</option>
                                        <option value="account">Account & Login</option>
                                        <option value="technical">Technical Support</option>
                                        <option value="report">Report a User</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Subject</label>
                                    <input name="subject" value={formData.subject} onChange={handleInputChange} required
                                        placeholder="Brief summary of your issue"
                                        className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Message</label>
                                    <textarea name="message" value={formData.message} onChange={handleInputChange} required rows="4"
                                        placeholder="Describe your issue in detail…"
                                        className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] outline-none resize-none transition-all" />
                                </div>
                                <div className="flex justify-end gap-3 pt-1">
                                    <button type="button" onClick={() => setIsContactModalOpen(false)}
                                        className="px-5 py-2.5 text-gray-500 font-semibold hover:bg-gray-50 rounded-xl transition-all text-sm">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={isSubmitting}
                                        className="px-6 py-2.5 bg-[#0F172A] hover:bg-slate-700 text-white font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center gap-2 text-sm shadow-sm">
                                        {isSubmitting ? (
                                            <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>Sending…</>
                                        ) : (
                                            <><span>Send Message</span><span className="material-icons-outlined text-sm">send</span></>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Support;
