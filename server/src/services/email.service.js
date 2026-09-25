/**
 * Safe Email Service Abstraction
 * 
 * Provides an environment-aware email dispatching interface.
 * In development and test environments, emails are captured safely in an in-memory queue
 * without leaking production credentials or logging sensitive reset tokens to standard output.
 */

const testEmailQueue = []

/**
 * Send password reset email with secure one-time link.
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.name - Recipient name
 * @param {string} options.resetUrl - Full reset URL
 * @param {string} options.resetToken - Raw reset token
 */
export async function sendPasswordResetEmail({ to, name, resetUrl, resetToken }) {
  const isProduction = process.env.NODE_ENV === 'production'

  const emailPayload = {
    to: to.toLowerCase().trim(),
    name: name || 'User',
    subject: 'Reset your Scalevo account password',
    resetUrl,
    resetToken,
    sentAt: new Date(),
  }

  // Always store in memory queue for development inspection and automated test suites
  testEmailQueue.push(emailPayload)
  if (testEmailQueue.length > 50) {
    testEmailQueue.shift()
  }

  if (isProduction) {
    // In production, integration with SMTP / SendGrid / AWS SES can be initialized here.
    // Production email credentials must NEVER be hardcoded.
    // If no provider is configured, log safe telemetry without token leakage.
    return { success: true, delivered: false, provider: 'unconfigured_production' }
  }

  // Safe development logging - Never print resetToken directly to standard production logs
  const maskedEmail = to.replace(/^(.)(.*)(@.*)$/, (_, first, middle, domain) => `${first}${'*'.repeat(Math.max(middle.length, 3))}${domain}`)
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[EmailService:Dev] Password reset email safely queued for ${maskedEmail}`)
  }

  return { success: true, delivered: true, provider: 'memory_dev' }
}

/**
 * Retrieve the last sent reset token for a given email (Used exclusively by automated test suites).
 */
export function getTestResetToken(email) {
  const normalized = email.toLowerCase().trim()
  const found = [...testEmailQueue].reverse().find((item) => item.to === normalized)
  return found ? found.resetToken : null
}

/**
 * Clear test email queue.
 */
export function clearTestEmails() {
  testEmailQueue.length = 0
}
