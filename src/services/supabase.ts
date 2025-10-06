/**
 * Supabase client configuration
 * 
 * This file integrates with Supabase using Bolt.new and Netlify.
 * 
 * For production:
 * - Set up environment variables in Netlify dashboard
 * - The Bolt.new Supabase integration will handle authentication
 * 
 * For local development:
 * 1. Install Supabase client: npm install @supabase/supabase-js
 * 2. Create a .env.local file with your Supabase credentials
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EXTRACTORW_API_URL } from './api';
import { wordCloudData as mockWordCloudData, topKeywords as mockTopKeywords, categoryData as mockCategoryData } from '../data/mockData';

// Use environment variables for Supabase configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create mock Supabase data for development
const mockTrendData = {
  id: 'mock-id',
  created_at: new Date().toISOString(),
  timestamp: new Date().toISOString(),
  word_cloud_data: mockWordCloudData,
  top_keywords: mockTopKeywords,
  category_data: mockCategoryData
};

// ---------------------------------------------------------------------------
// SINGLETON SUPABASE CLIENT
// Evita múltiples instancias de GoTrueClient al hacer HMR o importar el
// cliente en varios archivos. Se guarda en globalThis.__supabase__.
// ---------------------------------------------------------------------------

declare global {
  // eslint-disable-next-line no-var, @typescript-eslint/naming-convention
  var __supabase__: SupabaseClient | undefined;
}

// Create and export the Supabase client
export const supabase: SupabaseClient = (() => {
  // Si ya existe (por ejemplo, en recargas HMR), reutilizarlo
  if (globalThis.__supabase__) return globalThis.__supabase__;

  // Crear nuevo cliente
  const client = SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        },
        global: {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
          }
        }
      })
    : createClient('https://example.com', 'mock-key'); // fallback para storybook/tests

  globalThis.__supabase__ = client;
  return client;
})();

/**
 * Database schema for reference:
 * 
 * Table: trends
 * - id: uuid (primary key, generated)
 * - created_at: timestamp with time zone (default now())
 * - timestamp: timestamp with time zone (when the trend data was collected)
 * - word_cloud_data: jsonb (array of WordCloudItem)
 * - top_keywords: jsonb (array of KeywordCount)
 * - category_data: jsonb (array of CategoryCount)
 */

/**
 * Insert trend data into Supabase
 */
export async function insertTrendData(data: any): Promise<void> {
  // Check if Supabase is properly configured
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase not configured, skipping database operation');
    return;
  }
  
  try {
    const { error } = await supabase
      .from('trends')
      .upsert([
        {
          timestamp: data.timestamp,
          word_cloud_data: data.wordCloudData,
          top_keywords: data.topKeywords,
          category_data: data.categoryData
        }
      ], { ignoreDuplicates: true }); // Evita error 409 si el timestamp ya existe
    
    if (error) throw error;
  } catch (error) {
    console.error('Error inserting trend data:', error);
    throw error;
  }
}

/**
 * Get the latest trend data from Supabase
 */
export async function getLatestTrendData(): Promise<any | null> {
  // Check if Supabase is properly configured
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase not configured, returning mock data');
    return mockTrendData;
  }
  
  try {
    const { data, error } = await supabase
      .from('trends')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        console.log('📭 No se encontraron datos de tendencias en Supabase');
        return null;
      }
      throw error;
    }
    
    console.log('📋 Datos encontrados en Supabase:', {
      timestamp: data.timestamp,
      hasWordCloud: !!data.word_cloud_data,
      hasKeywords: !!data.top_keywords,
      hasCategories: !!data.category_data,
      keywordCount: data.top_keywords?.length || 0
    });
    
    // Verificar si los datos tienen la estructura completa
    if (!data.top_keywords || data.top_keywords.length < 10) {
      console.warn(`Los datos recuperados tienen ${data.top_keywords?.length || 0} keywords, se esperaban 10`);
      
      // Si tenemos datos crudos, procesar localmente
      if (data.raw_data) {
        console.log('Usando raw_data para generar topKeywords completos');
        
        // Ordenar por alguna métrica relevante (p.ej. volume)
        const rawItems = data.raw_data.trends || [];
        const sortedItems = [...rawItems].sort((a, b) => (b.volume || 0) - (a.volume || 0));
        
        // Tomar top 10 o repetir si hay menos
        const top10 = sortedItems.slice(0, 10);
        while (top10.length < 10) {
          // Si hay menos de 10, repetir los más importantes
          top10.push(top10[top10.length % Math.max(1, top10.length)]);
        }
        
        // Crear estructura para topKeywords
        data.top_keywords = top10.map(item => ({
          keyword: item.name || item.keyword || 'Unknown',
          count: item.volume || item.count || 1
        }));
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching latest trend data from Supabase:', error);
    // Solo retornar mock data si Supabase no está configurado, no por errores de query
    return null;
  }
}

/**
 * Obtiene trends filtrados por tipo (deportes o no deportes)
 * @param isDeportes - true para deportivos, false para no deportivos
 * @param limit - número máximo de trends a retornar
 */
export async function getTrendsByType(isDeportes: boolean, limit: number = 10): Promise<any[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase not configured');
    return [];
  }
  
  try {
    const { data, error} = await supabase
      .from('trends')
      .select('*')
      .eq('is_deportes', isDeportes)
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    console.log(`📊 Trends ${isDeportes ? 'deportivos' : 'generales'} encontrados:`, data?.length || 0);
    return data || [];
  } catch (error) {
    console.error(`Error fetching ${isDeportes ? 'sports' : 'general'} trends:`, error);
    return [];
  }
}

/**
 * Obtiene estadísticas de distribución deportes vs generales
 */
export async function getTrendsStats(): Promise<any> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase not configured');
    return null;
  }
  
  try {
    // Obtener los últimos 30 días de trends
    const { data, error } = await supabase
      .from('trends')
      .select('is_deportes, categoria_principal, timestamp')
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    
    if (!data || data.length === 0) return null;
    
    const deportivos = data.filter(t => t.is_deportes).length;
    const total = data.length;
    
    // Contar por categorías
    const categorias: Record<string, number> = {};
    data.forEach(t => {
      const cat = t.categoria_principal || 'General';
      categorias[cat] = (categorias[cat] || 0) + 1;
    });
    
    return {
      total_trends: total,
      deportivos,
      no_deportivos: total - deportivos,
      porcentaje_deportes: Math.round((deportivos / total) * 100),
      categorias_count: categorias
    };
  } catch (error) {
    console.error('Error fetching trends stats:', error);
    return null;
  }
}

/**
 * Tabla: codex_items
 * - id: uuid (primary key)
 * - user_id: uuid (referencia a auth.users)
 * - tipo: text (documento, audio, video, enlace)
 * - titulo: text
 * - descripcion: text
 * - etiquetas: text[]
 * - proyecto: text
 * - storage_path: text
 * - url: text
 * - nombre_archivo: text
 * - tamano: bigint
 * - fecha: date
 * - created_at: timestamp with time zone (default now())
 */

