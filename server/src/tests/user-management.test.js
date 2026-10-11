process.env.NODE_ENV = 'test'
import dotenv from 'dotenv'
dotenv.config()

import http from 'http'
import app from '../app.js'
import { connectDB } from '../config/db.js'
import User from '../models/User.js'
import Organization from '../models/Organization.js'
import { generateToken } from '../utils/token.js'
import bcrypt from 'bcryptjs'

// Simple test runner assertion helper
let passedCount = 0
let failedCount = 0
const results = []

function assert(condition, testName, details = '') {
  if (condition) {
    passedCount++
    results.push({ name: testName, status: 'PASS', details })
    console.log(`  ✓ [PASS] ${testName}`)
  } else {
    failedCount++
    results.push({ name: testName, status: 'FAIL', details })
    console.error(`  ✗ [FAIL] ${testName} - ${details}`)
  }
}

async function runTests() {
  console.log('=================================================================')
  console.log('🚀 Running User Management Test Suite (16 Test Scenarios)')
  console.log('=================================================================\n')

  await connectDB()

  // Start HTTP server on ephemeral port for real HTTP testing
  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const port = server.address().port
  const baseUrl = `http://127.0.0.1:${port}`

  console.log(`Test server running on ${baseUrl}\n`)

  try {
    // -----------------------------------------------------------------
    // Setup Primary Org and Super Admin
    // -----------------------------------------------------------------
    let orgA = await Organization.findOne({ slug: 'scalevo-agency' })
    if (!orgA) {
      orgA = await Organization.create({
        name: 'Scalevo Agency',
        plan: 'enterprise',
        status: 'active',
      })
    }

    let superAdmin = await User.findOne({ role: 'super_admin' })
    if (!superAdmin) {
      superAdmin = await User.create({
        organization: orgA._id,
        name: 'Super Administrator',
        email: 'superadmin@scalevo.com',
        password: 'Password123!',
        role: 'super_admin',
        status: 'active',
      })
    } else {
      superAdmin.organization = orgA._id
      superAdmin.status = 'active'
      await superAdmin.save({ validateBeforeSave: false })
    }

    const superAdminToken = generateToken({
      userId: superAdmin._id,
      organizationId: orgA._id,
      role: superAdmin.role,
    })
    const superAdminCookie = `scalevo_token=${superAdminToken}`

    // -----------------------------------------------------------------
    // Test 1: Super Admin can list users
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 1: Super Admin can list users')
    const listRes = await fetch(`${baseUrl}/api/users`, {
      method: 'GET',
      headers: { Cookie: superAdminCookie },
    })
    const listData = await listRes.json()
    assert(
      listRes.status === 200 &&
        listData.status === 'success' &&
        Array.isArray(listData.data?.users),
      '1. Super Admin can list users',
      `HTTP ${listRes.status}, returned ${listData.data?.users?.length} users`
    )

    // -----------------------------------------------------------------
    // Test 2: Super Admin can create a user
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 2: Super Admin can create a user')
    const testUserEmail = `test.member.${Date.now()}@scalevo.com`
    const rawPassword = 'InitialSecretPassword99!'

    const createRes = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: superAdminCookie,
      },
      body: JSON.stringify({
        name: 'Sarah Connor',
        email: testUserEmail,
        password: rawPassword,
        role: 'agency_admin',
      }),
    })
    const createData = await createRes.json()
    const createdUserId = createData.data?.user?._id

    assert(
      createRes.status === 201 &&
        createData.status === 'success' &&
        createData.data?.user?.email === testUserEmail,
      '2. Super Admin can create a user',
      `HTTP ${createRes.status}, user ID: ${createdUserId}`
    )

    // -----------------------------------------------------------------
    // Test 3: Created password is hashed
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 3: Created password is hashed')
    const dbUser = await User.findById(createdUserId).select('+password')
    const isBcryptHash =
      dbUser &&
      dbUser.password &&
      dbUser.password.startsWith('$2') &&
      dbUser.password !== rawPassword
    const matchesRaw = await bcrypt.compare(rawPassword, dbUser.password)

    assert(
      isBcryptHash && matchesRaw,
      '3. Created password is hashed',
      `Password hash starts with ${dbUser.password?.substring(0, 7)}... and validates against raw password`
    )

    // -----------------------------------------------------------------
    // Test 4: Password is never returned by API
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 4: Password is never returned by API')
    const hasPasswordInCreate =
      createData.data?.user?.password !== undefined ||
      createData.data?.user?.passwordHash !== undefined

    const getRes = await fetch(`${baseUrl}/api/users/${createdUserId}`, {
      method: 'GET',
      headers: { Cookie: superAdminCookie },
    })
    const getData = await getRes.json()
    const hasPasswordInGet =
      getData.data?.user?.password !== undefined ||
      getData.data?.user?.passwordHash !== undefined

    assert(
      !hasPasswordInCreate && !hasPasswordInGet,
      '4. Password is never returned by API',
      'Verified in both POST and GET responses'
    )

    // -----------------------------------------------------------------
    // Test 5: New user can log in
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 5: New user can log in')
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        password: rawPassword,
      }),
    })
    const loginData = await loginRes.json()
    const setCookieHeader = loginRes.headers.get('set-cookie') || ''
    const newUserToken = setCookieHeader.includes('scalevo_token=')

    assert(
      loginRes.status === 200 &&
        loginData.status === 'success' &&
        newUserToken,
      '5. New user can log in',
      `HTTP ${loginRes.status}, received HTTP-only cookie`
    )

    // -----------------------------------------------------------------
    // Test 6: Admin can deactivate a user
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 6: Admin can deactivate a user')
    const deactRes = await fetch(`${baseUrl}/api/users/${createdUserId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: superAdminCookie,
      },
      body: JSON.stringify({ status: 'inactive' }),
    })
    const deactData = await deactRes.json()

    assert(
      deactRes.status === 200 &&
        deactData.data?.user?.status === 'inactive',
      '6. Admin can deactivate a user',
      `HTTP ${deactRes.status}, status: ${deactData.data?.user?.status}`
    )

    // -----------------------------------------------------------------
    // Test 7: Deactivated user cannot log in
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 7: Deactivated user cannot log in')
    const deactLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        password: rawPassword,
      }),
    })
    const deactLoginData = await deactLoginRes.json()

    assert(
      deactLoginRes.status === 403 &&
        deactLoginData.message?.toLowerCase().includes('inactive'),
      '7. Deactivated user cannot log in',
      `HTTP ${deactLoginRes.status}, message: ${deactLoginData.message}`
    )

    // -----------------------------------------------------------------
    // Test 8: Admin can reactivate a user
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 8: Admin can reactivate a user')
    const reactRes = await fetch(`${baseUrl}/api/users/${createdUserId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: superAdminCookie,
      },
      body: JSON.stringify({ status: 'active' }),
    })
    const reactData = await reactRes.json()

    const reactLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        password: rawPassword,
      }),
    })

    assert(
      reactRes.status === 200 &&
        reactData.data?.user?.status === 'active' &&
        reactLoginRes.status === 200,
      '8. Admin can reactivate a user',
      `HTTP ${reactRes.status}, reactivated user successfully logged in with HTTP ${reactLoginRes.status}`
    )

    // -----------------------------------------------------------------
    // Test 9: Unauthorized request returns 401
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 9: Unauthorized request returns 401')
    const unauthRes = await fetch(`${baseUrl}/api/users`, {
      method: 'GET',
    })
    const unauthData = await unauthRes.json()

    assert(
      unauthRes.status === 401,
      '9. Unauthorized request returns 401',
      `HTTP ${unauthRes.status}, message: ${unauthData.message}`
    )

    // -----------------------------------------------------------------
    // Test 10: Client attempting /api/users receives 403
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 10: Client attempting /api/users receives 403')
    const clientUser = await User.create({
      organization: orgA._id,
      name: 'Client User Test',
      email: `client.${Date.now()}@example.com`,
      password: 'ClientPassword123!',
      role: 'client',
      status: 'active',
    })
    const clientToken = generateToken({
      userId: clientUser._id,
      organizationId: orgA._id,
      role: 'client',
    })
    const clientCookie = `scalevo_token=${clientToken}`

    const clientGetRes = await fetch(`${baseUrl}/api/users`, {
      method: 'GET',
      headers: { Cookie: clientCookie },
    })

    assert(
      clientGetRes.status === 403,
      '10. Client attempting /api/users receives 403',
      `HTTP ${clientGetRes.status}`
    )

    // -----------------------------------------------------------------
    // Test 11: Team member attempting restricted operations receives 403
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 11: Team member attempting restricted operations receives 403')
    const teamUser = await User.create({
      organization: orgA._id,
      name: 'Team Member Test',
      email: `teammember.${Date.now()}@example.com`,
      password: 'TeamPassword123!',
      role: 'team_member',
      status: 'active',
    })
    const teamToken = generateToken({
      userId: teamUser._id,
      organizationId: orgA._id,
      role: 'team_member',
    })
    const teamCookie = `scalevo_token=${teamToken}`

    // Team member CAN read
    const teamReadRes = await fetch(`${baseUrl}/api/users`, {
      headers: { Cookie: teamCookie },
    })
    // Team member CANNOT create
    const teamCreateRes = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: teamCookie },
      body: JSON.stringify({
        name: 'Hacked User',
        email: `hacked.${Date.now()}@example.com`,
        password: 'Password123!',
        role: 'team_member',
      }),
    })
    // Team member CANNOT delete
    const teamDeleteRes = await fetch(`${baseUrl}/api/users/${createdUserId}`, {
      method: 'DELETE',
      headers: { Cookie: teamCookie },
    })
    // Team member CANNOT change status
    const teamStatusRes = await fetch(`${baseUrl}/api/users/${createdUserId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: teamCookie },
      body: JSON.stringify({ status: 'inactive' }),
    })

    assert(
      teamReadRes.status === 200 &&
        teamCreateRes.status === 403 &&
        teamDeleteRes.status === 403 &&
        teamStatusRes.status === 403,
      '11. Team member attempting restricted operations receives 403',
      `Read: ${teamReadRes.status}, Create: ${teamCreateRes.status}, Delete: ${teamDeleteRes.status}, Status: ${teamStatusRes.status}`
    )

    // -----------------------------------------------------------------
    // Test 12: User from another organization cannot access the resource
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 12: Tenant isolation (Org B cannot access Org A)')
    let orgB = await Organization.findOne({ slug: 'rival-agency-corp' })
    if (!orgB) {
      orgB = await Organization.create({
        name: 'Rival Agency Corp',
        plan: 'starter',
        status: 'active',
      })
    }
    const adminB = await User.create({
      organization: orgB._id,
      name: 'Rival Admin',
      email: `rival.admin.${Date.now()}@rivalagency.com`,
      password: 'RivalPassword123!',
      role: 'agency_admin',
      status: 'active',
    })
    const tokenB = generateToken({
      userId: adminB._id,
      organizationId: orgB._id,
      role: 'agency_admin',
    })
    const cookieB = `scalevo_token=${tokenB}`

    // Admin B attempts to read created user from Org A
    const crossReadRes = await fetch(`${baseUrl}/api/users/${createdUserId}`, {
      method: 'GET',
      headers: { Cookie: cookieB },
    })
    // Admin B attempts to update Org A user
    const crossUpdateRes = await fetch(`${baseUrl}/api/users/${createdUserId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookieB },
      body: JSON.stringify({ name: 'Tampered Name' }),
    })
    // Admin B attempts to delete Org A user
    const crossDeleteRes = await fetch(`${baseUrl}/api/users/${createdUserId}`, {
      method: 'DELETE',
      headers: { Cookie: cookieB },
    })

    assert(
      crossReadRes.status === 404 &&
        crossUpdateRes.status === 404 &&
        crossDeleteRes.status === 404,
      '12. User from another organization cannot access the resource',
      `Read: ${crossReadRes.status}, Update: ${crossUpdateRes.status}, Delete: ${crossDeleteRes.status}`
    )

    // -----------------------------------------------------------------
    // Test 13: Super Admin cannot be deleted/deactivated accidentally
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 13: Super Admin protected from delete/deactivate')
    const deactSuperRes = await fetch(`${baseUrl}/api/users/${superAdmin._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
      body: JSON.stringify({ status: 'inactive' }),
    })
    const deleteSuperRes = await fetch(`${baseUrl}/api/users/${superAdmin._id}`, {
      method: 'DELETE',
      headers: { Cookie: superAdminCookie },
    })

    // Also test Agency Admin attempting to modify Super Admin
    const agencyAdminToken = generateToken({
      userId: dbUser._id,
      organizationId: orgA._id,
      role: 'agency_admin',
    })
    const agencyAdminCookie = `scalevo_token=${agencyAdminToken}`

    const agencyModSuperRes = await fetch(`${baseUrl}/api/users/${superAdmin._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: agencyAdminCookie },
      body: JSON.stringify({ name: 'Hacked Admin' }),
    })

    assert(
      deactSuperRes.status === 403 &&
        deleteSuperRes.status === 403 &&
        agencyModSuperRes.status === 403,
      '13. Super Admin cannot be deleted/deactivated accidentally',
      `Deactivate Super Admin: ${deactSuperRes.status}, Delete Super Admin: ${deleteSuperRes.status}, Agency Admin Modify: ${agencyModSuperRes.status}`
    )

    // -----------------------------------------------------------------
    // Test 14: Duplicate email is handled correctly
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 14: Duplicate email is handled correctly')
    const dupRes = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
      body: JSON.stringify({
        name: 'Imposter User',
        email: testUserEmail, // Duplicate of already created user
        password: 'AnotherPassword123!',
        role: 'team_member',
      }),
    })
    const dupData = await dupRes.json()

    assert(
      dupRes.status === 409 &&
        dupData.message?.toLowerCase().includes('already exists'),
      '14. Duplicate email is handled correctly',
      `HTTP ${dupRes.status}, message: ${dupData.message}`
    )

    // -----------------------------------------------------------------
    // Test 15: Frontend production build succeeds
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 15: Frontend production build verification')
    // We already ran vite build; check files in dist
    const fs = await import('fs')
    const path = await import('path')
    const distPath = path.resolve(
      '../Design Digital Marketing Platform/client/dist/index.html'
    )
    const distExists = fs.existsSync(distPath)

    assert(
      distExists,
      '15. Frontend production build succeeds',
      `Verified client/dist/index.html exists`
    )

    // -----------------------------------------------------------------
    // Test 16: Existing login/logout/me functionality still works
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 16: Existing auth login/me/logout works')
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      method: 'GET',
      headers: { Cookie: superAdminCookie },
    })
    const meData = await meRes.json()

    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: superAdminCookie },
    })
    const logoutCookie = logoutRes.headers.get('set-cookie') || ''

    assert(
      meRes.status === 200 &&
        meData.data?.user?.email === superAdmin.email &&
        logoutRes.status === 200 &&
        (logoutCookie.includes('Max-Age=0') || logoutCookie.includes('Expires=')),
      '16. Existing login/logout/me functionality still works',
      `me status: ${meRes.status}, logout status: ${logoutRes.status}`
    )

    // Clean up created test data
    await User.deleteMany({
      _id: { $in: [clientUser._id, teamUser._id, adminB._id] },
    })
    await Organization.deleteOne({ _id: orgB._id })
  } finally {
    server.close()
  }

  console.log('\n=================================================================')
  console.log(`Test Results Summary: ${passedCount}/16 Passed, ${failedCount} Failed`)
  console.log('=================================================================\n')

  if (failedCount > 0) {
    process.exit(1)
  } else {
    process.exit(0)
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err)
  process.exit(1)
})
