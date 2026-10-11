import Content from '../models/Content.js'
import Approval from '../models/Approval.js'
import Client from '../models/Client.js'
import Notification from '../models/Notification.js'

export async function listContent(req, res, next) {
  try {
    const organizationId = req.organizationId
    const { clientId, contentType, platform, status, search, page = 1, limit = 50 } = req.query

    const filter = { organizationId }

    // If client user, ensure they can only view content belonging to their assigned client
    if (req.user.role === 'client') {
      const clientRecord = await Client.findOne({ organizationId, email: req.user.email.toLowerCase() })
      if (!clientRecord) {
        return res.json({
          status: 'success',
          data: { content: [], pagination: { total: 0, page: 1, pages: 1 } },
        })
      }
      filter.clientId = clientRecord._id
    } else if (clientId) {
      filter.clientId = clientId
    }

    if (contentType) filter.contentType = contentType
    if (platform) filter.platform = platform
    if (status) filter.status = status
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } },
      ]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const total = await Content.countDocuments(filter)
    const content = await Content.find(filter)
      .populate('clientId', 'companyName contactName email')
      .populate('campaignId', 'name platform')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    res.json({
      status: 'success',
      data: {
        content,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)) || 1,
        },
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function getContent(req, res, next) {
  try {
    const filter = {
      _id: req.params.id,
      organizationId: req.organizationId,
    }

    if (req.user.role === 'client') {
      const clientRecord = await Client.findOne({
        organizationId: req.organizationId,
        email: req.user.email.toLowerCase(),
      })
      if (!clientRecord) {
        return res.status(403).json({ status: 'fail', message: 'Access denied' })
      }
      filter.clientId = clientRecord._id
    }

    const contentItem = await Content.findOne(filter)
      .populate('clientId', 'companyName contactName email')
      .populate('campaignId', 'name platform')
      .populate('createdBy', 'name email')

    if (!contentItem) {
      return res.status(404).json({
        status: 'fail',
        message: 'Content item not found',
      })
    }

    const approvals = await Approval.find({
      organizationId: req.organizationId,
      contentId: contentItem._id,
    })
      .populate('reviewedBy', 'name email role')
      .sort({ createdAt: -1 })

    res.json({
      status: 'success',
      data: {
        content: contentItem,
        approvals,
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function createContent(req, res, next) {
  try {
    const { clientId, campaignId, title, contentType, platform, body, media, scheduledAt, status } = req.body

    const contentItem = await Content.create({
      organizationId: req.organizationId,
      clientId,
      campaignId,
      title,
      contentType,
      platform,
      body,
      media,
      scheduledAt,
      status: status || 'Draft',
      createdBy: req.user._id,
    })

    res.status(201).json({
      status: 'success',
      data: { content: contentItem },
    })
  } catch (err) {
    next(err)
  }
}

export async function updateContent(req, res, next) {
  try {
    const contentItem = await Content.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.organizationId },
      req.body,
      { new: true, runValidators: true }
    )

    if (!contentItem) {
      return res.status(404).json({
        status: 'fail',
        message: 'Content item not found',
      })
    }

    res.json({
      status: 'success',
      data: { content: contentItem },
    })
  } catch (err) {
    next(err)
  }
}

export async function deleteContent(req, res, next) {
  try {
    const contentItem = await Content.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.organizationId,
    })

    if (!contentItem) {
      return res.status(404).json({
        status: 'fail',
        message: 'Content item not found',
      })
    }

    res.json({
      status: 'success',
      message: 'Content item deleted successfully',
    })
  } catch (err) {
    next(err)
  }
}

export async function submitForApproval(req, res, next) {
  try {
    const contentItem = await Content.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    })

    if (!contentItem) {
      return res.status(404).json({ status: 'fail', message: 'Content item not found' })
    }

    contentItem.status = 'Pending Approval'
    await contentItem.save()

    // Create Notification
    try {
      await Notification.create({
        organizationId: req.organizationId,
        type: 'content_pending_approval',
        title: 'Content Pending Approval',
        message: `Content "${contentItem.title}" is ready for client review.`,
        entityType: 'content',
        entityId: contentItem._id,
      })
    } catch (e) {
      // Non-blocking
    }

    res.json({
      status: 'success',
      message: 'Content submitted for client approval',
      data: { content: contentItem },
    })
  } catch (err) {
    next(err)
  }
}

export async function reviewContent(req, res, next) {
  try {
    const { status, comment } = req.body // 'Approved' | 'Rejected' | 'Revision Requested'

    if (!['Approved', 'Rejected', 'Revision Requested'].includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Status must be Approved, Rejected, or Revision Requested',
      })
    }

    const contentItem = await Content.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    })

    if (!contentItem) {
      return res.status(404).json({ status: 'fail', message: 'Content item not found' })
    }

    // Verify client authorization
    if (req.user.role === 'client') {
      const clientRecord = await Client.findOne({
        organizationId: req.organizationId,
        email: req.user.email.toLowerCase(),
      })
      if (!clientRecord || clientRecord._id.toString() !== contentItem.clientId.toString()) {
        return res.status(403).json({
          status: 'fail',
          message: 'Client users can only review content assigned to their company',
        })
      }
    }

    // Update content status
    contentItem.status = status === 'Approved' ? 'Approved' : status === 'Rejected' ? 'Rejected' : 'Draft'
    await contentItem.save()

    // Store Approval audit record
    const approval = await Approval.create({
      organizationId: req.organizationId,
      contentId: contentItem._id,
      clientId: contentItem.clientId,
      status,
      comment: comment || '',
      reviewedAt: new Date(),
      reviewedBy: req.user._id,
    })

    // Create Notification
    try {
      await Notification.create({
        organizationId: req.organizationId,
        type: status === 'Approved' ? 'content_approved' : 'content_rejected',
        title: `Content ${status}`,
        message: `Content "${contentItem.title}" was ${status.toLowerCase()} by client.`,
        entityType: 'content',
        entityId: contentItem._id,
      })
    } catch (e) {
      // Non-blocking
    }

    res.json({
      status: 'success',
      data: {
        content: contentItem,
        approval,
      },
    })
  } catch (err) {
    next(err)
  }
}
