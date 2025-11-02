import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  registerStart,
  registerSuccess,
  registerFailure,
  refreshTokenStart,
  refreshTokenSuccess,
  refreshTokenFailure,
  updateUser,
  clearError,
} from '../store/slices/authSlice';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  // Login
  const login = useCallback(async (credentials) => {
    try {
      dispatch(loginStart());
      const response = await authService.login(credentials);
      dispatch(loginSuccess(response.data));
      toast.success('Login successful!');
      return response.data;
    } catch (error) {
      dispatch(loginFailure(error.response?.data?.error || 'Login failed'));
      throw error;
    }
  }, [dispatch]);

  // Register
  const register = useCallback(async (userData) => {
    try {
      dispatch(registerStart());
      const response = await authService.register(userData);
      dispatch(registerSuccess(response.data));
      toast.success('Registration successful!');
      return response.data;
    } catch (error) {
      dispatch(registerFailure(error.response?.data?.error || 'Registration failed'));
      throw error;
    }
  }, [dispatch]);

  // Logout
  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    } finally {
      dispatch(logout());
      toast.success('Logged out successfully');
    }
  }, [dispatch]);

  // Update profile
  const updateProfile = useCallback(async (userData) => {
    try {
      const response = await authService.updateProfile(userData);
      dispatch(updateUser(response.data));
      toast.success('Profile updated successfully!');
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
      throw error;
    }
  }, [dispatch]);

  // Change password
  const changePassword = useCallback(async (passwords) => {
    try {
      await authService.changePassword(passwords);
      toast.success('Password changed successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
      throw error;
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (token, newPassword) => {
    try {
      await authService.resetPassword(token, newPassword);
      toast.success('Password reset successful!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reset password');
      throw error;
    }
  }, []);

  // Request password reset
  const requestPasswordReset = useCallback(async (email) => {
    try {
      await authService.requestPasswordReset(email);
      toast.success('Password reset email sent!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send reset email');
      throw error;
    }
  }, []);

  // Clear error
  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Check if user has specific role
  const hasRole = useCallback(
    (role) => {
      if (!auth.user) return false;
      if (Array.isArray(role)) {
        return role.includes(auth.user.role);
      }
      return auth.user.role === role;
    },
    [auth.user]
  );

  // Check if user has permission (basic role-based check)
  const hasPermission = useCallback(
    (permission) => {
      if (!auth.user) return false;

      const rolePermissions = {
        admin: ['read', 'write', 'delete', 'manage_users', 'manage_system'],
        manager: ['read', 'write', 'manage_team'],
        sales_rep: ['read', 'write'],
        viewer: ['read'],
      };

      const userPermissions = rolePermissions[auth.user.role] || [];
      return userPermissions.includes(permission);
    },
    [auth.user]
  );

  return {
    ...auth,
    login,
    register,
    logout: handleLogout,
    updateProfile,
    changePassword,
    resetPassword,
    requestPasswordReset,
    clearError: clearAuthError,
    hasRole,
    hasPermission,
  };
};