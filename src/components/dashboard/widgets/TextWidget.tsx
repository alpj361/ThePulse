import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GripVertical, X, Edit3, Check, Type, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import type { DashboardWidget } from '../../../services/dashboards';
import { useDashboardTheme } from '../../../context/DashboardThemeContext';
import { updateWidgetConfig } from '../../../services/dashboards';

interface TextWidgetProps {
  widget: DashboardWidget;
  onRemove: () => void;
}

type TextAlign = 'left' | 'center' | 'right';

export function TextWidget({ widget, onRemove }: TextWidgetProps) {
  const { theme } = useDashboardTheme();
  const { text, fontSize = 16, fontWeight = 'normal', textAlign = 'center' } = widget.content;
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(text);
  const [currentAlign, setCurrentAlign] = useState<TextAlign>(textAlign);
  const [isHovered, setIsHovered] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    setIsEditing(false);
    if (editedText !== text) {
      try {
        await updateWidgetConfig(widget.id, {
          ...widget.config,
          content: { ...widget.content, text: editedText, textAlign: currentAlign }
        });
      } catch (error) {
        console.error('Error updating text:', error);
      }
    }
  };

  const alignIcons = {
    left: AlignLeft,
    center: AlignCenter,
    right: AlignRight
  };

  const AlignIcon = alignIcons[currentAlign];

  return (
    <motion.div 
      className="h-full flex flex-col rounded-2xl overflow-hidden relative group"
      style={{
        background: `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.surfaceLight} 100%)`,
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
      {/* Header */}
      <div 
        className="drag-handle flex items-center justify-between px-3 py-2 cursor-move"
        style={{
          background: `linear-gradient(90deg, ${theme.colors.primary}10 0%, ${theme.colors.primary}05 100%)`,
          borderBottom: `1px solid ${theme.colors.border}40`
        }}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4" style={{ color: theme.colors.textSecondary }} />
          <Type className="h-3.5 w-3.5" style={{ color: theme.colors.primary }} />
          <span className="text-xs font-medium" style={{ color: theme.colors.textSecondary }}>
            Texto
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isEditing ? (
            <button
              onClick={handleSave}
              className="p-1.5 rounded-lg hover:bg-green-50 transition-all"
              style={{ color: theme.colors.success }}
              title="Guardar"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 rounded-lg hover:bg-white/50 transition-all opacity-0 group-hover:opacity-100"
              style={{ color: theme.colors.primary }}
              title="Editar"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => {
              const aligns: TextAlign[] = ['left', 'center', 'right'];
              const currentIndex = aligns.indexOf(currentAlign);
              const nextAlign = aligns[(currentIndex + 1) % aligns.length];
              setCurrentAlign(nextAlign);
            }}
            className="p-1.5 rounded-lg hover:bg-white/50 transition-all opacity-0 group-hover:opacity-100"
            style={{ color: theme.colors.primary }}
            title="Alineación"
          >
            <AlignIcon className="h-3.5 w-3.5" />
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

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full h-full resize-none bg-transparent border-2 rounded-lg p-3 focus:outline-none transition-all"
            style={{
              fontSize: `${fontSize}px`,
              fontWeight: fontWeight as any,
              textAlign: currentAlign,
              color: theme.colors.text,
              borderColor: theme.colors.primary
            }}
            onBlur={handleSave}
          />
        ) : (
          <motion.p
            whileHover={{ scale: 1.02 }}
            style={{
              fontSize: `${fontSize}px`,
              color: theme.colors.text,
              fontWeight: fontWeight as any,
              textAlign: currentAlign,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: 1.6
            }}
            className="w-full"
          >
            {editedText || text}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
