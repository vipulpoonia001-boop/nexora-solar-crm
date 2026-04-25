import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Projects from './pages/Projects';
import Payments from './pages/Payments';
import Admin from './pages/Admin';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'admin' ? children : <Navigate to="/" replace />;
};

const App = () => {
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '12px 16px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
          },
          success: {
            duration: 3000,
            style: {
              background: '#ecfdf5',
              border: '1px solid #86efac',
              color: '#166534',
            },
            iconTheme: {
              primary: '#22c55e',
              secondary: '#ecfdf5',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              color: '#991b1b',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fef2f2',
            },
          },
          loading: {
            style: {
              background: '#f0f9ff',
              border: '1px solid #bfdbfe',
              color: '#1e40af',
            },
            iconTheme: {
              primary: '#3b82f6',
              secondary: '#f0f9ff',
            },
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="leads" element={<Leads />} />
          <Route path="projects" element={<Projects />} />
          <Route path="payments" element={<Payments />} />
          <Route path="admin" element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          } />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
