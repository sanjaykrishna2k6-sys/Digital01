import AuditLog from '../models/AuditLog.js'

export async function listAuditLogs(req, res, next) {
  try {
    const organizationId = req.organizationId
    const { action, entity, page = 1, limit = 50 } = req.query

    const filter = { organizationId }
    if (action) filter.action = action
    if (entity) filter.entity = entity

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const total = await AuditLog.countDocuments(filter)
    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    res.json({
      status: 'success',
      data: {
        logs,
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
