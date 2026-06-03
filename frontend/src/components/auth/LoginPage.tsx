import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🧙</div>
          <h1 className="text-white text-2xl font-bold">Bag of Holding</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your drive</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 flex flex-col gap-4">
          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-xs font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="wizard@example.com"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-xs font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}