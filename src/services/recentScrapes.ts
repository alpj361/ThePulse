import { EXTRACTORW_API_URL } from './api';
import { supabase } from './supabase';

// ===================================================================
// RECENT SCRAPES SERVICE
// Servicio para obtener scrapes recientes de la tabla recent_scrapes
// ===================================================================

export interface RecentScrape {
  id: string;
  created_at: string;
  user_id: string;
  herramienta: string;
  query_original: string;
  query_clean: string;
  tweet_count?: number;
  categoria?: string;
  generated_title?: string;
  smart_grouping?: string;
  nitter_context?: any;
  detected_group?: string;
  location?: string;
  total_engagement?: number;
  avg_engagement?: number;
  tweets?: any[];
  // Campos específicos para nitter_profile
  profile?: string;
  profile_link?: string;
  contexto_perfil?: string;
}

export interface RecentScrapeStats {
  totalScrapes: number;
  totalTweets: number;
  totalEngagement: number;
  avgTweetsPerScrape: number;
  avgEngagementPerScrape: number;
  herramientasCount: Record<string, number>;
  categoriasCount: Record<string, number>;
  scrapesPorDia: Record<string, number>;
}

export interface RecentScrapeGroup {
  group_key: string; // detected_group o smart_grouping
  scrapes: RecentScrape[];
  scrapes_count: number;
  total_tweets: number;
  latest_created_at: string;
}

interface GetRecentScrapesOptions {
  limit?: number;
  offset?: number;
  herramienta?: string;
  categoria?: string;
}

/**
 * Obtiene los monitoreos de actividad reciente (recent_scrapes) de un usuario
 * @param userId ID del usuario
 * @param options Opciones de consulta
 * @returns Lista de monitoreos recientes
 */
