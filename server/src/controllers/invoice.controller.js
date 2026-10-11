import Invoice from '../models/Invoice.js'
import Client from '../models/Client.js'
import Organization from '../models/Organization.js'
import Retainer from '../models/Retainer.js'
import { generateInvoicePDF } from '../services/pdfGenerator.service.js'

/**
 * Perform server-side GST recalculation
 */
function calculateGSTInvoice(data, client, organization) {
  const isGST = data.isGSTApplicable !== false
  const placeOfSupply = data.placeOfSupply || 'Intra-State'

  let subtotal = 0
  let totalDiscount = 0
  let taxableSubtotal = 0
  let cgstTotal = 0
  let sgstTotal = 0
  let igstTotal = 0

  const calculatedItems = (data.items || []).map((item) => {
    const qty = Number(item.quantity) || 1
    const price = Number(item.unitPrice) || 0
    const disc = Number(item.discount) || 0
    const rawTaxable = Math.max(0, qty * price - disc)
    const gstRate = isGST ? Number(item.gstRate ?? 18) : 0

    let cgst = 0
    let sgst = 0
    let igst = 0

    if (isGST && gstRate > 0) {
      const gstAmount = (rawTaxable * gstRate) / 100
      if (placeOfSupply === 'Inter-State') {
        igst = Math.round(gstAmount * 100) / 100
      } else {
        cgst = Math.round((gstAmount / 2) * 100) / 100
        sgst = Math.round((gstAmount / 2) * 100) / 100
      }
    }

    const lineTotal = Math.round((rawTaxable + cgst + sgst + igst) * 100) / 100

    subtotal += qty * price
    totalDiscount += disc
    taxableSubtotal += rawTaxable
    cgstTotal += cgst
    sgstTotal += sgst
    igstTotal += igst

    return {
      serviceId: item.serviceId || null,
      name: item.name || item.description || 'Service',
      description: item.description || '',
      sacHsn: item.sacHsn || '998311',
      quantity: qty,
      unit: item.unit || 'Month',
      unitPrice: price,
      discount: disc,
      taxableAmount: Math.round(rawTaxable * 100) / 100,
      gstRate,
      cgst,
      sgst,
      igst,
      lineTotal,
      amount: lineTotal,
    }
  })

  subtotal = Math.round(subtotal * 100) / 100
  totalDiscount = Math.round(totalDiscount * 100) / 100
  taxableSubtotal = Math.round(taxableSubtotal * 100) / 100
  cgstTotal = Math.round(cgstTotal * 100) / 100
  sgstTotal = Math.round(sgstTotal * 100) / 100
  igstTotal = Math.round(igstTotal * 100) / 100

  const taxSum = cgstTotal + sgstTotal + igstTotal
  const rawTotal = taxableSubtotal + taxSum
  const total = Math.round(rawTotal * 100) / 100
  const roundOff = Math.round((total - rawTotal) * 100) / 100

  return {
    items: calculatedItems,
    subtotal,
    totalDiscount,
    taxableSubtotal,
    cgstTotal,
    sgstTotal,
    igstTotal,
    tax: taxSum,
    roundOff,
    total,
    balanceDue: total,
    clientSnapshot: {
      companyName: client?.companyName || '',
      contactName: client?.contactName || '',
      email: client?.email || '',
      phone: client?.phone || '',
      billingAddress: client?.address ? `${client.address.street || ''} ${client.address.city || ''} ${client.address.state || ''}`.trim() : '',
      gstin: client?.gstin || '',
      state: client?.address?.state || '',
      stateCode: client?.stateCode || '',
    },
    organizationSnapshot: {
      legalName: organization?.settings?.legalName || organization?.name || 'Krishpo Marketing Agency',
      billingAddress: organization?.settings?.billingAddress || '',
      gstin: organization?.settings?.gstin || '',
      state: organization?.settings?.state || 'Tamil Nadu',
      stateCode: organization?.settings?.stateCode || '33',
      phone: organization?.settings?.phone || '',
      email: organization?.settings?.email || '',
      bankDetails: organization?.settings?.bankDetails || {},
    },
  }
}

