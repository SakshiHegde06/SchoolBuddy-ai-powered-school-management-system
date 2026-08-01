import api from './api'

// Talks to /api/performance on the Spring backend, which in turn calls the
// FastAPI AI service. The frontend never calls the AI service directly.
export const performanceService = {
  getForStudent: (studentId) => api.get(`/performance/student/${studentId}`),
  // Alias — AiPerformanceAnalysis.jsx calls this name.
  getAnalysis: (studentId) => api.get(`/performance/student/${studentId}`),
}