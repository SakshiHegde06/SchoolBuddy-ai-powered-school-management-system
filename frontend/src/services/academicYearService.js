import api from './api'

export const academicYearService = {
  list: () => api.get('/academic-years'),
  getById: (id) => api.get(`/academic-years/${id}`),
  create: (payload) => api.post('/academic-years', payload),
  update: (id, payload) => api.put(`/academic-years/${id}`, payload),
  setCurrent: (id) => api.put(`/academic-years/${id}/set-current`),
  remove: (id) => api.delete(`/academic-years/${id}`),
}