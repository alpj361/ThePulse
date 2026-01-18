import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip
} from '@mui/material';
import { FiMapPin, FiGlobe, FiLayers, FiInfo } from 'react-icons/fi';
import { LocationValue } from '../../../types/datasetEditor';
import { supabase } from '../../../services/supabase';
import { geocodeLocation } from '../../../services/geocoding';
import {
  searchGuatemalaBoundaries,
  detectBoundaryLevel,
  BoundaryLocation
} from '../../../services/geoJsonLoader';

interface LocationOption {
  department: string;
  municipality: string;
  coordinates?: { lat: number; lng: number };
  formatted_address: string;
  // Enhanced for boundary support
  boundary_id?: string;
  boundary_type?: 'departamento' | 'municipio' | 'place';
  geometry?: any;
  is_boundary?: boolean;
}

interface LocationColumnProps {
  value: LocationValue | null;
  onChange: (value: LocationValue | null) => void;
  searchScope?: 'guatemala' | 'worldwide';
  boundaryLevel?: 'auto' | 'boundary' | 'place';
  disabled?: boolean;
  focus?: boolean;
}

const LocationColumnEditor: React.FC<LocationColumnProps> = ({
  value,
  onChange,
  searchScope = 'guatemala',
  boundaryLevel = 'auto',
  disabled = false,
  focus = false
}) => {
  const [options, setOptions] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [detectedMode, setDetectedMode] = useState<'boundary' | 'place'>('boundary');
  const [userMode, setUserMode] = useState<'boundary' | 'place' | 'auto'>('auto');

  // Load boundary locations from GeoJSON data
  const loadBoundaryLocations = async (searchTerm: string = '') => {
    if (!searchTerm || searchTerm.length < 2) {
      setOptions([]);
      return;
    }

    try {
      setLoading(true);

      // Search boundaries using GeoJSON data
      const boundaries = await searchGuatemalaBoundaries(searchTerm);

      const boundaryOptions: LocationOption[] = boundaries.map(boundary => ({
        department: boundary.type === 'departamento' ? boundary.name : (boundary.department || ''),
        municipality: boundary.type === 'municipio' ? boundary.name : '',
        coordinates: boundary.coordinates,
        formatted_address: boundary.type === 'departamento'
          ? `${boundary.name} (Departamento), Guatemala`
          : `${boundary.name}, ${boundary.department || 'Guatemala'}, Guatemala`,
        boundary_id: boundary.id,
        boundary_type: boundary.type,
        geometry: boundary.geometry,
        is_boundary: true
      }));

      setOptions(boundaryOptions);
    } catch (error) {
      console.error('Error loading boundary locations:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Load place locations from coverages table (fallback/place mode)
  const loadPlaceLocations = async (searchTerm: string = '') => {
    if (!searchTerm || searchTerm.length < 2) {
      setOptions([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coverages')
        .select(`
          departamento,
          municipio,
          lat,
          lng
        `)
        .or(`departamento.ilike.%${searchTerm}%,municipio.ilike.%${searchTerm}%`)
        .limit(20);

      if (error) throw error;

      const locationOptions: LocationOption[] = data?.map(item => ({
        department: item.departamento,
        municipality: item.municipio,
        coordinates: item.lat && item.lng ? {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lng)
        } : undefined,
        formatted_address: `${item.municipio}, ${item.departamento}, Guatemala`,
        boundary_type: 'place',
        is_boundary: false
      })) || [];

      setOptions(locationOptions);
    } catch (error) {
      console.error('Error loading place locations:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // For worldwide search, we'd integrate with Google Maps API or similar
  const loadWorldwideLocations = async (searchTerm: string = '') => {
    // TODO: Implement Google Maps Places API integration
    // For now, provide manual input fallback
    setOptions([]);
  };

  // Auto-detect boundary vs place based on input
  const detectAndLoadLocations = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setOptions([]);
      return;
    }

    // If boundaryLevel is explicitly set, use that mode
    if (boundaryLevel === 'boundary') {
      await loadBoundaryLocations(searchTerm);
      setDetectedMode('boundary');
      return;
    }

    if (boundaryLevel === 'place') {
      await loadPlaceLocations(searchTerm);
      setDetectedMode('place');
      return;
    }

    // Auto-detect mode: check if it's likely a boundary
    if (boundaryLevel === 'auto' && searchScope === 'guatemala') {
      try {
        const detection = await detectBoundaryLevel(searchTerm);

        if (detection.isBoundary && detection.confidence > 0.7) {
          // High confidence it's a boundary, load boundary data
          await loadBoundaryLocations(searchTerm);
          setDetectedMode('boundary');
        } else {
          // Low confidence or not a boundary, fall back to place search
          await loadPlaceLocations(searchTerm);
          setDetectedMode('place');
        }
      } catch (error) {
        console.error('Error in boundary detection:', error);
        // Fallback to place search
        await loadPlaceLocations(searchTerm);
        setDetectedMode('place');
      }
    } else if (searchScope === 'worldwide') {
      await loadWorldwideLocations(searchTerm);
      setDetectedMode('place');
    }
  };

  useEffect(() => {
    // Use the current user mode override or fall back to boundary level config
    const currentMode = userMode !== 'auto' ? userMode : boundaryLevel;

    if (currentMode === 'boundary') {
      loadBoundaryLocations(inputValue);
    } else if (currentMode === 'place') {
      loadPlaceLocations(inputValue);
    } else {
      detectAndLoadLocations(inputValue);
    }
  }, [inputValue, searchScope, boundaryLevel, userMode]);

  // Automatically geocode location if it doesn't have coordinates
  const autoGeocodeLocation = async (locationValue: LocationValue) => {
    if (locationValue.coordinates) {
      return locationValue; // Already has coordinates
    }

    setGeocoding(true);
    try {
      const searchTerm = locationValue.formatted_address ||
        `${locationValue.municipality}, ${locationValue.department}` ||
        locationValue.municipality ||
        locationValue.department;

      if (searchTerm) {
        const geocodingResult = await geocodeLocation(searchTerm);
        if (geocodingResult) {
          return {
            ...locationValue,
            coordinates: {
              lat: geocodingResult.lat,
              lng: geocodingResult.lng
            },
            formatted_address: geocodingResult.formatted_address
          };
        }
      }
    } catch (error) {
      console.error('Error geocoding location:', error);
    } finally {
      setGeocoding(false);
    }

    return locationValue;
  };

  const handleLocationSelect = async (location: LocationOption | null) => {
    try {
      if (!location) {
        onChange(null);
        return;
      }

    let locationValue: LocationValue = {
      department: location.department,
      municipality: location.municipality,
      coordinates: location.coordinates,
      formatted_address: location.formatted_address,
      // Enhanced boundary support
      boundary_id: location.boundary_id,
      boundary_type: location.boundary_type,
      geometry: location.geometry,
      is_boundary: location.is_boundary
    };

      // Auto-geocode if no coordinates and not a boundary with geometry
      if (!locationValue.coordinates && !locationValue.geometry) {
        locationValue = await autoGeocodeLocation(locationValue);
      }

      onChange(locationValue);
    } catch (error) {
      console.error('Error in handleLocationSelect:', error);
    }
  };

  const getDisplayValue = () => {
    if (!value) return null;

    return options.find(opt =>
      (opt.boundary_id && value.boundary_id && opt.boundary_id === value.boundary_id) ||
      (opt.department === value.department && opt.municipality === value.municipality)
    ) || {
      department: value.department || '',
      municipality: value.municipality || '',
      coordinates: value.coordinates,
      formatted_address: value.formatted_address || `${value.municipality}, ${value.department}`,
      boundary_id: value.boundary_id,
      boundary_type: value.boundary_type,
      is_boundary: value.is_boundary
    };
  };

  const getCurrentMode = () => {
    return userMode !== 'auto' ? userMode : (boundaryLevel !== 'auto' ? boundaryLevel : detectedMode);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Mode Toggle - only show if boundaryLevel is auto or if focus is true */}
      {(boundaryLevel === 'auto' || focus) && searchScope === 'guatemala' && (
        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ToggleButtonGroup
            value={getCurrentMode()}
            exclusive
            onChange={(_, newMode) => {
              if (newMode !== null) {
                setUserMode(newMode);
              }
            }}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                fontSize: '0.7rem',
                px: 1,
                py: 0.5,
                border: '1px solid #e0e0e0',
                '&.Mui-selected': {
                  backgroundColor: '#1976d2',
                  color: 'white',
                  '&:hover': { backgroundColor: '#1565c0' }
                }
              }
            }}
          >
            <ToggleButton value="boundary">
              <FiLayers size={12} style={{ marginRight: 4 }} />
              Límites
            </ToggleButton>
            <ToggleButton value="place">
              <FiMapPin size={12} style={{ marginRight: 4 }} />
              Lugares
            </ToggleButton>
          </ToggleButtonGroup>
          <Typography variant="caption" color="text.secondary">
            {getCurrentMode() === 'boundary' ? 'Fronteras administrativas' : 'Lugares específicos'}
          </Typography>
        </Box>
      )}

      <Autocomplete
        value={getDisplayValue()}
        onChange={(_, newValue) => handleLocationSelect(newValue)}
        inputValue={inputValue}
        onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
        options={options}
        loading={loading || geocoding}
        disabled={disabled}
        getOptionLabel={(option) => option.formatted_address}
        isOptionEqualToValue={(option, value) =>
          (option.boundary_id && value.boundary_id && option.boundary_id === value.boundary_id) ||
          (option.department === value.department && option.municipality === value.municipality)
        }
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            size="small"
            placeholder={
              getCurrentMode() === 'boundary'
                ? 'Seleccionar límite administrativo...'
                : (searchScope === 'guatemala' ? 'Buscar lugar...' : 'Search location...')
            }
            autoFocus={focus}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  {geocoding ? (
                    <CircularProgress size={16} style={{ marginRight: 8, color: '#666' }} />
                  ) : getCurrentMode() === 'boundary' ? (
                    <FiLayers style={{ color: '#1976d2', marginRight: 8 }} />
                  ) : searchScope === 'guatemala' ? (
                    <FiMapPin style={{ color: '#666', marginRight: 8 }} />
                  ) : (
                    <FiGlobe style={{ color: '#666', marginRight: 8 }} />
                  )}
                  {params.InputProps.startAdornment}
                </>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { border: 'none' },
                '&:hover fieldset': { border: 'none' },
                '&.Mui-focused fieldset': { border: 'none' }
              }
            }}
          />
        )}
        renderOption={(props, option) => (
          <Paper component="li" {...props} sx={{ p: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {option.is_boundary ? (
                  <FiLayers size={14} style={{ color: '#1976d2', flexShrink: 0 }} />
                ) : (
                  <FiMapPin size={14} style={{ color: '#666', flexShrink: 0 }} />
                )}
                <Typography variant="body2" fontWeight="medium">
                  {option.municipality || option.department}
                </Typography>
                {option.is_boundary && (
                  <Chip
                    size="small"
                    label={option.boundary_type === 'departamento' ? 'DEPT' : 'MUNI'}
                    sx={{
                      height: 16,
                      fontSize: '0.6rem',
                      backgroundColor: option.boundary_type === 'departamento' ? '#e3f2fd' : '#f3e5f5',
                      color: option.boundary_type === 'departamento' ? '#1976d2' : '#7b1fa2'
                    }}
                  />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {option.department && option.municipality && `${option.department} • `}
                {option.coordinates ? 'Con coordenadas' : 'Sin coordenadas'}
              </Typography>
            </Box>
          </Paper>
        )}
        PaperComponent={({ children }) => (
          <Paper sx={{ maxHeight: 300, overflow: 'auto' }}>
            {children}
          </Paper>
        )}
      />
    </Box>
  );
};

const LocationColumnDisplay: React.FC<{ value: LocationValue | string | null }> = ({ value }) => {
  if (!value) {
    return <span style={{ color: '#999' }}>-</span>;
  }

  const displayValue = typeof value === 'string'
    ? { municipality: value, department: '', coordinates: undefined, is_boundary: false, boundary_type: 'unknown' as const, formatted_address: value, geocode_failed: false, geometry: undefined }
    : value;

  // Check if geocoding failed or has no coordinates (warning condition)
  const hasWarning = displayValue.geocode_failed || (!displayValue.coordinates && !displayValue.geometry);

  // Build tooltip content showing geocoding details
  const tooltipContent = (
    <Box sx={{ p: 1, fontSize: '12px' }}>
      <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
        Detalles de Geocodificación
      </Typography>
      {hasWarning && (
        <Typography variant="caption" sx={{ display: 'block', color: 'warning.main', mb: 0.5 }}>
          ⚠️ {displayValue.geocode_failed ? 'No se encontró coincidencia' : 'Sin coordenadas'}
        </Typography>
      )}
      {displayValue.formatted_address && (
        <Typography variant="caption" sx={{ display: 'block' }}>
          📍 {displayValue.formatted_address}
        </Typography>
      )}
      {displayValue.department && (
        <Typography variant="caption" sx={{ display: 'block' }}>
          🏛️ Departamento: {displayValue.department}
        </Typography>
      )}
      {displayValue.municipality && (
        <Typography variant="caption" sx={{ display: 'block' }}>
          🏙️ Municipio: {displayValue.municipality}
        </Typography>
      )}
      {displayValue.coordinates && (
        <Typography variant="caption" sx={{ display: 'block' }}>
          🌐 {displayValue.coordinates.lat.toFixed(4)}, {displayValue.coordinates.lng.toFixed(4)}
        </Typography>
      )}
      <Typography variant="caption" sx={{ display: 'block', color: displayValue.is_boundary ? 'primary.main' : 'text.secondary' }}>
        {displayValue.is_boundary ? '✅ Límite administrativo' : '📌 Ubicación específica'}
        {displayValue.boundary_type && ` (${displayValue.boundary_type})`}
      </Typography>
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} arrow placement="right">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'help' }}>
        {hasWarning ? (
          <span style={{ color: '#ed6c02', flexShrink: 0, fontSize: '14px' }}>⚠️</span>
        ) : displayValue.is_boundary ? (
          <FiLayers size={14} style={{ color: '#1976d2', flexShrink: 0 }} />
        ) : (
          <FiMapPin size={14} style={{ color: '#666', flexShrink: 0 }} />
        )}
        <Typography
          variant="body2"
          noWrap
          sx={{
            flex: 1,
            color: hasWarning ? 'warning.main' : 'inherit'
          }}
        >
          {displayValue.municipality || displayValue.department}
        </Typography>
        <FiInfo size={12} style={{ color: hasWarning ? '#ed6c02' : '#999', flexShrink: 0 }} />
      </Box>
    </Tooltip>
  );
};

