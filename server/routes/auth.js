const express = require('express');
const AuthService = require('../services/authService');
const { validateRequest, schemas } = require('../middleware/validation');
const { successResponse, errorResponse } = require('../utils/response');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register a new user
router.post('/register', validateRequest(schemas.user.register), async (req, res, next) => {
  try {
    const result = await AuthService.register(req.body);

    res.status(201).json(
      successResponse(result, 'User registered successfully')
    );
  } catch (error) {
    next(error);
  }
});

// Login user
router.post('/login', validateRequest(schemas.user.login), async (req, res, next) => {
  try {
    const result = await AuthService.login(req.body);

    res.json(
      successResponse(result, 'Login successful')
    );
  } catch (error) {
    next(error);
  }
});

// Refresh access token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json(
        errorResponse(new Error('Refresh token is required'))
      );
    }

    const result = await AuthService.refreshToken(refreshToken);

    res.json(
      successResponse(result, 'Token refreshed successfully')
    );
  } catch (error) {
    next(error);
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await AuthService.getCurrentUser(req.user.id);

    res.json(
      successResponse(user, 'User profile retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/me', authenticateToken, validateRequest(schemas.user.update), async (req, res, next) => {
  try {
    const user = await AuthService.updateProfile(req.user.id, req.body);

    res.json(
      successResponse(user, 'Profile updated successfully')
    );
  } catch (error) {
    next(error);
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json(
        errorResponse(new Error('Current password and new password are required'))
      );
    }

    if (newPassword.length < 8) {
      return res.status(400).json(
        errorResponse(new Error('New password must be at least 8 characters long'))
      );
    }

    await AuthService.changePassword(req.user.id, currentPassword, newPassword);

    res.json(
      successResponse(null, 'Password changed successfully')
    );
  } catch (error) {
    next(error);
  }
});

// Request password reset
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(
        errorResponse(new Error('Email is required'))
      );
    }

    const result = await AuthService.requestPasswordReset(email);

    res.json(
      successResponse(result, 'Password reset request processed')
    );
  } catch (error) {
    next(error);
  }
});

// Reset password with token
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json(
        errorResponse(new Error('Reset token and new password are required'))
      );
    }

    if (newPassword.length < 8) {
      return res.status(400).json(
        errorResponse(new Error('New password must be at least 8 characters long'))
      );
    }

    await AuthService.resetPassword(token, newPassword);

    res.json(
      successResponse(null, 'Password reset successfully')
    );
  } catch (error) {
    next(error);
  }
});

// Logout (client-side token invalidation)
router.post('/logout', authenticateToken, (req, res) => {
  // In a stateless JWT setup, logout is primarily a client-side operation
  // The client should delete the stored tokens
  // We can optionally implement a token blacklist in production

  res.json(
    successResponse(null, 'Logout successful')
  );
});

// Validate token (useful for client-side token checking)
router.get('/validate', authenticateToken, async (req, res, next) => {
  try {
    const user = await AuthService.validateToken(req.headers.authorization.split(' ')[1]);

    res.json(
      successResponse(user, 'Token is valid')
    );
  } catch (error) {
    next(error);
  }
});

module.exports = router;