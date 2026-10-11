import dotenv from 'dotenv'
dotenv.config()

process.env.NODE_ENV = 'test'

import http from 'http'
import app from '../app.js'
import { connectDB, disconnectDB } from '../config/db.js'
import User from '../models/User.js'
import Organization from '../models/Organization.js'
import Client from '../models/Client.js'
import Invoice from '../models/Invoice.js'
import Retainer from '../models/Retainer.js'
import { generateToken } from '../utils/token.js'

let passedCount = 0
let failedCount = 0
const testResults = []

function assert(condition, testName, details = '') {
  if (condition) {
    passedCount++
    testResults.push({ name: testName, status: 'PASS', details })
    console.log(`  ✓ [PASS] ${testName}`)
  } else {
    failedCount++
    testResults.push({ name: testName, status: 'FAIL', details })
    console.error(`  ✗ [FAIL] ${testName} - ${details}`)
  }
}

async function runTestSuite() {
  console.log('=================================================================')
  console.log('🚀 Running Comprehensive Billing & GST Invoicing Test Suite')
  console.log('=================================================================\n')

  await connectDB()

  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const port = server.address().port
  const baseUrl = `http://127.0.0.1:${port}`

  try {
    const timestamp = Date.now()
    const org = await Organization.create({
      name: `Krishpo Billing Test Org ${timestamp}`,
      plan: 'enterprise',
      status: 'active',
      settings: {
        legalName: 'Krishpo Digital Pvt Ltd',
        gstin: '33AAACK1234F1Z5',
        billingAddress: '100 Tech Park, Chennai',
        state: 'Tamil Nadu',
        stateCode: '33',
        invoicePrefix: 'KRP',
        nextInvoiceNumber: 2001,
      },
    })

    const otherOrg = await Organization.create({
      name: `Other Tenant Org ${timestamp}`,
      plan: 'growth',
      status: 'active',
    })

    const admin = await User.create({
      organization: org._id,
      name: 'Billing Admin',
      email: `admin.billing.${timestamp}@krishpo.com`,
      password: 'Password123!',
      role: 'agency_admin',
      status: 'active',
    })

    const otherAdmin = await User.create({
      organization: otherOrg._id,
      name: 'Other Admin',
      email: `other.admin.${timestamp}@krishpo.com`,
      password: 'Password123!',
      role: 'agency_admin',
      status: 'active',
    })

    const clientRecord = await Client.create({
      organizationId: org._id,
      companyName: 'Global Logistics Corp',
      contactName: 'Bob Smith',
      email: `bob.${timestamp}@globallogistics.com`,
      address: { street: '12 Harbor Rd', city: 'Chennai', state: 'Tamil Nadu', postalCode: '600001' },
      gstin: '33BBBGL9999F1Z1',
      stateCode: '33',
      status: 'active',
      createdBy: admin._id,
    })

    const adminToken = generateToken({
      userId: admin._id,
      organizationId: org._id,
      role: admin.role,
    })
    const otherToken = generateToken({
      userId: otherAdmin._id,
      organizationId: otherOrg._id,
      role: otherAdmin.role,
    })
    const authHeader = { Authorization: `Bearer ${adminToken}` }
    const otherAuthHeader = { Authorization: `Bearer ${otherToken}` }

    // 1. Create Valid Intra-State GST Invoice (CGST + SGST)
    const createRes = await fetch(`${baseUrl}/api/billing/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({
        clientId: clientRecord._id,
        items: [
          { name: 'Google Ads Management', quantity: 1, unitPrice: 10000, discount: 1000, gstRate: 18, sacHsn: '998311' },
        ],
        placeOfSupply: 'Intra-State',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      }),
    })
    const createData = await createRes.json()
    if (!createData.success) {
      console.log('DEBUG CREATE ERROR:', createRes.status, createData)
    }
    const inv1 = createData.data?.invoice
    assert(
      createRes.status === 201 &&
        inv1?.subtotal === 10000 &&
        inv1?.taxableSubtotal === 9000 &&
        inv1?.cgstTotal === 810 &&
        inv1?.sgstTotal === 810 &&
        inv1?.total === 10620,
      '1. Create Intra-State GST invoice calculates CGST (₹810) and SGST (₹810) correctly',
      `Subtotal: ₹${inv1?.subtotal}, Taxable: ₹${inv1?.taxableSubtotal}, CGST: ₹${inv1?.cgstTotal}, SGST: ₹${inv1?.sgstTotal}, Total: ₹${inv1?.total}`
    )

    const invoiceId = inv1?._id

    // 2. Reject request without client
    const noClientRes = await fetch(`${baseUrl}/api/billing/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({
        items: [{ name: 'SEO Retainer', quantity: 1, unitPrice: 5000 }],
      }),
    })
    assert(noClientRes.status === 400, '2. Reject invoice creation without client selection')

    // 3. Reject invoice without line items
    const noItemsRes = await fetch(`${baseUrl}/api/billing/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({
        clientId: clientRecord._id,
        items: [],
      }),
    })
    assert(noItemsRes.status === 400, '3. Reject invoice creation without line items')

    // 4. Calculate Inter-State GST (IGST)
    const igstRes = await fetch(`${baseUrl}/api/billing/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({
        clientId: clientRecord._id,
        items: [{ name: 'Shopify Store Management', quantity: 2, unitPrice: 15000, gstRate: 18 }],
        placeOfSupply: 'Inter-State',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      }),
    })
    const igstData = await igstRes.json()
    const inv2 = igstData.data?.invoice
    // Issue inv2 so it counts as an outstanding receivable
    await fetch(`${baseUrl}/api/billing/invoices/${inv2._id}/issue`, { method: 'POST', headers: { ...authHeader } })
    assert(
      igstRes.status === 201 && inv2?.igstTotal === 5400 && inv2?.cgstTotal === 0 && inv2?.total === 35400,
      '4. Inter-State supply calculates IGST (₹5,400) with 0 CGST/SGST',
      `IGST: ₹${inv2?.igstTotal}, Total: ₹${inv2?.total}`
    )

    // 5. Prevent duplicate invoice numbers
    const dupRes = await fetch(`${baseUrl}/api/billing/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({
        clientId: clientRecord._id,
        invoiceNumber: inv1.invoiceNumber,
        items: [{ name: 'Service', quantity: 1, unitPrice: 1000 }],
      }),
    })
    assert(dupRes.status === 400, '5. Reject duplicate invoice number')

    // 6. Tenant isolation (cross-organization access check)
    const crossRes = await fetch(`${baseUrl}/api/billing/invoices/${invoiceId}`, {
      method: 'GET',
      headers: { ...otherAuthHeader },
    })
    assert(crossRes.status === 404, '6. Tenant isolation prevents cross-organization invoice access')

    // 7. Issue Invoice
    const issueRes = await fetch(`${baseUrl}/api/billing/invoices/${invoiceId}/issue`, {
      method: 'POST',
      headers: { ...authHeader },
    })
    const issueData = await issueRes.json()
    assert(issueRes.status === 200 && issueData.data?.invoice?.status === 'Issued', '7. Issue draft invoice')

    // 8. Record Partial Payment
    const partPayRes = await fetch(`${baseUrl}/api/billing/invoices/${invoiceId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({
        amount: 5000,
        method: 'Bank Transfer',
        referenceNumber: 'TXN-998811',
      }),
    })
    const partPayData = await partPayRes.json()
    const invPart = partPayData.data?.invoice
    assert(
      partPayRes.status === 200 && invPart?.amountPaid === 5000 && invPart?.balanceDue === 5620 && invPart?.status === 'Partially Paid',
      '8. Record partial payment (₹5,000) updates amountPaid, balanceDue (₹5,620) and status',
      `Balance Due: ₹${invPart?.balanceDue}`
    )

    // 9. Record Final Payment (Full Balance Paid)
    const finalPayRes = await fetch(`${baseUrl}/api/billing/invoices/${invoiceId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({
        amount: 5620,
        method: 'UPI',
        referenceNumber: 'UPI-774411',
      }),
    })
    const finalPayData = await finalPayRes.json()
    const invPaid = finalPayData.data?.invoice
    assert(
      finalPayRes.status === 200 && invPaid?.amountPaid === 10620 && invPaid?.balanceDue === 0 && invPaid?.status === 'Paid',
      '9. Final payment sets balanceDue to 0 and status to Paid',
      `Status: ${invPaid?.status}, Balance: ₹${invPaid?.balanceDue}`
    )

    // 10. Generate PDF Download
    const pdfRes = await fetch(`${baseUrl}/api/billing/invoices/${invoiceId}/pdf`, {
      method: 'GET',
      headers: { ...authHeader },
    })
    const pdfContentType = pdfRes.headers.get('content-type')
    assert(pdfRes.status === 200 && pdfContentType === 'application/pdf', '10. Generate downloadable PDF returns application/pdf content type')

    // 11. Create Retainer Agreement
    const retainerRes = await fetch(`${baseUrl}/api/billing/retainers/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({
        clientId: clientRecord._id,
        agreementTitle: 'SEO & Content Monthly Retainer',
        monthlyAmount: 45000,
        billingFrequency: 'Monthly',
        services: ['SEO Monthly Retainer', 'Content Creation'],
      }),
    })
    const retainerData = await retainerRes.json()
    assert(
      retainerRes.status === 201 && retainerData.data?.retainer?.monthlyAmount === 45000,
      '11. Create Retainer Agreement for client',
      `Monthly MRR: ₹${retainerData.data?.retainer?.monthlyAmount}`
    )

    // 12. Billing Dashboard Summary
    const summaryRes = await fetch(`${baseUrl}/api/billing/summary`, {
      method: 'GET',
      headers: { ...authHeader },
    })
    const summaryData = await summaryRes.json()
    const sum = summaryData.data?.summary
    assert(
      summaryRes.status === 200 && sum?.totalCollected === 10620 && sum?.totalOutstanding === 35400 && sum?.retainerMRR === 45000,
      '12. Billing Dashboard summary accurately aggregates collected, outstanding, and retainer MRR figures',
      `Collected: ₹${sum?.totalCollected}, Outstanding: ₹${sum?.totalOutstanding}, Retainer MRR: ₹${sum?.retainerMRR}`
    )
  } catch (err) {
    console.error('Fatal test error:', err)
  } finally {
    server.close()
    await disconnectDB()

    console.log('\n=================================================================')
    console.log(`Billing Test Results Summary: ${passedCount}/${passedCount + failedCount} Passed, ${failedCount} Failed`)
    console.log('=================================================================\n')
    process.exit(failedCount > 0 ? 1 : 0)
  }
}

runTestSuite()
