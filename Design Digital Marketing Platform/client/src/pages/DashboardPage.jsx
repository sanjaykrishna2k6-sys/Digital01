import React, { useState } from 'react'
import {
  Users,
  FolderOpen,
  FileText,
  Clock,
  TrendingUp,
  Plus,
  Calendar,
  ChevronDown,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { KpiCard } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { formatINR } from '../utils/formatters'
import { useDisclosure } from '../hooks/useDisclosure'

// Data exactly as specified in the Figma source
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
  { icon: Users, color: '#4F46E5', bg: '#EEF2FF', text: 'New client onboarded', sub: 'TechNova Pvt. Ltd — 2 hours ago' },
  { icon: TrendingUp, color: '#16A34A', bg: '#F0FDF4', text: 'Campaign approved', sub: 'Acme Fitness — Q3 Meta Ads — 4 hours ago' },
  { icon: FileText, color: '#D97706', bg: '#FFFBEB', text: 'Content submitted for review', sub: 'GreenLeaf Foods — Blog post — 6 hours ago' },
  { icon: TrendingUp, color: '#16A34A', bg: '#F0FDF4', text: 'Invoice #INV-0082 paid', sub: 'Urban Homes — ₹48,000 — Yesterday' },
  { icon: Users, color: '#2563EB', bg: '#EFF6FF', text: 'SEO report generated', sub: 'TechNova — October Report — Yesterday' },
]

const projects = [
  { client: 'Acme Fitness', project: 'Meta Ads Q4', service: 'Paid Media', manager: 'Priya S.', progress: 72, status: 'On Track', due: '15 Nov 2024' },
  { client: 'GreenLeaf Foods', project: 'SEO & Content', service: 'SEO', manager: 'Rahul M.', progress: 45, status: 'At Risk', due: '28 Oct 2024' },
  { client: 'Urban Homes', project: 'Brand Campaign', service: 'Social Media', manager: 'Ankita R.', progress: 100, status: 'Completed', due: '01 Oct 2024' },
  { client: 'TechNova', project: 'Google Ads Setup', service: 'Paid Media', manager: 'Vikram D.', progress: 20, status: 'Pending', due: '30 Nov 2024' },
  { client: 'FreshMart', project: 'Email Campaigns', service: 'Email', manager: 'Priya S.', progress: 58, status: 'On Track', due: '22 Nov 2024' },
]

const statusVariant = {
  'On Track': 'success',
  'At Risk': 'warning',
  'Completed': 'neutral',
  'Pending': 'info',
}

