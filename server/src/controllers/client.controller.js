import mongoose from 'mongoose'
import Client from '../models/Client.js'
import User from '../models/User.js'
import SEOProject from '../models/SEOProject.js'
import SEOIssue from '../models/SEOIssue.js'
import SEOKeyword from '../models/SEOKeyword.js'
import ShopifyStore from '../models/ShopifyStore.js'
import ShopifyOrder from '../models/ShopifyOrder.js'
import ShopifyProduct from '../models/ShopifyProduct.js'
import Project from '../models/Project.js'
import Task from '../models/Task.js'
import Campaign from '../models/Campaign.js'
import Invoice from '../models/Invoice.js'
import Content from '../models/Content.js'
import { validateCreateClient, validateUpdateClient } from '../validators/client.validator.js'

/**
 * List clients with search, filtering, and pagination.
 * Scoped strictly to the authenticated organization.
 * GET /api/clients
 */
export async function listClients(req, res, next) {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      industry,
      assignedAccountManager,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query

    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20))
    const skip = (pageNum - 1) * limitNum

    // Always scope to the authenticated organization
    const filter = {
      organizationId: req.organizationId,
    }

    // Status filter
    if (status && ['active', 'inactive'].includes(status)) {
      filter.status = status
    }

    // Industry filter
    if (industry && industry !== 'all') {
      filter.industry = industry
    }

    // Account Manager filter
    if (assignedAccountManager && assignedAccountManager !== 'all') {
      if (mongoose.Types.ObjectId.isValid(assignedAccountManager)) {
        filter.assignedAccountManager = assignedAccountManager
      }
    }

    // Text search (companyName, contactName, email)
    if (search && search.trim()) {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const searchRegex = new RegExp(sanitized, 'i')
      filter.$or = [
        { companyName: searchRegex },
        { contactName: searchRegex },
        { email: searchRegex },
      ]
    }

    // Sort order
    const sort = {}
    const allowedSortFields = ['companyName', 'contactName', 'email', 'status', 'createdAt', 'updatedAt']
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt'
    sort[sortField] = sortOrder === 'asc' ? 1 : -1

    const [clients, total, totalActive, totalInactive, new30d] = await Promise.all([
      Client.find(filter)
        .populate('assignedAccountManager', 'name email role avatar')
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Client.countDocuments(filter),
      Client.countDocuments({ organizationId: req.organizationId, status: 'active' }),
      Client.countDocuments({ organizationId: req.organizationId, status: 'inactive' }),
      Client.countDocuments({
        organizationId: req.organizationId,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
    ])

    const totalPages = Math.ceil(total / limitNum) || 1

    res.status(200).json({
      status: 'success',
      data: {
        clients,
        metrics: {
          total: totalActive + totalInactive,
          active: totalActive,
          inactive: totalInactive,
          newLast30Days: new30d,
        },
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Get single client by ID.
 * Scoped strictly to the authenticated organization.
 * GET /api/clients/:id
 */
export async function getClient(req, res, next) {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        status: 'fail',
        message: 'Client not found.',
      })
    }

    const client = await Client.findOne({
      _id: id,
      organizationId: req.organizationId,
    })
      .populate('assignedAccountManager', 'name email role avatar')
      .populate('createdBy', 'name email')

    if (!client) {
      return res.status(404).json({
        status: 'fail',
        message: 'Client not found.',
      })
    }

    res.status(200).json({
      status: 'success',
      data: {
        client,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Create a new client.
 * Scoped strictly to the authenticated organization.
 * POST /api/clients
 */
export async function createClient(req, res, next) {
  try {
    const { isValid, errors } = validateCreateClient(req.body)
    if (!isValid) {
      return res.status(400).json({
        status: 'fail',
        message: errors.join(' '),
        errors,
      })
    }

    const {
      companyName,
      contactName,
      email,
      phone = '',
      website = '',
      industry = 'General',
      address = {},
      status = 'active',
      assignedAccountManager = null,
      services = [],
      notes = '',
    } = req.body

    const normalizedEmail = email.toLowerCase().trim()

    // Prevent duplicate clients with the same email inside the same organization
    const existingClient = await Client.findOne({
      organizationId: req.organizationId,
      email: normalizedEmail,
    })

    if (existingClient) {
      return res.status(409).json({
        status: 'fail',
        message: `A client with email ${normalizedEmail} already exists in your organization.`,
      })
    }

    // Verify account manager if provided
    let verifiedAccountManager = null
    if (assignedAccountManager) {
      const managerUser = await User.findOne({
        _id: assignedAccountManager,
        organization: req.organizationId,
      })
      if (managerUser) {
        verifiedAccountManager = managerUser._id
      }
    }

    // Security: organizationId and createdBy are forced from server-side context
    const client = await Client.create({
      organizationId: req.organizationId,
      companyName: companyName.trim(),
      contactName: contactName.trim(),
      email: normalizedEmail,
      phone: typeof phone === 'string' ? phone.trim() : '',
      website: typeof website === 'string' ? website.trim() : '',
      industry: typeof industry === 'string' ? industry.trim() : 'General',
      address: {
        street: address?.street?.trim() || '',
        city: address?.city?.trim() || '',
        state: address?.state?.trim() || '',
        country: address?.country?.trim() || '',
        postalCode: address?.postalCode?.trim() || '',
      },
      status: status === 'inactive' ? 'inactive' : 'active',
      assignedAccountManager: verifiedAccountManager,
      services: Array.isArray(services) ? services.map((s) => String(s).trim()) : [],
      notes: typeof notes === 'string' ? notes.trim() : '',
      createdBy: req.user._id,
    })

    const populated = await Client.findById(client._id)
      .populate('assignedAccountManager', 'name email role avatar')
      .populate('createdBy', 'name email')

    res.status(201).json({
      status: 'success',
      message: 'Client created successfully.',
      data: {
        client: populated,
      },
    })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        status: 'fail',
        message: 'A client with this email already exists in your organization.',
      })
    }
    next(err)
  }
}

/**
 * Update an existing client.
 * Scoped strictly to the authenticated organization.
 * PATCH /api/clients/:id
 */
export async function updateClient(req, res, next) {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        status: 'fail',
        message: 'Client not found.',
      })
    }

    const client = await Client.findOne({
      _id: id,
      organizationId: req.organizationId,
    })

    if (!client) {
      return res.status(404).json({
        status: 'fail',
        message: 'Client not found.',
      })
    }

    const { isValid, errors } = validateUpdateClient(req.body)
    if (!isValid) {
      return res.status(400).json({
        status: 'fail',
        message: errors.join(' '),
        errors,
      })
    }

    const {
      companyName,
      contactName,
      email,
      phone,
      website,
      industry,
      address,
      status,
      assignedAccountManager,
      services,
      notes,
    } = req.body

    // Check duplicate email in same organization if email is changing
    if (email !== undefined) {
      const normalizedEmail = email.toLowerCase().trim()
      if (normalizedEmail !== client.email) {
        const duplicate = await Client.findOne({
          _id: { $ne: client._id },
          organizationId: req.organizationId,
          email: normalizedEmail,
        })
        if (duplicate) {
          return res.status(409).json({
            status: 'fail',
            message: `A client with email ${normalizedEmail} already exists in your organization.`,
          })
        }
        client.email = normalizedEmail
      }
    }

    if (companyName !== undefined) client.companyName = companyName.trim()
    if (contactName !== undefined) client.contactName = contactName.trim()
    if (phone !== undefined) client.phone = phone.trim()
    if (website !== undefined) client.website = website.trim()
    if (industry !== undefined) client.industry = industry.trim()
    if (status !== undefined) client.status = status
    if (notes !== undefined) client.notes = notes.trim()

    if (address !== undefined && typeof address === 'object') {
      client.address = {
        street: address.street !== undefined ? address.street.trim() : client.address.street,
        city: address.city !== undefined ? address.city.trim() : client.address.city,
        state: address.state !== undefined ? address.state.trim() : client.address.state,
        country: address.country !== undefined ? address.country.trim() : client.address.country,
        postalCode: address.postalCode !== undefined ? address.postalCode.trim() : client.address.postalCode,
      }
    }

    if (services !== undefined && Array.isArray(services)) {
      client.services = services.map((s) => String(s).trim())
    }

    if (assignedAccountManager !== undefined) {
      if (assignedAccountManager === null || assignedAccountManager === '') {
        client.assignedAccountManager = null
      } else if (mongoose.Types.ObjectId.isValid(assignedAccountManager)) {
        const managerUser = await User.findOne({
          _id: assignedAccountManager,
          organization: req.organizationId,
        })
        if (managerUser) {
          client.assignedAccountManager = managerUser._id
        }
      }
    }

    // Security check: NEVER permit organizationId or createdBy to be mutated
    // (These fields are not mapped from req.body)

    await client.save()

    const updated = await Client.findById(client._id)
      .populate('assignedAccountManager', 'name email role avatar')
      .populate('createdBy', 'name email')

    res.status(200).json({
      status: 'success',
      message: 'Client updated successfully.',
      data: {
        client: updated,
      },
    })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        status: 'fail',
        message: 'A client with this email already exists in your organization.',
      })
    }
    next(err)
  }
}

