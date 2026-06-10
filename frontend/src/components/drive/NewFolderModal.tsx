import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

const API_URL = import.meta.env.VITE_API_URL

interface NewFolderModalProps {
  parentFolderId: string
  onSuccess: () => void
  onClose: () => void
}

export default function NewFolderModal({ parentFolderId, onSuccess, onClose }: NewFolderModalProps) {
  const { token } = useAuth()
  const { showError, showSuccess } = useToast()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/folders/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: name.trim(), parent_id: parentFolderId })
      })
      if (!res.ok) throw new Error('Failed to create folder')
      showSuccess(`"${name.trim()}" created`)
      onSuccess()
      onClose()
    } catch {
      showError('Failed to create folder')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreate()
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-sm flex flex-col gap-4">
        <h2 className="text-white font-semibold text-lg">New Folder</h2>

        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Folder name"
          autoFocus
          className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500 transition-colors"
        />

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="text-sm text-gray-400 hover:text-white px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}