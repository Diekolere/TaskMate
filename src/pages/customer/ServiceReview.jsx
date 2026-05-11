import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Sidebar from '../../components/layout/Sidebar';
import MobileNavBar from '../../components/layout/MobileNavBar';
import { format } from 'date-fns';

const ServiceReview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { requests, isSimulated } = useData();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [tags, setTags] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchRequest = async () => {
            if (!id) return;
            try {
                const req = requests.find(r => r.id === id);
                if (req) {
                    setRequest(req);
                    if (req.review) {
                        setRating(req.review.rating || 0);
                        setFeedback(req.review.comment || '');
                        setTags(req.review.tags || []);
                    }
                } else if (!isSimulated) {
                    toast.error("Request not found");
                    navigate('/customer/dashboard');
                }
            } catch (error) {
                console.error("Error fetching request:", error);
                toast.error("Failed to load request details");
            } finally {
                setLoading(false);
            }
        };
        fetchRequest();
    }, [id, navigate, requests, isSimulated]);

    const handleTagToggle = (tag) => {
        if (tags.includes(tag)) {
            setTags(tags.filter(t => t !== tag));
        } else {
            setTags([...tags, tag]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error("Please select a rating");
            return;
        }

        setSubmitting(true);
        try {
            // In simulation mode, we just toast and redirect.
            // In real mode, we'd call a context method.
            toast.success("Thank you for your review!");
            
            // Mock update local state if needed, but navigate is enough
            setTimeout(() => {
                navigate('/customer/dashboard');
            }, 1500);
            
        } catch (error) {
            console.error("Error submitting review:", error);
            toast.error("Failed to submit review");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
            </div>
        );
    }

    if (!request) return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 flex-col gap-4">
            <p className="text-gray-500">Request not found.</p>
            <button onClick={() => navigate('/customer/dashboard')} className="text-green-700 font-bold hover:underline">Back to Dashboard</button>
        </div>
    );

    const dateStr = request.createdAt instanceof Date ? format(request.createdAt, 'MMM dd, yyyy') : 'Recently';

    return (
        <div className="flex min-h-screen bg-white font-sans text-gray-900">
            <Sidebar />
            
            <main className="flex-1 overflow-hidden flex flex-col min-w-0">
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
                    <div className="max-w-3xl mx-auto space-y-8">
                        <div className="text-center space-y-4">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                                <span className="material-icons-outlined text-4xl text-green-700">check_circle</span>
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900">Service Completed!</h1>
                            <p className="text-lg text-gray-500 max-w-lg mx-auto">
                                The service for <span className="font-semibold text-gray-800">{request.title}</span> has been marked as complete. Please review the summary and rate your experience.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1 space-y-6">
                                <div className="bg-white shadow rounded-2xl overflow-hidden border border-gray-100">
                                    <div className="p-6">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Job Summary</h3>
                                        <div className="flex items-start space-x-4 mb-6">
                                            <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center text-green-700 font-bold border border-green-100 text-lg">
                                                {request.providerName ? request.providerName.charAt(0) : 'P'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{request.providerName || 'Provider'}</p>
                                                <p className="text-xs text-gray-500 flex items-center">
                                                    <span className="material-icons-outlined text-green-500 text-sm mr-1">verified</span> Verified Pro
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-gray-500">Service Type</p>
                                                <p className="font-medium text-gray-900">{request.category}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Date Posted</p>
                                                <p className="font-medium text-gray-900">{dateStr}</p>
                                            </div> 
                                            <div className="pt-3 border-t border-gray-100">
                                                <p className="text-xs text-gray-500">Total Amount</p>
                                                <p className="text-2xl font-bold text-green-700">₦{Number(request.budget).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center">
                                        <span className="text-xs font-medium text-gray-500">ID: #{request.id.slice(0, 8).toUpperCase()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <div className="bg-white shadow rounded-2xl p-6 sm:p-8 border border-gray-100 h-full">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">Rate & Review</h2>
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl mb-6 border border-gray-100">
                                            <label className="block text-sm font-medium text-gray-700 mb-3">How would you rate the service?</label>
                                            <div className="flex flex-row gap-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button 
                                                        key={star} 
                                                        type="button" 
                                                        onClick={() => setRating(star)}
                                                        className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                                                    >
                                                        <span className={`material-icons-outlined text-4xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}>star</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">What went well?</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['Punctuality', 'Professionalism', 'Quality of Work', 'Communication', 'Value'].map((tag) => (
                                                    <label key={tag} className="cursor-pointer">
                                                        <input 
                                                            className="peer sr-only" 
                                                            type="checkbox"
                                                            checked={tags.includes(tag)}
                                                            onChange={() => handleTagToggle(tag)}
                                                        />
                                                        <span className="px-3 py-1.5 rounded-full text-sm border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 peer-checked:bg-green-50 peer-checked:text-green-700 peer-checked:border-green-100 transition-all select-none">
                                                            {tag}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="feedback">Share your experience</label>
                                            <div className="mt-1">
                                                <textarea 
                                                    className="shadow-sm focus:ring-green-700 focus:border-green-700 block w-full sm:text-sm border-gray-300 rounded-md p-3 border outline-none" 
                                                    id="feedback" 
                                                    name="feedback" 
                                                    value={feedback}
                                                    onChange={(e) => setFeedback(e.target.value)}
                                                    placeholder="Tell us more about the service provided..." 
                                                    rows="4"
                                                ></textarea>
                                            </div>
                                            <p className="mt-2 text-xs text-gray-500">Your review helps others in the TaskMate community.</p>
                                        </div>
                                        
                                        <div className="border-t border-gray-100 pt-6 flex justify-end">
                                            <button 
                                                disabled={submitting}
                                                type="submit" 
                                                className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-bold rounded-md text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                                            >
                                                {submitting ? 'Submitting...' : 'Submit Review'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <MobileNavBar />
            </main>
        </div>
    );
};

export default ServiceReview;
