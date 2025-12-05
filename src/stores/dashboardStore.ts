import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface ChartWidget {
  id: string;
  type: 'chart';
  c1Response: string;
  originalQuery: string;
  timestamp: string;
  preview?: string; // First 100 chars for display
}

export interface EmojiWidget {
  id: string;
  type: 'emoji';
  emoji: string;
  size: 'small' | 'medium' | 'large';
}

export interface TextWidget {
  id: string;
  type: 'text';
  text: string;
  fontSize: number;
  color: string;
  fontWeight: 'normal' | 'bold';
}

export type SavedWidget = ChartWidget | EmojiWidget | TextWidget;

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PlacedWidget {
  widgetId: string;
  position: WidgetPosition;
  zIndex: number;
}

interface DashboardStore {
  // Saved widgets from chat (not yet placed)
  savedWidgets: SavedWidget[];
  
  // Add widget from chat
  saveChartWidget: (c1Response: string, query: string) => void;
  
  // Remove saved widget
  removeSavedWidget: (widgetId: string) => void;
  
  // Clear all saved widgets
  clearSavedWidgets: () => void;
  
  // Get widget by ID
  getWidget: (widgetId: string) => SavedWidget | undefined;
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      savedWidgets: [],
      
      saveChartWidget: (c1Response: string, query: string) => {
        const id = `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const preview = query.length > 100 ? query.substring(0, 100) + '...' : query;
        
        const newWidget: ChartWidget = {
          id,
          type: 'chart',
          c1Response,
          originalQuery: query,
          timestamp: new Date().toISOString(),
          preview
        };
        
        set((state) => ({
          savedWidgets: [...state.savedWidgets, newWidget]
        }));
        
        console.log('[DashboardStore] Chart widget saved:', id);
      },
      
      removeSavedWidget: (widgetId: string) => {
        set((state) => ({
          savedWidgets: state.savedWidgets.filter(w => w.id !== widgetId)
        }));
        
        console.log('[DashboardStore] Widget removed:', widgetId);
      },
      
      clearSavedWidgets: () => {
        set({ savedWidgets: [] });
        console.log('[DashboardStore] All saved widgets cleared');
      },
      
      getWidget: (widgetId: string) => {
        return get().savedWidgets.find(w => w.id === widgetId);
      }
    }),
    {
      name: 'dashboard-storage', // LocalStorage key
      partialize: (state) => ({
        savedWidgets: state.savedWidgets
      })
    }
  )
);


