import { Router } from 'express'
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customer.controller.js'
import { requireAuth, requireTenantScope } from '../middleware/auth.js'
import { validateCustomer } from '../validators/customer.validator.js'

const router = Router()

router.use(requireAuth, requireTenantScope)

router.get('/', getCustomers)
router.get('/:id', getCustomerById)
router.post('/', validateCustomer, createCustomer)
router.patch('/:id', validateCustomer, updateCustomer)
router.delete('/:id', deleteCustomer)

export default router
