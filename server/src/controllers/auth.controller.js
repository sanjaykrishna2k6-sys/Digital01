import crypto from 'crypto'
import Organization from '../models/Organization.js'
import User from '../models/User.js'
import { generateToken, setAuthCookie, clearAuthCookie } from '../utils/token.js'
import {
  generateOAuthState,
  getGoogleAuthorizationUrl,
  exchangeCodeForTokens,
  getGoogleUserProfile,
} from '../services/googleOAuth.service.js'
import { sendPasswordResetEmail } from '../services/email.service.js'

/**
 * Check if the system has been initialized with at least one user.
 * GET /api/auth/initialized
 */
export async function checkInitialized(req, res, next) {
  try {
    const userCount = await User.countDocuments()
    res.status(200).json({
      status: 'success',
      initialized: userCount > 0,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Bootstrap the first Super Admin and primary agency organization.
 * POST /api/auth/bootstrap
 * Permanently locks once a user exists.
 */
export async function bootstrap(req, res, next) {
  try {
    const userCount = await User.countDocuments()
    if (userCount > 0) {
      return res.status(403).json({
        status: 'fail',
        message: 'System has already been initialized. Bootstrap is permanently locked.',
      })
    }

    const { name, email, password, organizationName } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Name, email, and password are required for initial setup.',
      })
    }

    if (password.length < 8) {
      return res.status(400).json({
        status: 'fail',
        message: 'Password must be at least 8 characters long.',
      })
    }

    // 1. Create primary organization
    const org = await Organization.create({
      name: (organizationName || 'Scalevo Agency').trim(),
      plan: 'enterprise',
      status: 'active',
      settings: {
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      },
    })

    // 2. Create the first Super Admin
    const user = await User.create({
      organization: org._id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'super_admin',
      authProvider: 'local',
      status: 'active',
      lastLoginAt: new Date(),
    })

    // 3. Generate token & set HTTP-only cookie
    const token = generateToken({
      userId: user._id,
      organizationId: org._id,
      role: user.role,
    })
    setAuthCookie(res, token)

    res.status(201).json({
      status: 'success',
      message: 'First Super Admin and primary organization created successfully.',
      data: {
        user,
        organization: org,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Public User & Organization Signup
 * POST /api/auth/signup
 *
 * Rules:
 * 1. Creates a new Organization.
 * 2. Creates the first User belonging to that organization with role 'agency_admin'.
 * 3. NEVER allows public signup to create super_admin or arbitrary roles.
 * 4. Never accepts organizationId from client.
 * 5. Password minimum 10 characters with complexity.
 * 6. Sets secure HTTP-only authentication session cookie.
 */
export async function signup(req, res, next) {
  try {
    const { name, email, password, organizationName } = req.body

    // 1. Malformed input checks & type validations
    if (
      !name ||
      typeof name !== 'string' ||
      !email ||
      typeof email !== 'string' ||
      !password ||
      typeof password !== 'string' ||
      !organizationName ||
      typeof organizationName !== 'string'
    ) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide valid strings for name, email, password, and organization name.',
      })
    }

    const trimmedName = name.trim()
    const trimmedEmail = email.toLowerCase().trim()
    const trimmedOrgName = organizationName.trim()

    if (trimmedName.length < 2) {
      return res.status(400).json({
        status: 'fail',
        message: 'Name must be at least 2 characters long.',
      })
    }

    if (trimmedOrgName.length < 2) {
      return res.status(400).json({
        status: 'fail',
        message: 'Organization name must be at least 2 characters long.',
      })
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid email address.',
      })
    }

    // Password requirements: min 10 chars and reasonable complexity (letter + digit)
    if (password.length < 10) {
      return res.status(400).json({
        status: 'fail',
        message: 'Password must be at least 10 characters long.',
      })
    }

    const hasLetter = /[a-zA-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    if (!hasLetter || !hasNumber) {
      return res.status(400).json({
        status: 'fail',
        message: 'Password must contain at least one letter and one number.',
      })
    }

    // 2. Prevent duplicate user account creation
    const existingUser = await User.findOne({ email: trimmedEmail })
    if (existingUser) {
      return res.status(409).json({
        status: 'fail',
        message: 'An account with this email address already exists. Please sign in instead.',
      })
    }

    // 3. Create a new organization
    const org = await Organization.create({
      name: trimmedOrgName,
      plan: 'growth',
      status: 'active',
      settings: {
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      },
    })

    // 4. Create the first user for this organization (Always agency_admin, NEVER super_admin)
    const user = await User.create({
      organization: org._id,
      name: trimmedName,
      email: trimmedEmail,
      password,
      role: 'agency_admin', // Enforced on backend - ignores any role sent by client
      authProvider: 'local',
      status: 'active',
      lastLoginAt: new Date(),
    })

    // 5. Generate secure session token & set HTTP-only cookie
    const token = generateToken({
      userId: user._id,
      organizationId: org._id,
      role: user.role,
    })
    setAuthCookie(res, token)

    // 6. Return safe sanitized response (password deleted via toJSON)
    res.status(201).json({
      status: 'success',
      message: 'Account and agency workspace created successfully.',
      data: {
        user,
        organization: org,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Login user and issue HTTP-only authentication cookie.
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide both email and password.',
      })
    }

    // Find user by lowercase email and include hidden password
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password')
      .populate('organization')

    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid email or password.',
      })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid email or password.',
      })
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        status: 'fail',
        message: `Account is ${user.status}. Please contact an administrator.`,
      })
    }

    if (!user.organization || user.organization.status !== 'active') {
      return res.status(403).json({
        status: 'fail',
        message: 'Organization workspace is suspended or inactive.',
      })
    }

    // Issue JWT inside HTTP-only cookie
    const token = generateToken({
      userId: user._id,
      organizationId: user.organization._id,
      role: user.role,
    })
    setAuthCookie(res, token)

    // Update last login timestamp without re-validating password
    user.lastLoginAt = new Date()
    await user.save({ validateBeforeSave: false })

    // User toJSON strips password
    res.status(200).json({
      status: 'success',
      message: 'Logged in successfully.',
      data: {
        user,
        organization: user.organization,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Logout user and clear HTTP-only cookie.
 * POST /api/auth/logout
 */
export async function logout(req, res) {
  clearAuthCookie(res)
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully.',
  })
}

/**
 * Get current authenticated user profile & organization.
 * GET /api/auth/me
 */
export async function getMe(req, res) {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
      organization: req.organization,
    },
  })
}