export async function saveCodexItem(item: any) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const payload: any = {
    user_id: item.user_id,
    tipo: item.tipo,
    titulo: item.titulo,
    descripcion: item.descripcion,
    etiquetas: item.etiquetas,
    proyecto: item.proyecto,
    project_id: item.project_id || null,
    storage_path: item.storagePath,
    url: item.url,
    nombre_archivo: item.nombreArchivo,
    tamano: item.tamano,
    fecha: item.fecha,
    is_drive: item.isDrive || false,
    drive_file_id: item.driveFileId || null,
    source_url: item.source_url || null,
    content: item.content || null,
    analyzed: item.analyzed ?? false,
    original_type: item.original_type || null,
    recent_scrape_id: item.recent_scrape_id || null,
    // grouping
    group_id: item.group_id || null,
    is_group_parent: item.is_group_parent ?? false,
    group_name: item.group_name || null,
    group_description: item.group_description || null,
    part_number: item.part_number || null,
    total_parts: item.total_parts || null
  };
  const { data, error } = await supabase
    .from('codex_items')
    .insert([payload])
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function saveCodexItemsBatch(items: any[]) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  const mapped = items.map((item) => ({
    user_id: item.user_id,
    tipo: item.tipo,
    titulo: item.titulo,
    descripcion: item.descripcion,
    etiquetas: item.etiquetas,
    proyecto: item.proyecto,
    project_id: item.project_id || null,
    storage_path: item.storagePath,
    url: item.url,
    nombre_archivo: item.nombreArchivo,
    tamano: item.tamano,
    fecha: item.fecha,
    is_drive: item.isDrive || false,
    drive_file_id: item.driveFileId || null,
    source_url: item.source_url || null,
    content: item.content || null,
    analyzed: item.analyzed ?? false,
    original_type: item.original_type || null,
    recent_scrape_id: item.recent_scrape_id || null,
    group_id: item.group_id || null,
    is_group_parent: item.is_group_parent ?? false,
    group_name: item.group_name || null,
    group_description: item.group_description || null,
    part_number: item.part_number || null,
    total_parts: item.total_parts || null
  }));
  const { data, error } = await supabase
    .from('codex_items')
    .insert(mapped)
    .select('*');
  if (error) throw error;
  return data || [];
}

export async function saveLinkRelations(relations: { item_id: string; user_id: string; notes?: string, parent_item_id?: string }[]) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  const { data, error } = await supabase
    .from('links')
    .insert(relations)
    .select('*');
  if (error) throw error;
  return data || [];
}

export async function getCodexItemsByUser(user_id: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  
  // Consulta expandida para incluir datos de recent_scrapes cuando applicable
  const { data, error } = await supabase
    .from('codex_items')
    .select(`
      *,
      recent_scrapes:recent_scrape_id (
        id,
        query_original,
        query_clean,
        herramienta,
        categoria,
        tweet_id,
        usuario,
        fecha_tweet,
        texto,
        enlace,
        likes,
        retweets,
        replies,
        verified,
        sentimiento,
        location,
        created_at
      ),
      links_as_child:links!links_item_id_fkey ( parent_item_id )
    `)
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });
    
  if (error) throw error;

  // Fallback robusto: consultar la tabla links aparte por si el FK alias no coincide
  const itemIds = (data || []).map((it: any) => it.id);
  let linksMap: Record<string, string> = {};
  if (itemIds.length > 0) {
    const { data: linksRows, error: linksErr } = await supabase
      .from('links')
      .select('item_id,parent_item_id')
      .in('item_id', itemIds);
    if (!linksErr && Array.isArray(linksRows)) {
      for (const row of linksRows) {
        if (row && row.item_id) linksMap[row.item_id] = row.parent_item_id || null;
      }
    }
  }

  // Mapear los datos para incluir recent_scrape y flag is_child_link (preferir mapa externo si existe)
  const mappedData = (data || []).map((item: any) => {
    const joinedParent = Array.isArray(item.links_as_child) && item.links_as_child[0]?.parent_item_id ? item.links_as_child[0]?.parent_item_id : null;
    const mappedParent = linksMap[item.id] !== undefined ? linksMap[item.id] : null;
    const parent_item_id = mappedParent || joinedParent || null;
    const is_child_link = Boolean(parent_item_id);
    return {
      ...item,
      recent_scrape: item.recent_scrapes || null,
      is_child_link,
      parent_item_id
    };
  });

  return mappedData;
}

/**
 * Obtener activos (codex items) asociados a un proyecto específico
 */
export async function getProjectAssets(projectId: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  
  try {
    const { data, error } = await supabase
      .from('codex_items')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching project assets:', error);
    return [];
  }
}

/**
 * Obtener codex items disponibles para agregar a un proyecto (sin project_id asignado)
 */
export async function getAvailableCodexItems(userId: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  
  try {
    const { data, error } = await supabase
      .from('codex_items')
      .select(`
        *,
        links_as_child:links!links_item_id_fkey ( parent_item_id )
      `)
      .eq('user_id', userId)
      .is('project_id', null)
      .order('created_at', { ascending: false });
    if (error) throw error;

    // Fallback para marcar hijos mediante consulta directa a links
    const itemIds = (data || []).map((it: any) => it.id);
    let linksMap: Record<string, string> = {};
    if (itemIds.length > 0) {
      const { data: linksRows } = await supabase
        .from('links')
        .select('item_id,parent_item_id')
        .in('item_id', itemIds);
      if (Array.isArray(linksRows)) {
        for (const row of linksRows) {
          if (row && row.item_id) linksMap[row.item_id] = row.parent_item_id || null;
        }
      }
    }

    const mapped = (data || []).map((item: any) => {
      const joinedParent = Array.isArray(item.links_as_child) && item.links_as_child[0]?.parent_item_id ? item.links_as_child[0]?.parent_item_id : null;
      const mappedParent = linksMap[item.id] !== undefined ? linksMap[item.id] : null;
      const parent_item_id = mappedParent || joinedParent || null;
      const is_child_link = Boolean(parent_item_id);
      return {
        ...item,
        is_child_link,
        parent_item_id
      };
    });

    return mapped;
  } catch (error) {
    console.error('Error fetching available codex items:', error);
    return [];
  }
}

/**
 * Asignar un codex item a un proyecto
 */
export async function assignCodexItemToProject(itemId: string, projectId: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase
      .from('codex_items')
      .update({ project_id: projectId })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error assigning codex item to project:', error);
    throw error;
  }
}

/**
 * Desasignar un codex item de un proyecto
 */
export async function unassignCodexItemFromProject(itemId: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase
      .from('codex_items')
      .update({ project_id: null })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error unassigning codex item from project:', error);
    throw error;
  }
}

// ===================================================================
// SISTEMA DE AGRUPAMIENTO CODEX
// ===================================================================

/**
 * Crear un nuevo grupo de videos/audios relacionados
 */
export async function createCodexGroup(
  userId: string,
  groupData: {
    group_name: string;
    group_description: string;
    parent_item_id?: string; // Si se crea a partir de un item existente
  }
) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    console.log('🔄 Creando grupo vía backend ExtractorW:', groupData);

    // Usar el nuevo endpoint del backend
    const response = await fetch('https://server.standatpd.com/api/codex-groups/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getCurrentUserToken()}`
      },
      body: JSON.stringify({
        group_name: groupData.group_name,
        group_description: groupData.group_description,
        parent_item_id: groupData.parent_item_id
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Grupo creado exitosamente vía backend:', result);
    
    return result.group;

  } catch (error) {
    console.error('❌ Error creando grupo vía backend:', error);
    
    // Fallback: intentar crear directamente con Supabase
    console.log('🔄 Intentando fallback con Supabase directo...');
    
    const groupId = crypto.randomUUID();

    // Si se especifica un parent_item_id, actualizar ese item como parent
    if (groupData.parent_item_id) {
      const { error: updateError } = await supabase
        .from('codex_items')
        .update({
          group_id: groupId,
          is_group_parent: true,
          group_name: groupData.group_name,
          group_description: groupData.group_description,
          part_number: null, // El parent no tiene número de parte
          total_parts: 1 // Inicialmente 1, se incrementará al agregar partes
        })
        .eq('id', groupData.parent_item_id)
        .eq('user_id', userId); // Verificar que el usuario es el dueño

      if (updateError) throw updateError;

      // Obtener el item actualizado
      const { data: parentItem, error: fetchError } = await supabase
        .from('codex_items')
        .select('*')
        .eq('id', groupData.parent_item_id)
        .single();

      if (fetchError) throw fetchError;
      return parentItem;
    } else {
      throw new Error('Se requiere parent_item_id para crear un grupo');
    }
  }
}

/**
 * Crear un grupo con múltiples items de una vez (bulk)
 */
