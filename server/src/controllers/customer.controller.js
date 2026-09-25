import mongoose from 'mongoose'
import Customer from '../models/Customer.js'

/**
 * GET /api/customers
 * List customers belonging to organization with search and status filtering.
 */
export async function getCustomers(req, res, next) {
  try {
    const { search, status } = req.query

    const filter = {
      organization: req.organizationId,
    }

    if (status && status !== 'all') {
      filter.status = status
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i')
      filter.$or = [{ name: searchRegex }, { email: searchRegex }, { company: searchRegex }]
    }

    const customers = await Customer.find(filter)
      .populate('assignedTo', 'name email avatar')
      .sort({ createdAt: -1 })

    res.status(200).json({
      status: 'success',
      results: customers.length,
      data: {
        customers,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/customers/:id
 */
export async function getCustomerById(req, res, next) {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid customer ID format.',
      })
    }

    const customer = await Customer.findOne({
      _id: id,
      organization: req.organizationId,
    }).populate('assignedTo', 'name email avatar role')

    if (!customer) {
      return res.status(404).json({
        status: 'fail',
        message: 'Customer not found in your organization workspace.',
      })
    }

    res.status(200).json({
      status: 'success',
      data: {
        customer,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/customers
 */
export async function createCustomer(req, res, next) {
  try {
    const { name, email, phone, company, source, status, assignedTo, totalSpend } = req.body

    const customer = await Customer.create({
      organization: req.organizationId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : '',
      company: company ? company.trim() : '',
      source: source || 'Website',
      status: status || 'active',
      assignedTo: assignedTo && mongoose.Types.ObjectId.isValid(assignedTo) ? assignedTo : null,
      totalSpend: totalSpend ? Number(totalSpend) : 0,
    })

    const populated = await Customer.findById(customer._id).populate(
      'assignedTo',
      'name email avatar'
    )

    res.status(201).json({
      status: 'success',
      message: 'Customer created successfully.',
      data: {
        customer: populated,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/customers/:id
 */
export async function updateCustomer(req, res, next) {
  try {
    const { id } = req.params

    const customer = await Customer.findOne({
      _id: id,
      organization: req.organizationId,
    })

    if (!customer) {
      return res.status(404).json({
        status: 'fail',
        message: 'Customer not found in your organization workspace.',
      })
    }

    const { name, email, phone, company, source, status, assignedTo, totalSpend } = req.body

    if (name) customer.name = name.trim()
    if (email) customer.email = email.toLowerCase().trim()
    if (phone !== undefined) customer.phone = phone.trim()
    if (company !== undefined) customer.company = company.trim()
    if (source !== undefined) customer.source = source.trim()
    if (status) customer.status = status
    if (assignedTo !== undefined) {
      customer.assignedTo = assignedTo && mongoose.Types.ObjectId.isValid(assignedTo) ? assignedTo : null
    }
    if (totalSpend !== undefined) customer.totalSpend = Number(totalSpend)
    customer.lastActivity = new Date()

    await customer.save()

    const populated = await Customer.findById(customer._id).populate(
      'assignedTo',
      'name email avatar'
    )

    res.status(200).json({
      status: 'success',
      message: 'Customer updated successfully.',
      data: {
        customer: populated,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/customers/:id
 */
export async function deleteCustomer(req, res, next) {
  try {
    const { id } = req.params

    const customer = await Customer.findOneAndDelete({
      _id: id,
      organization: req.organizationId,
    })

    if (!customer) {
      return res.status(404).json({
        status: 'fail',
        message: 'Customer not found in your organization workspace.',
      })
    }

    res.status(200).json({
      status: 'success',
      message: 'Customer deleted successfully.',
    })
  } catch (err) {
    next(err)
  }
}
