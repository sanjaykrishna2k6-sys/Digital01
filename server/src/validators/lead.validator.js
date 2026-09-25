const VALID_STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'converted', 'lost']

export function validateLead(req, res, next) {
  const { name, email, status, leadScore } = req.body || {}

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({
      status: 'fail',
      message: 'Lead name is required and must be at least 2 characters long.',
    })
  }

  if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    return res.status(400).json({
      status: 'fail',
      message: 'Please provide a valid lead email address.',
    })
  }

  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      status: 'fail',
      message: `Status must be one of: ${VALID_STATUSES.join(', ')}.`,
    })
  }

  if (leadScore !== undefined && (isNaN(Number(leadScore)) || Number(leadScore) < 0 || Number(leadScore) > 100)) {
    return res.status(400).json({
      status: 'fail',
      message: 'Lead score must be a number between 0 and 100.',
    })
  }

  next()
}
