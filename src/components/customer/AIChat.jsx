import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const AIChat = () => {
    const { currentUser } = useAuth();
    const { requests, savedProviderIds, isSimulated } = useData();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'model', text: 'Hello! I am your TaskMate AI assistant. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const constraintsRef = useRef(null);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setIsLoading(true);

        try {
            // SIMULATED AI RESPONSE
            // In a production app, this would call a Supabase Edge Function 
            // which handles the AI model interaction securely.
            
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate latency

            let response = "";
            const lowerMsg = userMessage.toLowerCase();

            if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
                response = `Hi ${currentUser?.displayName || 'there'}! I can help you find providers, check your request status, or explain how TaskMate works.`;
            } else if (lowerMsg.includes('request') || lowerMsg.includes('job')) {
                const count = requests.length;
                response = count > 0 
                    ? `You currently have ${count} active requests. One of them is "${requests[0].title}" which is currently ${requests[0].status}.`
                    : "You don't have any active requests yet. Would you like to post one?";
            } else if (lowerMsg.includes('provider') || lowerMsg.includes('worker')) {
                response = "You can browse verified providers in the 'Browse' section. We have electricians, plumbers, and more nearby.";
            } else {
                response = "That's a great question! As a TaskMate assistant, I'm here to ensure your service experience is smooth. Is there anything specific about your tasks you'd like to know?";
            }

            setMessages(prev => [...prev, { role: 'model', text: response }]);
        } catch (error) {
            console.error("AI Error:", error);
            setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 pointer-events-none z-[115]" ref={constraintsRef}>
            {/* Floating Action Button */}
            <motion.button
                id="tour-ai"
                drag
                dragConstraints={constraintsRef}
                dragElastic={0.1}
                dragMomentum={false}
                onClick={() => setIsOpen(!isOpen)}
                className="absolute bottom-20 md:bottom-6 right-4 md:right-6 p-3 bg-green-700 text-white rounded-full shadow-xl hover:bg-green-800 transition-colors flex items-center justify-center group pointer-events-auto active:cursor-grabbing"
                style={{ touchAction: "none" }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                {isOpen ? (
                    <span className="material-icons-outlined text-2xl">close</span>
                ) : (
                    <span className="material-icons-outlined text-2xl">smart_toy</span>
                )}
                 {!isOpen && (
                    <span className="hidden md:block absolute right-full mr-3 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Ask AI
                    </span>
                 )}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-36 md:bottom-24 right-4 w-[calc(100vw-32px)] max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col h-[min(70vh,500px)] sm:right-6 sm:w-[380px] pointer-events-auto"
                    >
                        {/* Header */}
                        <div className="bg-green-700 p-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-2">
                                <span className="material-icons-outlined">smart_toy</span>
                                <h3 className="font-bold">TaskMate Assistant</h3>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full p-1">
                                <span className="material-icons-outlined text-sm">remove</span>
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-2xl p-3 text-sm ${
                                            msg.role === 'user'
                                                ? 'bg-green-700 text-white rounded-tr-none'
                                                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                                        }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-700 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-green-700 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-green-700 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about your requests..."
                                    className="flex-1 bg-gray-100 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-700/20 focus:bg-white transition-all outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !input.trim()}
                                    className="p-3 bg-green-700 text-white rounded-xl hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <span className="material-icons-outlined text-lg">send</span>
                                </button>
                            </div>
                            <div className="text-center mt-2">
                                <p className="text-[10px] text-gray-400">Simulation Mode {isSimulated ? '(Active)' : ''}</p>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AIChat;
