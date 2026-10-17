import api from './api'

export const classService = {
  list: (params) => api.get('/classes', { params }),
  getById: (id) => api.get(`/classes/${id}`),
  create: (payload) => api.post('/classes', payload),
  update: (id, payload) => api.put(`/classes/${id}`, payload),
  remove: (id) => api.delete(`/classes/${id}`),
}