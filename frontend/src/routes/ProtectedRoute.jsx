import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Spinner from '../components/common/Spinner'

// Wraps a route tree, requiring auth and (optionally) a specific role.
// Usage: <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>...
export default function ProtectedRoute({ allowedRoles }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <Spinner label="Checking session…" />
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}