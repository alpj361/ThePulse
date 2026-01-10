/**
 * Advanced Dataset Editor Component
 *
 * Features:
 * - Money columns with currency support (GTQ, USD, EUR, MXN)
 * - Location columns with Guatemala municipality search
 * - Actor/Entity/Company columns with entity linking
 * - Full spreadsheet-like editing experience
 * - Real-time save and validation
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  DataSheetGrid,
  textColumn,
  floatColumn,
  dateColumn,
  checkboxColumn,
  keyColumn
} from 'react-datasheet-grid';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Toolbar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  LinearProgress,
  Tooltip,
  Menu,
  Grid
} from '@mui/material';
import {
  FiSave,
  FiPlus,
  FiSettings,
  FiDownload,
  FiUpload,
  FiMoreVertical,
  FiTrash2,
  FiEdit3
} from 'react-icons/fi';
import { Dataset, datasetsService } from '../../services/datasets';
import {
  AdvancedColumnType,
  AdvancedColumnConfig,
  DatasetRow,
  DatasetEditState,
  DEFAULT_COLUMN_CONFIGS
} from '../../types/datasetEditor';
import { createMoneyColumn } from './columns/MoneyColumn';
import { createLocationColumn } from './columns/LocationColumn';
import { createActorColumn, createEntityColumn, createCompanyColumn } from './columns/EntityColumn';
import { useLocationTypeConverter } from '../../hooks/useLocationTypeConverter';
import 'react-datasheet-grid/dist/style.css';

interface AdvancedDatasetEditorProps {
  dataset: Dataset;
  open: boolean;
  onClose: () => void;
  onSave: (updatedDataset: Dataset) => void;
}

const AdvancedDatasetEditor: React.FC<AdvancedDatasetEditorProps> = ({
  dataset,
  open,
  onClose,
  onSave
}) => {
  const [editState, setEditState] = useState<DatasetEditState>({
    data: [],
    columns: [],
    metadata: {
      name: dataset.name,
      description: dataset.description || '',
      tags: dataset.tags || []
    },
    hasChanges: false
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [columnEditorOpen, setColumnEditorOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<AdvancedColumnConfig | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Location type converter for automatic geocoding
  const { convertDataToLocationValues, progress: locationProgress } = useLocationTypeConverter();

  // Context menu state
  const [contextMenuAnchor, setContextMenuAnchor] = useState<null | HTMLElement>(null);
  const [contextMenuColumn, setContextMenuColumn] = useState<AdvancedColumnConfig | null>(null);
  const [metadataEditMode, setMetadataEditMode] = useState(false);

  // Initialize editor with dataset data
  useEffect(() => {
    if (open && dataset) {
      initializeEditor();
    }
  }, [open, dataset]);

  const initializeEditor = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load dataset data
      const data = await datasetsService.getDatasetData(dataset.id);
      console.log('=== Initialize Editor Debug ===');
      console.log('Loaded dataset data:', data);
      console.log('First row keys:', data.length > 0 ? Object.keys(data[0]) : []);
      console.log('Dataset schema_definition:', dataset.schema_definition);

      // Convert dataset schema to advanced column configs
      // Filter out duplicate columns and ensure they match actual data keys
      const dataKeys = data.length > 0 ? Object.keys(data[0]) : [];
      const uniqueSchemaFields = dataset.schema_definition?.filter((field, index, array) => {
        // Keep only fields that exist in actual data and are not duplicates
        const fieldNameLower = field.name.toLowerCase();
        const existsInData = dataKeys.some(key => key.toLowerCase() === fieldNameLower);
        const isFirstOccurrence = array.findIndex(f => f.name.toLowerCase() === fieldNameLower) === index;
        return existsInData && isFirstOccurrence;
      }) || [];

      console.log('Filtered schema fields:', uniqueSchemaFields);
      console.log('Available data keys:', dataKeys);

      const columns: AdvancedColumnConfig[] = uniqueSchemaFields.map((field, index) => {
        // Find the exact matching key from data (case-sensitive)
        const actualKey = dataKeys.find(key => key.toLowerCase() === field.name.toLowerCase()) || field.name;

        // Determine type based on actual data content, not just schema
        let inferredType: AdvancedColumnType = mapSchemaTypeToAdvanced(field.type);

        // If schema says text but data has objects, try to infer the real type
        if (inferredType === 'text' && data.length > 0) {
          // Check the first few non-null rows
          const sampleRows = data.filter(row => row[actualKey] != null).slice(0, 5);
          for (const row of sampleRows) {
            const val = row[actualKey];
            if (typeof val === 'object') {
              const detectedType = inferColumnType(val);
              if (detectedType !== 'text') {
                inferredType = detectedType as AdvancedColumnType;
                console.log(`Auto-corrected column ${actualKey} type from text to ${inferredType} based on data`);
                break;
              }
            }
          }
        }

        return {
          id: actualKey,
          title: actualKey, // Use actual data key as title to match
          type: inferredType,
          ...DEFAULT_COLUMN_CONFIGS[inferredType],
          // Load location-specific fields from schema (cast to any since schema type is flexible)
          ...(inferredType === 'location' && (field as any).locationType ? {
            locationType: (field as any).locationType,
            boundaryLevel: (field as any).boundaryLevel,
            coordinatesColumn: (field as any).coordinatesColumn
          } : {}),
          // Load money-specific fields from schema
          ...(inferredType === 'money' && (field as any).defaultCurrency ? {
            defaultCurrency: (field as any).defaultCurrency
          } : {})
        };
      });

      console.log('Schema field names:', dataset.schema_definition?.map(f => f.name) || []);

      // Convert data rows to DatasetRow format
      const dataRows: DatasetRow[] = data.map((row, index) => ({
        id: `row_${index}`,
        ...row
      }));

      console.log('Converted columns:', columns);
      console.log('Converted dataRows:', dataRows);
      console.log('Column IDs:', columns.map(c => c.id));
      console.log('Data row keys (first row):', dataRows.length > 0 ? Object.keys(dataRows[0]) : []);
      console.log('=================================');

      setEditState({
        data: dataRows,
        columns,
        metadata: {
          name: dataset.name,
          description: dataset.description || '',
          tags: dataset.tags || []
        },
        hasChanges: false
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dataset');
    } finally {
      setLoading(false);
    }
  };

  // Map basic schema types to advanced types
  const mapSchemaTypeToAdvanced = (type: string): AdvancedColumnType => {
    switch (type) {
      case 'number': return 'number';
      case 'integer': return 'number';
      case 'boolean': return 'checkbox';
      case 'date': return 'date';
      case 'money': return 'money';
      case 'location': return 'location';
      case 'actor': return 'actor';
      case 'entity': return 'entity';
      case 'company': return 'company';
      default: return 'text';
    }
  };

  // Generate DataSheetGrid columns from config
  const gridColumns = useMemo(() => {
    console.log('Creating grid columns from editState.columns:', editState.columns);
    const columns = editState.columns.map(col => {
      console.log('Processing column:', col);

      // Create header component with right-click context menu for columns
      const HeaderComponent = () => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            width: '100%',
            cursor: 'context-menu',
            position: 'relative',
            zIndex: 10,
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
          onContextMenu={(e) => {
            // Only handle context menu for headers, not cells
            e.preventDefault();
            e.stopPropagation();
            setContextMenuAnchor(e.currentTarget);
            setContextMenuColumn(col);
          }}
          title="Click derecho para opciones de columna"
        >
          <Typography variant="caption" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {col.title}
          </Typography>
        </Box>
      );

      let column;
      switch (col.type) {
        case 'money':
          column = {
            ...keyColumn(col.id, createMoneyColumn(col.defaultCurrency)),
            title: <HeaderComponent />,
            minWidth: col.minWidth || 120
          };
          break;

        case 'location':
          column = {
            ...keyColumn(col.id, createLocationColumn(col.locationType, col.boundaryLevel)),
            title: <HeaderComponent />,
            minWidth: col.minWidth || 120
          };
          break;

        case 'actor':
          column = {
            ...keyColumn(col.id, createActorColumn(col.allowCreateNew)),
            title: <HeaderComponent />,
            minWidth: col.minWidth || 120
          };
          break;

        case 'entity':
          column = {
            ...keyColumn(col.id, createEntityColumn(col.allowCreateNew)),
            title: <HeaderComponent />,
            minWidth: col.minWidth || 120
          };
          break;

        case 'company':
          column = {
            ...keyColumn(col.id, createCompanyColumn(col.allowCreateNew)),
            title: <HeaderComponent />,
            minWidth: col.minWidth || 120
          };
          break;

        case 'number':
          column = {
            ...keyColumn(col.id, floatColumn),
            title: <HeaderComponent />,
            minWidth: col.minWidth || 120
          };
          break;

        case 'date':
          column = {
            ...keyColumn(col.id, dateColumn),
            title: <HeaderComponent />,
            minWidth: col.minWidth || 120
          };
          break;

        case 'checkbox':
          column = {
            ...keyColumn(col.id, checkboxColumn),
            title: <HeaderComponent />,
            minWidth: col.minWidth || 120
          };
          break;

        default: // text
          column = {
            ...keyColumn(col.id, textColumn),
            title: <HeaderComponent />,
            minWidth: col.minWidth || 120
          };
          break;
      }

      console.log('Created column for', col.id, ':', column);
      return column;
    });
    console.log('Generated grid columns:', columns);
    return columns;
  }, [editState.columns]);

  const handleDataChange = useCallback((newData: DatasetRow[]) => {
    setEditState(prev => ({
      ...prev,
      data: newData,
      hasChanges: true
    }));
  }, []);

  const handleAddRow = () => {
    const newRow: DatasetRow = {
      id: `row_${Date.now()}`,
      ...editState.columns.reduce((acc, col) => {
        acc[col.id] = null;
        return acc;
      }, {} as Record<string, any>)
    };

    setEditState(prev => ({
      ...prev,
      data: [...prev.data, newRow],
      hasChanges: true
    }));
  };

  const handleAddColumn = () => {
    setSelectedColumn(null);
    setColumnEditorOpen(true);
  };

  // Import functionality
  const handleImport = () => {
    setMenuAnchor(null);
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setError(null);

      const text = await file.text();
      let importedData: any[] = [];

      if (file.name.toLowerCase().endsWith('.json')) {
        // Process JSON file
        const parsed = JSON.parse(text);
        importedData = Array.isArray(parsed) ? parsed : [parsed];
      } else if (file.name.toLowerCase().endsWith('.csv')) {
        // Process CSV file
        importedData = parseCSV(text);
      } else {
        throw new Error('Formato de archivo no soportado. Use JSON o CSV.');
      }

      if (importedData.length === 0) {
        throw new Error('El archivo no contiene datos válidos.');
      }

      // Generate columns from first row
      const firstRow = importedData[0];
      const newColumns: AdvancedColumnConfig[] = Object.keys(firstRow).map((key, index) => ({
        id: key,
        title: key,
        type: inferColumnType(firstRow[key]) as AdvancedColumnType,
        ...DEFAULT_COLUMN_CONFIGS[inferColumnType(firstRow[key]) as AdvancedColumnType]
      }));

      // Convert imported data to DatasetRow format
      const newDataRows: DatasetRow[] = importedData.map((row, index) => ({
        id: `imported_row_${Date.now()}_${index}`,
        ...row
      }));

      // Update state with imported data
      setEditState(prev => ({
        ...prev,
        data: [...prev.data, ...newDataRows],
        columns: mergeColumns(prev.columns, newColumns),
        hasChanges: true
      }));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar archivo');
    } finally {
      setImporting(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // Helper function to parse CSV
  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: any = {};

      headers.forEach((header, index) => {
        let value: any = values[index] || '';

        // Try to parse numbers
        if (value && !isNaN(value) && !isNaN(parseFloat(value))) {
          value = parseFloat(value);
        }
        // Try to parse booleans
        else if (value.toLowerCase() === 'true') {
          value = true;
        } else if (value.toLowerCase() === 'false') {
          value = false;
        }

        row[header] = value;
      });

      rows.push(row);
    }

    return rows;
  };

  // Helper function to infer column type from value
  const inferColumnType = (value: any): string => {
    if (value === null || value === undefined) return 'text';
    if (typeof value === 'boolean') return 'checkbox';
    if (typeof value === 'number') return 'number';

    // Check for object types
    if (typeof value === 'object') {
      // Check for Money ({ amount, currency })
      if ('amount' in value && 'currency' in value) return 'money';

      // Check for Location ({ municipality, department, coordinates? })
      if ('municipality' in value || 'department' in value || 'coordinates' in value || 'formatted_address' in value) return 'location';

      // Check for Entity/Actor/Company/Entity
      if ('entity_id' in value || ('type' in value && ['person', 'organization'].includes(value.type))) return 'actor';
      if ('industry' in value || 'size' in value) return 'company';
      if ('type' in value && ['government', 'ngo', 'institution', 'political_party'].includes(value.type)) return 'entity';

      // Default to text if object structure is unknown (might result in [object Object] but better than nothing)
      return 'text';
    }

    if (typeof value === 'string') {
      // Check for date patterns
      if (/^\d{4}-\d{2}-\d{2}/.test(value) || /^\d{2}\/\d{2}\/\d{4}/.test(value)) {
        return 'date';
      }
      return 'text';
    }
    return 'text';
  };

  // Helper function to merge columns (avoid duplicates)
  const mergeColumns = (existingColumns: AdvancedColumnConfig[], newColumns: AdvancedColumnConfig[]): AdvancedColumnConfig[] => {
    const existingIds = new Set(existingColumns.map(col => col.id));
    const uniqueNewColumns = newColumns.filter(col => !existingIds.has(col.id));
    return [...existingColumns, ...uniqueNewColumns];
  };

  const handleEditColumn = (column: AdvancedColumnConfig) => {
    // Always get the latest version from editState.columns to ensure we have updated values
    const latestColumn = editState.columns.find(c => c.id === column.id) || column;
    console.log('📋 Opening column editor with:', latestColumn);
    setSelectedColumn(latestColumn);
    setColumnEditorOpen(true);
  };

  const handleDeleteColumn = (columnId: string) => {
    if (editState.columns.length <= 1) {
      setError('No se puede eliminar la última columna');
      return;
    }

    if (window.confirm('¿Está seguro de que desea eliminar esta columna? Esta acción no se puede deshacer.')) {
      // Remove column from configuration
      const updatedColumns = editState.columns.filter(col => col.id !== columnId);

      // Remove column data from all rows
      const updatedData = editState.data.map(row => {
        const { [columnId]: removed, ...rest } = row;
        return rest as DatasetRow;
      });

      setEditState(prev => ({
        ...prev,
        columns: updatedColumns,
        data: updatedData,
        hasChanges: true
      }));
    }
  };

  // Context menu handlers
  const handleContextMenuEdit = () => {
    if (contextMenuColumn) {
      handleEditColumn(contextMenuColumn);
      setContextMenuAnchor(null);
      setContextMenuColumn(null);
    }
  };

  const handleContextMenuDelete = () => {
    if (contextMenuColumn) {
      handleDeleteColumn(contextMenuColumn.id);
      setContextMenuAnchor(null);
      setContextMenuColumn(null);
    }
  };

  const handleContextMenuClose = () => {
    setContextMenuAnchor(null);
    setContextMenuColumn(null);
  };

  const handleSaveColumn = async (columnConfig: AdvancedColumnConfig) => {
    const existingIndex = editState.columns.findIndex(col => col.id === columnConfig.id);
    const oldColumn = existingIndex >= 0 ? editState.columns[existingIndex] : null;
    const isTypeChangedToLocation = oldColumn && oldColumn.type !== 'location' && columnConfig.type === 'location';

    // Check if this is a location column (existing or newly set)
    const isLocationColumn = columnConfig.type === 'location';
    const isBoundaryLevelChanged = oldColumn &&
      oldColumn.type === 'location' &&
      columnConfig.type === 'location' &&
      (oldColumn.boundaryLevel !== columnConfig.boundaryLevel || oldColumn.locationType !== columnConfig.locationType);

    // Debug logging for location changes
    console.log('📝 handleSaveColumn:', {
      columnId: columnConfig.id,
      oldLocationType: oldColumn?.locationType,
      newLocationType: columnConfig.locationType,
      oldBoundaryLevel: oldColumn?.boundaryLevel,
      newBoundaryLevel: columnConfig.boundaryLevel,
      isTypeChangedToLocation,
      isBoundaryLevelChanged,
      isLocationColumn,
      willReGeocode: isLocationColumn // SIEMPRE re-geocodifica si es location
    });

    // Prepare new columns and data
    let newColumns = [...editState.columns];
    let newData = [...editState.data];

    // 1. Handle Column Update (and potential renaming)
    if (existingIndex >= 0) {
      // Update existing column

      // If title changed, we need to create a new column ID based on the title
      if (oldColumn!.title !== columnConfig.title && columnConfig.title.trim() !== '') {
        const newId = columnConfig.title.trim();

        // Update data: rename the column in all rows
        newData = newData.map(row => {
          const newRow = { ...row };
          if (oldColumn!.id in newRow) {
            newRow[newId] = newRow[oldColumn!.id];
            delete newRow[oldColumn!.id];
          }
          return newRow;
        });

        // Update column config with new ID
        columnConfig = { ...columnConfig, id: newId };
      }

      newColumns[existingIndex] = columnConfig;
    } else {
      // Add new column
      const newId = columnConfig.title?.trim() || columnConfig.id;
      columnConfig = { ...columnConfig, id: newId };
      newColumns = [...editState.columns, columnConfig];

      // Add default values to all rows for new column
      newData.forEach(row => {
        if (!(newId in row)) {
          row[newId] = null;
        }
      });
    }

    // 2. Handle Data Conversion - SIEMPRE re-geocodifica si es una columna de tipo location
    if (isLocationColumn) {
      try {
        console.log(`🔄 Re-geocoding column "${columnConfig.id}" with boundaryLevel: ${columnConfig.boundaryLevel}, locationType: ${columnConfig.locationType}`);
        // SIEMPRE pasa forceReconvert=true para re-geocodificar incluso si no cambió el nivel
        newData = await convertDataToLocationValues(
          newData,
          columnConfig.id,
          {
            forceReconvert: true,  // SIEMPRE fuerza re-geocodificación
            boundaryLevel: columnConfig.boundaryLevel,
            locationType: columnConfig.locationType,
            coordinatesColumn: columnConfig.coordinatesColumn  // Columna con coordenadas para 'coordinates' type
          }
        );

        // Check for geocoding failures in the converted data
        const failedLocations = newData.filter(row => {
          const loc = row[columnConfig.id];
          return loc && typeof loc === 'object' && loc.geocode_failed === true;
        });

        if (failedLocations.length > 0) {
          const failedNames = failedLocations
            .map(row => row[columnConfig.id]?.municipality || row[columnConfig.id]?.formatted_address)
            .filter(Boolean)
            .slice(0, 5);  // Show max 5

          const moreCount = failedLocations.length > 5 ? ` y ${failedLocations.length - 5} más` : '';
          setError(`⚠️ ${failedLocations.length} ubicación(es) no se encontraron: ${failedNames.join(', ')}${moreCount}. Busca el ícono ⚠️ en las celdas.`);
        }
      } catch (error) {
        console.error('Error converting data to location values:', error);
        setError('Failed to geocode locations. Some coordinates may be missing.');
      }
    }

    // 3. Atomic State Update
    setEditState(prev => ({
      ...prev,
      columns: newColumns,
      data: newData,
      hasChanges: true
    }));

    setColumnEditorOpen(false);
  };

  // Handle metadata changes
  const handleMetadataChange = (field: keyof typeof editState.metadata, value: string | string[]) => {
    setEditState(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: value
      },
      hasChanges: true
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Convert advanced columns back to basic schema
      // Include location-specific fields for proper persistence
      const schema = editState.columns.map(col => ({
        name: col.id,
        type: col.type,
        nullable: true,
        // Location column specific fields
        ...(col.type === 'location' ? {
          locationType: col.locationType,
          boundaryLevel: col.boundaryLevel,
          coordinatesColumn: col.coordinatesColumn
        } : {}),
        // Money column specific fields
        ...(col.type === 'money' ? {
          defaultCurrency: col.defaultCurrency
        } : {})
      }));

      // Prepare data for saving
      const dataToSave = editState.data.map(row => {
        const { id, ...rowData } = row;
        return rowData;
      });

      // Update dataset
      const updatedDataset = await datasetsService.updateDataset(dataset.id, {
        name: editState.metadata.name,
        description: editState.metadata.description,
        tags: editState.metadata.tags,
        data: dataToSave,
        schema
      });

      setEditState(prev => ({ ...prev, hasChanges: false }));
      onSave(updatedDataset);
      setMetadataEditMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save dataset');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (editState.hasChanges) {
      if (window.confirm('¿Descartar cambios sin guardar?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          width: '95vw',
          height: '90vh',
          maxWidth: 'none',
          m: 1
        }
      }}
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            {metadataEditMode ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  size="small"
                  label="Nombre del Dataset"
                  value={editState.metadata.name}
                  onChange={(e) => handleMetadataChange('name', e.target.value)}
                  fullWidth
                  variant="outlined"
                />
                <TextField
                  size="small"
                  label="Descripción"
                  value={editState.metadata.description}
                  onChange={(e) => handleMetadataChange('description', e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  variant="outlined"
                />
                <TextField
                  size="small"
                  label="Tags (separados por comas)"
                  value={editState.metadata.tags.join(', ')}
                  onChange={(e) => handleMetadataChange('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                  fullWidth
                  variant="outlined"
                  helperText="Ejemplo: finanzas, gobierno, 2024"
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    onClick={() => setMetadataEditMode(false)}
                    variant="outlined"
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="small"
                    onClick={handleSave}
                    variant="contained"
                    disabled={saving}
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </Button>
                </Box>
              </Box>
            ) : (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6">
                    {editState.metadata.name}
                  </Typography>
                  <Tooltip title="Editar información del dataset">
                    <IconButton
                      size="small"
                      onClick={() => setMetadataEditMode(true)}
                      sx={{ ml: 1 }}
                    >
                      <FiEdit3 size={14} />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {editState.metadata.description || 'Sin descripción'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="caption" color="text.secondary">
                    {editState.data.length} filas, {editState.columns.length} columnas
                  </Typography>
                  {editState.hasChanges && (
                    <Chip
                      label="Sin guardar"
                      size="small"
                      color="warning"
                    />
                  )}
                  {editState.metadata.tags && editState.metadata.tags.length > 0 && (
                    <>
                      <Typography variant="caption" color="text.secondary" sx={{ mx: 1 }}>•</Typography>
                      {editState.metadata.tags.slice(0, 3).map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      ))}
                      {editState.metadata.tags.length > 3 && (
                        <Typography variant="caption" color="text.secondary">
                          +{editState.metadata.tags.length - 3} más
                        </Typography>
                      )}
                    </>
                  )}
                </Box>
              </>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Guardar cambios">
              <span>
                <IconButton
                  onClick={handleSave}
                  disabled={!editState.hasChanges || saving}
                  color="primary"
                >
                  <FiSave />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, height: '100%', overflow: 'hidden' }}>
        {(loading || importing || locationProgress.isConverting) && (
          <Box>
            <LinearProgress
              variant={locationProgress.isConverting ? "determinate" : "indeterminate"}
              value={locationProgress.isConverting ? (locationProgress.completed / locationProgress.total) * 100 : undefined}
            />
            {locationProgress.isConverting && (
              <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                Geocoding locations... {locationProgress.completed}/{locationProgress.total}
              </Typography>
            )}
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Toolbar */}
            <Toolbar
              variant="dense"
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                gap: 1,
                minHeight: 48
              }}
            >
              <Button
                startIcon={<FiPlus />}
                onClick={handleAddRow}
                size="small"
              >
                Fila
              </Button>

              <Button
                startIcon={<FiPlus />}
                onClick={handleAddColumn}
                size="small"
              >
                Columna
              </Button>

              <Box sx={{ flexGrow: 1 }} />

              <Typography variant="caption" color="text.secondary">
                {editState.data.length} filas
              </Typography>

              <IconButton
                size="small"
                onClick={(e) => setMenuAnchor(e.currentTarget)}
              >
                <FiMoreVertical />
              </IconButton>
            </Toolbar>

            {/* DataGrid */}
            <Box sx={{ flexGrow: 1, overflow: 'hidden', height: 'calc(80vh - 120px)' }}>
              {editState.data.length > 0 && gridColumns.length > 0 ? (
                <DataSheetGrid
                  key={`grid-${editState.data.length}-${editState.columns.map(c => c.type).join('-')}`}
                  value={editState.data}
                  onChange={handleDataChange}
                  columns={gridColumns}
                  height={600}
                  addRowsComponent={false}
                  disableContextMenu={false}
                  rightClickToInsert={false}
                />
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography color="text.secondary">
                    {loading ? 'Cargando datos...' : 'No hay datos para mostrar'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          {editState.hasChanges ? 'Cancelar' : 'Cerrar'}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!editState.hasChanges || saving}
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </DialogActions>

      {/* Column Editor Dialog */}
      <ColumnEditorDialog
        open={columnEditorOpen}
        column={selectedColumn}
        existingColumns={editState.columns}
        onSave={handleSaveColumn}
        onClose={() => setColumnEditorOpen(false)}
      />

      {/* More Options Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => {/* TODO: Export */ setMenuAnchor(null) }}>
          <FiDownload style={{ marginRight: 8 }} /> Exportar
        </MenuItem>
        <MenuItem onClick={handleImport} disabled={importing}>
          <FiUpload style={{ marginRight: 8 }} />
          {importing ? 'Importando...' : 'Importar JSON/CSV'}
        </MenuItem>
      </Menu>

      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".json,.csv"
        style={{ display: 'none' }}
        onChange={handleFileImport}
      />

      {/* Column Context Menu */}
      <Menu
        anchorEl={contextMenuAnchor}
        open={Boolean(contextMenuAnchor)}
        onClose={handleContextMenuClose}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
      >
        <MenuItem onClick={handleContextMenuEdit}>
          <FiSettings style={{ marginRight: 8 }} />
          Editar Columna
        </MenuItem>
        <MenuItem onClick={handleContextMenuDelete} sx={{ color: 'error.main' }}>
          <FiTrash2 style={{ marginRight: 8 }} />
          Eliminar Columna
        </MenuItem>
      </Menu>
    </Dialog>
  );
};

