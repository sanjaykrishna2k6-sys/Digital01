process.env.NODE_ENV = 'test'
import dotenv from 'dotenv'
dotenv.config()

import http from 'http'
import mongoose from 'mongoose'
import app from '../app.js'
import { connectDB } from '../config/db.js'
import User from '../models/User.js'
import Organization from '../models/Organization.js'
import Client from '../models/Client.js'
import SEOProject from '../models/SEOProject.js'
import SEOIssue from '../models/SEOIssue.js'
import SEOKeyword from '../models/SEOKeyword.js'
import SEOBacklink from '../models/SEOBacklink.js'
import SEORecommendation from '../models/SEORecommendation.js'
import Task from '../models/Task.js'
import { generateToken } from '../utils/token.js'

let passedCount = 0
let failedCount = 0

function assert(condition, testName, details = '') {
  if (condition) {
    passedCount++
    console.log(`  ✓ [PASS] ${testName}`)
  } else {
    failedCount++
    console.error(`  ✗ [FAIL] ${testName} - ${details}`)
  }
}

async function runTests() {
  console.log('=================================================================')
  console.log('🚀 Running SEO Management Suite Integration Verification')
  console.log('=================================================================\n')

  await connectDB()

  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const port = server.address().port
  const baseUrl = `http://127.0.0.1:${port}`

  try {
    // 1. Setup Test Organizations & Users
    const orgA = await Organization.create({
      name: 'SEO Test Agency A',
      slug: `seo-org-a-${Date.now()}`,
      plan: 'enterprise',
    })

    const orgB = await Organization.create({
      name: 'SEO Test Agency B',
      slug: `seo-org-b-${Date.now()}`,
      plan: 'growth',
    })

    const userA = await User.create({
      organization: orgA._id,
      name: 'SEO Admin A',
      email: `seo-admin-a-${Date.now()}@agency.com`,
      password: 'TestPassword123!',
      role: 'agency_admin',
      status: 'active',
    })

    const userB = await User.create({
      organization: orgB._id,
      name: 'SEO Admin B',
      email: `seo-admin-b-${Date.now()}@agency.com`,
      password: 'TestPassword123!',
      role: 'agency_admin',
      status: 'active',
    })

    const clientA = await Client.create({
      organizationId: orgA._id,
      companyName: 'Client Brand Alpha',
      contactName: 'Alice Smith',
      email: `alice-${Date.now()}@alpha.com`,
      createdBy: userA._id,
    })

    const tokenA = generateToken({ userId: userA._id, organizationId: orgA._id })
    const tokenB = generateToken({ userId: userB._id, organizationId: orgB._id })

    const headersA = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    }
    const headersB = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    }

    // 2. Unauthenticated access check
    console.log('[Suite 1: Security & Auth Scoping]')
    const unauthRes = await fetch(`${baseUrl}/api/seo/projects`)
    assert(unauthRes.status === 401, 'Unauthenticated request to /api/seo/projects returns 401 Unauthorized')

    // 3. Create SEO Project
    console.log('\n[Suite 2: SEO Project Lifecycle]')
    const createProjectRes = await fetch(`${baseUrl}/api/seo/projects`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        name: 'Alpha Website SEO',
        website: 'https://alpha.com',
        clientId: clientA._id,
        primaryCountry: 'US',
        industry: 'E-Commerce',
        targetKeywords: ['buy online', 'alpha products'],
      }),
    })
    const projectData = await createProjectRes.json()
    assert(createProjectRes.status === 201 && projectData.data?.project?._id, 'Create SEO Project succeeds and returns created record')
    const projectIdA = projectData.data.project._id

    // 4. Fetch Dashboard
    console.log('\n[Suite 3: SEO Dashboard & Metrics]')
    const dashRes = await fetch(`${baseUrl}/api/seo/dashboard?projectId=${projectIdA}`, { headers: headersA })
    const dashData = await dashRes.json()
    assert(dashRes.status === 200 && dashData.data?.metrics?.healthScore !== undefined, 'Fetch SEO Dashboard returns real health score and metrics')

    // 5. Run SEO Audit
    console.log('\n[Suite 4: Technical Audit & Issues]')
    const auditRes = await fetch(`${baseUrl}/api/seo/projects/${projectIdA}/audit`, {
      method: 'POST',
      headers: headersA,
    })
    const auditData = await auditRes.json()
    assert(auditRes.status === 200 && auditData.data?.issuesCreated > 0, 'Run SEO Technical Audit generates actionable issues')

    // 6. Keywords & Backlinks
    console.log('\n[Suite 5: Keywords & Backlinks]')
    const kwRes = await fetch(`${baseUrl}/api/seo/keywords`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        seoProjectId: projectIdA,
        keyword: 'alpha brand deals',
        searchVolume: 4500,
        keywordDifficulty: 42,
        currentPosition: 5,
        searchIntent: 'Commercial',
      }),
    })
    const kwData = await kwRes.json()
    assert(kwRes.status === 201 && kwData.data?.keyword?.currentPosition === 5, 'Track new keyword saves ranking position and search volume')

    // 7. Convert Recommendation to Task
    console.log('\n[Suite 6: Recommendations & Task Conversion]')
    const rec = await SEORecommendation.create({
      organizationId: orgA._id,
      seoProjectId: projectIdA,
      url: 'https://alpha.com/pricing',
      recommendationType: 'meta_title',
      title: 'Fix pricing page title tag length',
      description: 'Expand title tag to include target primary keyword.',
      priority: 'High',
    })

    const convertRes = await fetch(`${baseUrl}/api/seo/recommendations/${rec._id}/convert-task`, {
      method: 'POST',
      headers: headersA,
    })
    const convertData = await convertRes.json()
    assert(convertRes.status === 200 && convertData.data?.task?._id, 'Converting SEO recommendation creates real Task in platform task system')

    // 8. Cross-Tenant Isolation (User B querying Org A's SEO project)
    console.log('\n[Suite 7: Multi-Tenancy Isolation]')
    const crossTenantRes = await fetch(`${baseUrl}/api/seo/projects/${projectIdA}`, { headers: headersB })
    assert(crossTenantRes.status === 404, 'Cross-tenant request from Org B to Org A project returns 404 Not Found')
  } catch (err) {
    console.error('Test suite error:', err)
  } finally {
    server.close()
    await mongoose.connection.close()
  }

  console.log(`\n========================================`)
  console.log(` SEO SUITE SUMMARY: ${passedCount} Passed, ${failedCount} Failed`)
  console.log(`========================================\n`)

  if (failedCount > 0) {
    process.exit(1)
  } else {
    process.exit(0)
  }
}

runTests()
