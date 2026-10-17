import api from './api'

export const reportService = {
  getTranscript: (studentId) => api.get(`/reports/transcript/${studentId}`),
  verifyTranscript: (code) => api.get(`/reports/verify/${code}`),
}

export default reportService
