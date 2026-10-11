export function validateCreateService(req, res, next) {
  const { name, category, price } = req.body

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({
      status: 'fail',
      message: 'Service name is required',
    })
  }

  if (price === undefined || typeof price !== 'number' || price < 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Valid price (non-negative number) is required',
    })
  }

  next()
}

export function validateUpdateService(req, res, next) {
  const { price } = req.body
  if (price !== undefined && (typeof price !== 'number' || price < 0)) {
    return res.status(400).json({
      status: 'fail',
      message: 'Valid price (non-negative number) is required',
    })
  }
  next()
}