// Column Editor Dialog Component
interface ColumnEditorDialogProps {
  open: boolean;
  column: AdvancedColumnConfig | null;
  existingColumns: AdvancedColumnConfig[];
  onSave: (column: AdvancedColumnConfig) => void;
  onClose: () => void;
}

const ColumnEditorDialog: React.FC<ColumnEditorDialogProps> = ({
  open,
  column,
  existingColumns,
  onSave,
  onClose
}) => {
  const [form, setForm] = useState<Partial<AdvancedColumnConfig>>({});

  useEffect(() => {
    if (open) {
      setForm(column || {
        id: '',
        title: '',
        type: 'text',
        ...DEFAULT_COLUMN_CONFIGS.text
      });
    }
  }, [open, column]);

  const handleSave = () => {
    if (!form.id || !form.title) return;

    onSave({
      id: form.id,
      title: form.title,
      type: form.type || 'text',
      ...DEFAULT_COLUMN_CONFIGS[form.type || 'text'],
      ...form
    } as AdvancedColumnConfig);
  };

  const isIdValid = form.id &&
    (column?.id === form.id || !existingColumns.find(c => c.id === form.id));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {column ? 'Editar Columna' : 'Nueva Columna'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="ID de Columna"
              value={form.id || ''}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              error={!isIdValid}
              helperText={!isIdValid ? 'ID debe ser único' : ''}
              disabled={!!column}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Título"
              value={form.title || ''}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Columna</InputLabel>
              <Select
                value={form.type || 'text'}
                onChange={(e) => {
                  const newType = e.target.value as AdvancedColumnType;
                  // Apply defaults first, then override with new type
                  // This ensures location columns get proper default locationType and boundaryLevel
                  setForm({
                    ...DEFAULT_COLUMN_CONFIGS[newType],
                    ...form,
                    type: newType,
                    // Reset location-specific fields when changing to location type
                    ...(newType === 'location' ? {
                      locationType: form.locationType || 'boundary',
                      boundaryLevel: form.boundaryLevel || 'level2'
                    } : {})
                  });
                }}
              >
                <MenuItem value="text">📝 Texto</MenuItem>
                <MenuItem value="number">🔢 Número</MenuItem>
                <MenuItem value="date">📅 Fecha</MenuItem>
                <MenuItem value="checkbox">☑️ Checkbox</MenuItem>
                <MenuItem value="money">💰 Dinero</MenuItem>
                <MenuItem value="location">📍 Ubicación</MenuItem>
                <MenuItem value="actor">👤 Actor/Persona</MenuItem>
                <MenuItem value="entity">🏛️ Entidad</MenuItem>
                <MenuItem value="company">🏢 Empresa</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Type-specific options */}
          {form.type === 'money' && (
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Moneda por defecto</InputLabel>
                <Select
                  value={form.defaultCurrency || 'GTQ'}
                  onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value as any })}
                >
                  <MenuItem value="GTQ">Q Quetzal (GTQ)</MenuItem>
                  <MenuItem value="USD">$ Dólar (USD)</MenuItem>
                  <MenuItem value="EUR">€ Euro (EUR)</MenuItem>
                  <MenuItem value="MXN">$ Peso MX (MXN)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}

          {form.type === 'location' && (
            <>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={form.locationType || 'boundary'}
                    onChange={(e) => setForm({
                      ...form,
                      locationType: e.target.value as 'boundary' | 'coordinates',
                      // Reset boundaryLevel when switching types
                      boundaryLevel: e.target.value === 'boundary' ? (form.boundaryLevel || 'level2') : undefined
                    })}
                  >
                    <MenuItem value="boundary">🗺️ Límites (Fronteras Oficiales)</MenuItem>
                    <MenuItem value="coordinates">📍 Ubicación Específica</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Show boundary level selector if Límites is selected */}
              {form.locationType === 'boundary' && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Nivel de Límite</InputLabel>
                    <Select
                      value={form.boundaryLevel || 'level2'}
                      onChange={(e) => setForm({ ...form, boundaryLevel: e.target.value as 'level1' | 'level2' })}
                    >
                      <MenuItem value="level1">🏛️ Nivel 1 (Departamento)</MenuItem>
                      <MenuItem value="level2">🏙️ Nivel 2 (Municipio)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* Show coordinates column selector if Ubicación Específica is selected */}
              {form.locationType === 'coordinates' && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Columna con Coordenadas</InputLabel>
                    <Select
                      value={form.coordinatesColumn || ''}
                      onChange={(e) => setForm({ ...form, coordinatesColumn: e.target.value })}
                    >
                      <MenuItem value="">
                        <em>Sin columna (usar geocodificación)</em>
                      </MenuItem>
                      {existingColumns
                        .filter(col => col.id !== form.id) // Excluir la columna actual
                        .map(col => (
                          <MenuItem key={col.id} value={col.id}>
                            {col.title || col.id} ({col.type})
                          </MenuItem>
                        ))
                      }
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    📍 Selecciona una columna que contenga coordenadas en formato "lat, lng" o un objeto con lat/lng.
                  </Typography>
                </Grid>
              )}

              {/* Re-geocoding notice */}
              {column && column.type === 'location' && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="info.main" sx={{ p: 1, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.light' }}>
                    🔄 Al guardar cambios en el tipo o nivel, los datos se re-geolocalizarán automáticamente.
                  </Typography>
                </Grid>
              )}
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!form.id || !form.title || !isIdValid}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdvancedDatasetEditor;