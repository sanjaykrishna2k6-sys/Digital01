import React, { useState } from 'react'
import {
  LayoutDashboard, FolderOpen, CheckSquare, Megaphone, BarChart3, PieChart,
  Receipt, Folder, MessageSquare, Bell, HelpCircle, ChevronDown,
  ArrowUpRight, ArrowDownRight, Check, MessageCircle, Clock, Zap, ExternalLink,
  FileText
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts'
import { Badge } from '../components/ui/Badge'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Overview', active: true },
  { icon: FolderOpen, label: 'Projects' },
  { icon: CheckSquare, label: 'Content Approval' },
  { icon: Megaphone, label: 'Campaigns' },
  { icon: BarChart3, label: 'Analytics' },
  { icon: PieChart, label: 'Reports' },
  { icon: Receipt, label: 'Invoices' },
  { icon: Folder, label: 'Files' },
  { icon: MessageSquare, label: 'Messages' },
]

const webTraffic = [
  { week: 'W1', visitors: 8200 },
  { week: 'W2', visitors: 9400 },
  { week: 'W3', visitors: 7800 },
  { week: 'W4', visitors: 11200 },
]

const socialData = [
  { platform: 'Instagram', followers: 12400, engagement: 4.2 },
  { platform: 'Facebook', followers: 8900, engagement: 2.8 },
  { platform: 'LinkedIn', followers: 3200, engagement: 5.1 },
]

const campaignPerf = [
  { month: 'Jul', spend: 48000, leads: 62 },
  { month: 'Aug', spend: 52000, leads: 78 },
  { month: 'Sep', spend: 58000, leads: 94 },
]

const approvals = [
  {
    id: 1,
    title: 'Diwali Sale — Instagram Carousel',
    platform: 'Instagram',
    type: 'Social Post',
    scheduled: '18 Oct 2024',
    previewText: '🎉 Diwali Sale',
  },
  {
    id: 2,
    title: 'Google Ads — Search Campaign Copy',
    platform: 'Google Ads',
    type: 'Ad Copy',
    scheduled: '20 Oct 2024',
    previewText: '🔍 Ad Copy',
  },
  {
    id: 3,
    title: 'Blog Post — Best Fitness Tips 2024',
    platform: 'Website',
    type: 'Blog',
    scheduled: '22 Oct 2024',
    previewText: '✍️ Blog',
  },
]

const reports = [
  { name: 'September 2024 — Monthly Report', date: 'Oct 1, 2024', type: 'Monthly' },
  { name: 'Q3 2024 — Quarterly Report', date: 'Sep 30, 2024', type: 'Quarterly' },
  { name: 'August 2024 — Monthly Report', date: 'Sep 1, 2024', type: 'Monthly' },
]

function PortalKpiCard({ label, value, change, positive }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, flex: 1 }}>
      <p style={{ fontSize: 12, fontWeight: 500, color: '#9CA3AF', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1 }}>{value}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 10 }}>
        {positive ? <ArrowUpRight size={13} color="#16A34A" /> : <ArrowDownRight size={13} color="#DC2626" />}
        <span style={{ fontSize: 12, fontWeight: 600, color: positive ? '#16A34A' : '#DC2626' }}>{change}</span>
        <span style={{ fontSize: 12, color: '#D1D5DB' }}>vs last month</span>
      </div>
    </div>
  )
}

