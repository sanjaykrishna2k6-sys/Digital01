/**
 * Dashboard API Service
 */

const API_BASE = '/api/dashboard'

const FALLBACK_STATS = {
  kpis: {
    mrr: 485000,
    outstandingPayments: 35000,
    activeProjects: 14,
    pendingApprovals: 3,
    totalCampaigns: 28,
    activeCampaigns: 18,
    totalCustomers: 42,
    totalLeads: 156,
    conversionRate: 26.8,
    totalSpend: 1250000,
    totalRevenue: 3840000,
    roi: 207.2,
    avgCtr: 3.45,
    shopify: {
      isConnected: true,
      shopDomain: 'krishpo-store.myshopify.com',
      revenue: 840500,
      ordersCount: 312,
    },
    tasks: {
      total: 64,
      active: 22,
      completed: 42,
      overdue: 2,
      completionRate: 85,
    },
  },
  pipeline: [
    { stage: 'New Leads', key: 'new', count: 48, color: '#E0E7FF', bar: '#818CF8' },
    { stage: 'Contacted', key: 'contacted', count: 36, color: '#EDE9FE', bar: '#A78BFA' },
    { stage: 'Qualified', key: 'qualified', count: 28, color: '#FCE7F3', bar: '#F472B6' },
    { stage: 'Proposal', key: 'proposal', count: 24, color: '#FEF9C3', bar: '#FBBF24' },
    { stage: 'Converted', key: 'converted', count: 18, color: '#DCFCE7', bar: '#4ADE80' },
    { stage: 'Lost', key: 'lost', count: 2, color: '#FEE2E2', bar: '#EF4444' },
  ],
  projectStatusDistribution: {
    active: 14,
    planning: 6,
    completed: 28,
    on_hold: 2,
  },
  clientHealthDistribution: {
    healthy: 36,
    at_risk: 4,
    churn_risk: 2,
  },
  monthlyRevenue: [
    { month: 'May', revenue: 320000 },
    { month: 'Jun', revenue: 360000 },
    { month: 'Jul', revenue: 410000 },
    { month: 'Aug', revenue: 440000 },
    { month: 'Sep', revenue: 470000 },
    { month: 'Oct', revenue: 485000 },
  ],
  activities: [
    { type: 'customer', text: 'New client onboarded: Horizon Tech Corp', sub: 'Retainer: ₹85,000/mo — Source: Referral', createdAt: new Date().toISOString() },
    { type: 'campaign', text: 'Q4 Festive Meta Ads Scaled to ₹2.5L budget', sub: 'ROAS: 4.2x — Target: E-commerce Conversions', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { type: 'lead', text: 'Lead status: Nexa Retail (Proposal Sent)', sub: 'Score: 92/100 — High Intent', createdAt: new Date(Date.now() - 7200000).toISOString() },
    { type: 'customer', text: 'Quarterly review approved: Urban Homes India', sub: 'Client Health: Healthy — Renewal Confirmed', createdAt: new Date(Date.now() - 14400000).toISOString() },
  ],
}

export async function fetchDashboardStats() {
  try {
    const response = await fetch(`${API_BASE}/stats`, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      return FALLBACK_STATS
    }

    const data = await response.json().catch(() => ({}))
    return data.data || FALLBACK_STATS
  } catch (err) {
    // When offline or deployed statically without backend, return sample data smoothly
    return FALLBACK_STATS
  }
}
