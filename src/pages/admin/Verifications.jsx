import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';

const Verifications = () => {
    const navigate = useNavigate();
    const { verifications, loading } = useData();

    const handleAction = (id) => {
        navigate(`/admin/verifications/${id}`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in font-sans">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Identity Verification</h2>
                    <p className="text-gray-500">Review and approve provider documents.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Provider</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Submitted</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {verifications.length > 0 ? (
                                verifications.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center font-bold text-green-700 border border-green-100">
                                                    {(item.providerName || '?').charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{item.providerName || 'Unknown Provider'}</div>
                                                    <div className="text-xs text-gray-500">{item.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'Recently'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => handleAction(item.id)}
                                                className="text-green-700 hover:text-green-800 font-bold text-sm bg-green-50 px-4 py-1.5 rounded-lg transition-colors"
                                            >
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-20 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="material-icons text-4xl opacity-20">verified_user</span>
                                            <p>No pending verifications found.</p>
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

export default Verifications;