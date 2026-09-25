import bcrypt from 'bcryptjs'
import Organization from '../models/Organization.js'
import User from '../models/User.js'

/**
 * GET /api/settings/organization
 * Fetch organization profile and settings.
 */
export async function getOrganizationSettings(req, res, next) {
  try {
    const organization = await Organization.findById(req.organizationId)
    if (!organization) {
      return res.status(404).json({
        status: 'fail',
        message: 'Organization workspace not found.',
      })
    }

    res.status(200).json({
      status: 'success',
      data: {
        organization,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/settings/organization
 * Update organization settings (admin only).
 */
export async function updateOrganizationSettings(req, res, next) {
  try {
    const { name, settings } = req.body

    const organization = await Organization.findById(req.organizationId)
    if (!organization) {
      return res.status(404).json({
        status: 'fail',
        message: 'Organization workspace not found.',
      })
    }

    if (name && name.trim().length >= 2) {
      organization.name = name.trim()
    }

    if (settings) {
      if (settings.currency) organization.settings.currency = settings.currency
      if (settings.timezone) organization.settings.timezone = settings.timezone
      if (settings.logoUrl !== undefined) organization.settings.logoUrl = settings.logoUrl
    }

    await organization.save()

    res.status(200).json({
      status: 'success',
      message: 'Organization settings updated successfully.',
      data: {
        organization,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/settings/profile
 * Update user's own profile.
 */
export async function updateProfile(req, res, next) {
  try {
    const { name, avatar } = req.body

    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found.',
      })
    }

    if (name && name.trim().length >= 2) {
      user.name = name.trim()
    }
    if (avatar !== undefined) {
      user.avatar = avatar
    }

    await user.save()

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully.',
      data: {
        user,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/settings/password
 * Update user's own password securely with bcrypt.
 */
export async function updatePassword(req, res, next) {
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
        message: 'User not found.',
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

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully.',
    })
  } catch (err) {
    next(err)
  }
}
