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
import { CustomChartWidget } from './widgets/CustomChartWidget';
import { CustomChartModal } from './CustomChartModal';
import { DashboardThemeProvider, useDashboardTheme } from '../../context/DashboardThemeContext';
import { ThemeSelector } from './ThemeSelector';

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
  const [showCustomChartModal, setShowCustomChartModal] = useState(false);

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

  const handleAddWidget = async (widgetType: 'chart' | 'emoji' | 'text' | 'custom-chart', content: any) => {
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
    }
  };

  const handleRemoveWidget = async (widgetId: string) => {
    try {
      await deleteWidget(widgetId);
      setWidgets(widgets.filter(w => w.id !== widgetId));
      setLayouts(layouts.filter(l => l.i !== widgetId));
    } catch (error) {
      console.error('[DashboardCanvas] Error removing widget:', error);
    }
  };

  const handleLayoutChange = async (newLayout: Layout[]) => {
    setLayouts(newLayout);

    // Save new positions
    setSaving(true);
    try {
      const updates = newLayout.map(l => ({
        id: l.i,
        position: {
          x: l.x,
          y: l.y,
          w: l.w,
          h: l.h
        }
      }));

      await bulkUpdateWidgetPositions(updates);
    } catch (error) {
      console.error('[DashboardCanvas] Error saving layouts:', error);
    } finally {
      setSaving(false);
    }
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

      // Add widget at dropped position
      const newPosition = {
        x: layoutItem.x,
        y: layoutItem.y,
        w: widgetType === 'emoji' ? 2 : 4,
        h: widgetType === 'emoji' ? 2 : 3
      };

      const newWidget = await addWidgetToDashboard(
        dashboard.id,
        // @ts-ignore
        widgetType,
        widgetData,
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
    } catch (error) {
      console.error('[DashboardCanvas] Error processing drop:', error);
    }
  };

  const renderWidget = (widget: DashboardWidget) => {
    switch (widget.widget_type) {
      case 'chart':
        return <ChartWidget widget={widget} onRemove={() => handleRemoveWidget(widget.id)} />;
      case 'emoji':
        return <EmojiWidget widget={widget} onRemove={() => handleRemoveWidget(widget.id)} />;
      case 'text':
        return <TextWidget widget={widget} onRemove={() => handleRemoveWidget(widget.id)} />;
      case 'custom-chart':
        return <CustomChartWidget widget={widget} onRemove={() => handleRemoveWidget(widget.id)} />;
      default:
        // @ts-ignore
        if (widget.widget_type === 'custom-chart') {
          return <CustomChartWidget widget={widget} onRemove={() => handleRemoveWidget(widget.id)} />;
        }
        return <div className="p-4 bg-gray-100 rounded">Unknown widget type</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // Filter widgets for toolbar (only saved charts from vizta-chat or similar, usually existing ones)
  // Actually dashboard store savedWidgets likely refers to "Recent Saved" from chat.
  // We need to access that list for the toolbar.
  // The toolbar props require savedCharts.
  // We can use the store content directly here.
  const savedCharts = useDashboardStore.getState().savedWidgets || [];

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden relative">
      {/* Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`absolute top-4 z-20 p-1.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-all ${sidebarOpen ? 'right-[330px]' : 'right-4'
          }`}
      >
        {sidebarOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto p-8 min-h-full">
        <div className="max-w-[1600px] mx-auto min-h-[800px]">
          <GridLayout
            className="layout"
            layout={layouts}
            cols={12}
            rowHeight={100}
            width={sidebarOpen ? 1200 : 1500}
            isDroppable={true}
            onDrop={handleDrop}
            onLayoutChange={handleLayoutChange}
            draggableHandle=".drag-handle, .recharts-responsive-container, .emoji-widget"
          >
            {widgets.map((widget) => (
              <div key={widget.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative group">
                {renderWidget(widget)}
              </div>
            ))}
          </GridLayout>
        </div>
      </div>

      {/* Right Sidebar - Tools */}
      <motion.div
        initial={false}
        animate={{ width: sidebarOpen ? 320 : 0, opacity: sidebarOpen ? 1 : 0 }}
        className="bg-white border-l border-gray-200 h-full overflow-hidden flex flex-col relative z-10"
      >
        <div className="w-[320px] h-full flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-gray-700 flex items-center gap-2">
              <Sidebar className="w-4 h-4" />
              Herramientas
            </span>
            {saving && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Guardando...
              </span>
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            <DashboardWidgetToolbar
              savedCharts={savedCharts}
              onAddChart={(chart) => handleAddWidget('chart', chart)}
              onAddEmoji={(emoji) => handleAddWidget('emoji', { emoji })}
              onAddText={(text) => handleAddWidget('text', { text })}
              onAddCustomChart={() => setShowCustomChartModal(true)}
            />
          </div>
        </div>
      </motion.div>

      {/* Custom Chart Modal */}
      <CustomChartModal
        isOpen={showCustomChartModal}
        onClose={() => setShowCustomChartModal(false)}
        onAddChart={(config) => handleAddWidget('custom-chart', config)}
      />
    </div>
  );
}
