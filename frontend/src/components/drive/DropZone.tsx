import { useState, useRef } from 'react'
import { useUpload } from '../../hooks/useUpload'

interface DropZoneProps {
  folderId: string
  onUploadSuccess: () => void
  children: React.ReactNode
  fileInputRef: React.RefObject<HTMLInputElement | null>
}

export default function DropZone({ folderId, onUploadSuccess, children, fileInputRef }: DropZoneProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const dragCounterRef = useRef(0)
  const { uploadFiles, uploading } = useUpload(folderId, onUploadSuccess)

  // We use a counter instead of a boolean flag to handle a subtle browser quirk:
  // onDragLeave fires when moving between child elements, not just leaving the zone.
  // The counter increments on enter and decrements on leave — only hits 0 when
  // the drag truly leaves the entire drop zone.
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current++
    setIsDraggingOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDraggingOver(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault() // Required — without this the browser rejects the drop
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current = 0
    setIsDraggingOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) uploadFiles(files)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files)
    }
  }

  const activeUploads = uploading.filter(f => f.progress === 'uploading')

  return (
    <div
      className={`relative min-h-full rounded-xl transition-all duration-150 ${
        isDraggingOver
          ? 'bg-indigo-950 border-2 border-dashed border-indigo-400'
          : 'border-2 border-transparent'
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="text-center">
            <div className="text-5xl mb-3">🪄</div>
            <p className="text-indigo-300 text-lg font-semibold">Drop to upload</p>
          </div>
        </div>
      )}

      {/* Upload progress bar */}
      {activeUploads.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-300 z-20">
          ⬆️ Uploading {activeUploads.length} file{activeUploads.length > 1 ? 's' : ''}...
        </div>
      )}

      {/* Hidden file input for the Upload button */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Render children, passing the trigger function down */}
      {children}
    </div>
  )
}