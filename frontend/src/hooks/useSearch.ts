import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const API_URL = import.meta.env.VITE_API_URL

interface SearchResult {
  id: string
  name: string
  mime_type: string
  size: number
  created_at: string
  similarity: number
}

export function useSearch() {
  const { token } = useAuth()
  const { showError } = useToast()
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [searching, setSearching] = useState(false)

  const search = async (query: string) => {
    setSearching(true)
    try {
      const res = await fetch(`${API_URL}/files/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ query, limit: 10 })
      })
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setResults(data)
    } catch (err) {
      showError('Search failed — please try again')
    } finally {
      setSearching(false)
    }
  }

  const clearSearch = () => setResults(null)

  return { search, clearSearch, results, searching }
}