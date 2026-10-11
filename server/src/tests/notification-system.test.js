import dotenv from 'dotenv'
dotenv.config()

process.env.NODE_ENV = 'test'
process.env.PATH = "C:\\Users\\Sanja\\AppData\\Local\\OpenAI\\Codex\\runtimes\\cua_node\\154806497bb51bae\\bin;" + process.env.PATH

import http from 'http'
import app from '../app.js'
import { connectDB, disconnectDB } from '../config/db.js'
import User from '../models/User.js'
import Organization from '../models/Organization.js'
import Notification from '../models/Notification.js'
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
  console.log('🚀 Running Notification System Test Suite')
  console.log('=================================================================\n')

  await connectDB()

  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const port = server.address().port
  const baseUrl = `http://127.0.0.1:${port}`

  try {
    const timestamp = Date.now()
    const org = await Organization.create({
      name: `Notif Test Org ${timestamp}`,
      plan: 'enterprise',
      status: 'active',
    })

    const user = await User.create({
      organization: org._id,
      name: 'Notif User',
      email: `user.notif.${timestamp}@scalevo.io`,
      password: 'Password123!',
      role: 'agency_admin',
      status: 'active',
    })

    const token = generateToken({
      userId: user._id,
      organizationId: org._id,
      role: user.role,
    })
    const cookie = `scalevo_token=${token}`

    // Create Notification in DB
    const notif = await Notification.create({
      organizationId: org._id,
      userId: user._id,
      type: 'new_lead',
      title: 'New High Value Lead',
      message: 'Global Logistics Corp filled out the contact form.',
    })

    // 1. List Notifications
    const listRes = await fetch(`${baseUrl}/api/notifications`, {
      method: 'GET',
      headers: { Cookie: cookie },
    })
    const listData = await listRes.json()
    assert(
      listRes.status === 200 && listData.data?.notifications?.length === 1 && listData.data?.unreadCount === 1,
      '1. User receives system notifications with unread count',
      `Unread count: ${listData.data?.unreadCount}`
    )

    // 2. Mark as read
    const readRes = await fetch(`${baseUrl}/api/notifications/${notif._id}/read`, {
      method: 'PATCH',
      headers: { Cookie: cookie },
    })
    const readData = await readRes.json()
    assert(
      readRes.status === 200 && readData.data?.notification?.isRead === true,
      '2. User can mark notification as read',
      `isRead: ${readData.data?.notification?.isRead}`
    )
  } catch (err) {
    console.error('Fatal test error:', err)
  } finally {
    server.close()
    await disconnectDB()

    console.log('\n=================================================================')
    console.log(`Notification Test Results Summary: ${passedCount}/${passedCount + failedCount} Passed, ${failedCount} Failed`)
    console.log('=================================================================\n')
    process.exit(failedCount > 0 ? 1 : 0)
  }
}

runTestSuite()