function getClientUrl(req) {
  if (process.env.CLIENT_URL && !process.env.CLIENT_URL.includes('localhost')) {
    return process.env.CLIENT_URL.replace(/\/+$/, '')
  }
  const referer = req.headers.referer || req.headers.origin
  if (referer) {
    try {
      const url = new URL(referer)
      return url.origin
    } catch (e) {
      // fallback
    }
  }
  const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:5173'
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'http'
  if (host.includes(':5000')) {
    return `${protocol}://${host.replace(':5000', ':5173')}`
  }
  return `${protocol}://${host}`
}

/**
 * Initiate Google OAuth 2.0 flow
 * GET /api/auth/google
 */
export async function initiateGoogleAuth(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientUrl = getClientUrl(req)

  // If Google OAuth credentials are not set or left as placeholders, redirect back with a friendly message
  if (!clientId || clientId === 'google_client_id_placeholder' || clientId.includes('placeholder')) {
    const referer = req.headers.referer || ''
    const redirectTarget = referer.includes('/signup') ? `${clientUrl}/signup` : `${clientUrl}/login`
    return res.redirect(`${redirectTarget}?error=google_oauth_not_configured`)
  }

  const state = generateOAuthState()
  const isProduction = process.env.NODE_ENV === 'production'

  // Set CSRF state in short-lived HTTP-only cookie
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/',
  })

  const authUrl = getGoogleAuthorizationUrl(state)
  res.redirect(authUrl)
}

/**
 * Google OAuth 2.0 Callback Handler
 * GET /api/auth/google/callback
 */
