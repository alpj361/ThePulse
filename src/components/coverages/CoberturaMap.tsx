import { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Coverage, CoverageType } from '../../services/coverages';
import { FiMaximize2, FiMinimize2, FiLayers, FiTarget, FiX, FiAlertTriangle, FiMapPin } from 'react-icons/fi';
import { buildGeographicIndex, getGeographicData } from '../../services/geographicDataIndex';
import { GeographicLocationData } from '../../types/geographicData';
import EnrichedTooltip from './EnrichedTooltip';

// Guatemala bounds para el mapa
const GUATEMALA_BOUNDS: [number, number, number, number] = [-92.2292, 13.7373, -88.2258, 17.8193];
const GUATEMALA_CENTER: [number, number] = [-90.5069, 14.6349];

interface CoberturaMapProps {
  coverages: Coverage[];
  onCoverageClick?: (coverage: Coverage) => void;
  height?: string;
  className?: string;
}

// Mapear tipos de cobertura a colores
const getCoverageColor = (type: CoverageType): string => {
  const colors: Record<CoverageType, string> = {
    pais: '#3B82F6',      // Azul - País
    departamento: '#10B981', // Verde - Departamento  
    ciudad: '#8B5CF6',    // Púrpura - Ciudad
    zona: '#F59E0B',      // Amarillo - Zona
    region: '#06B6D4'     // Cyan - Región
  };
  return colors[type] || '#6B7280';
};

// Mapear tipos a tamaños de marcador
const getMarkerSize = (type: CoverageType): number => {
  const sizes: Record<CoverageType, number> = {
    pais: 14,
    departamento: 12,
    ciudad: 10,
    zona: 8,
    region: 11
  };
  return sizes[type] || 10;
};

