import React from 'react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Loading } from '../ui/Loading'

export function ProtectedRoute({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loading size="lg" title="Verifying session..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Redirect client role users away from agency pages to client portal
  if (user?.role === 'client' && location.pathname !== '/portal' && location.pathname !== '/client-portal') {
    return <Navigate to="/portal" replace />
  }

  return children ? children : <Outlet />
}
