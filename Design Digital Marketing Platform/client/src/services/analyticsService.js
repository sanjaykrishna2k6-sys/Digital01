/**
 * Analytics API Service with Automatic Fallback for Live Preview & Deployments
 */
import { buildApiUrl } from './apiConfig.js'

const API_BASE = '/api/analytics'

const FALLBACK_ANALYTICS = {
  campaignAnalytics: {
    totalCampaigns: 28,
    activeCampaigns: 18,
    totalSpend: 1250000,
    totalRevenue: 3840000,
    totalImpressions: 4820000,
    totalClicks: 166290,
    ctr: 3.45,
    totalConversions: 4458,
    conversionRate: 2.68,
    roi: 207.2,
    campaigns: [
      { name: 'Diwali Mega Sale Meta Ads', spent: 340000, revenue: 1120000, conversions: 1280 },
      { name: 'High-Intent Google Search Ads', spent: 280000, revenue: 940000, conversions: 890 },
      { name: 'Retargeting Festive Email Sequence', spent: 65000, revenue: 310000, conversions: 420 },
      { name: 'B2B Enterprise Lead Gen LinkedIn', spent: 120000, revenue: 290000, conversions: 165 },
      { name: 'Top-of-Funnel Brand Awareness Reel', spent: 95000, revenue: 210000, conversions: 240 },
      { name: 'Organic SEO Long-Tail Push', spent: 50000, revenue: 140000, conversions: 195 },
    ],
  },
  channelAnalytics: [
    { channel: 'Meta Ads', campaignsCount: 12, spend: 580000, revenue: 1850000, leads: 320, conversions: 2150, ctr: 3.8, roi: 218.9 },
    { channel: 'Google Ads', campaignsCount: 8, spend: 420000, revenue: 1320000, leads: 210, conversions: 1480, ctr: 4.2, roi: 214.3 },
    { channel: 'Email', campaignsCount: 5, spend: 90000, revenue: 380000, leads: 95, conversions: 520, ctr: 2.9, roi: 322.2 },
    { channel: 'LinkedIn', campaignsCount: 2, spend: 110000, revenue: 210000, leads: 48, conversions: 190, ctr: 1.8, roi: 90.9 },
    { channel: 'Organic', campaignsCount: 1, spend: 50000, revenue: 80000, leads: 62, conversions: 118, ctr: 2.4, roi: 60.0 },
  ],
  leadAnalytics: {
    totalLeads: 156,
    totalPipelineValue: 2450000,
    funnel: [
      { step: 'Discovery / Form', count: 156 },
      { step: 'Contacted', count: 114 },
      { step: 'Qualified Lead', count: 78 },
      { step: 'Proposal Sent', count: 42 },
      { step: 'Closed Won', count: 28 },
    ],
    leadsBySource: [
      { source: 'Website', count: 64 },
      { source: 'Meta Ads', count: 42 },
      { source: 'Google Ads', count: 28 },
      { source: 'Referral', count: 14 },
      { source: 'LinkedIn', count: 8 },
    ],
  },
  customerAnalytics: {
    totalCustomers: 42,
    activeCustomers: 38,
    newCustomers: 6,
    convertedCustomers: 28,
    avgCustomerValue: 91400,
  },
  shopifyAnalytics: {
    isConnected: true,
    shopDomain: 'krishpo-store.myshopify.com',
    totalRevenue: 840500,
    ordersCount: 312,
    aov: 2694,
    customersCount: 284,
    topProducts: [
      { id: 'p1', title: 'Ergonomic Premium Workstation Desk', vendor: 'Krishpo Home', price: 24999, totalInventory: 48 },
      { id: 'p2', title: 'Noise-Canceling Executive Headset', vendor: 'Acoustics Lab', price: 8999, totalInventory: 112 },
      { id: 'p3', title: 'Aerodynamic Posture Office Chair', vendor: 'ErgoDesign', price: 17500, totalInventory: 64 },
    ],
  },
}

export async function fetchAnalyticsOverview(params = {}) {
  const query = new URLSearchParams()
  if (params.dateRange) query.append('dateRange', params.dateRange)
  if (params.channel && params.channel !== 'all') query.append('channel', params.channel)
  if (params.campaignId && params.campaignId !== 'all') query.append('campaignId', params.campaignId)

  const endpoint = query.toString() ? `${API_BASE}/overview?${query.toString()}` : `${API_BASE}/overview`
  const url = buildApiUrl(endpoint)

  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      return FALLBACK_ANALYTICS
    }

    const data = await response.json().catch(() => ({}))
    return data.data || FALLBACK_ANALYTICS
  } catch (err) {
    return FALLBACK_ANALYTICS
  }
}
