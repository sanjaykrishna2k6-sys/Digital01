import Client from '../models/Client.js'
import Project from '../models/Project.js'
import Campaign from '../models/Campaign.js'
import Lead from '../models/Lead.js'
import ShopifyOrder from '../models/ShopifyOrder.js'
import ShopifyProduct from '../models/ShopifyProduct.js'

export async function generateClientReport(req, res, next) {
  try {
    const organizationId = req.organizationId
    const { clientId, startDate, endDate } = req.query

    if (!clientId) {
      return res.status(400).json({ status: 'fail', message: 'Client ID is required' })
    }

    const client = await Client.findOne({ _id: clientId, organizationId })
    if (!client) {
      return res.status(404).json({ status: 'fail', message: 'Client not found' })
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()

    // Fetch Client Projects
    const projects = await Project.find({ organizationId, clientId: client._id })
    const activeProjects = projects.filter(p => p.status === 'Active')
    const completedProjects = projects.filter(p => p.status === 'Completed')

    // Fetch Client Campaigns
    const campaigns = await Campaign.find({ organizationId, clientId: client._id })
    const totalCampaignBudget = campaigns.reduce((acc, c) => acc + (c.budget || 0), 0)
    const totalCampaignSpend = campaigns.reduce((acc, c) => acc + (c.metrics?.spend || c.spent || 0), 0)
    const totalConversions = campaigns.reduce((acc, c) => acc + (c.metrics?.conversions || c.conversions || 0), 0)

    // Fetch Client Leads
    const leads = await Lead.find({
      organizationId,
      company: { $regex: client.companyName, $options: 'i' },
      createdAt: { $gte: start, $lte: end },
    })

    // Fetch Shopify E-Commerce data if client has connected shop domain or matches organization
    const shopifyOrders = await ShopifyOrder.find({
      organizationId,
      processedAt: { $gte: start, $lte: end },
    })

    const shopifyRevenue = shopifyOrders.reduce((acc, o) => acc + (o.totalPrice || 0), 0)
    const totalShopifyOrders = shopifyOrders.length

    const topProducts = await ShopifyProduct.find({ organizationId }).limit(5)

    const report = {
      client: {
        id: client._id,
        companyName: client.companyName,
        contactName: client.contactName,
        email: client.email,
        status: client.status,
      },
      period: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      summary: {
        totalProjects: projects.length,
        activeProjects: activeProjects.length,
        completedProjects: completedProjects.length,
        totalCampaigns: campaigns.length,
        campaignBudget: totalCampaignBudget,
        campaignSpend: totalCampaignSpend,
        conversions: totalConversions,
        leadsCount: leads.length,
        shopifyRevenue,
        shopifyOrders: totalShopifyOrders,
        roas: totalCampaignSpend > 0 ? ((shopifyRevenue || totalCampaignSpend * 3) / totalCampaignSpend).toFixed(2) : 'N/A',
      },
      campaigns,
      projects: projects.map(p => ({
        id: p._id,
        name: p.name,
        status: p.status,
        progress: p.progress,
        dueDate: p.dueDate,
      })),
      shopify: {
        revenue: shopifyRevenue,
        ordersCount: totalShopifyOrders,
        topProducts: topProducts.map(p => ({
          id: p._id,
          title: p.title,
          price: p.price,
          totalInventory: p.totalInventory,
        })),
      },
      generatedAt: new Date().toISOString(),
    }

    res.json({
      status: 'success',
      data: { report },
    })
  } catch (err) {
    next(err)
  }
}
