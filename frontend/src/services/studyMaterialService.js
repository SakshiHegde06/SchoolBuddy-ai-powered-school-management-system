import api from './api'

export const studyMaterialService = {
  list: (params) => api.get('/materials', { params }),
  findByClass: (classId) => api.get(`/materials/class/${classId}`),
  getById: (id) => api.get(`/materials/${id}`),

  create: (formData) =>
    api.post('/materials', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  remove: (id) => api.delete(`/materials/${id}`),

  download: (id, disposition = 'inline') =>
    api.get(`/materials/${id}/download`, {
      responseType: 'blob',
      params: { disposition },
    }),

  // AI Tutor endpoints
  getAiTutor: (materialId, payload) =>
    api.post(`/materials/${materialId}/ai-tutor`, payload),

  getAiTutorGeneral: (payload) =>
    api.post('/materials/ai-tutor', payload),

  /**
   * Triggers a true browser file download with correct filename
   */
  downloadFile: async (id, fileName = 'study_material.pdf') => {
    try {
      const res = await api.get(`/materials/${id}/download`, {
        responseType: 'blob',
        params: { disposition: 'attachment' },
      })

      // If server returned an error as blob (e.g. application/json)
      if (res.data.type === 'application/json') {
        const text = await res.data.text()
        const json = JSON.parse(text)
        throw new Error(json.message || 'Download failed')
      }

      const blob = new Blob([res.data], {
        type: res.headers['content-type'] || 'application/pdf',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => window.URL.revokeObjectURL(url), 10000)
      return true
    } catch (err) {
      console.error('Download error:', err)
      throw err
    }
  },

  /**
   * Retrieves blob object URL for in-app preview iframe/reader
   */
  getPdfBlobUrl: async (id) => {
    const res = await api.get(`/materials/${id}/download`, {
      responseType: 'blob',
      params: { disposition: 'inline' },
    })

    if (res.data.type === 'application/json') {
      const text = await res.data.text()
      const json = JSON.parse(text)
      throw new Error(json.message || 'Failed to open preview')
    }

    const blob = new Blob([res.data], { type: 'application/pdf' })
    return window.URL.createObjectURL(blob)
  },
}