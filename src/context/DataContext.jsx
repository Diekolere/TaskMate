import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, IS_SIMULATED, uploadFile, generateFilePath } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { MOCK_JOBS, MOCK_PROVIDERS } from '../lib/mocks';

const DataContext = createContext({
    requests: [],
    jobs: [],
    verifications: [],
    users: [],
    earnings: [],
    notifications: [],
    loading: true,
    createRequest: async () => {},
    getProviders: async () => [],
});

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }) {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedProviderIds, setSavedProviderIds] = useState([]);

  const normalizeStatus = (status) => {
    const s = String(status || '').trim().toLowerCase().replace(/\s+/g, '_');
    const map = {
      open: 'open', pending: 'pending', interested: 'interested',
      negotiating: 'negotiating', provider_accepted: 'provider_accepted',
      awaiting_payment: 'awaiting_payment', payment_secured: 'payment_secured',
      in_progress: 'in_progress', completed: 'completed',
      payment_released: 'payment_released', cancelled: 'cancelled',
      canceled: 'cancelled', paid: 'payment_released', inprogress: 'in_progress'
    };
    return map[s] || (s || 'open');
  };

  const shimJob = (job) => {
    if (!job) return null;
    const hasTargetProvider = Boolean(job.providerId || job.worker_id);
    const rType = job.request_type || (hasTargetProvider ? 'private' : 'public');
    return {
      ...job,
      status: normalizeStatus(job.status),
      request_type: rType,
      visibility: rType,
      customerId: job.customer_id,
      providerId: job.worker_id,
      agreedPrice: job.agreed_price || job.agreedPrice,
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

  // ── Saved Providers ─────────────────────────────────────
  useEffect(() => {
    if (currentUser?.role === 'customer') {
      setSavedProviderIds(currentUser.saved_workers || []);
    }
  }, [currentUser]);

  // ── Customer Jobs (Realtime) ────────────────────────────
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'customer') return;

    if (IS_SIMULATED) {
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

      if (error) { console.error('Fetch jobs error:', error); toast.error('Failed to load requests'); }
      else setRequests(data.map(shimJob));
      setLoading(false);
    };

    fetchJobs();

    const channel = supabase
      .channel('jobs:customer')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'jobs',
        filter: `customer_id=eq.${currentUser.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setRequests(prev => [shimJob(payload.new), ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setRequests(prev => prev.map(j => j.id === payload.new.id ? shimJob(payload.new) : j));
          toast.info(`Job updated: ${payload.new.title}`, { description: `Status: ${payload.new.status}` });
        } else if (payload.eventType === 'DELETE') {
          setRequests(prev => prev.filter(j => j.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentUser]);

  // ── Provider Jobs (Realtime) ────────────────────────────
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'provider') return;

    if (IS_SIMULATED) {
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

      if (error) { console.error('Fetch provider jobs error:', error); toast.error('Failed to load jobs'); }
      else setJobs(data.map(shimJob));
      setLoading(false);
    };

    fetchProviderJobs();

    const channel = supabase
      .channel('jobs:provider')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        fetchProviderJobs();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentUser]);

  // ── Notifications (Realtime) ────────────────────────────
  useEffect(() => {
    if (!currentUser || IS_SIMULATED) return;

    const fetchNotifs = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setNotifications(data);
    };

    fetchNotifs();

    const channel = supabase
      .channel('notifications:user')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${currentUser.id}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        toast.info(payload.new.title, { description: payload.new.body });
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentUser]);

  // ── Earnings (Provider) ─────────────────────────────────
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'provider' || IS_SIMULATED) return;

    const fetch = async () => {
      const { data } = await supabase
        .from('earnings')
        .select('*')
        .eq('provider_id', currentUser.id)
        .order('created_at', { ascending: false });
      if (data) setEarnings(data);
    };

    fetch();
  }, [currentUser]);

  // ── Admin Data ──────────────────────────────────────────
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return;

    if (IS_SIMULATED) {
      setVerifications([
        { id: 'v1', provider_name: 'John Electrician', email: 'john@example.com', status: 'pending', submitted_at: new Date(Date.now() - 86400000).toISOString() },
        { id: 'v2', provider_name: 'Sarah Plumber', email: 'sarah@example.com', status: 'pending', submitted_at: new Date(Date.now() - 172800000).toISOString() }
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
      const [verRes, userRes, jobRes] = await Promise.all([
        supabase.from('verifications').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*, provider_profiles(*)').order('created_at', { ascending: false }),
        supabase.from('jobs').select('*').order('created_at', { ascending: false }).limit(100),
      ]);
      if (verRes.data) setVerifications(verRes.data);
      if (userRes.data) setUsers(userRes.data);
      if (jobRes.data) setRequests(jobRes.data.map(shimJob));
      setLoading(false);
    };

    fetchAdminData();
  }, [currentUser]);

  // ── Actions ─────────────────────────────────────────────

  const createRequest = async (requestData) => {
    if (!currentUser) return;

    if (IS_SIMULATED) {
      const rType = requestData.request_type || (requestData.providerId ? 'private' : 'public');
      const newJob = shimJob({
        ...requestData, id: `job-${Math.random()}`,
        customer_id: currentUser.id, worker_id: requestData.providerId || null,
        request_type: rType, visibility: rType,
        created_at: new Date().toISOString(), status: normalizeStatus(requestData.status || 'open'),
        timeline: requestData.timeline || []
      });
      setRequests(prev => [newJob, ...prev]);
      toast.success('Job request created (Simulated)');
      return newJob.id;
    }

    try {
      // Upload images if any
      let imageUrls = [];
      if (requestData.imageFiles && requestData.imageFiles.length > 0) {
        toast.loading('Uploading images...', { id: 'img-upload' });
        for (const file of requestData.imageFiles) {
          const path = generateFilePath(currentUser.id, file.name);
          const url = await uploadFile('job-images', path, file);
          imageUrls.push(url);
        }
        toast.dismiss('img-upload');
      }

      const rType = requestData.request_type || (requestData.providerId ? 'private' : 'public');
      const { data, error } = await supabase
        .from('jobs')
        .insert([{
          title: requestData.title,
          description: requestData.description,
          category: requestData.category || 'General',
          budget_estimate: requestData.budget,
          location_name: requestData.location,
          coordinates: requestData.coordinates,
          urgency: requestData.urgency || 'medium',
          images: imageUrls.length > 0 ? imageUrls : (requestData.images || []),
          customer_id: currentUser.id,
          customer_name: currentUser.full_name || currentUser.displayName,
          worker_id: requestData.providerId || null,
          request_type: rType,
          visibility: rType,
          status: normalizeStatus(requestData.status || 'open'),
          timeline: requestData.timeline || []
        }])
        .select()
        .single();

      if (error) throw error;
      toast.success('Request posted!');
      return data.id;
    } catch (error) {
      console.error('Create request error:', error);
      toast.error('Failed to create request');
      throw error;
    }
  };

  const updateJobStatus = async (jobId, newStatus, additionalData = {}) => {
    if (!currentUser) return;

    if (IS_SIMULATED) {
      setRequests(prev => prev.map(j =>
        j.id === jobId ? { ...j, status: normalizeStatus(newStatus), ...additionalData } : j
      ));
      setJobs(prev => prev.map(j =>
        j.id === jobId ? { ...j, status: normalizeStatus(newStatus), ...additionalData } : j
      ));
      toast.success(`Status updated to ${normalizeStatus(newStatus)}`);
      return;
    }

    try {
      const updateData = { status: normalizeStatus(newStatus), ...additionalData };
      const { error } = await supabase.from('jobs').update(updateData).eq('id', jobId);
      if (error) throw error;
    } catch (error) {
      console.error('Update job error:', error);
      toast.error('Failed to update job status');
      throw error;
    }
  };

  const acceptJob = async (jobId) => {
    await updateJobStatus(jobId, 'provider_accepted', { worker_id: currentUser.id });
    toast.success('Job accepted!');
  };

  const startNegotiation = async (jobId) => {
    await updateJobStatus(jobId, 'negotiating');
  };

  const finalizeAgreement = async (jobId, finalBudget) => {
    await updateJobStatus(jobId, 'awaiting_payment', { final_budget: finalBudget, agreed_price: finalBudget });
  };

  const securePayment = async (jobId) => {
    await updateJobStatus(jobId, 'payment_secured');
    toast.success('Payment secured in escrow');
  };

  const markJobInProgress = async (jobId) => {
    await updateJobStatus(jobId, 'in_progress', { started_at: new Date().toISOString() });
  };

  const completeJob = async (jobId) => {
    await updateJobStatus(jobId, 'completed', { completed_at: new Date().toISOString() });
  };

  const releasePayment = async (jobId) => {
    await updateJobStatus(jobId, 'payment_released');
    toast.success('Payment released to provider');
  };

  // ── Providers ───────────────────────────────────────────

  const getProviders = useCallback(async (category = null) => {
    if (IS_SIMULATED) {
      let filtered = MOCK_PROVIDERS.map(p => ({
        ...p, ...p.provider_profiles,
        uid: p.id, displayName: p.full_name, photoURL: p.avatar_url, isVerified: true
      }));
      if (category && category !== 'All') {
        filtered = filtered.filter(p => p.trade_category?.includes(category.toLowerCase()));
      }
      return filtered;
    }

    try {
      let query = supabase
        .from('profiles')
        .select('*, provider_profiles(*)')
        .eq('role', 'provider')
        .eq('is_active', true);

      if (category && category !== 'All') {
        query = query.contains('provider_profiles.trade_category', [category.toLowerCase()]);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(p => ({
        ...p, ...p.provider_profiles,
        uid: p.id, displayName: p.full_name, photoURL: p.avatar_url,
        isVerified: p.provider_profiles?.verification_status === 'verified'
      }));
    } catch (error) {
      console.error('Get providers error:', error);
      return [];
    }
  }, []);

  // ── Saved Providers ─────────────────────────────────────

  const toggleSavedProvider = async (providerId) => {
    if (!currentUser) return;

    let newSavedIds = [...savedProviderIds];
    if (newSavedIds.includes(providerId)) {
      newSavedIds = newSavedIds.filter(id => id !== providerId);
      toast.success('Provider removed from favorites');
    } else {
      newSavedIds.push(providerId);
      toast.success('Provider saved!');
    }

    if (IS_SIMULATED) { setSavedProviderIds(newSavedIds); return; }

    const { error } = await supabase
      .from('customer_profiles')
      .update({ saved_workers: newSavedIds })
      .eq('id', currentUser.id);

    if (error) { toast.error('Failed to update favorites'); }
    else { setSavedProviderIds(newSavedIds); }
  };

  // ── Reviews ─────────────────────────────────────────────

  const submitReview = async (jobId, providerId, rating, comment, tags = []) => {
    if (!currentUser) return;

    if (IS_SIMULATED) {
      toast.success('Review submitted (simulated)');
      return;
    }

    try {
      const { error } = await supabase.from('reviews').insert([{
        job_id: jobId, reviewer_id: currentUser.id, provider_id: providerId,
        rating, comment, tags
      }]);
      if (error) throw error;
      toast.success('Review submitted!');
    } catch (error) {
      console.error('Submit review error:', error);
      toast.error('Failed to submit review');
      throw error;
    }
  };

  // ── Notifications ───────────────────────────────────────

  const markNotificationRead = async (notifId) => {
    if (IS_SIMULATED) {
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
      return;
    }
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
  };

  const markAllNotificationsRead = async () => {
    if (IS_SIMULATED) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      return;
    }
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', currentUser.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  // ── Service Posts ───────────────────────────────────────

  const createServicePost = async (postData) => {
    if (!currentUser) return;

    if (IS_SIMULATED) {
      toast.success('Post created (simulated)');
      return 'mock-post-id';
    }

    try {
      let imageUrls = [];
      if (postData.imageFiles?.length > 0) {
        for (const file of postData.imageFiles) {
          const path = generateFilePath(currentUser.id, file.name);
          const url = await uploadFile('service-posts', path, file);
          imageUrls.push(url);
        }
      }

      const { data, error } = await supabase.from('service_posts').insert([{
        provider_id: currentUser.id, caption: postData.caption,
        images: imageUrls, tags: postData.tags || [], category: postData.category
      }]).select().single();

      if (error) throw error;
      toast.success('Post created!');
      return data.id;
    } catch (error) {
      console.error('Create post error:', error);
      toast.error('Failed to create post');
      throw error;
    }
  };

  const getServicePosts = async (providerId) => {
    if (IS_SIMULATED) return [];

    const { data } = await supabase
      .from('service_posts')
      .select('*')
      .eq('provider_id', providerId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    return data || [];
  };

  // ── Support Tickets ─────────────────────────────────────

  const createSupportTicket = async (subject, message, category = 'general') => {
    if (!currentUser) return;

    if (IS_SIMULATED) {
      toast.success('Ticket submitted (simulated)');
      return;
    }

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

  // ── Verifications (KYC) ─────────────────────────────────

  const submitVerification = async (verificationData) => {
    if (!currentUser) return;

    if (IS_SIMULATED) {
      toast.success('Verification submitted (simulated)');
      return;
    }

    try {
      let urls = {};
      for (const [key, file] of Object.entries(verificationData.files || {})) {
        if (file) {
          const path = generateFilePath(currentUser.id, file.name);
          urls[key] = await uploadFile('verification-docs', path, file);
        }
      }

      const { error } = await supabase.from('verifications').insert([{
        provider_id: currentUser.id,
        provider_name: currentUser.full_name || currentUser.displayName,
        email: currentUser.email,
        id_front_url: urls.idFront || null,
        id_back_url: urls.idBack || null,
        selfie_url: urls.selfie || null,
        business_license_url: urls.businessLicense || null,
        status: 'pending'
      }]);

      if (error) throw error;

      await supabase.from('provider_profiles')
        .update({ verification_status: 'pending' })
        .eq('id', currentUser.id);

      toast.success('Verification submitted for review!');
    } catch (error) {
      toast.error('Failed to submit verification');
      throw error;
    }
  };

  // ── Admin Actions ───────────────────────────────────────

  const updateVerificationStatus = async (verificationId, status, notes = '') => {
    if (IS_SIMULATED) {
      setVerifications(prev => prev.map(v => v.id === verificationId ? { ...v, status } : v));
      toast.success(`Verification ${status}`);
      return;
    }

    const { error } = await supabase.from('verifications')
      .update({ status, admin_notes: notes, reviewed_by: currentUser.id, reviewed_at: new Date().toISOString() })
      .eq('id', verificationId);
    if (error) { toast.error('Failed to update verification'); return; }

    setVerifications(prev => prev.map(v => v.id === verificationId ? { ...v, status } : v));
    toast.success(`Verification ${status}`);
  };

  const updateUserStatus = async (userId, isActive) => {
    if (IS_SIMULATED) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: isActive } : u));
      toast.success(`User ${isActive ? 'activated' : 'suspended'}`);
      return;
    }

    const { error } = await supabase.from('profiles')
      .update({ is_active: isActive, status: isActive ? 'Active' : 'Suspended' })
      .eq('id', userId);
    if (error) toast.error('Failed to update user');
    else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: isActive } : u));
      toast.success(`User ${isActive ? 'activated' : 'suspended'}`);
    }
  };

  const value = {
    requests, jobs, verifications, users, earnings, notifications, loading,
    createRequest, updateJobStatus, acceptJob, startNegotiation,
    finalizeAgreement, securePayment, markJobInProgress, completeJob,
    releasePayment, getProviders, savedProviderIds, toggleSavedProvider,
    submitReview, markNotificationRead, markAllNotificationsRead,
    createServicePost, getServicePosts, createSupportTicket,
    submitVerification, updateVerificationStatus, updateUserStatus,
    isSimulated: IS_SIMULATED
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}
