import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, X, Edit2 } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import type { DashboardWidget } from '../../../services/dashboards';
import { useDashboardTheme } from '../../../context/DashboardThemeContext';
import { updateWidgetConfig } from '../../../services/dashboards';

interface EmojiWidgetProps {
  widget: DashboardWidget;
  onRemove: () => void;
}

export function EmojiWidget({ widget, onRemove }: EmojiWidgetProps) {
  const { theme } = useDashboardTheme();
  const { emoji, size = 'medium' } = widget.content;
  const [isHovered, setIsHovered] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [currentEmoji, setCurrentEmoji] = useState(emoji);

  const sizeClasses = {
    small: 'text-5xl',
    medium: 'text-7xl',
    large: 'text-9xl'
  };

  const handleEmojiClick = async (emojiData: EmojiClickData) => {
    setCurrentEmoji(emojiData.emoji);
    setShowPicker(false);
    
    // Update in database
    try {
      await updateWidgetConfig(widget.id, {
        ...widget.config,
        content: { ...widget.content, emoji: emojiData.emoji }
      });
    } catch (error) {
      console.error('Error updating emoji:', error);
    }
  };

  return (
    <motion.div 
      className="h-full flex flex-col rounded-2xl overflow-hidden relative group"
      style={{
        background: `linear-gradient(135deg, ${theme.colors.surfaceLight} 0%, ${theme.colors.surface} 100%)`,
        boxShadow: isHovered 
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Header with drag handle */}
      <div 
        className="drag-handle emoji-widget flex items-center justify-between px-3 py-2 cursor-move"
        style={{
          background: `linear-gradient(90deg, ${theme.colors.primary}15 0%, ${theme.colors.primary}05 100%)`,
          borderBottom: `1px solid ${theme.colors.border}40`
        }}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4" style={{ color: theme.colors.textSecondary }} />
          <span className="text-xs font-medium" style={{ color: theme.colors.textSecondary }}>
            Emoji
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="p-1.5 rounded-lg hover:bg-white/50 transition-all opacity-0 group-hover:opacity-100"
            title="Cambiar emoji"
            style={{ color: theme.colors.primary }}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
            style={{ color: theme.colors.error }}
            title="Eliminar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Emoji Content - Apple Style */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Decorative background circles */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            background: `radial-gradient(circle at 30% 50%, ${theme.colors.primary} 0%, transparent 50%),
                         radial-gradient(circle at 70% 50%, ${theme.colors.accent} 0%, transparent 50%)`
          }}
        />
        
        <motion.div
          animate={{
            scale: isHovered ? 1.15 : 1,
            rotate: isHovered ? [0, -5, 5, -5, 0] : 0
          }}
          transition={{ 
            scale: { type: 'spring', stiffness: 300, damping: 15 },
            rotate: { duration: 0.5 }
          }}
          className="relative"
          style={{
            filter: isHovered ? 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
            cursor: 'pointer'
          }}
        >
          <span 
            className={`${sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.medium} select-none`}
            style={{
              textShadow: isHovered ? '0 8px 16px rgba(0,0,0,0.2)' : '0 4px 8px rgba(0,0,0,0.1)'
            }}
          >
            {currentEmoji}
          </span>
        </motion.div>
      </div>

      {/* Emoji Picker Modal */}
      <AnimatePresence>
        {showPicker && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-50"
              onClick={() => setShowPicker(false)}
            />
            
            {/* Picker */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 rounded-2xl overflow-hidden shadow-2xl"
            >
              <EmojiPicker onEmojiClick={handleEmojiClick} width={350} height={400} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
