import api from './api'

export const remarkService = {

  create: (payload) => api.post('/remarks', payload),

  getByStudent: (studentId) =>
    api.get(`/remarks/student/${studentId}`),

  remove: (id) =>
    api.delete(`/remarks/${id}`)
}