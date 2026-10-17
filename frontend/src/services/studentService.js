import api from './api'

// Thin wrapper around the student REST resource. Keep components free of
// axios calls / URL strings — everything goes through here.
export const studentService = {
  list: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (payload) => api.post('/students', payload),
  update: (id, payload) => api.put(`/students/${id}`, payload),
  remove: (id) => api.delete(`/students/${id}`),
}