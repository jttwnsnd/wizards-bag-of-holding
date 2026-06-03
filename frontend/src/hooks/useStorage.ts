import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL
const STORAGE_CAP = 5 * 1024 * 1024 * 1024 // 5GB in bytes

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`
}

export function useStorage() {
  const { token } = useAuth()
  const [used, setUsed] = useState(0)

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`${API_URL}/files/storage`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) return
        const data = await res.json()
        setUsed(data.used)
      } catch (err) {
        console.error('Failed to fetch storage usage:', err)
      }
    }
    fetch_()
  }, [token])

  const percentage = Math.min((used / STORAGE_CAP) * 100, 100)

  return {
    used,
    cap: STORAGE_CAP,
    percentage,
    usedFormatted: formatBytes(used),
    capFormatted: formatBytes(STORAGE_CAP)
  }
}