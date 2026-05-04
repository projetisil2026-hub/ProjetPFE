const errorHandler = (err, req, res, next) => {
  console.error('[Error]', err.message);

  // Prisma known request errors (check by code, not name, for reliability)
  if (err.code === 'P2002') {
    return res.status(409).json({ success: false, message: 'A record with this value already exists.' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found.' });
  }
  if (err.code === 'P2003') {
    return res.status(400).json({ success: false, message: 'Related record not found.' });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired.' });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({ success: false, message: err.message || 'Internal server error.' });
};

module.exports = errorHandler;
