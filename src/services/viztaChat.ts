import { supabase } from './supabase';
import { EXTRACTORW_API_URL } from './api';

// ===================================================================
// VIZTA CHAT SERVICE
// Servicio para conectar con el backend de Vizta Chat en ExtractorW
// ===================================================================

// Utilizar la misma lógica dinámica definida en api.ts para resolver la URL
const EXTRACTOR_W_URL = EXTRACTORW_API_URL;

// Tipos
export interface ViztaChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  toolUsed?: string;
  toolArgs?: any;
  sessionId?: string;
  requestId?: string;
  executionTime?: number;
}

export interface ViztaChatResponse {
  success?: boolean;
  response?: string | {
    agent?: string;
    message?: string;
    type?: string;
    timestamp?: string;
    c1Response?: string; // Thesys Generative UI response
    hasUIComponents?: boolean; // Indicates if UI components are present
  };
  conversationId?: string | {
    sessionId?: string;
    previousMessages?: any[];
  };
  toolUsed?: string;
  toolArgs?: any;
  toolResult?: any;
  sessionId?: string;
  requestId?: string;
  executionTime?: number;
  timestamp?: string;
  sources?: Array<{ title: string; url: string; }>;
  steps?: Array<{ step: string; description: string; }>;
  metadata?: {
    processingTime?: number;
    [key: string]: any;
  };
  error?: string;
}

export interface ScrapeData {
  id: number;
  query_original: string;
  query_clean: string;
  herramienta: string;
  categoria: string;
  tweet_id: string;
  usuario: string;
  fecha_tweet: string;
  texto: string;
  enlace: string;
  likes: number;
  retweets: number;
  replies: number;
  verified: boolean;
  sentimiento: string;
  user_id: string;
  session_id: string;
  fecha_captura: string;
  created_at: string;
}

/**
 * Obtiene el token de autenticación actual
 */
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * Envía una consulta al chat de Vizta
 */
export async function sendViztaChatQuery(
  message: string,
  sessionId?: string,
  mode: 'chat' | 'agentic' = 'chat',
  useGenerativeUI: boolean = false
): Promise<ViztaChatResponse> {
  try {
    const token = await getAuthToken();

    console.log('🤖 Enviando consulta a Vizta Chat:', message);
    console.log('📊 Generative UI:', useGenerativeUI ? 'ENABLED' : 'DISABLED');
    console.log('🔑 Token disponible:', !!token);

    // Preparar headers - en desarrollo, el backend no requiere auth
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Solo agregar Authorization si hay token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${EXTRACTOR_W_URL}/vizta-chat/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: message,
        sessionId: sessionId,
        mode,
        useGenerativeUI
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error en la consulta');
    }

    const data = await response.json();
    console.log('✅ Respuesta de Vizta Chat recibida');
    
    return data;

  } catch (error) {
    console.error('❌ Error enviando consulta a Vizta Chat:', error);
    throw error;
  }
}

/**
 * Obtiene los scrapes del usuario
 */
export async function getUserScrapes(options: {
  limit?: number;
  offset?: number;
  herramienta?: string;
  categoria?: string;
  sessionId?: string;
} = {}): Promise<ScrapeData[]> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('No hay sesión de usuario activa');
    }

    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.herramienta) params.append('herramienta', options.herramienta);
    if (options.categoria) params.append('categoria', options.categoria);
    if (options.sessionId) params.append('sessionId', options.sessionId);

    const response = await fetch(`${EXTRACTOR_W_URL}/vizta-chat/scrapes?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error obteniendo scrapes');
    }

    const data = await response.json();
    return data.scrapes || [];

  } catch (error) {
    console.error('❌ Error obteniendo scrapes:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas de scrapes del usuario
 */
export async function getUserScrapeStats(): Promise<any> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('No hay sesión de usuario activa');
    }

    const response = await fetch(`${EXTRACTOR_W_URL}/vizta-chat/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error obteniendo estadísticas');
    }

    const data = await response.json();
    return data.stats;

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    throw error;
  }
}

/**
 * Obtiene scrapes de una sesión específica
 */
export async function getSessionScrapes(sessionId: string): Promise<ScrapeData[]> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('No hay sesión de usuario activa');
    }

    const response = await fetch(`${EXTRACTOR_W_URL}/vizta-chat/session/${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error obteniendo scrapes de sesión');
    }

    const data = await response.json();
    return data.scrapes || [];

  } catch (error) {
    console.error('❌ Error obteniendo scrapes de sesión:', error);
    throw error;
  }
}

/**
 * Obtiene herramientas MCP disponibles
 */
export async function getAvailableTools(): Promise<any[]> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('No hay sesión de usuario activa');
    }

    const response = await fetch(`${EXTRACTOR_W_URL}/vizta-chat/tools`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error obteniendo herramientas');
    }

    const data = await response.json();
    return data.tools || [];

  } catch (error) {
    console.error('❌ Error obteniendo herramientas:', error);
    throw error;
  }
}

/**
 * Genera un ID de sesión único
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Formatea un mensaje para mostrar en el chat
 */
export function formatChatMessage(
  content: string, 
  sender: 'user' | 'assistant',
  metadata?: any
): ViztaChatMessage {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    content,
    sender,
    timestamp: new Date(),
    ...metadata
  };
} 