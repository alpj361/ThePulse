import React from 'react';
import { GripVertical, X } from 'lucide-react';
import type { DashboardWidget } from '../../../services/dashboards';

interface EmojiWidgetProps {
  widget: DashboardWidget;
  onRemove: () => void;
}

export function EmojiWidget({ widget, onRemove }: EmojiWidgetProps) {
  const { emoji, size } = widget.content;

  const sizeClasses = {
    small: 'text-4xl',
    medium: 'text-6xl',
    large: 'text-8xl'
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-yellow-50 to-orange-50">
      {/* Header with drag handle */}
      <div className="drag-handle flex items-center justify-between px-2 py-1 bg-white/80 backdrop-blur cursor-move">
        <GripVertical className="h-4 w-4 text-gray-400" />
        <button
          onClick={onRemove}
          className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-red-600 transition-colors"
          title="Eliminar"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Emoji Content */}
      <div className="flex-1 flex items-center justify-center">
        <span className={sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.medium}>
          {emoji}
        </span>
      </div>
    </div>
  );
}