/**
 * Generate Next Sequential Invoice Number for Organization
 */
async function getNextInvoiceNumber(organizationId) {
  const org = await Organization.findById(organizationId)
  const prefix = org?.settings?.invoicePrefix || 'INV'
  let nextNum = org?.settings?.nextInvoiceNumber || 1001

  let candidate = `${prefix}-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`

  // Ensure uniqueness
  while (await Invoice.findOne({ organizationId, invoiceNumber: candidate })) {
    nextNum++
    candidate = `${prefix}-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`
  }

  // Update organization next number
  if (org) {
    org.settings.nextInvoiceNumber = nextNum + 1
    await org.save()
  }

  return candidate
}

// ----------------------------------------------------
// CONTROLLER HANDLERS
// ----------------------------------------------------

/**
 * List Invoices with search and filters
 */
export async function listInvoices(req, res) {
  try {
    const { status, search, clientId, page = 1, limit = 20 } = req.query
    const query = { organizationId: req.organizationId }

    if (status && status !== 'all') {
      query.status = status
    }

    if (clientId) {
      query.clientId = clientId
    }

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'clientSnapshot.companyName': { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ]
    }

    const skip = (Number(page) - 1) * Number(limit)

    const [invoices, totalCount] = await Promise.all([
      Invoice.find(query)
        .populate('clientId', 'companyName contactName email gstin')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Invoice.countDocuments(query),
    ])

    return res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          total: totalCount,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(totalCount / Number(limit)) || 1,
        },
      },
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * Get Single Invoice
 */
export async function getInvoice(req, res) {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    })
      .populate('clientId')
      .populate('createdBy', 'name email')

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' })
    }

    return res.json({ success: true, data: { invoice } })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * Create Invoice
 */
export async function createInvoice(req, res) {
  try {
    const { clientId, items, dueDate, invoiceNumber, paymentTerms, placeOfSupply, notes, termsAndConditions, invoiceType, isGSTApplicable } = req.body

    if (!clientId) {
      return res.status(400).json({ success: false, message: 'Client selection is required' })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one line item is required' })
    }

    const client = await Client.findOne({ _id: clientId, organizationId: req.organizationId })
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found in organization' })
    }

    const organization = await Organization.findById(req.organizationId)

    const calculated = calculateGSTInvoice({ items, isGSTApplicable, placeOfSupply }, client, organization)

    const finalInvoiceNumber = invoiceNumber && invoiceNumber.trim() ? invoiceNumber.trim() : await getNextInvoiceNumber(req.organizationId)

    // Check duplicate invoice number
    const existing = await Invoice.findOne({ organizationId: req.organizationId, invoiceNumber: finalInvoiceNumber })
    if (existing) {
      return res.status(400).json({ success: false, message: `Invoice number ${finalInvoiceNumber} already exists.` })
    }

    const newInvoice = new Invoice({
      organizationId: req.organizationId,
      clientId,
      invoiceNumber: finalInvoiceNumber,
      invoiceType: invoiceType || 'Tax Invoice',
      currency: 'INR',
      invoiceDate: req.body.invoiceDate || new Date(),
      dueDate: dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      paymentTerms: paymentTerms || '15 Days',
      placeOfSupply: placeOfSupply || 'Intra-State',
      isGSTApplicable: isGSTApplicable !== false,
      reverseCharge: req.body.reverseCharge || false,
      clientSnapshot: calculated.clientSnapshot,
      organizationSnapshot: calculated.organizationSnapshot,
      items: calculated.items,
      subtotal: calculated.subtotal,
      totalDiscount: calculated.totalDiscount,
      taxableSubtotal: calculated.taxableSubtotal,
      cgstTotal: calculated.cgstTotal,
      sgstTotal: calculated.sgstTotal,
      igstTotal: calculated.igstTotal,
      tax: calculated.tax,
      roundOff: calculated.roundOff,
      total: calculated.total,
      amountPaid: 0,
      balanceDue: calculated.total,
      status: req.body.status || 'Draft',
      paymentStatus: 'Unpaid',
      notes: notes || organization?.settings?.defaultNotes || '',
      termsAndConditions: termsAndConditions || organization?.settings?.defaultTerms || '',
      createdBy: req.user._id,
    })

    await newInvoice.save()

    return res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: { invoice: newInvoice },
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * Update Draft Invoice
 */
export async function updateInvoice(req, res) {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, organizationId: req.organizationId })
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' })
    }

    if (invoice.status !== 'Draft') {
      return res.status(400).json({ success: false, message: 'Only Draft invoices can be modified directly.' })
    }

    const { items, clientId, dueDate, paymentTerms, placeOfSupply, notes, termsAndConditions, status } = req.body

    if (clientId) {
      const client = await Client.findOne({ _id: clientId, organizationId: req.organizationId })
      if (client) invoice.clientId = clientId
    }

    if (items && Array.isArray(items)) {
      const client = await Client.findById(invoice.clientId)
      const organization = await Organization.findById(req.organizationId)
      const calculated = calculateGSTInvoice({ items, placeOfSupply: placeOfSupply || invoice.placeOfSupply }, client, organization)

      invoice.items = calculated.items
      invoice.subtotal = calculated.subtotal
      invoice.totalDiscount = calculated.totalDiscount
      invoice.taxableSubtotal = calculated.taxableSubtotal
      invoice.cgstTotal = calculated.cgstTotal
      invoice.sgstTotal = calculated.sgstTotal
      invoice.igstTotal = calculated.igstTotal
      invoice.tax = calculated.tax
      invoice.total = calculated.total
      invoice.balanceDue = calculated.total - invoice.amountPaid
    }

    if (dueDate) invoice.dueDate = dueDate
    if (paymentTerms) invoice.paymentTerms = paymentTerms
    if (placeOfSupply) invoice.placeOfSupply = placeOfSupply
    if (notes !== undefined) invoice.notes = notes
    if (termsAndConditions !== undefined) invoice.termsAndConditions = termsAndConditions
    if (status) invoice.status = status

    await invoice.save()

    return res.json({ success: true, message: 'Invoice updated', data: { invoice } })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * Issue Invoice
 */
