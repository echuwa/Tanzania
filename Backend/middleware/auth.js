const jwt = require('jsonwebtoken');

/**
 * Middleware: Verify JWT Token
 * Checks Authorization header for a valid Bearer token
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expecting "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ message: 'Access denied: No authentication token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid authentication token' });
  }
};

/**
 * Middleware: Require Admin or Super Admin Role
 * Must be used AFTER verifyToken
 */
const isAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied: Administrator privileges required' });
  }
};

/**
 * Middleware: Require Super Admin Role Only
 */
const isSuperAdminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied: Super Administrator privileges required' });
  }
};

/**
 * Middleware: Require Sub-Admin (admin) Role Only
 */
const isAdminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied: Sub-Admin privileges required (Super Admin restricted)' });
  }
};

module.exports = {
  verifyToken,
  isAdmin,
  isSuperAdminOnly,
  isAdminOnly
};
