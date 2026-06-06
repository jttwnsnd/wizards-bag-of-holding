import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Layout from './components/layout/Layout'
import DriveView from './components/drive/DriveView'
import LoginPage from './components/auth/LoginPage'
import RegisterPage from './components/auth/RegisterPage'

function AppContent() {
  const { user, loading } = useAuth()
  const [showRegister, setShowRegister] = useState(false)

  // Reset to login page whenever user logs out
  useEffect(() => {
    if (!user) setShowRegister(false)
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return showRegister
      ? <RegisterPage onSwitchToLogin={() => setShowRegister(false)} />
      : <LoginPage onSwitchToRegister={() => setShowRegister(true)} />
  }

  return (
    <Layout>
      <DriveView />
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  )
}