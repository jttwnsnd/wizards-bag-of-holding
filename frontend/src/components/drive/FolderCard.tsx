import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

const API_URL = import.meta.env.VITE_API_URL

interface FolderCardProps {
  id: string
  name: string
  onClick: () => void
  onDelete: () => void
}

export default function FolderCard({ id, name, onClick, onDelete }: FolderCardProps) {
  const { token } = useAuth()
  const { showError, showSuccess } = useToast()

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Delete "${name}" and all its contents?`)) return
    try {
      const res = await fetch(`${API_URL}/folders/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to delete folder')
      showSuccess(`${name} deleted`)
      onDelete()
    } catch {
      showError(`Failed to delete ${name}`)
    }
  }

  return (
    <div
      onClick={onClick}
      className="group flex flex-col bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 rounded-xl p-4 cursor-pointer transition-all duration-150"
    >
      <div className="text-4xl mb-3">📁</div>
      <div className="flex items-center justify-between mt-auto">
        <p className="text-sm text-white font-medium truncate">{name}</p>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-red-400 transition-all duration-150 ml-2 shrink-0"
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}