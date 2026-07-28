import api from './api'

export const markService = {
  create: (payload) => api.post('/marks', payload),
  findByStudent: (studentId) => api.get(`/marks/student/${studentId}`),
  update: (id, payload) => api.put(`/marks/${id}`, payload),
  remove: (id) => api.delete(`/marks/${id}`),
}