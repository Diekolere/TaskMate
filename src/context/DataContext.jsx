import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, uploadFile, generateFilePath } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

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

    return () => supabase.removeChannel(channel);
  }, [currentUser]);

  // ── Provider Jobs (Realtime) ────────────────────────────
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'provider') return;

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
        event: 'INSERT', schema: 'public', table: 'job_messages'
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
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

  // Central helper to insert a notification into Supabase (triggers Realtime to all listening UIs)
  const sendNotification = async (userId, { type = 'system', title, body, icon = 'info', iconBg = 'bg-gray-100', iconColor = 'text-gray-400', ctaPath = null } = {}) => {
    if (!userId || !title) return;
    try {
      await supabase.from('notifications').insert([{
        user_id: userId, type, title, body, icon, icon_bg: iconBg, icon_color: iconColor, cta_path: ctaPath
      }]);
    } catch (e) { console.error('sendNotification failed:', e); }
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
          customer_name: currentUser.full_name || currentUser.displayName,
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
      toast.success('Request posted!');
      
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
    await updateJobStatus(jobId, 'provider_accepted', { worker_id: currentUser.id });
    
    // Find the job to get customer ID for notification
    const { data: job } = await supabase.from('jobs').select('customer_id, title').eq('id', jobId).single();
    if (job) {
      await sendNotification(job.customer_id, {
        type: 'job_update',
        title: 'Provider Accepted Your Request',
        body: `A provider has accepted "${job.title}". Proceed to negotiate terms.`,
        icon: 'handshake', iconBg: 'bg-[#10B981]/10', iconColor: 'text-[#10B981]',
        ctaPath: `/customer/request/${jobId}`
      });
    }
    toast.success('Job accepted!');
  };

  const startNegotiation = async (jobId) => {
    await updateJobStatus(jobId, 'negotiating');
  };

  const finalizeAgreement = async (jobId, finalBudget) => {
    await updateJobStatus(jobId, 'awaiting_payment', { final_budget: finalBudget, agreed_price: finalBudget });
    // Notify customer to proceed with payment
    const { data: job } = await supabase.from('jobs').select('customer_id, worker_id, title').eq('id', jobId).single();
    if (job) {
      await sendNotification(job.customer_id, {
        type: 'payment',
        title: 'Deal Agreed — Pay Now',
        body: `Your deal for "${job.title}" is finalized at ₦${Number(finalBudget).toLocaleString()}. Tap to pay.`,
        icon: 'payments', iconBg: 'bg-blue-50', iconColor: 'text-blue-500',
        ctaPath: `/customer/payment/${jobId}`
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
        ctaPath: `/provider/jobs/${jobId}`
      });
    }
    toast.success('Payment secured in escrow');
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
        ctaPath: `/customer/confirm/${jobId}`
      });
    }
  };

  const releasePayment = async (jobId) => {
    await updateJobStatus(jobId, 'payment_released');
    // Notify provider their funds are on the way
    const { data: job } = await supabase.from('jobs').select('worker_id, title, agreed_price, final_budget').eq('id', jobId).single();
    if (job?.worker_id) {
      const amount = job.agreed_price || job.final_budget;
      await sendNotification(job.worker_id, {
        type: 'payment',
        title: 'Payment Released!',
        body: `₦${Number(amount || 0).toLocaleString()} for "${job.title}" has been released to your account.`,
        icon: 'account_balance_wallet', iconBg: 'bg-green-50', iconColor: 'text-[#10B981]'
      });
    }
    toast.success('Payment released to provider');
  };

  // ── Negotiation / Messaging ──────────────────────────

  const fetchMessages = async (jobId) => {
    const { data, error } = await supabase
      .from('job_messages')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });
    
    if (!error) setMessages(data);
    return data || [];
  };

  const sendMessage = async (jobId, content, type = 'text', metadata = {}) => {
    if (!currentUser) return;
    const { error } = await supabase
      .from('job_messages')
      .insert([{
        job_id: jobId,
        sender_id: currentUser.id,
        message: content,
        type,
        metadata
      }]);
    
    if (error) {
      console.error('sendMessage failed:', error);
      toast.error('Failed to send message');
    }
  };

  // ── Squad / Edge Function Stubs (Phase 1) ───────────────

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

  const submitKYC = async (kycData) => {
    if (!currentUser) return;
    try {
      // In Phase 1 we use the submitVerification method. We can trigger the squad function to verify BVN immediately.
      const { error } = await supabase.functions.invoke('squad', {
        body: { action: 'verify-kyc', providerId: currentUser.id, bvn: kycData.bvn }
      });
      if (error) throw error;
      toast.success('KYC Verified successfully!');
      // Update local state if needed
      if (currentUser.role === 'provider') {
         // The user's account is now verified
      }
    } catch (err) {
      console.error('KYC Verification failed:', err);
      toast.error('Failed to verify KYC.');
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
      toast.success('Review submitted!');
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
    createRequest, updateJobStatus, acceptJob, startNegotiation,
    finalizeAgreement, securePayment, markJobInProgress, completeJob,
    releasePayment, getProviders, savedProviderIds, toggleSavedProvider,
    submitReview, markNotificationRead, markAllNotificationsRead,
    createServicePost, getServicePosts, getAllServicePosts, createSupportTicket,
    submitVerification, updateVerificationStatus, updateUserStatus,
    // Messaging
    messages, fetchMessages, sendMessage,
    // New Edge Function Stubs:
    processPayment, submitKYC, releaseEarnings
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}