export const createLocationColumn = (
  locationType: 'boundary' | 'coordinates' = 'boundary',
  boundaryLevel: 'level1' | 'level2' = 'level2'
) => {
  // Map new types to legacy boundaryLevel for component
  const componentBoundaryLevel = locationType === 'coordinates' ? 'place' : 'boundary';
  return {
    component: ({ rowData, setRowData, focus, disabled }: any) => {
      if (focus) {
        return (
          <LocationColumnEditor
            value={rowData || null}
            onChange={(newValue) => setRowData(newValue)}
            searchScope="guatemala"
            boundaryLevel={componentBoundaryLevel}
            focus={focus}
            disabled={disabled}
          />
        );
      }
      return <LocationColumnDisplay value={rowData || null} />;
    },
    deleteValue: () => null,
    copyValue: ({ rowData }: any) => {
      if (!rowData) return '';
      if (typeof rowData === 'string') return rowData;
      if (typeof rowData === 'object') {
        return rowData.formatted_address ||
          `${rowData.municipality || ''}, ${rowData.department || ''}`.replace(/^,\s*|,\s*$/g, '') ||
          'Ubicación';
      }
      return '';
    },
    pasteValue: ({ value }: any) => {
      if (typeof value !== 'string') return null;

      // Try to parse pasted location strings like "Guatemala, Guatemala" or "Quetzaltenango, Guatemala"
      const parts = value.split(',').map(s => s.trim());
      if (parts.length >= 2) {
        return {
          municipality: parts[0],
          department: parts[1],
          formatted_address: value,
          is_boundary: false,
          boundary_type: 'place'
        };
      }

      return {
        municipality: value,
        formatted_address: value,
        is_boundary: false,
        boundary_type: 'place'
      };
    },
    // Handle conversion from existing string data to LocationValue
    parseValue: ({ value }: any) => {
      // If it's already a LocationValue object, return it
      if (value && typeof value === 'object' && ('municipality' in value || 'department' in value)) {
        // Ensure boundary fields are set if missing
        return {
          ...value,
          is_boundary: value.is_boundary ?? false,
          boundary_type: value.boundary_type || 'place'
        };
      }

      // If it's a string, convert it to LocationValue
      if (typeof value === 'string' && value.trim()) {
        const trimmedValue = value.trim();
        const parts = trimmedValue.split(',').map(s => s.trim());

        if (parts.length >= 2) {
          return {
            municipality: parts[0],
            department: parts[1],
            formatted_address: trimmedValue,
            is_boundary: false,
            boundary_type: 'place'
          };
        }

        // For single strings (like your departamento data), treat as municipality
        return {
          municipality: trimmedValue,
          formatted_address: trimmedValue,
          is_boundary: false,
          boundary_type: 'place'
        };
      }

      return null;
    },
    // Add displayValue to handle how the cell shows when not focused
    displayValue: ({ rowData }: any) => {
      console.log('🔍 LocationColumn displayValue called with:', {
        rowData,
        type: typeof rowData,
        keys: rowData && typeof rowData === 'object' ? Object.keys(rowData) : null
      });

      if (!rowData) {
        console.log('❌ No rowData, returning empty');
        return '';
      }

      if (typeof rowData === 'string') {
        console.log('✅ String rowData:', rowData);
        return rowData;
      }

      if (typeof rowData === 'object') {
        const result = rowData.formatted_address ||
          `${rowData.municipality || ''}, ${rowData.department || ''}`.replace(/^,\s*|,\s*$/g, '') ||
          rowData.municipality ||
          rowData.department ||
          'Ubicación';
        console.log('✅ Object rowData result:', result);
        return result;
      }

      console.log('❌ Unknown rowData type:', typeof rowData);
      return '';
    },
    minWidth: 200
  };
};