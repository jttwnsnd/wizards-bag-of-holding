import { createContext, useContext, useState, useCallback } from 'react'

interface Toast {
  id: number
  message: string
  type: 'error' | 'success'
}

interface ToastContextType {
  showError: (message: string) => void
  showSuccess: (message: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: Toast['type']) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const showError = useCallback((message: string) => addToast(message, 'error'), [addToast])
  const showSuccess = useCallback((message: string) => addToast(message, 'success'), [addToast])

  return (
    <ToastContext.Provider value={{ showError, showSuccess }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium shadow-lg transition-all duration-300 ${
              toast.type === 'error'
                ? 'bg-red-900 border border-red-700 text-red-200'
                : 'bg-green-900 border border-green-700 text-green-200'
            }`}
          >
            <span>{toast.type === 'error' ? '❌' : '✅'}</span>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}