export async function getRecentScrapes(
  userId: string,
  options: GetRecentScrapesOptions = {}
): Promise<RecentScrape[]> {
  try {
    const { limit = 10, offset = 0, herramienta, categoria } = options;
    
    let query = supabase
      .from('recent_scrapes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Filtrar por herramienta si se especifica
    if (herramienta) {
      query = query.eq('herramienta', herramienta);
    }
    
    // Filtrar por categoría si se especifica
    if (categoria) {
      query = query.eq('categoria', categoria);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error obteniendo monitoreos recientes:', error);
      throw error;
    }
    
    // Filtrar duplicados basados en query_clean
    const seen = new Set<string>();
    const uniqueData = (data || []).filter(item => {
      const key = item.query_clean || item.query_original || item.id;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
    
    return uniqueData;
  } catch (error) {
    console.error('Error en getRecentScrapes:', error);
    return [];
  }
}

/**
 * Obtiene un monitoreo específico por ID
 * @param scrapeId ID del monitoreo
 * @returns Detalles del monitoreo
 */
export async function getRecentScrapeById(scrapeId: string): Promise<RecentScrape | null> {
  try {
    const { data, error } = await supabase
      .from('recent_scrapes')
      .select('*')
      .eq('id', scrapeId)
      .single();
    
    if (error) {
      console.error('Error obteniendo monitoreo por ID:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error en getRecentScrapeById:', error);
    return null;
  }
}

/**
 * Obtiene los monitoreos agrupados por categoría
 * @param userId ID del usuario
 * @returns Monitoreos agrupados por categoría
 */
export async function getRecentScrapesByCategory(userId: string): Promise<Record<string, RecentScrape[]>> {
  try {
    const scrapes = await getRecentScrapes(userId, { limit: 50 });
    
    // Agrupar por categoría
    return scrapes.reduce((acc, scrape) => {
      const categoria = scrape.categoria || 'Sin categoría';
      
      if (!acc[categoria]) {
        acc[categoria] = [];
      }
      
      acc[categoria].push(scrape);
      return acc;
    }, {} as Record<string, RecentScrape[]>);
  } catch (error) {
    console.error('Error en getRecentScrapesByCategory:', error);
    return {};
  }
}

/**
 * Obtiene estadísticas de scrapes del usuario
 */
export async function getRecentScrapeStats(userId: string): Promise<RecentScrapeStats> {
  try {
    const { data: stats, error } = await supabase
      .from('recent_scrapes')
      .select('herramienta, categoria, tweet_count, total_engagement, created_at')
      .eq('user_id', userId)
      .is('tweet_id', null);

    if (error) {
      throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    }

    // Calcular métricas
    const totalScrapes = stats?.length || 0;
    const totalTweets = stats?.reduce((sum, s) => sum + (s.tweet_count || 0), 0) || 0;
    const totalEngagement = stats?.reduce((sum, s) => sum + (s.total_engagement || 0), 0) || 0;

    // Herramientas más usadas
    const herramientasCount: Record<string, number> = {};
    stats?.forEach(s => {
      herramientasCount[s.herramienta] = (herramientasCount[s.herramienta] || 0) + 1;
    });

    // Categorías más usadas
    const categoriasCount: Record<string, number> = {};
    stats?.forEach(s => {
      categoriasCount[s.categoria] = (categoriasCount[s.categoria] || 0) + 1;
    });

    // Scrapes por día (últimos 7 días)
    const scrapesPorDia: Record<string, number> = {};
    const hoy = new Date();
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - i);
      const fechaStr = fecha.toISOString().split('T')[0];
      scrapesPorDia[fechaStr] = 0;
    }

    stats?.forEach(s => {
      const fecha = s.created_at.split('T')[0];
      if (scrapesPorDia.hasOwnProperty(fecha)) {
        scrapesPorDia[fecha]++;
      }
    });

    return {
      totalScrapes,
      totalTweets,
      totalEngagement,
      avgTweetsPerScrape: totalScrapes > 0 ? Math.round(totalTweets / totalScrapes) : 0,
      avgEngagementPerScrape: totalScrapes > 0 ? Math.round(totalEngagement / totalScrapes) : 0,
      herramientasCount,
      categoriasCount,
      scrapesPorDia
    };

  } catch (error) {
    console.error('Error obteniendo estadísticas de scrapes:', error);
    throw error;
  }
}

/**
 * Elimina un scrape específico del usuario
 */
export async function deleteRecentScrape(scrapeId: string, authToken?: string): Promise<void> {
  try {
    // Preparar headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Agregar token de autenticación si está disponible
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Usar el endpoint de ExtractorW que maneja autenticación
    const response = await fetch(`${EXTRACTORW_API_URL}/vizta-chat/scrapes/${scrapeId}`, {
      method: 'DELETE',
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Error HTTP: ${response.status}`);
    }

    if (!data.success) {
      throw new Error(data.message || 'Error eliminando scrape');
    }

    console.log('✅ Scrape eliminado exitosamente:', data.deletedScrape);

  } catch (error) {
    console.error('Error eliminando scrape:', error);
    throw error;
  }
}

/**
 * Obtiene los monitoreos agrupados por detected_group/smart_grouping directamente desde Supabase
 * @param userId ID del usuario actual
 * @param limit Número máximo de grupos a obtener (por defecto 20)
 */
export async function getRecentScrapeGroups(
  userId: string,
  limit: number = 20
): Promise<RecentScrapeGroup[]> {
  try {
    // Obtener un conjunto razonable de scrapes recientes (hasta 200) y agruparlos en el cliente
    const { data, error } = await supabase
      .from('recent_scrapes')
      .select('*')
      .eq('user_id', userId)
      .gt('tweet_count', 0)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('Error al obtener recent_scrapes para agrupación:', error);
      throw error;
    }

    const scrapes: RecentScrape[] = data || [];

    // Agrupar localmente por smart_grouping o detected_group
    const groupsMap: Record<string, RecentScrapeGroup> = {};

    scrapes.forEach((scrape) => {
      const key = (scrape.smart_grouping || (scrape as any).detected_group || scrape.query_clean || 'sin_grupo').toLowerCase();

      if (!groupsMap[key]) {
        groupsMap[key] = {
          group_key: key,
          scrapes: [],
          scrapes_count: 0,
          total_tweets: 0,
          latest_created_at: scrape.created_at,
        };
      }

      const grp = groupsMap[key];
      grp.scrapes.push(scrape);
      grp.scrapes_count += 1;
      grp.total_tweets += scrape.tweet_count || 0;

      // Actualizar fecha más reciente
      if (new Date(scrape.created_at) > new Date(grp.latest_created_at)) {
        grp.latest_created_at = scrape.created_at;
      }
    });

    // Convertir a array y ordenar por fecha y limitar
    const groupsArr = Object.values(groupsMap).sort((a, b) => new Date(b.latest_created_at).getTime() - new Date(a.latest_created_at).getTime());

    return groupsArr.slice(0, limit);
  } catch (err) {
    console.error('Error en getRecentScrapeGroups:', err);
    return [];
  }
} 