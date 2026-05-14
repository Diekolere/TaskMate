import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useData } from '../../context/DataContext';

const Support = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const { sendNotification } = useData();

    const fetchTickets = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('support_tickets')
            .select('*, profiles(full_name, email, avatar_url)')
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Failed to load tickets:', error);
            toast.error('Failed to load support tickets');
        } else {
            setTickets(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTickets();

        // Subscribe to real-time new ticket inserts
        const channel = supabase
            .channel('support_tickets:admin')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_tickets' }, (payload) => {
                setTickets(prev => [payload.new, ...prev]);
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'support_tickets' }, (payload) => {
                setTickets(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t));
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    const handleStatusChange = async (ticketId, newStatus, ticket) => {
        const { error } = await supabase
            .from('support_tickets')
            .update({ status: newStatus, replied_at: new Date().toISOString() })
            .eq('id', ticketId);

        if (error) { toast.error('Failed to update ticket'); return; }
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
        toast.success(`Ticket marked as ${newStatus}`);

        // Notify the user that their ticket was updated
        if (ticket?.user_id) {
            await sendNotification(ticket.user_id, {
                type: 'system',
                title: 'Support Ticket Update',
                body: `Your ticket "${ticket.subject}" has been updated to: ${newStatus}`,
                icon: 'support_agent',
                iconBg: 'bg-blue-100',
                iconColor: 'text-blue-600',
            });
        }
    };

    const handleDelete = async (ticketId) => {
        if (!window.confirm('Delete this support ticket permanently?')) return;
        const { error } = await supabase.from('support_tickets').delete().eq('id', ticketId);
        if (error) { toast.error('Failed to delete ticket'); return; }
        setTickets(prev => prev.filter(t => t.id !== ticketId));
        toast.success('Ticket deleted');
    };

    const getStatusColor = (status) => ({
        resolved: 'bg-green-100 text-green-800 border-green-200',
        in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
        open: 'bg-red-100 text-red-800 border-red-200',
    }[String(status || 'open').toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200');

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in relative z-0 font-sans p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Support Tickets</h2>
                    <p className="text-gray-500">Manage user inquiries and issues in real time.</p>
                </div>
                <div className="flex gap-2">
                    <span className="bg-gray-50 border border-gray-100 text-gray-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        Total: {tickets.length}
                    </span>
                    <span className="bg-red-50 border border-red-100 text-red-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        Open: {tickets.filter(t => (t.status || 'open').toLowerCase() === 'open').length}
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
                                        (ticket.status || 'open').toLowerCase() === 'resolved' ? 'bg-green-600' : 'bg-green-700'
                                    }`}>
                                        {(ticket.profiles?.full_name || ticket.profiles?.email || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">{ticket.subject || 'No Subject'}</h3>
                                        <p className="text-xs text-gray-500 font-medium">
                                            {ticket.profiles?.full_name || ticket.profiles?.email || 'Unknown user'} &bull; <span className="uppercase tracking-wide font-black">{ticket.category || 'General'}</span>
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">{new Date(ticket.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(ticket.status)}`}>
                                    {ticket.status || 'Open'}
                                </span>
                            </div>

                            <div className="bg-gray-50/50 p-4 rounded-xl text-gray-700 text-sm mb-4 border border-gray-100 leading-relaxed font-medium">
                                {ticket.message}
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-50">
                                {(ticket.status || 'open').toLowerCase() !== 'resolved' && (
                                    <button
                                        onClick={() => handleStatusChange(ticket.id, 'resolved', ticket)}
                                        className="text-green-700 hover:bg-green-50 px-3 py-1 rounded-lg font-black transition-colors text-sm"
                                    >
                                        Mark Resolved
                                    </button>
                                )}
                                {(ticket.status || 'open').toLowerCase() === 'open' && (
                                    <button
                                        onClick={() => handleStatusChange(ticket.id, 'in_progress', ticket)}
                                        className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg font-black transition-colors text-sm"
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
                    ))
                ) : (
                    <div className="text-center py-24 text-gray-400 bg-white rounded-2xl border border-gray-100 border-dashed">
                        <span className="material-icons text-4xl mb-2 opacity-10">confirmation_number</span>
                        <p className="font-bold">No support tickets yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Support;