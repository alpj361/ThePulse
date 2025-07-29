import React, { useState } from 'react';
import Header from './Header';
import { SessionNavBar } from '../ui/sidebar';
import { LanguageProvider } from '../../context/LanguageContext';
import { ViztaChatUI } from '../ui/vizta-chat';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useLogRocketEvents } from '../../hooks/useLogRocketEvents';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import SpreadsheetPanel from '../ui/SpreadsheetPanel';
import SpreadsheetFloatingButton from '../ui/SpreadsheetFloatingButton';
import { useSpreadsheet } from '../../context/SpreadsheetContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Usar el contexto del spreadsheet
  const { isOpen: isSpreadsheetOpen, openSpreadsheet, closeSpreadsheet } = useSpreadsheet();
  
  // Configurar LogRocket automáticamente cuando el usuario esté autenticado
  const { profile, error } = useUserProfile();
  const { trackPageView } = useLogRocketEvents();
  const location = useLocation();
  
  // Rastrear cambios de página automáticamente
  useEffect(() => {
    if (profile) {
      const pageName = location.pathname.replace('/', '') || 'dashboard';
      trackPageView(pageName, {
        fullPath: location.pathname,
        search: location.search,
        timestamp: new Date().toISOString()
      });
    }
  }, [location, profile, trackPageView]);
  
  if (error) {
    console.warn('⚠️ Error obteniendo perfil de usuario para LogRocket:', error);
  }

  return (
    <LanguageProvider>
      <div className="flex h-screen bg-background">
        {/* Nuevo sidebar autónomo */}
        <SessionNavBar />
        
        {/* Main content area */}
        <div className="flex flex-col flex-1 min-w-0 ml-12">
          {/* Header */}
          <Header />
          
          {/* Main content */}
          <main className="flex-1 overflow-auto bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-6">
              {children}
            </div>
          </main>
        </div>
        
        {/* Vizta Chat */}
        <ViztaChatUI />

        {/* Spreadsheet Floating Button */}
        <SpreadsheetFloatingButton 
          onClick={openSpreadsheet}
        />

        {/* Spreadsheet Panel */}
        <SpreadsheetPanel 
          isOpen={isSpreadsheetOpen}
          onClose={closeSpreadsheet}
        />
      </div>
    </LanguageProvider>
  );
};

export default Layout;