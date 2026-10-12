import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  TrendingUp,
  IndianRupee,
  Users,
  Target,
  MousePointer,
  Eye,
  RefreshCw,
  Download,
  Filter,
  Layers,
  ArrowUpRight,
  PieChart as PieIcon,
  CheckCircle,
  ShoppingBag,
  Package,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Loading } from '../components/ui/Loading'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { formatINR } from '../utils/formatters'
import * as analyticsService from '../services/analyticsService'

const PIE_COLORS = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6']

export function AnalyticsPage() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [dateRange, setDateRange] = useState('30d')
  const [channelFilter, setChannelFilter] = useState('all')

  const loadAnalytics = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await analyticsService.fetchAnalyticsOverview({
        dateRange,
        channel: channelFilter,
      })
      setData(result)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to load analytics data.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [dateRange, channelFilter])

  const handleExportCSV = () => {
    if (!data) return

    const rows = [
      ['Krishpo Digital Marketing Platform - Analytics Export'],
      [`Date Range: ${dateRange}`, `Channel: ${channelFilter}`, `Exported At: ${new Date().toLocaleString()}`],
      [],
      ['--- Campaign Summary ---'],
      ['Metric', 'Value'],
      ['Total Campaigns', data.campaignAnalytics.totalCampaigns],
      ['Active Campaigns', data.campaignAnalytics.activeCampaigns],
      ['Total Spend (INR)', data.campaignAnalytics.totalSpend],
      ['Total Revenue (INR)', data.campaignAnalytics.totalRevenue],
      ['Impressions', data.campaignAnalytics.totalImpressions],
      ['Clicks', data.campaignAnalytics.totalClicks],
      ['CTR (%)', `${data.campaignAnalytics.ctr}%`],
      ['Conversions', data.campaignAnalytics.totalConversions],
      ['Conversion Rate (%)', `${data.campaignAnalytics.conversionRate}%`],
      ['Overall ROI (%)', `${data.campaignAnalytics.roi}%`],
      [],
      ['--- Channel Breakdown ---'],
      ['Channel', 'Campaigns', 'Spend (INR)', 'Revenue (INR)', 'Leads', 'Conversions', 'ROI (%)'],
    ]

    data.channelAnalytics.forEach((ch) => {
      rows.push([
        ch.channel,
        ch.campaignsCount,
        ch.spend,
        ch.revenue,
        ch.leads,
        ch.conversions,
        `${ch.roi}%`,
      ])
    })

    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `krishpo-analytics-${dateRange}-${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading && !data) {
    return <Loading title="Aggregating workspace analytics..." />
  }

  if (error && !data) {
    return <ErrorState title="Failed to load analytics" message={error} onRetry={loadAnalytics} />
  }

  const { campaignAnalytics, customerAnalytics, leadAnalytics, channelAnalytics, shopifyAnalytics } = data || {}

  // Format data for Channel Spend vs Revenue Chart
  const channelChartData = channelAnalytics?.map((ch) => ({
    name: ch.channel,
    Spend: ch.spend,
    Revenue: ch.revenue,
    Conversions: ch.conversions,
  })) || []

  // Format data for Campaign comparisons
  const campaignChartData = campaignAnalytics?.campaigns?.slice(0, 6).map((c) => ({
    name: c.name.length > 14 ? c.name.slice(0, 14) + '...' : c.name,
    Spend: c.spent,
    Revenue: c.revenue,
    Conversions: c.conversions,
  })) || []

  return (
    <div className="space-y-6">
      {/* Top Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics & Intelligence</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time aggregated performance across marketing campaigns, customer acquisition, and lead pipelines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Past Year</option>
            <option value="all">All Time</option>
          </select>

          {/* Channel Filter */}
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            <option value="all">All Channels</option>
            <option value="Meta Ads">Meta Ads</option>
            <option value="Google Ads">Google Ads</option>
            <option value="Email">Email</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Organic">Organic</option>
          </select>

          <Button variant="secondary" onClick={loadAnalytics} disabled={isLoading} className="gap-2 shadow-sm">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button variant="secondary" onClick={handleExportCSV} className="gap-2 shadow-sm">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* SECTION A: CAMPAIGN OVERVIEW KPI CARDS */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">A. Campaign Performance</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Spend</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {formatINR(campaignAnalytics?.totalSpend || 0)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Across active campaigns</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Revenue</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-2">
              {formatINR(campaignAnalytics?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Attributed sales revenue</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall ROI / ROAS</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-600 mt-2">
              {campaignAnalytics?.roi > 0 ? `+${campaignAnalytics.roi}%` : `${campaignAnalytics?.roi || 0}%`}
            </div>
            <p className="text-xs text-slate-400 mt-1">Net marketing return</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Conversions & CTR</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <MousePointer className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {campaignAnalytics?.totalConversions || 0}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span>CTR: <strong className="text-slate-700">{campaignAnalytics?.ctr || 0}%</strong></span>
              <span>•</span>
              <span>Rate: <strong className="text-slate-700">{campaignAnalytics?.conversionRate || 0}%</strong></span>
            </div>
          </Card>
        </div>
      </div>

      {/* SECTION B: CHANNEL PERFORMANCE & SPEND COMPARISON */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Channel Bar Chart */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Spend vs. Revenue by Channel</h3>
              <p className="text-xs text-slate-500 mt-0.5">Marketing cost efficiency across channels</p>
            </div>
            <Badge variant="primary">Real-time Attribution</Badge>
          </div>

          {channelChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              No channel data available for this range.
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(val) => [formatINR(val), '']}
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Spend" fill="#818CF8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Lead Sources Donut Chart */}
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">Leads by Channel Source</h3>
            <p className="text-xs text-slate-500 mt-0.5">Where your inbound leads originate</p>
          </div>

          {(!leadAnalytics?.leadsBySource || leadAnalytics.leadsBySource.length === 0) ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              No lead source data available.
            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={leadAnalytics.leadsBySource}
                    dataKey="count"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {leadAnalytics.leadsBySource.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [`${val} leads`, name]}
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {leadAnalytics.leadsBySource.map((entry, index) => (
                  <div key={entry.source} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                    <span>{entry.source} ({entry.count})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* SECTION C: PIPELINE FUNNEL & CUSTOMER ACQUISITION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Conversion Funnel */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Lead Conversion Funnel</h3>
              <p className="text-xs text-slate-500 mt-0.5">Progression from discovery to closed customer</p>
            </div>
            <span className="text-xs font-semibold text-indigo-600">
              {leadAnalytics?.totalLeads || 0} Total Inbound
            </span>
          </div>

          <div className="space-y-3 mt-4">
            {leadAnalytics?.funnel?.map((step, idx) => {
              const baseCount = leadAnalytics.funnel[0]?.count || 1
              const percentage = Math.round((step.count / baseCount) * 100)
              return (
                <div key={step.step} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{step.step}</span>
                    <span className="text-slate-500">
                      <strong>{step.count}</strong> ({percentage}%)
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(percentage, 4)}%`,
                        backgroundColor:
                          idx === 0
                            ? '#818CF8'
                            : idx === 1
                            ? '#6366F1'
                            : idx === 2
                            ? '#4F46E5'
                            : idx === 3
                            ? '#F59E0B'
                            : '#10B981',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Customer Analytics Cards */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Customer Growth & LTV</h3>
              <p className="text-xs text-slate-500 mt-0.5">Customer retention and acquisition status</p>
            </div>
            <Badge variant="success">{customerAnalytics?.activeCustomers || 0} Active</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Customers</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{customerAnalytics?.totalCustomers || 0}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{customerAnalytics?.newCustomers || 0} joined in this period</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average LTV</span>
              <p className="text-2xl font-bold text-indigo-600 mt-1">
                {formatINR(customerAnalytics?.avgCustomerValue || 0)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Avg spend per customer</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Converted Wins</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {customerAnalytics?.convertedCustomers || 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Promoted from lead pipeline</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Pipeline Value</span>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {formatINR(leadAnalytics?.totalPipelineValue || 0)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Active proposals & deals</p>
            </div>
          </div>
        </Card>
      </div>

      {/* SECTION D: CHANNEL PERFORMANCE TABLE */}
      <Card className="p-5 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Channel Efficiency Breakdown</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Granular metrics for Meta Ads, Google Ads, Email, and Organic channels
            </p>
          </div>
        </div>

        {channelAnalytics?.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            No marketing channels have been logged yet. Launch a campaign to see channel efficiency.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 -mb-5">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-t border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Channel</th>
                  <th className="py-3 px-4">Campaigns</th>
                  <th className="py-3 px-4">Spend</th>
                  <th className="py-3 px-4">Revenue</th>
                  <th className="py-3 px-4">Conversions</th>
                  <th className="py-3 px-4">Avg CTR</th>
                  <th className="py-3 px-5 text-right">Channel ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {channelAnalytics.map((ch) => (
                  <tr key={ch.channel} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-slate-900">{ch.channel}</td>
                    <td className="py-3.5 px-4 text-slate-600">{ch.campaignsCount}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">{formatINR(ch.spend)}</td>
                    <td className="py-3.5 px-4 font-medium text-emerald-600">{formatINR(ch.revenue)}</td>
                    <td className="py-3.5 px-4 text-slate-700">{ch.conversions}</td>
                    <td className="py-3.5 px-4 text-slate-700">{ch.ctr}%</td>
                    <td className="py-3.5 px-5 text-right font-bold text-indigo-600">
                      {ch.roi > 0 ? `+${ch.roi}%` : `${ch.roi}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* SECTION E: SHOPIFY E-COMMERCE SALES */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">E. Shopify Store Sales</h2>
          </div>
          {shopifyAnalytics?.isConnected && (
            <Badge variant="success">Connected ({shopifyAnalytics.shopDomain})</Badge>
          )}
        </div>

        {shopifyAnalytics?.isConnected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Shopify Revenue</span>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {formatINR(shopifyAnalytics.totalRevenue || 0)}
                </p>
                <p className="text-xs text-slate-400 mt-1">Live synchronized store sales</p>
              </Card>

              <Card className="p-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Orders</span>
                <p className="text-2xl font-bold text-slate-900 mt-1">{shopifyAnalytics.ordersCount || 0}</p>
                <p className="text-xs text-slate-400 mt-1">Processed paid orders</p>
              </Card>

              <Card className="p-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Order Value</span>
                <p className="text-2xl font-bold text-indigo-600 mt-1">{formatINR(shopifyAnalytics.aov || 0)}</p>
                <p className="text-xs text-slate-400 mt-1">AOV per transaction</p>
              </Card>

              <Card className="p-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Synced Customers</span>
                <p className="text-2xl font-bold text-slate-900 mt-1">{shopifyAnalytics.customersCount || 0}</p>
                <p className="text-xs text-slate-400 mt-1">Unique store buyers</p>
              </Card>
            </div>

            {/* Top Products Table */}
            {shopifyAnalytics.topProducts && shopifyAnalytics.topProducts.length > 0 && (
              <Card className="p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Top Catalog Products</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 font-semibold border-b border-slate-100 pb-2">
                        <th className="pb-2">Product Name</th>
                        <th className="pb-2">Vendor</th>
                        <th className="pb-2">Price</th>
                        <th className="pb-2">Total Inventory</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {shopifyAnalytics.topProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 font-medium text-slate-900 flex items-center gap-2">
                            <Package className="w-3.5 h-3.5 text-slate-400" />
                            {p.title}
                          </td>
                          <td className="py-2.5 text-slate-600">{p.vendor || '—'}</td>
                          <td className="py-2.5 font-medium text-slate-800">{formatINR(p.price)}</td>
                          <td className="py-2.5 text-slate-600">{p.totalInventory} units</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        ) : (
          <Card className="p-6 bg-slate-50 border border-dashed border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Shopify Store Not Connected</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Connect your Shopify store to unlock real-time e-commerce order revenue, catalog performance, and customer
                purchase insights.
              </p>
            </div>
            <Link to="/integrations">
              <Button variant="secondary" className="text-xs gap-1.5 mt-2">
                Go to Integrations Hub
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  )
}
