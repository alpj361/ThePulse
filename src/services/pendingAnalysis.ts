import { EXTRACTORW_API_URL } from './api';
import { supabase } from './supabase';

export interface AnalyzePendingLinksOptions {
  itemIds?: string[];
  processAll?: boolean;
  dryRun?: boolean;
}

export interface AnalyzePendingLinksResult {
  success: boolean;
  message: string;
  processed: number;
  results: any[];
  [key: string]: any;
}

/**
 * Llama al backend ExtractorW para analizar enlaces pendientes en el Codex.
 * Usa EXTRACTORW_API_URL, así en desarrollo irá a http://localhost:8080/api
 * y en producción al dominio configurado.
 */
export async function analyzePendingLinks(
  opts: AnalyzePendingLinksOptions = { processAll: true },
  authToken?: string
): Promise<AnalyzePendingLinksResult> {
  console.log('🔍 analyzePendingLinks iniciado');
  console.log('📋 Opciones:', opts);
  console.log('🔑 Token recibido:', authToken ? 'SÍ (largo: ' + authToken.length + ')' : 'NO');
  
  // Obtener token si no se pasó explícitamente
  let token = authToken;
  if (!token) {
    console.log('🔍 Intentando obtener token de sesión...');
    try {
      const sessionRes = await supabase.auth.getSession();
      console.log('📋 Resultado de sesión:', sessionRes.data.session ? 'SESIÓN ENCONTRADA' : 'SIN SESIÓN');
      token = sessionRes.data.session?.access_token;
      console.log('🔑 Token obtenido de sesión:', token ? 'SÍ (largo: ' + token.length + ')' : 'NO');
    } catch (error) {
      console.error('❌ Error obteniendo sesión:', error);
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('✅ Header Authorization agregado');
  } else {
    console.log('❌ NO se agregó header Authorization - token no disponible');
  }

  console.log('🌐 URL del endpoint:', `${EXTRACTORW_API_URL}/pending-analysis/analyze-pending-links`);
  console.log('📤 Headers que se enviarán:', Object.keys(headers));

  const response = await fetch(
    `${EXTRACTORW_API_URL}/pending-analysis/analyze-pending-links`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(opts)
    }
  );

  console.log('📥 Respuesta recibida:', response.status, response.statusText);

  if (!response.ok) {
    const text = await response.text();
    console.error('❌ Error en respuesta:', text);
    throw new Error(`Error ${response.status}: ${text || response.statusText}`);
  }

  const result = await response.json();
  console.log('✅ Análisis completado:', result);
  return result;
} 