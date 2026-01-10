/**
 * Geocoding Service
 * Provides coordinate lookup for locations using multiple sources:
 * 1. Guatemala municipalities from coverages table
 * 2. Nominatim OpenStreetMap API for worldwide locations
 * 3. Future: Google Maps Geocoding API
 */

import { supabase } from './supabase';

export interface GeocodingResult {
  lat: number;
  lng: number;
  formatted_address: string;
  source: 'database' | 'nominatim' | 'googlemaps';
  confidence: number; // 0-1, where 1 is exact match
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  importance: number;
  place_id: string;
}

/**
 * Search for coordinates in Guatemala municipalities database
 */
async function searchGuatemalaDatabase(locationName: string): Promise<GeocodingResult | null> {
  try {
    const { data, error } = await supabase
      .from('coverages')
      .select('departamento, municipio, lat, lng')
      .or(`departamento.ilike.%${locationName}%,municipio.ilike.%${locationName}%`)
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      const location = data[0];
      return {
        lat: parseFloat(location.lat),
        lng: parseFloat(location.lng),
        formatted_address: `${location.municipio}, ${location.departamento}, Guatemala`,
        source: 'database',
        confidence: 0.9
      };
    }
  } catch (error) {
    console.error('Error searching Guatemala database:', error);
  }

  return null;
}

/**
 * Search using Nominatim OpenStreetMap API (free, no API key required)
 */
async function searchNominatim(locationName: string, countryBias: string = 'Guatemala'): Promise<GeocodingResult | null> {
  try {
    const query = encodeURIComponent(`${locationName}, ${countryBias}`);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'ThePulse-DatasetEditor/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const results: NominatimResult[] = await response.json();

    if (results.length > 0) {
      const result = results[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        formatted_address: result.display_name,
        source: 'nominatim',
        confidence: Math.min(result.importance || 0.5, 1)
      };
    }
  } catch (error) {
    console.error('Error with Nominatim geocoding:', error);
  }

  return null;
}

/**
 * Main geocoding function that tries multiple sources
 */
export async function geocodeLocation(locationName: string): Promise<GeocodingResult | null> {
  if (!locationName || locationName.trim().length === 0) {
    return null;
  }

  const cleanLocationName = locationName.trim();

  // Skip database search since coverages table doesn't exist
  // Go directly to Nominatim for place-level geocoding

  // Try Nominatim with Guatemala bias first
  const nominatimGuatemalaResult = await searchNominatim(cleanLocationName, 'Guatemala');
  if (nominatimGuatemalaResult && nominatimGuatemalaResult.confidence > 0.3) {
    return nominatimGuatemalaResult;
  }

  // Try worldwide search without country bias
  const nominatimWorldResult = await searchNominatim(cleanLocationName, '');
  if (nominatimWorldResult && nominatimWorldResult.confidence > 0.5) {
    return nominatimWorldResult;
  }

  return null;
}

/**
 * Batch geocode multiple locations (with rate limiting for API calls)
 */
export async function batchGeocodeLocations(
  locationNames: string[],
  progressCallback?: (completed: number, total: number) => void
): Promise<Map<string, GeocodingResult>> {
  const results = new Map<string, GeocodingResult>();
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  for (let i = 0; i < locationNames.length; i++) {
    const locationName = locationNames[i];

    if (locationName && locationName.trim()) {
      const result = await geocodeLocation(locationName);
      if (result) {
        results.set(locationName, result);
      }
    }

    // Progress callback
    if (progressCallback) {
      progressCallback(i + 1, locationNames.length);
    }

    // Rate limiting: wait 500ms between API calls to be respectful
    if (i < locationNames.length - 1) {
      await delay(500);
    }
  }

  return results;
}

/**
 * Check if a location name appears to be a Guatemala location
 */
export function isLikelyGuatemalaLocation(locationName: string): boolean {
  const guatemalaKeywords = [
    'guatemala', 'quetzal', 'antigua', 'escuintla', 'quiche', 'huehuetenango',
    'petén', 'alta verapaz', 'baja verapaz', 'chimaltenango', 'el progreso',
    'izabal', 'jalapa', 'jutiapa', 'retalhuleu', 'sacatepequez', 'san marcos',
    'santa rosa', 'solola', 'suchitepequez', 'totonicapan', 'zacapa'
  ];

  const cleanName = locationName.toLowerCase();
  return guatemalaKeywords.some(keyword => cleanName.includes(keyword));
}