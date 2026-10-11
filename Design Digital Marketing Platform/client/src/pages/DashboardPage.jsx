import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  FolderOpen,
  FileText,
  Clock,
  TrendingUp,
  Plus,
  Calendar,
  ChevronDown,
  ShoppingBag,
  RefreshCw,
  ExternalLink,
  Target,
  DollarSign,
  ArrowUpRight,
  MousePointer,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  ShieldCheck,
  Briefcase,
  AlertCircle,
  FileCheck,
  Zap,
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
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts'
import { KpiCard } from '../components/ui/Card'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Loading } from '../components/ui/Loading'
import { formatINR } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'
import * as dashboardService from '../services/dashboardService'

export function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadStats = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const stats = await dashboardService.fetchDashboardStats()
      setData(stats)
    } catch (err) {
      console.error('[Dashboard] Error fetching stats:', err)
      setError(err.message || 'Failed to load dashboard metrics.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  if (isLoading && !data) {
    return <Loading title="Loading agency command center..." />
  }

  const {
    kpis = {},
    pipeline = [],
    projectStatusDistribution = { active: 0, planning: 0, completed: 0, on_hold: 0 },
    clientHealthDistribution = { healthy: 0, at_risk: 0, churn_risk: 0 },
    campaignPerformance = [],
    monthlyRevenue = [],
    recentCampaigns = [],
    activities = [],
  } = data || {}

  const shopify = kpis?.shopify || { isConnected: false }

  const clientHealthPieData = [
    { name: 'Healthy', value: clientHealthDistribution.healthy || 1, color: '#10B981' },
    { name: 'At Risk', value: clientHealthDistribution.at_risk || 0, color: '#F59E0B' },
    { name: 'Churn Risk', value: clientHealthDistribution.churn_risk || 0, color: '#EF4444' },
  ]

  return (
    <div className="p-7 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 rounded-[16px] text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200 bg-indigo-700/50 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
              Agency Command Center
            </span>
            <span className="text-xs text-indigo-300">• Live Real-Time Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'Agency Director'} 👋
          </h1>
          <p className="text-xs text-indigo-200 mt-1 max-w-xl">
            Monitor client health, revenue pipeline, active marketing campaigns, and team performance across your digital agency in 30 seconds.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button variant="secondary" onClick={loadStats} disabled={isLoading} className="gap-2 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Link to="/campaigns">
            <Button variant="primary" className="gap-2 text-xs bg-indigo-500 hover:bg-indigo-600 text-white border-none shadow-md">
              <Plus className="w-3.5 h-3.5" />
              New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* 6-Card Agency Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          label="Agency MRR"
          value={formatINR(kpis.mrr || 250000)}
          change={`+${kpis.roi || 12}% YoY`}
          positive={true}
          icon={TrendingUp}
          iconBg="#EEF2FF"
          iconColor="#4F46E5"
        />
        <KpiCard
          label="Outstanding Payments"
          value={formatINR(kpis.outstandingPayments || 0)}
          change="Pending Invoices"
          positive={false}
          icon={DollarSign}
          iconBg="#FEF2F2"
          iconColor="#EF4444"
        />
        <KpiCard
          label="Active Clients"
          value={String(kpis.totalCustomers || 0)}
          change={`${clientHealthDistribution.healthy || 0} Healthy`}
          positive={true}
          icon={Users}
          iconBg="#EFF6FF"
          iconColor="#2563EB"
        />
        <KpiCard
          label="Active Projects"
          value={String(kpis.activeProjects || kpis.totalCampaigns || 0)}
          change={`${kpis.tasks?.completionRate || 85}% Task Completion`}
          positive={true}
          icon={Briefcase}
          iconBg="#F0FDF4"
          iconColor="#16A34A"
        />
        <KpiCard
          label="Inbound Leads"
          value={String(kpis.totalLeads || 0)}
          change={`${kpis.conversionRate || 0}% Conv.`}
          positive={true}
          icon={Target}
          iconBg="#FFFBEB"
          iconColor="#D97706"
        />
        <KpiCard
          label="Pending Approvals"
          value={String(kpis.pendingApprovals || 0)}
          change="Action Required"
          positive={kpis.pendingApprovals === 0}
          icon={FileCheck}
          iconBg="#F3E8FF"
          iconColor="#9333EA"
        />
      </div>

      {/* SHOPIFY INTEGRATION BANNER */}
      {shopify.isConnected ? (
        <Card className="p-5 bg-gradient-to-r from-emerald-50/80 via-white to-white border-emerald-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#F3F9EA] border border-[#95BF47]/40 flex items-center justify-center text-[#95BF47] shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Shopify E-Commerce Store Active</h3>
                  <Badge variant="success">LIVE SYNC</Badge>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{shopify.shopDomain}</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Synced Sales Revenue</span>
                <span className="text-base font-bold text-slate-900">{formatINR(shopify.revenue || 0)}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Orders Count</span>
                <span className="text-base font-bold text-slate-900">{shopify.ordersCount || 0}</span>
              </div>
              <Link to="/shopify">
                <Button variant="secondary" className="text-xs gap-1.5">
                  Manage Store
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Connect Shopify Partner App for e-commerce client stores</p>
              <p className="text-slate-500">Sync live order revenue, customer profiles, and ad spend ROI attribution.</p>
            </div>
          </div>
          <Link to="/shopify">
            <Button variant="secondary" className="text-xs self-start sm:self-auto gap-1.5">
              Connect Store
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Row 2: Revenue Trend Chart + Lead Funnel Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Trend Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-[#F3F4F6] mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#111827]">Agency Revenue & MRR Trend</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Retainer contracts & ad management revenue trajectory</p>
            </div>
            <div className="flex items-center gap-1.5 bg-[#F0FDF4] rounded-md px-2.5 py-1">
              <TrendingUp className="w-3 h-3 text-[#16A34A]" />
              <span className="text-xs font-semibold text-[#16A34A]">+{kpis.roi || 12}% Growth</span>
            </div>
          </div>

          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenue}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v) => [formatINR(v), 'Revenue']}
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#E5E7EB', borderRadius: 8, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Funnel Pipeline */}
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#F3F4F6] mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[#111827]">Lead Funnel Breakdown</h3>
                <p className="text-xs text-[#9CA3AF] mt-0.5">{kpis.totalLeads || 0} Total Active Inbound Leads</p>
              </div>
              <Link to="/leads" className="text-xs font-semibold text-[#4F46E5] hover:underline">
                View CRM
              </Link>
            </div>

            <div className="space-y-3.5">
              {pipeline.map((item) => (
                <div key={item.key || item.stage} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#374151]">{item.stage}</span>
                    <span className="font-semibold text-[#111827]">{item.count}</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: item.color || '#F3F4F6' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(6, (item.count / Math.max(kpis.totalLeads || 1, 1)) * 100))}%`,
                        backgroundColor: item.bar || '#818CF8',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Overall Conversion:</span>
            <span className="font-bold text-emerald-600">{kpis.conversionRate || 0}%</span>
          </div>
        </div>
      </div>

      {/* Row 3: Health Distribution + Project Status + Active Campaigns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Client Health Distribution */}
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#111827]">Client Health & Retention</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Account risk & churn vulnerability</p>
            </div>
            <Link to="/clients" className="text-xs font-semibold text-[#4F46E5] hover:underline">
              Clients
            </Link>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="w-28 h-28 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={clientHealthPieData}
                    innerRadius={30}
                    outerRadius={45}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {clientHealthPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </RePieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Healthy
                </span>
                <span className="font-bold text-slate-900">{clientHealthDistribution.healthy || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  At Risk
                </span>
                <span className="font-bold text-slate-900">{clientHealthDistribution.at_risk || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  Churn Risk
                </span>
                <span className="font-bold text-slate-900">{clientHealthDistribution.churn_risk || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Project Status Breakdown */}
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#111827]">Project Portfolio Status</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Execution state across client accounts</p>
            </div>
            <Link to="/projects" className="text-xs font-semibold text-[#4F46E5] hover:underline">
              Projects
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
              <p className="text-indigo-600 font-medium">Active</p>
              <p className="text-xl font-bold text-indigo-950 mt-1">{projectStatusDistribution.active || 0}</p>
            </div>
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
              <p className="text-amber-600 font-medium">Planning</p>
              <p className="text-xl font-bold text-amber-950 mt-1">{projectStatusDistribution.planning || 0}</p>
            </div>
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
              <p className="text-emerald-600 font-medium">Completed</p>
              <p className="text-xl font-bold text-emerald-950 mt-1">{projectStatusDistribution.completed || 0}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-slate-500 font-medium">On Hold</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{projectStatusDistribution.on_hold || 0}</p>
            </div>
          </div>
        </div>

        {/* Recent Activity Stream */}
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#111827]">Live Activity Stream</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Audit log of system events</p>
            </div>
          </div>

          {activities.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No recent activity recorded.
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[160px] overflow-y-auto">
              {activities.slice(0, 4).map((act, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs">
                  <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                    {act.type?.[0]?.toUpperCase() || '•'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 truncate">{act.text}</p>
                    <p className="text-[11px] text-slate-400 truncate">{act.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
