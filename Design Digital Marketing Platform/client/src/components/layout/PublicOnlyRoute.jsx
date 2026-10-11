import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Loading } from '../ui/Loading'

/**
 * PublicOnlyRoute blocks authenticated users from accessing login/signup/forgot-password
 * and redirects them to their role-specific home page.
 */
export function PublicOnlyRoute({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loading size="lg" title="Checking session..." />
      </div>
    )
  }

  if (isAuthenticated) {
    const target = user?.role === 'client' ? '/portal' : '/dashboard'
    return <Navigate to={target} replace />
  }

  return children ? children : <Outlet />
}
