const VALID_STATUSES = ['new', 'active', 'inactive', 'converted']

export function validateCustomer(req, res, next) {
  const { name, email, status } = req.body || {}

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({
      status: 'fail',
      message: 'Customer name is required and must be at least 2 characters long.',
    })
  }

  if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    return res.status(400).json({
      status: 'fail',
      message: 'Please provide a valid customer email address.',
    })
  }

  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      status: 'fail',
      message: `Status must be one of: ${VALID_STATUSES.join(', ')}.`,
    })
  }

  next()
}
