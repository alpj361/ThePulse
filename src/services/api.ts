import { KeywordCount, CategoryCount } from '../types';
import { insertTrendData, getLatestTrendData } from './supabase';

// Define the WordCloudItem interface here instead of importing it
export interface WordCloudItem {
  text: string;
  value: number;
  color: string;
}

// Types for the API response from VPS scraper
export interface TrendResponse {
  wordCloudData: WordCloudItem[];
  topKeywords: KeywordCount[];
  categoryData: CategoryCount[];
  about?: any[];
  statistics?: any;
  timestamp: string;
  processing_status?: string;
  // NUEVO: Campos de controversia
  controversyAnalyses?: any[];
  controversyStatistics?: any;
  controversyChartData?: any;
}

// Types for backend response with about and statistics
export interface AboutInfo {
  nombre: string;
  tipo: string;
  relevancia: string;
  razon_tendencia: string;
  fecha_evento: string;
  palabras_clave: string[];
  categoria: string;
  contexto_local: boolean;
  source: string;
  model: string;
}

export interface Statistics {
  relevancia: Record<string, number>;
  contexto: {
    local: number;
    global: number;
  };
  timestamp: string;
}

// Get VPS API URL from environment variables
// This will come from Netlify environment variables in production
const VPS_API_URL = import.meta.env.VITE_VPS_API_URL || '';

// Base URL para el backend ExtractorW
// 1. Si existe VITE_EXTRACTORW_URL en variables de entorno, úsala.
// 2. Si estamos en desarrollo o el hostname es localhost, usar el backend local (puerto 8080).
// 3. De lo contrario, usar el servidor de producción.

function resolveExtractorWUrl(): string {
  // 1. Variable de entorno explícita (permite override incluso en desarrollo)
  const envUrl = (import.meta.env.VITE_EXTRACTORW_URL || import.meta.env.VITE_EXTRACTORW_API_URL) as string | undefined;
  if (envUrl && envUrl.trim() !== '') {
    // Normalizar localhost → 127.0.0.1 para evitar IPv6 (::1) resets en Docker Desktop (macOS)
    let normalized = envUrl.trim().replace(/\/$/, '').replace('://localhost', '://127.0.0.1');

    // FIX: Si detectamos puertos incorrectos en desarrollo, forzamos el 8080
    if (normalized.includes(':3009') || normalized.includes(':3010')) {
      console.warn('⚠️ Detectado puerto incorrecto en variables de entorno. Forzando puerto 8080 (ExtractorW correcto).');
      normalized = normalized.replace(':3009', ':8080').replace(':3010', ':8080');
    }

    return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
  }

  // 2. Entorno de desarrollo o hostname local → usar backend local en 127.0.0.1
  if (
    import.meta.env.DEV ||
    ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(window.location.hostname)
  ) {
    return 'http://127.0.0.1:8080/api';
  }

  // 3. Fallback producción
  return 'https://server.standatpd.com/api';
}

export const EXTRACTORW_API_URL = resolveExtractorWUrl();

// Resolver URL para ExtractorT (FastAPI)
function resolveExtractorTUrl(): string {
  // 1. Desarrollo local
  if (
    import.meta.env.DEV ||
    ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(window.location.hostname)
  ) {
    return 'http://localhost:8000';
  }

  // 2. Variable de entorno explícita para ExtractorT (usar VITE_VPS_API_URL)
  const envUrl = import.meta.env.VITE_VPS_API_URL as string | undefined;
  if (envUrl && envUrl.trim() !== '') {
    const cleaned = envUrl.trim().replace(/\/$/, '');
    return cleaned;
  }

  // 3. Fallback producción - asumiendo que ExtractorT está en el mismo servidor pero puerto 8000
  const baseUrl = EXTRACTORW_API_URL.replace('/api', '').replace(':8080', ':8000');
  return baseUrl;
}

export const EXTRACTORT_API_URL = resolveExtractorTUrl();

console.log('🔧 Configuración de APIs:');
console.log(`   ExtractorW: ${EXTRACTORW_API_URL}`);
console.log(`   ExtractorT: ${EXTRACTORT_API_URL}`);
console.log(`   VPS: ${VPS_API_URL || 'No configurado'}`);
console.log(`   Entorno: ${import.meta.env.DEV ? 'Desarrollo' : 'Producción'}`);

