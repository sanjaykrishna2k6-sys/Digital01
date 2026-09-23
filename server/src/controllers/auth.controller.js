import Organization from '../models/Organization.js'
import User from '../models/User.js'
import { generateToken, setAuthCookie, clearAuthCookie } from '../utils/token.js'

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
