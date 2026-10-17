import api from './api'

export const studyMaterialService = {
  findByClass: (classId) => api.get(`/materials/class/${classId}`),
  create: (formData) =>
    api.post('/materials', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  remove: (id) => api.delete(`/materials/${id}`),
  // The download endpoint requires auth, so it can't be a plain <a href>
  // (the browser wouldn't attach the JWT). Fetch as a blob instead and let
  // the caller open/save it.
  download: (id) => api.get(`/materials/${id}/download`, { responseType: 'blob' }),
}