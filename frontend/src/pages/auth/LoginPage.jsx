import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { roleNavConfig } from '../../utils/roleConfig'
import Button from '../../components/common/Button'

export default function LoginPage() {
  const { login, loginAsDemo } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleQuickDemo(role) {
    const user = loginAsDemo(role)
    navigate(roleNavConfig[user.role]?.landing || '/')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const user = await login(email, password)
      navigate(roleNavConfig[user.role]?.landing || '/')
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else if (!err.response) {
        setError('Cannot connect to backend server. If Render just deployed or went to sleep, please wait 20-30 seconds and try again!')
      } else {
        setError('Invalid email or password')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-blue-700 text-center mb-2">
        Login
      </h2>

      <p className="text-center text-gray-500 mb-8">
        Enter your credentials to access your dashboard
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">

        <div>
          <label className="block mb-2 text-sm font-semibold text-gray-700">
            College Gmail
          </label>

          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@school.edu"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-semibold text-gray-700">
            Password
          </label>

          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="ChangeMe123!"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* Demo Credentials Helper Box */}
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 flex items-center justify-between">
          <div>
            <span className="font-semibold text-blue-700">Demo Account:</span>
            <div className="font-mono text-gray-600 mt-0.5">admin@school.edu &bull; ChangeMe123!</div>
          </div>
          <button
            type="button"
            onClick={() => {
              setEmail('admin@school.edu')
              setPassword('ChangeMe123!')
            }}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition cursor-pointer text-xs"
          >
            Auto-fill
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="w-full rounded-xl py-3 text-lg"
        >
          {isSubmitting ? 'Signing In...' : 'Login'}
        </Button>

        {/* Instant Dashboard Preview Shortcuts */}
        <div className="pt-2">
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink mx-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Or Explore New UI Roles
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('ADMIN')}
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-xs font-bold text-blue-800 transition cursor-pointer shadow-2xs"
            >
              <span>🛡️ Admin Portal</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('STUDENT')}
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-xs font-bold text-emerald-800 transition cursor-pointer shadow-2xs"
            >
              <span>🎓 Student Portal</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('TEACHER')}
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-xs font-bold text-amber-800 transition cursor-pointer shadow-2xs"
            >
              <span>👨‍🏫 Teacher Portal</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('PARENT')}
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-xs font-bold text-purple-800 transition cursor-pointer shadow-2xs"
            >
              <span>👨‍👩‍👧 Parent Portal</span>
            </button>
          </div>
        </div>

      </form>

      <div className="mt-8 text-center text-sm text-gray-500">
        © 2026 <span className="font-semibold text-blue-700">SchoolBuddy</span>
        <br />
          
      </div>
    </div>
  )
}