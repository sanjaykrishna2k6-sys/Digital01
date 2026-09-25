import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Zap, TrendingUp, Users, BarChart3, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'

export function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { resetPassword } = useAuth()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const validate = () => {
    const errs = {}
    if (!newPassword) {
      errs.newPassword = 'New password is required.'
    } else if (newPassword.length < 10) {
      errs.newPassword = 'Password must be at least 10 characters long.'
    } else if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      errs.newPassword = 'Password must contain at least one letter and one number.'
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Please confirm your password.'
    } else if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')

    if (!token) {
      setServerError('Reset token is missing from the URL. Please request a new password reset.')
      return
    }

    if (!validate()) {
      return
    }

    setIsLoading(true)
    try {
      await resetPassword(token, newPassword)
      setIsSuccess(true)
    } catch (err) {
      setServerError(err.message || 'Password reset token is invalid or has expired.')
    } finally {
      setIsLoading(false)
    }
  }

  const inputStyle = (fieldName) => {
    const isFocused = focusedField === fieldName
    const hasError = !!errors[fieldName]
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

  const passwordChecks = [
    { label: 'At least 10 characters', met: newPassword.length >= 10 },
    { label: 'Contains letters & numbers', met: /[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword) },
    { label: 'Passwords match', met: newPassword.length > 0 && newPassword === confirmPassword },
  ]

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
            Create a strong<br />
            <span style={{ color: '#818CF8' }}>new password.</span>
          </h2>
          <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.6, margin: 0, maxWidth: 420 }}>
            Protect your campaigns, team credentials, and client information with strong account authentication.
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
            Need assistance? Reach our 24/7 security desk at <span style={{ color: '#818CF8' }}>security@scalevo.com</span>
          </p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div style={{ background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '52px 40px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.01em' }}>Reset Password</h1>
            <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Please enter and confirm your new account password.</p>
          </div>

          {serverError && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 14px', marginBottom: 20 }}>
              <AlertCircle size={16} color="#EF4444" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#B91C1C', margin: 0 }}>Reset Failed</p>
                <p style={{ fontSize: 12, color: '#EF4444', margin: '2px 0 0' }}>{serverError}</p>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  style={{ color: '#B91C1C', fontWeight: 600, fontSize: 12, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 6 }}
                >
                  Request a new reset link
                </button>
              </div>
            </div>
          )}

          {isSuccess ? (
            <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 12, padding: 24, textAlign: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle2 size={24} color="#16A34A" />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#166534', margin: '0 0 8px' }}>Password Reset Successful</h2>
              <p style={{ fontSize: 14, color: '#15803D', lineHeight: 1.5, margin: '0 0 24px' }}>
                Your password has been securely updated. You can now sign in using your new credentials.
              </p>
              <Button
                variant="primary"
                size="md"
                className="w-full font-semibold"
                onClick={() => navigate('/login')}
              >
                Sign In Now
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {/* New Password */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password (min 10 chars)"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setErrors({ ...errors, newPassword: '' }) }}
                    onFocus={() => setFocusedField('newPassword')}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...inputStyle('newPassword'), paddingRight: 44 }}
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
                {errors.newPassword && (
                  <p style={{ fontSize: 12, color: '#EF4444', margin: '5px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertCircle size={12} /> {errors.newPassword}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Confirm New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setErrors({ ...errors, confirmPassword: '' }) }}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...inputStyle('confirmPassword'), paddingRight: 44 }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0, display: 'flex', alignItems: 'center' }}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p style={{ fontSize: 12, color: '#EF4444', margin: '5px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertCircle size={12} /> {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Password checks */}
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

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full text-sm font-semibold py-3"
                isLoading={isLoading}
              >
                Reset Password
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
