import api from './api'

export const timetableService = {
  save: (payload) => api.post('/timetable/save', payload),
  generate: (payload) => api.post('/timetable/save', payload),
  aiGenerate: (payload) => api.post('/timetable/ai-generate', payload),
  getByClass: (classId) => api.get(`/timetable/class/${classId}`),
}
