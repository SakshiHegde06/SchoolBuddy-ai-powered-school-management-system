import api from './api'

export const holidayService = {
  list: () => api.get('/holidays'),
  create: (payload) => api.post('/holidays', payload),
  update: (id, payload) => api.put(`/holidays/${id}`, payload),
  remove: (id) => api.delete(`/holidays/${id}`),
}
