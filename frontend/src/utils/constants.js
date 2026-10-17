export const ROLES = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  PARENT: 'PARENT',
  STUDENT: 'STUDENT',
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

export const TOKEN_STORAGE_KEY = 'school_sms_token'