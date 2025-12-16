import React, { createContext, useContext, useState, useEffect } from 'react';
import { getThemeById, getDefaultTheme, DashboardTheme } from '../styles/dashboard-themes';

interface DashboardThemeContextType {
  theme: DashboardTheme;
  setTheme: (themeId: string) => void;
  applyTheme: (themeId: string) => void;
}

const DashboardThemeContext = createContext<DashboardThemeContextType | undefined>(undefined);

export function DashboardThemeProvider({ 
  children,
  dashboardId 
}: { 
  children: React.ReactNode;
  dashboardId?: string;
}) {
  const [theme, setThemeState] = useState<DashboardTheme>(getDefaultTheme());

  // Load theme from localStorage based on dashboardId
  useEffect(() => {
    if (dashboardId) {
      const savedThemeId = localStorage.getItem(`dashboard-theme-${dashboardId}`);
      if (savedThemeId) {
        const savedTheme = getThemeById(savedThemeId);
        setThemeState(savedTheme);
      }
    }
  }, [dashboardId]);

  const setTheme = (themeId: string) => {
    const newTheme = getThemeById(themeId);
    setThemeState(newTheme);
    
    // Save to localStorage
    if (dashboardId) {
      localStorage.setItem(`dashboard-theme-${dashboardId}`, themeId);
    }
  };

  const applyTheme = (themeId: string) => {
    setTheme(themeId);
  };

  return (
    <DashboardThemeContext.Provider value={{ theme, setTheme, applyTheme }}>
      {children}
    </DashboardThemeContext.Provider>
  );
}

export function useDashboardTheme() {
  const context = useContext(DashboardThemeContext);
  if (context === undefined) {
    throw new Error('useDashboardTheme must be used within a DashboardThemeProvider');
  }
  return context;
}
