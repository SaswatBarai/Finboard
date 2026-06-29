export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  console.error(error);
  const status = error.statusCode || 500;
  const message = status === 500 ? "Something went wrong" : error.message;
  return res.status(status).json({ message });
}
