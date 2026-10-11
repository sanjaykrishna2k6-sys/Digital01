import Notification from '../models/Notification.js'

export async function listNotifications(req, res, next) {
  try {
    const organizationId = req.organizationId
    const { isRead, limit = 20 } = req.query

    const filter = {
      organizationId,
      $or: [
        { userId: req.user._id },
        { userId: { $exists: false } },
        { userId: null },
      ],
    }

    if (isRead !== undefined) {
      filter.isRead = isRead === 'true'
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))

    const unreadCount = await Notification.countDocuments({
      ...filter,
      isRead: false,
    })

    res.json({
      status: 'success',
      data: {
        notifications,
        unreadCount,
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function markAsRead(req, res, next) {
  try {
    const { id } = req.params

    if (id === 'read-all') {
      await Notification.updateMany(
        {
          organizationId: req.organizationId,
          $or: [{ userId: req.user._id }, { userId: null }],
          isRead: false,
        },
        { isRead: true }
      )
      return res.json({ status: 'success', message: 'All notifications marked as read' })
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        organizationId: req.organizationId,
      },
      { isRead: true },
      { new: true }
    )

    if (!notification) {
      return res.status(404).json({ status: 'fail', message: 'Notification not found' })
    }

    res.json({
      status: 'success',
      data: { notification },
    })
  } catch (err) {
    next(err)
  }
}
