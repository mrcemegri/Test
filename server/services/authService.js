const { User } = require('../models');
const JWTService = require('../utils/jwt');
const { ValidationError, UnauthorizedError, ConflictError } = require('../utils/errors');
const { v4: uuidv4 } = require('uuid');

class AuthService {
  static async register(userData) {
    const { email, password, first_name, last_name, company_name } = userData;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Create user
    const user = await User.create({
      email,
      password,
      first_name,
      last_name,
      role: 'admin' // First user is admin
    });

    // Generate tokens
    const tokens = JWTService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return {
      user,
      tokens
    };
  }

  static async login(credentials) {
    const { email, password } = credentials;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.is_active) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await User.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Remove password hash from user object
    delete user.password_hash;

    // Generate tokens
    const tokens = JWTService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      company_id: user.company_id
    });

    return {
      user,
      tokens
    };
  }

  static async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = JWTService.verifyRefreshToken(refreshToken);

      // Find user
      const user = await User.findById(decoded.userId);
      if (!user || !user.is_active) {
        throw new UnauthorizedError('Invalid or inactive user');
      }

      // Generate new tokens
      const tokens = JWTService.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
        company_id: user.company_id
      });

      return {
        user,
        tokens
      };
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  static async changePassword(userId, currentPassword, newPassword) {
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Get user with password hash
    const userWithHash = await User.findByEmail(user.email);
    if (!userWithHash) {
      throw new UnauthorizedError('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await User.verifyPassword(currentPassword, userWithHash.password_hash);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Update password
    await User.update(userId, { password: newPassword });

    return true;
  }

  static async requestPasswordReset(email) {
    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return { message: 'If an account with this email exists, a password reset link has been sent.' };
    }

    // Generate reset token
    const resetToken = JWTService.generateResetToken(user.email);

    // In a real application, you would send this token via email
    // For now, we'll just return it (in production, never return tokens in responses)
    return {
      message: 'If an account with this email exists, a password reset link has been sent.',
      // resetToken // Only in development mode
    };
  }

  static async resetPassword(token, newPassword) {
    try {
      // Verify reset token
      const decoded = JWTService.verifyResetToken(token);

      // Find user
      const user = await User.findByEmail(decoded.email);
      if (!user) {
        throw new ValidationError('Invalid or expired reset token');
      }

      // Update password
      await User.update(user.id, { password: newPassword });

      return true;
    } catch (error) {
      throw new ValidationError('Invalid or expired reset token');
    }
  }

  static async validateToken(token) {
    try {
      const decoded = JWTService.verifyAccessToken(token);

      // Find user to ensure they still exist and are active
      const user = await User.findById(decoded.userId);
      if (!user || !user.is_active) {
        throw new UnauthorizedError('Invalid or inactive user');
      }

      return user;
    } catch (error) {
      throw new UnauthorizedError('Invalid token');
    }
  }

  static async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return user;
  }

  static async updateProfile(userId, updates) {
    const user = await User.update(userId, updates);
    return user;
  }

  static async deactivateAccount(userId) {
    await User.update(userId, { is_active: false });
    return true;
  }

  static async activateAccount(userId) {
    await User.update(userId, { is_active: true });
    return true;
  }
}

module.exports = AuthService;