'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
// Well under the API's 2h access-token TTL, so the token never actually expires while
// a tab is open — this is what keeps sessions alive on pages that call fetch() directly
// instead of going through apiFetch's reactive 401-retry.
const REFRESH_HEARTBEAT_MS = 20 * 60 * 1000

interface User {
  id: string
  email?: string | null
  name: string
  phone?: string | null
  role: string
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  refreshUser: () => Promise<void>
  logout: () => Promise<void>
  updateUser: (u: Partial<User>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const me = await api.getMe()
      setUser(me)
    } catch {
      setUser(null)
    }
  }, [])

  const logout = useCallback(async () => {
    setUser(null)
    await api.logout().catch(() => {})
  }, [])

  useEffect(() => {
    refreshUser().finally(() => setLoading(false))
  }, [refreshUser])

  // Auto-logout when a request fails even after a silent refresh attempt
  useEffect(() => {
    const handler = () => setUser(null)
    window.addEventListener('auth:expired', handler)
    return () => window.removeEventListener('auth:expired', handler)
  }, [])

  // Proactively rotate the session on a timer, independent of user activity — this is
  // what keeps the session alive for pages/components that call fetch() directly rather
  // than through apiFetch (which only refreshes reactively, after hitting a 401).
  useEffect(() => {
    if (!user) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/refresh`, { method: 'POST', credentials: 'include' })
        if (res.status === 401) setUser(null) // refresh token itself expired/revoked — a real logout
      } catch {
        // network blip — leave the session as-is, the next heartbeat or a real request will retry
      }
    }, REFRESH_HEARTBEAT_MS)
    return () => clearInterval(interval)
  }, [user])

  const updateUser = (u: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...u } : prev)
  }

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
