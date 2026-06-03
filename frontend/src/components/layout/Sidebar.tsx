import { useAuth } from '../../context/AuthContext'
import { useStorage } from '../../hooks/useStorage'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { usedFormatted, capFormatted, percentage } = useStorage()

  return (
    <aside className="w-64 h-screen bg-gray-900 border-r border-gray-700 flex flex-col px-4 py-6 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 px-2">
        <span className="text-2xl">🧙</span>
        <span className="text-white font-semibold text-lg">Bag of Holding</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-white bg-gray-700 text-sm font-medium">
          <span>🗂️</span> My Drive
        </button>
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white text-sm transition-colors">
          <span>👥</span> Shared with me
        </button>
      </nav>

      {/* Storage indicator */}
      <div className="mt-auto flex flex-col gap-4">
        <div>
          <div className="text-xs text-gray-500 mb-2">Storage</div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-violet-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {usedFormatted} of {capFormatted} used
          </div>
        </div>

        {/* User + logout */}
        <div className="flex items-center justify-between border-t border-gray-700 pt-4">
          <span className="text-xs text-gray-400 truncate">{user?.email}</span>
          <button
            onClick={logout}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors ml-2 shrink-0"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}