export function ClientPortalPage() {
  const [activeNav, setActiveNav] = useState('Overview')
  const [approvedIds, setApprovedIds] = useState([])
  const [changesIds, setChangesIds] = useState([])

  const pendingCount = approvals.filter(a => !approvedIds.includes(a.id) && !changesIds.includes(a.id)).length

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: '#F9FAFB' }}>
      {/* Sidebar */}
      <aside style={{ width: 210, background: '#fff', borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', padding: '20px 12px', flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', marginBottom: 28 }}>
          <div style={{ width: 32, height: 32, background: '#4F46E5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={16} color="#fff" fill="#fff" />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Krishpo</p>
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>Client Portal</p>
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(({ icon: Icon, label }) => (
            <button
              key={label}
              onClick={() => setActiveNav(label)}
              className="sidebar-nav-item"
              style={{
                background: activeNav === label ? '#EEF2FF' : 'transparent',
                color: activeNav === label ? '#4F46E5' : '#4B5563',
                border: 'none', width: '100%', textAlign: 'left',
              }}
            >
              <Icon size={15} />
              {label}
              {label === 'Content Approval' && pendingCount > 0 && (
                <span style={{ marginLeft: 'auto', background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 9999, padding: '1px 6px' }}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px', borderRadius: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>AF</span>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>Acme Fitness</p>
              <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>Client Account</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 28px', height: 58, display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, color: '#9CA3AF' }}>Acme Fitness</span>
            <span style={{ fontSize: 13, color: '#9CA3AF', margin: '0 6px' }}>/</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Overview</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {pendingCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '6px 12px' }}>
                <Clock size={13} color="#DC2626" />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#DC2626' }}>{pendingCount} pending approval{pendingCount > 1 ? 's' : ''}</span>
              </div>
            )}
            <button style={{ width: 36, height: 36, border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Bell size={15} color="#6B7280" />
            </button>
            <button style={{ width: 36, height: 36, border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <HelpCircle size={15} color="#6B7280" />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#92400E' }}>AF</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Acme Fitness</span>
              <ChevronDown size={13} color="#9CA3AF" />
            </div>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0, marginBottom: 4 }}>Welcome back, Acme Fitness 👋</h1>
            <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Here's an overview of your marketing performance for September 2024.</p>
          </div>

          {/* KPIs */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            <PortalKpiCard label="Monthly Leads" value="94" change="+20%" positive={true} />
            <PortalKpiCard label="Website Visitors" value="36,800" change="+14%" positive={true} />
            <PortalKpiCard label="Ad Spend" value="₹58,000" change="+12%" positive={false} />
            <PortalKpiCard label="Conversions" value="187" change="+31%" positive={true} />
            <PortalKpiCard label="ROAS" value="4.2x" change="+0.4x" positive={true} />
          </div>

          {/* Approval Banner */}
          {pendingCount > 0 && (
            <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 36, height: 36, background: '#FFEDD5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Clock size={18} color="#EA580C" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#9A3412', margin: 0 }}>
                  {pendingCount} item{pendingCount > 1 ? 's' : ''} waiting for your approval
                </p>
                <p style={{ fontSize: 13, color: '#C2410C', margin: '2px 0 0' }}>
                  Review and approve content to keep your campaigns running on schedule.
                </p>
              </div>
              <button style={{ background: '#EA580C', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Review Now
              </button>
            </div>
          )}

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
            {/* Campaign performance */}
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>Campaign Performance</h3>
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 20px' }}>Ad spend vs leads generated</p>
              <div className="w-full h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={campaignPerf}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }} />
                    <Bar dataKey="leads" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Leads" barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Website traffic */}
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>Website Analytics</h3>
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 20px' }}>Weekly visitor trend — September</p>
              <div className="w-full h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={webTraffic}>
                    <defs>
                      <linearGradient id="traffGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => (v / 1000).toFixed(0) + 'K'} />
                    <Tooltip formatter={(v) => [Number(v).toLocaleString(), 'Visitors']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }} />
                    <Area type="monotone" dataKey="visitors" stroke="#4F46E5" strokeWidth={2} fill="url(#traffGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Social + Content row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
            {/* Social */}
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: '0 0 20px' }}>Social Media</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {socialData.map(({ platform, followers, engagement }) => (
                  <div key={platform} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid #F3F4F6' }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: '#374151', margin: 0 }}>{platform}</p>
                      <p style={{ fontSize: 13, color: '#9CA3AF', margin: '2px 0 0' }}>{followers.toLocaleString()} followers</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#16A34A', margin: 0 }}>{engagement}%</p>
                      <p style={{ fontSize: 11, color: '#9CA3AF', margin: '1px 0 0' }}>Engagement</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Approval */}
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>Content Awaiting Approval</h3>
                {pendingCount > 0 && <Badge variant="error">{pendingCount} pending</Badge>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {approvals.map(item => {
                  const approved = approvedIds.includes(item.id)
                  const changed = changesIds.includes(item.id)
                  return (
                    <div key={item.id} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 16px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #F3F4F6', opacity: approved || changed ? 0.6 : 1 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 8, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>
                        {item.previewText.split(' ')[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          <Badge variant="primary">{item.platform}</Badge>
                          <span style={{ fontSize: 12, color: '#9CA3AF' }}>📅 {item.scheduled}</span>
                        </div>
                      </div>
                      {approved ? (
                        <Badge variant="success"><Check size={11} /> Approved</Badge>
                      ) : changed ? (
                        <Badge variant="warning"><MessageCircle size={11} /> Changes Requested</Badge>
                      ) : (
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          <button
                            onClick={() => setApprovedIds(ids => [...ids, item.id])}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 7, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                          >
                            <Check size={12} /> Approve
                          </button>
                          <button
                            onClick={() => setChangesIds(ids => [...ids, item.id])}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 7, border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                          >
                            <MessageCircle size={12} /> Request Changes
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Recent Reports */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>Recent Reports</h3>
              <button style={{ fontSize: 13, fontWeight: 500, color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer' }}>View All →</button>
            </div>
            {reports.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px', borderBottom: i < reports.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                <div style={{ width: 36, height: 36, background: '#EEF2FF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={16} color="#4F46E5" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#374151', margin: 0 }}>{r.name}</p>
                  <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>Generated on {r.date}</p>
                </div>
                <Badge variant="neutral">{r.type}</Badge>
                <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, fontWeight: 500, color: '#374151', cursor: 'pointer' }}>
                  <ExternalLink size={12} /> Download
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
