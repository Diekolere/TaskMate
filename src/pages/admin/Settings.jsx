import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const AdminSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        commissionRate: 10,
        enableNewRegistrations: true,
        maintenanceMode: false,
        supportEmail: 'admin@taskmate.ng',
        maxJobRadius: 25,
    });

    useEffect(() => {
        // Simulated fetch
        setTimeout(() => {
            setLoading(false);
        }, 800);
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings({
            ...settings,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Simulated save
            setTimeout(() => {
                toast.success("Settings saved successfully (Simulated)");
                setSaving(false);
            }, 1000);
        } catch (error) {
            console.error(error);
            toast.error("Failed to save settings");
            setSaving(false);
        }
    };

    if (loading) return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
            </div>
    );

    return (
        <div className="max-w-4xl space-y-8 animate-fade-in relative z-0 font-sans p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Platform Settings</h2>
                    <p className="text-gray-500 font-medium">Configure global application parameters.</p>
                </div>
                 <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-700 text-white px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-800 shadow-lg shadow-green-700/20 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-[0.98]"
                >
                    {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <span className="material-icons text-sm">save</span>}
                    Save Changes
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Financial Settings */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-widest text-xs">
                        <span className="material-icons text-green-700">payments</span>
                        Financial Configuration
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Commission Rate (%)</label>
                            <div className="relative rounded-xl overflow-hidden shadow-sm">
                                <input
                                    type="number"
                                    name="commissionRate"
                                    value={settings.commissionRate}
                                    onChange={handleChange}
                                    className="focus:ring-2 focus:ring-green-700/10 focus:border-green-700 block w-full pr-12 sm:text-sm border-gray-100 bg-gray-50 rounded-xl py-3 px-4 border font-bold text-gray-900 transition-all outline-none"
                                    placeholder="10"
                                />
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                    <span className="text-gray-400 font-black sm:text-xs">%</span>
                                </div>
                            </div>
                            <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Percentage taken from each completed job.</p>
                        </div>
                    </div>
                </div>

                {/* General Settings */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                     <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-widest text-xs">
                        <span className="material-icons text-blue-600">settings_applications</span>
                        General Configuration
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Support Email</label>
                            <input
                                type="email"
                                name="supportEmail"
                                value={settings.supportEmail}
                                onChange={handleChange}
                                className="focus:ring-2 focus:ring-green-700/10 focus:border-green-700 block w-full sm:text-sm border-gray-100 bg-gray-50 rounded-xl py-3 px-4 border font-bold text-gray-900 transition-all outline-none"
                            />
                        </div>
                         <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Max Job Radius (km)</label>
                            <input
                                type="number"
                                name="maxJobRadius"
                                value={settings.maxJobRadius}
                                onChange={handleChange}
                                className="focus:ring-2 focus:ring-green-700/10 focus:border-green-700 block w-full sm:text-sm border-gray-100 bg-gray-50 rounded-xl py-3 px-4 border font-bold text-gray-900 transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* System Controls */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 md:col-span-2">
                     <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-widest text-xs">
                        <span className="material-icons text-red-600">security</span>
                        System Controls
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0 group">
                            <div>
                                <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider group-hover:text-green-700 transition-colors">Enable New Registrations</h4>
                                <p className="text-xs text-gray-400 font-medium mt-1">Allow new users to sign up for the platform.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    name="enableNewRegistrations"
                                    checked={settings.enableNewRegistrations} 
                                    onChange={handleChange}
                                    className="sr-only peer" 
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-700"></div>
                            </label>
                        </div>
                        
                        <div className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0 group">
                            <div>
                                <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider group-hover:text-red-600 transition-colors">Maintenance Mode</h4>
                                <p className="text-xs text-gray-400 font-medium mt-1">Temporarily disable access for non-admin users.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    name="maintenanceMode"
                                    checked={settings.maintenanceMode} 
                                    onChange={handleChange}
                                    className="sr-only peer" 
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;