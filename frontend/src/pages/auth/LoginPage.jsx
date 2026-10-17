import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { roleNavConfig } from '../../utils/roleConfig'
import Button from '../../components/common/Button'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const user = await login(email, password)
      navigate(roleNavConfig[user.role]?.landing || '/')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password')
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
            placeholder="yourname@college.edu"
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
            placeholder="Enter your password"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
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

      </form>

      <div className="mt-8 text-center text-sm text-gray-500">
        © 2026 <span className="font-semibold text-blue-700">SchoolBuddy</span>
        <br />
          
      </div>
    </div>
  )
}