// Verificar que la URL no sea el valor genérico del archivo netlify.toml
const isGenericUrl = VPS_API_URL.includes('your-vps-scraper-url') ||
  VPS_API_URL.includes('dev-your-vps-scraper-url');

// URL real a usar
const API_URL_TO_USE = !isGenericUrl && VPS_API_URL ? VPS_API_URL : '';

// Check if the API URL is configured
if (!API_URL_TO_USE) {
  console.warn('VPS API URL is not configured or contains generic values. Set VITE_VPS_API_URL environment variable. Using mock data.');
}

// Función de ayuda para obtener colores aleatorios
function getRandomColor(): string {
  const colors = [
    '#3B82F6', // blue
    '#0EA5E9', // light blue
    '#14B8A6', // teal
    '#10B981', // green
    '#F97316', // orange
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#EF4444', // red
    '#F59E0B', // amber
    '#84CC16', // lime
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Fetches raw trending data from the VPS scraper
 */
export async function fetchRawTrendsFromVPS(): Promise<any> {
  try {
    console.log('Iniciando fetchRawTrendsFromVPS');
    // Ensure we have an API URL
    if (!API_URL_TO_USE) {
      console.warn('VPS API URL is not configured, generating test data');
      // Return realistic test data structure similar to ExtractorT
      console.log('Retornando datos de prueba para VPS raw trends');
      return {
        status: "success",
        location: "guatemala",
        twitter_trends: [
          "1. Napoli251K",
          "2. Lilo68K",
          "3. Alejandro Giammattei",
          "4. Lukita",
          "5. santa maría de jesús",
          "6. Aguirre",
          "7. #SerieA14K",
          "8. McTominay118K",
          "9. margaret satterthwaite",
          "10. Sinibaldi"
        ]
      };
    }

    console.log(`Realizando fetch a ${API_URL_TO_USE}/trending`);
    const response = await fetch(`${API_URL_TO_USE}/trending`);

    if (!response.ok) {
      throw new Error(`Error fetching trends: ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('Datos crudos recibidos del API:', responseData);
    return responseData;
  } catch (error) {
    console.error('Error in fetchRawTrendsFromVPS:', error);
    // Return test data in case of error
    console.log('Error en fetchRawTrendsFromVPS, retornando datos de prueba');
    return {
      status: "success",
      location: "guatemala",
      twitter_trends: [
        "1. Napoli251K",
        "2. Lilo68K",
        "3. Alejandro Giammattei",
        "4. Lukita",
        "5. santa maría de jesús",
        "6. Aguirre",
        "7. #SerieA14K",
        "8. McTominay118K",
        "9. margaret satterthwaite",
        "10. Sinibaldi"
      ]
    };
  }
}

/**
 * Stores trending data in Supabase
 */
export async function storeTrendsInSupabase(trendsData: TrendResponse): Promise<void> {
  try {
    await insertTrendData(trendsData);
    console.log('Trends data successfully stored in Supabase');
  } catch (error: any) {
    // Ignorar errores de duplicados (es normal cuando se hacen múltiples requests)
    if (error?.code === '23505') {
      console.log('🔄 Timestamp duplicado ignorado - los datos ya existen en Supabase');
      return; // No es un error real, continuar normalmente
    }

    console.error('Error storing trends in Supabase:', error);
    // Just log the error, but don't throw to prevent UI breaking
  }
}

// Function to test if fetch is working correctly
async function testFetch() {
  try {
    console.log('Testing fetch to an external API...');
    // Intenta hacer fetch a jsonplaceholder, un servicio de prueba común
    const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
    if (!response.ok) {
      console.error('Error en respuesta de test fetch:', response.status, response.statusText);
      return false;
    }
    const data = await response.json();
    console.log('Test fetch successful, response:', data);
    return true;
  } catch (error) {
    console.error('Error in test fetch:', error);
    return false;
  }
}

/**
 * Fetches trending data from ExtractorW backend with fast response + background processing
 */
export async function fetchTrendsFromExtractorW(rawTrendsData?: any, authToken?: string): Promise<TrendResponse> {
  try {
    console.log('🚀 Iniciando fetchTrendsFromExtractorW');

    // SIEMPRE enviar background: true para activar procesamiento detallado
    const requestBody = rawTrendsData ?
      { rawData: rawTrendsData, background: true } :
      { background: true };

    // Preparar headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Agregar token de autenticación si está disponible
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
      console.log('🔑 Token de autenticación agregado');
    } else {
      console.log('⚠️  No se proporcionó token de autenticación - endpoint puede requerir auth');
    }

    console.log('📡 Llamando a ExtractorW backend para procesamiento rápido...');
    console.log('📝 Request body:', requestBody); // Debug log para verificar que se envía background: true
    const response = await fetch(`${EXTRACTORW_API_URL}/processTrends`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Error calling ExtractorW: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Respuesta rápida recibida de ExtractorW:', data);

    // DEBUG: Mostrar específicamente los topKeywords
    console.log('🔍 DEBUG - topKeywords del backend:', data.topKeywords?.slice(0, 3));
    data.topKeywords?.slice(0, 3).forEach((keyword: any, index: number) => {
      console.log(`  ${index + 1}. ${keyword.keyword}: count=${keyword.count}`);
    });

    // FIJO: Intentar usar datos de volumen reales si están disponibles
    let processedTopKeywords = data.topKeywords || [];

    // Si los topKeywords tienen todos count=1, intentar obtener volúmenes reales de wordCloudData
    const allHaveCountOne = processedTopKeywords.every((kw: any) => kw.count === 1);
    if (allHaveCountOne && data.wordCloudData && data.wordCloudData.length > 0) {
      console.log('🔧 FIJO: Detectado count=1 para todos en fetchTrends, usando volúmenes de wordCloudData');

      // Crear un mapa de volúmenes desde wordCloudData
      const volumeMap = new Map();
      data.wordCloudData.forEach((item: any) => {
        volumeMap.set(item.text?.toLowerCase(), item.value || item.volume || 1);
      });

      // Actualizar topKeywords con volúmenes reales
      processedTopKeywords = processedTopKeywords.map((keyword: any) => {
        const realVolume = volumeMap.get(keyword.keyword?.toLowerCase()) || keyword.count || 1;
        console.log(`  📊 ${keyword.keyword}: ${keyword.count} → ${realVolume}`);
        return {
          ...keyword,
          count: realVolume
        };
      });
    }

    // La respuesta inicial viene sin about y statistics
    // Estos se procesan en background

    return {
      wordCloudData: data.wordCloudData || [],
      topKeywords: processedTopKeywords,
      categoryData: data.categoryData || [],
      about: data.about || [],
      statistics: data.statistics || {},
      timestamp: data.timestamp,
      processing_status: data.processing_status || 'basic_completed',
      // NUEVO: Campos de controversia
      controversyAnalyses: data.controversyAnalyses || [],
      controversyStatistics: data.controversyStatistics || {},
      controversyChartData: data.controversyChartData || {}
    };
  } catch (error) {
    console.error('❌ Error in fetchTrendsFromExtractorW:', error);
    // No fallback a mock data, lanzar el error
    throw error;
  }
}

/**
 * Polls for completed processing status (about and statistics)
 * Updated with longer timeouts to handle Perplexity processing time (2-3 minutes)
 */
export async function pollForCompletedData(timestamp: string, maxAttempts: number = 15): Promise<TrendResponse | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🔄 Polling attempt ${attempt}/${maxAttempts} for timestamp: ${timestamp}`);

      const response = await fetch(`${EXTRACTORW_API_URL}/processingStatus/${encodeURIComponent(timestamp)}`, {
        method: 'GET'
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`⚠️  Record not found yet, attempt ${attempt}`);
        } else if (response.status === 503) {
          console.log(`⚠️  Service unavailable, attempt ${attempt}`);
        } else {
          console.log(`⚠️  Polling attempt ${attempt} failed: ${response.status} ${response.statusText}`);
        }

        // Wait longer on early attempts, shorter on later ones
        const waitTime = attempt <= 5 ? 15000 : (attempt <= 10 ? 12000 : 8000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      const data = await response.json();
      console.log(`📊 Polling result ${attempt}:`, {
        status: data.status,
        has_about: data.has_about,
        has_statistics: data.has_statistics
      });

      if (data.status === 'complete' && data.has_about && data.has_statistics) {
        console.log('✅ Procesamiento completo detectado!');
        return data.data;
      }

      if (data.status === 'error') {
        console.error('❌ Error en procesamiento detectado');
        return null;
      }

      // Progressive wait times: start with longer waits, then shorter
      // First 3 attempts: 20 seconds (Perplexity is still processing)
      // Next 7 attempts: 15 seconds 
      // Final 5 attempts: 10 seconds
      let waitTime;
      if (attempt <= 3) {
        waitTime = 20000; // 20 seconds for first attempts
      } else if (attempt <= 10) {
        waitTime = 15000; // 15 seconds for middle attempts
      } else {
        waitTime = 10000; // 10 seconds for final attempts
      }

      console.log(`⏳ Esperando ${waitTime / 1000} segundos antes del siguiente intento...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));

    } catch (error) {
      console.error(`❌ Error en polling attempt ${attempt}:`, error);
      // Wait 10 seconds on fetch errors
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  console.log(`⏰ Polling timeout reached after ${maxAttempts} attempts (approx ${Math.round(maxAttempts * 15 / 60)} minutes), returning null`);
  return null;
}

/**
 * Gets latest trends from ExtractorW backend
 */
export async function getLatestTrendsFromExtractorW(): Promise<TrendResponse | null> {
  try {
    console.log('📡 Obteniendo últimas tendencias de ExtractorW...');

    // Intentar el endpoint de latestTrends
    const response = await fetch(`${EXTRACTORW_API_URL}/latestTrends`);

    if (!response.ok) {
      if (response.status === 404) {
        console.log('📭 No hay tendencias previas en ExtractorW backend');
        // NO generar datos on-demand, simplemente retornar null para hacer fallback a Supabase
        return null;
      }
      throw new Error(`Error getting latest trends: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Últimas tendencias obtenidas de ExtractorW:', {
      timestamp: data.timestamp,
      status: data.processing_status,
      has_about: data.about?.length > 0,
      has_statistics: Object.keys(data.statistics || {}).length > 0,
      has_controversy: data.controversyAnalyses?.length > 0
    });

    // DEBUG: Mostrar específicamente los topKeywords desde latestTrends
    console.log('🔍 DEBUG - topKeywords desde latestTrends:', data.topKeywords?.slice(0, 3));
    data.topKeywords?.slice(0, 3).forEach((keyword: any, index: number) => {
      console.log(`  ${index + 1}. ${keyword.keyword}: count=${keyword.count}`);
    });

    // FIJO: Intentar usar datos de volumen reales si están disponibles
    let processedTopKeywords = data.topKeywords || [];

    // Si los topKeywords tienen todos count=1, intentar obtener volúmenes reales de wordCloudData
    const allHaveCountOne = processedTopKeywords.every((kw: any) => kw.count === 1);
    if (allHaveCountOne && data.wordCloudData && data.wordCloudData.length > 0) {
      console.log('🔧 FIJO: Detectado count=1 para todos, intentando usar volúmenes de wordCloudData');

      // Crear un mapa de volúmenes desde wordCloudData
      const volumeMap = new Map();
      data.wordCloudData.forEach((item: any) => {
        volumeMap.set(item.text?.toLowerCase(), item.value || item.volume || 1);
      });

      // Actualizar topKeywords con volúmenes reales
      processedTopKeywords = processedTopKeywords.map((keyword: any) => {
        const realVolume = volumeMap.get(keyword.keyword?.toLowerCase()) || keyword.count || 1;
        console.log(`  📊 ${keyword.keyword}: ${keyword.count} → ${realVolume}`);
        return {
          ...keyword,
          count: realVolume
        };
      });
    }

    return {
      wordCloudData: data.wordCloudData || [],
      topKeywords: processedTopKeywords,
      categoryData: data.categoryData || [],
      about: data.about || [],
      statistics: data.statistics || {},
      timestamp: data.timestamp,
      processing_status: data.processing_status || 'unknown',
      // NUEVO: Campos de controversia
      controversyAnalyses: data.controversyAnalyses || [],
      controversyStatistics: data.controversyStatistics || {},
      controversyChartData: data.controversyChartData || {}
    };
  } catch (error) {
    console.error('❌ Error getting latest trends from ExtractorW:', error);
    return null;
  }
}

/**
 * Fetches and stores trending data with AI processing
 * Now uses ExtractorW backend with fast response + background processing
 */
export async function fetchAndStoreTrends(authToken?: string): Promise<TrendResponse> {
  try {
    console.log('🚀 Iniciando fetchAndStoreTrends con ExtractorW');

    // 1. Fetch raw trends from VPS (if available)
    console.log('📡 Obteniendo datos raw de VPS...');
    const rawTrendsData = await fetchRawTrendsFromVPS();

    // 2. Process with ExtractorW (fast response) - now with auth token
    console.log('⚡ Procesando con ExtractorW (respuesta rápida)...');
    const initialData = await fetchTrendsFromExtractorW(rawTrendsData, authToken);

    // 3. Start polling for complete data in background
    if (initialData.timestamp && initialData.processing_status === 'basic_completed') {
      console.log('🔄 Iniciando polling para datos completos...');
      // Don't await this - let it run in background
      pollForCompletedData(initialData.timestamp).then(completeData => {
        if (completeData) {
          console.log('✅ Datos completos recibidos del polling');
          // You could emit an event here or use a state management solution
          // to update the UI when complete data is available
        }
      }).catch(error => {
        console.error('❌ Error en polling background:', error);
      });
    }

    // 4. Store initial data in Supabase
    try {
      console.log('💾 Guardando datos iniciales en Supabase...');
      await storeTrendsInSupabase(initialData);
      console.log('✅ Datos guardados en Supabase');
    } catch (storageError) {
      console.error('⚠️  Error storing in Supabase:', storageError);
      // Continue even if storage fails
    }

    return initialData;
  } catch (error) {
    console.error('❌ Error in fetchAndStoreTrends:', error);
    // No usar mock data como fallback final, lanzar el error
    throw error;
  }
}

/**
 * Gets the latest trend data from local storage or API
 * Now tries ExtractorW first, then falls back to Supabase
 */
export async function getLatestTrends(): Promise<TrendResponse | null> {
  try {
    console.log('📊 Iniciando getLatestTrends');

    // 1. Try to get latest from ExtractorW first
    console.log('🔍 Intentando obtener datos de ExtractorW...');
    const extractorData = await getLatestTrendsFromExtractorW();

    if (extractorData) {
      console.log('✅ Datos obtenidos de ExtractorW');
      return extractorData;
    }

    // 2. Fallback to Supabase
    console.log('🔄 ExtractorW no tiene datos previos, fallback a Supabase...');
    const supabaseData = await getLatestTrendData();

    if (supabaseData) {
      console.log('✅ Datos obtenidos de Supabase:', {
        timestamp: supabaseData.timestamp,
        wordCloudCount: supabaseData.word_cloud_data?.length || 0,
        keywordsCount: supabaseData.top_keywords?.length || 0,
        categoriesCount: supabaseData.category_data?.length || 0,
        has_controversy: supabaseData.controversy_analyses?.length > 0
      });

      // FIJO: También aplicar fix de volúmenes para datos de Supabase
      let processedTopKeywords = supabaseData.top_keywords || [];

      // Si los topKeywords tienen todos count=1, intentar obtener volúmenes reales de wordCloudData
      const allHaveCountOne = processedTopKeywords.every((kw: any) => kw.count === 1);
      if (allHaveCountOne && supabaseData.word_cloud_data && supabaseData.word_cloud_data.length > 0) {
        console.log('🔧 FIJO: Detectado count=1 en Supabase, usando volúmenes de wordCloudData');

        // Crear un mapa de volúmenes desde wordCloudData
        const volumeMap = new Map();
        supabaseData.word_cloud_data.forEach((item: any) => {
          volumeMap.set(item.text?.toLowerCase(), item.value || item.volume || 1);
        });

        // Actualizar topKeywords con volúmenes reales
        processedTopKeywords = processedTopKeywords.map((keyword: any) => {
          const realVolume = volumeMap.get(keyword.keyword?.toLowerCase()) || keyword.count || 1;
          console.log(`  📊 Supabase ${keyword.keyword}: ${keyword.count} → ${realVolume}`);
          return {
            ...keyword,
            count: realVolume
          };
        });
      }

      // Asegurar que los datos de Supabase tienen la estructura correcta
      return {
        wordCloudData: supabaseData.word_cloud_data || [],
        topKeywords: processedTopKeywords,
        categoryData: supabaseData.category_data || [],
        about: supabaseData.about || [],
        statistics: {
          ...(supabaseData.statistics || {}),
          controversyStatistics: supabaseData.controversy_statistics || {},
          controversyChartData: supabaseData.controversy_chart_data || {}
        },
        timestamp: supabaseData.timestamp || new Date().toISOString(),
        processing_status: supabaseData.processing_status || 'unknown',
        // NUEVO: Campos de controversia desde Supabase
        controversyAnalyses: supabaseData.controversy_analyses || [],
        controversyStatistics: supabaseData.controversy_statistics || {},
        controversyChartData: supabaseData.controversy_chart_data || {}
      };
    }

    console.log('⚠️  No se encontraron datos en ExtractorW ni en Supabase');
    return null;
  } catch (error) {
    console.error('❌ Error in getLatestTrends:', error);
    return null;
  }
}

/**
 * Envía un sondeo personalizado (contexto y pregunta) a ExtractorW y espera la respuesta del LLM
 * @param contextoArmado Objeto con contexto (noticias, codex, tendencias, input, etc)
 * @param pregunta Pregunta del usuario (puede ser igual a input)
 * @param authToken Token de autenticación (opcional)
 * @returns Respuesta completa del LLM y contexto usado
 */
export async function sendSondeoToExtractorW(contextoArmado: any, pregunta: string, authToken?: string): Promise<any> {
  try {
    console.log('📡 Enviando sondeo a ExtractorW con contexto tipo:', contextoArmado.tipo_contexto);

    // Configurar headers con autenticación si hay token
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Mapear contextos del frontend al formato que espera el backend
    const selectedContexts = [];
    if (contextoArmado.tipo_contexto) {
      const tipos = contextoArmado.tipo_contexto.split('+');
      tipos.forEach((tipo: string) => {
        if (tipo === 'tendencias') selectedContexts.push('tendencias');
        if (tipo === 'noticias') selectedContexts.push('noticias');
        if (tipo === 'codex') selectedContexts.push('codex');
        if (tipo === 'tweets') selectedContexts.push('tweets');
      });
    }

    // Si no hay contextos específicos, usar los contextos seleccionados directamente
    if (selectedContexts.length === 0 && contextoArmado.contextos_seleccionados) {
      selectedContexts.push(...contextoArmado.contextos_seleccionados);
    }

    // Fallback a tendencias si no hay contextos
    if (selectedContexts.length === 0) {
      selectedContexts.push('tendencias');
    }

    console.log('📊 Contextos mapeados:', selectedContexts);

    // Preparar payload en el formato correcto para el backend
    const payload = {
      pregunta: pregunta,
      selectedContexts: selectedContexts,
      configuracion: {
        detalle_nivel: 'alto',
        incluir_recomendaciones: true,
        incluir_visualizaciones: false, // 🔧 FORZAR USO DE DATOS REALES
        tipo_analisis: contextoArmado.tipo_contexto || 'general',
        contexto_original: {
          tendencias: contextoArmado.tendencias || [],
          noticias: contextoArmado.noticias || [],
          codex: contextoArmado.codex || [],
          monitoreos: contextoArmado.monitoreos || []
        }
      }
    };

    console.log('📤 Payload enviado:', JSON.stringify(payload, null, 2));

    // 1. Enviar el contexto y pregunta a ExtractorW (nuevo endpoint /api/sondeo)
    const response = await fetch(`${EXTRACTORW_API_URL}/sondeo`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📡 Response text (raw):', responseText);

    if (!response.ok) {
      console.error('❌ Error response status:', response.status);
      console.error('❌ Error response text:', responseText);
      throw new Error(`Error enviando sondeo (${response.status}): ${response.statusText} - ${responseText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError: any) {
      console.error('❌ Error parsing JSON response:', parseError);
      console.error('❌ Raw response:', responseText);
      throw new Error(`Error parsing response: ${parseError.message}`);
    }

    console.log('✅ Respuesta de sondeo recibida:', {
      success: data.success,
      tiene_resultado: !!data.resultado,
      tiene_contexto: !!data.contexto,
      creditos_costo: data.creditos?.costo_total,
      creditos_restantes: data.creditos?.creditos_restantes,
      keys: Object.keys(data)
    });

    console.log('📊 Datos completos recibidos:', JSON.stringify(data, null, 2));

    return data;
  } catch (error) {
    console.error('❌ Error en sendSondeoToExtractorW:', error);
    throw error;
  }
}

export interface TrendDetail {
  id: number;
  nombre: string;
  tipo: string;
  relevancia: 'Alta' | 'Media' | 'Baja';
  razon_tendencia: string;
  fecha: string;
  palabras_clave: string[];
}

export const transformTrendData = (backendData: any): AboutInfo[] => {
  if (!backendData || !backendData.about || !Array.isArray(backendData.about)) {
    return [];
  }

  return backendData.about.map((item: any) => {
    // Asegurar que la relevancia esté en minúsculas y sea uno de los valores permitidos
    const normalizeRelevancia = (rel: string): 'alta' | 'media' | 'baja' => {
      const normalized = rel?.toLowerCase() || '';
      if (normalized.includes('alta')) return 'alta';
      if (normalized.includes('baja')) return 'baja';
      return 'media';
    };

    return {
      nombre: item.nombre || 'Sin nombre',
      resumen: item.resumen || 'Procesando información detallada...',
      categoria: item.categoria || 'General',
      tipo: item.tipo || 'hashtag',
      relevancia: normalizeRelevancia(item.relevancia),
      contexto_local: item.contexto_local ?? true,
      razon_tendencia: item.razon_tendencia || undefined,
      fecha_evento: item.fecha_evento || undefined,
      palabras_clave: Array.isArray(item.palabras_clave) ? item.palabras_clave : undefined,
      source: item.source || 'perplexity-individual',
      model: item.model || 'sonar'
    };
  });
};

// Obtener historial de sondeos del usuario
export async function getSondeoHistorial(limit: number = 10, offset: number = 0) {
  try {
    const accessToken = localStorage.getItem('supabase.auth.token');

    if (!accessToken) {
      throw new Error('No hay token de acceso disponible');
    }

    const response = await fetch(`${EXTRACTORW_API_URL}/sondeo/historial?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error obteniendo historial: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error obteniendo historial de sondeos:', error);
    throw error;
  }
}


// Obtener un sondeo específico por ID
export async function getSondeoById(id: string) {
  try {
    const accessToken = localStorage.getItem('supabase.auth.token');

    if (!accessToken) {
      throw new Error('No hay token de acceso disponible');
    }

    const response = await fetch(`${EXTRACTORW_API_URL}/sondeo/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error obteniendo sondeo: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error obteniendo sondeo por ID:', error);
    throw error;
  }
}

/**
 * Executes an MCP tool via the ExtractorW backend
 * @param toolName Name of the tool to execute (e.g., 'search', 'codex')
 * @param parameters Object containing the parameters for the tool
 * @param authToken Optional authentication token
 * @returns Result of the tool execution
 */
export async function executeMcpTool(toolName: string, parameters: any = {}, authToken?: string): Promise<any> {
  try {
    console.log(`🔧 Executing MCP Tool: ${toolName}`, parameters);

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add auth token if available or try to get from local storage
    const token = authToken || localStorage.getItem('supabase.auth.token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Prepare payload
    const payload = {
      tool_name: toolName,
      parameters: parameters
    };

    const response = await fetch(`${EXTRACTORW_API_URL}/mcp/execute`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error executing MCP tool (${response.status}): ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Unknown error executing MCP tool');
    }

    return data.result;
  } catch (error) {
    console.error(`❌ Error in executeMcpTool (${toolName}):`, error);
    throw error;
  }
}

