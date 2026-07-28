import api from './api'

// Mock credentials for testing (until backend is ready)
const mockUsers = {
  'admin@school.com': { email: 'admin@school.com', password: 'admin123', role: 'ADMIN', name: 'Admin User' },
  'teacher@school.com': { email: 'teacher@school.com', password: 'teacher123', role: 'TEACHER', name: 'Rajesh Kumar' },
  'student@school.com': { email: 'student@school.com', password: 'student123', role: 'STUDENT', name: 'Aarav Mehta' },
  'parent@school.com': { email: 'parent@school.com', password: 'parent123', role: 'PARENT', name: 'Ramesh Mehta' },
}

export const authService = {
  login: async (email, password) => {
    // Mock authentication - return test user if credentials match
    const mockUser = mockUsers[email]
    if (mockUser && mockUser.password === password) {
      const mockToken = 'mock-jwt-token-' + Date.now()
      return {
        data: {
          token: mockToken,
          user: { email: mockUser.email, role: mockUser.role, name: mockUser.name }
        }
      }
    }
    
    // Try real backend (when ready)
    try {
      return await api.post('/auth/login', { email, password })
    } catch (err) {
      const error = new Error('Invalid credentials. Try: admin@school.com / admin123')
      error.response = { data: { message: 'Invalid credentials. Try: admin@school.com / admin123' } }
      throw error
    }
  },
  me: () => api.get('/auth/me'),
}