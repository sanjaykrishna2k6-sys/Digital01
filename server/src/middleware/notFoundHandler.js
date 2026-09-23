/**
 * 404 Not Found middleware for undefined routes.
 */
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  })
}
