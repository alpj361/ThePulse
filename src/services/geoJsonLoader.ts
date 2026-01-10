/**
 * GeoJSON Loader Service
 * Provides unified access to Guatemala boundary data used by both
 * coverage map and location column selection
 */

export interface BoundaryLocation {
  id: string;
  name: string;
  type: 'departamento' | 'municipio';
  department?: string; // For municipalities
  coordinates?: {
    lat: number;
    lng: number;
  };
  geometry?: any; // Full GeoJSON geometry
  properties?: any; // All GeoJSON properties
}

interface GeoJSONCache {
  departamentos: BoundaryLocation[] | null;
  municipios: BoundaryLocation[] | null;
  lastLoaded: number;
}

// Cache for 10 minutes
const CACHE_DURATION = 10 * 60 * 1000;
const cache: GeoJSONCache = {
  departamentos: null,
  municipios: null,
  lastLoaded: 0
};

/**
 * Load and parse department boundaries from GeoJSON
 */
async function loadDepartamentos(): Promise<BoundaryLocation[]> {
  try {
    const response = await fetch('/geo/deptos.json');
    if (!response.ok) {
      throw new Error(`Failed to load departments GeoJSON: ${response.status}`);
    }

    const topoJson = await response.json();

    // Import topojson-client dynamically
    const topojson = await import('topojson-client');
    const geoJson = topojson.feature(topoJson, topoJson.objects.departamentos_gtm) as any;

    const departamentos: BoundaryLocation[] = geoJson.features.map((feature: any, index: number) => {
      const props = feature.properties || {};
      const name = props.Departamento || props.NAME || props.admin_1 || `Departamento ${index + 1}`;

      // Calculate centroid for coordinates
      let coordinates: { lat: number; lng: number } | undefined;
      if (feature.geometry && feature.geometry.type === 'Polygon' && feature.geometry.coordinates) {
        const coords = feature.geometry.coordinates[0];
        if (coords && coords.length > 0) {
          // Simple centroid calculation
          const lats = coords.map((c: number[]) => c[1]).filter((lat: number) => !isNaN(lat));
          const lngs = coords.map((c: number[]) => c[0]).filter((lng: number) => !isNaN(lng));

          if (lats.length > 0 && lngs.length > 0) {
            coordinates = {
              lat: lats.reduce((a: number, b: number) => a + b, 0) / lats.length,
              lng: lngs.reduce((a: number, b: number) => a + b, 0) / lngs.length
            };
          }
        }
      }

      return {
        id: `dept_${name.toLowerCase().replace(/\s+/g, '_')}`,
        name,
        type: 'departamento',
        coordinates,
        geometry: feature.geometry,
        properties: props
      };
    });

    return departamentos.filter(d => d.name && d.name !== 'Sin nombre');
  } catch (error) {
    console.error('Error loading departamentos GeoJSON:', error);
    throw error;
  }
}

/**
 * Load and parse municipality boundaries from GeoJSON
 */
async function loadMunicipios(): Promise<BoundaryLocation[]> {
  try {
    const response = await fetch('/geo/munis.json');
    if (!response.ok) {
      throw new Error(`Failed to load municipalities GeoJSON: ${response.status}`);
    }

    const topoJson = await response.json();

    // Import topojson-client dynamically
    const topojson = await import('topojson-client');
    const geoJson = topojson.feature(topoJson, topoJson.objects.municipios_gtm) as any;

    const municipios: BoundaryLocation[] = geoJson.features.map((feature: any, index: number) => {
      const props = feature.properties || {};
      const municipio = props.Municipio || props.NAME || props.novenombre || `Municipio ${index + 1}`;
      const departamento = props.Departamento || props.admin_1 || '';

      // Calculate centroid for coordinates
      let coordinates: { lat: number; lng: number } | undefined;
      if (feature.geometry && feature.geometry.type === 'Polygon' && feature.geometry.coordinates) {
        const coords = feature.geometry.coordinates[0];
        if (coords && coords.length > 0) {
          // Simple centroid calculation
          const lats = coords.map((c: number[]) => c[1]).filter((lat: number) => !isNaN(lat));
          const lngs = coords.map((c: number[]) => c[0]).filter((lng: number) => !isNaN(lng));

          if (lats.length > 0 && lngs.length > 0) {
            coordinates = {
              lat: lats.reduce((a: number, b: number) => a + b, 0) / lats.length,
              lng: lngs.reduce((a: number, b: number) => a + b, 0) / lngs.length
            };
          }
        }
      }

      return {
        id: `muni_${municipio.toLowerCase().replace(/\s+/g, '_')}_${departamento.toLowerCase().replace(/\s+/g, '_')}`,
        name: municipio,
        type: 'municipio',
        department: departamento,
        coordinates,
        geometry: feature.geometry,
        properties: props
      };
    });

    return municipios.filter(m => m.name && m.name !== 'Sin nombre');
  } catch (error) {
    console.error('Error loading municipios GeoJSON:', error);
    throw error;
  }
}

