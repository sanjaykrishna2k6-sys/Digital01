import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, TrendingUp, Users, BarChart3, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { forgotPassword } = useAuth()

  const [email, setEmail] = useState('')
  const [emailFocused, setEmailFocused] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [generalError, setGeneralError] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setEmailError('')
    setGeneralError('')

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address.')
      return
    }

    setIsLoading(true)
    try {
      await forgotPassword(email.toLowerCase().trim())
      setIsSubmitted(true)
    } catch (err) {
      setGeneralError(err.message || 'Failed to submit request. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const inputStyle = (hasError) => ({
    width: '100%',
    padding: '11px 14px',
    borderRadius: 8,
    border: `1.5px solid ${hasError ? '#EF4444' : emailFocused ? '#4F46E5' : '#E5E7EB'}`,
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
          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1.25, margin: '0 0 20px', letterSpacing: '-0.02em' }}>
            Account Security &<br />
            <span style={{ color: '#818CF8' }}>Access Recovery.</span>
          </h2>
          <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.6, margin: 0, maxWidth: 420 }}>
            Never lose momentum. Secure password reset links ensure your agency operations stay uninterrupted.
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

        {/* Footer info */}
        <div style={{ background: '#1E293B', borderRadius: 12, padding: 20, border: '1px solid #334155' }}>
          <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.5, margin: 0 }}>
            Need enterprise assistance? Contact your organization administrator or reach support at <span style={{ color: '#818CF8' }}>support@scalevo.com</span>
          </p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div style={{ background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '52px 40px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6B7280', fontSize: 13, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 20 }}
            >
              <ArrowLeft size={16} /> Back to Sign In
            </button>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.01em' }}>Reset Password</h1>
            <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Enter your registered work email to receive a password reset link.</p>
          </div>

          {generalError && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 14px', marginBottom: 20 }}>
              <AlertCircle size={16} color="#EF4444" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#B91C1C', margin: 0 }}>Error</p>
                <p style={{ fontSize: 12, color: '#EF4444', margin: '2px 0 0' }}>{generalError}</p>
              </div>
            </div>
          )}

          {isSubmitted ? (
            <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 12, padding: 24, textAlign: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle2 size={24} color="#16A34A" />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#166534', margin: '0 0 8px' }}>Check Your Email</h2>
              <p style={{ fontSize: 14, color: '#15803D', lineHeight: 1.5, margin: '0 0 24px' }}>
                If an account exists with <strong>{email}</strong>, a password reset link has been dispatched. The link expires in 30 minutes.
              </p>
              <Button
                variant="primary"
                size="md"
                className="w-full font-semibold"
                onClick={() => navigate('/login')}
              >
                Return to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="you@agency.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError('') }}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  style={inputStyle(!!emailError)}
                  required
                />
                {emailError && (
                  <p style={{ fontSize: 12, color: '#EF4444', margin: '5px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertCircle size={12} /> {emailError}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full text-sm font-semibold py-3"
                isLoading={isLoading}
              >
                Send Reset Link
              </Button>
            </form>
          )}

          <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 28, lineHeight: 1.6 }}>
            Remembered your password?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{ color: '#4F46E5', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