export async function createCodexGroupBulk(
  userId: string,
  groupData: {
    group_name: string;
    group_description: string;
    items: {
      tipo?: string;
      titulo?: string;
      descripcion?: string;
      etiquetas?: string[];
      proyecto?: string;
      url: string;
    }[];
  }
) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    console.log('🔄 INICIO createCodexGroupBulk');
    console.log('📝 userId:', userId);
    console.log('📝 groupData:', JSON.stringify(groupData, null, 2));
    
    // Verificar token
    let token;
    try {
      token = await getCurrentUserToken();
      console.log('🔑 Token obtenido:', token ? 'SÍ' : 'NO');
    } catch (tokenError) {
      console.error('❌ Error obteniendo token:', tokenError);
      throw new Error('No se pudo obtener el token de autenticación');
    }

    const endpoint = 'https://server.standatpd.com/api/codex-groups/create-bulk';
    console.log('🌐 Endpoint:', endpoint);

    const requestBody = {
      group_name: groupData.group_name,
      group_description: groupData.group_description,
      items: groupData.items
    };
    console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

    // Hacer la petición
    console.log('📡 Haciendo petición HTTP...');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📥 Respuesta HTTP:', response.status, response.statusText);
    console.log('📥 Headers respuesta:', Object.fromEntries(response.headers.entries()));

    // Leer la respuesta completa
    const responseText = await response.text();
    console.log('📥 Respuesta raw:', responseText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Error parseando respuesta de error:', parseError);
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }
      
      console.error('❌ Error del servidor:', errorData);
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    // Parsear respuesta exitosa
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Error parseando respuesta exitosa:', parseError);
      throw new Error('Respuesta del servidor no válida');
    }

    console.log('✅ Resultado parseado:', result);
    console.log('✅ FIN createCodexGroupBulk exitoso');
    
    return result;

  } catch (error) {
    console.error('❌ Error completo en createCodexGroupBulk:', error);
    console.error('❌ Stack trace:', (error as Error).stack);
    throw error; // No hay fallback para bulk, es mejor fallar claramente
  }
}

/**
 * Agregar item a un grupo existente
 */
