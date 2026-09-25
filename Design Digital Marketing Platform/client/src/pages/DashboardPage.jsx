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
    return <Loading title="Loading agency dashboard..." />
  }

  const {
    kpis = {},
    pipeline = [],
    campaignPerformance = [],
    monthlyRevenue = [],
    recentCampaigns = [],
    activities = [],
  } = data || {}

  const shopify = kpis?.shopify || { isConnected: false }

  return (
    <div className="p-7 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#111827] tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'Agency Admin'} 👋
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Real-time multi-channel marketing performance and pipeline overview.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" onClick={loadStats} disabled={isLoading} className="gap-2 shadow-sm text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link to="/campaigns">
            <Button variant="primary" className="gap-2 shadow-sm text-xs">
              <Plus className="w-3.5 h-3.5" />
              New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Spend"
          value={formatINR(kpis.totalSpend || 0)}
          change={`${kpis.activeCampaigns || 0} active`}
          positive={true}
          icon={DollarSign}
          iconBg="#EEF2FF"
          iconColor="#4F46E5"
        />
        <KpiCard
          label="Campaign Revenue"
          value={formatINR(kpis.totalRevenue || 0)}
          change={`+${kpis.roi || 0}% ROI`}
          positive={kpis.roi >= 0}
          icon={TrendingUp}
          iconBg="#F0FDF4"
          iconColor="#16A34A"
        />
        <KpiCard
          label="Total Leads"
          value={String(kpis.totalLeads || 0)}
          change={`${kpis.conversionRate || 0}% conv.`}
          positive={true}
          icon={Target}
          iconBg="#FFFBEB"
          iconColor="#D97706"
        />
        <KpiCard
          label="Active Clients"
          value={String(kpis.totalCustomers || 0)}
          change="Organization"
          positive={true}
          icon={Users}
          iconBg="#EFF6FF"
          iconColor="#2563EB"
        />
      </div>

      {/* SHOPIFY INTEGRATION BANNER */}
      {shopify.isConnected ? (
        <Card className="p-5 bg-gradient-to-r from-emerald-50/70 via-white to-white border-emerald-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#F3F9EA] border border-[#95BF47]/40 flex items-center justify-center text-[#95BF47]">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Shopify Store Active</h3>
                  <Badge variant="success">LIVE SYNC</Badge>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{shopify.shopDomain}</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Store Revenue</span>
                <span className="text-base font-bold text-slate-900">{formatINR(shopify.revenue || 0)}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Paid Orders</span>
                <span className="text-base font-bold text-slate-900">{shopify.ordersCount || 0}</span>
              </div>
              <Link to="/integrations">
                <Button variant="secondary" className="text-xs gap-1.5">
                  Manage Store
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Connect Shopify to view store sales analytics.</p>
              <p className="text-slate-500">Sync live orders, catalog products, and multi-channel marketing attribution.</p>
            </div>
          </div>
          <Link to="/integrations">
            <Button variant="secondary" className="text-xs self-start sm:self-auto gap-1.5">
              Connect Shopify
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Revenue + Pipeline Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Trend Chart (2 cols on lg) */}
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-[#F3F4F6] mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#111827]">Revenue Overview</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Campaigns & sales performance trend</p>
            </div>
            <div className="flex items-center gap-1.5 bg-[#F0FDF4] rounded-md px-2.5 py-1">
              <TrendingUp className="w-3 h-3 text-[#16A34A]" />
              <span className="text-xs font-semibold text-[#16A34A]">+{kpis.roi || 0}% ROI</span>
            </div>
          </div>

          <div className="w-full h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenue}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
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
                <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Pipeline */}
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#F3F4F6] mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#111827]">Lead Pipeline</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">{kpis.totalLeads || 0} active inbound leads</p>
            </div>
            <Link to="/leads" className="text-xs font-semibold text-[#4F46E5] hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {pipeline.map((item) => (
              <div key={item.key || item.stage} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#374151]">{item.stage}</span>
                  <span className="font-semibold text-[#111827]">{item.count}</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: item.color || '#F3F4F6' }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(5, (item.count / Math.max(kpis.totalLeads || 1, 1)) * 100))}%`,
                      backgroundColor: item.bar || '#818CF8',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Campaigns & Activity Feed Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Campaigns Table */}
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#F3F4F6] mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#111827]">Active Marketing Campaigns</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Top campaigns currently delivering impressions and leads</p>
            </div>
            <Link to="/campaigns" className="text-xs font-semibold text-[#4F46E5] hover:underline">
              All Campaigns
            </Link>
          </div>

          {recentCampaigns.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No campaigns active yet. Create your first marketing campaign!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 font-semibold border-b border-slate-100 pb-2">
                    <th className="pb-2">Campaign</th>
                    <th className="pb-2">Channel</th>
                    <th className="pb-2">Budget</th>
                    <th className="pb-2">Spend</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentCampaigns.map((camp) => (
                    <tr key={camp._id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-medium text-slate-900">
                        <Link to={`/campaigns/${camp._id}`} className="hover:text-indigo-600">
                          {camp.name}
                        </Link>
                      </td>
                      <td className="py-2.5 text-slate-600">{camp.channel}</td>
                      <td className="py-2.5 font-medium text-slate-800">{formatINR(camp.budget)}</td>
                      <td className="py-2.5 text-slate-600">{formatINR(camp.spent || camp.metrics?.spend || 0)}</td>
                      <td className="py-2.5">
                        <Badge variant={camp.status === 'active' ? 'success' : 'neutral'}>
                          {camp.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#F3F4F6] mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#111827]">Live Activity Feed</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Real-time actions across workspace</p>
            </div>
          </div>

          {activities.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No activity logged yet.
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((act, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                    {act.type?.[0]?.toUpperCase() || '•'}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-900">{act.text}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{act.sub}</p>
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
