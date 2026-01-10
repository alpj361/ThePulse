/**
 * Hook for automatically converting existing string data to location type with coordinates
 */

import { useState, useCallback } from 'react';
import { LocationValue } from '../types/datasetEditor';
import { detectBoundaryLevel } from '../services/geoJsonLoader';
import { geocodeLocation } from '../services/geocoding';

interface ConversionProgress {
  completed: number;
  total: number;
  isConverting: boolean;
  errors: string[];
}

export function useLocationTypeConverter() {
  const [progress, setProgress] = useState<ConversionProgress>({
    completed: 0,
    total: 0,
    isConverting: false,
    errors: []
  });

  const convertDataToLocationValues = useCallback(async (
    data: any[],
    columnKey: string,
    options?: {
      forceReconvert?: boolean;  // Force reconversion even if already LocationValue
      boundaryLevel?: 'level1' | 'level2';  // Target boundary level
      locationType?: 'boundary' | 'coordinates';  // Target location type
      coordinatesColumn?: string;  // Column that contains coordinates (for locationType='coordinates')
    }
  ): Promise<any[]> => {
    if (!data || data.length === 0) {
      return data;
    }

    const { forceReconvert = false, boundaryLevel, locationType, coordinatesColumn } = options || {};

    // Si es locationType='coordinates' y hay una columna de coordenadas, usar esas coordenadas
    if (locationType === 'coordinates' && coordinatesColumn) {
      console.log(`📍 Using coordinates from column "${coordinatesColumn}" for location column "${columnKey}"`);

      const convertedData = data.map(row => {
        const coordValue = row[coordinatesColumn];
        const locationName = row[columnKey];

        if (!coordValue) {
          return row;
        }

        let coordinates: { lat: number; lng: number } | undefined;

        // Parse coordinates from different formats
        if (typeof coordValue === 'object' && coordValue.lat !== undefined && coordValue.lng !== undefined) {
          coordinates = { lat: Number(coordValue.lat), lng: Number(coordValue.lng) };
        } else if (typeof coordValue === 'string') {
          // Try to parse "lat, lng" format
          const parts = coordValue.split(',').map(s => s.trim());
          if (parts.length === 2) {
            const lat = parseFloat(parts[0]);
            const lng = parseFloat(parts[1]);
            if (!isNaN(lat) && !isNaN(lng)) {
              coordinates = { lat, lng };
            }
          }
        }

        if (coordinates) {
          const displayName = typeof locationName === 'string' ? locationName :
            (typeof locationName === 'object' ? (locationName.municipality || locationName.formatted_address || '') : '');

          return {
            ...row,
            [columnKey]: {
              municipality: displayName,
              formatted_address: displayName,
              coordinates,
              is_boundary: false,
              boundary_type: 'place'
            }
          };
        }

        return row;
      });

      return convertedData;
    }

    setProgress({
      completed: 0,
      total: data.length,
      isConverting: true,
      errors: []
    });

    console.log('🔄 convertDataToLocationValues starting:', {
      column: columnKey,
      rows: data.length,
      forceReconvert,
      boundaryLevel,
      locationType
    });

    try {
      // Extract unique location names to avoid duplicate processing
      const uniqueLocationNames = new Set<string>();
      data.forEach(row => {
        const value = row[columnKey];
        if (value) {
          // Handle both string and object values
          if (typeof value === 'string' && value.trim()) {
            uniqueLocationNames.add(value.trim());
          } else if (forceReconvert && typeof value === 'object') {
            // For re-conversion, extract the name from existing LocationValue
            const name = value.municipality || value.department || value.formatted_address;
            if (name && typeof name === 'string') {
              uniqueLocationNames.add(name.trim());
            }
          }
        }
      });

      const locationNames = Array.from(uniqueLocationNames);
      console.log(`🗺️ Processing ${locationNames.length} unique locations`);

      const locationResults = new Map<string, LocationValue>();

      // Process each unique location name
      for (let i = 0; i < locationNames.length; i++) {
        const locationName = locationNames[i];

        if (locationName && locationName.trim()) {
          const trimmedName = locationName.trim();

          try {
            // First try boundary detection (administrative boundaries)
            // Pass boundaryLevel to filter by level1 (departamentos) or level2 (municipios)
            const boundaryDetection = await detectBoundaryLevel(trimmedName, boundaryLevel);

            if (boundaryDetection.isBoundary && boundaryDetection.matches.length > 0) {
              // Found boundary match - use the first/best match
              const boundary = boundaryDetection.matches[0];

              const locationValue: LocationValue = {
                municipality: boundary.type === 'municipio' ? boundary.name : '',
                department: boundary.type === 'departamento' ? boundary.name : boundary.department,
                coordinates: boundary.coordinates,
                formatted_address: boundary.type === 'departamento'
                  ? `${boundary.name} (Departamento), Guatemala`
                  : `${boundary.name}, ${boundary.department || 'Guatemala'}, Guatemala`,
                boundary_id: boundary.id,
                boundary_type: boundary.type,
                geometry: boundary.geometry,
                is_boundary: true,
                geocode_failed: false
              };

              locationResults.set(trimmedName, locationValue);
            } else {
              // Not a boundary, try external geocoding (Nominatim)
              const geocodingResult = await geocodeLocation(trimmedName);

              if (geocodingResult) {
                const locationValue: LocationValue = {
                  municipality: trimmedName,
                  formatted_address: geocodingResult.formatted_address,
                  coordinates: {
                    lat: geocodingResult.lat,
                    lng: geocodingResult.lng
                  },
                  is_boundary: false,
                  boundary_type: 'place',
                  geocode_failed: false
                };
                locationResults.set(trimmedName, locationValue);
              } else {
                // No coordinates found - MARK AS FAILED
                console.warn(`⚠️ Geocoding failed for "${trimmedName}" - no match found`);
                const locationValue: LocationValue = {
                  municipality: trimmedName,
                  formatted_address: trimmedName,
                  is_boundary: false,
                  boundary_type: 'place',
                  geocode_failed: true  // Mark as failed
                };
                locationResults.set(trimmedName, locationValue);

                // Track failed locations
                setProgress(prev => ({
                  ...prev,
                  errors: [...prev.errors, `No se encontró: "${trimmedName}"`]
                }));
              }
            }
          } catch (error) {
            console.error(`Error processing location "${trimmedName}":`, error);
            // Create fallback LocationValue - mark as failed
            const locationValue: LocationValue = {
              municipality: trimmedName,
              formatted_address: trimmedName,
              is_boundary: false,
              boundary_type: 'place',
              geocode_failed: true  // Mark as failed due to error
            };
            locationResults.set(trimmedName, locationValue);

            // Track error
            setProgress(prev => ({
              ...prev,
              errors: [...prev.errors, `Error geocodificando: "${trimmedName}"`]
            }));
          }
        }

        // Update progress
        setProgress(prev => ({
          ...prev,
          completed: Math.floor(((i + 1) / locationNames.length) * data.length),
        }));

        // Rate limiting: wait 300ms between processing to be respectful
        if (i < locationNames.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      // Convert the data using processed results
      const convertedData = data.map((row) => {
        const originalValue = row[columnKey];

        if (!originalValue) {
          return row;
        }

        // Get the lookup key based on value type
        let lookupKey: string;
        if (typeof originalValue === 'string') {
          lookupKey = originalValue.trim();
        } else if (forceReconvert && typeof originalValue === 'object') {
          // For re-conversion, extract the name from existing LocationValue
          lookupKey = originalValue.municipality || originalValue.department || originalValue.formatted_address || '';
          if (!lookupKey) return row;
          lookupKey = lookupKey.trim();
        } else {
          return row;
        }

        const locationResult = locationResults.get(lookupKey);

        return {
          ...row,
          [columnKey]: locationResult || {
            municipality: lookupKey,
            formatted_address: lookupKey,
            is_boundary: false,
            boundary_type: 'place'
          }
        };
      });

      setProgress(prev => ({
        ...prev,
        completed: data.length,
        isConverting: false
      }));

      return convertedData;

    } catch (error) {
      console.error('Error converting data to location values:', error);
      setProgress(prev => ({
        ...prev,
        isConverting: false,
        errors: [...prev.errors, error instanceof Error ? error.message : 'Unknown error']
      }));

      return data; // Return original data if conversion fails
    }
  }, []);

  const resetProgress = useCallback(() => {
    setProgress({
      completed: 0,
      total: 0,
      isConverting: false,
      errors: []
    });
  }, []);

  return {
    convertDataToLocationValues,
    progress,
    resetProgress
  };
}