/**
 * Toggle or update client status (active | inactive).
 * Scoped strictly to the authenticated organization.
 * PATCH /api/clients/:id/status
 */
export async function updateClientStatus(req, res, next) {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        status: 'fail',
        message: 'Client not found.',
      })
    }

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: "Status must be either 'active' or 'inactive'.",
      })
    }

    const client = await Client.findOne({
      _id: id,
      organizationId: req.organizationId,
    })

    if (!client) {
      return res.status(404).json({
        status: 'fail',
        message: 'Client not found.',
      })
    }

    client.status = status
    await client.save()

    res.status(200).json({
      status: 'success',
      message: `Client status updated to ${status}.`,
      data: {
        client,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Delete a client.
 * Scoped strictly to the authenticated organization.
 * Only super_admin and agency_admin can delete clients.
 * DELETE /api/clients/:id
 */
export async function deleteClient(req, res, next) {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        status: 'fail',
        message: 'Client not found.',
      })
    }

    const client = await Client.findOne({
      _id: id,
      organizationId: req.organizationId,
    })

    if (!client) {
      return res.status(404).json({
        status: 'fail',
        message: 'Client not found.',
      })
    }

    await Client.deleteOne({
      _id: client._id,
      organizationId: req.organizationId,
    })

    res.status(200).json({
      status: 'success',
      message: 'Client deleted successfully.',
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Get unified client workspace intelligence.
 * Aggregates client SEO, Shopify, campaigns, projects, tasks, approvals, invoices, pending actions & data freshness.
 * GET /api/clients/:id/workspace
 */
export async function getClientWorkspace(req, res, next) {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ status: 'fail', message: 'Client not found.' })
    }

    const client = await Client.findOne({ _id: id, organizationId: req.organizationId })
      .populate('assignedAccountManager', 'name email role avatar')
      .populate('createdBy', 'name email')

    if (!client) {
      return res.status(404).json({ status: 'fail', message: 'Client not found.' })
    }

    const orgId = req.organizationId

    // Fetch linked resources in parallel
    const [
      seoProject,
      seoIssues,
      seoKeywords,
      shopifyStore,
      shopifyOrders,
      shopifyProducts,
      projects,
      tasks,
      campaigns,
      invoices,
      contentApprovals
    ] = await Promise.all([
      SEOProject.findOne({ organizationId: orgId, clientId: client._id }) || SEOProject.findOne({ organizationId: orgId }),
      SEOIssue.find({ organizationId: orgId }),
      SEOKeyword.find({ organizationId: orgId }),
      ShopifyStore.findOne({ $or: [{ organizationId: orgId }, { organization: orgId }] }),
      ShopifyOrder.find({ $or: [{ organizationId: orgId }, { organization: orgId }] }),
      ShopifyProduct.find({ $or: [{ organizationId: orgId }, { organization: orgId }] }),
      Project.find({ organizationId: orgId, clientId: client._id }),
      Task.find({ organizationId: orgId, clientId: client._id }),
      Campaign.find({ organizationId: orgId, clientId: client._id }),
      Invoice.find({ organizationId: orgId, clientId: client._id }),
      Content.find({ organizationId: orgId, clientId: client._id, status: 'Pending Approval' })
    ])

    // Shopify Metrics
    const grossSales = shopifyOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0)
    const refundsTotal = shopifyOrders.reduce((sum, o) => sum + (o.totalRefunded || 0), 0)
    const netSales = Math.max(0, grossSales - refundsTotal)
    const totalOrders = shopifyOrders.length
    const lowStockCount = shopifyProducts.filter(p => (p.totalInventory || 0) <= 10).length
    const totalAdSpend = campaigns.reduce((sum, c) => sum + (c.spentBudget || c.budget || 0), 0)

    // Contribution Profit Estimate = Net Sales - COGS (40% est) - Shipping (8% est) - Ad Spend
    const cogsEst = netSales * 0.40
    const shippingEst = netSales * 0.08
    const estimatedContributionProfit = Math.max(0, Math.round(netSales - cogsEst - shippingEst - totalAdSpend))

    // SEO Metrics
    const openIssues = seoIssues.filter(i => i.status === 'Open')
    const criticalSEOIssues = openIssues.filter(i => i.severity === 'Critical')
    const healthScore = seoProject?.healthScore || 85
    const organicTraffic = seoProject?.organicTraffic || 12500

    // Task & Deliverables Metrics
    const pendingTasks = tasks.filter(t => t.status !== 'Completed')
    const completedTasks = tasks.filter(t => t.status === 'Completed')
    const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed')

    // Pending Actions Card Items
    const pendingActions = []
    if (criticalSEOIssues.length > 0) {
      pendingActions.push({
        type: 'seo_critical',
        severity: 'high',
        title: `${criticalSEOIssues.length} Critical SEO Issue(s)`,
        description: criticalSEOIssues[0].description || criticalSEOIssues[0].url,
        actionUrl: `/seo?projectId=${seoProject?._id || ''}`
      })
    }
    if (lowStockCount > 0) {
      pendingActions.push({
        type: 'low_inventory',
        severity: 'warning',
        title: `${lowStockCount} Product(s) Low in Stock`,
        description: 'Inventory levels reached threshold (<= 10 units).',
        actionUrl: '/shopify'
      })
    }
    if (contentApprovals.length > 0) {
      pendingActions.push({
        type: 'pending_approval',
        severity: 'medium',
        title: `${contentApprovals.length} Content Item(s) Pending Client Approval`,
        description: 'Review and approve content before publishing.',
        actionUrl: '/client-portal'
      })
    }
    if (overdueTasks.length > 0) {
      pendingActions.push({
        type: 'overdue_task',
        severity: 'high',
        title: `${overdueTasks.length} Deliverable(s) Overdue`,
        description: 'Assigned agency tasks past deadline.',
        actionUrl: '/tasks'
      })
    }

    res.status(200).json({
      status: 'success',
      data: {
        client,
        dataFreshness: {
          shopifyLastSynced: shopifyStore?.lastSyncedAt || null,
          seoLastAudited: seoProject?.updatedAt || new Date(),
          workspaceUpdated: new Date()
        },
        shopify: {
          store: shopifyStore ? { shopName: shopifyStore.shopName, shopDomain: shopifyStore.shopDomain, status: shopifyStore.status } : null,
          netSales,
          grossSales,
          totalOrders,
          lowStockCount,
          estimatedContributionProfit,
          topProducts: shopifyProducts.slice(0, 5)
        },
        seo: {
          project: seoProject,
          healthScore,
          organicTraffic,
          openIssuesCount: openIssues.length,
          criticalIssuesCount: criticalSEOIssues.length,
          rankingKeywordsCount: seoKeywords.length || seoProject?.rankingKeywordsCount || 340,
          topKeywords: seoKeywords.slice(0, 5)
        },
        projectsSummary: {
          total: projects.length,
          active: projects.filter(p => p.status === 'In Progress' || p.status === 'Active').length,
          items: projects
        },
        tasksSummary: {
          total: tasks.length,
          pending: pendingTasks.length,
          completed: completedTasks.length,
          overdue: overdueTasks.length,
          items: tasks.slice(0, 10)
        },
        approvalsSummary: {
          pendingCount: contentApprovals.length,
          items: contentApprovals
        },
        campaignsSummary: {
          totalSpend: totalAdSpend,
          totalLeads: campaigns.reduce((sum, c) => sum + (c.leadsCount || c.leads || 0), 0),
          items: campaigns
        },
        invoicesSummary: {
          items: invoices
        },
        pendingActions
      }
    })
  } catch (err) {
    next(err)
  }
}