export async function handleGoogleCallback(req, res, next) {
  const isProduction = process.env.NODE_ENV === 'production'
  const clientUrl = getClientUrl(req)

  try {
    const { code, state, error } = req.query
    const savedState = req.cookies?.oauth_state

    // Clear state cookie regardless of outcome
    res.clearCookie('oauth_state', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
    })

    if (error) {
      if (req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ status: 'fail', message: `Google authentication failed: ${error}` })
      }
      return res.redirect(`${clientUrl}/login?error=${encodeURIComponent(error)}`)
    }

    // Verify OAuth CSRF state parameter
    if (!state || !savedState || state !== savedState) {
      if (req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ status: 'fail', message: 'Invalid or missing OAuth state parameter.' })
      }
      return res.redirect(`${clientUrl}/login?error=invalid_oauth_state`)
    }

    if (!code) {
      if (req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ status: 'fail', message: 'Missing authorization code.' })
      }
      return res.redirect(`${clientUrl}/login?error=missing_auth_code`)
    }

    // Exchange authorization code for access token
    const tokenData = await exchangeCodeForTokens(code)
    if (!tokenData?.access_token) {
      if (req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ status: 'fail', message: 'Unable to retrieve access token from Google.' })
      }
      return res.redirect(`${clientUrl}/login?error=token_exchange_failed`)
    }

    // Fetch user profile from Google UserInfo endpoint
    const profile = await getGoogleUserProfile(tokenData.access_token)
    if (!profile || !profile.email) {
      if (req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ status: 'fail', message: 'Google profile does not contain an email address.' })
      }
      return res.redirect(`${clientUrl}/login?error=no_email_in_profile`)
    }

    // Verify email status from Google OpenID Connect
    if (profile.email_verified === false) {
      if (req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ status: 'fail', message: 'Google account email is not verified.' })
      }
      return res.redirect(`${clientUrl}/login?error=unverified_google_email`)
    }

    const normalizedEmail = profile.email.toLowerCase().trim()
    let user = null

    // CASE B: Existing user with matching googleId
    user = await User.findOne({ googleId: profile.sub }).populate('organization')

    if (!user) {
      // CASE A: Existing user with matching verified email -> Link identity
      user = await User.findOne({ email: normalizedEmail }).populate('organization')
      if (user) {
        user.googleId = profile.sub
        if (!user.avatar && profile.picture) {
          user.avatar = profile.picture
        }
        user.lastLoginAt = new Date()
        await user.save({ validateBeforeSave: false })
      }
    }

    if (!user) {
      // CASE C: Completely new Google user -> Provision new organization & agency_admin user
      const orgName = profile.name ? `${profile.name}'s Agency` : 'Scalevo Agency'
      const org = await Organization.create({
        name: orgName,
        plan: 'growth',
        status: 'active',
        settings: {
          currency: 'INR',
          timezone: 'Asia/Kolkata',
        },
      })

      user = await User.create({
        organization: org._id,
        name: profile.name || 'Google User',
        email: normalizedEmail,
        googleId: profile.sub,
        authProvider: 'google',
        role: 'agency_admin', // NEVER super_admin
        status: 'active',
        avatar: profile.picture || '',
        lastLoginAt: new Date(),
      })
      user.organization = org
    }

    // Account status check
    if (user.status !== 'active') {
      if (req.headers.accept?.includes('application/json')) {
        return res.status(403).json({ status: 'fail', message: `Account is ${user.status}. Please contact an administrator.` })
      }
      return res.redirect(`${clientUrl}/login?error=account_inactive`)
    }

    if (!user.organization || user.organization.status !== 'active') {
      if (req.headers.accept?.includes('application/json')) {
        return res.status(403).json({ status: 'fail', message: 'Organization workspace is inactive or suspended.' })
      }
      return res.redirect(`${clientUrl}/login?error=org_inactive`)
    }

    // Update last login
    user.lastLoginAt = new Date()
    await user.save({ validateBeforeSave: false })

    // Issue authentication session cookie
    const sessionToken = generateToken({
      userId: user._id,
      organizationId: user.organization._id || user.organization,
      role: user.role,
    })
    setAuthCookie(res, sessionToken)

    if (req.headers.accept?.includes('application/json')) {
      return res.status(200).json({
        status: 'success',
        message: 'Google authentication successful.',
        data: {
          user,
          organization: user.organization,
        },
      })
    }

    return res.redirect(`${clientUrl}/dashboard`)
  } catch (err) {
    if (req.headers.accept?.includes('application/json')) {
      return res.status(500).json({ status: 'error', message: err.message || 'Internal OAuth error' })
    }
    return res.redirect(`${clientUrl}/login?error=${encodeURIComponent(err.message || 'auth_internal_error')}`)
  }
}

