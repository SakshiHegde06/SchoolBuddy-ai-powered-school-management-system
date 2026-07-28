import api from './api'

// Thin wrapper around the AI performance analysis endpoint. Backed by the
// Spring backend, which in turn calls the Python AI service for the actual
// linear-regression work.
export const performanceService = {
  getAnalysis: (studentId) => api.get(`/students/${studentId}/performance-analysis`),
}