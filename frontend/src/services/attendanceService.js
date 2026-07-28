import api from './api'

export const attendanceService = {
  mark: (payload) => api.post('/attendance/mark', payload),
  getByClassAndDate: (classId, date) => api.get(`/attendance/class/${classId}`, { params: { date } }),
  getByStudent: (studentId) => api.get(`/attendance/student/${studentId}`),
}