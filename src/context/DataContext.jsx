import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { MOCK_JOBS, MOCK_PROVIDERS } from '../lib/mocks';

const DataContext = createContext({
    requests: [],
    jobs: [],
    verifications: [],
    users: [],
    earnings: [],
    loading: true,
    createRequest: async () => {},
    getProviders: async () => []
});

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }) {
  const { currentUser, isSimulated } = useAuth();
  const [requests, setRequests] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedProviderIds, setSavedProviderIds] = useState([]);

  const normalizeStatus = (status) => {
    const s = String(status || '').trim().toLowerCase().replace(/\s+/g, '_');
    const map = {
      open: 'open',
      pending: 'pending',
      interested: 'interested',
      negotiating: 'negotiating',
      provider_accepted: 'provider_accepted',
      awaiting_payment: 'awaiting_payment',
      payment_secured: 'payment_secured',
      in_progress: 'in_progress',
      completed: 'completed',
      payment_released: 'payment_released',
      cancelled: 'cancelled',
      canceled: 'cancelled',
      paid: 'payment_released',
      inprogress: 'in_progress'
    };
    return map[s] || (s || 'open');
  };

  // Shim for Job data (Firebase compatibility)
  const shimJob = (job) => {
    if (!job) return null;
    const hasTargetProvider = Boolean(job.providerId || job.worker_id);
    const requestType = job.request_type || (hasTargetProvider ? 'private' : 'public');
    return {
      ...job,
      status: normalizeStatus(job.status),
      request_type: requestType,
      visibility: requestType,
      customerId: job.customer_id,
      providerId: job.worker_id,
      budget: job.budget_estimate,
      createdAt: job.created_at ? {
        toDate: () => new Date(job.created_at),
        toMillis: () => new Date(job.created_at).getTime(),
        seconds: Math.floor(new Date(job.created_at).getTime() / 1000)
      } : null,
      updatedAt: job.updated_at ? {
        toDate: () => new Date(job.updated_at),
        toMillis: () => new Date(job.updated_at).getTime()
      } : null
    };
  };

  // Fetch Saved Providers List (Customer)
  useEffect(() => {
    if (currentUser?.role === 'customer') {
      setSavedProviderIds(currentUser.saved_workers || []);
    }
  }, [currentUser]);

  // Fetch Jobs (Customer) - Real-time
  useEffect(() => {
    if (currentUser && currentUser.role === 'customer') {
      if (isSimulated) {
        setRequests(MOCK_JOBS.map(shimJob));
        setLoading(false);
        return;
      }

      const fetchJobs = async () => {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('customer_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching jobs:", error);
        } else {
          setRequests(data.map(shimJob));
        }
        setLoading(false);
      };

      fetchJobs();

      // Set up real-time listener
      const channel = supabase
        .channel('public:jobs:customer')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'jobs',
          filter: `customer_id=eq.${currentUser.id}` 
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setRequests(prev => [shimJob(payload.new), ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setRequests(prev => prev.map(job => job.id === payload.new.id ? shimJob(payload.new) : job));
            toast.info(`Job Update: ${payload.new.title}`, {
              description: `Status is now: ${payload.new.status}`
            });
          } else if (payload.eventType === 'DELETE') {
            setRequests(prev => prev.filter(job => job.id === payload.old.id));
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser, isSimulated]);

  // Fetch Jobs (Provider) - Real-time
  useEffect(() => {
    if (currentUser && currentUser.role === 'provider') {
      if (isSimulated) {
        setJobs(MOCK_JOBS.map(shimJob));
        setLoading(false);
        return;
      }

      const fetchProviderJobs = async () => {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .or(`worker_id.eq.${currentUser.id},status.eq.open`)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching provider jobs:", error);
        } else {
          setJobs(data.map(shimJob));
        }
        setLoading(false);
      };

      fetchProviderJobs();

      const channel = supabase
        .channel('public:jobs:provider')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'jobs'
        }, (payload) => {
          fetchProviderJobs();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser, isSimulated]);

  // Fetch Admin Data (Verifications, Users)
  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      if (isSimulated) {
        setVerifications([
          { id: 'v1', providerName: 'John Electrician', email: 'john@example.com', status: 'pending', submittedAt: new Date(Date.now() - 86400000) },
          { id: 'v2', providerName: 'Sarah Plumber', email: 'sarah@example.com', status: 'pending', submittedAt: new Date(Date.now() - 172800000) }
        ]);
        setUsers([
          { id: 'u1', full_name: 'John Electrician', email: 'john@example.com', role: 'provider', is_active: true },
          { id: 'u2', full_name: 'Sarah Plumber', email: 'sarah@example.com', role: 'provider', is_active: true },
          { id: 'u3', full_name: 'Mike Customer', email: 'mike@example.com', role: 'customer', is_active: true }
        ]);
        setLoading(false);
        return;
      }

      const fetchAdminData = async () => {
        const { data: verData } = await supabase.from('verifications').select('*').eq('status', 'pending');
        const { data: userData } = await supabase.from('profiles').select('*');
        if (verData) setVerifications(verData);
        if (userData) setUsers(userData);
        setLoading(false);
      };

      fetchAdminData();
    }
  }, [currentUser, isSimulated]);

  const createRequest = async (requestData) => {
    if (!currentUser) return;
    
    if (isSimulated) {
      const requestType = requestData.request_type || (requestData.providerId ? 'private' : 'public');
      const newJob = shimJob({
        ...requestData,
        id: `job-${Math.random()}`,
        customer_id: currentUser.id,
        worker_id: requestData.providerId || null,
        request_type: requestType,
        visibility: requestType,
        created_at: new Date().toISOString(),
        status: normalizeStatus(requestData.status || 'open'),
        timeline: requestData.timeline || []
      });
      setRequests(prev => [newJob, ...prev]);
      toast.success("Job request created (Simulated)");
      return newJob.id;
    }

    try {
        const requestType = requestData.request_type || (requestData.providerId ? 'private' : 'public');
        const { data, error } = await supabase
          .from('jobs')
          .insert([{
            title: requestData.title,
            description: requestData.description,
            category: requestData.category || 'General',
            budget_estimate: requestData.budget,
            location_name: requestData.location,
            coordinates: requestData.coordinates,
            urgency: requestData.urgency,
            image: requestData.image,
            customer_id: currentUser.id,
            worker_id: requestData.providerId || null,
            request_type: requestType,
            visibility: requestType,
            status: normalizeStatus(requestData.status || 'open'),
            timeline: requestData.timeline || []
          }])
          .select()
          .single();

        if (error) throw error;
        
        return data.id;
    } catch (error) {
        console.error("Error creating job:", error);
        throw error;
    }
  };

  const updateJobStatus = async (jobId, newStatus, additionalData = {}) => {
    if (!currentUser) return;

    if (isSimulated) {
      // Update local state
      setRequests(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: normalizeStatus(newStatus), ...additionalData } : job
      ));
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: normalizeStatus(newStatus), ...additionalData } : job
      ));
      toast.success(`Job status updated to ${normalizeStatus(newStatus)}`);
      return;
    }

    try {
      const updateData = { status: normalizeStatus(newStatus), ...additionalData };
      if (additionalData.worker_id) updateData.worker_id = additionalData.worker_id;
      if (additionalData.final_budget) updateData.final_budget = additionalData.final_budget;

      const { error } = await supabase
        .from('jobs')
        .update(updateData)
        .eq('id', jobId);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating job status:", error);
      throw error;
    }
  };

  const acceptJob = async (jobId) => {
    if (!currentUser) return;
    
    await updateJobStatus(jobId, 'provider_accepted', { worker_id: currentUser.id });
    toast.success('Job accepted successfully!');
  };

  const startNegotiation = async (jobId) => {
    await updateJobStatus(jobId, 'negotiating');
  };

  const finalizeAgreement = async (jobId, finalBudget) => {
    await updateJobStatus(jobId, 'awaiting_payment', { final_budget: finalBudget });
  };

  const securePayment = async (jobId) => {
    await updateJobStatus(jobId, 'payment_secured');
  };

  const markJobInProgress = async (jobId) => {
    await updateJobStatus(jobId, 'in_progress');
  };

  const completeJob = async (jobId) => {
    await updateJobStatus(jobId, 'completed');
  };

  const releasePayment = async (jobId) => {
    await updateJobStatus(jobId, 'payment_released');
  };

  const toggleSavedProvider = async (providerId) => {
    if (!currentUser) return;
    
    let newSavedIds = [...savedProviderIds];
    if (newSavedIds.includes(providerId)) {
        newSavedIds = newSavedIds.filter(id => id !== providerId);
        toast.success("Provider removed from favorites");
    } else {
        newSavedIds.push(providerId);
        toast.success("Provider saved to favorites");
    }

    if (isSimulated) {
      setSavedProviderIds(newSavedIds);
      return;
    }

    const { error } = await supabase
      .from('customer_profiles')
      .update({ saved_workers: newSavedIds })
      .eq('id', currentUser.id);

    if (error) {
        console.error("Error toggling saved provider:", error);
        toast.error("Failed to update favorites");
    } else {
        setSavedProviderIds(newSavedIds);
    }
  };

  const getProviders = async (category = null) => {
    if (isSimulated) {
      let filtered = MOCK_PROVIDERS.map(p => ({
        ...p,
        ...p.provider_profiles,
        uid: p.id,
        displayName: p.full_name,
        photoURL: p.avatar_url,
        isVerified: true
      }));
      if (category && category !== 'All') {
        filtered = filtered.filter(p => p.trade_category.includes(category.toLowerCase()));
      }
      return filtered;
    }

    try {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          provider_profiles (*)
        `)
        .eq('role', 'provider')
        .eq('is_active', true);
      
      if (category && category !== 'All') {
         query = query.contains('provider_profiles.trade_category', [category.toLowerCase()]);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Shim providers for UI compatibility
      const shimmedProviders = data.map(p => ({
        ...p,
        ...p.provider_profiles,
        uid: p.id,
        displayName: p.full_name,
        photoURL: p.avatar_url,
        isVerified: p.provider_profiles?.verification_status === 'verified'
      }));

      return shimmedProviders.filter(p => p.isVerified === true && p.is_active !== false);
    } catch (error) {
      console.error("Error fetching providers:", error);
      return [];
    }
  };

  const value = {
    requests,
    jobs,
    verifications,
    users,
    earnings,
    loading,
    createRequest,
    updateJobStatus,
    acceptJob,
    startNegotiation,
    finalizeAgreement,
    securePayment,
    markJobInProgress,
    completeJob,
    releasePayment,
    getProviders,
    savedProviderIds, 
    toggleSavedProvider,
    isSimulated
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}
