import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { roleNavConfig } from '../../utils/roleConfig'
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [waitingOnColdStart, setWaitingOnColdStart] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    setWaitingOnColdStart(false)

    // Detect Render cold starts (>3.5s)
    const coldTimer = setTimeout(() => {
      setWaitingOnColdStart(true)
    }, 3500)

    try {
      const user = await login(email, password)
      clearTimeout(coldTimer)
      navigate(roleNavConfig[user.role]?.landing || '/')
    } catch (err) {
      clearTimeout(coldTimer)
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else if (!err.response) {
        setError('Cannot connect to backend server. If Render just deployed or went to sleep, please wait 20-30 seconds and try again!')
      } else {
        setError('Invalid email or password')
      }
    } finally {
      clearTimeout(coldTimer)
      setIsSubmitting(false)
      setWaitingOnColdStart(false)
    }
  }

  function handleAutoFill(roleEmail = 'admin@school.edu') {
    setEmail(roleEmail)
    setPassword('ChangeMe123!')
  }

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-1">
        Login
      </h2>

      <p className="text-center text-xs sm:text-sm text-slate-500 mb-6">
        Enter your credentials to access your dashboard
      </p>

      {/* Role Quick-Fill Buttons */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg mb-5 text-[11px] font-semibold text-slate-600">
        <button
          type="button"
          onClick={() => handleAutoFill('admin@school.edu')}
          className="py-1 text-center rounded-md hover:bg-white hover:text-slate-900 transition hover:shadow-xs"
        >
          Admin
        </button>
        <button
          type="button"
          onClick={() => handleAutoFill('teacher@school.edu')}
          className="py-1 text-center rounded-md hover:bg-white hover:text-slate-900 transition hover:shadow-xs"
        >
          Teacher
        </button>
        <button
          type="button"
          onClick={() => handleAutoFill('student@school.edu')}
          className="py-1 text-center rounded-md hover:bg-white hover:text-slate-900 transition hover:shadow-xs"
        >
          Student
        </button>
        <button
          type="button"
          onClick={() => handleAutoFill('parent@school.edu')}
          className="py-1 text-center rounded-md hover:bg-white hover:text-slate-900 transition hover:shadow-xs"
        >
          Parent
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Email Field */}
        <div>
          <label className="block mb-1 text-xs font-semibold text-slate-700">
            College Gmail
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Mail size={16} />
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@school.edu"
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label className="block mb-1 text-xs font-semibold text-slate-700">
            Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock size={16} />
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="ChangeMe123!"
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Demo Credentials Helper Box */}
        <div className="rounded-lg bg-blue-50/70 border border-blue-200 p-2.5 text-xs text-blue-900 flex items-center justify-between">
          <div>
            <span className="font-semibold text-blue-800">Demo Account:</span>
            <div className="font-mono text-[11px] text-slate-600 mt-0.5">
              admin@school.edu &bull; ChangeMe123!
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleAutoFill('admin@school.edu')}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition cursor-pointer text-[11px] shadow-xs"
          >
            Auto-fill
          </button>
        </div>

        {/* Cold-start status indicator */}
        {waitingOnColdStart && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800 flex items-center gap-2 animate-pulse">
            <Loader2 size={15} className="animate-spin text-amber-600 shrink-0" />
            <span>Connecting to backend (free cloud instance takes ~20-30s to wake up on first visit)...</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle size={15} className="text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 text-xs sm:text-sm font-bold tracking-wide transition shadow-sm hover:shadow disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            <span>Login</span>
          )}
        </button>

      </form>

      <div className="mt-6 text-center text-xs text-slate-400">
        &copy; 2026 <span className="font-semibold text-slate-700">SchoolBuddy</span>
      </div>
    </div>
  )
}