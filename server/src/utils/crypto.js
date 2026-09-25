import crypto from 'crypto'

/**
 * Get or default the 32-byte encryption key for AES-256-GCM token storage.
 */
function getEncryptionKey(key) {
  const hex = key || process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
  if (hex.length === 64) {
    return Buffer.from(hex, 'hex')
  }
  return crypto.createHash('sha256').update(hex).digest()
}

/**
 * Encrypt sensitive token using AES-256-GCM.
 * Output format: <iv_hex>:<auth_tag_hex>:<ciphertext_hex>
 */
export function encryptToken(plainText, key) {
  if (!plainText) return ''
  const encKey = getEncryptionKey(key)
  const iv = crypto.randomBytes(12) // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', encKey, iv)

  let encrypted = cipher.update(plainText, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag().toString('hex')

  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

/**
 * Decrypt sensitive token using AES-256-GCM.
 */
export function decryptToken(encryptedString, key) {
  if (!encryptedString) return ''
  const parts = encryptedString.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format.')
  }

  const [ivHex, authTagHex, cipherHex] = parts
  const encKey = getEncryptionKey(key)
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = crypto.createDecipheriv('aes-256-gcm', encKey, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(cipherHex, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

/**
 * Validate Shopify myshopify.com domain format to prevent open redirects and SSRF.
 */
export function isValidShopDomain(shop) {
  if (!shop || typeof shop !== 'string') return false
  const sanitized = shop.trim().toLowerCase()
  return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(sanitized)
}

/**
 * Verify Shopify OAuth callback HMAC-SHA256 signature.
 */
export function verifyShopifyOAuthHmac(query, apiSecret) {
  const secret = apiSecret || process.env.SHOPIFY_API_SECRET
  if (!secret) return false
  if (!query || !query.hmac) return false

  const { hmac, signature, ...rest } = query

  // Lexicographical sorting of keys
  const message = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join('&')

  const computedHmac = crypto.createHmac('sha256', secret).update(message).digest('hex')

  try {
    return crypto.timingSafeEqual(Buffer.from(computedHmac, 'utf8'), Buffer.from(hmac, 'utf8'))
  } catch (err) {
    return false
  }
}

/**
 * Verify Shopify incoming webhook HMAC-SHA256 signature against raw body buffer.
 */
export function verifyShopifyWebhookHmac(rawBodyBuffer, hmacHeader, webhookSecret) {
  const secret = webhookSecret || process.env.SHOPIFY_WEBHOOK_SECRET || process.env.SHOPIFY_API_SECRET
  if (!secret || !hmacHeader || !rawBodyBuffer) return false

  const computedHmac = crypto.createHmac('sha256', secret).update(rawBodyBuffer).digest('base64')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedHmac, 'utf8'),
      Buffer.from(hmacHeader, 'utf8')
    )
  } catch (err) {
    return false
  }
}
