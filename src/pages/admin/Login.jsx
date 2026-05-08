import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const AdminLogin = () => {
    const navigate = useNavigate();
    const { login, logout } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Authenticate with AuthContext
            const user = await login(formData.email, formData.password);

            // In simulation mode, we just let them in if they use the admin email
            // In real mode, the AuthContext should already have the role.
            if (user && user.role === 'admin') {
                toast.success('Welcome back, Admin!');
                navigate('/admin/dashboard');
            } else {
                // Not an admin - log them out
                await logout();
                setError('Access denied. You do not have admin privileges.');
                toast.error('Unauthorized access');
            }
        } catch (err) {
            console.error(err);
            setError('Invalid credentials or system error.');
            toast.error('Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-screen flex bg-white overflow-hidden font-sans"
        >
            {/* Left Side - Hero Image */}
            <div className="hidden lg:flex lg:w-[45%] bg-green-900 relative overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop"
                        alt="Admin Workspace"
                        className="w-full h-full object-cover opacity-40 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-green-800 to-black opacity-90" />
                </div>
                <div className="relative z-10 w-full h-full flex flex-col justify-end p-12 text-white">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm">
                                <span className="material-icons text-2xl text-green-400">admin_panel_settings</span>
                            </div>
                            <span className="text-xl font-black tracking-widest uppercase">Admin Portal</span>
                        </div>
                        <h2 className="text-5xl font-black mb-4 leading-tight tracking-tighter">
                            TaskMate Control
                        </h2>
                         <p className="text-lg opacity-80 max-w-md font-medium">
                            Manage your platform, users, and providers with confidence and professional-grade security.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex flex-col justify-center h-full px-4 sm:px-6 lg:px-20 xl:px-24">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="text-center lg:text-left mb-10">
                        <Link to="/" className="inline-block">
                           <div className="flex items-center gap-2 mb-8">
                            <img src="/icon.png" alt="TaskMate" className="h-10 w-10" />
                            <span className="font-black text-2xl text-gray-900 tracking-tighter">TaskMate</span>
                          </div>
                        </Link>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Admin Sign In</h2>
                        <p className="mt-2 text-sm text-gray-500 font-medium">
                            Enter your credentials to access the console.
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="appearance-none block w-full px-4 py-3.5 border border-gray-100 bg-gray-50 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700/10 focus:border-green-700 transition-all sm:text-sm font-bold text-gray-900"
                                    placeholder="admin@taskmate.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    className="appearance-none block w-full px-4 py-3.5 border border-gray-100 bg-gray-50 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700/10 focus:border-green-700 transition-all sm:text-sm pr-12 font-bold text-gray-900"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-green-700 transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold border border-red-100 flex items-center gap-2">
                                <span className="material-icons text-sm">error</span>
                                {error}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-green-700/20 text-xs font-black uppercase tracking-widest text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    'Access Dashboard'
                                )}
                            </button>
                        </div>
                    </form>
                    
                    <div className="mt-12 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        <p>Unauthorized access is strictly prohibited.</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AdminLogin;