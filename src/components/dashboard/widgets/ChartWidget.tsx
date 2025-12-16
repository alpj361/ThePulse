import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GripVertical, X, BarChart3 } from 'lucide-react';
import { C1Component } from '@thesysai/genui-sdk';
import type { DashboardWidget } from '../../../services/dashboards';
import { useDashboardTheme } from '../../../context/DashboardThemeContext';

interface ChartWidgetProps {
  widget: DashboardWidget;
  onRemove: () => void;
}

export function ChartWidget({ widget, onRemove }: ChartWidgetProps) {
  const { theme } = useDashboardTheme();
  const { c1Response, originalQuery } = widget.content;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div 
      className="h-full flex flex-col rounded-2xl overflow-hidden relative group"
      style={{
        background: theme.colors.surface,
        boxShadow: isHovered 
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: `1px solid ${theme.colors.border}30`
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Header with drag handle */}
      <div 
        className="drag-handle flex items-center justify-between px-4 py-3 cursor-move"
        style={{
          background: `linear-gradient(90deg, ${theme.colors.primary}15 0%, ${theme.colors.primary}05 100%)`,
          borderBottom: `1px solid ${theme.colors.border}40`
        }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <motion.div
            animate={{ rotate: isHovered ? 360 : 0 }}
            transition={{ duration: 0.6 }}
          >
            <BarChart3 className="h-4 w-4 flex-shrink-0" style={{ color: theme.colors.primary }} />
          </motion.div>
          <span 
            className="text-sm font-semibold truncate"
            style={{ color: theme.colors.text }}
            title={originalQuery || 'Visualización'}
          >
            {originalQuery || 'Visualización'}
          </span>
        </div>
        <button
          onClick={onRemove}
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
          style={{ color: theme.colors.error }}
          title="Eliminar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Chart Content */}
      <div className="flex-1 overflow-auto p-4">
        {c1Response ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="h-full"
          >
            <C1Component c1Response={c1Response} />
          </motion.div>
        ) : (
          <div 
            className="flex items-center justify-center h-full rounded-xl"
            style={{ 
              background: `${theme.colors.surfaceLight}80`,
              border: `2px dashed ${theme.colors.border}`
            }}
          >
            <div className="text-center p-6">
              <BarChart3 
                className="h-12 w-12 mx-auto mb-3 opacity-40" 
                style={{ color: theme.colors.textSecondary }}
              />
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                No hay datos de visualización
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
