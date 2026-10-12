import assert from 'assert'
import { connectDB, disconnectDB } from '../config/db.js'
import { queryAIMarketingAssistant } from '../controllers/ai.controller.js'
import User from '../models/User.js'
import Organization from '../models/Organization.js'

async function runTests() {
  console.log('Testing Krishpo AI Marketing Assistant Modal Queries (/api/ai/query)...')

  const prompts = [
    'Why did organic clicks decline this month?',
    'Which Shopify products need attention or restocking?',
    'What are our top SEO recommendations for this client?',
    'Summarize overall client performance and deliverable status.',
    'How should we allocate our budget across Meta and Google?',
  ]

  for (const question of prompts) {
    let statusCode = null
    let responseData = null

    const req = {
      body: { question },
      organizationId: null,
      user: null,
    }

    const res = {
      status(code) {
        statusCode = code
        return this
      },
      json(data) {
        responseData = data
        return this
      },
    }

    let nextError = null
    const next = (err) => { nextError = err }

    await queryAIMarketingAssistant(req, res, next)

    assert.strictEqual(nextError, null, `Query '${question}' failed with error: ${nextError}`)
    assert.strictEqual(statusCode, 200, `Expected 200 for '${question}', got ${statusCode}`)
    assert.strictEqual(responseData?.status, 'success')
    assert.ok(responseData?.data?.answer, 'Answer must exist in response')
    assert.ok(responseData.data.answer.observations.length > 0, 'Observations must be non-empty')
    assert.ok(responseData.data.answer.recommendations.length > 0, 'Recommendations must be non-empty')
    assert.ok(responseData.data.answer.summary.length > 0, 'Summary must be non-empty')
    assert.ok(responseData.data.answer.reportingPeriod, 'Reporting period must exist')
    console.log(`✅ Passed for prompt: "${question}" -> Category: [${responseData.data.answer.category}]`)
  }

  console.log('🎉 All modal query prompts passed successfully!')
  await disconnectDB()
}

runTests().catch(async (err) => {
  console.error('❌ Test failed:', err)
  await disconnectDB().catch(() => {})
  process.exit(1)
})
