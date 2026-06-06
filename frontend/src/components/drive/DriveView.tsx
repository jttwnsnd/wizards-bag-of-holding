import { useRef } from 'react'
import FileGrid from './FileGrid'
import DropZone from './DropZone'
import Breadcrumb from './Breadcrumb'
import SearchBar from './SearchBar'
import SkeletonGrid from '../ui/SkeletonGrid'
import { useDrive } from '../../hooks/useDrive'
import { useSearch } from '../../hooks/useSearch'

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.startsWith('video/')) return '🎬'
  if (mimeType.startsWith('audio/')) return '🎵'
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return '🗜️'
  return '📝'
}

export default function DriveView() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    currentFolderId,
    breadcrumbs,
    folders,
    files,
    loading,
    navigateToFolder,
    navigateToBreadcrumb,
    refresh
  } = useDrive()

  const { search, clearSearch, results, searching } = useSearch()

  const isSearching = results !== null

  if (!currentFolderId) {
    return (
      <div className="p-8">
        <SkeletonGrid />
      </div>
    )
  }

  return (
    <div className="p-8 h-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <SearchBar onSearch={search} onClear={clearSearch} />
        <div className="flex-1" />
        {!isSearching && (
          <Breadcrumb breadcrumbs={breadcrumbs} onNavigate={navigateToBreadcrumb} />
        )}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0"
        >
          <span>⬆️</span> Upload
        </button>
      </div>

      {/* Search results */}
      {isSearching ? (
        <div>
          <p className="text-gray-500 text-sm mb-4">
            {searching
              ? 'Searching...'
              : `${results.length} result${results.length !== 1 ? 's' : ''} found`}
          </p>
          {searching ? (
            <SkeletonGrid />
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <div className="text-5xl mb-4">🔮</div>
              <p className="text-lg font-medium text-gray-400">No results found</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
              {results.map(file => (
                <div
                  key={file.id}
                  className="flex flex-col bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 rounded-xl p-4 cursor-pointer transition-all duration-150"
                >
                  <div className="text-4xl mb-3">{getFileIcon(file.mime_type)}</div>
                  <p className="text-sm text-white font-medium truncate mb-1">{file.name}</p>
                  <p className="text-xs text-violet-400">{Math.round(file.similarity * 100)}% match</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <DropZone
          folderId={currentFolderId}
          onUploadSuccess={refresh}
          fileInputRef={fileInputRef}
        >
          {loading ? (
            <SkeletonGrid />
          ) : (
            <FileGrid
              folders={folders}
              files={files}
              onFolderClick={navigateToFolder}
            />
          )}
        </DropZone>
      )}
    </div>
  )
}