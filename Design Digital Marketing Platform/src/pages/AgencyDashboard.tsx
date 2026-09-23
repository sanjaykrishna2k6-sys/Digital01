import { useState } from 'react'
import {
  LayoutDashboard, Users, Briefcase, FolderOpen, FileText, Megaphone,
  Search as SearchIcon, BarChart3, PieChart, Receipt, Settings, UserSquare2,
  Plug, LogOut, Bell, HelpCircle, ChevronDown, Plus, TrendingUp, TrendingDown,
  Clock, CheckCircle, AlertCircle, Eye, Calendar, ArrowUpRight, ArrowDownRight,
  Activity, DollarSign, Target, Zap
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line
} from 'recharts'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Overview', active: true },
  { icon: Target, label: 'Leads' },
  { icon: Users, label: 'Clients' },
  { icon: FolderOpen, label: 'Projects' },
  { icon: FileText, label: 'Content' },
  { icon: Megaphone, label: 'Campaigns' },
  { icon: SearchIcon, label: 'SEO' },
  { icon: BarChart3, label: 'Analytics' },
  { icon: PieChart, label: 'Reports' },
  { icon: Receipt, label: 'Invoices' },
]

const NAV_BOTTOM = [
  { icon: UserSquare2, label: 'Team' },
  { icon: Plug, label: 'Integrations' },
  { icon: Settings, label: 'Settings' },
]

const revenueData = [
  { month: 'Apr', revenue: 320000 },
  { month: 'May', revenue: 380000 },
  { month: 'Jun', revenue: 350000 },
  { month: 'Jul', revenue: 420000 },
  { month: 'Aug', revenue: 390000 },
  { month: 'Sep', revenue: 482000 },
]

const campaignData = [
  { name: 'Acme Fitness', impressions: 142000, clicks: 4200, spend: 58000 },
  { name: 'GreenLeaf', impressions: 89000, clicks: 2100, spend: 32000 },
  { name: 'Urban Homes', impressions: 210000, clicks: 6800, spend: 74000 },
  { name: 'TechNova', impressions: 67000, clicks: 1900, spend: 28000 },
]

const pipeline = [
  { stage: 'New Leads', count: 34, color: '#E0E7FF', bar: '#818CF8' },
  { stage: 'Contacted', count: 22, color: '#EDE9FE', bar: '#A78BFA' },
  { stage: 'Qualified', count: 15, color: '#FCE7F3', bar: '#F472B6' },
  { stage: 'Proposal', count: 9, color: '#FEF9C3', bar: '#FBBF24' },
  { stage: 'Converted', count: 6, color: '#DCFCE7', bar: '#4ADE80' },
]

const activities = [
  { icon: Users, color: '#4F46E5', bg: '#EEF2FF', text: 'New client onboarded', sub: 'TechNova Pvt. Ltd — 2 hours ago', },
  { icon: CheckCircle, color: '#16A34A', bg: '#F0FDF4', text: 'Campaign approved', sub: 'Acme Fitness — Q3 Meta Ads — 4 hours ago' },
  { icon: FileText, color: '#D97706', bg: '#FFFBEB', text: 'Content submitted for review', sub: 'GreenLeaf Foods — Blog post — 6 hours ago' },
  { icon: Receipt, color: '#16A34A', bg: '#F0FDF4', text: 'Invoice #INV-0082 paid', sub: 'Urban Homes — ₹48,000 — Yesterday' },
  { icon: BarChart3, color: '#2563EB', bg: '#EFF6FF', text: 'SEO report generated', sub: 'TechNova — October Report — Yesterday' },
]

const projects = [
  { client: 'Acme Fitness', project: 'Meta Ads Q4', service: 'Paid Media', manager: 'Priya S.', progress: 72, status: 'On Track', due: '15 Nov 2024' },
  { client: 'GreenLeaf Foods', project: 'SEO & Content', service: 'SEO', manager: 'Rahul M.', progress: 45, status: 'At Risk', due: '28 Oct 2024' },
  { client: 'Urban Homes', project: 'Brand Campaign', service: 'Social Media', manager: 'Ankita R.', progress: 100, status: 'Completed', due: '01 Oct 2024' },
  { client: 'TechNova', project: 'Google Ads Setup', service: 'Paid Media', manager: 'Vikram D.', progress: 20, status: 'Pending', due: '30 Nov 2024' },
  { client: 'FreshMart', project: 'Email Campaigns', service: 'Email', manager: 'Priya S.', progress: 58, status: 'On Track', due: '22 Nov 2024' },
]

