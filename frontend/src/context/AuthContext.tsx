import { createContext, useContext, useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL

interface User {
  id: string
  email: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  // On mount, verify the stored token is still valid
  useEffect(() => {
    const verify = async () => {
      const stored = localStorage.getItem('token')
      if (!stored) {
        setLoading(false)
        return
      }
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${stored}` }
        })
        if (!res.ok) throw new Error('Token invalid')
        const userData = await res.json()
        setUser(userData)
        setToken(stored)
      } catch {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    verify()
  }, [])

  const login = async (email: string, password: string) => {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)

    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    })
    if (!res.ok) throw new Error('Invalid credentials')
    const data = await res.json()
    localStorage.setItem('token', data.access_token)
    setToken(data.access_token)

    const meRes = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${data.access_token}` }
    })
    const userData = await meRes.json()
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}