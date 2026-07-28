import api from './api'

export const notificationService = {
  list: (params) => api.get('/notifications', { params }),
  getById: (id) => api.get(`/notifications/${id}`),
  create: (payload) => api.post('/notifications', payload),
  update: (id, payload) => api.put(`/notifications/${id}`, payload),
  remove: (id) => api.delete(`/notifications/${id}`),
}