/**
 * Forgot Password Request
 * POST /api/auth/forgot-password
 *
 * Security:
 * - Always returns a generic success response regardless of email existence.
 * - Single-use token expires in 30 minutes.
 * - Stores only SHA-256 hash of the token.
 */
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body

    const genericResponse = {
      status: 'success',
      message: 'If an account exists with that email, a password reset link has been sent.',
    }

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid email address.',
      })
    }

    const trimmedEmail = email.toLowerCase().trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid email address.',
      })
    }

    const user = await User.findOne({ email: trimmedEmail })
    if (!user) {
      // Do not reveal whether user exists
      return res.status(200).json(genericResponse)
    }

    // Generate random 32-byte token
    const resetToken = crypto.randomBytes(32).toString('hex')
    // Compute SHA-256 hash to store in database
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')

    user.passwordResetTokenHash = tokenHash
    user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes validity
    await user.save({ validateBeforeSave: false })

    const clientUrl = getClientUrl(req)
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`

    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
      resetToken,
    })

    return res.status(200).json(genericResponse)
  } catch (err) {
    next(err)
  }
}

/**
 * Reset Password with token
 * POST /api/auth/reset-password
 *
 * Requirements:
 * - Verifies token hash and expiration.
 * - Ensures token has not been used.
 * - Validates new password minimum 10 characters and complexity.
 * - Hashes password using bcrypt.
 * - Invalidates reset token immediately.
 */
export async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        status: 'fail',
        message: 'Password reset token is required.',
      })
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({
        status: 'fail',
        message: 'New password is required.',
      })
    }

    if (newPassword.length < 10) {
      return res.status(400).json({
        status: 'fail',
        message: 'Password must be at least 10 characters long.',
      })
    }

    const hasLetter = /[a-zA-Z]/.test(newPassword)
    const hasNumber = /[0-9]/.test(newPassword)
    if (!hasLetter || !hasNumber) {
      return res.status(400).json({
        status: 'fail',
        message: 'Password must contain at least one letter and one number.',
      })
    }

    // Compute token hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Find user with matching hash and unexpired token
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    }).select('+password +passwordResetTokenHash +passwordResetExpiresAt')

    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'Password reset token is invalid or has expired.',
      })
    }

    // Update password (bcrypt pre-save hook will hash it)
    user.password = newPassword
    user.passwordResetTokenHash = undefined
    user.passwordResetExpiresAt = undefined
    user.passwordChangedAt = new Date()
    await user.save()

    // Clear any active session cookie for security
    clearAuthCookie(res)

    res.status(200).json({
      status: 'success',
      message: 'Password has been reset successfully. Please log in with your new password.',
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Change Password for Authenticated User
 * POST /api/auth/change-password
 */
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'fail',
        message: 'Both current password and new password are required.',
      })
    }

    if (newPassword.length < 10) {
      return res.status(400).json({
        status: 'fail',
        message: 'New password must be at least 10 characters long.',
      })
    }

    const hasLetter = /[a-zA-Z]/.test(newPassword)
    const hasNumber = /[0-9]/.test(newPassword)
    if (!hasLetter || !hasNumber) {
      return res.status(400).json({
        status: 'fail',
        message: 'New password must contain at least one letter and one number.',
      })
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        status: 'fail',
        message: 'New password cannot be identical to your current password.',
      })
    }

    const user = await User.findById(req.user._id).select('+password')
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User account not found.',
      })
    }

    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(400).json({
        status: 'fail',
        message: 'Current password is incorrect.',
      })
    }

    user.password = newPassword
    user.passwordChangedAt = new Date()
    await user.save()

    // Re-issue updated session cookie
    const token = generateToken({
      userId: user._id,
      organizationId: req.organizationId,
      role: user.role,
    })
    setAuthCookie(res, token)

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully.',
    })
  } catch (err) {
    next(err)
  }
}
