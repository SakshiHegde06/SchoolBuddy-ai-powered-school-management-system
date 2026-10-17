import api from './api'

export const parentService = {
  list: (params) => api.get('/parents', { params }),
  getById: (id) => api.get(`/parents/${id}`),
  getChildren: (id) => api.get(`/parents/${id}/children`),
  create: (payload) => api.post('/parents', payload),
  update: (id, payload) => api.put(`/parents/${id}`, payload),
  remove: (id) => api.delete(`/parents/${id}`),
}