import { createContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'
import { TOKEN_STORAGE_KEY } from '../utils/constants'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!token) {
      setIsLoading(false)
      return
    }
    if (token === 'demo_mock_jwt_token') {
      const savedUser = localStorage.getItem('demo_user_info')
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser))
          setIsLoading(false)
          return
        } catch (e) {}
      }
    }

    authService
      .me()
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem(TOKEN_STORAGE_KEY))
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await authService.login(email, password)
    localStorage.setItem(TOKEN_STORAGE_KEY, res.data.token)
    setUser(res.data.user)
    return res.data.user
  }, [])

  const loginAsDemo = useCallback((role = 'ADMIN') => {
    const demoUsers = {
      ADMIN: { id: 'demo-admin-id', name: 'Dr. Sarah Jenkins', email: 'admin@school.edu', role: 'ADMIN' },
      STUDENT: { id: 'demo-student-id', refId: 'demo-student-id', name: 'Alex Rivera', email: 'student@school.edu', role: 'STUDENT', grade: '10', section: 'A', rollNumber: '14' },
      TEACHER: { id: 'demo-teacher-id', refId: 'demo-teacher-id', name: 'Prof. Marcus Vance', email: 'teacher@school.edu', role: 'TEACHER' },
      PARENT: { id: 'demo-parent-id', refId: 'demo-parent-id', name: 'Eleanor Rivera', email: 'parent@school.edu', role: 'PARENT' },
    }
    const u = demoUsers[role] || demoUsers.ADMIN
    localStorage.setItem(TOKEN_STORAGE_KEY, 'demo_mock_jwt_token')
    localStorage.setItem('demo_user_info', JSON.stringify(u))
    setUser(u)
    return u
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem('demo_user_info')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginAsDemo, logout }}>
      {children}
    </AuthContext.Provider>
  )
}