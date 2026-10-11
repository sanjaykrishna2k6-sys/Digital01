import dotenv from 'dotenv'
dotenv.config()

process.env.NODE_ENV = 'test'
process.env.PATH = "C:\\Users\\Sanja\\AppData\\Local\\OpenAI\\Codex\\runtimes\\cua_node\\154806497bb51bae\\bin;" + process.env.PATH

import http from 'http'
import app from '../app.js'
import { connectDB, disconnectDB } from '../config/db.js'
import User from '../models/User.js'
import Organization from '../models/Organization.js'
import Client from '../models/Client.js'
import Content from '../models/Content.js'
import Approval from '../models/Approval.js'
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
  console.log('🚀 Running Content Management & Client Approval Test Suite')
  console.log('=================================================================\n')

  await connectDB()

  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const port = server.address().port
  const baseUrl = `http://127.0.0.1:${port}`

  try {
    const timestamp = Date.now()
    const org = await Organization.create({
      name: `Content Test Org ${timestamp}`,
      plan: 'enterprise',
      status: 'active',
    })

    const agencyUser = await User.create({
      organization: org._id,
      name: 'Agency Strategist',
      email: `strategist.${timestamp}@scalevo.io`,
      password: 'Password123!',
      role: 'team_member',
      status: 'active',
    })

    const clientRecord = await Client.create({
      organizationId: org._id,
      companyName: 'Acme Retail',
      contactName: 'Alice Johnson',
      email: `alice.${timestamp}@acmeretail.com`,
      status: 'active',
      createdBy: agencyUser._id,
    })

    const clientUser = await User.create({
      organization: org._id,
      name: 'Alice Johnson Client',
      email: `alice.${timestamp}@acmeretail.com`,
      password: 'Password123!',
      role: 'client',
      status: 'active',
    })

    const agencyToken = generateToken({
      userId: agencyUser._id,
      organizationId: org._id,
      role: agencyUser.role,
    })
    const agencyCookie = `scalevo_token=${agencyToken}`

    const clientToken = generateToken({
      userId: clientUser._id,
      organizationId: org._id,
      role: clientUser.role,
    })
    const clientCookie = `scalevo_token=${clientToken}`

    // 1. Create Content
    const createRes = await fetch(`${baseUrl}/api/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: agencyCookie },
      body: JSON.stringify({
        clientId: clientRecord._id,
        title: 'Spring Product Launch Instagram Reel',
        contentType: 'Reel',
        platform: 'Instagram',
        body: 'Check out our new spring collection!',
      }),
    })
    const createData = await createRes.json()
    assert(
      createRes.status === 201 && createData.data?.content?.title === 'Spring Product Launch Instagram Reel',
      '1. Agency creates draft content',
      `HTTP ${createRes.status}`
    )

    const contentId = createData.data?.content?._id

    // 2. Submit for Approval
    const submitRes = await fetch(`${baseUrl}/api/content/${contentId}/submit-approval`, {
      method: 'POST',
      headers: { Cookie: agencyCookie },
    })
    const submitData = await submitRes.json()
    assert(
      submitRes.status === 200 && submitData.data?.content?.status === 'Pending Approval',
      '2. Agency submits content for client approval',
      `Status: ${submitData.data?.content?.status}`
    )

    // 3. Client List Content
    const clientListRes = await fetch(`${baseUrl}/api/content`, {
      method: 'GET',
      headers: { Cookie: clientCookie },
    })
    const clientListData = await clientListRes.json()
    assert(
      clientListRes.status === 200 && clientListData.data?.content?.length === 1,
      '3. Client can view content submitted for their organization',
      `Found ${clientListData.data?.content?.length} items`
    )

    // 4. Client Approves Content
    const approveRes = await fetch(`${baseUrl}/api/content/${contentId}/approval`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: clientCookie },
      body: JSON.stringify({
        status: 'Approved',
        comment: 'Looks great! Approved for launch.',
      }),
    })
    const approveData = await approveRes.json()
    assert(
      approveRes.status === 200 && approveData.data?.content?.status === 'Approved',
      '4. Client approves content successfully',
      `Approval status: ${approveData.data?.approval?.status}`
    )

    // 5. Verify Approval Record
    const getRes = await fetch(`${baseUrl}/api/content/${contentId}`, {
      method: 'GET',
      headers: { Cookie: agencyCookie },
    })
    const getData = await getRes.json()
    assert(
      getRes.status === 200 && getData.data?.approvals?.length === 1,
      '5. Approval audit trail records review event',
      `Total approvals logged: ${getData.data?.approvals?.length}`
    )
  } catch (err) {
    console.error('Fatal test error:', err)
  } finally {
    server.close()
    await disconnectDB()

    console.log('\n=================================================================')
    console.log(`Content Test Results Summary: ${passedCount}/${passedCount + failedCount} Passed, ${failedCount} Failed`)
    console.log('=================================================================\n')
    process.exit(failedCount > 0 ? 1 : 0)
  }
}

runTestSuite()
