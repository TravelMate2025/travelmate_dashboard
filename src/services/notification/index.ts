// services/notification.ts
import env from "@/config/env";
import instance from "@/hooks/initializers/useAxiosDefaults";

class NotificationService {
  /**
   * Fetch notifications with optional filters
   * @param params e.g. { page: 1, status: "unread", startDate: "2025-08-01", endDate: "2025-08-15" }
   */
  getAllNotification(params?: Record<string, unknown>) {
    return instance.get(env.api.notification, { params });
  }

  /**
   * Fetch notifications directly from a full URL (e.g. pagination links)
   */
  getAllNotificationByUrl(url: string) {
    return instance.get(url);
  }

  getNotificationById(id: string | number) {
    return instance.get(`${env.api.notification}${id}/`);
  }

  markNotificationAsRead(ids: string | string[]) {
    if (Array.isArray(ids)) {
      return instance.post(env.api.notificationBulkMarkRead, {
        notification_ids: ids,
      });
    }

    return instance.post(`${env.api.notification}${ids}/mark_read/`, {});
  }

  deleteNotification = (ids: string | string[]) => {
    if (Array.isArray(ids)) {
      return instance.post(env.api.notificationBulkDelete, {
        notification_ids: ids,
      });
    }

    return instance.delete(`${env.api.notification}${ids}/`);
  };

  bulkMarkRead(ids: string[]) {
    return instance.post(env.api.notificationBulkMarkRead, {
      notification_ids: ids,
    });
  }

  bulkDelete(ids: string[]) {
    return instance.post(env.api.notificationBulkDelete, {
      notification_ids: ids,
    });
  }

  markAllRead() {
    return instance.post(env.api.notificationMarkAllRead, {});
  }

}

export default new NotificationService();
