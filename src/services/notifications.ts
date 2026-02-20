import { supabase } from "@/integrations/supabase/client";
import { Notification, NotificationType } from "@/types/ats";

export const notificationsService = {
  async getNotifications() {
    const { data, error } = await (supabase
      .from('notifications' as any)
      .select('*')
      .order('created_at', { ascending: false }) as any);

    if (error) throw error;
    return data as Notification[];
  },

  async markAsRead(id: string) {
    const { error } = await (supabase
      .from('notifications' as any)
      .update({ read: true })
      .eq('id', id) as any);

    if (error) throw error;
  },

  async markAllAsRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await (supabase
      .from('notifications' as any)
      .update({ read: true })
      .eq('user_id', user.id) as any);

    if (error) throw error;
  },

  async createNotification(data: {
    user_id: string;
    title: string;
    message: string;
    type: NotificationType;
    metadata?: any;
  }) {
    const { error } = await (supabase
      .from('notifications' as any)
      .insert([data]) as any);

    if (error) throw error;
  },

  subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    return supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();
  },

  async notifyClientUsers(clientId: string, notificationData: {
    title: string;
    message: string;
    type: NotificationType;
    metadata?: any;
  }) {
    // 1. Get all profiles associated with this client
    const { data: profiles, error: profilesError } = await (supabase
      .from('profiles' as any)
      .select('id')
      .eq('cliente_id', clientId) as any);

    if (profilesError) {
      console.error('Error fetching client profiles:', profilesError);
      return;
    }

    if (!profiles || profiles.length === 0) return;

    // 2. Create notifications for each user
    const notifications = profiles.map((profile: any) => ({
      user_id: profile.id,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type,
      metadata: notificationData.metadata
    }));

    const { error } = await (supabase
      .from('notifications' as any)
      .insert(notifications) as any);

    if (error) {
      console.error('Error sending client notifications:', error);
    }
  }
};