export async function addItemToGroup(
  itemId: string,
  groupId: string,
  partNumber: number,
  userId: string
) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    console.log('🔄 Agregando item al grupo vía backend ExtractorW:', { itemId, groupId, partNumber });

    // Usar el nuevo endpoint del backend
    const response = await fetch('https://server.standatpd.com/api/codex-groups/add-item', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getCurrentUserToken()}`
      },
      body: JSON.stringify({
        item_id: itemId,
        group_id: groupId,
        part_number: partNumber
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Item agregado al grupo exitosamente vía backend:', result);
    
    return result.item;

  } catch (error) {
    console.error('❌ Error agregando item al grupo vía backend:', error);
    
    // Fallback: intentar agregar directamente con Supabase
    console.log('🔄 Intentando fallback con Supabase directo...');
    
    // Actualizar el item para que sea parte del grupo
    const { data: updatedItem, error: updateError } = await supabase
      .from('codex_items')
      .update({
        group_id: groupId,
        is_group_parent: false,
        part_number: partNumber
      })
      .eq('id', itemId)
      .eq('user_id', userId) // Verificar que el usuario es el dueño
      .select()
      .single();

    if (updateError) throw updateError;

    // Actualizar el total_parts en el parent
    await updateGroupTotalParts(groupId);

    return updatedItem;
  }
}

/**
 * Función auxiliar para obtener el token del usuario actual
 */
async function getCurrentUserToken() {
  const session = await supabase.auth.getSession();
  if (!session.data.session?.access_token) {
    throw new Error('No hay sesión activa');
  }
  return session.data.session.access_token;
}

/**
 * Remover item de un grupo
 */
export async function removeItemFromGroup(itemId: string, userId: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    // Obtener el item antes de actualizarlo para saber el group_id
    const { data: currentItem, error: fetchError } = await supabase
      .from('codex_items')
      .select('group_id, is_group_parent')
      .eq('id', itemId)
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    if (currentItem.is_group_parent) {
      throw new Error('No se puede remover el item principal del grupo. Elimina todo el grupo si necesitas hacerlo.');
    }

    const groupId = currentItem.group_id;

    // Remover del grupo
    const { data: updatedItem, error: updateError } = await supabase
      .from('codex_items')
      .update({
        group_id: null,
        is_group_parent: false,
        part_number: null
      })
      .eq('id', itemId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Actualizar el total_parts en el parent si había groupId
    if (groupId) {
      await updateGroupTotalParts(groupId);
    }

    return updatedItem;
  } catch (error) {
    console.error('Error removing item from group:', error);
    throw error;
  }
}

/**
 * Obtener todos los items de un grupo
 */
export async function getGroupItems(groupId: string, userId: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase
      .from('codex_items')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', userId) // Solo items del usuario
      .order('is_group_parent', { ascending: false }) // Parent primero
      .order('part_number', { ascending: true }); // Luego por número de parte

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching group items:', error);
    throw error;
  }
}

/**
 * Obtener estadísticas de un grupo
 */
export async function getGroupStats(groupId: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase
      .rpc('get_group_stats', { group_uuid: groupId });

    if (error) {
      // Si la función no existe en la BD, hacemos un fallback manual
      if (error.code === 'PGRST202') {
        // Contar elementos y sumar tamaños manualmente
        const { data: items, count, error: queryError } = await supabase
          .from('codex_items')
          .select('tamano', { count: 'exact' })
          .eq('group_id', groupId);

        if (queryError) throw queryError;

        const totalSize = (items || []).reduce((acc: number, curr: any) => acc + (curr.tamano || 0), 0);

        return { item_count: count || 0, total_size: totalSize };
      }
      throw error;
    }
    return data?.[0] || null;
  } catch (error) {
    console.error('Error fetching group stats:', error);
    throw error;
  }
}

/**
 * Eliminar un grupo completo (parent + todas las partes)
 */
export async function deleteGroup(groupId: string, userId: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    // Obtener todos los items del grupo
    const groupItems = await getGroupItems(groupId, userId);
    
    if (groupItems.length === 0) {
      throw new Error('Grupo no encontrado o no tienes permisos');
    }

    // Eliminar todos los items del grupo
    const { error: deleteError } = await supabase
      .from('codex_items')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId); // Solo items del usuario

    if (deleteError) throw deleteError;

    return true;
  } catch (error) {
    console.error('Error deleting group:', error);
    throw error;
  }
}

/**
 * Actualizar información del grupo (solo desde el parent)
 */
export async function updateGroupInfo(
  groupId: string,
  userId: string,
  updates: {
    group_name?: string;
    group_description?: string;
  }
) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase
      .from('codex_items')
      .update(updates)
      .eq('group_id', groupId)
      .eq('is_group_parent', true)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating group info:', error);
    throw error;
  }
}

/**
 * Función auxiliar para actualizar el total_parts del grupo
 */
async function updateGroupTotalParts(groupId: string) {
  try {
    // Contar todos los items del grupo (incluyendo parent)
    const { count, error: countError } = await supabase
      .from('codex_items')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId);

    if (countError) throw countError;

    // Actualizar el parent con el total actual
    const { error: updateError } = await supabase
      .from('codex_items')
      .update({ total_parts: count })
      .eq('group_id', groupId)
      .eq('is_group_parent', true);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error updating group total_parts:', error);
  }
}

/**
 * Obtener todos los grupos del usuario (solo parents)
 */
export async function getUserGroups(userId: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase
      .from('codex_items')
      .select('*')
      .eq('user_id', userId)
      .eq('is_group_parent', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user groups:', error);
    throw error;
  }
}

/**
 * Create digitalstorage bucket if it doesn't exist (or verify it exists)
 */
export async function createCodexBucket() {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      return
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'digitalstorage')
    
    if (bucketExists) {
      console.log('digitalstorage bucket already exists')
    } else {
      console.warn('digitalstorage bucket not found. Please create it manually in Supabase dashboard.')
    }
  } catch (error) {
    console.error('Error checking digitalstorage bucket:', error)
  }
}

// Public Knowledge: documentos públicos (pk_documents)
export interface PublicKnowledgeDocument {
  id: string;
  title: string;
  source_url?: string | null;
  file_sha256: string;
  mimetype?: string | null;
  language?: string | null;
  pages?: number | null;
  version?: number | null;
  tags?: string[] | null;
  status?: 'queued' | 'processed' | 'failed' | string | null;
  notes?: string | null;
  created_at?: string | null;
}

export async function getPublicKnowledgeDocuments(limit = 24): Promise<PublicKnowledgeDocument[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  const { data, error } = await supabase
    .from('pk_documents')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as PublicKnowledgeDocument[];
}

// Helpers para Knowledge (Vizta policies & examples)
export async function getLatestPkDocumentByTag(tag: string): Promise<PublicKnowledgeDocument | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const { data, error } = await supabase
    .from('pk_documents')
    .select('*')
    .contains('tags', [tag] as any)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  return (data && data[0]) ? (data[0] as PublicKnowledgeDocument) : null;
}

export async function getStorageSignedUrl(path: string, expiresInSec = 60): Promise<string | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const { data, error } = await supabase.storage
    .from('digitalstorage')
    .createSignedUrl(path, expiresInSec);
  if (error) return null;
  return data?.signedUrl || null;
}

export async function downloadViztaPoliciesMd(): Promise<string | null> {
  try {
    const doc = await getLatestPkDocumentByTag('vizta_policies');
    if (!doc) return null;
    const path = `pk/${doc.file_sha256}.md`;
    const url = await getStorageSignedUrl(path, 120);
    if (!url) return null;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function saveViztaPoliciesMd(content: string): Promise<PublicKnowledgeDocument | null> {
  const file = new File([content], 'vizta_policies.md', { type: 'text/markdown' });
  return await uploadPublicKnowledgeDocument({
    file,
    title: 'Vizta: Prompt y Tool Calling',
    tags: ['vizta', 'policies', 'vizta_policies'],
    notes: 'Editor Knowledge: Vizta policies (Markdown)'
  });
}

export type ViztaExample = {
  user: string;
  assistant: string;
  tags?: string[];
  notes?: string;
};

export async function getViztaExamples(): Promise<ViztaExample[]> {
  try {
    const doc = await getLatestPkDocumentByTag('vizta_examples');
    if (!doc) return [];
    const path = `pk/${doc.file_sha256}.json`;
    const url = await getStorageSignedUrl(path, 120);
    if (!url) return [];
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? (data as ViztaExample[]) : [];
  } catch {
    return [];
  }
}

export async function saveViztaExamples(examples: ViztaExample[]): Promise<PublicKnowledgeDocument | null> {
  const blob = new Blob([JSON.stringify(examples, null, 2)], { type: 'application/json' });
  const file = new File([blob], 'vizta_examples.json', { type: 'application/json' });
  return await uploadPublicKnowledgeDocument({
    file,
    title: 'Vizta: Examples',
    tags: ['vizta', 'examples', 'vizta_examples'],
    notes: 'Editor Knowledge: Vizta examples (JSON)'
  });
}

/**
 * Subir documento público a storage y registrar en pk_documents
 */
export async function uploadPublicKnowledgeDocument(params: {
  file: File;
  title: string;
  tags?: string[];
  notes?: string;
  source_url?: string;
}): Promise<PublicKnowledgeDocument | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  // 1) Calcular hash (sha256) del archivo para evitar duplicados
  const buffer = await params.file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const file_sha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const ext = params.file.name.split('.').pop() || 'bin';
  const path = `pk/${file_sha256}.${ext}`;

  // 2) Subir a storage (bucket: digitalstorage)
  const { error: upErr } = await supabase.storage
    .from('digitalstorage')
    .upload(path, new Blob([buffer], { type: params.file.type }), { upsert: true });
  if (upErr && upErr.message && !/The resource already exists/i.test(upErr.message)) throw upErr;

  // 3) Insertar/actualizar fila en pk_documents
  const payload = {
    title: params.title,
    source_url: params.source_url || null,
    file_sha256,
    mimetype: params.file.type || null,
    language: null,
    pages: null,
    version: 1,
    tags: params.tags || [],
    status: 'queued',
    notes: params.notes || null
  };

  const { data, error } = await supabase
    .from('pk_documents')
    .upsert(payload, { onConflict: 'file_sha256' })
    .select('*')
    .single();
  if (error) throw error;
  return data as PublicKnowledgeDocument;
}

/**
 * Obtener las últimas 10 noticias de la tabla news
 */
export async function getLatestNews() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  
  console.log('🔍 getLatestNews: Iniciando consulta...');
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('fecha', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('❌ getLatestNews: Error en consulta:', error);
    throw error;
  }
  
  console.log('📊 getLatestNews: Datos raw de BD:', data?.[0]);
  
  // Función para limpiar HTML y fragmentos de código
  const cleanText = (text: string) => {
    if (!text) return '';
    return text
      .replace(/<[^>]*>/g, '') // Eliminar etiquetas HTML
      .replace(/\[&#8230;\]/g, '...') // Reemplazar entidades HTML
      .replace(/The post .* appeared first on .*/g, '') // Eliminar texto de "appeared first"
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim();
  };
  
  // Mapear a NewsItem
  const mappedData = (data || []).map((item: any) => ({
    id: item.id,
    title: item.titulo,
    source: item.fuente,
    date: item.fecha,
    excerpt: cleanText(item.resumen),
    category: item.categoria,
    keywords: item.keywords || [],
    url: item.url
  }));
  
  console.log('🗺️ getLatestNews: Datos mapeados:', mappedData?.[0]);
  
  return mappedData;
}

/**
 * Obtiene los sondeos de un usuario desde la tabla 'sondeos'
 * @param userEmail Email del usuario
 * @returns Array de sondeos
 */
export async function getSondeosByUser(userEmail: string) {
  const { data, error } = await supabase
    .from('sondeos')
    .select('*')
    .eq('email_usuario', userEmail)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Obtener tweets de trending topics de las últimas 24 horas
 * @param limit Número máximo de tweets a obtener (default: 20)
 * @param categoria Filtrar por categoría específica (opcional)
 * @returns Array de tweets con datos limpios
 */
export async function getTrendingTweets(limit: number = 20, categoria?: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  
  try {
    let query = supabase
      .from('trending_tweets')
      .select('*')
      .gte('fecha_captura', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('fecha_captura', { ascending: false })
      .limit(limit);
    
    // Filtrar por categoría si se especifica
    if (categoria) {
      query = query.eq('categoria', categoria);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Función para limpiar texto de tweets (similar a cleanText de noticias)
    const cleanTweetText = (text: string) => {
      if (!text) return '';
      return text
        .replace(/https?:\/\/[^\s]+/g, '') // Eliminar URLs
        .replace(/@\w+/g, (match) => match) // Mantener mentions pero limpiar
        .replace(/#\w+/g, (match) => match) // Mantener hashtags pero limpiar
        .replace(/\s+/g, ' ') // Normalizar espacios
        .trim();
    };
    
    // Mapear y limpiar datos
    return (data || []).map((tweet: any) => ({
      id: tweet.id,
      trend_original: tweet.trend_original,
      trend_clean: tweet.trend_clean,
      categoria: tweet.categoria,
      tweet_id: tweet.tweet_id,
      usuario: tweet.usuario,
      fecha_tweet: tweet.fecha_tweet,
      texto: cleanTweetText(tweet.texto),
      enlace: tweet.enlace,
      likes: tweet.likes || 0,
      retweets: tweet.retweets || 0,
      replies: tweet.replies || 0,
      verified: tweet.verified || false,
      location: tweet.location,
      fecha_captura: tweet.fecha_captura,
      raw_data: tweet.raw_data,
      created_at: tweet.created_at,
      updated_at: tweet.updated_at,
      // Incluir campos de análisis de sentimiento e intención si existen
      sentimiento: tweet.sentimiento || null,
      intencion_comunicativa: tweet.intencion_comunicativa || null,
      score_sentimiento: tweet.score_sentimiento || null,
      propagacion_viral: tweet.propagacion_viral || null
    }));
  } catch (error) {
    console.error('Error fetching trending tweets:', error);
    return [];
  }
}

/**
 * Obtener estadísticas de tweets por categoría
 * @returns Objeto con conteos por categoría
 */
export async function getTweetStatsByCategory() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return {};
  
  try {
    const { data, error } = await supabase
      .from('trending_tweets')
      .select('categoria')
      .gte('fecha_captura', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    if (error) throw error;
    
    // Contar por categoría
    const stats = (data || []).reduce((acc: any, tweet: any) => {
      const cat = tweet.categoria || 'General';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    
    return stats;
  } catch (error) {
    console.error('Error fetching tweet stats:', error);
    return {};
  }
}

// ===================================================================
// GESTIÓN DE PROYECTOS Y DECISIONES EN CAPAS
// ===================================================================

/**
 * Tipos para el sistema de proyectos
 */
export interface Project {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  tags: string[];
  start_date?: string;
  target_date?: string;
  completed_date?: string;
  visibility: 'private' | 'team' | 'public';
  collaborators?: string[];
  created_at: string;
  updated_at: string;
}

export interface ProjectDecision {
  id: string;
  project_id: string;
  title: string;
  description: string;
  decision_type: 'enfoque' | 'alcance' | 'configuracion';
  sequence_number: number;
  parent_decision_id?: string | null;
  // Campos específicos para el sistema de capas
  change_description?: string | null;
  objective?: string | null;
  next_steps?: string | null;
  deadline?: string | null;
  // Campos específicos por tipo de decisión
  focus_area?: string | null;           // Para enfoque
  focus_context?: string | null;        // Para enfoque
  geographic_scope?: string | null;     // Para alcance
  monetary_scope?: string | null;       // Para alcance
  time_period_start?: string | null;    // Para alcance
  time_period_end?: string | null;      // Para alcance
  target_entities?: string | null;      // Para alcance
  scope_limitations?: string | null;    // Para alcance
  output_format?: string[] | null;      // Para configuración (array para selección múltiple)
  methodology?: string | null;          // Para configuración
  data_sources?: string | null;         // Para configuración
  search_locations?: string | null;     // Para configuración
  tools_required?: string | null;       // Para configuración
  references?: string[] | null;         // Para configuración (array de links)
  // Campos existentes mantenidos por compatibilidad
  rationale?: string | null;
  expected_impact?: string | null;
  resources_required?: string | null;
  risks_identified: string[] | null;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  stakeholders?: string[] | null;
  tags: string[] | null;
  attachments: any[] | null;
  decision_references: any[] | null;
  success_metrics: Record<string, any> | null;
  implementation_date?: string | null;
  actual_impact?: string | null;
  lessons_learned?: string | null;
  created_at: string;
  updated_at: string;
}

// ===================================================================
// CRUD DE PROYECTOS
// ===================================================================

/**
 * Crear un nuevo proyecto
 */
export async function createProject(projectData: {
  title: string;
  description?: string;
  status?: Project['status'];
  priority?: Project['priority'];
  category?: string;
  tags?: string[];
  start_date?: string;
  target_date?: string;
  visibility?: Project['visibility'];
}): Promise<Project> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const projectToCreate = {
      user_id: user.id,
      title: projectData.title,
      description: projectData.description || null,
      status: projectData.status || 'active',
      priority: projectData.priority || 'medium',
      category: projectData.category || null,
      tags: projectData.tags || [],
      start_date: projectData.start_date || null,
      target_date: projectData.target_date || null,
      visibility: projectData.visibility || 'private',
      collaborators: []
    };

    const { data, error } = await supabase
      .from('projects')
      .insert(projectToCreate)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}

/**
 * Obtener proyectos del usuario autenticado
 */
export async function getUserProjects(): Promise<Project[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user projects:', error);
    return [];
  }
}

/**
 * Obtener un proyecto específico por ID
 */
export async function getProjectById(projectId: string): Promise<Project | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
}

/**
 * Actualizar un proyecto
 */
export async function updateProject(projectId: string, updates: Partial<Project>): Promise<Project> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}

/**
 * Eliminar un proyecto
 */
export async function deleteProject(projectId: string): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

// ===================================================================
// CRUD DE DECISIONES EN CAPAS
// ===================================================================

/**
 * Crear una nueva decisión con soporte para campos específicos por tipo
 */
export async function createProjectDecision(
  projectId: string,
  decisionData: {
    title: string;
    description: string;
    decision_type: 'enfoque' | 'alcance' | 'configuracion';
    parent_decision_id?: string;
    // Campos generales
    change_description?: string;
    objective?: string;
    next_steps?: string;
    deadline?: string;
    urgency?: ProjectDecision['urgency'];
    tags?: string[];
    // Campos específicos para enfoque
    focus_area?: string;
    focus_context?: string;
    // Campos específicos para alcance
    geographic_scope?: string;
    monetary_scope?: string;
    time_period_start?: string;
    time_period_end?: string;
    target_entities?: string;
    scope_limitations?: string;
    // Campos específicos para configuración
    output_format?: string[];
    methodology?: string;
    data_sources?: string;
    search_locations?: string;
    tools_required?: string;
    references?: string[];
  }
): Promise<ProjectDecision> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    // Obtener el siguiente número de secuencia
    const { data: sequenceData, error: sequenceError } = await supabase
      .rpc('get_next_decision_sequence', { project_uuid: projectId });

    if (sequenceError) throw sequenceError;

    const decisionToCreate = {
      project_id: projectId,
      title: decisionData.title,
      description: decisionData.description,
      decision_type: decisionData.decision_type,
      sequence_number: sequenceData || 1,
      parent_decision_id: decisionData.parent_decision_id || null,
      // Campos generales
      change_description: decisionData.change_description || null,
      objective: decisionData.objective || null,
      next_steps: decisionData.next_steps || null,
      deadline: decisionData.deadline || null,
      urgency: decisionData.urgency || 'medium',
      tags: decisionData.tags || [],
      // Campos específicos para enfoque
      focus_area: decisionData.focus_area || null,
      focus_context: decisionData.focus_context || null,
      // Campos específicos para alcance
      geographic_scope: decisionData.geographic_scope || null,
      monetary_scope: decisionData.monetary_scope || null,
      time_period_start: decisionData.time_period_start || null,
      time_period_end: decisionData.time_period_end || null,
      target_entities: decisionData.target_entities || null,
      scope_limitations: decisionData.scope_limitations || null,
      // Campos específicos para configuración
      output_format: decisionData.output_format || null,
      methodology: decisionData.methodology || null,
      data_sources: decisionData.data_sources || null,
      search_locations: decisionData.search_locations || null,
      tools_required: decisionData.tools_required || null,
      references: decisionData.references || null,
      // Campos de compatibilidad
      rationale: null,
      expected_impact: null,
      resources_required: null,
      risks_identified: [],
      stakeholders: [],
      attachments: [],
      decision_references: [],
      success_metrics: {},
      implementation_date: null,
      actual_impact: null,
      lessons_learned: null
    };

    const { data, error } = await supabase
      .from('project_decisions')
      .insert(decisionToCreate)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating project decision:', error);
    throw error;
  }
}

/**
 * Obtener decisiones de un proyecto con soporte para jerarquía
 */
export async function getProjectDecisions(projectId: string): Promise<ProjectDecision[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];

  try {
    const { data, error } = await supabase
      .from('project_decisions')
      .select('*')
      .eq('project_id', projectId)
      .order('sequence_number', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching project decisions:', error);
    return [];
  }
}

/**
 * Actualizar una decisión
 */
export async function updateProjectDecision(
  decisionId: string,
  updates: Partial<ProjectDecision>
): Promise<ProjectDecision> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase
      .from('project_decisions')
      .update(updates)
      .eq('id', decisionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating project decision:', error);
    throw error;
  }
}

/**
 * Eliminar una decisión
 */
export async function deleteProjectDecision(decisionId: string): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('project_decisions')
      .delete()
      .eq('id', decisionId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting project decision:', error);
    throw error;
  }
}

/**
 * Obtener estadísticas de un proyecto
 */
export async function getProjectStats(projectId: string): Promise<any> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return { total: 0, by_type: {}, by_urgency: {} };

  try {
    const { data, error } = await supabase
      .from('project_decisions')
      .select('decision_type, urgency')
      .eq('project_id', projectId);

    if (error) throw error;

    // Calculate statistics
    const stats = {
      total: data?.length || 0,
      by_type: {} as Record<string, number>,
      by_urgency: {} as Record<string, number>
    };

    data?.forEach((decision: any) => {
      // Count by type
      const type = decision.decision_type || 'enfoque';
      stats.by_type[type] = (stats.by_type[type] || 0) + 1;

      // Count by urgency
      const urgency = decision.urgency || 'medium';
      stats.by_urgency[urgency] = (stats.by_urgency[urgency] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Error fetching project stats:', error);
    return { total: 0, by_type: {}, by_urgency: {} };
  }
}

/**
 * Obtener decisiones hijas de una decisión padre
 */
export async function getChildDecisions(parentDecisionId: string): Promise<ProjectDecision[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];

  try {
    const { data, error } = await supabase
      .from('project_decisions')
      .select('*')
      .eq('parent_decision_id', parentDecisionId)
      .order('sequence_number', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching child decisions:', error);
    return [];
  }
}

/**
 * Obtener decisiones raíz (sin padre) de un proyecto
 */
export async function getRootDecisions(projectId: string): Promise<ProjectDecision[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];

  try {
    const { data, error } = await supabase
      .from('project_decisions')
      .select('*')
      .eq('project_id', projectId)
      .is('parent_decision_id', null)
      .order('sequence_number', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching root decisions:', error);
    return [];
  }
}

/**
 * Mover una decisión como hija de otra
 */
export async function moveDecisionAsChild(
  decisionId: string,
  newParentId: string
): Promise<ProjectDecision> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase
      .from('project_decisions')
      .update({ parent_decision_id: newParentId })
      .eq('id', decisionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error moving decision as child:', error);
    throw error;
  }
}

/**
 * Promover una decisión a raíz (eliminar padre)
 */
export async function promoteDecisionToRoot(decisionId: string): Promise<ProjectDecision> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase
      .from('project_decisions')
      .update({ parent_decision_id: null })
      .eq('id', decisionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error promoting decision to root:', error);
    throw error;
  }
}

export async function getLinksForParentItem(parentItemId: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  // Get links rows with child item and basic fields from child item
  const { data, error } = await supabase
    .from('links')
    .select(`
      id,
      notes,
      item_id,
      parent_item_id,
      child:codex_items!links_item_id_fkey (
        id, titulo, descripcion, source_url, created_at, original_type, tipo, audio_transcription, transcripcion
      )
    `)
    .eq('parent_item_id', parentItemId);
  if (error) throw error;
  return data || [];
}

// ===================================================================
// SISTEMA DE MAPAS DE SITIOS Y AGENTES DE EXTRACCIÓN
// ===================================================================

/**
 * Tipos para el sistema de mapas y agentes
 */
export interface SiteMap {
  id: string;
  user_id: string;
  site_name: string;
  base_url: string;
  exploration_goal?: string;
  site_structure: any; // JSONB con la estructura del sitio
  navigation_summary: string; // Resumen en markdown
  exploration_date: string;
  last_updated: string;
  status: 'active' | 'outdated' | 'archived';
}

export interface SiteAgent {
  id: string;
  user_id: string;
  site_map_id: string;
  agent_name: string;
  extraction_target: string; // "extrae esto"
  extraction_config: any; // JSONB con configuración específica
  status: 'active' | 'paused' | 'archived';
  created_at: string;
  last_execution?: string;
  dynamic_table_name?: string; // Dynamic table name for data storage
  data_description?: string; // Description of the data being extracted
  database_config?: { // Database configuration for dynamic tables
    enabled: boolean;
    table_name?: string;
    data_description?: string;
  };
  site_map?: SiteMap; // Relación para queries expandidas
}

export interface AgentExtraction {
  id: string;
  agent_id: string;
  extracted_data: any; // JSONB con datos extraídos
  extraction_summary: string;
  success: boolean;
  error_message?: string;
  executed_at: string;
  execution_duration_ms?: number;
  data_size_bytes?: number;
}

// ===================================================================
// CRUD DE MAPAS DE SITIOS
// ===================================================================

/**
 * Guardar un nuevo mapa de sitio después de exploración exitosa
 */
export async function saveSiteMap(mapData: {
  site_name: string;
  base_url: string;
  exploration_goal?: string;
  site_structure: any;
  navigation_summary: string;
}): Promise<SiteMap> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const mapToCreate = {
      user_id: user.id,
      site_name: mapData.site_name,
      base_url: mapData.base_url,
      exploration_goal: mapData.exploration_goal || null,
      site_structure: mapData.site_structure,
      navigation_summary: mapData.navigation_summary,
      status: 'active'
    };

    const { data, error } = await supabase
      .from('site_maps')
      .insert(mapToCreate)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving site map:', error);
    throw error;
  }
}

/**
 * Obtener mapas de sitios del usuario autenticado
 */
export async function getUserSiteMaps(): Promise<SiteMap[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('site_maps')
      .select('*')
      .eq('user_id', user.id)
      .order('exploration_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user site maps:', error);
    return [];
  }
}

/**
 * Obtener un mapa de sitio específico por ID
 */
export async function getSiteMapById(mapId: string): Promise<SiteMap | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  try {
    const { data, error } = await supabase
      .from('site_maps')
      .select('*')
      .eq('id', mapId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching site map:', error);
    return null;
  }
}

/**
 * Actualizar un mapa de sitio (por ejemplo, después de re-explorar)
 */
export async function updateSiteMap(mapId: string, updates: {
  site_structure?: any;
  navigation_summary?: string;
  exploration_goal?: string;
  status?: SiteMap['status'];
}): Promise<SiteMap> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    const updateData = {
      ...updates,
      last_updated: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('site_maps')
      .update(updateData)
      .eq('id', mapId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating site map:', error);
    throw error;
  }
}

/**
 * Eliminar un mapa de sitio
 */
export async function deleteSiteMap(mapId: string): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('site_maps')
      .delete()
      .eq('id', mapId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting site map:', error);
    throw error;
  }
}

// ===================================================================
// CRUD DE AGENTES DE EXTRACCIÓN
// ===================================================================

/**
 * Crear un nuevo agente de extracción desde un mapa de sitio
 */
export async function createSiteAgent(agentData: {
  site_map_id: string;
  agent_name: string;
  extraction_target: string;
  extraction_config?: any;
  dynamic_table_name?: string;
  data_description?: string;
}): Promise<SiteAgent> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Limpiar nombre de tabla dinámica si se proporciona
    let cleanTableName = null;
    if (agentData.dynamic_table_name && agentData.dynamic_table_name.trim()) {
      cleanTableName = agentData.dynamic_table_name
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/^[^a-z]/, 'table_')
        .substring(0, 63);
    }

    const agentToCreate = {
      user_id: user.id,
      site_map_id: agentData.site_map_id,
      agent_name: agentData.agent_name,
      extraction_target: agentData.extraction_target,
      extraction_config: agentData.extraction_config || {},
      dynamic_table_name: cleanTableName,
      data_description: agentData.data_description || null,
      status: 'active'
    };

    const { data, error } = await supabase
      .from('site_agents')
      .insert(agentToCreate)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating site agent:', error);
    throw error;
  }
}

/**
 * Obtener agentes del usuario con información del mapa asociado
 */
export async function getUserAgents(): Promise<SiteAgent[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('site_agents')
      .select(`
        *,
        site_map:site_maps (
          id,
          site_name,
          base_url,
          site_structure,
          navigation_summary
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user agents:', error);
    return [];
  }
}

