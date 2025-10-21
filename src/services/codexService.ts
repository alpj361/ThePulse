import { getCodexItemsByUser } from './supabase';

/**
 * Servicio para manejar elementos del Codex
 */
export class CodexService {
  /**
   * Obtener elementos del codex del usuario actual
   */
  static async getCodexItems(userId?: string): Promise<any[]> {
    try {
      // Si no se proporciona userId, intentar obtenerlo del localStorage
      let currentUserId = userId;
      
      if (!currentUserId) {
        // Intentar obtener del localStorage como fallback
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        currentUserId = user?.id;
      }
      
      if (!currentUserId) {
        console.warn('No hay usuario autenticado para obtener elementos del codex');
        return [];
      }

      console.log('🔍 [CodexService] Obteniendo elementos para usuario:', currentUserId);
      
      // ✨ DEBUG: Consulta directa simple para verificar
      const { supabase } = await import('./supabase');
      const { data: debugData, error: debugError } = await supabase
        .from('codex_items')
        .select('id, titulo, descripcion, tipo, created_at')
        .eq('user_id', currentUserId)
        .limit(5);
      
      console.log('🔍 [CodexService] DEBUG - Consulta directa:', {
        error: debugError,
        count: debugData?.length || 0,
        data: debugData
      });
      
      let items;
      try {
        items = await getCodexItemsByUser(currentUserId);
        console.log('📚 [CodexService] Elementos encontrados (función compleja):', items.length);
      } catch (error) {
        console.warn('⚠️ [CodexService] Función compleja falló, usando consulta simple:', error);
        // Usar la consulta simple como fallback
        items = debugData || [];
        console.log('📚 [CodexService] Elementos encontrados (consulta simple):', items.length);
      }
      
      console.log('📚 [CodexService] Primeros elementos:', items.slice(0, 2));
      
      // Mapear a formato compatible con @
      const mappedItems = items.map(item => ({
        id: item.id,
        title: item.titulo || item.title || 'Sin título',
        content: item.descripcion || item.contenido || item.content || '',
        type: item.tipo || item.type || 'documento',
        created_at: item.created_at || item.fecha,
        user_id: item.user_id
      }));
      
      console.log('✅ [CodexService] Elementos mapeados:', mappedItems.length);
      return mappedItems;
    } catch (error) {
      console.error('❌ [CodexService] Error obteniendo elementos del codex:', error);
      return [];
    }
  }

  /**
   * Buscar elementos del codex por query
   */
  static async searchCodexItems(query: string): Promise<any[]> {
    const items = await this.getCodexItems();
    
    if (!query.trim()) {
      return items.slice(0, 5);
    }

    const filtered = items.filter(item => 
      item.title?.toLowerCase().includes(query.toLowerCase()) ||
      item.content?.toLowerCase().includes(query.toLowerCase())
    );

    return filtered.slice(0, 5);
  }
}

// Exportar funciones individuales para compatibilidad
export const getCodexItems = CodexService.getCodexItems;
export const searchCodexItems = CodexService.searchCodexItems;