export async function issueInvoice(req, res) {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, organizationId: req.organizationId })
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' })
    }

    invoice.status = 'Issued'
    await invoice.save()

    return res.json({ success: true, message: 'Invoice issued successfully', data: { invoice } })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * Void Invoice
 */
export async function voidInvoice(req, res) {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, organizationId: req.organizationId })
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' })
    }

    invoice.status = 'Void'
    await invoice.save()

    return res.json({ success: true, message: 'Invoice voided successfully', data: { invoice } })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * Record Payment
 */
export async function recordPayment(req, res) {
  try {
    const { amount, date, method, referenceNumber, notes } = req.body
    const pAmount = Number(amount)

    if (!pAmount || pAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than 0' })
    }

    const invoice = await Invoice.findOne({ _id: req.params.id, organizationId: req.organizationId })
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' })
    }

    if (invoice.status === 'Void') {
      return res.status(400).json({ success: false, message: 'Cannot record payment for a voided invoice' })
    }

    if (pAmount > invoice.balanceDue + 0.01) {
      return res.status(400).json({ success: false, message: `Payment amount (₹${pAmount}) cannot exceed remaining balance (₹${invoice.balanceDue})` })
    }

    invoice.payments.push({
      amount: pAmount,
      date: date || new Date(),
      method: method || 'Bank Transfer',
      referenceNumber: referenceNumber || '',
      notes: notes || '',
      recordedBy: req.user._id,
    })

    invoice.amountPaid = Math.round((invoice.amountPaid + pAmount) * 100) / 100
    invoice.balanceDue = Math.max(0, Math.round((invoice.total - invoice.amountPaid) * 100) / 100)

    if (invoice.balanceDue === 0) {
      invoice.paymentStatus = 'Paid'
      invoice.status = 'Paid'
    } else {
      invoice.paymentStatus = 'Partially Paid'
      invoice.status = 'Partially Paid'
    }

    await invoice.save()

    return res.json({ success: true, message: 'Payment recorded successfully', data: { invoice } })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * Download Invoice PDF
 */
export async function downloadInvoicePDF(req, res) {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, organizationId: req.organizationId })
      .populate('clientId')
      .populate('organizationId')

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' })
    }

    const pdfBuffer = await generateInvoicePDF(invoice)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber || 'Invoice'}.pdf"`)
    return res.send(pdfBuffer)
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * Delete Invoice
 */
