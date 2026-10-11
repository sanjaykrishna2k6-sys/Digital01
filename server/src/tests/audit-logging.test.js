import dotenv from 'dotenv'
dotenv.config()

process.env.NODE_ENV = 'test'
process.env.PATH = "C:\\Users\\Sanja\\AppData\\Local\\OpenAI\\Codex\\runtimes\\cua_node\\154806497bb51bae\\bin;" + process.env.PATH

import http from 'http'
import app from '../app.js'
import { connectDB, disconnectDB } from '../config/db.js'
import User from '../models/User.js'
import Organization from '../models/Organization.js'
import { logActivity } from '../services/audit.service.js'
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
  console.log('🚀 Running Centralized Audit Logging Test Suite')
  console.log('=================================================================\n')

  await connectDB()

  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const port = server.address().port
  const baseUrl = `http://127.0.0.1:${port}`

  try {
    const timestamp = Date.now()
    const org = await Organization.create({
      name: `Audit Test Org ${timestamp}`,
      plan: 'enterprise',
      status: 'active',
    })

    const admin = await User.create({
      organization: org._id,
      name: 'Audit Admin',
      email: `admin.audit.${timestamp}@scalevo.io`,
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

    // Log action using service
    await logActivity({
      organizationId: org._id,
      user: admin,
      action: 'SHOPIFY_CONNECTED',
      entity: 'ShopifyStore',
      entityId: 'shop_123',
      metadata: { shopDomain: 'growth-store.myshopify.com', password: 'SECRET_SHOULD_BE_STRIPPED' },
    })

    // List Audit Logs
    const listRes = await fetch(`${baseUrl}/api/audit-logs`, {
      method: 'GET',
      headers: { Cookie: adminCookie },
    })
    const listData = await listRes.json()

    const loggedItem = listData.data?.logs?.[0]

    assert(
      listRes.status === 200 &&
        listData.data?.logs?.length === 1 &&
        loggedItem.action === 'SHOPIFY_CONNECTED' &&
        loggedItem.metadata?.password === undefined,
      '1. Audit log records event securely without sensitive password metadata',
      `Logged action: ${loggedItem?.action}`
    )
  } catch (err) {
    console.error('Fatal test error:', err)
  } finally {
    server.close()
    await disconnectDB()

    console.log('\n=================================================================')
    console.log(`Audit Test Results Summary: ${passedCount}/${passedCount + failedCount} Passed, ${failedCount} Failed`)
    console.log('=================================================================\n')
    process.exit(failedCount > 0 ? 1 : 0)
  }
}

runTestSuite()
