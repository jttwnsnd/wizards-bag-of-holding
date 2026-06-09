import FileCard from "./FileCard"
import FolderCard from "./FolderCard"

// Placeholder types — we'll replace these with real API types later
interface Folder {
  id: string
  name: string
}

interface File {
  id: string
  name: string
  mime_type: string
  created_at: string
}

interface FileGridProps {
  folders: Folder[]
  files: File[]
  onFolderClick: (folderId: string, folderName: string) => void
  onFileDelete: () => void
  onFolderDelete: () => void
}

export default function FileGrid({ folders, files, onFolderClick, onFileDelete, onFolderDelete }: FileGridProps) {
  const isEmpty = folders.length === 0 && files.length === 0

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <div className="text-5xl mb-4">🪄</div>
        <p className="text-lg font-medium text-gray-400">This folder is empty</p>
        <p className="text-sm mt-1">Drop files here or click Upload to get started</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
      {folders.map(folder => (
        <FolderCard
          key={folder.id}
          id={folder.id}
          name={folder.name}
          onClick={() => onFolderClick(folder.id, folder.name)}
          onDelete={onFolderDelete}
        />
      ))}
      {files.map(file => (
        <FileCard
          key={file.id}
          id={file.id}
          name={file.name}
          mimeType={file.mime_type}
          updatedAt={file.created_at}
          onDelete={onFileDelete}
        />
      ))}
    </div>
  )
}

