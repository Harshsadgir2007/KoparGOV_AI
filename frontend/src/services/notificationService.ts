/**
 * Civic Notification Service.
 * Manages in-app and browser notifications for civic complaint milestones.
 */

export interface CivicNotification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  issue_id?: string;
  timestamp: string;
  read: boolean;
}

const NOTIFICATIONS_STORAGE_KEY = 'kopargov_notifications_v1';

export const notificationService = {
  getNotifications(): CivicNotification[] {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'NOTIF-1',
        title: 'Complaint Registered',
        message: 'Your report for Garbage Accumulation (ISS-1024) has been prioritized by CIE.',
        type: 'INFO',
        issue_id: 'ISS-1024',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: false,
      },
    ];
  },

  addNotification(notif: Omit<CivicNotification, 'id' | 'timestamp' | 'read'>): CivicNotification {
    const list = this.getNotifications();
    const newNotif: CivicNotification = {
      ...notif,
      id: `NOTIF-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    list.unshift(newNotif);
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new Event('kopargov_notification_updated'));
    } catch (e) {
      console.error(e);
    }

    // Try browser push notification if permitted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(newNotif.title, {
          body: newNotif.message,
          icon: '/favicon.ico',
        });
      } catch (err) {
        // ignore notification constructor failure
      }
    }

    return newNotif;
  },

  requestPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return Promise.resolve('unsupported');
    }
    return Notification.requestPermission();
  },

  markAsRead(id: string) {
    const list = this.getNotifications();
    const item = list.find(n => n.id === id);
    if (item) {
      item.read = true;
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new Event('kopargov_notification_updated'));
    }
  },

  markAllAsRead() {
    const list = this.getNotifications();
    list.forEach(n => (n.read = true));
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('kopargov_notification_updated'));
  },
};