const statusStyle: Record<string, { bg: string; color: string }> = {
  'On Track': { bg: '#DCFCE7', color: '#15803D' },
  'At Risk': { bg: '#FEF3C7', color: '#B45309' },
  'Completed': { bg: '#F3F4F6', color: '#374151' },
  'Pending': { bg: '#EFF6FF', color: '#1D4ED8' },
}

function formatINR(n: number) {
  if (n >= 100000) return '₹' + (n / 100000).toFixed(2).replace(/\.?0+$/, '') + 'L'
  return '₹' + n.toLocaleString('en-IN')
}

function KpiCard({ label, value, change, positive, icon: Icon, iconBg }: {
  label: string; value: string; change: string; positive: boolean; icon: React.ElementType; iconBg: string
}) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24, flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#6B7280', marginBottom: 8 }}>{label}</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{value}</p>
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color="#4F46E5" />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 16 }}>
        {positive ? <ArrowUpRight size={14} color="#16A34A" /> : <ArrowDownRight size={14} color="#DC2626" />}
        <span style={{ fontSize: 13, fontWeight: 600, color: positive ? '#16A34A' : '#DC2626' }}>{change}</span>
        <span style={{ fontSize: 13, color: '#9CA3AF' }}>vs last month</span>
      </div>
    </div>
  )
}

