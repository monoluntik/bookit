'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'

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
