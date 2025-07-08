import { supabase } from './supabase.ts';
import type { RecentScrape } from './recentScrapes.ts';

export interface ProjectMonitoreo {
  id: string;
  project_id: string;
  scrape_id: string;
  added_at: string;
  scrape?: RecentScrape;
}

/**
 * Enlaza un monitoreo (recent_scrape) a un proyecto.
 * Garantiza unicidad por constraint UNIQUE (project_id, scrape_id).
 */
export const addMonitoreoToProject = async (
  projectId: string,
  scrapeId: string
): Promise<ProjectMonitoreo> => {
  const { data, error } = await supabase
    .from('project_monitoreos')
    .insert({ project_id: projectId, scrape_id: scrapeId })
    .select()
    .single();

  if (error) {
    // "23505" = unique_violation → ya existe, ignorar y devolver existente
    if (error.code === '23505') {
      const existing = await getMonitoreoLink(projectId, scrapeId);
      if (existing) return existing;
    }
    throw error;
  }
  return data as ProjectMonitoreo;
};

/** Obtener un enlace específico proyecto-monitoreo */
export const getMonitoreoLink = async (
  projectId: string,
  scrapeId: string
): Promise<ProjectMonitoreo | null> => {
  const { data, error } = await supabase
    .from('project_monitoreos')
    .select('*')
    .eq('project_id', projectId)
    .eq('scrape_id', scrapeId)
    .single();
  if (error?.code === 'PGRST116') return null;
  if (error) throw error;
  return data as ProjectMonitoreo;
};

/**
 * Obtiene todos los monitoreos asociados a un proyecto.
 * Incluye la información del scrape usando join.
 */
export const getMonitoreosByProject = async (
  projectId: string
): Promise<ProjectMonitoreo[]> => {
  const { data, error } = await supabase
    .from('project_monitoreos')
    .select(
      `*, scrape:recent_scrapes(*)`
    )
    .eq('project_id', projectId)
    .order('added_at', { ascending: false });

  if (error) throw error;
  return (data as ProjectMonitoreo[]) || [];
};

/** Elimina el vínculo entre un proyecto y un monitoreo */
export const removeMonitoreoFromProject = async (
  projectId: string,
  scrapeId: string
): Promise<void> => {
  const { error } = await supabase
    .from('project_monitoreos')
    .delete()
    .eq('project_id', projectId)
    .eq('scrape_id', scrapeId);
  if (error) throw error;
}; 