/**
 * Obtener un agente específico por ID
 */
export async function getAgentById(agentId: string): Promise<SiteAgent | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  try {
    const { data, error } = await supabase
      .from('site_agents')
      .select(`
        *,
        site_map:site_maps (
          id,
          site_name,
          base_url,
          site_structure,
          navigation_summary
        )
      `)
      .eq('id', agentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching agent:', error);
    return null;
  }
}

/**
 * Actualizar un agente de extracción
 */
export async function updateSiteAgent(agentId: string, updates: Partial<SiteAgent>): Promise<SiteAgent> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase
      .from('site_agents')
      .update(updates)
      .eq('id', agentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating site agent:', error);
    throw error;
  }
}

/**
 * Generar código de extracción usando IA (GPT-5)
 */
export async function generateAgentCode(params: {
  instructions: string;
  siteMap: {
    site_name: string;
    base_url: string;
    structure: any;
    navigation_summary: string;
  };
  existingAgent?: {
    name: string;
    target: string;
    config: any;
  } | null;
}): Promise<{
  success: boolean;
  data?: {
    extractionLogic: string;
    selectors: string[];
    workflow: string[];
    confidence: number;
    reasoning: string;
    suggestedName?: string;
    suggestedTarget?: string;
    suggestedDescription?: string;
  };
  error?: string;
}> {
  try {
    const response = await fetch(`${EXTRACTORW_API_URL}/agents/generate-agent-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error generating agent code:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al generar código'
    };
  }
}

/**
 * Eliminar un agente de extracción
 */
export async function deleteSiteAgent(agentId: string): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('site_agents')
      .delete()
      .eq('id', agentId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting site agent:', error);
    throw error;
  }
}

// ===================================================================
// EJECUCIÓN Y GESTIÓN DE EXTRACCIONES
// ===================================================================

/**
 * Ejecutar extracción de un agente específico
 */
export async function executeAgentExtraction(agentId: string): Promise<AgentExtraction> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  const startTime = Date.now();
  let usageData = {
    operation_type: 'agent_extraction',
    operation_details: { agent_id: agentId } as any,
    start_time: new Date().toISOString(),
    tokens_input: 0,
    tokens_output: 0,
    cost_usd: 0,
    ai_model_used: null as string | null,
    success: false,
    error_message: null as string | null
  };

  try {
    // Obtener agente con información del mapa
    const agent = await getAgentById(agentId);
    if (!agent || !agent.site_map) {
      throw new Error('Agent or site map not found');
    }

    usageData.operation_details = {
      agent_id: agentId,
      agent_name: agent.agent_name,
      site_url: agent.site_map.base_url,
      extraction_target: agent.extraction_target
    };

    // Decidir estrategia de ejecución según configuración generada
    let response: Response;
    const hasGeneratedPlan = Boolean(
      agent.extraction_config && (agent as any).extraction_config.generated &&
      Array.isArray((agent as any).extraction_config.selectors)
    );

    if (hasGeneratedPlan) {
      // Ejecutar usando motor de agentes basado en selectores
      response = await fetch(`${EXTRACTORW_API_URL}/agents/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: agent.site_map.base_url,
          config: agent.extraction_config,
          site_structure: agent.site_map.site_structure,
          maxItems: 30
        })
      });
    } else {
      // Fallback: usar WebAgent heurístico
      response = await fetch(`${EXTRACTORW_API_URL}/webagent/extract`.replace('/api/webagent', '/api/webagent'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: agent.site_map.base_url,
          extraction_target: agent.extraction_target,
          site_structure: agent.site_map.site_structure,
          extraction_config: agent.extraction_config,
          maxSteps: 8
        })
      });
    }

    // Manejo robusto de errores (evitar parsear HTML de error)
    const rawText = await response.text();
    let extractionResult: any = {};
    try {
      extractionResult = rawText ? JSON.parse(rawText) : {};
    } catch (e) {
      const errorMsg = `ExtractorW respondió ${response.status}: ${rawText.slice(0, 200)}`;
      usageData.error_message = errorMsg;
      throw new Error(errorMsg);
    }

    // Extraer métricas de uso de AI si están disponibles
    if (extractionResult.usage) {
      usageData.tokens_input = extractionResult.usage.tokens_input || 0;
      usageData.tokens_output = extractionResult.usage.tokens_output || 0;
      usageData.cost_usd = extractionResult.usage.cost_usd || 0;
      usageData.ai_model_used = extractionResult.usage.model || null;
    }

    usageData.success = extractionResult.success || response.ok;

    // Guardar resultado de la extracción
    const extractionData = {
      agent_id: agentId,
      extracted_data: extractionResult.data || {},
      extraction_summary: extractionResult.summary || 'Extracción completada',
      success: extractionResult.success || response.ok,
      error_message: extractionResult.error || (!response.ok ? 'Error en la extracción' : null),
      execution_duration_ms: Date.now() - startTime,
      data_size_bytes: JSON.stringify(extractionResult.data || {}).length
    };

    const { data, error } = await supabase
      .from('agent_extractions')
      .insert(extractionData)
      .select()
      .single();

    if (error) throw error;

    // Actualizar fecha de última ejecución del agente
    await updateSiteAgent(agentId, { 
      last_execution: new Date().toISOString() 
    });

    // Registrar usage log exitoso
    usageData.success = true;
    await logUsage({
      ...usageData,
      end_time: new Date().toISOString(),
      duration_ms: Date.now() - startTime
    });

    return data;
  } catch (error) {
    console.error('Error executing agent extraction:', error);
    
    // Registrar usage log con error
    usageData.success = false;
    usageData.error_message = error instanceof Error ? error.message : 'Error desconocido';
    await logUsage({
      ...usageData,
      end_time: new Date().toISOString(),
      duration_ms: Date.now() - startTime
    }).catch(logError => {
      console.error('Error logging usage:', logError);
    });
    
    // Guardar error en la base de datos también
    const errorData = {
      agent_id: agentId,
      extracted_data: {},
      extraction_summary: 'Error durante la extracción',
      success: false,
      error_message: error instanceof Error ? error.message : 'Error desconocido',
      execution_duration_ms: Date.now() - startTime,
      data_size_bytes: 0
    };

    const { data } = await supabase
      .from('agent_extractions')
      .insert(errorData)
      .select()
      .single();

    return data || {
      ...errorData,
      id: '',
      executed_at: new Date().toISOString()
    } as AgentExtraction;
  }
}

