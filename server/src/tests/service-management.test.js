import dotenv from 'dotenv'
dotenv.config()

process.env.NODE_ENV = 'test'
process.env.PATH = "C:\\Users\\Sanja\\AppData\\Local\\OpenAI\\Codex\\runtimes\\cua_node\\154806497bb51bae\\bin;" + process.env.PATH

import http from 'http'
import app from '../app.js'
import { connectDB, disconnectDB } from '../config/db.js'
import User from '../models/User.js'
import Organization from '../models/Organization.js'
import Service from '../models/Service.js'
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
  console.log('🚀 Running Services Management Test Suite')
  console.log('=================================================================\n')

  await connectDB()

  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const port = server.address().port
  const baseUrl = `http://127.0.0.1:${port}`

  try {
    const timestamp = Date.now()
    const org = await Organization.create({
      name: `Service Test Org ${timestamp}`,
      plan: 'enterprise',
      status: 'active',
    })

    const admin = await User.create({
      organization: org._id,
      name: 'Service Admin',
      email: `admin.service.${timestamp}@scalevo.io`,
      password: 'Password123!',
      role: 'agency_admin',
      status: 'active',
    })

    const adminToken = generateToken({
      userId: admin._id,
      organizationId: org._id,
      role: admin.role,
    })
    const adminCookie = `scalevo_token=${adminToken}`

    // Test 1: Create Service
    const createRes = await fetch(`${baseUrl}/api/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        name: 'SEO Audit & Optimization',
        description: 'Comprehensive SEO analysis and monthly optimization',
        category: 'SEO',
        price: 1500,
        billingType: 'monthly',
      }),
    })
    const createData = await createRes.json()
    assert(
      createRes.status === 201 && createData.data?.service?.name === 'SEO Audit & Optimization',
      '1. Agency admin can create a new service',
      `HTTP ${createRes.status}`
    )

    const serviceId = createData.data?.service?._id

    // Test 2: List Services
    const listRes = await fetch(`${baseUrl}/api/services`, {
      method: 'GET',
      headers: { Cookie: adminCookie },
    })
    const listData = await listRes.json()
    assert(
      listRes.status === 200 && Array.isArray(listData.data?.services) && listData.data.services.length === 1,
      '2. Agency admin can list services',
      `Found ${listData.data?.services?.length} services`
    )

    // Test 3: Get Single Service
    const getRes = await fetch(`${baseUrl}/api/services/${serviceId}`, {
      method: 'GET',
      headers: { Cookie: adminCookie },
    })
    const getData = await getRes.json()
    assert(
      getRes.status === 200 && getData.data?.service?._id === serviceId,
      '3. Get single service details',
      `HTTP ${getRes.status}`
    )

    // Test 4: Update Service
    const updateRes = await fetch(`${baseUrl}/api/services/${serviceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ price: 1800 }),
    })
    const updateData = await updateRes.json()
    assert(
      updateRes.status === 200 && updateData.data?.service?.price === 1800,
      '4. Update service price',
      `Updated price: $${updateData.data?.service?.price}`
    )

    // Test 5: Delete Service
    const deleteRes = await fetch(`${baseUrl}/api/services/${serviceId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    })
    assert(
      deleteRes.status === 200,
      '5. Delete service',
      `HTTP ${deleteRes.status}`
    )
  } catch (err) {
    console.error('Fatal test error:', err)
  } finally {
    server.close()
    await disconnectDB()

    console.log('\n=================================================================')
    console.log(`Services Test Results Summary: ${passedCount}/${passedCount + failedCount} Passed, ${failedCount} Failed`)
    console.log('=================================================================\n')
    process.exit(failedCount > 0 ? 1 : 0)
  }
}

runTestSuite()
