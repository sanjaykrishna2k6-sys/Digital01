import React, { useState, useEffect } from 'react'
import {
  Building2,
  User,
  Shield,
  Bell,
  Save,
  CheckCircle2,
  AlertCircle,
  Lock,
  Globe,
  DollarSign,
  Key,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Loading } from '../components/ui/Loading'
import { useAuth } from '../context/AuthContext'
import * as settingsService from '../services/settingsService'

export function SettingsPage() {
  const { user, login } = useAuth()
  const [activeTab, setActiveTab] = useState('organization')
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState(null)

  // Organization state
  const [organization, setOrganization] = useState(null)
  const [orgForm, setOrgForm] = useState({
    name: '',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
  })
  const [isSavingOrg, setIsSavingOrg] = useState(false)

  // Profile state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    avatar: user?.avatar || '',
  })
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordError, setPasswordError] = useState('')
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  // Notifications state
  const [notifications, setNotifications] = useState({
    leadAlerts: true,
    budgetAlerts: true,
    weeklyDigest: true,
  })

  const canManageOrg = user?.role === 'super_admin' || user?.role === 'agency_admin'

  useEffect(() => {
    async function loadOrg() {
      try {
        const org = await settingsService.fetchOrganizationSettings()
        setOrganization(org)
        setOrgForm({
          name: org.name || '',
          currency: org.settings?.currency || 'INR',
          timezone: org.settings?.timezone || 'Asia/Kolkata',
        })
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    loadOrg()
  }, [])

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [feedback])

  const handleOrgSubmit = async (e) => {
    e.preventDefault()
    if (!canManageOrg) return
    setIsSavingOrg(true)
    try {
      const updated = await settingsService.updateOrganizationSettings({
        name: orgForm.name,
        settings: {
          currency: orgForm.currency,
          timezone: orgForm.timezone,
        },
      })
      setOrganization(updated)
      setFeedback({ type: 'success', text: 'Organization settings updated successfully.' })
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update organization.' })
    } finally {
      setIsSavingOrg(false)
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setIsSavingProfile(true)
    try {
      await settingsService.updateProfile(profileForm)
      setFeedback({ type: 'success', text: 'Your profile has been updated.' })
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update profile.' })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordError('')

    if (passwordForm.newPassword.length < 10) {
      setPasswordError('New password must be at least 10 characters long.')
      return
    }

    if (!/[a-zA-Z]/.test(passwordForm.newPassword) || !/[0-9]/.test(passwordForm.newPassword)) {
      setPasswordError('New password must contain at least one letter and one number.')
      return
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError('New password cannot be identical to your current password.')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }

    setIsSavingPassword(true)
    try {
      if (typeof changePassword === 'function') {
        await changePassword(passwordForm.currentPassword, passwordForm.newPassword)
      } else {
        await settingsService.updatePassword(passwordForm.currentPassword, passwordForm.newPassword)
      }
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setFeedback({ type: 'success', text: 'Password changed successfully.' })
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.')
    } finally {
      setIsSavingPassword(false)
    }
  }

  if (isLoading) {
    return <Loading title="Loading workspace settings..." />
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure organization workspace preferences, profile information, and account security.
        </p>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm transition-all ${
            feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('organization')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'organization'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Organization
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <User className="w-4 h-4" />
          My Profile
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'security'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Shield className="w-4 h-4" />
          Security & Password
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'notifications'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Bell className="w-4 h-4" />
          Notifications
        </button>
      </div>

      {/* TAB 1: ORGANIZATION */}
      {activeTab === 'organization' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Organization Workspace</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage your agency workspace profile and defaults</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="primary">{organization?.plan?.toUpperCase() || 'GROWTH'} PLAN</Badge>
              <Badge variant="success">ACTIVE</Badge>
            </div>
          </div>

          <form onSubmit={handleOrgSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Organization Name
                </label>
                <input
                  type="text"
                  required
                  disabled={!canManageOrg}
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Workspace Slug</label>
                <input
                  type="text"
                  disabled
                  value={organization?.slug || ''}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Default Currency</label>
                <select
                  disabled={!canManageOrg}
                  value={orgForm.currency}
                  onChange={(e) => setOrgForm({ ...orgForm, currency: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Timezone</label>
                <select
                  disabled={!canManageOrg}
                  value={orgForm.timezone}
                  onChange={(e) => setOrgForm({ ...orgForm, timezone: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+5:30)</option>
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="America/New_York">America/New_York (EST/EDT)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                </select>
              </div>
            </div>

            {!canManageOrg && (
              <p className="text-xs text-slate-400 italic">
                Only Agency Admins and Super Admins can modify organization workspace settings.
              </p>
            )}

            {canManageOrg && (
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button variant="primary" type="submit" disabled={isSavingOrg} className="gap-2">
                  <Save className="w-4 h-4" />
                  {isSavingOrg ? 'Saving...' : 'Save Organization Settings'}
                </Button>
              </div>
            )}
          </form>
        </Card>
      )}

      {/* TAB 2: PROFILE */}
      {activeTab === 'profile' && (
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Personal Profile</h2>
            <p className="text-xs text-slate-500 mt-0.5">Update your display information and preferences</p>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Email is locked to your organization session.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assigned Role</label>
                <div className="pt-1">
                  <Badge variant="primary">{user?.role?.replace('_', ' ').toUpperCase()}</Badge>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Avatar Image URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={profileForm.avatar}
                  onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button variant="primary" type="submit" disabled={isSavingProfile} className="gap-2">
                <Save className="w-4 h-4" />
                {isSavingProfile ? 'Updating...' : 'Save Profile'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 3: SECURITY */}
      {activeTab === 'security' && (
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Security & Password</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Update your account password. Plaintext passwords are never saved or displayed.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
            {passwordError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Current Password</label>
              <input
                type="password"
                required
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Minimum 8 characters.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                required
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2">
              <Button variant="primary" type="submit" disabled={isSavingPassword} className="gap-2">
                <Lock className="w-4 h-4" />
                {isSavingPassword ? 'Updating...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 4: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Notification Preferences</h2>
            <p className="text-xs text-slate-500 mt-0.5">Control your email and in-app alert triggers</p>
          </div>

          <div className="space-y-4 max-w-lg">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-900">Inbound Lead Alerts</p>
                <p className="text-xs text-slate-500">Receive notifications when new leads are registered</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.leadAlerts}
                onChange={(e) => setNotifications({ ...notifications, leadAlerts: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-900">Campaign Budget Alerts</p>
                <p className="text-xs text-slate-500">Alert when a campaign reaches 90% of its budget</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.budgetAlerts}
                onChange={(e) => setNotifications({ ...notifications, budgetAlerts: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-900">Weekly Performance Digest</p>
                <p className="text-xs text-slate-500">Summary of ROAS, conversions, and customer acquisition</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.weeklyDigest}
                onChange={(e) => setNotifications({ ...notifications, weeklyDigest: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                onClick={() => setFeedback({ type: 'success', text: 'Notification preferences saved.' })}
              >
                Save Preferences
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
