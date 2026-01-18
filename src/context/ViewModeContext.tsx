import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { ViewMode, ViewModeContextType } from '../types/viewMode';
import { useAuth } from './AuthContext';

// Create the context
const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

// Context provider
export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>('normal');
  const { user } = useAuth();

  // Load view mode from localStorage on mount
  useEffect(() => {
    if (user) {
      const savedMode = localStorage.getItem(`view_mode_${user.id}`);
      if (savedMode === 'beta' || savedMode === 'normal') {
        setViewMode(savedMode);
      }
    }
  }, [user]);

  // Save view mode to localStorage on change
  useEffect(() => {
    if (user) {
      localStorage.setItem(`view_mode_${user.id}`, viewMode);
    }
  }, [viewMode, user]);

  // Listen to storage changes from other tabs (sync across tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (user && e.key === `view_mode_${user.id}`) {
        const newMode = e.newValue as ViewMode;
        if (newMode === 'beta' || newMode === 'normal') {
          setViewMode(newMode);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  // Toggle between normal and beta view
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'normal' ? 'beta' : 'normal');
  };

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    viewMode,
    toggleViewMode,
    setViewMode,
    isBetaView: viewMode === 'beta',
    isNormalView: viewMode === 'normal'
  }), [viewMode]);

  return <ViewModeContext.Provider value={value}>{children}</ViewModeContext.Provider>;
}

// Custom hook to use the context
export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}