/**
 * Obtener historial de extracciones de un agente
 */
export async function getAgentExtractions(agentId: string): Promise<AgentExtraction[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];

  try {
    const { data, error } = await supabase
      .from('agent_extractions')
      .select('*')
      .eq('agent_id', agentId)
      .order('executed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching agent extractions:', error);
    return [];
  }
}

/**
 * Obtener todas las extracciones recientes del usuario
 */
export async function getUserRecentExtractions(limit: number = 20): Promise<AgentExtraction[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('agent_extractions')
      .select(`
        *,
        agent:site_agents (
          agent_name,
          site_map:site_maps (
            site_name
          )
        )
      `)
      .eq('agent.user_id', user.id)
      .order('executed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user recent extractions:', error);
    return [];
  }
}

// ===================================================================
// GESTIÓN DE TABLAS DINÁMICAS POR AGENTE
// ===================================================================

/**
 * Obtener datos de la tabla dinámica de un agente específico (Nueva implementación)
 */
export async function getAgentDynamicData(
  agentId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ data: any[], total: number }> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { data: [], total: 0 };
  }

  try {
    // Get agent info to determine table name
    const { data: agent, error: agentError } = await supabase
      .from('site_agents')
      .select('id, agent_name') // Only select existing columns for now
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return { data: [], total: 0 };
    }

    // For now, return empty data since database_config feature is not fully implemented
    console.log('Database config feature not yet implemented for agent:', agent.agent_name);
    return { data: [], total: 0 };

    const tableName = `agent_${agent.database_config.table_name || agent.dynamic_table_name}`;

    // Get total count
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      if (countError.code === 'PGRST116') {
        // Table doesn't exist
        return { data: [], total: 0 };
      }
      throw countError;
    }

    // Get paginated data
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('extraction_timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0
    };
  } catch (error) {
    console.error('Error fetching agent dynamic data:', error);
    return { data: [], total: 0 };
  }
}

