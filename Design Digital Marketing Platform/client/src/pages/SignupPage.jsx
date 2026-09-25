import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, TrendingUp, Users, BarChart3, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'

export function SignupPage() {
  const navigate = useNavigate()
  const { signup, isAuthenticated } = useAuth()

  const [form, setForm] = useState({
    name: '',
    email: '',
    organizationName: '',
    password: '',
    confirmPassword: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [authError, setAuthError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const validate = () => {
    const errors = {}

    if (!form.name.trim()) {
      errors.name = 'Full name is required.'
    } else if (form.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!form.email.trim()) {
      errors.email = 'Work email is required.'
    } else if (!emailRegex.test(form.email.trim())) {
      errors.email = 'Please enter a valid work email address.'
    }

    if (!form.organizationName.trim()) {
      errors.organizationName = 'Agency or organization name is required.'
    } else if (form.organizationName.trim().length < 2) {
      errors.organizationName = 'Organization name must be at least 2 characters.'
    }

    if (!form.password) {
      errors.password = 'Password is required.'
    } else if (form.password.length < 10) {
      errors.password = 'Password must be at least 10 characters long.'
    } else if (!/[a-zA-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      errors.password = 'Password must contain at least one letter and one number.'
    }

    if (!form.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.'
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setAuthError('')

    if (!validate()) {
      return
    }

    setIsLoading(true)
    try {
      await signup({
        name: form.name.trim(),
        email: form.email.toLowerCase().trim(),
        organizationName: form.organizationName.trim(),
        password: form.password,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setAuthError(err.message || 'Failed to create your account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const inputStyle = (fieldName) => {
    const isFocused = focusedField === fieldName
    const hasError = !!fieldErrors[fieldName]
    return {
      width: '100%',
      padding: '11px 14px',
      borderRadius: 8,
      border: `1.5px solid ${hasError ? '#EF4444' : isFocused ? '#4F46E5' : '#E5E7EB'}`,
      fontSize: 14,
      color: '#111827',
      outline: 'none',
      background: '#fff',
      transition: 'border-color 0.15s',
      boxSizing: 'border-box',
    }
  }

  const stats = [
    { icon: Users, value: '200+', label: 'Agencies Powered' },
    { icon: TrendingUp, value: '₹12Cr+', label: 'Client Revenue' },
    { icon: BarChart3, value: '98%', label: 'Retention Rate' },
  ]

  // Password rules checklist
  const passwordChecks = [
    { label: 'At least 10 characters', met: form.password.length >= 10 },
    { label: 'Contains letters & numbers', met: /[a-zA-Z]/.test(form.password) && /[0-9]/.test(form.password) },
    { label: 'Passwords match', met: form.password.length > 0 && form.password === form.confirmPassword },
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
        <div style={{ margin: '40px 0' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1E293B', borderRadius: 6, padding: '6px 12px', marginBottom: 28 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80' }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: '#94A3B8' }}>Start your 14-day agency trial</span>
          </div>

          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1.25, margin: '0 0 20px', letterSpacing: '-0.02em' }}>
            Empower your team.<br />
            <span style={{ color: '#818CF8' }}>Delight your clients.</span>
          </h2>
          <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.6, margin: 0, maxWidth: 420 }}>
            Unified campaigns, multi-tenant workspace isolation, and automated reporting built for performance marketing agencies.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 32, marginTop: 44, flexWrap: 'wrap' }}>
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
        <div style={{ background: '#1E293B', borderRadius: 12, padding: 22, border: '1px solid #334155' }}>
          <p style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 1.6, margin: '0 0 14px', fontStyle: 'italic' }}>
            "Setting up our agency workspace took under two minutes. Client onboarding has never been this smooth."
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>PM</span>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0 }}>Priya Menon</p>
              <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>Managing Partner, GrowthLab, Bengaluru</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div style={{ background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 36px' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: '0 0 6px', letterSpacing: '-0.01em' }}>Create your account</h1>
            <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Launch your agency workspace in seconds</p>
          </div>

          {/* Error banner */}
          {authError && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 14px', marginBottom: 20 }}>
              <AlertCircle size={16} color="#EF4444" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#B91C1C', margin: 0 }}>Registration Failed</p>
                <p style={{ fontSize: 12, color: '#EF4444', margin: '2px 0 0' }}>{authError}</p>
              </div>
            </div>
          )}

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
              marginBottom: 20,
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

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase' }}>or with work email</span>
            <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
                Full Name
              </label>
              <input
                type="text"
                placeholder="Rohit Kapoor"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value })
                  setFieldErrors({ ...fieldErrors, name: '' })
                }}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                style={inputStyle('name')}
                required
              />
              {fieldErrors.name && (
                <p style={{ fontSize: 12, color: '#EF4444', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={12} /> {fieldErrors.name}
                </p>
              )}
            </div>

            {/* Work Email */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
                Work Email
              </label>
              <input
                type="email"
                placeholder="rohit@digiedge.com"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value })
                  setFieldErrors({ ...fieldErrors, email: '' })
                }}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                style={inputStyle('email')}
                required
              />
              {fieldErrors.email && (
                <p style={{ fontSize: 12, color: '#EF4444', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={12} /> {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Organization / Agency Name */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
                Agency / Organization Name
              </label>
              <input
                type="text"
                placeholder="DigiEdge Media"
                value={form.organizationName}
                onChange={(e) => {
                  setForm({ ...form, organizationName: e.target.value })
                  setFieldErrors({ ...fieldErrors, organizationName: '' })
                }}
                onFocus={() => setFocusedField('organizationName')}
                onBlur={() => setFocusedField(null)}
                style={inputStyle('organizationName')}
                required
              />
              {fieldErrors.organizationName && (
                <p style={{ fontSize: 12, color: '#EF4444', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={12} /> {fieldErrors.organizationName}
                </p>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password (min 10 chars)"
                  value={form.password}
                  onChange={(e) => {
                    setForm({ ...form, password: e.target.value })
                    setFieldErrors({ ...fieldErrors, password: '' })
                  }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  style={{ ...inputStyle('password'), paddingRight: 44 }}
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
              {fieldErrors.password && (
                <p style={{ fontSize: 12, color: '#EF4444', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={12} /> {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={(e) => {
                    setForm({ ...form, confirmPassword: e.target.value })
                    setFieldErrors({ ...fieldErrors, confirmPassword: '' })
                  }}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  style={{ ...inputStyle('confirmPassword'), paddingRight: 44 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0, display: 'flex', alignItems: 'center' }}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p style={{ fontSize: 12, color: '#EF4444', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={12} /> {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Password Requirements Checklist */}
            <div style={{ background: '#F1F5F9', borderRadius: 8, padding: '10px 12px', marginBottom: 22 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 6 }}>
                {passwordChecks.map((req, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: req.met ? '#10B981' : '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {req.met && <CheckCircle2 size={10} color="#fff" />}
                    </div>
                    <span style={{ fontSize: 11, color: req.met ? '#065F46' : '#64748B', fontWeight: req.met ? 600 : 400 }}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full text-sm font-semibold py-3"
              isLoading={isLoading}
            >
              Create Account
            </Button>
          </form>

          {/* Sign In Link */}
          <p style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 24, lineHeight: 1.6 }}>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{ color: '#4F46E5', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Sign In
            </button>
          </p>

          <p style={{ fontSize: 12, color: '#D1D5DB', textAlign: 'center', marginTop: 28 }}>
            By registering, you agree to Scalevo's{' '}
            <a href="#terms" onClick={(e) => e.preventDefault()} style={{ color: '#9CA3AF', textDecoration: 'underline' }}>Terms of Service</a>{' '}
            and{' '}
            <a href="#privacy" onClick={(e) => e.preventDefault()} style={{ color: '#9CA3AF', textDecoration: 'underline' }}>Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}
