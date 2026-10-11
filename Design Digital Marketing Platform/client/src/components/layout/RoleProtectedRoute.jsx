import React from 'react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Loading } from '../ui/Loading'

/**
 * RoleProtectedRoute enforces role-based access control.
 * Clients attempting to access agency routes are redirected to /portal.
 */
export function RoleProtectedRoute({ allowedRoles, disallowedRoles, children }) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loading size="lg" title="Verifying authorization..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const role = user?.role || 'team_member'

  if (disallowedRoles && disallowedRoles.includes(role)) {
    const fallbackTarget = role === 'client' ? '/portal' : '/dashboard'
    return <Navigate to={fallbackTarget} replace />
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    const fallbackTarget = role === 'client' ? '/portal' : '/dashboard'
    return <Navigate to={fallbackTarget} replace />
  }

  return children ? children : <Outlet />
}
