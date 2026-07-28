import api from './api'

export const teacherService = {
  list: (params) => api.get('/teachers', { params }),
  getById: (id) => api.get(`/teachers/${id}`),
  create: (payload) => api.post('/teachers', payload),
  update: (id, payload) => api.put(`/teachers/${id}`, payload),
  remove: (id) => api.delete(`/teachers/${id}`),
}