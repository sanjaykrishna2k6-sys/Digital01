import mongoose from 'mongoose'
import Campaign from '../models/Campaign.js'
import Customer from '../models/Customer.js'
import Lead from '../models/Lead.js'
import ShopifyStore from '../models/ShopifyStore.js'
import ShopifyOrder from '../models/ShopifyOrder.js'
import ShopifyProduct from '../models/ShopifyProduct.js'
import ShopifyCustomer from '../models/ShopifyCustomer.js'

/**
 * GET /api/analytics/overview
 * Comprehensive analytics aggregation strictly scoped to authenticated user's organization.
 */
export async function getAnalyticsOverview(req, res, next) {
  try {
    const { dateRange = '30d', channel, campaignId } = req.query
    const orgId = req.organizationId

    // Date range filter
    let dateFilter = {}
    const now = new Date()
    if (dateRange === '7d') {
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      dateFilter = { createdAt: { $gte: past } }
    } else if (dateRange === '30d') {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      dateFilter = { createdAt: { $gte: past } }
    } else if (dateRange === '90d') {
      const past = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      dateFilter = { createdAt: { $gte: past } }
    } else if (dateRange === '1y') {
      const past = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      dateFilter = { createdAt: { $gte: past } }
    }

    // 1. Fetch campaigns for organization
    const campaignQuery = { organization: orgId, ...dateFilter }
    if (channel && channel !== 'all') {
      campaignQuery.channel = channel
    }
    if (campaignId && mongoose.Types.ObjectId.isValid(campaignId)) {
      campaignQuery._id = campaignId
    }

    const campaigns = await Campaign.find(campaignQuery).lean()

    // 2. Fetch customers for organization
    const customerQuery = { organization: orgId, ...dateFilter }
    const customers = await Customer.find(customerQuery).lean()

    // 3. Fetch leads for organization
    const leadQuery = { organization: orgId, ...dateFilter }
    if (campaignId && mongoose.Types.ObjectId.isValid(campaignId)) {
      leadQuery.campaign = campaignId
    }
    const leads = await Lead.find(leadQuery).lean()

    // --- A. Campaign Analytics Aggregation ---
    let totalSpend = 0
    let totalRevenue = 0
    let totalImpressions = 0
    let totalClicks = 0
    let totalConversions = 0

    campaigns.forEach((c) => {
      const spend = c.spent || c.metrics?.spend || 0
      const rev = c.metrics?.revenue || 0
      const imp = c.metrics?.impressions || 0
      const clk = c.metrics?.clicks || 0
      const conv = c.metrics?.conversions || 0

      totalSpend += spend
      totalRevenue += rev
      totalImpressions += imp
      totalClicks += clk
      totalConversions += conv
    })

    const overallCtr = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0
    const overallConversionRate = totalClicks > 0 ? Number(((totalConversions / totalClicks) * 100).toFixed(2)) : 0
    const overallRoi = totalSpend > 0 ? Number((((totalRevenue - totalSpend) / totalSpend) * 100).toFixed(1)) : 0

    // --- B. Customer Analytics Aggregation ---
    const totalCustomers = customers.length
    const newCustomers = customers.filter((c) => c.status === 'new').length
    const activeCustomers = customers.filter((c) => c.status === 'active').length
    const convertedCustomers = customers.filter((c) => c.status === 'converted').length
    const inactiveCustomers = customers.filter((c) => c.status === 'inactive').length
    const totalCustomerSpend = customers.reduce((sum, c) => sum + (c.totalSpend || 0), 0)
    const avgCustomerValue = totalCustomers > 0 ? Math.round(totalCustomerSpend / totalCustomers) : 0

    // Customers by source
    const customerSourceMap = {}
    customers.forEach((c) => {
      const src = c.source || 'Direct'
      customerSourceMap[src] = (customerSourceMap[src] || 0) + 1
    })
    const customersBySource = Object.entries(customerSourceMap).map(([source, count]) => ({
      source,
      count,
    }))

    // --- C. Lead Analytics Aggregation ---
    const totalLeads = leads.length
    const leadStatusMap = {
      new: 0,
      contacted: 0,
      qualified: 0,
      proposal: 0,
      converted: 0,
      lost: 0,
    }
    const leadSourceMap = {}
    let totalPipelineValue = 0

    leads.forEach((l) => {
      if (leadStatusMap[l.status] !== undefined) {
        leadStatusMap[l.status]++
      } else {
        leadStatusMap[l.status] = 1
      }

      const src = l.source || 'Website'
      leadSourceMap[src] = (leadSourceMap[src] || 0) + 1

      if (['new', 'contacted', 'qualified', 'proposal'].includes(l.status)) {
        totalPipelineValue += l.estimatedValue || 0
      }
    })

    const leadsBySource = Object.entries(leadSourceMap).map(([source, count]) => ({
      source,
      count,
    }))

    // Funnel Steps
    const funnel = [
      { step: 'Inbound Leads', count: totalLeads },
      {
        step: 'Contacted',
        count:
          leadStatusMap.contacted +
          leadStatusMap.qualified +
          leadStatusMap.proposal +
          leadStatusMap.converted,
      },
      {
        step: 'Qualified',
        count: leadStatusMap.qualified + leadStatusMap.proposal + leadStatusMap.converted,
      },
      { step: 'Proposal Sent', count: leadStatusMap.proposal + leadStatusMap.converted },
      { step: 'Closed Won', count: leadStatusMap.converted },
    ]

    // --- D. Channel Analytics Aggregation ---
    const channelMap = {}

    // Group campaign metrics by channel
    campaigns.forEach((c) => {
      const ch = c.channel || 'Other'
      if (!channelMap[ch]) {
        channelMap[ch] = {
          channel: ch,
          campaignsCount: 0,
          spend: 0,
          revenue: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          leads: 0,
        }
      }
      channelMap[ch].campaignsCount++
      channelMap[ch].spend += c.spent || c.metrics?.spend || 0
      channelMap[ch].revenue += c.metrics?.revenue || 0
      channelMap[ch].impressions += c.metrics?.impressions || 0
      channelMap[ch].clicks += c.metrics?.clicks || 0
      channelMap[ch].conversions += c.metrics?.conversions || 0
    })

    // Map lead counts by channel if applicable
    leads.forEach((l) => {
      const ch = l.source || 'Other'
      if (channelMap[ch]) {
        channelMap[ch].leads++
      }
    })

    const channelAnalytics = Object.values(channelMap).map((ch) => {
      const roi = ch.spend > 0 ? Number((((ch.revenue - ch.spend) / ch.spend) * 100).toFixed(1)) : 0
      const ctr = ch.impressions > 0 ? Number(((ch.clicks / ch.impressions) * 100).toFixed(2)) : 0
      return {
        ...ch,
        roi,
        ctr,
      }
    })

    // --- E. Shopify E-Commerce Analytics ---
    let shopifyAnalytics = { isConnected: false }
    const shopifyStore = await ShopifyStore.findOne({
      organization: orgId,
      status: { $in: ['connected', 'syncing'] },
    })

    if (shopifyStore) {
      const shopifyOrders = await ShopifyOrder.find({
        organization: orgId,
        financialStatus: { $in: ['PAID', 'PARTIALLY_REFUNDED', 'paid'] },
      }).lean()

      const shopifyRevenue = shopifyOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0)
      const shopifyOrdersCount = shopifyOrders.length
      const aov = shopifyOrdersCount > 0 ? Math.round(shopifyRevenue / shopifyOrdersCount) : 0
      const shopifyCustomersCount = await ShopifyCustomer.countDocuments({ organization: orgId })

      const topProducts = await ShopifyProduct.find({ organization: orgId })
        .sort({ price: -1 })
        .limit(5)
        .lean()

      shopifyAnalytics = {
        isConnected: true,
        shopDomain: shopifyStore.shopDomain,
        shopName: shopifyStore.shopName || shopifyStore.shopDomain,
        currency: shopifyStore.currency || 'INR',
        totalRevenue: shopifyRevenue,
        ordersCount: shopifyOrdersCount,
        aov,
        customersCount: shopifyCustomersCount,
        topProducts: topProducts.map((p) => ({
          id: p._id,
          title: p.title,
          price: p.price,
          vendor: p.vendor,
          totalInventory: p.totalInventory,
        })),
        lastSyncedAt: shopifyStore.lastSyncedAt,
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        filters: {
          dateRange,
          channel: channel || 'all',
          campaignId: campaignId || null,
        },
        campaignAnalytics: {
          totalCampaigns: campaigns.length,
          activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
          totalSpend,
          totalRevenue,
          totalImpressions,
          totalClicks,
          totalConversions,
          ctr: overallCtr,
          conversionRate: overallConversionRate,
          roi: overallRoi,
          campaigns: campaigns.map((c) => ({
            id: c._id,
            name: c.name,
            channel: c.channel,
            status: c.status,
            budget: c.budget,
            spent: c.spent || 0,
            revenue: c.metrics?.revenue || 0,
            impressions: c.metrics?.impressions || 0,
            clicks: c.metrics?.clicks || 0,
            conversions: c.metrics?.conversions || 0,
            roi: c.metrics?.roi || 0,
          })),
        },
        customerAnalytics: {
          totalCustomers,
          newCustomers,
          activeCustomers,
          convertedCustomers,
          inactiveCustomers,
          totalCustomerSpend,
          avgCustomerValue,
          customersBySource,
        },
        leadAnalytics: {
          totalLeads,
          leadStatusMap,
          leadsBySource,
          totalPipelineValue,
          funnel,
        },
        channelAnalytics,
        shopifyAnalytics,
      },
    })
  } catch (err) {
    next(err)
  }
}
