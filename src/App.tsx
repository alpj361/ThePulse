import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TwentyFirstToolbar } from '@21st-extension/toolbar-react';
import { ReactPlugin } from '@21st-extension/react';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import { Trends } from './pages/Trends';
import RecentActivity from './pages/RecentActivity';
import Sources from './pages/Sources';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import Register from './pages/Register';

import AdminPanel from './pages/AdminPanel';
import AuthCallback from './pages/AuthCallback';
import AuthVerification from './pages/AuthVerification';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Refunds from './pages/Refunds';
import Pricing from './pages/Pricing';
import TestHashtagCard from './components/test/TestHashtagCard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useUserProfile } from './hooks/useUserProfile';
import { Box, CircularProgress } from '@mui/material';
import { SpreadsheetProvider } from './context/SpreadsheetContext';
import EnhancedCodex from './pages/EnhancedCodex';
import News from './pages/News';
import SondeosModern from './pages/SondeosModern';
const Sondeos = SondeosModern; // Alias para compatibilidad
import SondeosFullPage from './pages/SondeosFullPage';
import Projects from './pages/Projects';
import { DecisionTimelineDemo } from './pages/DecisionTimelineDemo';
import SidebarDemoPage from './pages/SidebarDemo';
import DesignSettingsDemo from './pages/DesignSettingsDemo';
import Knowledge from './pages/Knowledge';

// Componente para configurar LogRocket automáticamente
const LogRocketConfig = () => {
  const { profile, loading, error } = useUserProfile();
  
  // Este componente no renderiza nada, solo configura LogRocket
  // El hook useUserProfile se encarga de configurar LogRocket cuando obtiene los datos
  
  if (error) {
    console.warn('⚠️ Error obteniendo perfil de usuario para LogRocket:', error);
  }
  
  return null;
};

// Componente para proteger rutas
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh' 
      }}>
        <CircularProgress color="primary" size={48} />
      </Box>
    );
  }
  
  // Si hay usuario, redirigir a verificación para que valide si está registrado
  // Si no hay usuario, redirigir a login
  return user ? <Navigate to="/auth/verify" /> : <Navigate to="/login" />;
};

// Componente para rutas que requieren usuario verificado (acceso directo desde AuthVerification)
export const VerifiedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh' 
      }}>
        <CircularProgress color="primary" size={48} />
      </Box>
    );
  }
  
  // Si no hay usuario, redirigir a login
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // Si hay usuario, verificar que venga desde AuthVerification
  // Para esto, verificamos si estamos en una ruta protegida sin haber pasado por verificación
  const currentPath = window.location.pathname;
  const isProtectedPath = ['/dashboard', '/recent', '/sources', '/analytics', '/settings', '/admin', '/library', '/codex', '/news', '/sondeos'].includes(currentPath);
  
  if (isProtectedPath) {
    // Verificar si el usuario viene directamente sin verificación
    // Esto se puede hacer verificando si hay un flag en sessionStorage
    const isVerified = sessionStorage.getItem('user_verified') === 'true';
    
    if (!isVerified) {
      return <Navigate to="/auth/verify" />;
    }
  }
  
  return <>{children}</>;
};

export function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Home />;
}

function App() {
  return (
    <AuthProvider>
      <SpreadsheetProvider>
      <div style={{ 
        position: 'fixed', 
        left: '20px', 
        top: '50%', 
        transform: 'translateY(-50%)', 
        zIndex: 9999 
      }}>
        <TwentyFirstToolbar 
          config={{
            plugins: [ReactPlugin]
          }}
        />
      </div>
      <BrowserRouter>
        <Routes>
          {/* Ruta principal - Redirección inteligente */}
          <Route path="/" element={<RootRedirect />} />
          {/* Nueva ruta /home que también muestra Home */}
          <Route path="/home" element={<Home />} />
          
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/verify" element={<AuthVerification />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/refunds" element={<Refunds />} />
          <Route path="/pricing" element={<Pricing />} />
          
          {/* Ruta de prueba para el nuevo formato JSON */}
          <Route path="/test-hashtag" element={
            <Layout>
              <TestHashtagCard />
            </Layout>
          } />
          
          {/* Rutas protegidas */}
          <Route path="/dashboard" element={
            <VerifiedRoute>
              <Layout>
                <Trends />
              </Layout>
            </VerifiedRoute>
          } />
          <Route path="/recent" element={
            <VerifiedRoute>
              <Layout>
                <RecentActivity />
              </Layout>
            </VerifiedRoute>
          } />
          <Route path="/sources" element={
            <VerifiedRoute>
              <Layout>
                <Sources />
              </Layout>
            </VerifiedRoute>
          } />
          <Route path="/analytics" element={
            <VerifiedRoute>
              <Layout>
                <Analytics />
              </Layout>
            </VerifiedRoute>
          } />
          <Route path="/settings" element={
            <VerifiedRoute>
              <DesignSettingsDemo />
            </VerifiedRoute>
          } />
          <Route path="/admin" element={
            <VerifiedRoute>
              <Layout>
                <AdminPanel />
              </Layout>
            </VerifiedRoute>
          } />
          <Route path="/knowledge" element={
            <VerifiedRoute>
              <Layout>
                <Knowledge />
              </Layout>
            </VerifiedRoute>
          } />
          <Route path="/codex" element={
            <VerifiedRoute>
              <Layout>
                <EnhancedCodex />
              </Layout>
            </VerifiedRoute>
          } />
          <Route path="/news" element={
            <VerifiedRoute>
              <Layout>
                <News />
              </Layout>
            </VerifiedRoute>
          } />
          <Route path="/sondeos" element={
            <VerifiedRoute>
              <Layout>
                <SondeosFullPage />
              </Layout>
            </VerifiedRoute>
          } />
          <Route path="/sondeos/compact" element={
            <VerifiedRoute>
              <Layout>
                <Sondeos />
              </Layout>
            </VerifiedRoute>
          } />
          <Route path="/sondeos/modern" element={
            <VerifiedRoute>
              <Layout>
                <SondeosModern />
              </Layout>
            </VerifiedRoute>
          } />
          <Route path="/projects" element={
            <VerifiedRoute>
              <Layout>
                <Projects />
              </Layout>
            </VerifiedRoute>
          } />

          <Route path="/timeline-demo" element={
            <VerifiedRoute>
              <Layout>
                <DecisionTimelineDemo />
              </Layout>
            </VerifiedRoute>
          } />
          <Route path="/sidebar-demo" element={
            <VerifiedRoute>
              <SidebarDemoPage />
            </VerifiedRoute>
          } />
          <Route path="/design-settings-demo" element={
            <VerifiedRoute>
              <DesignSettingsDemo />
            </VerifiedRoute>
          } />
          

          {/* Redirección para rutas no encontradas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </SpreadsheetProvider>
    </AuthProvider>
  );
}

export default App;