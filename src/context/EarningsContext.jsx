import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const EarningsContext = createContext({
  earnings: [],
  releaseEarnings: async () => {},
  processPayment: async () => {},
  submitKYC: async () => {},
  verifyBankAccount: async () => {},
});

export function useEarnings() {
  return useContext(EarningsContext);
}

export function EarningsProvider({ children }) {
  const { currentUser } = useAuth();
  const [earnings, setEarnings] = useState([]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'provider') return;

    const fetchEarnings = async () => {
      const { data } = await supabase
        .from('earnings')
        .select('*')
        .eq('provider_id', currentUser.id)
        .order('created_at', { ascending: false });
      if (data) setEarnings(data);
    };

    fetchEarnings();
  }, [currentUser]);

  const releaseEarnings = async (jobId) => {
    if (!currentUser) return;
    try {
      const { error } = await supabase.functions.invoke('squad', {
        body: { action: 'initiate-payout', jobId, providerId: currentUser.id, amount: 0 }
      });
      if (error) throw error;
      toast.success('Payout initiated!');
    } catch (err) {
      console.error('Payout failed:', err);
      toast.error('Failed to initiate payout.');
    }
  };

  const processPayment = async (jobId, amount) => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase.functions.invoke('squad', {
        body: { action: 'initialize-payment', jobId, amount, customerEmail: currentUser.email, customerId: currentUser.id }
      });
      if (error) throw error;
      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch (err) {
      console.error('Payment initialization failed:', err);
      toast.error('Failed to initialize payment. Please try again.');
    }
  };

  const verifyBankAccount = async (bankCode, accountNumber) => {
    try {
      const { data, error } = await supabase.functions.invoke('squad', {
        body: { action: 'account-lookup', bankCode, accountNumber }
      });
      if (error || !data.success) throw new Error(data?.message || 'Verification failed');
      return data.data;
    } catch (err) {
      console.error('Bank lookup error:', err);
      throw err;
    }
  };

  const submitKYC = async (kycData) => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase.functions.invoke('dojah', {
        body: { 
          action: kycData.selfie_image ? 'verify-with-selfie' : (kycData.selfieUrl ? 'liveness-check' : 'verify-identity'), 
          providerId: currentUser.id, 
          type: kycData.type || 'bvn',
          value: kycData.value,
          selfie_image: kycData.selfie_image,
          selfieUrl: kycData.selfieUrl,
          idUrl: kycData.idUrl
        }
      });
      if (error) throw error;
      if (data?.entity) toast.success('Identity verified successfully!');
      return data;
    } catch (err) {
      console.error('KYC failed:', err);
      toast.error('Identity verification failed.');
      throw err;
    }
  };

  const value = {
    earnings, releaseEarnings, processPayment, submitKYC, verifyBankAccount
  };

  return (
    <EarningsContext.Provider value={value}>
      {children}
    </EarningsContext.Provider>
  );
}
