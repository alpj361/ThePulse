import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check } from 'lucide-react';
import { dashboardThemes } from '../../styles/dashboard-themes';
import { useDashboardTheme } from '../../context/DashboardThemeContext';

export function ThemeSelector() {
  const { theme, setTheme } = useDashboardTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Theme Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 hover:border-gray-300 transition-all shadow-sm hover:shadow"
        title="Cambiar tema"
      >
        <Palette className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">{theme.emoji} {theme.name}</span>
      </button>

      {/* Theme Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-30"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 p-3 z-40"
            >
              <div className="flex items-center gap-2 px-3 py-2 mb-2 border-b border-gray-100">
                <Palette className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">Selecciona un Tema</span>
              </div>
              
              <div className="space-y-1.5 max-h-96 overflow-y-auto">
                {dashboardThemes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      theme.id === t.id
                        ? 'bg-gray-100 border-2 border-gray-300'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    {/* Color Preview */}
                    <div 
                      className="w-10 h-10 rounded-lg flex-shrink-0 shadow-sm"
                      style={{ background: t.colors.gradient }}
                    />
                    
                    {/* Theme Info */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{t.emoji}</span>
                        <span className="text-sm font-medium text-gray-900">{t.name}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: t.colors.primary }}
                        />
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: t.colors.secondary }}
                        />
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: t.colors.accent }}
                        />
                      </div>
                    </div>
                    
                    {/* Check Mark */}
                    {theme.id === t.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex-shrink-0"
                      >
                        <Check className="h-5 w-5 text-green-600" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
