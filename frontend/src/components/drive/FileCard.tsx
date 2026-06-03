interface FileCardProps {
    name: string
    mimeType: string
    updatedAt: string
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.startsWith('video/')) return '🎬'
  if (mimeType.startsWith('audio/')) return '🎵'
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return '🗜️'
  return '📝'
}

export default function FileCard({ name, mimeType, updatedAt }: FileCardProps) {
    return (
        <div className="group flex flex-col bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 rounded-xl p-4 cursor-pointer transition-all duration-150">
            {/* Icon */}
            <div className="text-4xl mb-3">{getFileIcon(mimeType)}</div>

            {/* Name */}
            <p className="text-sm text-white font-medium truncate mb-1">{name}</p>

            {/* Meta */}
            <p className="text-xs text-gray-500">{updatedAt}</p>
        </div>
    )
}