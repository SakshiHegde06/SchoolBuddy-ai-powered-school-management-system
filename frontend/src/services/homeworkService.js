import api from './api'

export const homeworkService = {
  create: (payload) => api.post('/homework', payload),
  findByClass: (classId) => api.get(`/homework/class/${classId}`),
  update: (id, payload) => api.put(`/homework/${id}`, payload),
  remove: (id) => api.delete(`/homework/${id}`),
}