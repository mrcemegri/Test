const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from database to ensure they still exist and are active
    const user = await User.findById(decoded.userId);
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or inactive user'
      });
    }

    // Attach user info to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      company_id: user.company_id
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }
    next();
  };
};

const authorizeOwnershipOrRole = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    const userId = req.user.id;

    // If user has admin/manager role, allow access
    if (roles.includes(userRole)) {
      return next();
    }

    // Check if user is accessing their own resources
    const requestedUserId = req.params.id || req.params.userId;
    if (requestedUserId === userId) {
      return next();
    }

    // For other resources, check assigned_to field
    if (req.body.assigned_to && req.body.assigned_to === userId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'Access denied - insufficient permissions'
    });
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  authorizeOwnershipOrRole
};