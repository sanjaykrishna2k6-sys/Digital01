import React from 'react'
import { Bell, ShieldAlert, CheckCircle2, Info, AlertTriangle, UserCheck, Trash2 } from 'lucide-react'
import { Card, KpiCard } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'

const SYSTEM_NOTIFICATIONS = [
  {
    id: 1,
    title: 'Shopify Store Connected Successfully',
    message: 'E-commerce live sync active for Acme Fitness store domain.',
    time: '10 minutes ago',
    type: 'success',
  },
  {
    id: 2,
    title: 'New Inbound Lead Received',
    message: 'Rahul Sharma requested a quote for PPC & Meta Ads management.',
    time: '1 hour ago',
    type: 'info',
  },
  {
    id: 3,
    title: 'Content Pending Approval',
    message: 'Acme Fitness has 1 Instagram carousel awaiting client sign-off.',
    time: '3 hours ago',
    type: 'warning',
  },
  {
    id: 4,
    title: 'Security Audit: Login from New Device',
    message: 'Super admin session initiated from 192.168.29.176.',
    time: 'Yesterday',
    type: 'security',
  },
]

export function NotificationsPage() {
  return (
    <div className="p-7 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-[16px] text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-900/60 px-2.5 py-0.5 rounded-full border border-indigo-700/40">
              Platform Alerts & Logs
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">System Notifications & Audit Stream</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Stay informed on security events, campaign milestones, and client actions in real-time.
          </p>
        </div>
      </div>

      {/* Notifications List */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Activity Stream</h3>
          <span className="text-xs text-slate-500">4 total alerts</span>
        </div>

        <div className="divide-y divide-slate-100">
          {SYSTEM_NOTIFICATIONS.map((notif) => (
            <div key={notif.id} className="p-5 flex items-start gap-4 hover:bg-slate-50/70 transition-colors">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  notif.type === 'success'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : notif.type === 'warning'
                    ? 'bg-amber-50 text-amber-600 border border-amber-200'
                    : notif.type === 'security'
                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                    : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                }`}
              >
                {notif.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                {notif.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                {notif.type === 'security' && <ShieldAlert className="w-5 h-5" />}
                {notif.type === 'info' && <Info className="w-5 h-5" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{notif.title}</h4>
                  <span className="text-xs text-slate-400 shrink-0">{notif.time}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{notif.message}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
