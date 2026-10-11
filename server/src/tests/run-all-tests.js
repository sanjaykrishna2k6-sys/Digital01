import { execSync } from 'child_process'
import path from 'path'
import fileUrl from 'url'

const testFiles = [
  'user-management.test.js',
  'auth-system.test.js',
  'client-management.test.js',
  'shopify-integration.test.js',
  'seo-management.test.js',
  'campaign-management.test.js',
  'project-management.test.js',
  'task-management.test.js',
  'service-management.test.js',
  'content-approval.test.js',
  'billing-invoicing.test.js',
  'notification-system.test.js',
  'audit-logging.test.js',
  'platform-integration.test.js',
  'seo-shopify-operating-system.test.js'
]

console.log('=== SCALEVO SUITE VERIFICATION RUNNER ===\n')

let totalSuites = testFiles.length
let passedSuites = 0
let failedSuites = 0
let totalTestsCount = 0
let totalPassesCount = 0

const nodeBin = process.execPath

async function main() {
  for (const file of testFiles) {
    const filePath = path.join(process.cwd(), 'src', 'tests', file)
    console.log(`\n----------------------------------------`)
    console.log(` Running: ${file}`)
    console.log(`----------------------------------------`)
    
    try {
      const output = execSync(
        `"${nodeBin}" "${filePath}"`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      )
      console.log(output)
      
      const passedLines = output.split('\n').filter(l => l.includes('✓') || l.includes('[PASS]'))
      totalPassesCount += passedLines.length
      passedSuites++
    } catch (err) {
      console.error(`FAILED: ${file}`)
      console.error(err.stdout || err.message)
      if (err.stderr) console.error(err.stderr)
      failedSuites++
    }
    // Pause 1s for Windows socket/mongod handle cleanup
    await new Promise(r => setTimeout(r, 1000))
  }

  console.log(`\n========================================`)
  console.log(` TEST SUMMARY REPORT`)
  console.log(`========================================`)
  console.log(` Total Test Suites: ${totalSuites}`)
  console.log(` Passed Test Suites: ${passedSuites}`)
  console.log(` Failed Test Suites: ${failedSuites}`)
  console.log(` Total Verifications Passed: ${totalPassesCount}`)
  console.log(`========================================\n`)

  if (failedSuites > 0) {
    process.exit(1)
  } else {
    process.exit(0)
  }
}

main()
