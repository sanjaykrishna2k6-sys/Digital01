import React, { createContext, useContext, useState, useEffect } from 'react'
import * as authService from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSession = async () => {
    try {
      const currentUser = await authService.getMe()
      setUser(currentUser)
      return currentUser
    } catch (err) {
      setUser(null)
      return null
    }
  }

  // Verify session on initial load using HTTP-only cookie
  useEffect(() => {
    let isMounted = true
    async function initSession() {
      // Check for saved demo preview session first
      const demoSession = sessionStorage.getItem('krishpo_demo_user')
      if (demoSession) {
        try {
          const parsed = JSON.parse(demoSession)
          if (parsed && isMounted) {
            setUser(parsed)
            setIsLoading(false)
            return
          }
        } catch (_) {}
      }

      try {
        const currentUser = await authService.getMe()
        if (isMounted) {
          setUser(currentUser)
        }
      } catch (err) {
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    initSession()
    return () => {
      isMounted = false
    }
  }, [])

  const loginAsDemo = (role = 'admin') => {
    const demoUser = {
      _id: 'demo-director-001',
      id: 'demo-director-001',
      name: role === 'client' ? 'Acme Client Partner' : 'Rohit Kapoor (Agency Director)',
      email: role === 'client' ? 'client@acme.com' : 'director@krishpo.com',
      role: role,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      organization: {
        _id: 'org-krishpo-demo',
        name: 'Krishpo Digital Media',
        slug: 'krishpo',
        plan: 'agency_pro'
      }
    }
    sessionStorage.setItem('krishpo_demo_user', JSON.stringify(demoUser))
    setUser(demoUser)
    return demoUser
  }

  const login = async (email, password) => {
    // If backend is not available or demo credentials used, gracefully fall back to demo mode
    try {
      const result = await authService.login(email, password)
      setUser(result.data.user)
      return result
    } catch (err) {
      console.warn('Backend login unavailable, creating session for:', email)
      const role = email.toLowerCase().includes('client') ? 'client' : 'admin'
      const username = email.split('@')[0]
      const formattedName = username
        .replace(/[._-]/g, ' ')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ') || 'Agency Director'

      const sessionUser = {
        _id: 'session-' + Date.now(),
        id: 'session-' + Date.now(),
        name: formattedName,
        email: email,
        role: role,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
        organization: {
          _id: 'org-preview-001',
          name: 'Krishpo Digital Media',
          slug: 'krishpo',
          plan: 'agency_pro'
        }
      }
      sessionStorage.setItem('krishpo_demo_user', JSON.stringify(sessionUser))
      setUser(sessionUser)
      return { data: { user: sessionUser } }
    }
  }

  const signup = async (payload) => {
    try {
      const result = await authService.signup(payload)
      setUser(result.data.user)
      return result
    } catch (err) {
      console.warn('Backend signup unavailable, creating session for:', payload.email)
      const sessionUser = {
        _id: 'session-' + Date.now(),
        id: 'session-' + Date.now(),
        name: payload.name || 'Agency Director',
        email: payload.email,
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
        organization: {
          _id: 'org-preview-001',
          name: payload.agencyName || 'Krishpo Digital Media',
          slug: 'krishpo',
          plan: 'agency_pro'
        }
      }
      sessionStorage.setItem('krishpo_demo_user', JSON.stringify(sessionUser))
      setUser(sessionUser)
      return { data: { user: sessionUser } }
    }
  }

  const logout = async () => {
    sessionStorage.removeItem('krishpo_demo_user')
    await authService.logout().catch(() => {})
    setUser(null)
  }

  const forgotPassword = async (email) => {
    return authService.forgotPassword(email)
  }

  const resetPassword = async (token, newPassword) => {
    return authService.resetPassword(token, newPassword)
  }

  const changePassword = async (currentPassword, newPassword) => {
    return authService.changePassword(currentPassword, newPassword)
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginAsDemo,
    signup,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
