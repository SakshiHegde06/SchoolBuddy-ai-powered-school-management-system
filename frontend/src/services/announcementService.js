import api from './api'

export const announcementService = {
  list: (params) => api.get('/announcements', { params }),
  getById: (id) => api.get(`/announcements/${id}`),
  create: (payload) => api.post('/announcements', payload),
  update: (id, payload) => api.put(`/announcements/${id}`, payload),
  remove: (id) => api.delete(`/announcements/${id}`),
}