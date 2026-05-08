import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

const Support = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulation mode tickets
        const mockTickets = [
            { 
                id: 't1', 
                userEmail: 'provider@example.com', 
                subject: 'Payment Delay', 
                category: 'payment', 
                message: 'I completed a job 2 days ago but my balance is not updated.', 
                status: 'Open', 
                createdAt: new Date(Date.now() - 3600000) 
            },
            { 
                id: 't2', 
                userEmail: 'customer@example.com', 
                subject: 'Report Provider', 
                category: 'report', 
                message: 'The provider did not show up for the scheduled appointment.', 
                status: 'In Progress', 
                createdAt: new Date(Date.now() - 86400000) 
            }
        ];
        
        setTimeout(() => {
            setTickets(mockTickets);
            setLoading(false);
        }, 1000);
    }, []);

    const handleStatusChange = async (id, newStatus) => {
        setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
        toast.success(`Ticket marked as ${newStatus} (Simulated)`);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this ticket?")) return;
        setTickets(prev => prev.filter(t => t.id !== id));
        toast.success("Ticket deleted (Simulated)");
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Resolved': return 'bg-green-100 text-green-800 border-green-200';
            case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Open': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in relative z-0 font-sans p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight text-gray-900">Support Tickets</h2>
                    <p className="text-gray-500">Manage user inquiries and issues.</p>
                </div>
                <div className="flex gap-2">
                    <span className="bg-gray-50 border border-gray-100 text-gray-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        Total Tickets: {tickets.length}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {tickets.length > 0 ? (
                    tickets.map((ticket) => (
                        <div key={ticket.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-white shadow-sm ${
                                        ticket.status === 'Resolved' ? 'bg-green-600' : 'bg-green-700'
                                    }`}>
                                        {(ticket.userEmail || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">{ticket.subject || 'No Subject'}</h3>
                                        <p className="text-xs text-gray-500 font-medium">{ticket.userEmail} &bull; <span className="uppercase tracking-wide font-black">{ticket.category}</span></p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(ticket.status || 'Open')}`}>
                                    {ticket.status || 'Open'}
                                </span>
                            </div>
                            
                            <div className="bg-gray-50/50 p-4 rounded-xl text-gray-700 text-sm mb-4 border border-gray-100 leading-relaxed font-medium">
                                {ticket.message}
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider pt-4 border-t border-gray-50">
                                <span>Submitted: {ticket.createdAt instanceof Date ? ticket.createdAt.toLocaleString() : 'Recently'}</span>
                                <div className="flex items-center gap-3">
                                    {ticket.status !== 'Resolved' && (
                                        <button 
                                            onClick={() => handleStatusChange(ticket.id, 'Resolved')}
                                            className="text-green-700 hover:bg-green-50 px-3 py-1 rounded-lg font-black transition-colors"
                                        >
                                            Mark Resolved
                                        </button>
                                    )}
                                    {(!ticket.status || ticket.status === 'Open') && (
                                        <button 
                                            onClick={() => handleStatusChange(ticket.id, 'In Progress')}
                                            className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg font-black transition-colors"
                                        >
                                            Mark In Progress
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleDelete(ticket.id)}
                                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                        title="Delete Ticket"
                                    >
                                        <span className="material-icons text-sm">delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-24 text-gray-400 bg-white rounded-2xl border border-gray-100 border-dashed">
                        <span className="material-icons text-4xl mb-2 opacity-10">confirmation_number</span>
                        <p className="font-bold">No support tickets found.</p>
                    </div>
                )}
            </div>
        </div>

    );
};

export default Support;