import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

const API_URL = import.meta.env.VITE_API_URL

interface FileCardProps {
  id: string
  name: string
  mimeType: string
  updatedAt: string
  onDelete: () => void
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.startsWith('video/')) return '🎬'
  if (mimeType.startsWith('audio/')) return '🎵'
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return '🗜️'
  return '📝'
}

export default function FileCard({ id, name, mimeType, updatedAt, onDelete }: FileCardProps) {
  const { token } = useAuth()
  const { showError, showSuccess } = useToast()

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await fetch(`${API_URL}/files/${id}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to get download URL')
      const { download_url } = await res.json()
      window.open(download_url, '_blank')
    } catch {
      showError(`Failed to download ${name}`)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Delete "${name}"?`)) return
    try {
      const res = await fetch(`${API_URL}/files/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to delete file')
      showSuccess(`${name} deleted`)
      onDelete()
    } catch {
      showError(`Failed to delete ${name}`)
    }
  }

  return (
    <div className="group flex flex-col bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 rounded-xl p-4 cursor-pointer transition-all duration-150">
      <div className="text-4xl mb-3">{getFileIcon(mimeType)}</div>
      <p className="text-sm text-white font-medium truncate mb-1">{name}</p>
      <div className="flex items-center justify-between mt-auto pt-1">
        <p className="text-xs text-gray-500">{updatedAt}</p>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-150">
          <button
            onClick={handleDownload}
            className="text-xs text-gray-400 hover:text-violet-400 transition-colors"
            title="Download"
          >
            ⬇️
          </button>
          <button
            onClick={handleDelete}
            className="text-xs text-gray-400 hover:text-red-400 transition-colors"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}