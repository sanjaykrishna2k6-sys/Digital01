import mongoose from 'mongoose'
import User from '../models/User.js'

/**
 * Check if the authenticated requester has client role (forbidden from user management API)
 */
function checkNotClient(req, res) {
  if (req.user?.role === 'client') {
    res.status(403).json({
      status: 'fail',
      message: 'Client users are not permitted to access the User Management API.',
    })
    return false
  }
  return true
}

/**
 * Check if the requester has management permissions (super_admin or agency_admin)
 */
function checkCanManage(req, res) {
  if (!checkNotClient(req, res)) return false

  if (req.user.role !== 'super_admin' && req.user.role !== 'agency_admin') {
    res.status(403).json({
      status: 'fail',
      message: 'Access denied. Only Super Admins and Agency Admins can perform this action.',
    })
    return false
  }
  return true
}

/**
 * GET /api/users
 * List users belonging to current user's organization (or scoped by organization).
 * Supports search, role, and status filtering.
 */
export async function getUsers(req, res, next) {
  try {
    if (!checkNotClient(req, res)) return

    const { search, role, status } = req.query

    // Base filter enforced by session organization context
    const filter = {
      organization: req.organizationId,
    }

    // Role filter
    if (role && role !== 'all') {
      filter.role = role
    }

    // Status filter
    if (status && status !== 'all') {
      filter.status = status
    }

    // Search query on name or email (case-insensitive)
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i')
      filter.$or = [{ name: searchRegex }, { email: searchRegex }]
    }

    const users = await User.find(filter)
      .select('-password')
      .populate('organization', 'name slug plan')
      .sort({ createdAt: -1 })

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/users/:id
 * Retrieve single user by ID with tenant isolation check.
 */
export async function getUserById(req, res, next) {
  try {
    if (!checkNotClient(req, res)) return

    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid user ID format.',
      })
    }

    const user = await User.findById(id)
      .select('-password')
      .populate('organization', 'name slug plan')

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found.',
      })
    }

    // Enforce tenant isolation for non-super_admins
    if (
      req.user.role !== 'super_admin' &&
      user.organization?._id.toString() !== req.organizationId.toString()
    ) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found in your organization workspace.',
      })
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/users
 * Create a new user strictly within the requester's organization.
 */
export async function createUser(req, res, next) {
  try {
    if (!checkCanManage(req, res)) return

    const { name, email, password, role } = req.body

    // Prevent privilege escalation: Agency Admin cannot create Super Admin
    if (req.user.role === 'agency_admin' && role === 'super_admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'Agency Admins cannot create Super Admin accounts.',
      })
    }

    // Check if email already exists
    const normalizedEmail = email.toLowerCase().trim()
    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      return res.status(409).json({
        status: 'fail',
        message: 'A user with this email address already exists.',
      })
    }

    // Organization is strictly derived from authenticated session context
    const newUser = await User.create({
      organization: req.organizationId,
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
      status: 'active',
    })

    // Populate organization details
    const populatedUser = await User.findById(newUser._id)
      .select('-password')
      .populate('organization', 'name slug plan')

    res.status(201).json({
      status: 'success',
      message: 'User created successfully.',
      data: {
        user: populatedUser,
      },
    })
  } catch (err) {
    // Handle duplicate key error from MongoDB gracefully if race condition occurs
    if (err.code === 11000) {
      return res.status(409).json({
        status: 'fail',
        message: 'A user with this email address already exists.',
      })
    }
    next(err)
  }
}

/**
 * PATCH /api/users/:id
 * Update user details (name, email, role, avatar, password)
 */
