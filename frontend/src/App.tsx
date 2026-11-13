import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { ReturnFormPage } from './pages/ReturnFormPage';
import { MyReturnsPage } from './pages/MyReturnsPage';
import { ReturnDetailPage } from './pages/ReturnDetailPage';

import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminQueuePage } from './pages/admin/AdminQueuePage';
import { AdminDetailPage } from './pages/admin/AdminDetailPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Protected Route for Authenticated Users
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Protected Route for Admins Only
const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/orders" replace />;
  }
  return children;
};

// Root redirector based on authentication and role
const RootRedirect: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={isAdmin ? '/admin/dashboard' : '/orders'} replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Root */}
              <Route path="/" element={<RootRedirect />} />

              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Customer Routes */}
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <OrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <ProtectedRoute>
                    <OrderDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/returns"
                element={
                  <ProtectedRoute>
                    <MyReturnsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/returns/new"
                element={
                  <ProtectedRoute>
                    <ReturnFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/returns/:id"
                element={
                  <ProtectedRoute>
                    <ReturnDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={<Navigate to="/admin/dashboard" replace />}
              />
              <Route
                path="/admin/dashboard"
                element={
                  <AdminRoute>
                    <AdminDashboardPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/returns"
                element={
                  <AdminRoute>
                    <AdminQueuePage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/returns/:id"
                element={
                  <AdminRoute>
                    <AdminDetailPage />
                  </AdminRoute>
                }
              />

              {/* 404 Catch-All */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

