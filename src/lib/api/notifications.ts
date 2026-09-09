import { apiClient } from '../api-client';

export interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  type: 'rfq' | 'approval' | 'order' | 'info';
  actionUrl?: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  items: NotificationItem[];
  unreadCount: number;
}

export const notificationsApi = {
  async list(): Promise<NotificationsResponse> {
    try {
      return await apiClient.get<NotificationsResponse>('/api/notifications');
    } catch {
      return { items: [], unreadCount: 0 };
    }
  },

  async markAsRead(id: string): Promise<boolean> {
    try {
      await apiClient.patch(`/api/notifications/${id}/read`);
      return true;
    } catch {
      return false;
    }
  },

  async markAllAsRead(): Promise<boolean> {
    try {
      await apiClient.post('/api/notifications/read-all');
      return true;
    } catch {
      return false;
    }
  },
};
