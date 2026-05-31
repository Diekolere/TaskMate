import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, uploadFile, generateFilePath } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const formatProviderCategory = (tradeCategoryArray, fallbackCategory) => {
  if (tradeCategoryArray && Array.isArray(tradeCategoryArray) && tradeCategoryArray.length > 0) {
    if (tradeCategoryArray.length === 1) return tradeCategoryArray[0];
    return `${tradeCategoryArray[0]} + ${tradeCategoryArray.length - 1}`;
  }
  if (fallbackCategory && fallbackCategory !== 'General Service' && fallbackCategory !== 'None') {
    return fallbackCategory;
  }
  return 'None';
};

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
  const [messages, setMessages] = useState([]);
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

  // ── Saved Providers ─────────────────────────────────────
  useEffect(() => {
    if (currentUser?.role === 'customer') {
      setSavedProviderIds(currentUser.saved_workers || []);
    }
  }, [currentUser]);

  // ── Customer Jobs (Realtime) ────────────────────────────
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'customer') return;

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

    return () => { supabase.removeChannel(channel); };
  }, [currentUser]);

  // ── Provider Jobs (Realtime) ────────────────────────────
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'provider') return;

    const fetchProviderJobs = async () => {
      // Fetch jobs where:
      // 1. User is the worker
      // 2. Job is public and open
      // 3. User has an application (negotiating phase)
      
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
      
      const { data, error } = await query
        .or(orConditions.join(','))
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

    return () => { supabase.removeChannel(channel); };
  }, [currentUser]);

  // ── Notifications (Realtime) ────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

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

    // ── Messages (Realtime)
    const msgChannel = supabase
      .channel('messages:user')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'negotiations'
      }, (payload) => {
        const newMsg = {
          ...payload.new,
          type: payload.new.message_type || 'text',
          metadata: {
            ...(payload.new.metadata || {}),
            ...(payload.new.price != null ? {
              price: payload.new.price,
              proposed_price: payload.new.price,
              budget: payload.new.price,
              finalizePrice: payload.new.message_type === 'finalize_request' ? payload.new.price : undefined
            } : {})
          }
        };
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(msgChannel);
    };
  }, [currentUser]);

  // ── Earnings (Provider) ─────────────────────────────────
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'provider') return;

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

  // Central helper to send a notification via Edge Function (bypasses RLS issues)
  const sendNotification = async (userId, { type = 'system', title, body, icon = 'info', iconBg = 'bg-gray-100', iconColor = 'text-gray-400', ctaPath = null, ctaLabel = null, secondaryLabel = 'Later' } = {}) => {
    if (!userId || !title) return;
    try {
      const { data, error } = await supabase.functions.invoke('notifications', {
        body: { action: 'send', userId, title, body, type, icon, iconBg, iconColor, ctaPath, ctaLabel, secondaryLabel }
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('sendNotification failed:', err);
    }
  };

  const createRequest = async (requestData) => {
    if (!currentUser) return;

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

      // Call ai/enhance-description edge function here
      let enhancedDesc = requestData.description;
      let suggestedPrice = requestData.budget;
      
      try {
        const { data: aiData, error: aiError } = await supabase.functions.invoke('ai', { 
            body: { 
                action: 'enhance-description', 
                title: requestData.title,
                description: requestData.description,
                category: requestData.category || 'General',
                urgency: requestData.urgency || 'medium'
            }
        });
        if (!aiError && aiData?.success) {
            enhancedDesc = aiData.enhanced_description;
            suggestedPrice = aiData.suggested_price || requestData.budget;
        }
      } catch (e) { console.error('AI Enhance skipped:', e); }

      const rType = requestData.request_type || (requestData.providerId ? 'private' : 'public');
      
      // Format coordinates for PostGIS (WKT: POINT(lng lat))
      const locationCoords = requestData.coordinates 
        ? `POINT(${requestData.coordinates.lng} ${requestData.coordinates.lat})`
        : null;

      const { data, error } = await supabase
        .from('jobs')
        .insert([{
          title: requestData.title,
          description: requestData.description,
          category: requestData.category || 'General',
          budget_estimate: requestData.budget,
          location_name: requestData.location,
          location_coords: locationCoords,
          coordinates: requestData.coordinates,
          urgency: requestData.urgency || 'medium',
          images: imageUrls.length > 0 ? imageUrls : (requestData.images || []),
          customer_id: currentUser.id,
          worker_id: requestData.providerId || null,
          request_type: rType,
          visibility: rType,
          status: normalizeStatus(requestData.status || 'open'),
          timeline: requestData.timeline || [],
          enhanced_description: enhancedDesc,
          ai_suggested_price: suggestedPrice
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Send notifications
      if (rType === 'private' && requestData.providerId) {
          // Notify Provider
          await sendNotification(requestData.providerId, {
              type: 'booking',
              title: 'New Private Booking!',
              body: `${currentUser.full_name || 'A customer'} invited you to: ${requestData.title}`,
              icon: 'person_add',
              iconBg: 'bg-emerald-100',
              iconColor: 'text-emerald-600',
              ctaPath: `/provider/requests/${data.id}`
          });
      }

      // Notify Customer (Confirmation)
      await sendNotification(currentUser.id, {
          type: 'system',
          title: 'Request Posted',
          body: `Your request "${requestData.title}" is now live.`,
          icon: 'check_circle',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          ctaPath: '/customer/requests'
      });

      // Trigger matching/auto-match-job edge function async if it's a public request
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
      
      // TODO (Phase 2): If newStatus === 'payment_released', trigger squad/initiate-payout edge function
      // if (normalizeStatus(newStatus) === 'payment_released') {
      //    supabase.functions.invoke('squad', { body: { action: 'initiate-payout', jobId }});
      // }
    } catch (error) {
      console.error('Update job error:', error);
      toast.error('Failed to update job status');
      throw error;
    }
  };

  const acceptJob = async (jobId) => {
    // Fetch job to get budget for proposed_price
    const { data: job } = await supabase.from('jobs').select('budget_estimate, customer_id, title').eq('id', jobId).single();
    
    // FIRST: Record acceptance in job_applications table (idempotent upsert)
    // This handles the "409 Conflict" case automatically by updating if exists
    const { error: upsertError } = await supabase.from('job_applications').upsert({
      job_id: jobId,
      provider_id: currentUser.id,
      proposed_price: job?.budget_estimate || null,
      status: 'accepted',
      updated_at: new Date().toISOString()
    }, { onConflict: 'job_id,provider_id' });

    if (upsertError) {
      throw new Error(`Failed to accept job: ${upsertError.message}`);
    }
    
    // SECOND: Update the job status. ONLY set worker_id if it's a private request.
    // For public requests, multiple pros can accept and negotiate; assignment happens later.
    const extra = (job?.request_type === 'private') ? { worker_id: currentUser.id } : {};
    await updateJobStatus(jobId, 'provider_accepted', extra);
    
    // THIRD: Create virtual account (non-blocking)
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/squad`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create-static-virtual-account',
          providerId: currentUser.id,
          providerEmail: currentUser.email,
          providerFirstName: currentUser.full_name?.split(' ')[0] || 'Provider',
          providerLastName: currentUser.full_name?.split(' ')[1] || '',
          providerPhone: currentUser.phone_number || ''
        })
      });
    } catch (vaError) {
      console.error('VA creation error:', vaError);
      // Continue anyway - VA creation failing shouldn't block job acceptance
    }
    
    // FOURTH: Notify customer
    if (job) {
      await sendNotification(job.customer_id, {
        type: 'job_update',
        title: '🎉 Provider Accepted Your Request!',
        body: `A provider has accepted "${job.title}". Tap to open the negotiation chat and agree on a price.`,
        icon: 'handshake', iconBg: 'bg-[#10B981]/10', iconColor: 'text-[#10B981]',
        ctaPath: `/customer/request-status/${jobId}?negotiate=true`,
        ctaLabel: 'Start Negotiating'
      });
    }
  };

    const startNegotiation = async (jobId) => {
        await updateJobStatus(jobId, 'negotiating');
    };

    const reopenNegotiation = async (jobId, initiatorRole, otherPartyId, jobTitle, initiatorName) => {
        await updateJobStatus(jobId, 'negotiating', { final_budget: null, agreed_price: null });
        if (otherPartyId && jobTitle) {
            await sendNotification(otherPartyId, {
                type: 'job_update',
                title: 'Negotiation Reopened 🔄',
                body: `${initiatorName || 'The other party'} wants to renegotiate terms for "${jobTitle}". Tap to continue.`,
                icon: 'autorenew', iconBg: 'bg-amber-100', iconColor: 'text-amber-600',
                ctaPath: initiatorRole === 'customer' 
                    ? `/provider/negotiation/${jobId}` 
                    : `/customer/request-status/${jobId}?negotiate=true`,
                ctaLabel: 'Continue Negotiating'
            });
        }
    };

  const finalizeAgreement = async (jobId, finalBudget, providerId = null) => {
    const updates = { 
      status: 'awaiting_payment', 
      final_budget: finalBudget, 
      agreed_price: finalBudget 
    };
    
    if (providerId) {
      updates.worker_id = providerId;
    }

    await updateJobStatus(jobId, 'awaiting_payment', updates);
    
    // Notify customer to proceed with payment
    const { data: job } = await supabase.from('jobs').select('customer_id, worker_id, title').eq('id', jobId).single();
    if (job) {
      await sendNotification(job.customer_id, {
        type: 'payment',
        title: 'Deal Agreed — Pay Now',
        body: `Your deal for "${job.title}" is finalized at ₦${Number(finalBudget).toLocaleString()}. Tap to pay.`,
        icon: 'payments', iconBg: 'bg-blue-50', iconColor: 'text-blue-500',
        ctaPath: `/customer/payment/${jobId}`,
        ctaLabel: 'Pay Now'
      });
    }
  };

  const securePayment = async (jobId) => {
    await updateJobStatus(jobId, 'payment_secured');
    // Notify provider that payment is secured and they can start
    const { data: job } = await supabase.from('jobs').select('customer_id, worker_id, title').eq('id', jobId).single();
    if (job?.worker_id) {
      await sendNotification(job.worker_id, {
        type: 'payment',
        title: 'Payment Secured — Ready to Start',
        body: `The customer has paid for "${job.title}". You can now start the job.`,
        icon: 'account_balance_wallet', iconBg: 'bg-green-50', iconColor: 'text-[#10B981]',
        ctaPath: `/provider/jobs/${jobId}`,
        ctaLabel: 'Start Work'
      });
    }
  };

  const markJobInProgress = async (jobId) => {
    await updateJobStatus(jobId, 'in_progress', { started_at: new Date().toISOString() });
    const { data: job } = await supabase.from('jobs').select('customer_id, title').eq('id', jobId).single();
    if (job) {
      await sendNotification(job.customer_id, {
        type: 'job_update',
        title: 'Job Has Started',
        body: `Your provider has started work on "${job.title}".`,
        icon: 'build_circle', iconBg: 'bg-blue-50', iconColor: 'text-blue-500',
        ctaPath: `/customer/request/${jobId}`
      });
    }
  };

  const completeJob = async (jobId) => {
    await updateJobStatus(jobId, 'completed', { completed_at: new Date().toISOString() });
    // Notify customer to review and release payment
    const { data: job } = await supabase.from('jobs').select('customer_id, worker_id, title').eq('id', jobId).single();
    if (job) {
      await sendNotification(job.customer_id, {
        type: 'job_update',
        title: 'Job Marked Complete',
        body: `Your provider has completed "${job.title}". Review and release payment.`,
        icon: 'task_alt', iconBg: 'bg-[#10B981]/10', iconColor: 'text-[#10B981]',
        ctaPath: `/customer/confirm/${jobId}`,
        ctaLabel: 'Confirm & Release'
      });
    }
  };

  const releasePayment = async (jobId) => {
    try {
      const { data, error } = await supabase.functions.invoke('squad', {
        body: { action: 'release-escrow', jobId }
      });

      if (error) throw error;

      if (!data?.success) {
        // Graceful fallback: escrow entry not found (legacy job without escrow VA)
        // Just update the status field to maintain backward compatibility
        console.warn('[releasePayment] No escrow entry found, falling back to status update only.');
        await updateJobStatus(jobId, 'payment_released');
      }

      // Notify provider their funds are incoming
      const { data: job } = await supabase.from('jobs').select('worker_id, title, agreed_price, final_budget').eq('id', jobId).single();
      if (job?.worker_id) {
        const amount = data?.net_amount || job.agreed_price || job.final_budget;
        await sendNotification(job.worker_id, {
          type: 'payment',
          title: '💰 Payment Released!',
          body: `₦${Number(amount || 0).toLocaleString()} for "${job.title}" has been released to your wallet.`,
          icon: 'account_balance_wallet', iconBg: 'bg-green-50', iconColor: 'text-[#10B981]'
        });
      }
    } catch (err) {
      console.error('[releasePayment] Error:', err);
      // Last-resort fallback to avoid breaking the UI
      await updateJobStatus(jobId, 'payment_released');
      throw err;
    }
  };

  // ── Negotiation / Messaging ──────────────────────────

  const fetchMessages = async (jobId, providerId = null) => {
    try {
      let query = supabase
        .from('negotiations')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });
      
      if (providerId) {
        query = query.eq('provider_id', providerId);
      }
      
      const { data, error } = await query;
      
      // Transform data to match component expectations
      const transformedMessages = data.map(msg => ({
        ...msg,
        type: msg.message_type, // Map message_type → type for UI
        id: msg.id,
        sender_id: msg.sender_id,
        job_id: msg.job_id,
        message: msg.message,
        created_at: msg.created_at,
        metadata: {
          ...(msg.metadata || {}),
          ...(msg.price != null ? {
            price: msg.price,
            proposed_price: msg.price,
            budget: msg.price,
            finalizePrice: msg.message_type === 'finalize_request' ? msg.price : undefined
          } : {})
        }
      }));
      
      setMessages(transformedMessages);
      return transformedMessages;
    } catch (error) {
      console.error('fetchMessages failed:', error);
      return [];
    }
  };
  
  // Subscribe to realtime messages for a job/provider thread
  const subscribeToMessages = (jobId, providerId = null) => {
    if (!jobId) return;
    
    let filter = `job_id=eq.${jobId}`;
    if (providerId) filter += `,provider_id=eq.${providerId}`;

    const channel = supabase
      .channel(`negotiations_${jobId}_${providerId || 'global'}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'negotiations', filter },
        (payload) => {
          const newMsg = {
            ...payload.new,
            type: payload.new.message_type || 'text',
            metadata: {
              ...(payload.new.metadata || {}),
              ...(payload.new.price != null ? {
                price: payload.new.price,
                proposed_price: payload.new.price,
                budget: payload.new.price,
                finalizePrice: payload.new.message_type === 'finalize_request' ? payload.new.price : undefined
              } : {})
            }
          };
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to messages for job ${jobId}`);
        }
      });
    
    return channel;
  };

  const sendMessage = async (jobId, content, type = 'text', metadata = {}, providerId = null) => {
    if (!currentUser) return;
    try {
      // Resolve provider_id: 
      // 1. Explicitly passed providerId
      // 2. Current user if they are a provider
      // 3. The job's worker_id (for private requests)
      let targetProviderId = providerId;
      
      if (!targetProviderId) {
        if (currentUser.role === 'provider') {
          targetProviderId = currentUser.id;
        } else {
          // If customer is sending and didn't pass providerId, check if job has a worker_id
          const { data: jobInfo } = await supabase
            .from('jobs')
            .select('worker_id')
            .eq('id', jobId)
            .single();
          targetProviderId = jobInfo?.worker_id;
        }
      }

      const isPriceProposal = type === 'price_proposal' || type === 'budget_proposal';
      const isFinalizeRequest = type === 'finalize_request' || metadata?.finalizePrice != null;
      const messageType = isFinalizeRequest ? 'finalize_request' : (isPriceProposal ? 'price_proposal' : (type === 'system' ? 'system' : (type === 'voice' ? 'voice' : 'text')));
      const price = metadata?.finalizePrice ?? metadata?.price ?? metadata?.proposed_price ?? metadata?.budget ?? null;

      const { error } = await supabase
        .from('negotiations')
        .insert([{
          job_id: jobId,
          sender_id: currentUser.id,
          provider_id: targetProviderId,
          message: content,
          message_type: messageType,
          metadata: metadata,
          price: price
        }]);
      
      if (error) throw error;
      
      // Notify the other party
      const { data: job } = await supabase.from('jobs').select('customer_id, worker_id, title').eq('id', jobId).single();
      if (job) {
          const isCustomer = currentUser.id === job.customer_id;
          // If customer is sending, notify the specific provider in this thread.
          // If provider is sending, notify the customer.
          const receiverId = isCustomer ? targetProviderId : job.customer_id;
          
          if (receiverId) {
              await sendNotification(receiverId, {
                  type: 'message',
                  title: `Message: ${job.title}`,
                  body: content.length > 60 ? content.substring(0, 60) + '...' : content,
                  icon: 'forum',
                  iconBg: isCustomer ? 'bg-blue-100' : 'bg-emerald-100',
                  iconColor: isCustomer ? 'text-blue-600' : 'text-emerald-600',
                  ctaPath: isCustomer 
                      ? `/provider/jobs/${jobId}?negotiate=true` 
                      : `/customer/request-status/${jobId}?negotiate=true`,
                  ctaLabel: 'Reply'
              });
          }
      }
    } catch (error) {
      console.error('sendMessage failed:', error);
      toast.error('Failed to send message');
    }
  };

  const deleteMessage = async (messageId) => {
    if (!currentUser) return;
    try {
      // Only delete if sender_id matches currentUser.id and it's not a finalize_request or system message
      const { data: msg } = await supabase.from('negotiations').select('sender_id, message_type').eq('id', messageId).single();
      if (!msg) return;
      if (msg.sender_id !== currentUser.id) {
          toast.error("You can only delete your own messages.");
          return;
      }
      if (msg.message_type === 'finalize_request' || msg.message_type === 'system') {
          toast.error("You cannot delete finalise or system messages.");
          return;
      }
      const { error } = await supabase.from('negotiations').delete().eq('id', messageId);
      if (error) throw error;
      
      // Update local state
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
        console.error("deleteMessage failed:", error);
        toast.error("Failed to delete message");
    }
  };

  // ── Financial & Identity Operations ─────────────────────

  const processPayment = async (jobId, amount) => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase.functions.invoke('squad', {
        body: { action: 'initialize-payment', jobId, amount, customerEmail: currentUser.email, customerId: currentUser.id }
      });
      if (error) throw error;
      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl; // Redirect to Squad checkout
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
      console.log('Bank Lookup Result:', data);
      if (error || !data.success) throw new Error(data?.message || 'Verification failed');
      return data.data; // { account_name, account_number }
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
      console.log('KYC Result:', data);
      if (error) {
          console.error('Edge Function Error:', error);
          throw error;
      }
      
      if (data?.entity) {
        toast.success('Identity verified successfully!');
      }
      return data;
    } catch (err) {
      console.error('KYC failed:', err);
      toast.error('Identity verification failed.');
      throw err;
    }
  };

  const releaseEarnings = async (jobId) => {
    if (!currentUser) return;
    try {
      const { error } = await supabase.functions.invoke('squad', {
        body: { action: 'initiate-payout', jobId, providerId: currentUser.id, amount: 0 /* amount will be derived securely on backend */ }
      });
      if (error) throw error;
      toast.success('Payout initiated!');
    } catch (err) {
      console.error('Payout failed:', err);
      toast.error('Failed to initiate payout.');
    }
  };

  // ── Providers ───────────────────────────────────────────

  const getProviders = useCallback(async (category = null) => {
    try {
      let selectStr = '*, provider_profiles(*)';
      if (category && category !== 'All') {
        selectStr = '*, provider_profiles!inner(*)';
      }
      let query = supabase
        .from('profiles')
        .select(selectStr)
        .eq('role', 'provider')
        .eq('is_active', true);

      if (category && category !== 'All') {
        const capitalized = category.charAt(0).toUpperCase() + category.slice(1);
        const lower = category.toLowerCase();
        query = query.or(`trade_category.cs.{"${capitalized}"},trade_category.cs.{"${lower}"}`, { foreignTable: 'provider_profiles' });
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(p => {
        const profile = Array.isArray(p.provider_profiles)
          ? (p.provider_profiles[0] || {})
          : (p.provider_profiles || {});
        return {
          ...p,
          ...profile,
          uid: p.id,
          displayName: p.full_name,
          photoURL: p.avatar_url,
          category: formatProviderCategory(profile.trade_category, profile.category),
          trade_category: profile.trade_category || [],
          rating: profile.average_rating ?? null,
          isVerified: profile.verification_status === 'verified'
        };
      });
    } catch (error) {
      console.error('Get providers error:', error);
      return [];
    }
  }, []);

  // Fetch a single provider profile with details
  const getProviderProfile = useCallback(async (providerId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, provider_profiles(*), reviews:reviews!provider_id(*, reviewer:profiles!reviewer_id(full_name, avatar_url))')
        .eq('id', providerId)
        .single();

      if (error) throw error;
      if (!data) return null;

      const profile = Array.isArray(data.provider_profiles)
        ? (data.provider_profiles[0] || {})
        : (data.provider_profiles || {});
      return {
        ...data,
        ...profile,
        uid: data.id,
        displayName: data.full_name,
        photoURL: data.avatar_url,
        category: formatProviderCategory(profile.trade_category, profile.category),
        trade_category: profile.trade_category || [],
        rating: profile.average_rating ?? null,
        isVerified: profile.verification_status === 'verified'
      };
    } catch (error) {
      console.error('Get provider profile error:', error);
      return null;
    }
  }, []);

  // Fetch providers who accepted a specific job (for public requests)
  const getInterestedProviders = useCallback(async (jobId) => {
    try {
      // Fetch job applications with status 'accepted' or 'negotiating' for this job
      const { data: applications, error: appError } = await supabase
        .from('job_applications')
        .select('provider_id, proposed_price')
        .eq('job_id', jobId)
        .in('status', ['accepted', 'negotiating']);

      if (appError) throw appError;
      if (!applications || applications.length === 0) return [];

      // Get provider IDs and proposed prices
      const providerMap = new Map();
      applications.forEach(app => {
        providerMap.set(app.provider_id, app.proposed_price);
      });

      // Fetch provider profiles
      const { data: providers, error: provError } = await supabase
        .from('profiles')
        .select('*, provider_profiles(*)')
        .in('id', Array.from(providerMap.keys()));

      if (provError) throw provError;

      return (providers || []).map(p => {
        const profile = Array.isArray(p.provider_profiles)
          ? (p.provider_profiles[0] || {})
          : (p.provider_profiles || {});
        return {
          ...p,
          ...profile,
          uid: p.id,
          displayName: p.full_name,
          photoURL: p.avatar_url,
          category: formatProviderCategory(profile.trade_category, profile.category),
          trade_category: profile.trade_category || [],
          rating: profile.average_rating ?? null,
          proposed_price: providerMap.get(p.id),
          isVerified: profile.verification_status === 'verified'
        };
      });
    } catch (error) {
      console.error('Get interested providers error:', error);
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
      
      // Notify the provider anonymously
      sendNotification(providerId, {
        type: 'system',
        title: 'New Profile Save!',
        body: 'A customer has saved your profile to their favorites.',
        icon: 'favorite',
        iconBg: 'bg-red-50',
        iconColor: 'text-red-500'
      }).catch(console.error);
    }

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

    try {
      const { error } = await supabase.from('reviews').insert([{
        job_id: jobId, reviewer_id: currentUser.id, provider_id: providerId,
        rating, comment, tags
      }]);
      if (error) throw error;

      // Recalculate average rating from all reviews for this provider
      const { data: allReviews } = await supabase.from('reviews').select('rating').eq('provider_id', providerId);
      if (allReviews && allReviews.length > 0) {
        const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        await supabase.from('provider_profiles').update({ average_rating: parseFloat(avg.toFixed(1)) }).eq('id', providerId);
      }

      toast.success('Review submitted!');

      // Notify the provider
      sendNotification(providerId, {
        type: 'review',
        title: `You received a ${rating}-star review!`,
        body: comment ? (comment.length > 50 ? comment.substring(0, 50) + '...' : comment) : 'A customer just reviewed your work.',
        icon: 'star',
        iconBg: 'bg-amber-50',
        iconColor: 'text-amber-500',
        ctaPath: '/provider/profile',
        ctaLabel: 'View Profile'
      }).catch(console.error);
    } catch (error) {
      console.error('Submit review error:', error);
      toast.error('Failed to submit review');
      throw error;
    }
  };

  // ── Notifications ───────────────────────────────────────

  const markNotificationRead = async (notifId) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
  };

  const markAllNotificationsRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', currentUser.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  // ── Service Posts ───────────────────────────────────────

  const createServicePost = async (postData) => {
    if (!currentUser) return;

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
        provider_id: currentUser.id, 
        caption: postData.caption,
        images: imageUrls.length > 0 ? imageUrls : (postData.images || []), 
        tags: postData.tags || [], 
        category: postData.category,
        location: postData.location
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

  const updateServicePost = async (postId, postData) => {
    if (!currentUser) return;
    try {
      const { error } = await supabase
        .from('service_posts')
        .update({
          caption: postData.caption,
          images: postData.images,
          tags: postData.tags,
          category: postData.category,
          location: postData.location
        })
        .eq('id', postId)
        .eq('provider_id', currentUser.id);

      if (error) throw error;
      toast.success('Post updated!');
    } catch (error) {
      console.error('Update post error:', error);
      toast.error('Failed to update post');
      throw error;
    }
  };

  const deleteServicePost = async (postId) => {
    if (!currentUser) return;
    try {
      const { error } = await supabase
        .from('service_posts')
        .delete()
        .eq('id', postId)
        .eq('provider_id', currentUser.id);

      if (error) throw error;
      toast.success('Post deleted!');
    } catch (error) {
      console.error('Delete post error:', error);
      toast.error('Failed to delete post');
      throw error;
    }
  };

  const getServicePosts = async (providerId) => {
    const { data } = await supabase
      .from('service_posts')
      .select('*, profiles(full_name, avatar_url, location_name)')
      .eq('provider_id', providerId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    return data || [];
  };

  const getAllServicePosts = async (category = null) => {
    let query = supabase
      .from('service_posts')
      .select('*, profiles(full_name, avatar_url, location_name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    const { data } = await query;
    return data || [];
  };

  // ── Support Tickets ─────────────────────────────────────

  const createSupportTicket = async (subject, message, category = 'general') => {
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

  // ── Matching Service ────────────────────────────────────

  const getJobMatches = async (jobId) => {
    try {
      const { data, error } = await supabase
        .from('job_matches')
        .select(`
          *,
          provider:profiles!job_matches_provider_id_fkey(full_name, avatar_url)
        `)
        .eq('job_id', jobId)
        .order('match_score', { ascending: false });

      if (error) throw error;
      
      if (!data || data.length === 0) return [];

      const providerIds = data.map(m => m.provider_id);
      
      const { data: providerProfiles } = await supabase
        .from('provider_profiles')
        .select('id, average_rating, completed_jobs_count, trade_category')
        .in('id', providerIds);

      const profileMap = (providerProfiles || []).reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {});

      return data.map(m => ({
        ...m,
        provider_profile: profileMap[m.provider_id] || {}
      }));
    } catch (error) {
      console.error('Failed to get job matches:', error);
      return [];
    }
  };

  const inviteMatchedProvider = async (jobId, providerId, jobTitle) => {
    try {
      // 1. Insert an application record with status 'invited'
      const { error: appError } = await supabase.from('job_applications').upsert({
        job_id: jobId,
        provider_id: providerId,
        status: 'invited',
        updated_at: new Date().toISOString()
      }, { onConflict: 'job_id,provider_id' });
      
      if (appError) throw appError;

      // 2. Notify the provider
      await sendNotification(providerId, {
        type: 'job_update',
        title: 'You were invited to a Job!',
        body: `${currentUser.full_name || 'A customer'} invited you to: ${jobTitle}`,
        icon: 'person_add',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        ctaPath: `/provider/requests/${jobId}`
      });

      toast.success('Provider invited successfully!');
      return true;
    } catch (error) {
      console.error('Failed to invite provider:', error);
      toast.error('Failed to invite provider');
      return false;
    }
  };

  // ── Verifications (KYC) ─────────────────────────────────

  const submitVerification = async (verificationData) => {
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

    const { error } = await supabase.from('verifications')
      .update({ status, admin_notes: notes, reviewed_by: currentUser.id, reviewed_at: new Date().toISOString() })
      .eq('id', verificationId);
    if (error) { toast.error('Failed to update verification'); return; }

    setVerifications(prev => prev.map(v => v.id === verificationId ? { ...v, status } : v));
    toast.success(`Verification ${status}`);
  };

  const getAvailableCategories = useCallback(async () => {
    try {
      const providers = await getProviders('All');
      const available = new Set();
      providers.forEach(p => {
        if (p.trade_category && Array.isArray(p.trade_category) && p.trade_category.length > 0) {
          p.trade_category.forEach(cat => available.add(cat.toLowerCase()));
        } else if (p.category && p.category !== 'None') {
          available.add(p.category.toLowerCase());
        }
      });
      return Array.from(available);
    } catch (err) {
      console.error('Error fetching available categories:', err);
      return [];
    }
  }, [getProviders]);

  const updateUserStatus = async (userId, isActive) => {
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
    createRequest, updateJobStatus, acceptJob, startNegotiation, reopenNegotiation,
    finalizeAgreement, securePayment, markJobInProgress, completeJob,
    releasePayment, getProviders, getProviderProfile, getInterestedProviders, savedProviderIds, toggleSavedProvider,
    submitReview, markNotificationRead, markAllNotificationsRead,
    createServicePost, updateServicePost, deleteServicePost, getServicePosts, getAllServicePosts, createSupportTicket,
    submitVerification, updateVerificationStatus, updateUserStatus, getAvailableCategories,
    // Phase 2 Matching Service
    getJobMatches, inviteMatchedProvider,
    // Messaging
    messages, fetchMessages, sendMessage, deleteMessage, subscribeToMessages,
    // Notifications (exposed for components to send directly)
    sendNotification,
    // Production Operations:
    processPayment, submitKYC, verifyBankAccount, releaseEarnings,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}
