import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const NotificationContext = createContext({
  notifications: [],
  sendNotification: async () => {},
  markNotificationRead: async () => {},
  markAllNotificationsRead: async () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);

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

    return () => { supabase.removeChannel(channel); };
  }, [currentUser]);

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

  const markNotificationRead = async (notifId) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
  };

  const markAllNotificationsRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', currentUser.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return (
    <NotificationContext.Provider value={{ notifications, sendNotification, markNotificationRead, markAllNotificationsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}
