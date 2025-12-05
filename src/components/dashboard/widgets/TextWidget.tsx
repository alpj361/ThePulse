import React from 'react';
import { GripVertical, X } from 'lucide-react';
import type { DashboardWidget } from '../../../services/dashboards';

interface TextWidgetProps {
  widget: DashboardWidget;
  onRemove: () => void;
}

export function TextWidget({ widget, onRemove }: TextWidgetProps) {
  const { text, fontSize = 16, color = '#000000', fontWeight = 'normal' } = widget.content;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
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

      {/* Text Content */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
        <p
          style={{
            fontSize: `${fontSize}px`,
            color: color,
            fontWeight: fontWeight as any,
            textAlign: 'center',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}


