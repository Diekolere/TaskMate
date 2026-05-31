import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const AdminContext = createContext({
  verifications: [],
  users: [],
  loading: true,
  updateVerificationStatus: async () => {},
  updateUserStatus: async () => {},
  createSupportTicket: async () => {},
});

export function useAdmin() {
  return useContext(AdminContext);
}

export function AdminProvider({ children }) {
  const { currentUser } = useAuth();
  const [verifications, setVerifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      setLoading(false);
      return;
    }

    const fetchAdminData = async () => {
      const [verRes, userRes] = await Promise.all([
        supabase.from('verifications').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*, provider_profiles(*)').order('created_at', { ascending: false }),
      ]);
      if (verRes.data) setVerifications(verRes.data);
      if (userRes.data) setUsers(userRes.data);
      setLoading(false);
    };

    fetchAdminData();
  }, [currentUser]);

  const updateVerificationStatus = async (verificationId, status, notes = '') => {
    const { error } = await supabase.from('verifications')
      .update({ status, admin_notes: notes, reviewed_by: currentUser.id, reviewed_at: new Date().toISOString() })
      .eq('id', verificationId);
    
    if (error) { 
      toast.error('Failed to update verification'); 
      return; 
    }

    setVerifications(prev => prev.map(v => v.id === verificationId ? { ...v, status } : v));
    toast.success(`Verification ${status}`);
  };

  const updateUserStatus = async (userId, isActive) => {
    const { error } = await supabase.from('profiles')
      .update({ is_active: isActive, status: isActive ? 'Active' : 'Suspended' })
      .eq('id', userId);
    
    if (error) {
      toast.error('Failed to update user');
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: isActive } : u));
      toast.success(`User ${isActive ? 'activated' : 'suspended'}`);
    }
  };

  const createSupportTicket = async (subject, message, category = 'general') => {
    if (!currentUser) return;
    try {
      const { error } = await supabase.from('support_tickets').insert([{
        user_id: currentUser.id, subject, message, category
      }]);
      if (error) throw error;
      toast.success('Support ticket submitted!');
    } catch (error) {
      toast.error('Failed to submit ticket');
      throw error;
    }
  };

  const value = {
    verifications, users, loading,
    updateVerificationStatus, updateUserStatus, createSupportTicket
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}
