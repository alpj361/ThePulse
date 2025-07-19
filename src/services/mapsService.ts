// ===================================================================
// SERVICIO PARA INTEGRAR CON AGENTE MAPS
// Maneja normalización y detección geográfica guatemalteca
// ===================================================================

import { supabase } from './supabase';

interface MapsApiResponse {
  success: boolean;
  output: string;
  is_guatemalan?: boolean;
  detection_method?: string;
  error?: string;
}

interface LocationInput {
  city?: string;
  department?: string;
  pais?: string;
  country?: string;
}

interface NormalizedLocation {
  city: string | null;
  department: string | null;
  pais: string | null;
  country: string | null;
  detection_method?: string;
  confidence?: string;
  reasoning?: string;
}

interface BatchNormalizationResult {
  success: boolean;
  input_count: number;
  output_count: number;
  results: NormalizedLocation[];
  statistics: {
    manual_detections: number;
    ai_detections: number;
    error_count: number;
  };
}

interface SimilarLocation {
  name: string;
  type: 'city' | 'department' | 'country' | 'zone';
  department?: string;
  similarity: number;
}

interface LocationInfo {
  normalized: NormalizedLocation;
  match: any;
  isGuatemalan: boolean;
  type: string;
  suggestions: SimilarLocation[];
}

/**
 * Obtiene la URL del servidor según el entorno
 */
function getServerUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'localhost' 
      ? 'http://localhost:8080'
      : 'https://server.standatpd.com';
  }
  return 'https://server.standatpd.com';
}

/**
 * Obtiene el token de autorización
 */
async function getAuthToken(): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    throw new Error('No autenticado');
  }
  return sessionData.session.access_token;
}

/**
 * Normaliza nombre de país usando el agente Maps
 */
export async function normalizeCountryName(country: string): Promise<string> {
  try {
    const response = await fetch(`${getServerUrl()}/api/maps/normalize-country`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({ country })
    });
    
    if (!response.ok) {
      throw new Error(`Error al normalizar país: ${response.status}`);
    }
    
    const result: MapsApiResponse = await response.json();
    return result.output || country;
  } catch (error) {
    console.error('🚨 Error normalizando país con agente Maps:', error);
    // Fallback simple
    return country.charAt(0).toUpperCase() + country.slice(1).toLowerCase();
  }
}

/**
 * Normaliza información geográfica completa
 */
export async function normalizeGeographicInfo(location: LocationInput): Promise<NormalizedLocation> {
  try {
    const response = await fetch(`${getServerUrl()}/api/maps/normalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({ location })
    });
    
    if (!response.ok) {
      throw new Error(`Error al normalizar ubicación: ${response.status}`);
    }
    
    const result = await response.json();
    return result.output;
  } catch (error) {
    console.error('🚨 Error normalizando ubicación con agente Maps:', error);
    // Fallback simple
    return {
      city: location.city?.trim() || null,
      department: location.department?.trim() || null,
      pais: location.pais || location.country?.trim() || null,
      country: location.pais || location.country?.trim() || null,
      detection_method: 'fallback',
      confidence: 'low',
      reasoning: 'Error en procesamiento con agente Maps'
    };
  }
}

/**
 * Normaliza múltiples ubicaciones en lote
 */
export async function batchNormalizeGeography(locations: LocationInput[]): Promise<BatchNormalizationResult> {
  try {
    const response = await fetch(`${getServerUrl()}/api/maps/normalize-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({ locations })
    });
    
    if (!response.ok) {
      throw new Error(`Error al normalizar ubicaciones en lote: ${response.status}`);
    }
    
    const result: BatchNormalizationResult = await response.json();
    return result;
  } catch (error) {
    console.error('🚨 Error normalizando ubicaciones en lote con agente Maps:', error);
    // Fallback simple
    return {
      success: false,
      input_count: locations.length,
      output_count: 0,
      results: [],
      statistics: {
        manual_detections: 0,
        ai_detections: 0,
        error_count: locations.length
      }
    };
  }
}