/**
 * Get all Guatemala departments with caching
 */
export async function getGuatemalaDepartments(): Promise<BoundaryLocation[]> {
  const now = Date.now();

  if (cache.departamentos && (now - cache.lastLoaded) < CACHE_DURATION) {
    return cache.departamentos;
  }

  const departamentos = await loadDepartamentos();
  cache.departamentos = departamentos;
  cache.lastLoaded = now;

  return departamentos;
}

/**
 * Get all Guatemala municipalities with caching
 */
export async function getGuatemalaMunicipalities(): Promise<BoundaryLocation[]> {
  const now = Date.now();

  if (cache.municipios && (now - cache.lastLoaded) < CACHE_DURATION) {
    return cache.municipios;
  }

  const municipios = await loadMunicipios();
  cache.municipios = municipios;
  cache.lastLoaded = now;

  return municipios;
}

/**
 * Search Guatemala boundaries by name
 */
export async function searchGuatemalaBoundaries(
  query: string,
  type?: 'departamento' | 'municipio' | 'both'
): Promise<BoundaryLocation[]> {
  const searchType = type || 'both';
  const normalizedQuery = query.toLowerCase().trim();

  if (normalizedQuery.length < 2) {
    return [];
  }

  const results: BoundaryLocation[] = [];

  // Search departments
  if (searchType === 'departamento' || searchType === 'both') {
    const departamentos = await getGuatemalaDepartments();
    const deptMatches = departamentos.filter(dept =>
      dept.name.toLowerCase().includes(normalizedQuery)
    );
    results.push(...deptMatches);
  }

  // Search municipalities
  if (searchType === 'municipio' || searchType === 'both') {
    const municipios = await getGuatemalaMunicipalities();
    const muniMatches = municipios.filter(muni =>
      muni.name.toLowerCase().includes(normalizedQuery) ||
      (muni.department && muni.department.toLowerCase().includes(normalizedQuery))
    );
    results.push(...muniMatches);
  }

  return results;
}

/**
 * Detect if a location name is likely an administrative boundary
 * @param locationName - The name to search for
 * @param targetLevel - Optional level filter: 'level1' for departments only, 'level2' for municipalities only
 */
export async function detectBoundaryLevel(
  locationName: string,
  targetLevel?: 'level1' | 'level2'
): Promise<{
  isBoundary: boolean;
  matches: BoundaryLocation[];
  confidence: number;
}> {
  const normalizedName = locationName.toLowerCase().trim();

  // Get boundaries based on target level
  let allBoundaries: BoundaryLocation[] = [];

  if (targetLevel === 'level1') {
    // Solo departamentos
    const departamentos = await getGuatemalaDepartments();
    allBoundaries = departamentos;
    console.log(`🔍 detectBoundaryLevel: Buscando solo en departamentos (${departamentos.length} encontrados)`);
  } else if (targetLevel === 'level2') {
    // Solo municipios
    const municipios = await getGuatemalaMunicipalities();
    allBoundaries = municipios;
    console.log(`🔍 detectBoundaryLevel: Buscando solo en municipios (${municipios.length} encontrados)`);
  } else {
    // Ambos (comportamiento original)
    const [departamentos, municipios] = await Promise.all([
      getGuatemalaDepartments(),
      getGuatemalaMunicipalities()
    ]);
    allBoundaries = [...departamentos, ...municipios];
  }

  // Find exact matches first
  const exactMatches = allBoundaries.filter(boundary =>
    boundary.name.toLowerCase() === normalizedName
  );

  if (exactMatches.length > 0) {
    return {
      isBoundary: true,
      matches: exactMatches,
      confidence: 1.0
    };
  }

  // Find partial matches
  const partialMatches = allBoundaries.filter(boundary =>
    boundary.name.toLowerCase().includes(normalizedName) ||
    normalizedName.includes(boundary.name.toLowerCase())
  );

  if (partialMatches.length > 0) {
    return {
      isBoundary: true,
      matches: partialMatches,
      confidence: 0.7
    };
  }

  return {
    isBoundary: false,
    matches: [],
    confidence: 0
  };
}

/**
 * Get boundary by ID
 */
export async function getBoundaryById(id: string): Promise<BoundaryLocation | null> {
  const [departamentos, municipios] = await Promise.all([
    getGuatemalaDepartments(),
    getGuatemalaMunicipalities()
  ]);

  const allBoundaries = [...departamentos, ...municipios];
  return allBoundaries.find(boundary => boundary.id === id) || null;
}

/**
 * Clear cache (useful for testing or force refresh)
 */
export function clearBoundaryCache(): void {
  cache.departamentos = null;
  cache.municipios = null;
  cache.lastLoaded = 0;
}