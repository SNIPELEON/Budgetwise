function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);

  if (err.type === 'validation') {
    return res.status(400).json({ error: err.message, details: err.details });
  }

  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ error: 'Resource already exists' });
  }

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message || 'Internal server error';

  res.status(statusCode).json({ error: message });
}

module.exports = { errorHandler };
