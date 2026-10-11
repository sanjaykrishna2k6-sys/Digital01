import { Router } from 'express'
import {
  getStoreStatus,
  getStore,
  listProducts,
  getProductById,
  listOrders,
  getOrderById,
  listCustomers,
  getCustomerById,
  initiateConnect,
  handleCallback,
  triggerSync,
  disconnectStore,
  getShopifyAnalytics,
  exportProductsCSV,
  exportOrdersCSV,
} from '../controllers/shopify.controller.js'
import { requireAuth, requireTenantScope, requireRole } from '../middleware/auth.js'

const router = Router()

// All routes require valid session authentication and tenant scoping
router.use(requireAuth, requireTenantScope)

// Public OAuth callback invoked by Shopify redirect
router.get('/callback', handleCallback)

// Store connection status and details
router.get(
  '/status',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member'),
  getStoreStatus
)
router.get(
  '/store',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member'),
  getStore
)
router.get(
  '/analytics',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member'),
  getShopifyAnalytics
)

// Exports
router.get(
  '/products/export',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member'),
  exportProductsCSV
)
router.get(
  '/orders/export',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member'),
  exportOrdersCSV
)

// Products
router.get(
  '/products',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member'),
  listProducts
)
router.get(
  '/products/:id',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member'),
  getProductById
)

// Orders
router.get(
  '/orders',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member'),
  listOrders
)
router.get(
  '/orders/:id',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member'),
  getOrderById
)

// Customers
router.get(
  '/customers',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member'),
  listCustomers
)
router.get(
  '/customers/:id',
  requireRole('super_admin', 'agency_admin', 'account_manager', 'team_member'),
  getCustomerById
)

// Operations
router.get(
  '/connect',
  requireRole('super_admin', 'agency_admin'),
  initiateConnect
)
router.post(
  '/sync',
  requireRole('super_admin', 'agency_admin', 'account_manager'),
  triggerSync
)
router.post(
  '/disconnect',
  requireRole('super_admin', 'agency_admin'),
  disconnectStore
)

export default router
