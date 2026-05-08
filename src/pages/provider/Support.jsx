import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const Support = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    category: 'general',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.message) {
        toast.error("Please fill in all required fields");
        return;
    }

    setIsSubmitting(true);
    
    try {
        // Simulated support ticket submission
        setTimeout(() => {
            toast.success("Message sent! Our team will response within 24 hours.");
            setIsContactModalOpen(false);
            setFormData({ subject: '', category: 'general', message: '' });
            setIsSubmitting(false);
        }, 1500);
    } catch (error) {
        console.error("Error sending support ticket:", error);
        toast.error("Failed to send message. Please try again.");
        setIsSubmitting(false);
    }
  };

  const faqs = [
    {
      question: "How do I get paid?",
      answer: "Payments are processed weekly. Ensure your bank account details are up to date in the Earnings section."
    },
    {
      question: "How is my commission calculated?",
      answer: "TaskMate charges a flat 10% commission on all completed jobs. You can view your commission breakdown in the Earnings tab."
    },
    {
      question: "Can I change my service area?",
      answer: "Yes, you can update your location in your Profile settings. This will adjust the radius for job requests you receive."
    },
    {
      question: "What happens if a customer cancels?",
      answer: "If a customer cancels within 24 hours of the scheduled time, you may be eligible for a cancellation fee."
    }
  ];

  return (
    <div className="bg-white min-h-screen font-sans">
      <Toaster position="top-right" richColors />
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
           <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
               <span className="material-icons">arrow_back</span>
           </button>
           <h1 className="text-lg font-bold text-gray-900">Help & Support</h1>
           <div className="w-10"></div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        
        {/* Contact Support Card */}
        <section className="bg-green-50 rounded-2xl p-8 border border-green-100 text-center space-y-4">
           <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <span className="material-icons text-3xl">support_agent</span>
           </div>
           <div>
              <h2 className="text-xl font-bold text-gray-900">Need help with an order?</h2>
              <p className="text-gray-600 mt-1 max-w-sm mx-auto text-sm leading-relaxed">Our support team is available 24/7 to assist you with any issues or inquiries.</p>
           </div>
           <button 
                onClick={() => setIsContactModalOpen(true)}
                className="bg-green-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-green-700/20 hover:bg-green-800 transition-all w-full md:w-auto flex items-center justify-center gap-2"
           >
               <span className="material-icons">mail</span>
               Contact Support
           </button>
        </section>

        <AnimatePresence>
            {isContactModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        onClick={() => setIsContactModalOpen(false)}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                        animate={{ opacity: 1, scale: 1, y: 0 }} 
                        exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden"
                    >
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Contact Support</h2>
                            <button 
                                onClick={() => setIsContactModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                            >
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Issue Type</label>
                                <select 
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-700/10 focus:border-green-700 outline-none bg-white transition-all text-sm"
                                >
                                    <option value="general">General Inquiry</option>
                                    <option value="payment">Payment Issue</option>
                                    <option value="account">Account & Login</option>
                                    <option value="technical">Technical Support</option>
                                    <option value="report">Report a User</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
                                <input 
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Brief summary of your issue"
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-700/10 focus:border-green-700 outline-none transition-all text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
                                <textarea 
                                    name="message"
                                    value={formData.message}
                                    onChange={handleInputChange}
                                    required
                                    rows="4"
                                    placeholder="Describe your issue in detail..."
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-700/10 focus:border-green-700 outline-none resize-none transition-all text-sm"
                                ></textarea>
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setIsContactModalOpen(false)}
                                    className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-all text-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-8 py-2.5 bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-700/20 hover:bg-green-800 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <span>Send Message</span>
                                            <span className="material-icons text-sm">send</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* FAQ Section */}
        <section>
            <h3 className="text-lg font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>
            <div className="space-y-4">
                {faqs.map((faq, index) => (
                    <div key={index} className="border border-gray-100 rounded-2xl p-5 hover:border-green-700/30 transition-all bg-gray-50/50 group">
                        <h4 className="font-bold text-gray-900 mb-2 group-hover:text-green-700 transition-colors">{faq.question}</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                    </div>
                ))}
            </div>
        </section>

        {/* Resources Links */}
        <section className="space-y-4 pt-4">
            <h3 className="text-lg font-bold text-gray-900">Legal & Privacy</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a href="/privacy" className="flex items-center justify-between p-5 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all group">
                    <span className="font-bold text-gray-700 group-hover:text-green-700">Privacy Policy</span>
                    <span className="material-icons text-gray-400 group-hover:translate-x-1 transition-transform">chevron_right</span>
                </a>
                <a href="/terms" className="flex items-center justify-between p-5 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all group">
                    <span className="font-bold text-gray-700 group-hover:text-green-700">Terms of Service</span>
                    <span className="material-icons text-gray-400 group-hover:translate-x-1 transition-transform">chevron_right</span>
                </a>
            </div>
        </section>

      </main>
    </div>
  );
};

export default Support;