/**
 * Detecta departamento para una ciudad
 */
export async function getDepartmentForCity(city: string): Promise<string | null> {
  try {
    const response = await fetch(`${getServerUrl()}/api/maps/detect-department`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({ city })
    });
    
    if (!response.ok) {
      throw new Error(`Error al detectar departamento: ${response.status}`);
    }
    
    const result = await response.json();
    return result.output;
  } catch (error) {
    console.error('🚨 Error detectando departamento con agente Maps:', error);
    return null;
  }
}

/**
 * Detecta tipo de ubicación (city, department, country, zone)
 */
export async function detectLocationType(location: string): Promise<string | null> {
  try {
    const response = await fetch(`${getServerUrl()}/api/maps/detect-location-type`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({ location })
    });
    
    if (!response.ok) {
      throw new Error(`Error al detectar tipo de ubicación: ${response.status}`);
    }
    
    const result = await response.json();
    return result.output;
  } catch (error) {
    console.error('🚨 Error detectando tipo de ubicación con agente Maps:', error);
    return null;
  }
}

/**
 * Busca ubicaciones similares
 */
export async function findSimilarLocations(location: string, maxResults: number = 5): Promise<SimilarLocation[]> {
  try {
    const response = await fetch(`${getServerUrl()}/api/maps/find-similar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({ location, maxResults })
    });
    
    if (!response.ok) {
      throw new Error(`Error al buscar ubicaciones similares: ${response.status}`);
    }
    
    const result = await response.json();
    return result.output || [];
  } catch (error) {
    console.error('🚨 Error buscando ubicaciones similares con agente Maps:', error);
    return [];
  }
}

/**
 * Usa IA para detectar geografía cuando mapeo manual falla
 */
export async function detectGeographyWithAI(location: string, context?: string): Promise<NormalizedLocation> {
  try {
    const response = await fetch(`${getServerUrl()}/api/maps/detect-with-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({ location, context })
    });
    
    if (!response.ok) {
      throw new Error(`Error al detectar geografía con IA: ${response.status}`);
    }
    
    const result = await response.json();
    return result.output;
  } catch (error) {
    console.error('🚨 Error detectando geografía con IA usando agente Maps:', error);
    return {
      city: null,
      department: null,
      pais: null,
      country: null,
      detection_method: 'error',
      confidence: 'low',
      reasoning: 'Error en procesamiento con IA'
    };
  }
}

/**
 * Obtiene información completa de una ubicación
 */
export async function getLocationInfo(location: string): Promise<LocationInfo | null> {
  try {
    const response = await fetch(`${getServerUrl()}/api/maps/detect-location-type`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({ location })
    });
    
    if (!response.ok) {
      throw new Error(`Error al obtener información de ubicación: ${response.status}`);
    }
    
    const result = await response.json();
    return result.info;
  } catch (error) {
    console.error('🚨 Error obteniendo información de ubicación con agente Maps:', error);
    return null;
  }
}

/**
 * Obtiene información del mapeo disponible
 */
export async function getMappingInfo(): Promise<any> {
  try {
    const response = await fetch(`${getServerUrl()}/api/maps/mapping-info`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${await getAuthToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error al obtener información del mapeo: ${response.status}`);
    }
    
    const result = await response.json();
    return result.info;
  } catch (error) {
    console.error('🚨 Error obteniendo información del mapeo con agente Maps:', error);
    return null;
  }
}

/**
 * Verifica salud del agente Maps
 */
export async function checkMapsHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${getServerUrl()}/api/maps/health`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      return false;
    }
    
    const result = await response.json();
    return result.success && result.status === 'healthy';
  } catch (error) {
    console.error('🚨 Error verificando salud del agente Maps:', error);
    return false;
  }
}

export default {
  normalizeCountryName,
  normalizeGeographicInfo,
  batchNormalizeGeography,
  getDepartmentForCity,
  detectLocationType,
  findSimilarLocations,
  detectGeographyWithAI,
  getLocationInfo,
  getMappingInfo,
  checkMapsHealth
}; 