export async function deleteInvoice(req, res) {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, organizationId: req.organizationId })
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' })
    }
    return res.json({ success: true, message: 'Invoice deleted successfully' })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * Billing Summary & Dashboard Metrics
 */
export async function getBillingSummary(req, res) {
  try {
    const invoices = await Invoice.find({ organizationId: req.organizationId })
    const retainers = await Retainer.find({ organizationId: req.organizationId, status: 'Active' })

    let totalOutstanding = 0
    let totalCollected = 0
    let draftCount = 0
    let overdueCount = 0
    let paidCount = 0
    let totalInvoices = invoices.length

    const now = new Date()

    invoices.forEach((inv) => {
      if (inv.status === 'Draft') {
        draftCount++
      } else if (inv.status === 'Void') {
        // Exclude void
      } else {
        totalCollected += inv.amountPaid || 0
        if (inv.balanceDue > 0) {
          totalOutstanding += inv.balanceDue
          if (new Date(inv.dueDate) < now && inv.status !== 'Paid') {
            overdueCount++
          }
        } else if (inv.status === 'Paid') {
          paidCount++
        }
      }
    })

    const retainerMRR = retainers.reduce((sum, r) => sum + (r.monthlyAmount || 0), 0)

    return res.json({
      success: true,
      data: {
        summary: {
          totalOutstanding: Math.round(totalOutstanding * 100) / 100,
          totalCollected: Math.round(totalCollected * 100) / 100,
          totalInvoices,
          draftCount,
          overdueCount,
          paidCount,
          activeRetainersCount: retainers.length,
          retainerMRR: Math.round(retainerMRR * 100) / 100,
        },
      },
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

// ----------------------------------------------------
// RETAINER HANDLERS
// ----------------------------------------------------
export async function listRetainers(req, res) {
  try {
    const retainers = await Retainer.find({ organizationId: req.organizationId })
      .populate('clientId', 'companyName contactName email')
      .sort({ createdAt: -1 })
    return res.json({ success: true, data: { retainers } })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export async function createRetainer(req, res) {
  try {
    const { clientId, agreementTitle, monthlyAmount, billingFrequency, startDate, endDate, paymentTerms, services, notes } = req.body

    if (!clientId || !agreementTitle || !monthlyAmount) {
      return res.status(400).json({ success: false, message: 'Client, Agreement Title, and Monthly Amount are required' })
    }

    const retainer = new Retainer({
      organizationId: req.organizationId,
      clientId,
      agreementTitle,
      monthlyAmount: Number(monthlyAmount),
      billingFrequency: billingFrequency || 'Monthly',
      startDate: startDate || new Date(),
      endDate,
      paymentTerms: paymentTerms || '7 Days',
      services: services || [],
      notes: notes || '',
      createdBy: req.user._id,
    })

    await retainer.save()
    return res.status(201).json({ success: true, message: 'Retainer agreement created', data: { retainer } })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export async function updateRetainer(req, res) {
  try {
    const retainer = await Retainer.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.organizationId },
      { $set: req.body },
      { new: true }
    )
    if (!retainer) {
      return res.status(404).json({ success: false, message: 'Retainer not found' })
    }
    return res.json({ success: true, message: 'Retainer updated', data: { retainer } })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

// ----------------------------------------------------
// ORGANIZATION BILLING SETTINGS HANDLERS
// ----------------------------------------------------
export async function getBillingSettings(req, res) {
  try {
    const org = await Organization.findById(req.organizationId)
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' })
    return res.json({ success: true, data: { settings: org.settings || {} } })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export async function updateBillingSettings(req, res) {
  try {
    const org = await Organization.findById(req.organizationId)
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' })

    org.settings = { ...org.settings, ...req.body }
    await org.save()

    return res.json({ success: true, message: 'Billing settings updated successfully', data: { settings: org.settings } })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