export function DashboardPage() {
  const { isOpen, open, close } = useDisclosure(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [selectedClient, setSelectedClient] = useState('Acme Fitness')

  return (
    <div className="p-7 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#111827] tracking-tight">
            Good morning, Sanjay 👋
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Here's what's happening across your agency today.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 border border-[#E5E7EB] rounded-[8px] px-3 py-1.5 bg-white text-xs font-medium text-[#374151] cursor-pointer hover:bg-[#F9FAFB]">
            <Calendar className="w-3.5 h-3.5 text-[#6B7280]" />
            <span>Sep 2024</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF]" />
          </div>
          <Button variant="primary" size="sm" leftIcon={Plus} onClick={open}>
            New Project
          </Button>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="flex flex-wrap gap-2.5">
        {[
          { label: 'Add Lead', icon: Plus },
          { label: 'Add Client', icon: Users },
          { label: 'Create Project', icon: FolderOpen },
          { label: 'Create Content', icon: FileText },
        ].map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            onClick={open}
            className="flex items-center gap-2 px-4 py-2 rounded-[8px] border border-[#E5E7EB] bg-white text-xs font-semibold text-[#374151] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all shadow-sm"
          >
            <Icon className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Active Clients"
          value="24"
          change="+12%"
          positive={true}
          icon={Users}
          iconBg="#EEF2FF"
          iconColor="#4F46E5"
        />
        <KpiCard
          label="Active Projects"
          value="18"
          change="+8%"
          positive={true}
          icon={FolderOpen}
          iconBg="#EEF2FF"
          iconColor="#4F46E5"
        />
        <KpiCard
          label="Pending Approvals"
          value="7"
          change="-15%"
          positive={false}
          icon={Clock}
          iconBg="#FFFBEB"
          iconColor="#D97706"
        />
        <KpiCard
          label="Monthly Revenue"
          value="₹4.82L"
          change="+18%"
          positive={true}
          icon={TrendingUp}
          iconBg="#EEF2FF"
          iconColor="#4F46E5"
        />
      </div>

      {/* Revenue + Pipeline Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Chart (2 cols on lg) */}
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-[#F3F4F6] mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#111827]">Revenue Overview</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Monthly revenue trend</p>
            </div>
            <div className="flex items-center gap-1.5 bg-[#F0FDF4] rounded-md px-2.5 py-1">
              <TrendingUp className="w-3 h-3 text-[#16A34A]" />
              <span className="text-xs font-semibold text-[#16A34A]">+18% MoM</span>
            </div>
          </div>

          <div className="w-full h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => '₹' + (v / 1000) + 'K'} />
                <Tooltip
                  formatter={(v) => [formatINR(Number(v)), 'Revenue']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} fill="url(#revGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Pipeline */}
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#111827]">Lead Pipeline</h3>
            <p className="text-xs text-[#9CA3AF] mt-0.5 mb-4">Current funnel status</p>
          </div>

          <div className="space-y-3.5 my-auto">
            {pipeline.map(({ stage, count, bar }) => (
              <div key={stage} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[#374151]">{stage}</span>
                  <span className="text-[#111827] font-bold">{count}</span>
                </div>
                <div className="h-1.5 w-full bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(count / 34) * 100}%`,
                      backgroundColor: bar,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="w-full mt-5 py-2 border border-[#E5E7EB] rounded-[8px] bg-transparent text-xs font-semibold text-[#4F46E5] hover:bg-[#EEF2FF] transition-colors"
          >
            View All Leads →
          </button>
        </div>
      </div>

      {/* Campaign Performance + Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Campaign Performance BarChart */}
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#F3F4F6] mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#111827]">Campaign Performance</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Spend & impressions by client</p>
            </div>
            <select className="text-xs border border-[#E5E7EB] rounded-md px-2.5 py-1 text-[#374151] bg-white outline-none cursor-pointer">
              <option>This Month</option>
              <option>Last Month</option>
              <option>Q3 2024</option>
            </select>
          </div>

          {/* Metric Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Impressions', value: '5.08L' },
              { label: 'Clicks', value: '15,000' },
              { label: 'Avg CTR', value: '2.95%' },
              { label: 'ROAS', value: '4.2x' },
            ].map((m) => (
              <div key={m.label} className="bg-[#F9FAFB] rounded-lg p-3 border border-[#F3F4F6]">
                <p className="text-[11px] font-medium text-[#9CA3AF]">{m.label}</p>
                <p className="text-lg font-bold text-[#111827] mt-0.5">{m.value}</p>
              </div>
            ))}
          </div>

          <div className="w-full h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignData} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? (v / 1000) + 'K' : v} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }} />
                <Bar dataKey="impressions" fill="#C7D2FE" radius={[4, 4, 0, 0]} name="Impressions" />
                <Bar dataKey="clicks" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Clicks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-sm flex flex-col justify-between">
          <div className="pb-4 border-b border-[#F3F4F6] mb-4">
            <h3 className="text-sm font-semibold text-[#111827]">Recent Activity</h3>
            <p className="text-xs text-[#9CA3AF] mt-0.5">Automated agency audit stream</p>
          </div>

          <div className="space-y-4 my-auto">
            {activities.map((act, i) => {
              const Icon = act.icon
              return (
                <div key={i} className="flex items-start gap-3 pb-3 border-b border-[#F3F4F6] last:border-b-0 last:pb-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: act.bg }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: act.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#374151] leading-snug">
                      {act.text}
                    </p>
                    <p className="text-[11px] text-[#9CA3AF] mt-0.5 truncate">
                      {act.sub}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Active Projects Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden shadow-sm">
        <div className="p-5 flex items-center justify-between border-b border-[#E5E7EB]">
          <div>
            <h3 className="text-sm font-semibold text-[#111827]">Active Projects</h3>
            <p className="text-xs text-[#9CA3AF] mt-0.5">Across all clients and services</p>
          </div>
          <button className="text-xs font-semibold text-[#4F46E5] hover:underline bg-transparent border-none cursor-pointer">
            View All Projects →
          </button>
        </div>

        <div className="overflow-x-auto">
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
              {projects.map((p, i) => (
                <tr key={i}>
                  <td className="font-semibold text-[#111827]">{p.client}</td>
                  <td>{p.project}</td>
                  <td>
                    <Badge variant="primary">{p.service}</Badge>
                  </td>
                  <td>{p.manager}</td>
                  <td className="w-36">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${p.progress}%`,
                            backgroundColor: p.progress === 100 ? '#22C55E' : '#4F46E5',
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-[#6B7280] w-8 text-right">
                        {p.progress}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <Badge variant={statusVariant[p.status] || 'neutral'}>
                      {p.status}
                    </Badge>
                  </td>
                  <td className="text-xs text-[#6B7280] whitespace-nowrap">{p.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Action Modal */}
      <Modal
        isOpen={isOpen}
        onClose={close}
        title="Create New Project"
        description="Initialize a new client deliverable and assign managers."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={close}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                close()
                setNewProjectName('')
              }}
            >
              Create Project
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Project Name"
            placeholder="e.g. Q4 Performance Max Campaign"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
          />

          <div>
            <label className="text-xs font-semibold text-[#374151] block mb-1.5">
              Assigned Client
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full text-sm text-[#111827] bg-white border-[1.5px] border-[#E5E7EB] rounded-[8px] p-2 outline-none focus:border-[#4F46E5]"
            >
              <option>Acme Fitness</option>
              <option>GreenLeaf Foods</option>
              <option>Urban Homes</option>
              <option>TechNova</option>
              <option>FreshMart</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
