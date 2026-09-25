export function validateCreateCampaign(req, res, next) {
  const { name, budget, startDate, endDate } = req.body || {}

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({
      status: 'fail',
      message: 'Campaign name is required and must be at least 2 characters long.',
    })
  }

  if (budget === undefined || Number(budget) < 0 || isNaN(Number(budget))) {
    return res.status(400).json({
      status: 'fail',
      message: 'Campaign budget must be a non-negative number.',
    })
  }

  if (startDate && endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (end < start) {
      return res.status(400).json({
        status: 'fail',
        message: 'Campaign end date cannot be before the start date.',
      })
    }
  }

  next()
}

export function validateUpdateCampaign(req, res, next) {
  const { name, budget, startDate, endDate } = req.body || {}

  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
    return res.status(400).json({
      status: 'fail',
      message: 'Campaign name must be at least 2 characters long.',
    })
  }

  if (budget !== undefined && (Number(budget) < 0 || isNaN(Number(budget)))) {
    return res.status(400).json({
      status: 'fail',
      message: 'Campaign budget must be a non-negative number.',
    })
  }

  if (startDate && endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (end < start) {
      return res.status(400).json({
        status: 'fail',
        message: 'Campaign end date cannot be before the start date.',
      })
    }
  }

  next()
}
