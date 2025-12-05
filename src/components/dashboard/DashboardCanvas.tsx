import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GridLayout, { Layout } from 'react-grid-layout';
import { Sidebar, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useDashboardStore } from '../../stores/dashboardStore';
import {
  getDashboardWidgets,
  addWidgetToDashboard,
  deleteWidget,
  bulkUpdateWidgetPositions,
  type Dashboard,
  type DashboardWidget
} from '../../services/dashboards';
import { DashboardWidgetToolbar } from './DashboardWidgetToolbar';
import { ChartWidget } from './widgets/ChartWidget';
import { EmojiWidget } from './widgets/EmojiWidget';
import { TextWidget } from './widgets/TextWidget';

// Import CSS for react-grid-layout
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface DashboardCanvasProps {
  dashboard: Dashboard;
}

export function DashboardCanvas({ dashboard }: DashboardCanvasProps) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [saving, setSaving] = useState(false);

  const savedWidgets = useDashboardStore(state => state.savedWidgets);

  // Load widgets when dashboard changes
  useEffect(() => {
    loadWidgets();
  }, [dashboard.id]);

  const loadWidgets = async () => {
    try {
      setLoading(true);
      const data = await getDashboardWidgets(dashboard.id);
      setWidgets(data);

      // Convert to GridLayout format
      const gridLayouts: Layout[] = data.map((widget) => ({
        i: widget.id,
        x: widget.position.x,
        y: widget.position.y,
        w: widget.position.w,
        h: widget.position.h,
        minW: widget.widget_type === 'emoji' ? 1 : 2,
        minH: widget.widget_type === 'emoji' ? 1 : 2,
      }));

      setLayouts(gridLayouts);
    } catch (error) {
      console.error('[DashboardCanvas] Error loading widgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWidget = async (widgetType: 'chart' | 'emoji' | 'text', content: any) => {
    try {
      // Find next available position
      const maxY = Math.max(...layouts.map(l => l.y + l.h), 0);
      const newPosition = {
        x: 0,
        y: maxY,
        w: widgetType === 'emoji' ? 2 : 4,
        h: widgetType === 'emoji' ? 2 : 3
      };

      const newWidget = await addWidgetToDashboard(
        dashboard.id,
        widgetType,
        content,
        newPosition
      );

      setWidgets([...widgets, newWidget]);
      setLayouts([
        ...layouts,
        {
          i: newWidget.id,
          x: newPosition.x,
          y: newPosition.y,
          w: newPosition.w,
          h: newPosition.h,
          minW: widgetType === 'emoji' ? 1 : 2,
          minH: widgetType === 'emoji' ? 1 : 2,
        }
      ]);

      console.log('[DashboardCanvas] Widget added:', newWidget.id);
    } catch (error) {
      console.error('[DashboardCanvas] Error adding widget:', error);
      alert('Error agregando widget a la pizarra');
    }
  };

  const handleRemoveWidget = async (widgetId: string) => {
    try {
      await deleteWidget(widgetId);
      setWidgets(widgets.filter(w => w.id !== widgetId));
      setLayouts(layouts.filter(l => l.i !== widgetId));

      console.log('[DashboardCanvas] Widget removed:', widgetId);
    } catch (error) {
      console.error('[DashboardCanvas] Error removing widget:', error);
    }
  };

  const handleLayoutChange = async (newLayouts: Layout[]) => {
    setLayouts(newLayouts);

    // Debounce save to avoid too many requests
    if (saving) return;

    setSaving(true);
    setTimeout(async () => {
      try {
        const updates = newLayouts.map(layout => ({
          id: layout.i,
          position: {
            x: layout.x,
            y: layout.y,
            w: layout.w,
            h: layout.h
          }
        }));

        await bulkUpdateWidgetPositions(updates);
        console.log('[DashboardCanvas] Layouts saved');
      } catch (error) {
        console.error('[DashboardCanvas] Error saving layouts:', error);
      } finally {
        setSaving(false);
      }
    }, 1000); // 1 second debounce
  };

  const handleDrop = async (layout: Layout[], layoutItem: Layout, _event: Event) => {
    // Cast event to DragEvent to access dataTransfer
    const e = _event as unknown as React.DragEvent;

    if (!e.dataTransfer) return;

    const widgetType = e.dataTransfer.getData("widgetType");
    const widgetDataStr = e.dataTransfer.getData("widgetData");

    if (!widgetType || !widgetDataStr) return;

    try {
      const widgetData = JSON.parse(widgetDataStr);

      // Determine size based on type
      let w = 4;
      let h = 3;
      if (widgetType === 'emoji') {
        w = 2;
        h = 2;
      }

      const newPosition = {
        x: layoutItem.x,
        y: layoutItem.y,
        w: w,
        h: h
      };

      // Construct content based on type
      let content = {};
      if (widgetType === 'chart') {
        content = {
          c1Response: widgetData.c1Response,
          originalQuery: widgetData.originalQuery,
          timestamp: widgetData.timestamp
        };
      } else if (widgetType === 'emoji') {
        content = { emoji: widgetData.emoji, size: widgetData.size };
      } else if (widgetType === 'text') {
        content = {
          text: widgetData.text,
          fontSize: 16,
          color: '#000000',
          fontWeight: 'normal'
        };
      }

      console.log('[DashboardCanvas] Dropping widget:', widgetType, newPosition);

      const newWidget = await addWidgetToDashboard(
        dashboard.id,
        widgetType as 'chart' | 'emoji' | 'text',
        content,
        newPosition
      );

      // Update state with new widget
      setWidgets(prev => [...prev, newWidget]);
      setLayouts(prev => [
        ...layout, // Use the layout passed by onDrop which includes the placeholder? No, RGL's onDrop layout might not include the final item yet or might use the dropping i.
        // Actually best to rebuild layout from existing + new
        ...prev.filter(l => l.i !== newWidget.id), // Safety filter
        {
          i: newWidget.id,
          x: newWidget.position.x,
          y: newWidget.position.y,
          w: newWidget.position.w,
          h: newWidget.position.h,
          minW: widgetType === 'emoji' ? 1 : 2,
          minH: widgetType === 'emoji' ? 1 : 2,
        }
      ]);

    } catch (error) {
      console.error('[DashboardCanvas] Error processing drop:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="h-full flex bg-gray-50 relative">
      {/* Sidebar Toolbar */}
      <motion.div
        initial={false}
        animate={{ width: sidebarOpen ? 320 : 0 }}
        className="bg-white border-r border-gray-200 overflow-hidden flex-shrink-0"
      >
        <DashboardWidgetToolbar
          savedCharts={savedWidgets.filter(w => w.type === 'chart')}
          onAddChart={(chartWidget) => {
            handleAddWidget('chart', {
              c1Response: chartWidget.c1Response,
              originalQuery: chartWidget.originalQuery,
              timestamp: chartWidget.timestamp
            });
          }}
          onAddEmoji={(emoji, size) => {
            handleAddWidget('emoji', { emoji, size });
          }}
          onAddText={(text) => {
            handleAddWidget('text', {
              text,
              fontSize: 16,
              color: '#000000',
              fontWeight: 'normal'
            });
          }}
        />
      </motion.div>

      {/* Toggle Sidebar Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-r-lg p-2 shadow-lg hover:bg-gray-50 transition-colors z-20"
        style={{ left: sidebarOpen ? '320px' : '0px' }}
      >
        {sidebarOpen ? (
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-600" />
        )}
      </button>

      {/* Canvas Area */}
      <div
        className="flex-1 overflow-auto p-6"
        onDragOver={(e) => e.preventDefault()} // Allow drop on container
      >
        {saving && (
          <div className="fixed top-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 z-50">
            <Loader2 className="h-4 w-4 animate-spin" />
            Guardando...
          </div>
        )}

        {widgets.length === 0 && widgets.length /* Hack to force grid if empty? No, RGL handles empty */ ? null : (
          // We always render GridLayout so it can receive drops, even if empty?
          // RGL needs a width.
          null
        )}

        {/* Even if empty, we need the grid to accept drops. But the empty state UI blocks it. 
            We should overlay the empty state or render the grid always.
            Let's render Grid ALWAYS, but if empty show background hint.
        */}

        <GridLayout
          className="layout min-h-[500px]"
          layout={layouts}
          cols={12}
          rowHeight={dashboard.layout_config.rowHeight || 80}
          width={1200}
          onLayoutChange={handleLayoutChange}
          draggableHandle=".drag-handle"
          preventCollision={false}
          isDroppable={true}
          onDrop={handleDrop}
          droppingItem={{ i: 'dropping', w: 4, h: 3 }}
        >
          {widgets.map((widget) => (
            <div key={widget.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              {widget.widget_type === 'chart' && (
                <ChartWidget
                  widget={widget}
                  onRemove={() => handleRemoveWidget(widget.id)}
                />
              )}
              {widget.widget_type === 'emoji' && (
                <EmojiWidget
                  widget={widget}
                  onRemove={() => handleRemoveWidget(widget.id)}
                />
              )}
              {widget.widget_type === 'text' && (
                <TextWidget
                  widget={widget}
                  onRemove={() => handleRemoveWidget(widget.id)}
                />
              )}
            </div>
          ))}
        </GridLayout>

        {widgets.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <div className="text-center text-gray-500">
              <Sidebar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Pizarra vacía</p>
              <p className="text-sm mt-2">Arrastra widgets aquí</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


