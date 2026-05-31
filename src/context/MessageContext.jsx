import { createContext, useContext, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { toast } from 'sonner';

const MessageContext = createContext({
  messages: [],
  fetchMessages: async () => [],
  subscribeToMessages: () => {},
  sendMessage: async () => {},
  deleteMessage: async () => {},
});

export function useMessages() {
  return useContext(MessageContext);
}

export function MessageProvider({ children }) {
  const { currentUser } = useAuth();
  const { sendNotification } = useNotifications();
  const [messages, setMessages] = useState([]);

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
      if (error) throw error;
      
      const transformedMessages = data.map(msg => ({
        ...msg,
        type: msg.message_type,
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
      let targetProviderId = providerId;
      
      if (!targetProviderId) {
        if (currentUser.role === 'provider') {
          targetProviderId = currentUser.id;
        } else {
          const { data: jobInfo } = await supabase.from('jobs').select('worker_id').eq('id', jobId).single();
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
          job_id: jobId, sender_id: currentUser.id, provider_id: targetProviderId,
          message: content, message_type: messageType, metadata: metadata, price: price
        }]);
      
      if (error) throw error;
      
      const { data: job } = await supabase.from('jobs').select('customer_id, worker_id, title').eq('id', jobId).single();
      if (job) {
          const isCustomer = currentUser.id === job.customer_id;
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
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
        console.error("deleteMessage failed:", error);
        toast.error("Failed to delete message");
    }
  };

  return (
    <MessageContext.Provider value={{ messages, fetchMessages, subscribeToMessages, sendMessage, deleteMessage }}>
      {children}
    </MessageContext.Provider>
  );
}
