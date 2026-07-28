import api from './api'

export const adminService = {
  getDashboardSummary: () => api.get('/admin/dashboard-summary'),
  listAdmins: () => api.get('/admin'),
  createAdmin: (payload) => api.post('/admin', payload),
  removeAdmin: (id) => api.delete(`/admin/${id}`),
}