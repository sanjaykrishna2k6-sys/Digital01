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

  const login = async (email, password) => {
    const result = await authService.login(email, password)
    setUser(result.data.user)
    return result
  }

  const signup = async (payload) => {
    const result = await authService.signup(payload)
    setUser(result.data.user)
    return result
  }

  const logout = async () => {
    await authService.logout()
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
