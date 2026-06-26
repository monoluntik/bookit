'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'

interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: string
}

interface AuthContextValue {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (u: Partial<User>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('token')
    if (saved) {
      setToken(saved)
      api.getMe(saved)
        .then(setUser)
        .catch(() => logout())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [logout])

  // Auto-logout on 401 from any API call
  useEffect(() => {
    const handler = () => logout()
    window.addEventListener('auth:expired', handler)
    return () => window.removeEventListener('auth:expired', handler)
  }, [logout])

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password)
    localStorage.setItem('token', res.token)
    setToken(res.token)
    setUser(res.user)
  }

  const updateUser = (u: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...u } : prev)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
