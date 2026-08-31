import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { FarmerLayout } from './layouts/FarmerLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public Pages
const HomePage = lazy(() => import('./pages/public/HomePage').then((m) => ({ default: m.HomePage })));
const NotFoundPage = lazy(() => import('./pages/public/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

// Auth Pages
const AdminLoginPage = lazy(() => import('./pages/auth/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage })));
const FarmerLoginPage = lazy(() => import('./pages/auth/FarmerLoginPage').then((m) => ({ default: m.FarmerLoginPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));

// Farmer Pages
const FarmerLedgerPage = lazy(() => import('./pages/farmer/FarmerLedgerPage').then((m) => ({ default: m.FarmerLedgerPage })));
const FarmerChatPage = lazy(() => import('./pages/farmer/FarmerChatPage').then((m) => ({ default: m.FarmerChatPage })));
const FarmerProfilePage = lazy(() => import('./pages/farmer/FarmerProfilePage').then((m) => ({ default: m.FarmerProfilePage })));

// Admin Pages
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const AdminKhatabookPage = lazy(() => import('./pages/admin/AdminKhatabookPage').then((m) => ({ default: m.AdminKhatabookPage })));
const AdminFarmersPage = lazy(() => import('./pages/admin/AdminFarmersPage').then((m) => ({ default: m.AdminFarmersPage })));
const AdminFarmerDetailPage = lazy(() => import('./pages/admin/AdminFarmerDetailPage').then((m) => ({ default: m.AdminFarmerDetailPage })));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage').then((m) => ({ default: m.AdminProductsPage })));
const AdminChatPage = lazy(() => import('./pages/admin/AdminChatPage').then((m) => ({ default: m.AdminChatPage })));
const AdminWebsiteSettingsPage = lazy(() => import('./pages/admin/AdminWebsiteSettingsPage').then((m) => ({ default: m.AdminWebsiteSettingsPage })));
const AdminAISettingsPage = lazy(() => import('./pages/admin/AdminAISettingsPage').then((m) => ({ default: m.AdminAISettingsPage })));
const AdminAuditPage = lazy(() => import('./pages/admin/AdminAuditPage').then((m) => ({ default: m.AdminAuditPage })));

import { ChickLoader } from './components/ChickLoader';

// Protected Route for Farmers
const FarmerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <ChickLoader text="Authenticating..." />;
  if (!isAuthenticated || user?.role !== 'FARMER') {
    return <Navigate to="/farmer/login" replace />;
  }
  return <>{children}</>;
};

// Protected Route for Admins
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <ChickLoader text="Authenticating..." />;
  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};

// Root Redirection Component (Direct Admin / Farmer Portal on app open, Homepage if guest)
const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <ChickLoader text="Opening..." />;
  if (isAuthenticated && user) {
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    }
    if (user.role === 'FARMER') {
      return <Navigate to="/farmer" replace />;
    }
  }
  return <HomePage />;
};

export const App: React.FC = () => {
  return (
    <Suspense fallback={<ChickLoader text="Loading..." />}>
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<RootRedirect />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Auth Routes */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/farmer/login" element={<FarmerLoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Farmer Portal Protected Routes */}
      <Route
        path="/farmer"
        element={
          <FarmerRoute>
            <FarmerLayout />
          </FarmerRoute>
        }
      >
        <Route index element={<FarmerLedgerPage />} />
        <Route path="ledger" element={<FarmerLedgerPage />} />
        <Route path="khatabook" element={<FarmerLedgerPage />} />
        <Route path="messages" element={<FarmerChatPage />} />
        <Route path="profile" element={<FarmerProfilePage />} />
        <Route path="*" element={<Navigate to="/farmer" replace />} />
      </Route>

      {/* Admin Portal Protected Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="khatabook" element={<AdminKhatabookPage />} />
        <Route path="farmers" element={<AdminFarmersPage />} />
        <Route path="farmers/:id" element={<AdminFarmerDetailPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="messages" element={<AdminChatPage />} />
        <Route path="settings/website" element={<AdminWebsiteSettingsPage />} />
        <Route path="settings/ai" element={<AdminAISettingsPage />} />
        <Route path="audit" element={<AdminAuditPage />} />
        <Route path="categories" element={<Navigate to="/admin/products" replace />} />
        <Route path="orders" element={<Navigate to="/admin/khatabook" replace />} />
        <Route path="rates" element={<Navigate to="/admin/products" replace />} />
        <Route path="settlements" element={<Navigate to="/admin/khatabook" replace />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  );
};

export default App;
