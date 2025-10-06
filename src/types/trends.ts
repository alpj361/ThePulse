// Tipos para el sistema de Trends con clasificación de deportes

export interface TrendItem {
  id: string;
  created_at: string;
  word_cloud_data: Array<{ text: string; value: number }>;
  top_keywords: string[];
  category_data: Array<{ category: string; count: number }>;
  about_data?: AboutInfo[];
  statistics?: Statistics;
  is_deportes: boolean; // NUEVO: Flag para indicar si es deportivo
  categoria_principal: string; // NUEVO: Categoría principal del trend
  raw_data?: any;
  processing_status?: string;
  source?: string;
}

export interface AboutInfo {
  trend: string;
  category: string;
  relevance: 'alta' | 'media' | 'baja';
  local_context: boolean;
  reason: string;
}

export interface Statistics {
  total: number;
  categorias_count: number;
  relevancia: {
    alta: number;
    media: number;
    baja: number;
  };
  contexto: {
    local: number;
    global: number;
  };
}

export interface TrendsFilter {
  showDeportes: boolean;
  showGenerales: boolean;
  categoria?: string;
}

export type TrendCategory = 'Deportes' | 'Política' | 'Económica' | 'Social' | 'Música' | 'Otros' | 'General';

export interface TrendsStats {
  total_trends: number;
  deportivos: number;
  no_deportivos: number;
  porcentaje_deportes: number;
  categorias_count: Record<TrendCategory, number>;
}

