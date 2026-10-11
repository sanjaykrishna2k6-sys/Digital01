import mongoose from 'mongoose'
import Automation from '../models/Automation.js'
import SEOIssue from '../models/SEOIssue.js'
import ShopifyProduct from '../models/ShopifyProduct.js'
import ShopifyStore from '../models/ShopifyStore.js'
import Task from '../models/Task.js'
import Notification from '../models/Notification.js'
import SEOReport from '../models/SEOReport.js'
import Client from '../models/Client.js'

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id)

/**
 * List automation rules for authenticated organization.
 * GET /api/automations
 */
export async function listAutomations(req, res, next) {
  try {
    const { triggerType, status, clientId } = req.query
    const filter = { organizationId: req.organizationId }

    if (triggerType && triggerType !== 'all') filter.triggerType = triggerType
    if (status && status !== 'all') filter.status = status
    if (clientId && isValidId(clientId)) filter.clientId = clientId

    const automations = await Automation.find(filter)
      .populate('clientId', 'companyName contactName')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })

    res.status(200).json({
      status: 'success',
      results: automations.length,
      data: { automations },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Create a new automation rule.
 * POST /api/automations
 */
export async function createAutomation(req, res, next) {
  try {
    const { name, triggerType, clientId, conditions, actions, status } = req.body

    if (!name || !triggerType) {
      return res.status(400).json({
        status: 'fail',
        message: 'Name and triggerType are required.',
      })
    }

    const automation = await Automation.create({
      organizationId: req.organizationId,
      clientId: clientId && isValidId(clientId) ? clientId : null,
      name: name.trim(),
      triggerType,
      conditions: conditions || {},
      actions: actions || {},
      status: status === 'paused' ? 'paused' : 'active',
      createdBy: req.user._id,
    })

    const populated = await Automation.findById(automation._id).populate('clientId', 'companyName contactName')

    res.status(201).json({
      status: 'success',
      message: 'Automation rule created successfully.',
      data: { automation: populated },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Update an automation rule.
 * PATCH /api/automations/:id
 */
export async function updateAutomation(req, res, next) {
  try {
    const { id } = req.params
    if (!isValidId(id)) return res.status(400).json({ status: 'fail', message: 'Invalid automation ID.' })

    const automation = await Automation.findOne({ _id: id, organizationId: req.organizationId })
    if (!automation) return res.status(404).json({ status: 'fail', message: 'Automation rule not found.' })

    const fields = ['name', 'triggerType', 'conditions', 'actions', 'status', 'clientId']
    fields.forEach((f) => {
      if (req.body[f] !== undefined) automation[f] = req.body[f]
    })

    await automation.save()
    const updated = await Automation.findById(automation._id).populate('clientId', 'companyName contactName')

    res.status(200).json({
      status: 'success',
      message: 'Automation rule updated.',
      data: { automation: updated },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Delete an automation rule.
 * DELETE /api/automations/:id
 */
export async function deleteAutomation(req, res, next) {
  try {
    const { id } = req.params
    if (!isValidId(id)) return res.status(400).json({ status: 'fail', message: 'Invalid automation ID.' })

    const automation = await Automation.findOneAndDelete({ _id: id, organizationId: req.organizationId })
    if (!automation) return res.status(404).json({ status: 'fail', message: 'Automation rule not found.' })

    res.status(200).json({
      status: 'success',
      message: 'Automation rule deleted.',
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Run / execute automation routines for organization (idempotent background engine trigger).
 * POST /api/automations/run
 */
export async function triggerAutomationEngine(req, res, next) {
  try {
    const orgId = req.organizationId
    const rules = await Automation.find({ organizationId: orgId, status: 'active' })

    const results = []

    // 1. Process Low Inventory Alerts
    const lowStockProducts = await ShopifyProduct.find({
      $or: [{ organizationId: orgId }, { organization: orgId }],
      totalInventory: { $gt: 0, $lte: 10 },
    })

    if (lowStockProducts.length > 0) {
      // Check or create notification
      const existingNotif = await Notification.findOne({
        organizationId: orgId,
        type: 'low_inventory_alert',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      })

      if (!existingNotif) {
        await Notification.create({
          organizationId: orgId,
          userId: req.user._id,
          type: 'low_inventory_alert',
          title: 'Low Inventory Alert',
          message: `${lowStockProducts.length} Shopify products have inventory below 10 units.`,
          link: '/shopify',
        })
        results.push({ rule: 'Low Inventory Alert', status: 'Triggered', item: `${lowStockProducts.length} items low in stock` })
      }
    }

    // 2. Process Critical SEO Issue Task Auto-Assignments
    const criticalIssues = await SEOIssue.find({
      organizationId: orgId,
      severity: 'Critical',
      status: 'Open',
    })

    let tasksCreatedCount = 0
    for (const issue of criticalIssues) {
      // Idempotency check: see if task already exists for this issue
      const existingTask = await Task.findOne({
        organizationId: orgId,
        description: { $regex: issue.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' },
      })

      if (!existingTask) {
        await Task.create({
          organizationId: orgId,
          title: `[SEO Alert] Fix ${issue.issueType} on ${issue.url}`,
          description: `Critical SEO Issue Detected:\nURL: ${issue.url}\nRecommendation: ${issue.recommendation || issue.description}`,
          priority: 'High',
          status: 'To Do',
          taskType: 'SEO',
          assignedTo: req.user._id,
          createdBy: req.user._id,
        })
        tasksCreatedCount++
      }
    }

    if (tasksCreatedCount > 0) {
      results.push({ rule: 'SEO Critical Issue Task Creator', status: 'Triggered', item: `Created ${tasksCreatedCount} tasks for critical SEO issues` })
    }

    // 3. Process Sync Failure Notifications
    const store = await ShopifyStore.findOne({
      $or: [{ organizationId: orgId }, { organization: orgId }],
      status: 'error',
    })

    if (store) {
      const existingNotif = await Notification.findOne({
        organizationId: orgId,
        type: 'sync_failure_alert',
        createdAt: { $gte: new Date(Date.now() - 12 * 60 * 60 * 1000) },
      })

      if (!existingNotif) {
        await Notification.create({
          organizationId: orgId,
          userId: req.user._id,
          type: 'sync_failure_alert',
          title: 'Shopify Sync Failure',
          message: `Store connection error: ${store.syncStatus?.lastError || 'Credentials require re-authorization.'}`,
          link: '/integrations',
        })
        results.push({ rule: 'Sync Failure Alert', status: 'Triggered', item: store.shopDomain })
      }
    }

    // Update execution history on active rules
    for (const rule of rules) {
      rule.lastTriggeredAt = new Date()
      rule.executionCount += 1
      rule.executionHistory.push({
        triggeredAt: new Date(),
        status: 'success',
        details: `Routine check executed. Identified ${results.length} active triggers.`,
      })
      if (rule.executionHistory.length > 20) rule.executionHistory.shift()
      await rule.save()
    }

    res.status(200).json({
      status: 'success',
      message: 'Automation engine routines executed successfully.',
      data: {
        activeRulesCount: rules.length,
        triggersFired: results,
      },
    })
  } catch (err) {
    next(err)
  }
}
