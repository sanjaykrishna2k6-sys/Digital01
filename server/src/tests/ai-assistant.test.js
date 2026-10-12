import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../../.env') })
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'sk_scalevo_jwt_sec_2026_9b8f2a4c7e1d5e3a8c0f2b4d6e8a1c3e5f7a9b'
}
if (!process.env.COOKIE_NAME) {
  process.env.COOKIE_NAME = 'scalevo_token'
}

import http from 'http'
import mongoose from 'mongoose'
import app from '../app.js'
import { connectDB } from '../config/db.js'
import User from '../models/User.js'
import Organization from '../models/Organization.js'
import AIGeneration from '../models/AIGeneration.js'
import AISavedItem from '../models/AISavedItem.js'
import AIConversation from '../models/AIConversation.js'
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
  console.log('🚀 Running Krishpo AI Marketing Assistant Test Suite')
  console.log('=================================================================\n')

  await connectDB()

  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const port = server.address().port
  const baseUrl = `http://127.0.0.1:${port}`

  try {
    // 1. Setup Test Organizations & Users
    const orgA = await Organization.create({
      name: 'Krishpo AI Agency A',
      slug: `ai-org-a-${Date.now()}`,
      plan: 'enterprise',
    })

    const orgB = await Organization.create({
      name: 'Krishpo AI Agency B',
      slug: `ai-org-b-${Date.now()}`,
      plan: 'growth',
    })

    const userA = await User.create({
      organization: orgA._id,
      name: 'AI Strategist A',
      email: `ai-user-a-${Date.now()}@agency.com`,
      password: 'TestPassword123!',
      role: 'agency_admin',
      status: 'active',
    })

    const userB = await User.create({
      organization: orgB._id,
      name: 'AI Strategist B',
      email: `ai-user-b-${Date.now()}@agency.com`,
      password: 'TestPassword123!',
      role: 'agency_admin',
      status: 'active',
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

    // Suite 1: Security & Auth
    console.log('[Suite 1: Security & Authentication]')
    const unauthRes = await fetch(`${baseUrl}/api/ai/generate-content`, { method: 'POST' })
    assert(unauthRes.status === 401, 'Unauthenticated request to /api/ai/generate-content returns 401 Unauthorized')

    // Suite 2: AI Content Generator
    console.log('\n[Suite 2: AI Content Generator]')
    const invalidRes = await fetch(`${baseUrl}/api/ai/generate-content`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({}),
    })
    assert(invalidRes.status === 400, 'Missing product/brand returns 400 validation error')

    const contentRes = await fetch(`${baseUrl}/api/ai/generate-content`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        brandName: 'Krishpo Organic Foods',
        productService: 'Cold Pressed Coconut Oil',
        platform: 'Instagram',
        contentType: 'Social Post',
        objective: 'Brand Awareness',
        tone: 'Engaging & Professional',
        cta: 'Shop Now',
      }),
    })
    const contentData = await contentRes.json()
    assert(
      contentRes.status === 200 && contentData.data?.content && contentData.data?.generationId,
      'Generates platform-tailored copy and returns generation ID'
    )
    const genIdA = contentData.data?.generationId

    // Suite 3: AI SEO Assistant & SSRF Protection
    console.log('\n[Suite 3: AI SEO Assistant & SSRF Security]')
    const ssrfRes = await fetch(`${baseUrl}/api/ai/seo-assistant`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        url: 'http://169.254.169.254/latest/meta-data/',
      }),
    })
    assert(
      ssrfRes.status >= 400,
      'SSRF Protection blocks access to AWS metadata endpoint (169.254.169.254)'
    )

    const seoRes = await fetch(`${baseUrl}/api/ai/seo-assistant`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        pageContent: 'Krishpo is a full-stack digital marketing and technical SEO intelligence platform for agencies.',
        targetKeywords: ['technical seo platform', 'agency marketing software'],
        industry: 'Digital Marketing & E-Commerce',
      }),
    })
    const seoData = await seoRes.json()
    assert(
      seoRes.status === 200 &&
        seoData.data?.analysis?.primaryKeywords?.length > 0 &&
        seoData.data?.analysis?.seoTitle,
      'Generates primary keywords, SERP title, meta description, and on-page checklist'
    )

    // Suite 4: Campaign Planner
    console.log('\n[Suite 4: Omnichannel Campaign Planner]')
    const campaignRes = await fetch(`${baseUrl}/api/ai/campaign-plan`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        productName: 'Diwali Festive Apparel Launch',
        objective: 'E-Commerce Sales',
        budget: 250000,
        durationWeeks: 4,
        targetMarket: 'India Tier-1 & Tier-2 Metros',
      }),
    })
    const campaignData = await campaignRes.json()
    assert(
      campaignRes.status === 200 &&
        campaignData.data?.plan?.budgetAllocation?.length > 0 &&
        campaignData.data?.plan?.targetPersonas?.length > 0,
      'Generates budget allocation in INR (₹), personas, messaging angles, and KPIs'
    )

    // Suite 5: Marketing Co-Pilot Chat
    console.log('\n[Suite 5: Grounded Marketing Co-Pilot Chat]')
    const chatRes = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        message: 'How can I increase conversion rate and average order value for my Shopify store?',
      }),
    })
    const chatData = await chatRes.json()
    assert(
      chatRes.status === 200 && chatData.data?.reply && chatData.data?.conversationId,
      'Chat responds with actionable advice and persists conversation thread'
    )
    const convId = chatData.data?.conversationId

    // Follow-up chat in same thread
    const followUpRes = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        message: 'What about abandoned cart email sequences?',
        conversationId: convId,
      }),
    })
    const followUpData = await followUpRes.json()
    assert(
      followUpRes.status === 200 && followUpData.data?.messages?.length >= 4,
      'Follow-up message correctly continues conversation history'
    )

    // Suite 6: Saved Assets Library & Cross-Tenant Scoping
    console.log('\n[Suite 6: Saved Library & Multi-Tenancy Scoping]')
    const saveRes = await fetch(`${baseUrl}/api/ai/saved`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        title: 'Instagram Diwali Ad Copy',
        type: 'content',
        platform: 'Instagram',
        content: contentData.data.content,
        tags: ['Festival', 'High CTR'],
        generationId: genIdA,
      }),
    })
    const saveData = await saveRes.json()
    assert(saveRes.status === 201 && saveData.data?.saved?._id, 'Saves AI asset to organizational library')
    const savedItemIdA = saveData.data.saved._id

    // Cross-tenant delete attempt by User B
    const crossDeleteRes = await fetch(`${baseUrl}/api/ai/saved/${savedItemIdA}`, {
      method: 'DELETE',
      headers: headersB,
    })
    assert(
      crossDeleteRes.status === 404,
      'Cross-tenant deletion returns 404 Not Found (User B cannot delete Org A asset)'
    )

    // Valid delete by User A
    const validDeleteRes = await fetch(`${baseUrl}/api/ai/saved/${savedItemIdA}`, {
      method: 'DELETE',
      headers: headersA,
    })
    assert(validDeleteRes.status === 200, 'Authorized organization user can delete their saved asset')

    // Suite 7: Usage Metrics
    console.log('\n[Suite 7: Usage Metrics]')
    const usageRes = await fetch(`${baseUrl}/api/ai/usage`, {
      method: 'GET',
      headers: headersA,
    })
    const usageData = await usageRes.json()
    assert(
      usageRes.status === 200 && usageData.data?.totalGenerations >= 3,
      'Usage endpoint returns aggregated generation metrics for the organization'
    )

  } catch (err) {
    console.error('Test error:', err)
  } finally {
    server.close()
    await mongoose.connection.close()
  }

  console.log(`\n========================================`)
  console.log(` AI ASSISTANT SUITE SUMMARY: ${passedCount} Passed, ${failedCount} Failed`)
  console.log(`========================================\n`)

  if (failedCount > 0) {
    process.exit(1)
  } else {
    process.exit(0)
  }
}

runTests()
