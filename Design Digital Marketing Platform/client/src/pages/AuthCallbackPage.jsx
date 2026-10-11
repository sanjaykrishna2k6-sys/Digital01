import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loading } from '../components/ui/Loading'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { refreshSession } = useAuth()

  useEffect(() => {
    async function processOAuth() {
      const user = await refreshSession()
      if (user) {
        const target = user.role === 'client' ? '/portal' : '/dashboard'
        navigate(target, { replace: true })
      } else {
        const params = new URLSearchParams(location.search)
        const err = params.get('error') || 'oauth_failed'
        navigate(`/login?error=${encodeURIComponent(err)}`, { replace: true })
      }
    }
    processOAuth()
  }, [refreshSession, navigate, location.search])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <Loading size="lg" title="Completing authentication..." />
    </div>
  )
}
