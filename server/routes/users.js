const express = require('express');
const { User } = require('../models');
const { authorizeRoles } = require('../middleware/auth');
const { validateRequest, validateParams, schemas } = require('../middleware/validation');
const { successResponse, paginatedResponse } = require('../utils/response');

const router = express.Router();

// Get all users (admin/manager only)
router.get('/', authorizeRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const { limit, offset, role, is_active } = req.query;

    const users = await User.findAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      role,
      is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined
    });

    const total = await User.count({ role, is_active });

    res.json(
      paginatedResponse(users, total, limit, offset)
    );
  } catch (error) {
    next(error);
  }
});

// Get team members (manager only)
router.get('/team', authorizeRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const { limit, offset, role } = req.query;

    const users = await User.findTeamMembers(req.user.company_id, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      role
    });

    res.json(
      successResponse(users)
    );
  } catch (error) {
    next(error);
  }
});

// Get user by ID
router.get('/:id', validateParams(schemas.id), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    // Users can only view their own profile unless they're admin/manager
    if (req.user.role === 'admin' || req.user.role === 'manager' || req.user.id === req.params.id) {
      res.json(
        successResponse(user)
      );
    } else {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
  } catch (error) {
    next(error);
  }
});

// Create new user (admin only)
router.post('/', authorizeRoles('admin'), validateRequest(schemas.user.register), async (req, res, next) => {
  try {
    const user = await User.create({
      ...req.body,
      role: req.body.role || 'sales_rep',
      company_id: req.user.company_id
    });

    res.status(201).json(
      successResponse(user, 'User created successfully')
    );
  } catch (error) {
    next(error);
  }
});

// Update user
router.put('/:id', validateParams(schemas.id), validateRequest(schemas.user.update), async (req, res, next) => {
  try {
    // Users can update their own profile, admins can update anyone
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Non-admins cannot change their role
    if (req.user.role !== 'admin' && req.body.role) {
      delete req.body.role;
    }

    const user = await User.update(req.params.id, req.body);

    res.json(
      successResponse(user, 'User updated successfully')
    );
  } catch (error) {
    next(error);
  }
});

// Delete user (admin only)
router.delete('/:id', authorizeRoles('admin'), validateParams(schemas.id), async (req, res, next) => {
  try {
    await User.delete(req.params.id);

    res.json(
      successResponse(null, 'User deleted successfully')
    );
  } catch (error) {
    next(error);
  }
});

module.exports = router;