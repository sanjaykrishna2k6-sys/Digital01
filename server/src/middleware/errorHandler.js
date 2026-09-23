/**
 * Centralized error handling middleware.
 */
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500
  const isDev = process.env.NODE_ENV === 'development'

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message)

  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(isDev && { stack: err.stack }),
  })
}
