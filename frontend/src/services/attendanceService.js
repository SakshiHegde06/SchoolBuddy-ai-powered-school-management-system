import api from './api'

export const attendanceService = {
  mark: (payload) => api.post('/attendance/mark', payload),
  getByClassAndDate: (classId, date, subjectId) =>
    api.get(`/attendance/class/${classId}`, { params: { date, subjectId } }),
  getByClass: (classId, params) =>
    api.get(`/attendance/class/${classId}`, { params }),
  getByStudent: (studentId) => api.get(`/attendance/student/${studentId}`),
}