import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const API_URL = import.meta.env.VITE_API_URL

interface UploadingFile {
  name: string
  progress: 'uploading' | 'complete' | 'error'
}

export function useUpload(folderId: string, onSuccess: () => void) {
  const { token } = useAuth()
  const { showError, showSuccess } = useToast()
  const [uploading, setUploading] = useState<UploadingFile[]>([])

  const uploadFile = async (file: File) => {
    setUploading(prev => [...prev, { name: file.name, progress: 'uploading' }])

    try {
      const initRes = await fetch(`${API_URL}/files/upload/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          filename: file.name,
          folder_id: folderId,
          size: file.size,
          mime_type: file.type || 'application/octet-stream',
        }),
      })

      if (!initRes.ok) throw new Error('Failed to initialize upload')
      const { presigned_url, s3_key } = await initRes.json()

      const uploadRes = await fetch(presigned_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
      })

      if (!uploadRes.ok) throw new Error('Failed to upload to storage')

      const completeRes = await fetch(`${API_URL}/files/upload/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          filename: file.name,
          folder_id: folderId,
          s3_key,
          size: file.size,
          mime_type: file.type || 'application/octet-stream',
        }),
      })

      if (!completeRes.ok) throw new Error('Failed to complete upload')

      setUploading(prev =>
        prev.map(f => f.name === file.name ? { ...f, progress: 'complete' } : f)
      )
      showSuccess(`${file.name} uploaded successfully`)
      onSuccess()

    } catch (err) {
      console.error('Upload error:', err)
      setUploading(prev =>
        prev.map(f => f.name === file.name ? { ...f, progress: 'error' } : f)
      )
      showError(`Failed to upload ${file.name}`)
    }
  }

  const uploadFiles = (files: FileList | File[]) => {
    Array.from(files).forEach(file => uploadFile(file))
  }

  return { uploadFiles, uploading }
}