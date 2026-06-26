import { api } from "@/lib/api";

export const notificationApi = {
  app: () => api.get("/notifications").then((response) => response.data.notifications),
  unreadCount: () => api.get("/notifications/unread-count").then((response) => response.data.count),
  markRead: (id) => api.put(`/notifications/${id}/read`).then((response) => response.data),
  dismiss: (id) => api.delete(`/notifications/${id}`).then((response) => response.data)
};
