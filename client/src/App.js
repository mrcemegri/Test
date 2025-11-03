import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider, useQuery } from 'react-query';
import { useAuth } from './hooks/useAuth';

// Layout components
import Layout from './components/Layout/Layout';
import AuthLayout from './components/Auth/AuthLayout';

// Page components
import Dashboard from './pages/Dashboard';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';

// CRM pages
import Contacts from './pages/Contacts';
import ContactDetail from './pages/Contacts/ContactDetail';
import Companies from './pages/Companies';
import CompanyDetail from './pages/Companies/CompanyDetail';
import Deals from './pages/Deals';
import DealDetail from './pages/Deals/DealDetail';
import Pipelines from './pages/Pipelines';
import Activities from './pages/Activities';
import Settings from './pages/Settings';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public route component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Auth loader component
const AuthLoader = () => {
  const { getCurrentUser, updateUser } = useAuth();

  useQuery(
    'currentUser',
    getCurrentUser,
    {
      enabled: !!localStorage.getItem('accessToken'),
      retry: false,
      onSuccess: (data) => {
        updateUser(data.data);
      },
      onError: () => {
        // Token is invalid, will be handled by axios interceptor
      },
    }
  );

  return null;
};

function App() {
  return (
    <>
      <AuthLoader />
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <AuthLayout>
                <Login />
              </AuthLayout>
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <AuthLayout>
                <Register />
              </AuthLayout>
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <AuthLayout>
                <ForgotPassword />
              </AuthLayout>
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <AuthLayout>
                <ResetPassword />
              </AuthLayout>
            </PublicRoute>
          }
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Contacts */}
          <Route path="contacts" element={<Contacts />} />
          <Route path="contacts/:id" element={<ContactDetail />} />

          {/* Companies */}
          <Route path="companies" element={<Companies />} />
          <Route path="companies/:id" element={<CompanyDetail />} />

          {/* Deals */}
          <Route path="deals" element={<Deals />} />
          <Route path="deals/:id" element={<DealDetail />} />

          {/* Pipelines */}
          <Route path="pipelines" element={<Pipelines />} />

          {/* Activities */}
          <Route path="activities" element={<Activities />} />

          {/* Settings */}
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default App;