export async function updateUser(req, res, next) {
  try {
    if (!checkCanManage(req, res)) return

    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid user ID format.',
      })
    }

    const targetUser = await User.findById(id)
    if (!targetUser) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found.',
      })
    }

    // Enforce tenant isolation for non-super_admins
    if (
      req.user.role !== 'super_admin' &&
      targetUser.organization.toString() !== req.organizationId.toString()
    ) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found in your organization workspace.',
      })
    }

    // Protect Super Admin: Agency Admin cannot modify Super Admin
    if (targetUser.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'Agency Admins cannot modify Super Admin accounts.',
      })
    }

    const { name, email, role, avatar, password } = req.body

    // Prevent privilege escalation: Agency Admin cannot assign super_admin role
    if (role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'Privilege escalation denied. Only Super Admins can assign super_admin role.',
      })
    }

    // If target user is super_admin and trying to change role
    if (targetUser.role === 'super_admin' && role && role !== 'super_admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'Cannot demote the Super Admin account.',
      })
    }

    // Email uniqueness check if changing email
    if (email) {
      const normalizedEmail = email.toLowerCase().trim()
      if (normalizedEmail !== targetUser.email) {
        const emailInUse = await User.findOne({ email: normalizedEmail, _id: { $ne: targetUser._id } })
        if (emailInUse) {
          return res.status(409).json({
            status: 'fail',
            message: 'A user with this email address already exists.',
          })
        }
        targetUser.email = normalizedEmail
      }
    }

    if (name) targetUser.name = name.trim()
    if (role) targetUser.role = role
    if (avatar !== undefined) targetUser.avatar = avatar
    if (password) targetUser.password = password // pre-save hook will hash

    await targetUser.save()

    const updatedUser = await User.findById(targetUser._id)
      .select('-password')
      .populate('organization', 'name slug plan')

    res.status(200).json({
      status: 'success',
      message: 'User updated successfully.',
      data: {
        user: updatedUser,
      },
    })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        status: 'fail',
        message: 'A user with this email address already exists.',
      })
    }
    next(err)
  }
}

/**
 * PATCH /api/users/:id/status
 * Toggle or set user status (active / inactive)
 */
export async function updateUserStatus(req, res, next) {
  try {
    if (!checkCanManage(req, res)) return

    const { id } = req.params
    const { status } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid user ID format.',
      })
    }

    const targetUser = await User.findById(id)
    if (!targetUser) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found.',
      })
    }

    // Tenant isolation
    if (
      req.user.role !== 'super_admin' &&
      targetUser.organization.toString() !== req.organizationId.toString()
    ) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found in your organization workspace.',
      })
    }

    // Protect Super Admin from accidental deactivation
    if (targetUser.role === 'super_admin' && status === 'inactive') {
      return res.status(403).json({
        status: 'fail',
        message: 'Super Admin account cannot be deactivated.',
      })
    }

    // Agency Admin cannot change Super Admin status
    if (targetUser.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'Agency Admins cannot modify Super Admin accounts.',
      })
    }

    // Prevent deactivating own account
    if (targetUser._id.toString() === req.user._id.toString() && status === 'inactive') {
      return res.status(400).json({
        status: 'fail',
        message: 'You cannot deactivate your own account.',
      })
    }

    targetUser.status = status
    await targetUser.save({ validateBeforeSave: false })

    const updatedUser = await User.findById(targetUser._id)
      .select('-password')
      .populate('organization', 'name slug plan')

    res.status(200).json({
      status: 'success',
      message: `User status successfully updated to ${status}.`,
      data: {
        user: updatedUser,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/users/:id
 * Delete user from the organization.
 */
export async function deleteUser(req, res, next) {
  try {
    if (!checkCanManage(req, res)) return

    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid user ID format.',
      })
    }

    const targetUser = await User.findById(id)
    if (!targetUser) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found.',
      })
    }

    // Tenant isolation
    if (
      req.user.role !== 'super_admin' &&
      targetUser.organization.toString() !== req.organizationId.toString()
    ) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found in your organization workspace.',
      })
    }

    // Protect Super Admin: Super Admin cannot be deleted
    if (targetUser.role === 'super_admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'Super Admin account cannot be deleted.',
      })
    }

    // Prevent deleting own account
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        status: 'fail',
        message: 'You cannot delete your own account.',
      })
    }

    await targetUser.deleteOne()

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully.',
    })
  } catch (err) {
    next(err)
  }
}
