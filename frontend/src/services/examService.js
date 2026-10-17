import api from './api'

export const examService = {
  listByClass: (classId) => api.get('/exams', { params: { classId } }),
  getById: (id) => api.get(`/exams/${id}`),
  create: (payload) => api.post('/exams', payload),
  update: (id, payload) => api.put(`/exams/${id}`, payload),
  remove: (id) => api.delete(`/exams/${id}`),
}