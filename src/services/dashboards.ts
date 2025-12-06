import { supabase } from './supabase';
import type { SavedWidget, WidgetPosition } from '../stores/dashboardStore';

export interface Dashboard {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  layout_config: {
    cols: number;
    rowHeight: number;
  };
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardWidget {
  id: string;
  dashboard_id: string;
  widget_type: 'chart' | 'emoji' | 'text' | 'custom-chart';
  content: any; // JSON content based on widget_type
  position: WidgetPosition;
  config: Record<string, any>;
  z_index: number;
  created_at: string;
  updated_at: string;
}

// Get all dashboards for current user
export async function getUserDashboards(): Promise<Dashboard[]> {
  const { data, error } = await supabase
    .from('dashboards')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Dashboards] Error fetching dashboards:', error);
    throw error;
  }

  return data || [];
}

// Create new dashboard
export async function createDashboard(title: string, description?: string): Promise<Dashboard> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Check user doesn't already have 3 dashboards
  const existing = await getUserDashboards();
  if (existing.length >= 3) {
    throw new Error('Maximum of 3 dashboards reached');
  }

  const { data, error } = await supabase
    .from('dashboards')
    .insert({
      user_id: user.id,
      title,
      description,
      is_default: existing.length === 0 // First dashboard is default
    })
    .select()
    .single();

  if (error) {
    console.error('[Dashboards] Error creating dashboard:', error);
    throw error;
  }

  console.log('[Dashboards] Dashboard created:', data.id);
  return data;
}

// Update dashboard
export async function updateDashboard(
  dashboardId: string,
  updates: Partial<Pick<Dashboard, 'title' | 'description' | 'layout_config'>>
): Promise<Dashboard> {
  const { data, error } = await supabase
    .from('dashboards')
    .update(updates)
    .eq('id', dashboardId)
    .select()
    .single();

  if (error) {
    console.error('[Dashboards] Error updating dashboard:', error);
    throw error;
  }

  return data;
}

// Delete dashboard
export async function deleteDashboard(dashboardId: string): Promise<void> {
  const { error } = await supabase
    .from('dashboards')
    .delete()
    .eq('id', dashboardId);

  if (error) {
    console.error('[Dashboards] Error deleting dashboard:', error);
    throw error;
  }

  console.log('[Dashboards] Dashboard deleted:', dashboardId);
}

// Get widgets for a dashboard
export async function getDashboardWidgets(dashboardId: string): Promise<DashboardWidget[]> {
  const { data, error } = await supabase
    .from('dashboard_widgets')
    .select('*')
    .eq('dashboard_id', dashboardId)
    .order('z_index', { ascending: true });

  if (error) {
    console.error('[Dashboards] Error fetching widgets:', error);
    throw error;
  }

  return data || [];
}

// Add widget to dashboard
export async function addWidgetToDashboard(
  dashboardId: string,
  widgetType: 'chart' | 'emoji' | 'text' | 'custom-chart',
  content: any,
  position: WidgetPosition,
  config?: Record<string, any>
): Promise<DashboardWidget> {
  const { data, error } = await supabase
    .from('dashboard_widgets')
    .insert({
      dashboard_id: dashboardId,
      widget_type: widgetType,
      content,
      position,
      config: config || {},
      z_index: 0
    })
    .select()
    .single();

  if (error) {
    console.error('[Dashboards] Error adding widget:', error);
    throw error;
  }

  console.log('[Dashboards] Widget added:', data.id);
  return data;
}

// Update widget position
export async function updateWidgetPosition(
  widgetId: string,
  position: WidgetPosition
): Promise<void> {
  const { error } = await supabase
    .from('dashboard_widgets')
    .update({ position })
    .eq('id', widgetId);

  if (error) {
    console.error('[Dashboards] Error updating widget position:', error);
    throw error;
  }
}

// Update widget config
export async function updateWidgetConfig(
  widgetId: string,
  config: Record<string, any>
): Promise<void> {
  const { error } = await supabase
    .from('dashboard_widgets')
    .update({ config })
    .eq('id', widgetId);

  if (error) {
    console.error('[Dashboards] Error updating widget config:', error);
    throw error;
  }
}

// Delete widget
export async function deleteWidget(widgetId: string): Promise<void> {
  const { error } = await supabase
    .from('dashboard_widgets')
    .delete()
    .eq('id', widgetId);

  if (error) {
    console.error('[Dashboards] Error deleting widget:', error);
    throw error;
  }

  console.log('[Dashboards] Widget deleted:', widgetId);
}

// Bulk update widget positions (for drag & drop)
export async function bulkUpdateWidgetPositions(
  updates: Array<{ id: string; position: WidgetPosition }>
): Promise<void> {
  const promises = updates.map(({ id, position }) =>
    updateWidgetPosition(id, position)
  );

  await Promise.all(promises);
  console.log('[Dashboards] Bulk update completed:', updates.length, 'widgets');
}


