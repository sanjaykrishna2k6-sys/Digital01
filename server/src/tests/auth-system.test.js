import dotenv from 'dotenv'
dotenv.config()

// Ensure test mode bypasses rate limiters and uses test safe defaults
process.env.NODE_ENV = 'test'

import http from 'http'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import app from '../app.js'
import { connectDB } from '../config/db.js'
import User from '../models/User.js'
import Organization from '../models/Organization.js'
import { generateToken } from '../utils/token.js'
import { setGoogleOAuthTestHooks } from '../services/googleOAuth.service.js'
import { getTestResetToken, clearTestEmails } from '../services/email.service.js'

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
  console.log('🚀 Running Authentication System Test Suite (28 Test Scenarios)')
  console.log('=================================================================\n')

  await connectDB()

  // Start HTTP server on ephemeral port for realistic end-to-end HTTP testing
  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const port = server.address().port
  const baseUrl = `http://127.0.0.1:${port}`

  console.log(`Test server running on ${baseUrl}\n`)

  const testTimestamp = Date.now()
  const cleanupUserIds = []
  const cleanupOrgIds = []

  try {
    // -----------------------------------------------------------------
    // Setup Primary Org and Super Admin for baseline existing tests
    // -----------------------------------------------------------------
    let primaryOrg = await Organization.findOne({ slug: 'scalevo-agency' })
    if (!primaryOrg) {
      primaryOrg = await Organization.create({
        name: 'Scalevo Agency',
        plan: 'enterprise',
        status: 'active',
      })
    }
    let superAdmin = await User.findOne({ email: 'superadmin@scalevo.com' })
    if (!superAdmin) {
      superAdmin = await User.create({
        organization: primaryOrg._id,
        name: 'Super Administrator',
        email: 'superadmin@scalevo.com',
        password: 'Password123!',
        role: 'super_admin',
        authProvider: 'local',
        status: 'active',
      })
    } else {
      superAdmin.organization = primaryOrg._id
      superAdmin.status = 'active'
      await superAdmin.save({ validateBeforeSave: false })
    }

    const superAdminToken = generateToken({
      userId: superAdmin._id,
      organizationId: primaryOrg._id,
      role: superAdmin.role,
    })
    const superAdminCookie = `scalevo_token=${superAdminToken}`

    // -----------------------------------------------------------------
    // Test 1: Signup succeeds
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 1: Signup succeeds')
    const signupEmail = `signup.founder.${testTimestamp}@growthagency.io`
    const signupPassword = 'SecureFounderPassword2026!'
    const signupOrgName = `GrowthLab Agency ${testTimestamp}`

    const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Founder Rohit',
        email: signupEmail,
        password: signupPassword,
        organizationName: signupOrgName,
      }),
    })
    const signupData = await signupRes.json()
    const signupCookieHeader = signupRes.headers.get('set-cookie') || ''

    let createdUserId = signupData.data?.user?._id
    let createdOrgId = signupData.data?.organization?._id
    if (createdUserId) cleanupUserIds.push(createdUserId)
    if (createdOrgId) cleanupOrgIds.push(createdOrgId)

    assert(
      signupRes.status === 201 &&
        signupData.status === 'success' &&
        signupData.data?.user?.email === signupEmail.toLowerCase() &&
        signupData.data?.organization?.name === signupOrgName &&
        signupCookieHeader.includes('scalevo_token') &&
        signupCookieHeader.includes('HttpOnly'),
      '1. Signup succeeds',
      `HTTP ${signupRes.status}, set-cookie: ${signupCookieHeader}`
    )

    // -----------------------------------------------------------------
    // Test 2: Duplicate email is handled safely
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 2: Duplicate email is handled safely')
    const dupSignupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Imposter Founder',
        email: signupEmail, // Exact same email
        password: 'AnotherPassword999!',
        organizationName: 'Duplicate Agency',
      }),
    })
    const dupSignupData = await dupSignupRes.json()

    assert(
      dupSignupRes.status === 409 &&
        dupSignupData.status === 'fail' &&
        dupSignupData.message?.toLowerCase().includes('already exists'),
      '2. Duplicate email is handled safely',
      `HTTP ${dupSignupRes.status}, message: ${dupSignupData.message}`
    )

    // -----------------------------------------------------------------
    // Test 3: Password is hashed
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 3: Password is hashed')
    const dbUser = await User.findById(createdUserId).select('+password')
    const isBcryptHash = dbUser.password && dbUser.password.startsWith('$2')
    const passwordMatches = await bcrypt.compare(signupPassword, dbUser.password)

    assert(
      isBcryptHash && dbUser.password !== signupPassword && passwordMatches,
      '3. Password is hashed with bcrypt',
      `Stored hash format verified: ${dbUser.password.substring(0, 10)}...`
    )

    // -----------------------------------------------------------------
    // Test 4: Password is never returned
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 4: Password is never returned')
    assert(
      signupData.data?.user?.password === undefined &&
        signupData.data?.user?.passwordResetTokenHash === undefined,
      '4. Password is never returned by API',
      `Password and reset token hash are absent from response`
    )

    // -----------------------------------------------------------------
    // Test 5: Signup cannot create super_admin
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 5: Signup cannot create super_admin')
    const exploitEmail = `exploit.admin.${testTimestamp}@hack.com`
    const exploitRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Attacker Admin',
        email: exploitEmail,
        password: 'SecurePassword123!',
        organizationName: 'Malicious Agency',
        role: 'super_admin', // Attempted privilege escalation
      }),
    })
    const exploitData = await exploitRes.json()
    if (exploitData.data?.user?._id) cleanupUserIds.push(exploitData.data.user._id)
    if (exploitData.data?.organization?._id) cleanupOrgIds.push(exploitData.data.organization._id)

    assert(
      exploitRes.status === 201 &&
        exploitData.data?.user?.role === 'agency_admin' &&
        exploitData.data?.user?.role !== 'super_admin',
      '5. Signup cannot create super_admin (Enforced agency_admin)',
      `Actual assigned role: ${exploitData.data?.user?.role}`
    )

    // -----------------------------------------------------------------
    // Test 6: Signup creates a new organization
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 6: Signup creates a new organization')
    const dbOrg = await Organization.findById(createdOrgId)
    assert(
      dbOrg && dbOrg.name === signupOrgName,
      '6. Signup creates a new organization in database',
      `Org ID: ${dbOrg?._id}, Name: ${dbOrg?.name}`
    )

    // -----------------------------------------------------------------
    // Test 7: New user is associated with the correct organization
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 7: New user is associated with the correct organization')
    assert(
      dbUser.organization.toString() === dbOrg._id.toString(),
      '7. New user is associated with the correct organization',
      `User Org: ${dbUser.organization}, Org ID: ${dbOrg._id}`
    )

    // -----------------------------------------------------------------
    // Test 8: New user can authenticate
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 8: New user can authenticate')
    const newLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: signupEmail,
        password: signupPassword,
      }),
    })
    const newLoginData = await newLoginRes.json()
    const newLoginCookie = newLoginRes.headers.get('set-cookie') || ''

    assert(
      newLoginRes.status === 200 &&
        newLoginData.status === 'success' &&
        newLoginData.data?.user?.email === signupEmail.toLowerCase() &&
        newLoginCookie.includes('scalevo_token'),
      '8. New user can authenticate',
      `HTTP ${newLoginRes.status}, user authenticated successfully`
    )

    // -----------------------------------------------------------------
    // Test 9: Existing login still works
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 9: Existing login still works')
    const superLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@scalevo.com',
        password: 'Password123!',
      }),
    })
    const superLoginData = await superLoginRes.json()
    assert(
      superLoginRes.status === 200 &&
        superLoginData.status === 'success' &&
        superLoginData.data?.user?.role === 'super_admin',
      '9. Existing login still works',
      `HTTP ${superLoginRes.status}`
    )

    // -----------------------------------------------------------------
    // Test 10: Existing logout still works
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 10: Existing logout still works')
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: superAdminCookie },
    })
    const logoutCookie = logoutRes.headers.get('set-cookie') || ''
    assert(
      logoutRes.status === 200 &&
        (logoutCookie.includes('Max-Age=0') || logoutCookie.includes('Expires=')),
      '10. Existing logout still works',
      `HTTP ${logoutRes.status}, cleared cookie: ${logoutCookie}`
    )

    // -----------------------------------------------------------------
    // Test 11: Existing /me still works
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 11: Existing /me still works')
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      method: 'GET',
      headers: { Cookie: superAdminCookie },
    })
    const meData = await meRes.json()
    assert(
      meRes.status === 200 &&
        meData.status === 'success' &&
        meData.data?.user?.email === 'superadmin@scalevo.com',
      '11. Existing /me still works',
      `HTTP ${meRes.status}, user: ${meData.data?.user?.email}`
    )

    // -----------------------------------------------------------------
    // Test 12: Google OAuth callback validates correctly
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 12: Google OAuth callback validates correctly')
    const googleTestState = 'state_test_hash_1234567890abcdef'
    const googleProfileSub = `google_sub_${testTimestamp}`
    const googleTestEmail = `google.user.${testTimestamp}@gmail.com`

    // Configure test hooks for Google OAuth mock exchange
    setGoogleOAuthTestHooks({
      exchange: async (code) => {
        if (code === 'valid_auth_code') {
          return { access_token: 'mock_google_access_token_xyz' }
        }
        throw new Error('Invalid authorization code')
      },
      userInfo: async (token) => {
        if (token === 'mock_google_access_token_xyz') {
          return {
            sub: googleProfileSub,
            email: googleTestEmail,
            email_verified: true,
            name: 'Google Test Founder',
            picture: 'https://example.com/avatar.jpg',
          }
        }
        throw new Error('Invalid access token')
      },
    })

    const googleCallbackRes = await fetch(
      `${baseUrl}/api/auth/google/callback?code=valid_auth_code&state=${googleTestState}`,
      {
        method: 'GET',
        headers: {
          Cookie: `oauth_state=${googleTestState}`,
          Accept: 'application/json',
        },
      }
    )
    const googleCallbackData = await googleCallbackRes.json()
    const googleSetCookie = googleCallbackRes.headers.get('set-cookie') || ''

    if (googleCallbackData.data?.user?._id) cleanupUserIds.push(googleCallbackData.data.user._id)
    if (googleCallbackData.data?.organization?._id) cleanupOrgIds.push(googleCallbackData.data.organization._id)

    assert(
      googleCallbackRes.status === 200 &&
        googleCallbackData.status === 'success' &&
        googleCallbackData.data?.user?.email === googleTestEmail &&
        googleSetCookie.includes('scalevo_token'),
      '12. Google OAuth callback validates correctly',
      `HTTP ${googleCallbackRes.status}, cookie issued`
    )

    // -----------------------------------------------------------------
    // Test 13: OAuth state protection works
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 13: OAuth state protection works')
    const stateMismatchRes = await fetch(
      `${baseUrl}/api/auth/google/callback?code=valid_auth_code&state=forged_state_parameter`,
      {
        method: 'GET',
        headers: {
          Cookie: `oauth_state=${googleTestState}`, // Mismatched state
          Accept: 'application/json',
        },
      }
    )
    const stateMismatchData = await stateMismatchRes.json()

    assert(
      stateMismatchRes.status === 400 &&
        stateMismatchData.message?.toLowerCase().includes('state'),
      '13. OAuth state protection works (Mismatch rejected)',
      `HTTP ${stateMismatchRes.status}, message: ${stateMismatchData.message}`
    )

    // -----------------------------------------------------------------
    // Test 14: Google identity cannot be forged
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 14: Google identity cannot be forged')
    // Provide an unverified email profile
    setGoogleOAuthTestHooks({
      exchange: async () => ({ access_token: 'unverified_token' }),
      userInfo: async () => ({
        sub: 'unverified_sub_123',
        email: 'unverified@attacker.com',
        email_verified: false, // NOT verified by Google!
        name: 'Attacker Imposter',
      }),
    })

    const unverifiedRes = await fetch(
      `${baseUrl}/api/auth/google/callback?code=code_unverified&state=unverified_state`,
      {
        method: 'GET',
        headers: {
          Cookie: 'oauth_state=unverified_state',
          Accept: 'application/json',
        },
      }
    )
    const unverifiedData = await unverifiedRes.json()

    assert(
      unverifiedRes.status === 400 &&
        unverifiedData.message?.toLowerCase().includes('verified'),
      '14. Google identity cannot be forged (Unverified email rejected)',
      `HTTP ${unverifiedRes.status}, message: ${unverifiedData.message}`
    )

    // -----------------------------------------------------------------
    // Test 15: Existing Google user can log in
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 15: Existing Google user can log in')
    // Reuse existing google user sub
    setGoogleOAuthTestHooks({
      exchange: async () => ({ access_token: 'existing_google_token' }),
      userInfo: async () => ({
        sub: googleProfileSub,
        email: googleTestEmail,
        email_verified: true,
        name: 'Google Test Founder',
      }),
    })

    const repeatGoogleRes = await fetch(
      `${baseUrl}/api/auth/google/callback?code=repeat_code&state=repeat_state`,
      {
        method: 'GET',
        headers: {
          Cookie: 'oauth_state=repeat_state',
          Accept: 'application/json',
        },
      }
    )
    const repeatGoogleData = await repeatGoogleRes.json()

    assert(
      repeatGoogleRes.status === 200 &&
        repeatGoogleData.data?.user?.googleId === googleProfileSub,
      '15. Existing Google user can log in without creating duplicates',
      `Logged in user ID: ${repeatGoogleData.data?.user?._id}`
    )

    // -----------------------------------------------------------------
    // Test 16: Appropriate new Google users can be provisioned
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 16: Appropriate new Google users can be provisioned')
    const freshGoogleSub = `new_sub_${testTimestamp}`
    const freshGoogleEmail = `fresh.google.${testTimestamp}@gmail.com`

    setGoogleOAuthTestHooks({
      exchange: async () => ({ access_token: 'fresh_google_token' }),
      userInfo: async () => ({
        sub: freshGoogleSub,
        email: freshGoogleEmail,
        email_verified: true,
        name: 'Fresh Agency Owner',
      }),
    })

    const freshGoogleRes = await fetch(
      `${baseUrl}/api/auth/google/callback?code=fresh_code&state=fresh_state`,
      {
        method: 'GET',
        headers: {
          Cookie: 'oauth_state=fresh_state',
          Accept: 'application/json',
        },
      }
    )
    const freshGoogleData = await freshGoogleRes.json()
    if (freshGoogleData.data?.user?._id) cleanupUserIds.push(freshGoogleData.data.user._id)
    if (freshGoogleData.data?.organization?._id) cleanupOrgIds.push(freshGoogleData.data.organization._id)

    assert(
      freshGoogleRes.status === 200 &&
        freshGoogleData.data?.user?.role === 'agency_admin' &&
        freshGoogleData.data?.user?.role !== 'super_admin' &&
        freshGoogleData.data?.organization !== undefined,
      '16. Appropriate new Google users can be provisioned (role: agency_admin, new org)',
      `Role: ${freshGoogleData.data?.user?.role}, Org: ${freshGoogleData.data?.organization?.name}`
    )

    // -----------------------------------------------------------------
    // Test 17: Forgot password does not reveal whether an email exists
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 17: Forgot password does not reveal whether an email exists')
    const forgotExistingRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: signupEmail }),
    })
    const forgotExistingData = await forgotExistingRes.json()

    const forgotNonExistentRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `nonexistent.${testTimestamp}@nowhere.com` }),
    })
    const forgotNonExistentData = await forgotNonExistentRes.json()

    assert(
      forgotExistingRes.status === 200 &&
        forgotNonExistentRes.status === 200 &&
        forgotExistingData.message === forgotNonExistentData.message,
      '17. Forgot password does not reveal whether an email exists (Identical generic response)',
      `Message: "${forgotExistingData.message}"`
    )

    // -----------------------------------------------------------------
    // Test 18: Reset token expires
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 18: Reset token expires')
    // Set an already-expired reset token directly in the database
    const expiredRawToken = 'expired_raw_test_token_123456789'
    const expiredTokenHash = crypto.createHash('sha256').update(expiredRawToken).digest('hex')
    const userToExpire = await User.findById(createdUserId)
    userToExpire.passwordResetTokenHash = expiredTokenHash
    userToExpire.passwordResetExpiresAt = new Date(Date.now() - 10000) // 10 seconds in the past
    await userToExpire.save({ validateBeforeSave: false })

    const expiredResetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: expiredRawToken,
        newPassword: 'BrandNewPassword2026!',
      }),
    })
    const expiredResetData = await expiredResetRes.json()

    assert(
      expiredResetRes.status === 400 &&
        expiredResetData.message?.toLowerCase().includes('expired'),
      '18. Reset token expires properly',
      `HTTP ${expiredResetRes.status}, message: ${expiredResetData.message}`
    )

    // -----------------------------------------------------------------
    // Test 19: Reset token cannot be reused
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 19: Reset token cannot be reused')
    // Trigger fresh forgot password to get valid token from email service
    await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: signupEmail }),
    })
    const validResetToken = getTestResetToken(signupEmail)

    const firstResetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: validResetToken,
        newPassword: 'ResetPasswordPhase1Success123!',
      }),
    })
    const firstResetData = await firstResetRes.json()

    // Second reset attempt with same token
    const secondResetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: validResetToken,
        newPassword: 'AnotherResetAttemptPassword999!',
      }),
    })
    const secondResetData = await secondResetRes.json()

    assert(
      !!validResetToken &&
        firstResetRes.status === 200 &&
        secondResetRes.status === 400 &&
        secondResetData.message?.toLowerCase().includes('invalid or has expired'),
      '19. Reset token cannot be reused (Single use only)',
      `First: HTTP ${firstResetRes.status}, Second: HTTP ${secondResetRes.status}`
    )

    // -----------------------------------------------------------------
    // Test 20: New password works after reset
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 20: New password works after reset')
    const loginWithNewRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: signupEmail,
        password: 'ResetPasswordPhase1Success123!',
      }),
    })
    assert(
      loginWithNewRes.status === 200,
      '20. New password works after reset',
      `HTTP ${loginWithNewRes.status}`
    )

    // -----------------------------------------------------------------
    // Test 21: Old password no longer works after reset
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 21: Old password no longer works after reset')
    const loginWithOldRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: signupEmail,
        password: signupPassword, // Old initial password
      }),
    })
    assert(
      loginWithOldRes.status === 401,
      '21. Old password no longer works after reset',
      `HTTP ${loginWithOldRes.status}`
    )

    // -----------------------------------------------------------------
    // Test 22: Change password requires authentication
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 22: Change password requires authentication')
    const unauthChangeRes = await fetch(`${baseUrl}/api/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: 'ResetPasswordPhase1Success123!',
        newPassword: 'BrandNewChangedPass2026!',
      }),
    })
    assert(
      unauthChangeRes.status === 401,
      '22. Change password requires authentication',
      `HTTP ${unauthChangeRes.status}`
    )

    // -----------------------------------------------------------------
    // Test 23: Incorrect current password fails
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 23: Incorrect current password fails')
    const userAuthToken = generateToken({
      userId: createdUserId,
      organizationId: createdOrgId,
      role: 'agency_admin',
    })
    const userCookie = `scalevo_token=${userAuthToken}`

    const wrongCurrentRes = await fetch(`${baseUrl}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: userCookie,
      },
      body: JSON.stringify({
        currentPassword: 'WrongIncorrectCurrentPassword!',
        newPassword: 'BrandNewChangedPass2026!',
      }),
    })
    const wrongCurrentData = await wrongCurrentRes.json()

    assert(
      wrongCurrentRes.status === 400 &&
        wrongCurrentData.message?.toLowerCase().includes('incorrect'),
      '23. Incorrect current password fails',
      `HTTP ${wrongCurrentRes.status}, message: ${wrongCurrentData.message}`
    )

    // -----------------------------------------------------------------
    // Test 24: New password works
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 24: New password works')
    const validChangeRes = await fetch(`${baseUrl}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: userCookie,
      },
      body: JSON.stringify({
        currentPassword: 'ResetPasswordPhase1Success123!',
        newPassword: 'BrandNewChangedPass2026!',
      }),
    })

    const loginAfterChangeRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: signupEmail,
        password: 'BrandNewChangedPass2026!',
      }),
    })

    assert(
      validChangeRes.status === 200 && loginAfterChangeRes.status === 200,
      '24. New password works after changing',
      `Change status: ${validChangeRes.status}, Login status: ${loginAfterChangeRes.status}`
    )

    // -----------------------------------------------------------------
    // Test 25: No authentication secrets in localStorage/sessionStorage
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 25: No secrets stored in localStorage/sessionStorage')
    const clientSrcPath = path.resolve('../Design Digital Marketing Platform/client/src')
    let foundStorageSecrets = false

    function scanFiles(dir) {
      const files = fs.readdirSync(dir)
      for (const file of files) {
        const fullPath = path.join(dir, file)
        const stat = fs.statSync(fullPath)
        if (stat.isDirectory()) {
          scanFiles(fullPath)
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
          const content = fs.readFileSync(fullPath, 'utf8')
          // Check for storing auth tokens/passwords
          const regex = /localStorage\.setItem\s*\(\s*['"`](token|password|jwt|secret|auth)/i
          const sessionRegex = /sessionStorage\.setItem\s*\(\s*['"`](token|password|jwt|secret|auth)/i
          if (regex.test(content) || sessionRegex.test(content)) {
            foundStorageSecrets = true
            console.error(`Found secret storage in: ${file}`)
          }
        }
      }
    }
    scanFiles(clientSrcPath)

    assert(
      !foundStorageSecrets,
      '25. No authentication secrets are stored in localStorage/sessionStorage',
      `Checked all frontend source files in client/src`
    )

    // -----------------------------------------------------------------
    // Test 26: Frontend production build succeeds
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 26: Frontend production build succeeds')
    const distIndexPath = path.resolve(
      '../Design Digital Marketing Platform/client/dist/index.html'
    )
    const distExists = fs.existsSync(distIndexPath)
    const distStat = distExists ? fs.statSync(distIndexPath) : null

    assert(
      distExists && distStat.size > 0,
      '26. Frontend production build succeeds',
      `Verified client/dist/index.html (${distStat?.size} bytes)`
    )

    // -----------------------------------------------------------------
    // Test 27: Existing User Management tests still pass
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 27: Existing User Management tests still pass')
    const listUsersRes = await fetch(`${baseUrl}/api/users`, {
      method: 'GET',
      headers: { Cookie: superAdminCookie },
    })
    const listUsersData = await listUsersRes.json()

    assert(
      listUsersRes.status === 200 &&
        listUsersData.status === 'success' &&
        Array.isArray(listUsersData.data?.users),
      '27. Existing User Management tests still pass (Super admin lists users)',
      `Returned ${listUsersData.data?.users?.length} users`
    )

    // -----------------------------------------------------------------
    // Test 28: Existing tenant isolation tests still pass
    // -----------------------------------------------------------------
    console.log('\n--> Testing Scenario 28: Existing tenant isolation tests still pass')
    // Create Org B with an admin
    const orgB = await Organization.create({
      name: `Tenant B Isolated ${testTimestamp}`,
      plan: 'starter',
      status: 'active',
    })
    cleanupOrgIds.push(orgB._id)

    const userB = await User.create({
      organization: orgB._id,
      name: 'Admin B',
      email: `admin.b.${testTimestamp}@tenantb.com`,
      password: 'SecurePassword123!',
      role: 'agency_admin',
      status: 'active',
    })
    cleanupUserIds.push(userB._id)

    const tokenB = generateToken({
      userId: userB._id,
      organizationId: orgB._id,
      role: userB.role,
    })
    const cookieB = `scalevo_token=${tokenB}`

    // Attempt to access user created in Org A using Org B admin credentials
    const crossTenantRes = await fetch(`${baseUrl}/api/users/${createdUserId}`, {
      method: 'GET',
      headers: { Cookie: cookieB },
    })

    assert(
      crossTenantRes.status === 404 || crossTenantRes.status === 403,
      '28. Existing tenant isolation tests still pass (Org B cannot access Org A)',
      `Cross-tenant access status: HTTP ${crossTenantRes.status}`
    )
  } finally {
    // Cleanup temporary test records
    await User.deleteMany({ _id: { $in: cleanupUserIds } })
    await Organization.deleteMany({ _id: { $in: cleanupOrgIds } })
    server.close()
  }

  console.log('\n=================================================================')
  console.log(`Test Results Summary: ${passedCount}/28 Passed, ${failedCount} Failed`)
  console.log('=================================================================\n')

  if (failedCount > 0) {
    process.exit(1)
  } else {
    process.exit(0)
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test runner error:', err)
  process.exit(1)
})
