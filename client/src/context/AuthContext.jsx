import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/api.jsx'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!localStorage.getItem('token')) { setLoading(false); return }
    try { const { data } = await authAPI.getMe(); setUser(data.user) }
    catch { localStorage.removeItem('token') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const login = async (creds) => {
    const { data } = await authAPI.login(creds)
    localStorage.setItem('token', data.token)
    setUser(data.user); return data
  }
  const register = async (payload) => {
    const { data } = await authAPI.register(payload)
    localStorage.setItem('token', data.token)
    setUser(data.user); return data
  }
  const logout     = () => { localStorage.removeItem('token'); setUser(null) }
  const updateUser = (u) => setUser(p => ({ ...p, ...u }))

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, updateUser, isAdmin: user?.role_name === 'admin' }}>
      {children}
    </Ctx.Provider>
  )
}
export const useAuth = () => { const c = useContext(Ctx); if (!c) throw new Error('outside AuthProvider'); return c }
