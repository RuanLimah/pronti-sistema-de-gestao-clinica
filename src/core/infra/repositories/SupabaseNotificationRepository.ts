import { Notification, NotificationType } from '@/core/domain/entities/Notification';
import { CreateNotificationDTO } from '@/core/dtos/CreateNotificationDTO';
import { NotificationRepository } from '@/core/domain/repositories/NotificationRepository';
import { supabase } from '@/lib/supabase';

export class SupabaseNotificationRepository implements NotificationRepository {
  async create(clientId: string, data: CreateNotificationDTO): Promise<Notification> {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        client_id: clientId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
        read: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating notification: ${error.message}`);
    }

    return this.mapToEntity(notification);
  }

  async listByUser(clientId: string): Promise<Notification[]> {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error listing notifications: ${error.message}`);
    }

    return notifications.map(this.mapToEntity);
  }

  async listUnread(clientId: string): Promise<Notification[]> {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('client_id', clientId)
      .eq('read', false)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error listing unread notifications: ${error.message}`);
    }

    return notifications.map(this.mapToEntity);
  }

  async markAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (error) {
      throw new Error(`Error marking notification as read: ${error.message}`);
    }
  }

  async markAllAsRead(clientId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('client_id', clientId)
      .eq('read', false);

    if (error) {
      throw new Error(`Error marking all notifications as read: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting notification: ${error.message}`);
    }
  }

  private mapToEntity(data: any): Notification {
    return {
      id: data.id,
      client_id: data.client_id,
      type: data.type as NotificationType,
      title: data.title,
      message: data.message,
      read: data.read,
      link: data.link,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    };
  }
}