/**
 * Guardar datos de extracción en la tabla dinámica del agente (Nueva implementación)
 */
export async function saveToAgentDynamicTable(
  agentId: string,
  extractionId: string,
  extractedData: any,
  rawData: any = {},
  metadata: any = {}
): Promise<string | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    // Get agent info to determine table name
    const { data: agent, error: agentError } = await supabase
      .from('site_agents')
      .select('id, agent_name') // Only select existing columns for now
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      console.warn('Agent not found');
      return null;
    }

    // For now, return null since database_config feature is not fully implemented
    console.log('Database config feature not yet implemented for agent:', agent.agent_name);
    return null;

    const tableName = `agent_${agent.database_config.table_name || agent.dynamic_table_name}`;

    // Prepare data for insertion into the public database structure
    const dataToInsert = Array.isArray(extractedData) ? extractedData : [extractedData];
    const insertRows = dataToInsert.map((item: any, index: number) => ({
      text: item.text || item.content || JSON.stringify(item),
      href: item.href || item.url || null,
      src: item.src || item.image || null,
      selector: item.selector || 'api_insertion',
      tag_name: item.tag_name || item.type || 'data',
      position: index,
      agent_name: agent.agent_name,
      user_id: extractionId, // Use extraction ID as user identifier
      extraction_timestamp: new Date().toISOString(),
      metadata: {
        extraction_id: extractionId,
        raw_data: rawData,
        metadata: metadata,
        agent_id: agentId
      }
    }));

    // Insert data
    const { data, error } = await supabase
      .from(tableName)
      .insert(insertRows)
      .select();

    if (error) throw error;

    console.log(`Successfully saved ${insertRows.length} items to ${tableName}`);
    return extractionId;
  } catch (error) {
    console.error('Error saving to agent dynamic table:', error);
    return null;
  }
}

