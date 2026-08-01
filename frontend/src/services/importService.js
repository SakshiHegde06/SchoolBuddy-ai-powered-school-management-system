import api from './api'

export const importService = {
  importParentsAndStudents: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/admin/import/parents-students', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
