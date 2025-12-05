import React from 'react';
import { GripVertical, X } from 'lucide-react';
import { C1Component } from '@thesysai/genui-sdk';
import type { DashboardWidget } from '../../../services/dashboards';

interface ChartWidgetProps {
  widget: DashboardWidget;
  onRemove: () => void;
}

export function ChartWidget({ widget, onRemove }: ChartWidgetProps) {
  const { c1Response, originalQuery } = widget.content;

  return (
    <div className="h-full flex flex-col">
      {/* Header with drag handle */}
      <div className="drag-handle flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200 cursor-move">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-xs font-medium text-gray-700 truncate">
            {originalQuery || 'Visualización'}
          </span>
        </div>
        <button
          onClick={onRemove}
          className="flex-shrink-0 p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-red-600 transition-colors"
          title="Eliminar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Chart Content */}
      <div className="flex-1 overflow-auto p-2">
        {c1Response ? (
          <C1Component c1Response={c1Response} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No hay datos de visualización
          </div>
        )}
      </div>
    </div>
  );
}


