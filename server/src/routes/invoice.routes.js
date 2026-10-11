import { Router } from 'express'
import {
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  issueInvoice,
  voidInvoice,
  recordPayment,
  downloadInvoicePDF,
  deleteInvoice,
  getBillingSummary,
  listRetainers,
  createRetainer,
  updateRetainer,
  getBillingSettings,
  updateBillingSettings,
} from '../controllers/invoice.controller.js'
import { requireAuth, requireRole, requireTenantScope } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireTenantScope)

// Summary & Dashboard
router.get(
  '/summary',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member', 'client'),
  getBillingSummary
)

// Invoices CRUD & Workflow
router.get(
  '/',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member', 'client'),
  listInvoices
)

router.post(
  '/',
  requireRole('super_admin', 'agency_admin', 'account_manager'),
  createInvoice
)

router.get(
  '/:id',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member', 'client'),
  getInvoice
)

router.patch(
  '/:id',
  requireRole('super_admin', 'agency_admin', 'account_manager'),
  updateInvoice
)

router.delete(
  '/:id',
  requireRole('super_admin', 'agency_admin'),
  deleteInvoice
)

// Specialized Invoice Actions
router.post(
  '/:id/issue',
  requireRole('super_admin', 'agency_admin', 'account_manager'),
  issueInvoice
)

router.post(
  '/:id/void',
  requireRole('super_admin', 'agency_admin'),
  voidInvoice
)

router.post(
  '/:id/payments',
  requireRole('super_admin', 'agency_admin', 'account_manager'),
  recordPayment
)

router.get(
  '/:id/pdf',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member', 'client'),
  downloadInvoicePDF
)

// Retainers
router.get(
  '/retainers/list',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member', 'client'),
  listRetainers
)

router.post(
  '/retainers/create',
  requireRole('super_admin', 'agency_admin', 'account_manager'),
  createRetainer
)

router.patch(
  '/retainers/:id',
  requireRole('super_admin', 'agency_admin', 'account_manager'),
  updateRetainer
)

// Organization Billing Settings
router.get(
  '/settings/get',
  requireRole('super_admin', 'agency_admin'),
  getBillingSettings
)

router.put(
  '/settings/update',
  requireRole('super_admin', 'agency_admin'),
  updateBillingSettings
)

export default router
