import { useRef } from 'react'
import FileGrid from './FileGrid'
import DropZone from './DropZone'
import Breadcrumb from './Breadcrumb'
import SkeletonGrid from '../ui/SkeletonGrid'
import { useDrive } from '../../hooks/useDrive'

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

  if (!currentFolderId) {
    return (
      <div className="p-8">
        <SkeletonGrid />
      </div>
    )
  }

  return (
    <div className="p-8 h-full">
      <div className="flex items-center justify-between mb-6">
        <Breadcrumb breadcrumbs={breadcrumbs} onNavigate={navigateToBreadcrumb} />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <span>⬆️</span> Upload
        </button>
      </div>

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
    </div>
  )
}