/**
 * Verificar si un agente tiene tabla dinámica creada (Nueva implementación simplificada)
 */
export async function checkAgentDynamicTable(agentId: string): Promise<{
  hasTable: boolean;
  tableName?: string;
  totalRecords?: number;
  lastInsertion?: string;
}> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { hasTable: false };
  }

  try {
    // Get agent info to determine table name
    const { data: agent, error: agentError } = await supabase
      .from('site_agents')
      .select('id, agent_name') // Only select existing columns for now
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return { hasTable: false };
    }

    // For now, return false since database_config feature is not fully implemented
    console.log('Database config feature not yet implemented for agent:', agent.agent_name);
    return { hasTable: false };

    const tableName = `agent_${agent.database_config.table_name || agent.dynamic_table_name}`;

    // Check if table exists by trying to query it
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      if (error.code === 'PGRST116') {
        // Table doesn't exist
        return { hasTable: false };
      }
      throw error;
    }

    // Get last insertion time
    const { data: lastRecord, error: lastError } = await supabase
      .from(tableName)
      .select('extraction_timestamp')
      .order('extraction_timestamp', { ascending: false })
      .limit(1)
      .single();

    return {
      hasTable: true,
      tableName: tableName,
      totalRecords: count || 0,
      lastInsertion: lastRecord?.extraction_timestamp || null
    };
  } catch (error) {
    console.error('Error checking agent dynamic table:', error);
    return { hasTable: false };
  }
}

/**
 * Obtener lista de tablas dinámicas del usuario (Nueva implementación)
 */
export async function getUserDynamicTables(): Promise<Array<{
  id: string;
  agentId: string;
  tableName: string;
  description: string;
  totalRecords: number;
  lastInsertion: string;
  agentName?: string;
}>> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get agents for the current user (database feature not yet implemented)
    const { data: agents, error } = await supabase
      .from('site_agents')
      .select('id, agent_name') // Only select existing columns for now
      .eq('user_id', user.id);

    if (error) throw error;

    // For now, return empty array since database_config feature is not fully implemented
    console.log('Database config feature not yet implemented, returning empty results');
    return [];

    const results = [];

    for (const agent of agents || []) {
      if (!agent.database_config?.enabled) continue;

      const tableName = `agent_${agent.database_config.table_name || agent.dynamic_table_name}`;

      try {
        // Get table statistics
        const { count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        // Get last insertion
        const { data: lastRecord } = await supabase
          .from(tableName)
          .select('extraction_timestamp')
          .order('extraction_timestamp', { ascending: false })
          .limit(1)
          .single();

        results.push({
          id: agent.id,
          agentId: agent.id,
          tableName: tableName,
          description: agent.database_config.data_description || agent.data_description || '',
          totalRecords: count || 0,
          lastInsertion: lastRecord?.extraction_timestamp || '',
          agentName: agent.agent_name
        });
      } catch (tableError) {
        // Table might not exist yet
        console.warn(`Table ${tableName} not accessible:`, tableError);
        results.push({
          id: agent.id,
          agentId: agent.id,
          tableName: tableName,
          description: agent.database_config.data_description || agent.data_description || '',
          totalRecords: 0,
          lastInsertion: '',
          agentName: agent.agent_name
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error fetching user dynamic tables:', error);
    return [];
  }
}

// ===================================================================
// USAGE LOGGING SYSTEM
// ===================================================================

interface UsageLogData {
  operation_type: string;
  operation_details: any;
  start_time: string;
  end_time: string;
  duration_ms: number;
  tokens_input?: number;
  tokens_output?: number;
  cost_usd?: number;
  ai_model_used?: string | null;
  success: boolean;
  error_message?: string | null;
}

/**
 * Registrar uso del sistema para métricas y costos
 */
export async function logUsage(usageData: UsageLogData): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase not configured, skipping usage log');
    return;
  }

  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('usage_logs')
      .insert({
        user_id: currentUser?.id,
        user_email: currentUser?.email || 'unknown@example.com',
        operation: usageData.operation_type,
        credits_consumed: 0, // No usamos créditos para agentes
        tokens_consumed: (usageData.tokens_input || 0) + (usageData.tokens_output || 0),
        dollars_consumed: usageData.cost_usd || 0,
        response_time: usageData.duration_ms,
        processing_details: {
          operation_type: usageData.operation_type,
          operation_details: usageData.operation_details,
          start_time: usageData.start_time,
          end_time: usageData.end_time,
          tokens_input: usageData.tokens_input || 0,
          tokens_output: usageData.tokens_output || 0,
          ai_model_used: usageData.ai_model_used,
          success: usageData.success,
          error_message: usageData.error_message
        },
        response_metrics: {
          success: usageData.success,
          duration_ms: usageData.duration_ms,
          tokens_total: (usageData.tokens_input || 0) + (usageData.tokens_output || 0),
          cost_breakdown: {
            tokens_input: usageData.tokens_input || 0,
            tokens_output: usageData.tokens_output || 0,
            cost_usd: usageData.cost_usd || 0
          }
        }
      });

    if (error) {
      console.error('Error saving usage log:', error);
    }
  } catch (error) {
    console.error('Error in logUsage:', error);
  }
}
