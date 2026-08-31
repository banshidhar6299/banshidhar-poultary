import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { FarmerLayout } from './layouts/FarmerLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { NotFoundPage } from './pages/public/NotFoundPage';

// Auth Pages
import { AdminLoginPage } from './pages/auth/AdminLoginPage';
import { FarmerLoginPage } from './pages/auth/FarmerLoginPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Farmer Pages
import { FarmerHomePage } from './pages/farmer/FarmerHomePage';
import { FarmerProductsPage } from './pages/farmer/FarmerProductsPage';
import { FarmerOrdersPage } from './pages/farmer/FarmerOrdersPage';
import { FarmerLedgerPage } from './pages/farmer/FarmerLedgerPage';
import { FarmerBatchesPage } from './pages/farmer/FarmerBatchesPage';
import { FarmerChatPage } from './pages/farmer/FarmerChatPage';
import { FarmerProfilePage } from './pages/farmer/FarmerProfilePage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminKhatabookPage } from './pages/admin/AdminKhatabookPage';
import { AdminFarmersPage } from './pages/admin/AdminFarmersPage';
import { AdminFarmerDetailPage } from './pages/admin/AdminFarmerDetailPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminRatesPage } from './pages/admin/AdminRatesPage';
import { AdminJoinRequestsPage } from './pages/admin/AdminJoinRequestsPage';
import { AdminSettlementsPage } from './pages/admin/AdminSettlementsPage';
import { AdminChatPage } from './pages/admin/AdminChatPage';
import { AdminWebsiteSettingsPage } from './pages/admin/AdminWebsiteSettingsPage';
import { AdminAISettingsPage } from './pages/admin/AdminAISettingsPage';
import { AdminAuditPage } from './pages/admin/AdminAuditPage';

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
  );
};

export default App;