export default function CoberturaMap({
  coverages,
  onCoverageClick,
  height = "400px",
  className = ""
}: CoberturaMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [viewMode, setViewMode] = useState<'departamentos' | 'municipios' | 'especifico'>('departamentos');
  const [pinnedLocations, setPinnedLocations] = useState<Array<{
    id: string;
    lat: number;
    lng: number;
    name?: string;
  }>>([]);
  const pinnedMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const [hoveredInfo, setHoveredInfo] = useState<{ name: string; departamento: string; municipio?: string; x: number; y: number } | null>(null);
  const [hoveredGeoData, setHoveredGeoData] = useState<GeographicLocationData | null>(null);
  const [isIndexLoading, setIsIndexLoading] = useState(false);

  // Ref para acceder al modo actual dentro de los event listeners (evitar clausuras obsoletas)
  const viewModeRef = useRef(viewMode);

  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  // Estabilizar función de click para evitar recreaciones
  const stableOnCoverageClick = useCallback((coverage: Coverage) => {
    if (onCoverageClick) {
      onCoverageClick(coverage);
    }
  }, [onCoverageClick]);

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainer.current) return;

    // Configurar token de MapBox - deberá agregarse al .env
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11', // Estilo claro y limpio
      center: GUATEMALA_CENTER,
      zoom: 7,
      maxBounds: GUATEMALA_BOUNDS, // Limitar a Guatemala
      attributionControl: false
    });

    // Resetear estados al cambiar de mapa
    setHoveredInfo(null);
    setViewMode('departamentos');

    // Configurar controles
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    // Event listener para cuando el mapa esté cargado
    map.current.on('load', async () => {
      try {
        // Importar topojson-client dinámicamente
        const topojson = await import('topojson-client');

        // Cargar archivos GeoJSON locales
        const [deptosRes, munisRes] = await Promise.all([
          fetch('/geo/deptos.json'),
          fetch('/geo/munis.json')
        ]);

        if (!deptosRes.ok || !munisRes.ok) {
          throw new Error('Failed to load GeoJSON files');
        }

        const deptosTopoJson = await deptosRes.json();
        const munisTopoJson = await munisRes.json();

        // Convertir TopoJSON a GeoJSON (using correct object names)
        const deptosGeoJson = topojson.feature(deptosTopoJson, deptosTopoJson.objects.departamentos_gtm) as unknown as GeoJSON.FeatureCollection;
        const munisGeoJson = topojson.feature(munisTopoJson, munisTopoJson.objects.municipios_gtm) as unknown as GeoJSON.FeatureCollection;

        console.log('📍 Loaded departments:', deptosGeoJson.features.length);
        console.log('📍 Loaded municipalities:', munisGeoJson.features.length);

        // Agregar fuente de departamentos con IDs generados automáticamente
        map.current!.addSource('departamentos-source', {
          type: 'geojson',
          data: deptosGeoJson,
          generateId: true  // Necesario para setFeatureState
        });

        // Agregar fuente de municipios con IDs generados automáticamente
        map.current!.addSource('municipios-source', {
          type: 'geojson',
          data: munisGeoJson,
          generateId: true  // Necesario para setFeatureState
        });

        // Capa de relleno para departamentos (solo los activos)
        map.current!.addLayer({
          id: 'departamentos-fill',
          type: 'fill',
          source: 'departamentos-source',
          paint: {
            'fill-color': '#10B981',
            'fill-opacity': 0.3
          },
          filter: ['==', '1', '0'] // Inicialmente oculto
        });

        // Capa de borde para departamentos
        map.current!.addLayer({
          id: 'departamentos-outline',
          type: 'line',
          source: 'departamentos-source',
          paint: {
            'line-color': '#10B981',
            'line-width': 2,
            'line-opacity': 0.5
          }
        });

        // Capa de relleno para municipios (solo los activos)
        map.current!.addLayer({
          id: 'municipios-fill',
          type: 'fill',
          source: 'municipios-source',
          paint: {
            'fill-color': '#8B5CF6',
            'fill-opacity': 0.3
          },
          filter: ['==', '1', '0'] // Inicialmente oculto
        });

        // Capa de borde para municipios
        map.current!.addLayer({
          id: 'municipios-outline',
          type: 'line',
          source: 'municipios-source',
          paint: {
            'line-color': '#8B5CF6',
            'line-width': 1,
            'line-opacity': 0.3
          }
        });

        // Capas interactivas con hover visual (para hover/click en cualquier área)
        map.current!.addLayer({
          id: 'departamentos-interactive',
          type: 'fill',
          source: 'departamentos-source',
          paint: {
            'fill-color': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              '#10B981', // Verde cuando hover
              '#000000'  // Negro transparente normalmente
            ],
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              0.4,  // Más visible en hover
              0     // Invisible normalmente
            ]
          }
        });

        map.current!.addLayer({
          id: 'municipios-interactive',
          type: 'fill',
          source: 'municipios-source',
          paint: {
            'fill-color': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              '#8B5CF6', // Púrpura cuando hover
              '#000000'  // Negro transparente normalmente
            ],
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              0.4,  // Más visible en hover
              0     // Invisible normalmente
            ]
          }
        });

        console.log('✅ Local GeoJSON layers added successfully');

        // Force resize to ensure canvas dimensions match container
        setTimeout(() => {
          if (map.current) {
            map.current.resize();
            const canvas = map.current.getCanvas();
            console.log('🖼️ Canvas dimensions:', {
              width: canvas.width,
              height: canvas.height,
              clientWidth: canvas.clientWidth,
              clientHeight: canvas.clientHeight,
              offsetWidth: canvas.offsetWidth,
              offsetHeight: canvas.offsetHeight
            });
            console.log('🖼️ Canvas style:', {
              position: canvas.style.position,
              zIndex: canvas.style.zIndex,
              pointerEvents: canvas.style.pointerEvents
            });
          }
        }, 100);
      } catch (error) {
        console.error('❌ Error loading local GeoJSON:', error);
      }

      setIsLoaded(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Build geographic data index when map loads
  useEffect(() => {
    if (!isLoaded) return;

    const loadGeographicIndex = async () => {
      setIsIndexLoading(true);
      try {
        console.log('🗺️ Building geographic data index...');
        await buildGeographicIndex();
        console.log('✅ Geographic data index ready');
      } catch (error) {
        console.error('❌ Error building geographic index:', error);
      } finally {
        setIsIndexLoading(false);
      }
    };

    loadGeographicIndex();
  }, [isLoaded]);

  // ResizeObserver para asegurar que el mapa se ajuste al contenedor
  useEffect(() => {
    if (!mapContainer.current || !map.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (map.current) {
        map.current.resize();
      }
    });

    resizeObserver.observe(mapContainer.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isLoaded]);

  // Actualizar marcadores cuando cambien las coberturas
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    // Limpiar marcadores existentes
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Filtrar coberturas que tienen coordenadas
    const coveragesWithCoords = coverages.filter(coverage =>
      coverage.coordinates &&
      coverage.coordinates.lat &&
      coverage.coordinates.lng
    );

    // Crear nuevos marcadores
    coveragesWithCoords.forEach(coverage => {
      if (!coverage.coordinates) return;

      const color = getCoverageColor(coverage.coverage_type);
      const size = getMarkerSize(coverage.coverage_type);

      // Crear elemento del marcador personalizado
      const markerElement = document.createElement('div');
      markerElement.className = 'coverage-marker';
      markerElement.style.cssText = `
        width: ${size * 2}px;
        height: ${size * 2}px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size - 2}px;
        color: white;
        font-weight: bold;
      `;

      // Agregar ícono según tipo
      const icons: Record<CoverageType, string> = {
        pais: '🌍',
        departamento: '🏛️',
        ciudad: '🏙️',
        zona: '📍',
        region: '🗺️'
      };
      markerElement.textContent = icons[coverage.coverage_type] || '📍';

      // Efectos hover
      markerElement.addEventListener('mouseenter', () => {
        markerElement.style.transform = 'scale(1.2)';
        markerElement.style.zIndex = '1000';
      });

      markerElement.addEventListener('mouseleave', () => {
        markerElement.style.transform = 'scale(1)';
        markerElement.style.zIndex = 'auto';
      });

      // Crear marcador
      const marker = new mapboxgl.Marker({
        element: markerElement,
        anchor: 'center'
      })
        .setLngLat([coverage.coordinates.lng, coverage.coordinates.lat])
        .addTo(map.current!);

      // Crear popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        closeOnMove: false, // ✅ Evitar cierre al mover el mapa
        focusAfterOpen: false, // ✅ Evitar cambios de foco automáticos
        className: 'coverage-popup'
      }).setHTML(`
        <div class="p-3">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-lg">${icons[coverage.coverage_type]}</span>
            <h3 class="font-semibold text-gray-900">${coverage.name}</h3>
          </div>
          ${coverage.parent_name ? `<p class="text-sm text-gray-600 mb-1">${coverage.parent_name}</p>` : ''}
          ${coverage.description ? `<p class="text-sm text-gray-600 mb-2">${coverage.description}</p>` : ''}
          <div class="flex items-center gap-2 text-xs">
            <span class="px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">
              ${coverage.coverage_type}
            </span>
            <span class="px-2 py-1 rounded-full bg-blue-100 text-blue-700 capitalize">
              ${coverage.relevance}
            </span>
          </div>
        </div>
      `);

      // Eventos del marcador
      markerElement.addEventListener('click', (e) => {
        e.stopPropagation();
        marker.setPopup(popup).togglePopup();
        stableOnCoverageClick(coverage);
      });

      markersRef.current.push(marker);
    });

    // Ajustar vista si hay marcadores
    if (coveragesWithCoords.length > 0) {
      const coordinates = coveragesWithCoords.map(c => [c.coordinates!.lng, c.coordinates!.lat] as [number, number]);

      if (coordinates.length === 1) {
        // Un solo marcador - centrar con zoom apropiado
        map.current!.flyTo({
          center: coordinates[0],
          zoom: 10,
          duration: 1000
        });
      } else {
        // Múltiples marcadores - ajustar bounds
        const bounds = new mapboxgl.LngLatBounds();
        coordinates.forEach(coord => bounds.extend(coord));

        map.current!.fitBounds(bounds, {
          padding: 50,
          duration: 1000,
          maxZoom: 12
        });
      }
    }
  }, [coverages, isLoaded]);

  // Actualizar filtros de boundaries cuando cambien las coberturas
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    try {
      const departamentos = coverages
        .filter(c => c.coverage_type === 'departamento')
        .map(c => c.name);

      const municipios = coverages
        .filter(c => c.coverage_type === 'ciudad')
        .map(c => c.name);

      // Highlight logic
      if (map.current.getLayer('departamentos-fill')) {
        if (departamentos.length > 0) {
          map.current.setFilter('departamentos-fill', ['in', ['get', 'Departamento'], ['literal', departamentos]]);
          map.current.setPaintProperty('departamentos-outline', 'line-width', 2);
          map.current.setPaintProperty('departamentos-outline', 'line-opacity', 1);
        } else {
          // If no active department coverages, show nothing or all faint? 
          // Plan implies Highlighting active ones.
          map.current.setFilter('departamentos-fill', ['==', '1', '0']); // Hide fill
          map.current.setPaintProperty('departamentos-outline', 'line-width', 1);
          map.current.setPaintProperty('departamentos-outline', 'line-opacity', 0.3);
        }
      }

      if (map.current.getLayer('municipios-fill')) {
        if (municipios.length > 0) {
          map.current.setFilter('municipios-fill', ['in', ['get', 'Municipio'], ['literal', municipios]]);
          map.current.setPaintProperty('municipios-outline', 'line-width', 1.5);
          map.current.setPaintProperty('municipios-outline', 'line-opacity', 1);
        } else {
          map.current.setFilter('municipios-fill', ['==', '1', '0']);
          map.current.setPaintProperty('municipios-outline', 'line-width', 0.5);
          map.current.setPaintProperty('municipios-outline', 'line-opacity', 0.3);
        }
      }

    } catch (error) {
      console.warn('⚠️ Could not update boundary filters:', error);
    }
  }, [coverages, isLoaded]);

  // Interactividad (Hover & Click)
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    console.log('🖱️ Initializing map interactivity with queryRenderedFeatures...');
    const interactiveLayers = ['municipios-interactive', 'departamentos-interactive'];

    // Verify layers exist
    interactiveLayers.forEach(layerId => {
      const layer = map.current?.getLayer(layerId);
      console.log(`📍 Layer "${layerId}" exists:`, !!layer);
    });

    // Track hovered feature for visual feedback
    let hoveredFeatureId: string | number | undefined = undefined;
    let hoveredFeatureSource: string | undefined = undefined;
    let currentRequestId = 0; // Track async request to prevent stale updates


    // Mousemove: Change cursor AND highlight polygon AND show tooltip
    const mousemoveHandler = async (e: mapboxgl.MapMouseEvent) => {
      if (!map.current) return;

      // Filter layers based on active view mode
      const activeLayers = viewModeRef.current === 'departamentos'
        ? ['departamentos-interactive']
        : ['municipios-interactive'];

      const features = map.current.queryRenderedFeatures(e.point, {
        layers: activeLayers
      });

      // Reset previous hover state
      if (hoveredFeatureId !== undefined && hoveredFeatureSource) {
        map.current.setFeatureState(
          { source: hoveredFeatureSource, id: hoveredFeatureId },
          { hover: false }
        );
      }

      if (features.length > 0) {
        map.current.getCanvas().style.cursor = 'pointer';

        // Set new hover state
        const feature = features[0];
        const featureId = feature.id;
        const sourceLayer = feature.layer?.id;

        if (featureId !== undefined && sourceLayer) {
          // Get source from layer
          const source = sourceLayer.includes('municipios')
            ? 'municipios-source'
            : 'departamentos-source';

          hoveredFeatureId = featureId;
          hoveredFeatureSource = source;

          map.current.setFeatureState(
            { source: source, id: featureId },
            { hover: true }
          );

          // Get name from properties - directly from feature
          const props = feature.properties || {};
          console.log('🔍 Source:', source, 'Feature ID:', featureId, 'Properties:', JSON.stringify(props));

          let municipio: string | undefined;
          let departamento: string;
          let displayName: string;

          if (source === 'municipios-source') {
            const muniName = String(props.Municipio || props.NAME || props.novenombre || 'Sin nombre');
            municipio = muniName;
            departamento = String(props.Departamento || props.DEPARTAMEN || props.DEPTO || props.admin_1 || props.parent_name || 'Sin Departamento');
            displayName = muniName;
          } else {
            departamento = String(props.Departamento || props.DEPARTAMEN || props.DEPTO || props.NAME || props.novenombre || props.admin_1 || 'Sin nombre');
            displayName = departamento;
            municipio = undefined;
          }

          console.log(`📍 Detected: Dept="${departamento}", Muni="${municipio || 'N/A'}"`);

          // Track this request to prevent stale updates
          const thisRequestId = ++currentRequestId;

          // Update tooltip immediately with location info
          setHoveredInfo({
            name: displayName,
            departamento,
            municipio,
            x: e.originalEvent.clientX,
            y: e.originalEvent.clientY
          });

          // Fetch geographic data asynchronously
          try {
            const geoData = await getGeographicData(departamento, municipio);
            // Only update if this is still the current request
            if (thisRequestId === currentRequestId) {
              console.log('📦 GeoData found:', geoData?.actors?.length || 0, 'actors');
              setHoveredGeoData(geoData);
            } else {
              console.log('⏭️ Skipping stale response for request', thisRequestId);
            }
          } catch (error) {
            console.error('Error fetching geographic data:', error);
            if (thisRequestId === currentRequestId) {
              setHoveredGeoData(null);
            }
          }
        }
      } else {
        map.current.getCanvas().style.cursor = '';
        setHoveredInfo(null);
        setHoveredGeoData(null);
        hoveredFeatureId = undefined;
        hoveredFeatureSource = undefined;
        currentRequestId++; // Invalidate any pending async requests
      }
    };

    // Handler for when mouse leaves the map area
    const mouseleaveHandler = () => {
      if (!map.current) return;
      map.current.getCanvas().style.cursor = '';
      setHoveredInfo(null);
      setHoveredGeoData(null);
      if (hoveredFeatureId !== undefined && hoveredFeatureSource) {
        map.current.setFeatureState(
          { source: hoveredFeatureSource, id: hoveredFeatureId },
          { hover: false }
        );
      }
      hoveredFeatureId = undefined;
      hoveredFeatureSource = undefined;
      currentRequestId++; // Invalidate pending requests
    };

    map.current.on('mousemove', mousemoveHandler);
    map.current.on('mouseleave', mouseleaveHandler);
    console.log('✅ Mouse listeners attached');


    // Remove listener on cleanup to prevent duplicates/closure issues
    return () => {
      if (map.current) {
        map.current.off('mousemove', mousemoveHandler);
        map.current.off('mouseleave', mouseleaveHandler);
      }
    };

    // Click: Open popup
    const clickHandler = (e: mapboxgl.MapMouseEvent) => {
      if (!map.current) return;

      console.log('👆 Map clicked at:', e.lngLat);

      const features = map.current.queryRenderedFeatures(e.point, {
        layers: interactiveLayers
      });
      console.log(`Found ${features.length} features at click point`);

      if (features.length > 0) {
        const feature = features[0]; // Get the top-most feature
        const layerId = feature.layer?.id;

        if (!layerId) return;

        console.log('🎯 Clicked feature in layer:', layerId, feature.properties);

        if (layerId.includes('departamentos')) {
          const name = feature.properties?.Departamento;
          if (name) {
            new mapboxgl.Popup()
              .setLngLat(e.lngLat)
              .setHTML(`
                <div class="p-3">
                  <h3 class="font-semibold text-gray-900 mb-2">🏛️ ${name}</h3>
                  <p class="text-sm text-gray-600 mb-3">Departamento</p>
                  <button 
                    onclick="window.addCoverageFromMap('departamento', '${name}')"
                    class="w-full px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                  >
                    ➕ Agregar como Cobertura
                  </button>
                </div>
              `)
              .addTo(map.current!);
          }
        } else if (layerId.includes('municipios')) {
          const name = feature.properties?.Municipio;
          const dept = feature.properties?.Departamento;

          if (name) {
            new mapboxgl.Popup()
              .setLngLat(e.lngLat)
              .setHTML(`
                 <div class="p-3">
                   <h3 class="font-semibold text-gray-900 mb-1">🏙️ ${name}</h3>
                   <p class="text-xs text-gray-500 mb-3">${dept || 'Guatemala'}</p>
                   <button 
                     onclick="window.addCoverageFromMap('ciudad', '${name}', '${dept || ''}')"
                     class="w-full px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                   >
                     ➕ Agregar como Cobertura
                   </button>
                 </div>
               `)
              .addTo(map.current!);
          }
        }
      }
    };

    map.current.on('click', clickHandler);
    console.log('✅ Click listener attached');

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.off('mousemove', mousemoveHandler);
        map.current.off('click', clickHandler);
        console.log('🧹 Event listeners cleaned up');
      }
    };

  }, [isLoaded]);

  // Función para centrar en Guatemala
  const centerOnGuatemala = () => {
    if (map.current) {
      map.current.flyTo({
        center: GUATEMALA_CENTER,
        zoom: 7,
        duration: 1000
      });
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Resize map when fullscreen changes
  useEffect(() => {
    if (map.current) {
      // Small delay to allow layout to update
      setTimeout(() => {
        map.current?.resize();
      }, 100);
    }
  }, [isFullscreen]);

  // Contar coberturas por tipo
  const coverageStats = coverages.reduce((acc, coverage) => {
    acc[coverage.coverage_type] = (acc[coverage.coverage_type] || 0) + 1;
    return acc;
  }, {} as Record<CoverageType, number>);

  const coveragesWithCoords = coverages.filter(c => c.coordinates);

  // Toggle layer visibility based on viewMode
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    // Helper to safely set layout property
    const setVisibility = (layerId: string, visible: boolean) => {
      if (map.current?.getLayer(layerId)) {
        map.current.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      }
    };

    if (viewMode === 'departamentos') {
      // Show Departments
      setVisibility('departamentos-interactive', true);
      setVisibility('departamentos-outline', true);
      setVisibility('departamentos-fill', true);
      // Hide Municipalities
      setVisibility('municipios-interactive', false);
      setVisibility('municipios-outline', false);
      setVisibility('municipios-fill', false);
    } else if (viewMode === 'municipios') {
      // Show Municipalities
      setVisibility('municipios-interactive', true);
      setVisibility('municipios-outline', true);
      setVisibility('municipios-fill', true);
      // Hide Departments
      setVisibility('departamentos-interactive', false);
      setVisibility('departamentos-outline', false);
      setVisibility('departamentos-fill', false);
    } else if (viewMode === 'especifico') {
      // Hide ALL boundaries - show clean map
      setVisibility('departamentos-interactive', false);
      setVisibility('departamentos-outline', false);
      setVisibility('departamentos-fill', false);
      setVisibility('municipios-interactive', false);
      setVisibility('municipios-outline', false);
      setVisibility('municipios-fill', false);
    }

  }, [viewMode, isLoaded]);

  // Handle clicks in "especifico" mode to add pins
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    const handlePinClick = (e: mapboxgl.MapMouseEvent) => {
      // Only handle in especifico mode
      if (viewModeRef.current !== 'especifico') return;

      const { lngLat } = e;
      const newPin = {
        id: `pin_${Date.now()}`,
        lat: lngLat.lat,
        lng: lngLat.lng,
        name: `Ubicación ${pinnedLocations.length + 1}`
      };

      console.log('📍 Adding pin at:', lngLat);

      // Add to state
      setPinnedLocations(prev => [...prev, newPin]);
    };

    map.current.on('click', handlePinClick);

    return () => {
      if (map.current) {
        map.current.off('click', handlePinClick);
      }
    };
  }, [isLoaded, pinnedLocations.length]);

  // Render pinned location markers
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    // Clear existing pinned markers
    pinnedMarkersRef.current.forEach(marker => marker.remove());
    pinnedMarkersRef.current = [];

    // Create markers for each pinned location
    pinnedLocations.forEach(pin => {
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'pinned-location-marker';
      el.style.cssText = `
        width: 32px;
        height: 32px;
        background-color: #f97316;
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      const inner = document.createElement('div');
      inner.style.cssText = `
        width: 10px;
        height: 10px;
        background-color: white;
        border-radius: 50%;
        transform: rotate(45deg);
      `;
      el.appendChild(inner);

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true
      }).setHTML(`
        <div class="p-3">
          <h3 class="font-semibold text-gray-900 mb-1">📍 ${pin.name || 'Sin nombre'}</h3>
          <p class="text-xs text-gray-500 mb-2">
            ${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}
          </p>
          <button 
            onclick="window.removePinnedLocation && window.removePinnedLocation('${pin.id}')"
            class="w-full px-3 py-1.5 bg-red-500 text-white rounded text-xs hover:bg-red-600"
          >
            🗑️ Eliminar
          </button>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([pin.lng, pin.lat])
        .setPopup(popup)
        .addTo(map.current!);

      pinnedMarkersRef.current.push(marker);
    });

    // Expose remove function to window for popup button
    (window as any).removePinnedLocation = (pinId: string) => {
      setPinnedLocations(prev => prev.filter(p => p.id !== pinId));
    };

    return () => {
      delete (window as any).removePinnedLocation;
    };
  }, [pinnedLocations, isLoaded]);

  return (
    <>
      {/* Mapa normal con capacidad de Fullscreen via CSS */}
      <div
        className={`bg-white rounded-lg overflow-hidden shadow-sm border flex flex-col transition-all duration-300 ease-in-out ${isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen m-0 rounded-none' : 'relative'
          } ${className}`}
        style={{ height: isFullscreen ? '100vh' : height }}
      >
        {/* Warning banner if no coordinates */}
        {coveragesWithCoords.length === 0 && isLoaded && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-yellow-800 text-sm">
              <FiAlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>
                Este proyecto no tiene coordenadas geográficas. Agrega ubicaciones para verlas en el mapa.
              </span>
            </div>
            {!isFullscreen && (
              <button
                onClick={() => {/* Maybe dismiss? Or just leave it */ }}
                className="text-yellow-600 hover:text-yellow-800"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Header del mapa */}
        <div className="flex-shrink-0 bg-white/90 backdrop-blur-sm border-b border-gray-200 p-3 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <FiLayers className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">
                  Mapa de Coberturas
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {coveragesWithCoords.length} de {coverages.length} con coordenadas
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={centerOnGuatemala}
                className="p-1.5 rounded text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title="Centrar en Guatemala"
              >
                <FiTarget className="w-4 h-4" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title={isFullscreen ? "Salir de pantalla completa" : "Expandir mapa"}
              >
                {isFullscreen ? <FiMinimize2 className="w-4 h-4" /> : <FiMaximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Controles de Vista */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('departamentos')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'departamentos'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
                }`}
            >
              Departamentos
            </button>
            <button
              onClick={() => setViewMode('municipios')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'municipios'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
                }`}
            >
              Municipios
            </button>
            <button
              onClick={() => setViewMode('especifico')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${viewMode === 'especifico'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
                }`}
            >
              <FiMapPin className="w-3 h-3" />
              Específico
            </button>
          </div>

          {/* Leyenda */}
          <div className="flex items-center gap-4 mt-2 text-xs">
            {Object.entries(coverageStats).map(([type, count]) => (
              <div key={type} className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getCoverageColor(type as CoverageType) }}
                />
                <span className="text-gray-600 capitalize">
                  {type}: {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Contenedor del mapa normal */}
        <div
          ref={mapContainer}
          className="flex-1 w-full relative"
        />

        {/* Loading indicator */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-600">
              <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
              <span className="text-sm">Cargando mapa...</span>
            </div>
          </div>
        )}


        {/* Enriched tooltip with geographic data */}
        {hoveredInfo && (
          <EnrichedTooltip
            departamento={hoveredInfo.departamento}
            municipio={hoveredInfo.municipio}
            data={hoveredGeoData}
            x={hoveredInfo.x}
            y={hoveredInfo.y}
          />
        )}

      </div>
    </>
  );
}

// Componente separado para el mapa en modal