export default function AgencyDashboard() {
  const [activeNav, setActiveNav] = useState('Overview')

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 44px)', overflow: 'hidden', background: '#F9FAFB' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: '#fff', borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', padding: '20px 12px', flexShrink: 0, overflowY: 'auto' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', marginBottom: 28 }}>
          <div style={{ width: 32, height: 32, background: '#4F46E5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={16} color="#fff" fill="#fff" />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Scalevo</p>
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>Agency Suite</p>
          </div>
        </div>

        {/* Main Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(({ icon: Icon, label }) => (
            <button
              key={label}
              onClick={() => setActiveNav(label)}
              className="sidebar-nav-item"
              style={{
                background: activeNav === label ? '#EEF2FF' : 'transparent',
                color: activeNav === label ? '#4F46E5' : '#4B5563',
                border: 'none',
                width: '100%',
                textAlign: 'left',
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}

          <div style={{ height: 1, background: '#F3F4F6', margin: '12px 0' }} />

          {NAV_BOTTOM.map(({ icon: Icon, label }) => (
            <button
              key={label}
              onClick={() => setActiveNav(label)}
              className="sidebar-nav-item"
              style={{
                background: activeNav === label ? '#EEF2FF' : 'transparent',
                color: activeNav === label ? '#4F46E5' : '#4B5563',
                border: 'none',
                width: '100%',
                textAlign: 'left',
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 16, marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px', borderRadius: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>SK</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Sanjay Kumar</p>
              <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>Agency Manager</p>
            </div>
            <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}>
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 28px', height: 58, display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, color: '#9CA3AF' }}>Agency</span>
            <span style={{ fontSize: 13, color: '#9CA3AF', margin: '0 6px' }}>/</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Overview</span>
          </div>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '7px 12px', width: 240 }}>
            <SearchIcon size={14} color="#9CA3AF" />
            <input placeholder="Search clients, projects..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: '#374151', width: '100%' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button style={{ width: 36, height: 36, border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
              <Bell size={16} color="#6B7280" />
              <span style={{ position: 'absolute', top: 8, right: 8, width: 7, height: 7, background: '#EF4444', borderRadius: '50%', border: '1.5px solid #fff' }} />
            </button>
            <button style={{ width: 36, height: 36, border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <HelpCircle size={16} color="#6B7280" />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>SK</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Sanjay</span>
            <ChevronDown size={14} color="#9CA3AF" />
          </div>
        </header>

        {/* Scrollable content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {/* Page header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0, marginBottom: 4 }}>Good morning, Sanjay 👋</h1>
              <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Here's what's happening across your agency today.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #E5E7EB', borderRadius: 8, padding: '7px 12px', background: '#fff', cursor: 'pointer' }}>
                <Calendar size={14} color="#6B7280" />
                <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Sep 2024</span>
                <ChevronDown size={13} color="#9CA3AF" />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
            {[
              { label: 'Add Lead', icon: Plus },
              { label: 'Add Client', icon: Users },
              { label: 'Create Project', icon: FolderOpen },
              { label: 'Create Content', icon: FileText },
            ].map(({ label, icon: Icon }) => (
              <button key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 500, color: '#374151', cursor: 'pointer', transition: 'all 0.15s' }}>
                <Icon size={14} color="#4F46E5" />
                {label}
              </button>
            ))}
          </div>

          {/* KPI Cards */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <KpiCard label="Active Clients" value="24" change="+12%" positive={true} icon={Users} iconBg="#EEF2FF" />
            <KpiCard label="Active Projects" value="18" change="+8%" positive={true} icon={FolderOpen} iconBg="#EEF2FF" />
            <KpiCard label="Pending Approvals" value="7" change="-15%" positive={false} icon={Clock} iconBg="#FFFBEB" />
            <KpiCard label="Monthly Revenue" value="₹4.82L" change="+18%" positive={true} icon={TrendingUp} iconBg="#EEF2FF" />
          </div>

          {/* Revenue + Pipeline */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 24 }}>
            {/* Revenue chart */}
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>Revenue Overview</h3>
                  <p style={{ fontSize: 13, color: '#9CA3AF', margin: '4px 0 0' }}>Monthly revenue trend</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F0FDF4', borderRadius: 6, padding: '4px 10px' }}>
                  <TrendingUp size={12} color="#16A34A" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#16A34A' }}>+18% MoM</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => '₹' + (v / 1000) + 'K'} />
                  <Tooltip formatter={(v) => [formatINR(Number(v)), 'Revenue']} contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid #E5E7EB' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} fill="url(#revGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Lead Pipeline */}
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0, marginBottom: 4 }}>Lead Pipeline</h3>
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 20px' }}>Current funnel status</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pipeline.map(({ stage, count, bar }) => (
                  <div key={stage}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{stage}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{count}</span>
                    </div>
                    <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(count / 34) * 100}%`, background: bar, borderRadius: 3, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
              <button style={{ width: '100%', marginTop: 20, padding: '8px', border: '1px solid #E5E7EB', borderRadius: 8, background: 'transparent', fontSize: 13, fontWeight: 500, color: '#4F46E5', cursor: 'pointer' }}>
                View All Leads →
              </button>
            </div>
          </div>

          {/* Campaign + Activity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 24 }}>
            {/* Campaign performance */}
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>Campaign Performance</h3>
                  <p style={{ fontSize: 13, color: '#9CA3AF', margin: '4px 0 0' }}>Spend & impressions by client</p>
                </div>
                <select style={{ fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 6, padding: '4px 8px', color: '#374151', background: '#fff', cursor: 'pointer', outline: 'none' }}>
                  <option>This Month</option>
                  <option>Last Month</option>
                  <option>Q3 2024</option>
                </select>
              </div>

              {/* Metric Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Impressions', value: '5.08L' },
                  { label: 'Clicks', value: '15,000' },
                  { label: 'Avg CTR', value: '2.95%' },
                  { label: 'ROAS', value: '4.2x' },
                ].map(m => (
                  <div key={m.label} style={{ background: '#F9FAFB', borderRadius: 8, padding: '12px 14px' }}>
                    <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0, fontWeight: 500 }}>{m.label}</p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '4px 0 0' }}>{m.value}</p>
                  </div>
                ))}
              </div>

              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={campaignData} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? (v / 1000) + 'K' : v} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }} />
                  <Bar dataKey="impressions" fill="#C7D2FE" radius={[4, 4, 0, 0]} name="Impressions" />
                  <Bar dataKey="clicks" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Clicks" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Activity */}
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0, marginBottom: 20 }}>Recent Activity</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {activities.map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 16, marginBottom: 16, borderBottom: i < activities.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <a.icon size={14} color={a.color} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#374151', margin: 0 }}>{a.text}</p>
                      <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>{a.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Projects Table */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>Active Projects</h3>
                <p style={{ fontSize: 13, color: '#9CA3AF', margin: '4px 0 0' }}>Across all clients and services</p>
              </div>
              <button style={{ fontSize: 13, fontWeight: 500, color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer' }}>View All Projects →</button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Project</th>
                  <th>Service</th>
                  <th>Manager</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p, i) => {
                  const s = statusStyle[p.status]
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 500, color: '#111827' }}>{p.client}</td>
                      <td>{p.project}</td>
                      <td>
                        <span className="badge badge-primary">{p.service}</span>
                      </td>
                      <td>{p.manager}</td>
                      <td style={{ width: 140 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 5, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${p.progress}%`, background: p.progress === 100 ? '#22C55E' : '#4F46E5', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, color: '#6B7280', width: 32, textAlign: 'right' }}>{p.progress}%</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ ...s, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 500 }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ color: '#6B7280' }}>{p.due}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  )
}
