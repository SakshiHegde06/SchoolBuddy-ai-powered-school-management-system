import api from './api'

export const subjectService = {
  list: (params) => api.get('/subjects', { params }),
  getById: (id) => api.get(`/subjects/${id}`),
  create: (payload) => api.post('/subjects', payload),
  update: (id, payload) => api.put(`/subjects/${id}`, payload),
  remove: (id) => api.delete(`/subjects/${id}`),
}