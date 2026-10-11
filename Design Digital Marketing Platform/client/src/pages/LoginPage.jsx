import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Zap, TrendingUp, Users, BarChart3, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loginAsDemo, user, isAuthenticated } = useAuth()

  const handleDemoLogin = (role = 'admin') => {
    loginAsDemo(role)
    navigate(role === 'client' ? '/portal' : '/dashboard', { replace: true })
  }

  const [email, setEmail] = useState('admin@krishpo.com')
  const [password, setPassword] = useState('krishpo123')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passFocused, setPassFocused] = useState(false)
  const [formState, setFormState] = useState('default') // 'default' | 'loading' | 'error'
  const [emailError, setEmailError] = useState('')
  const [authError, setAuthError] = useState('')

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const target = user?.role === 'client' ? '/portal' : '/dashboard'
      navigate(target, { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  // Check for error in query parameters (e.g. from OAuth redirect)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const err = params.get('error')
    if (err) {
      const errorMap = {
        google_oauth_not_configured: 'Google Sign-In is not configured yet. Please log in with your email and password, or configure Google OAuth credentials.',
        invalid_oauth_state: 'Google authentication session expired or was invalid. Please try again.',
        missing_auth_code: 'Google authentication failed to return an authorization code.',
        unverified_google_email: 'Your Google email address is unverified. Please verify your Google account first.',
        account_inactive: 'Your account is inactive. Please contact an administrator.',
        org_inactive: 'Your organization workspace is inactive.',
      }
      setAuthError(errorMap[err] || `Authentication error: ${err}`)
      setFormState('error')
    }
  }, [location.search])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setEmailError('')
    setAuthError('')

    if (!email || !email.includes('@')) {
      setEmailError('Please enter a valid email address.')
      return
    }

    if (!password) {
      setAuthError('Please enter your password.')
      setFormState('error')
      return
    }

    setFormState('loading')
    try {
      const res = await login(email, password)
      const loggedUser = res?.data?.user
      const defaultTarget = loggedUser?.role === 'client' ? '/portal' : '/dashboard'
      const targetPath = location.state?.from?.pathname || defaultTarget
      navigate(targetPath, { replace: true })
    } catch (err) {
      setAuthError(err.message || 'The email or password you entered is incorrect. Please try again.')
      setFormState('error')
    }
  }

  const inputStyle = (focused, hasError) => ({
    width: '100%',
    padding: '11px 14px',
    borderRadius: 8,
    border: `1.5px solid ${hasError ? '#EF4444' : focused ? '#4F46E5' : '#E5E7EB'}`,
    fontSize: 14,
    color: '#111827',
    outline: 'none',
    background: '#fff',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  })

  const stats = [
    { icon: Users, value: '200+', label: 'Clients Managed' },
    { icon: TrendingUp, value: '₹12Cr+', label: 'Revenue Generated' },
    { icon: BarChart3, value: '98%', label: 'Client Retention' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Left Branding Panel */}
      <div style={{ background: '#0F172A', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '52px 60px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, background: '#4F46E5', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={18} color="#fff" fill="#fff" />
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Krishpo</p>
            <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>Digital Marketing Platform</p>
          </div>
        </div>

        {/* Hero content */}
        <div style={{ margin: '48px 0' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1E293B', borderRadius: 6, padding: '6px 12px', marginBottom: 28 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80' }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: '#94A3B8' }}>Trusted by performance marketing agencies</span>
          </div>

          <h2 style={{ fontSize: 38, fontWeight: 800, color: '#fff', lineHeight: 1.2, margin: '0 0 20px', letterSpacing: '-0.02em' }}>
            Scale your agency<br />
            <span style={{ color: '#818CF8' }}>with confidence.</span>
          </h2>
          <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.6, margin: 0, maxWidth: 420 }}>
            Manage clients, track campaigns, approve content, and get complete visibility across every project — all in one place.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 32, marginTop: 48, flexWrap: 'wrap' }}>
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Icon size={15} color="#818CF8" />
                  <span style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{value}</span>
                </div>
                <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div style={{ background: '#1E293B', borderRadius: 12, padding: 24, border: '1px solid #334155' }}>
          <p style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 1.6, margin: '0 0 16px', fontStyle: 'italic' }}>
            "Krishpo transformed how we manage our client accounts. We saved 15 hours per week on reporting alone."
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>RK</span>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0 }}>Rohit Kapoor</p>
              <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>Founder, DigiEdge Media</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div style={{ background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '52px 40px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.01em' }}>Welcome back</h1>
            <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Sign in to your agency workspace</p>
          </div>

          {/* Error banner */}
          {formState === 'error' && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 14px', marginBottom: 20 }}>
              <AlertCircle size={16} color="#EF4444" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#B91C1C', margin: 0 }}>Authentication Failed</p>
                <p style={{ fontSize: 12, color: '#EF4444', margin: '2px 0 0' }}>{authError || 'The email or password you entered is incorrect.'}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
                Email address
              </label>
              <input
                type="email"
                placeholder="you@agency.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError('') }}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                style={inputStyle(emailFocused, !!emailError)}
                required
              />
              {emailError && (
                <p style={{ fontSize: 12, color: '#EF4444', margin: '5px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={12} /> {emailError}
                </p>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                  style={{ ...inputStyle(passFocused), paddingRight: 44 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0, display: 'flex', alignItems: 'center' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={{ width: 15, height: 15, accentColor: '#4F46E5', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 13, color: '#6B7280' }}>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                style={{ fontSize: 13, fontWeight: 500, color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full text-sm font-semibold py-3"
              isLoading={formState === 'loading'}
            >
              Sign In
            </Button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase' }}>or</span>
              <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={() => { window.location.href = '/api/auth/google' }}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 8,
                border: '1.5px solid #E5E7EB',
                background: '#fff',
                color: '#374151',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = '#F9FAFB' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = '#fff' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Continue with Google
            </button>
          </form>

          {/* Quick Demo Preview for friends / reviewers */}
          <div style={{ marginTop: 24, padding: '16px', background: '#F0FDF4', borderRadius: 12, border: '1.5px solid #BBF7D0', textAlign: 'center' }}>
            <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span>⚡</span> Live Preview / Demo Mode
            </p>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: '#15803D' }}>
              Want to see the platform without logging in? Click below:
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: 8,
                  background: '#16A34A',
                  color: '#fff',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#15803D' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#16A34A' }}
              >
                🚀 Agency Dashboard
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('client')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: 8,
                  background: '#fff',
                  color: '#166534',
                  border: '1.5px solid #86EFAC',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F0FDF4' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff' }}
              >
                👤 Client Portal
              </button>
            </div>
          </div>

          <p style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 24, lineHeight: 1.6 }}>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/signup')}
              style={{ color: '#4F46E5', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Create an account
            </button>
          </p>

          <p style={{ fontSize: 12, color: '#D1D5DB', textAlign: 'center', marginTop: 32 }}>
            By signing in, you agree to Krishpo's{' '}
            <a href="#terms" onClick={(e) => e.preventDefault()} style={{ color: '#9CA3AF', textDecoration: 'underline' }}>Terms of Service</a>{' '}
            and{' '}
            <a href="#privacy" onClick={(e) => e.preventDefault()} style={{ color: '#9CA3AF', textDecoration: 'underline' }}>Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}
