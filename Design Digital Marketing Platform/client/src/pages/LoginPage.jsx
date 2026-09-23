import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, TrendingUp, Users, BarChart3, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/Button'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passFocused, setPassFocused] = useState(false)
  const [formState, setFormState] = useState('default') // 'default' | 'loading' | 'error'
  const [emailError, setEmailError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setEmailError('')
    if (!email || !email.includes('@')) {
      setEmailError('Please enter a valid email address.')
      return
    }

    setFormState('loading')
    setTimeout(() => {
      // Direct navigation to dashboard (no tokens/passwords stored in localStorage)
      setFormState('default')
      navigate('/dashboard')
    }, 700)
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
            <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Scalevo</p>
            <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>Agency Management Suite</p>
          </div>
        </div>

        {/* Hero content */}
        <div style={{ margin: '48px 0' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1E293B', borderRadius: 6, padding: '6px 12px', marginBottom: 28 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80' }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: '#94A3B8' }}>Trusted by 50+ agencies across India</span>
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
            "Scalevo transformed how we manage our 40+ client accounts. We saved 15 hours per week on reporting alone."
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>RK</span>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0 }}>Rohit Kapoor</p>
              <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>Founder, DigiEdge Media, Mumbai</p>
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
                <p style={{ fontSize: 13, fontWeight: 600, color: '#B91C1C', margin: 0 }}>Invalid credentials</p>
                <p style={{ fontSize: 12, color: '#EF4444', margin: '2px 0 0' }}>The email or password you entered is incorrect. Please try again.</p>
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
                onClick={() => {}}
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
          </form>

          <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 28, lineHeight: 1.6 }}>
            Don't have an account?{' '}
            <span style={{ color: '#374151', fontWeight: 500 }}>Contact your administrator</span>
          </p>

          <p style={{ fontSize: 12, color: '#D1D5DB', textAlign: 'center', marginTop: 32 }}>
            By signing in, you agree to our{' '}
            <a href="#terms" onClick={(e) => e.preventDefault()} style={{ color: '#9CA3AF', textDecoration: 'underline' }}>Terms of Service</a>{' '}
            and{' '}
            <a href="#privacy" onClick={(e) => e.preventDefault()} style={{ color: '#9CA3AF', textDecoration: 'underline' }}>Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}
