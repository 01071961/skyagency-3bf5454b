import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface Notification {
  id: string;
  user_id: string;
  tenant_id?: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'commission' | 'referral' | 'system' | 'promotion';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read_at?: string;
  action_url?: string;
  created_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }
    
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      
      const typedData = (data || []) as Notification[];
      setNotifications(typedData);
      setUnreadCount(typedData.filter(n => !n.read_at).length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar notificações';
      setError(errorMessage);
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Mark as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (updateError) throw updateError;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast.error('Erro ao marcar notificação como lida');
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (updateError) throw updateError;

      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
      toast.success('Todas as notificações marcadas como lidas');
    } catch (err) {
      console.error('Error marking all as read:', err);
      toast.error('Erro ao marcar notificações como lidas');
    }
  }, [user?.id]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (deleteError) throw deleteError;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notification && !notification.read_at) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      toast.error('Erro ao excluir notificação');
    }
  }, [notifications]);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setNotifications([]);
      setUnreadCount(0);
      toast.success('Notificações limpas');
    } catch (err) {
      console.error('Error clearing notifications:', err);
      toast.error('Erro ao limpar notificações');
    }
  }, [user?.id]);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    fetchNotifications();

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev.slice(0, 49)]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast for new notification
          const toastType = newNotification.type === 'error' ? 'error' 
            : newNotification.type === 'success' ? 'success'
            : newNotification.type === 'warning' ? 'warning'
            : 'info';
          
          toast[toastType](newNotification.title, {
            description: newNotification.message,
            action: newNotification.action_url ? {
              label: 'Ver',
              onClick: () => window.location.href = newNotification.action_url!
            } : undefined
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          setNotifications(prev => {
            const deleted = prev.find(n => n.id === deletedId);
            if (deleted && !deleted.read_at) {
              setUnreadCount(c => Math.max(0, c - 1));
            }
            return prev.filter(n => n.id !== deletedId);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refresh: fetchNotifications
  };
};

// Helper to create notification (for use in other parts of the app)
export const createNotification = async (
  userId: string,
  notification: Omit<Notification, 'id' | 'user_id' | 'created_at'>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: (notification.data ? JSON.parse(JSON.stringify(notification.data)) : {}) as Json,
        action_url: notification.action_url
      }]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
};

// Batch create notifications
export const createBatchNotifications = async (
  notifications: Array<{
    userId: string;
    notification: Omit<Notification, 'id' | 'user_id' | 'created_at'>;
  }>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert(
        notifications.map(({ userId, notification }) => ({
          user_id: userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: (notification.data ? JSON.parse(JSON.stringify(notification.data)) : {}) as Json,
          action_url: notification.action_url
        }))
      );

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error creating batch notifications:', error);
    return false;
  }
};
