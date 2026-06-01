import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, uploadFile, generateFilePath } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { toast } from 'sonner';

const JobContext = createContext({
  requests: [],
  jobs: [],
  loading: true,
  createRequest: async () => {},
  updateJobStatus: async () => {},
  acceptJob: async () => {},
  startNegotiation: async () => {},
  reopenNegotiation: async () => {},
  finalizeAgreement: async () => {},
  securePayment: async () => {},
  markJobInProgress: async () => {},
  completeJob: async () => {},
  releasePayment: async () => {},
  getJobMatches: async () => [],
  inviteMatchedProvider: async () => {},
});

export function useJobs() {
  return useContext(JobContext);
}

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

export function JobProvider({ children }) {
  const { currentUser } = useAuth();
  const { sendNotification } = useNotifications();
  const [requests, setRequests] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

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
    finalAmount: job.final_budget || job.agreed_price || job.budget_estimate,
    customerName: job.profiles?.full_name || job.customerName || 'Anonymous',
    location_name: job.profiles?.location_name || job.location_name || job.location,
    completedAt: job.completed_at ? {
      toDate: () => new Date(job.completed_at),
      toMillis: () => new Date(job.completed_at).getTime()
    } : null,
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

  // Admin Jobs Fetching
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      const fetchAdminJobs = async () => {
        const { data } = await supabase.from('jobs').select('*').order('created_at', { ascending: false }).limit(100);
        if (data) setRequests(data.map(shimJob));
        setLoading(false);
      };
      fetchAdminJobs();
    }
  }, [currentUser]);

  // Customer Jobs
  const [customerJobsPage, setCustomerJobsPage] = useState(1);
  const [customerJobsHasMore, setCustomerJobsHasMore] = useState(true);

  const fetchCustomerJobs = useCallback(async (page = 1) => {
    if (!currentUser || currentUser.role !== 'customer') return;
    setLoading(true);
    const from = (page - 1) * 15;
    const to = from + 14;

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('customer_id', currentUser.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) { 
        console.error('Fetch jobs error:', error); 
        toast.error('Failed to load requests'); 
    } else {
        setCustomerJobsHasMore(data.length >= 15);
        if (page === 1) {
            setRequests(data.map(shimJob));
        } else {
            setRequests(prev => {
                const newReqs = data.map(shimJob);
                const existingIds = new Set(prev.map(r => r.id));
                return [...prev, ...newReqs.filter(r => !existingIds.has(r.id))];
            });
        }
    }
    setLoading(false);
  }, [currentUser]);

  const loadMoreCustomerJobs = useCallback(() => {
      if (!customerJobsHasMore || loading) return;
      setCustomerJobsPage(prev => {
          const next = prev + 1;
          fetchCustomerJobs(next);
          return next;
      });
  }, [customerJobsHasMore, loading, fetchCustomerJobs]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'customer') return;

    fetchCustomerJobs(1);

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

    return () => { supabase.removeChannel(channel); };
  }, [currentUser]);

  // Provider Jobs
  const [providerJobsPage, setProviderJobsPage] = useState(1);
  const [providerJobsHasMore, setProviderJobsHasMore] = useState(true);

  const fetchProviderJobs = useCallback(async (page = 1) => {
    if (!currentUser || currentUser.role !== 'provider') return;
    setLoading(true);

    const { data: applications } = await supabase
      .from('job_applications')
      .select('job_id')
      .eq('provider_id', currentUser.id);
    
    const appliedJobIds = (applications || []).map(a => a.job_id);
    
    let query = supabase
      .from('jobs')
      .select('*, profiles!jobs_customer_id_fkey(full_name, location_name)');
    
    const orConditions = [`worker_id.eq.${currentUser.id}`, 'status.eq.open'];
    if (appliedJobIds.length > 0) {
      orConditions.push(`id.in.(${appliedJobIds.map(id => `"${id}"`).join(',')})`);
    }
    
    const from = (page - 1) * 15;
    const to = from + 14;

    const { data, error } = await query
      .or(orConditions.join(','))
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) { 
        console.error('Fetch provider jobs error:', error); 
        toast.error('Failed to load jobs'); 
    } else {
        setProviderJobsHasMore(data.length >= 15);
        if (page === 1) {
            setJobs(data.map(shimJob));
        } else {
            setJobs(prev => {
                const newJobs = data.map(shimJob);
                const existingIds = new Set(prev.map(j => j.id));
                return [...prev, ...newJobs.filter(j => !existingIds.has(j.id))];
            });
        }
    }
    setLoading(false);
  }, [currentUser]);

  const loadMoreProviderJobs = useCallback(() => {
      if (!providerJobsHasMore || loading) return;
      setProviderJobsPage(prev => {
          const next = prev + 1;
          fetchProviderJobs(next);
          return next;
      });
  }, [providerJobsHasMore, loading, fetchProviderJobs]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'provider') return;

    fetchProviderJobs(1);

    const channel = supabase
      .channel('jobs:provider')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'jobs',
        filter: `worker_id=eq.${currentUser.id}`
      }, () => {
        fetchProviderJobs(1); // Refresh page 1 on update
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser, fetchProviderJobs]);

  const createRequest = async (requestData) => {
    if (!currentUser) return;
    try {
      let imageUrls = [];
      if (requestData.imageFiles?.length > 0) {
        toast.loading('Uploading images...', { id: 'img-upload' });
        for (const file of requestData.imageFiles) {
          const path = generateFilePath(currentUser.id, file.name);
          const url = await uploadFile('job-images', path, file);
          imageUrls.push(url);
        }
        toast.dismiss('img-upload');
      }

      let enhancedDesc = requestData.description;
      let suggestedPrice = requestData.budget;
      
      try {
        const { data: aiData, error: aiError } = await supabase.functions.invoke('ai', { 
            body: { action: 'enhance-description', title: requestData.title, description: requestData.description, category: requestData.category || 'General', urgency: requestData.urgency || 'medium' }
        });
        if (!aiError && aiData?.success) {
            enhancedDesc = aiData.enhanced_description;
            suggestedPrice = aiData.suggested_price || requestData.budget;
        }
      } catch (e) { console.error('AI Enhance skipped:', e); }

      const rType = requestData.request_type || (requestData.providerId ? 'private' : 'public');
      const locationCoords = requestData.coordinates ? `POINT(${requestData.coordinates.lng} ${requestData.coordinates.lat})` : null;

      const { data, error } = await supabase.from('jobs').insert([{
          title: requestData.title, description: requestData.description, category: requestData.category || 'General',
          budget_estimate: requestData.budget, location_name: requestData.location, location_coords: locationCoords,
          coordinates: requestData.coordinates, urgency: requestData.urgency || 'medium', images: imageUrls.length > 0 ? imageUrls : (requestData.images || []),
          customer_id: currentUser.id, worker_id: requestData.providerId || null, request_type: rType, visibility: rType,
          status: normalizeStatus(requestData.status || 'open'), timeline: requestData.timeline || [], enhanced_description: enhancedDesc, ai_suggested_price: suggestedPrice
        }]).select().single();

      if (error) throw error;
      
      if (rType === 'private' && requestData.providerId) {
          await sendNotification(requestData.providerId, {
              type: 'booking', title: 'New Private Booking!',
              body: `${currentUser.full_name || 'A customer'} invited you to: ${requestData.title}`,
              icon: 'person_add', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600',
              ctaPath: `/provider/requests/${data.id}`
          });
      }

      await sendNotification(currentUser.id, {
          type: 'system', title: 'Request Posted',
          body: `Your request "${requestData.title}" is now live.`,
          icon: 'check_circle', iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
          ctaPath: '/customer/requests'
      });

      if (rType === 'public') {
          supabase.functions.invoke('matching', { body: { action: 'auto-match', jobId: data.id }})
            .catch(e => console.error('Auto-match failed silently:', e));
      }

      return data.id;
    } catch (error) {
      console.error('Create request error:', error);
      toast.error('Failed to create request');
      throw error;
    }
  };

  const updateJobStatus = async (jobId, newStatus, additionalData = {}) => {
    if (!currentUser) return;
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
    const { data: job } = await supabase.from('jobs').select('budget_estimate, customer_id, title, request_type').eq('id', jobId).single();
    
    const { error: upsertError } = await supabase.from('job_applications').upsert({
      job_id: jobId, provider_id: currentUser.id, proposed_price: job?.budget_estimate || null, status: 'accepted', updated_at: new Date().toISOString()
    }, { onConflict: 'job_id,provider_id' });

    if (upsertError) throw new Error(`Failed to accept job: ${upsertError.message}`);
    
    const extra = (job?.request_type === 'private') ? { worker_id: currentUser.id } : {};
    await updateJobStatus(jobId, 'provider_accepted', extra);
    
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/squad`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-static-virtual-account', providerId: currentUser.id, providerEmail: currentUser.email, providerFirstName: currentUser.full_name?.split(' ')[0] || 'Provider', providerLastName: currentUser.full_name?.split(' ')[1] || '', providerPhone: currentUser.phone_number || '' })
      });
    } catch (vaError) { console.error('VA creation error:', vaError); }
    
    if (job) {
      await sendNotification(job.customer_id, {
        type: 'job_update', title: '🎉 Provider Accepted Your Request!',
        body: `A provider has accepted "${job.title}". Tap to open the negotiation chat and agree on a price.`,
        icon: 'handshake', iconBg: 'bg-[#10B981]/10', iconColor: 'text-[#10B981]',
        ctaPath: `/customer/request-status/${jobId}?negotiate=true`, ctaLabel: 'Start Negotiating'
      });
    }
  };

  const startNegotiation = async (jobId) => await updateJobStatus(jobId, 'negotiating');

  const reopenNegotiation = async (jobId, initiatorRole, otherPartyId, jobTitle, initiatorName) => {
      await updateJobStatus(jobId, 'negotiating', { final_budget: null, agreed_price: null });
      if (otherPartyId && jobTitle) {
          await sendNotification(otherPartyId, {
              type: 'job_update', title: 'Negotiation Reopened 🔄',
              body: `${initiatorName || 'The other party'} wants to renegotiate terms for "${jobTitle}". Tap to continue.`,
              icon: 'autorenew', iconBg: 'bg-amber-100', iconColor: 'text-amber-600',
              ctaPath: initiatorRole === 'customer' ? `/provider/negotiation/${jobId}` : `/customer/request-status/${jobId}?negotiate=true`, ctaLabel: 'Continue Negotiating'
          });
      }
  };

  const finalizeAgreement = async (jobId, finalBudget, providerId = null) => {
    const updates = { status: 'awaiting_payment', final_budget: finalBudget, agreed_price: finalBudget };
    if (providerId) updates.worker_id = providerId;
    await updateJobStatus(jobId, 'awaiting_payment', updates);
    
    const { data: job } = await supabase.from('jobs').select('customer_id, worker_id, title').eq('id', jobId).single();
    if (job) {
      await sendNotification(job.customer_id, {
        type: 'payment', title: 'Deal Agreed — Pay Now',
        body: `Your deal for "${job.title}" is finalized at ₦${Number(finalBudget).toLocaleString()}. Tap to pay.`,
        icon: 'payments', iconBg: 'bg-blue-50', iconColor: 'text-blue-500', ctaPath: `/customer/payment/${jobId}`, ctaLabel: 'Pay Now'
      });
    }
  };

  const securePayment = async (jobId) => {
    await updateJobStatus(jobId, 'payment_secured');
    const { data: job } = await supabase.from('jobs').select('customer_id, worker_id, title').eq('id', jobId).single();
    if (job?.worker_id) {
      await sendNotification(job.worker_id, {
        type: 'payment', title: 'Payment Secured — Ready to Start',
        body: `The customer has paid for "${job.title}". You can now start the job.`,
        icon: 'account_balance_wallet', iconBg: 'bg-green-50', iconColor: 'text-[#10B981]',
        ctaPath: `/provider/jobs/${jobId}`, ctaLabel: 'Start Work'
      });
    }
  };

  const markJobInProgress = async (jobId) => {
    await updateJobStatus(jobId, 'in_progress', { started_at: new Date().toISOString() });
    const { data: job } = await supabase.from('jobs').select('customer_id, title').eq('id', jobId).single();
    if (job) {
      await sendNotification(job.customer_id, {
        type: 'job_update', title: 'Job Has Started',
        body: `Your provider has started work on "${job.title}".`,
        icon: 'build_circle', iconBg: 'bg-blue-50', iconColor: 'text-blue-500', ctaPath: `/customer/request/${jobId}`
      });
    }
  };

  const completeJob = async (jobId) => {
    await updateJobStatus(jobId, 'completed', { completed_at: new Date().toISOString() });
    const { data: job } = await supabase.from('jobs').select('customer_id, worker_id, title').eq('id', jobId).single();
    if (job) {
      await sendNotification(job.customer_id, {
        type: 'job_update', title: 'Job Marked Complete',
        body: `Your provider has completed "${job.title}". Review and release payment.`,
        icon: 'task_alt', iconBg: 'bg-[#10B981]/10', iconColor: 'text-[#10B981]',
        ctaPath: `/customer/confirm/${jobId}`, ctaLabel: 'Confirm & Release'
      });
    }
  };

  const releasePayment = async (jobId) => {
    try {
      const { data, error } = await supabase.functions.invoke('squad', { body: { action: 'release-escrow', jobId } });
      if (error) throw error;
      if (!data?.success) {
        console.warn('[releasePayment] No escrow entry found, falling back to status update only.');
        await updateJobStatus(jobId, 'payment_released');
      }
      const { data: job } = await supabase.from('jobs').select('worker_id, title, agreed_price, final_budget').eq('id', jobId).single();
      if (job?.worker_id) {
        const amount = data?.net_amount || job.agreed_price || job.final_budget;
        await sendNotification(job.worker_id, {
          type: 'payment', title: '💰 Payment Released!',
          body: `₦${Number(amount || 0).toLocaleString()} for "${job.title}" has been released to your wallet.`,
          icon: 'account_balance_wallet', iconBg: 'bg-green-50', iconColor: 'text-[#10B981]'
        });
      }
    } catch (err) {
      console.error('[releasePayment] Error:', err);
      await updateJobStatus(jobId, 'payment_released');
      throw err;
    }
  };

  const getJobMatches = async (jobId) => {
    try {
      const { data, error } = await supabase.from('job_matches').select(`*, provider:profiles!job_matches_provider_id_fkey(full_name, avatar_url)`).eq('job_id', jobId).order('match_score', { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return [];
      const providerIds = data.map(m => m.provider_id);
      const { data: providerProfiles } = await supabase.from('provider_profiles').select('id, average_rating, completed_jobs_count, trade_category').in('id', providerIds);
      const profileMap = (providerProfiles || []).reduce((acc, p) => { acc[p.id] = p; return acc; }, {});
      return data.map(m => ({ ...m, provider_profile: profileMap[m.provider_id] || {} }));
    } catch (error) {
      console.error('Failed to get job matches:', error);
      return [];
    }
  };

  const inviteMatchedProvider = async (jobId, providerId, jobTitle) => {
    try {
      const { error: appError } = await supabase.from('job_applications').upsert({ job_id: jobId, provider_id: providerId, status: 'invited', updated_at: new Date().toISOString() }, { onConflict: 'job_id,provider_id' });
      if (appError) throw appError;
      await sendNotification(providerId, {
        type: 'job_update', title: 'You were invited to a Job!',
        body: `${currentUser.full_name || 'A customer'} invited you to: ${jobTitle}`,
        icon: 'person_add', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', ctaPath: `/provider/requests/${jobId}`
      });
      toast.success('Provider invited successfully!');
      return true;
    } catch (error) {
      console.error('Failed to invite provider:', error);
      toast.error('Failed to invite provider');
      return false;
    }
  };

  const value = {
    requests, jobs, loading,
    customerJobsHasMore, loadMoreCustomerJobs, providerJobsHasMore, loadMoreProviderJobs,
    createRequest, updateJobStatus, acceptJob, startNegotiation, reopenNegotiation,
    finalizeAgreement, securePayment, markJobInProgress, completeJob, releasePayment,
    getJobMatches, inviteMatchedProvider
  };

  return (
    <JobContext.Provider value={value}>
      {children}
    </JobContext.Provider>
  );
}
