import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Coverage, CoverageType } from '../../services/coverages';
import { FiMaximize2, FiMinimize2, FiLayers, FiTarget, FiX } from 'react-icons/fi';

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

    // Configurar controles
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    // Event listener para cuando el mapa esté cargado
    map.current.on('load', () => {
      setIsLoaded(true);
    });

    // Cleanup al desmontar
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

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
  }, [coverages, isLoaded]); // ✅ Eliminar onCoverageClick de dependencias

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

  // Contar coberturas por tipo
  const coverageStats = coverages.reduce((acc, coverage) => {
    acc[coverage.coverage_type] = (acc[coverage.coverage_type] || 0) + 1;
    return acc;
  }, {} as Record<CoverageType, number>);

  const coveragesWithCoords = coverages.filter(c => c.coordinates);

  return (
    <>
      {/* Mapa normal */}
      <div className={`relative bg-white rounded-lg overflow-hidden shadow-sm border ${className}`}>
        {/* Header del mapa */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-200 p-3">
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
                title="Expandir mapa"
              >
                <FiMaximize2 className="w-4 h-4" />
              </button>
            </div>
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
          className="w-full"
          style={{ 
            height: height,
            paddingTop: '80px'
          }}
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

        {/* Mensaje cuando no hay coordenadas */}
        {coveragesWithCoords.length === 0 && isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/90 backdrop-blur-sm">
            <div className="text-center p-6">
              <FiLayers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sin coordenadas geográficas
              </h3>
              <p className="text-sm text-gray-600 max-w-sm">
                Las coberturas de este proyecto no tienen coordenadas geográficas asignadas.
                Agrega coordenadas para visualizarlas en el mapa.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de mapa expandido */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full h-full max-w-7xl max-h-full flex flex-col overflow-hidden">
            {/* Header del modal */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <FiLayers className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Mapa de Coberturas - Vista Expandida
                  </h2>
                </div>
                <div className="text-sm text-gray-500">
                  {coveragesWithCoords.length} de {coverages.length} con coordenadas
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={centerOnGuatemala}
                  className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  title="Centrar en Guatemala"
                >
                  <FiTarget className="w-5 h-5" />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  title="Cerrar vista expandida"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Leyenda en modal */}
            <div className="flex items-center gap-6 px-4 py-2 bg-gray-50 border-b border-gray-200">
              {Object.entries(coverageStats).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getCoverageColor(type as CoverageType) }}
                  />
                  <span className="text-sm text-gray-700 capitalize font-medium">
                    {type}: {count}
                  </span>
                </div>
              ))}
            </div>

                         {/* Contenedor del mapa expandido */}
             <div className="flex-1 relative">
               <FullscreenMap 
                 coverages={coverages}
                 onCoverageClick={onCoverageClick}
               />
             </div>
          </div>
        </div>
      )}
    </>
  );
}

// Componente separado para el mapa en modal
function FullscreenMap({ 
  coverages, 
  onCoverageClick 
}: { 
  coverages: Coverage[];
  onCoverageClick?: (coverage: Coverage) => void;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Estabilizar función de click para evitar recreaciones
  const stableOnCoverageClick = useCallback((coverage: Coverage) => {
    if (onCoverageClick) {
      onCoverageClick(coverage);
    }
  }, [onCoverageClick]);

  // Inicializar mapa del modal
  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: GUATEMALA_CENTER,
      zoom: 7,
      maxBounds: GUATEMALA_BOUNDS,
      attributionControl: false
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    map.current.on('load', () => {
      setIsLoaded(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Actualizar marcadores en el modal
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    // Limpiar marcadores existentes
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const coveragesWithCoords = coverages.filter(coverage => 
      coverage.coordinates && 
      coverage.coordinates.lat && 
      coverage.coordinates.lng
    );

    // Crear marcadores
    coveragesWithCoords.forEach(coverage => {
      if (!coverage.coordinates) return;

      const color = getCoverageColor(coverage.coverage_type);
      const size = getMarkerSize(coverage.coverage_type);

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

      const icons: Record<CoverageType, string> = {
        pais: '🌍',
        departamento: '🏛️', 
        ciudad: '🏙️',
        zona: '📍',
        region: '🗺️'
      };
      markerElement.textContent = icons[coverage.coverage_type] || '📍';

      markerElement.addEventListener('mouseenter', () => {
        markerElement.style.transform = 'scale(1.2)';
        markerElement.style.zIndex = '1000';
      });

      markerElement.addEventListener('mouseleave', () => {
        markerElement.style.transform = 'scale(1)';
        markerElement.style.zIndex = 'auto';
      });

      const marker = new mapboxgl.Marker({
        element: markerElement,
        anchor: 'center'
      })
        .setLngLat([coverage.coordinates.lng, coverage.coordinates.lat])
        .addTo(map.current!);

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
        map.current!.flyTo({
          center: coordinates[0],
          zoom: 10,
          duration: 1000
        });
      } else {
        const bounds = new mapboxgl.LngLatBounds();
        coordinates.forEach(coord => bounds.extend(coord));
        
        map.current!.fitBounds(bounds, {
          padding: 50,
          duration: 1000,
          maxZoom: 12
        });
      }
    }
  }, [coverages, isLoaded]); // ✅ Eliminar onCoverageClick de dependencias

  return (
    <div className="w-full h-full relative">
      <div 
        ref={mapContainer}
        className="w-full h-full"
      />
      
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-600">
            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
            <span className="text-sm">Cargando mapa expandido...</span>
          </div>
        </div>
      )}
    </div>
  );
} 