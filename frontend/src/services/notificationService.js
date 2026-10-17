import api from './api'

export const notificationService = {
  list: () => api.get('/notifications'),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.put(`/notifications/${id}`),
  markAllRead: () => api.post('/notifications/mark-all-read'),
}
