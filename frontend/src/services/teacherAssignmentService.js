import api from './api'

// Talks to /api/teacherAssignments — the backend already models the
// Teacher -> Class -> Subject relationship properly via TeacherAssignment.
export const teacherAssignmentService = {
  listByTeacher: (teacherId) => api.get('/teacherAssignments', { params: { teacherId } }),
  listByClass: (classId) => api.get(`/teacherAssignments/byClass/${classId}`),
  listByClassAndSubject: (classId, subjectId) =>
    api.get('/teacherAssignments/byClassSubject', { params: { classId, subjectId } }),
  getById: (id) => api.get(`/teacherAssignments/${id}`),
  create: (payload) => api.post('/teacherAssignments', payload),
  update: (id, payload) => api.put(`/teacherAssignments/${id}`, payload),
  remove: (id) => api.delete(`/teacherAssignments/${id}`),
}