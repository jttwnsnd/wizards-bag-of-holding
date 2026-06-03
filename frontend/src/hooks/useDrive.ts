import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL

interface Folder {
  id: string
  name: string
}

interface DriveFile {
  id: string
  name: string
  mime_type: string
  size: number
  created_at: string
}

interface BreadcrumbEntry {
  id: string
  name: string
}

export function useDrive() {
  const { token } = useAuth()
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbEntry[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [files, setFiles] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(true)

  const fetchContents = useCallback(async (folderId: string) => {
    setLoading(true)
    try {
      const [foldersRes, filesRes] = await Promise.all([
        fetch(`${API_URL}/folders/${folderId}/contents`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/files/folder/${folderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])
      if (!foldersRes.ok || !filesRes.ok) throw new Error('Failed to fetch contents')
      const [foldersData, filesData] = await Promise.all([
        foldersRes.json(),
        filesRes.json()
      ])
      setFolders(foldersData)
      setFiles(filesData)
    } catch (err) {
      console.error('Failed to fetch folder contents:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch(`${API_URL}/folders/root`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) throw new Error('Failed to fetch root folder')
        const root = await res.json()
        setCurrentFolderId(root.id)
        setBreadcrumbs([{ id: root.id, name: 'My Drive' }])
        await fetchContents(root.id)
      } catch (err) {
        console.error('Failed to initialize drive:', err)
        setLoading(false)
      }
    }
    init()
  }, [])

  const navigateToFolder = async (folderId: string, folderName: string) => {
    setCurrentFolderId(folderId)
    setBreadcrumbs(prev => [...prev, { id: folderId, name: folderName }])
    await fetchContents(folderId)
  }

  const navigateToBreadcrumb = async (index: number) => {
    const target = breadcrumbs[index]
    setCurrentFolderId(target.id)
    setBreadcrumbs(prev => prev.slice(0, index + 1))
    await fetchContents(target.id)
  }

  const refresh = () => {
    if (currentFolderId) fetchContents(currentFolderId)
  }

  return {
    currentFolderId,
    breadcrumbs,
    folders,
    files,
    loading,
    navigateToFolder,
    navigateToBreadcrumb,
    refresh
  }
}