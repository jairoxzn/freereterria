import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';

// Páginas del Sistema
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Suppliers from './pages/Suppliers';
import POS from './pages/POS';
import Purchases from './pages/Purchases';
import Kardex from './pages/Kardex';
import Reports from './pages/Reports';

// Redireccionador de Rutas Protegidas (Requiere login)
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null; // Esperar a que valide token

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// Redireccionador de Rutas Administrativas (Solo ADMIN)
function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return isAdmin ? children : <Navigate to="/" replace />;
}

// Redireccionador de Rutas Públicas (Si ya está logueado, lo manda al Dashboard)
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  return !isAuthenticated ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <Routes>
              
              {/* Rutas Públicas */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />

              {/* Rutas Privadas / Protegidas */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                {/* Dashboard principal */}
                <Route index element={<Dashboard />} />
                
                {/* Módulo POS Caja */}
                <Route path="pos" element={<POS />} />
                
                {/* Módulos de Catálogo y Logística */}
                <Route path="products" element={<Products />} />
                <Route path="categories" element={<Categories />} />
                <Route path="suppliers" element={<Suppliers />} />
                <Route path="purchases" element={<Purchases />} />
                <Route path="kardex" element={<Kardex />} />
                
                {/* Módulos Administrativos de Seguridad */}
                <Route
                  path="reports"
                  element={
                    <AdminRoute>
                      <Reports />
                    </AdminRoute>
                  }
                />
                
                <Route
                  path="register"
                  element={
                    <AdminRoute>
                      <Register />
                    </AdminRoute>
                  }
                />
              </Route>

              {/* Redirección por defecto */}
              <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
