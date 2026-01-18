/**
 * CreateDatasetModal - Internal Data Processing Component
 *
 * IMPORTANT UX NOTE:
 * - Use "Processing" instead of "AI Processing" throughout the interface
 * - Use "System will..." instead of "AI will..." in descriptions
 * - Use "automated processing" instead of "AI processing" in technical descriptions
 * - People prefer when technology doesn't feel explicitly AI-controlled
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Divider,
  Grid,
  Switch
} from '@mui/material';
import { FiX, FiUpload, FiDatabase, FiGlobe, FiLock, FiArrowLeft, FiArrowRight, FiDownload, FiRefreshCw } from 'react-icons/fi';
import { datasetsService, type CreateDatasetInput } from '../../services/datasets';
import { DATASETS_CONFIG } from '../../config/datasets';
import { useAuth } from '../../context/AuthContext';
import { useUserType } from '../../hooks/useUserType';
import GoogleDriveImporter from './GoogleDriveImporter';
import GoogleSheetsImporter from './GoogleSheetsImporter';

interface CreateDatasetModalProps {
  projectId?: string;
  onClose: () => void;
  onCreated: (dataset: any) => void;
}

interface FormData extends CreateDatasetInput {
  file?: File;
  captureType?: string;
  importSource?: 'local' | 'drive' | 'sheets';
  sheetData?: {
    spreadsheetId: string;
    sheetName: string;
    title: string;
  };
  syncConfig?: {
    enabled: boolean;
    interval: number;
  };
}

const CreateDatasetModal: React.FC<CreateDatasetModalProps> = ({
  projectId,
  onClose,
  onCreated
}) => {
  const { isAdmin } = useAuth();
  const { hasAdvancedFeatures } = useUserType();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [importSource, setImportSource] = useState<'local' | 'drive' | 'sheets'>('local');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    visibility: 'private', // Default to private, will be public for admin
    source: 'upload',     // Default to upload
    data: [],
    schema: [],
    tags: [],
    project_id: projectId,
    file: undefined
  });

  const steps = [
    'Upload File',
    'Dataset Info',
    'Review & Create'
  ];

  // Check admin status on component mount
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const adminStatus = await isAdmin();
        setIsUserAdmin(adminStatus);

        // If user is admin, default to public visibility
        if (adminStatus) {
          setFormData(prev => ({ ...prev, visibility: 'public' }));
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsUserAdmin(false);
      }
    };

    checkAdminStatus();
  }, [isAdmin]);

  // File upload and processing functionality
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await processFile(file);
  };

  // CSV parsing function
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

  // Data type inference
  const inferDataType = (value: any): string => {
    if (value === null || value === undefined) return 'text';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string') {
      const trimmedValue = value.trim();

      // Check for date format
      if (/^\d{4}-\d{2}-\d{2}/.test(trimmedValue)) return 'date';

      // Check for URL format
      if (/^https?:\/\/.+/i.test(trimmedValue)) {
        // Check if it's likely an image URL
        if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(trimmedValue)) {
          return 'image';
        }
        return 'url';
      }

      return 'text';
    }
    return 'text';
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.json') && !file.name.toLowerCase().endsWith('.csv')) {
      setError('Please drop a JSON or CSV file');
      return;
    }

    // Process the dropped file
    await processFile(file);
  };

  // Validate data structure - detect incorrectly nested data
  const validateDataStructure = (data: any[]): { valid: boolean; error?: string } => {
    if (data.length === 0) {
      return { valid: false, error: 'El archivo no contiene datos válidos' };
    }

    const firstRow = data[0];

    // Check if the first row has only one property that is an array
    // This indicates incorrectly nested data like: [{"diputados": [...]}]
    const keys = Object.keys(firstRow);

    if (keys.length === 1 && Array.isArray(firstRow[keys[0]])) {
      return {
        valid: false,
        error: `Datos no correctamente estructurados. El archivo contiene un objeto con la propiedad "${keys[0]}" que es un array. Por favor, suba directamente el array de datos sin envolverlo en un objeto.`
      };
    }

    // Check if any value in the first row is an array or deeply nested object
    for (const key of keys) {
      const value = firstRow[key];
      if (Array.isArray(value)) {
        return {
          valid: false,
          error: `Datos no correctamente estructurados. La columna "${key}" contiene un array. Cada fila debe contener valores simples, no arrays u objetos anidados.`
        };
      }
      if (value !== null && typeof value === 'object' && !isDateLike(value)) {
        return {
          valid: false,
          error: `Datos no correctamente estructurados. La columna "${key}" contiene un objeto anidado. Cada fila debe contener valores simples.`
        };
      }
    }

    return { valid: true };
  };

  // Helper to check if a value looks like a date object
  const isDateLike = (value: any): boolean => {
    return value instanceof Date ||
      (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value));
  };

  // Extract file processing logic
  const processFile = async (file: File) => {
    try {
      setError(null);
      const text = await file.text();
      let data: any[] = [];
      let schema: Array<{ name: string, type: string, nullable: boolean }> = [];

      if (file.name.toLowerCase().endsWith('.json')) {
        const parsed = JSON.parse(text);
        data = Array.isArray(parsed) ? parsed : [parsed];
      } else if (file.name.toLowerCase().endsWith('.csv')) {
        data = parseCSV(text);
      } else {
        setError('Please select a JSON or CSV file');
        return;
      }

      if (data.length === 0) {
        setError('El archivo no contiene datos válidos');
        return;
      }

      // Validate data structure
      const validation = validateDataStructure(data);
      if (!validation.valid) {
        setError(validation.error || 'Datos no correctamente estructurados');
        return;
      }

      // Generate schema from first row
      const firstRow = data[0];
      schema = Object.keys(firstRow).map(key => ({
        name: key,
        type: inferDataType(firstRow[key]),
        nullable: true
      }));

      // Auto-generate name from filename if empty
      if (!formData.name) {
        const nameFromFile = file.name.replace(/\.(json|csv)$/i, '');
        setFormData(prev => ({ ...prev, name: nameFromFile }));
      }

      setFormData(prev => ({
        ...prev,
        file,
        data,
        schema
      }));

      // Move to next step
      setActiveStep(1);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate data exists (either file or sheets data)
      if (!formData.data || !formData.data.length) {
        setError('Please upload a valid file or import data from Google Sheets');
        return;
      }

      // Validate required fields
      if (!formData.name.trim()) {
        setError('Dataset name is required');
        return;
      }

      if (!formData.schema || formData.schema.length === 0) {
        setError('Dataset schema is required');
        return;
      }

      // Prepare sync configuration if importing from Sheets
      let isSynced = false;
      let syncConfig = null;

      if (formData.importSource === 'sheets' && formData.syncConfig?.enabled && formData.sheetData) {
        isSynced = true;
        syncConfig = {
          spreadsheetId: formData.sheetData.spreadsheetId,
          sheetName: formData.sheetData.sheetName,
          syncInterval: formData.syncConfig.interval,
          isPaused: false,
          lastSyncAt: new Date().toISOString(),
          lastSyncStatus: 'success' as const,
          lastSyncError: null,
          sheetColumns: formData.schema.map((col: any) => col.name),
          localColumns: [],
          lastRowSynced: formData.data.length
        };
      }

      // Prepare data for submission with proper defaults
      const submitData: any = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        visibility: formData.visibility,
        project_id: formData.project_id || null,
        source: formData.importSource === 'sheets' ? 'google_sheets' : 'upload',
        data: formData.data,
        schema: formData.schema,
        tags: Array.isArray(formData.tags) ? formData.tags.filter(Boolean) : [],
        is_synced: isSynced,
        sync_config: syncConfig
      };

      console.log('Submitting dataset data:', submitData);

      const dataset = await datasetsService.createDataset(submitData);

      onCreated(dataset);
      onClose();
    } catch (err) {
      console.error('Dataset creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create dataset');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        // Can proceed if local file uploaded OR data imported from Drive/Sheets
        return (formData.file && formData.data.length > 0) ||
          (formData.data.length > 0 && formData.schema.length > 0);
      case 1:
        return formData.name.trim().length > 0;
      case 2:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Selecciona Fuente de Datos
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Elige cómo importar tu dataset
            </Typography>

            {/* Source selection buttons */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={hasAdvancedFeatures ? 4 : 12}>
                <Card
                  variant={importSource === 'local' ? 'outlined' : 'elevation'}
                  sx={{
                    cursor: 'pointer',
                    border: importSource === 'local' ? '2px solid' : '1px solid',
                    borderColor: importSource === 'local' ? 'primary.main' : 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: 2
                    }
                  }}
                  onClick={() => setImportSource('local')}
                >
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <FiUpload size={32} style={{ marginBottom: 8 }} />
                    <Typography variant="subtitle1" gutterBottom>
                      Archivo Local
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Subir CSV o JSON
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {hasAdvancedFeatures && (
                <>
                  <Grid item xs={12} md={4}>
                    <Card
                      variant={importSource === 'drive' ? 'outlined' : 'elevation'}
                      sx={{
                        cursor: 'pointer',
                        border: importSource === 'drive' ? '2px solid' : '1px solid',
                        borderColor: importSource === 'drive' ? 'primary.main' : 'divider',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: 2
                        }
                      }}
                      onClick={() => setImportSource('drive')}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <FiDownload size={32} style={{ marginBottom: 8 }} />
                        <Typography variant="subtitle1" gutterBottom>
                          Google Drive
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Importar de Drive
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Card
                      variant={importSource === 'sheets' ? 'outlined' : 'elevation'}
                      sx={{
                        cursor: 'pointer',
                        border: importSource === 'sheets' ? '2px solid' : '1px solid',
                        borderColor: importSource === 'sheets' ? 'primary.main' : 'divider',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: 2
                        }
                      }}
                      onClick={() => setImportSource('sheets')}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <FiRefreshCw size={32} style={{ marginBottom: 8 }} />
                        <Typography variant="subtitle1" gutterBottom>
                          Google Sheets
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Conectar & Sincronizar
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </>
              )}
            </Grid>

            {!hasAdvancedFeatures && (
              <Alert severity="info" sx={{ mb: 3 }}>
                Las opciones de Google Drive y Sheets están disponibles solo para usuarios Alpha.
              </Alert>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Render appropriate importer based on selection */}
            {importSource === 'local' && (
              <Box>
                <Box
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  sx={{
                    border: '2px dashed',
                    borderColor: isDragOver ? 'success.main' : 'primary.main',
                    borderRadius: 2,
                    p: 6,
                    textAlign: 'center',
                    bgcolor: isDragOver ? 'success.50' : 'grey.50',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: isDragOver ? 'success.100' : 'grey.100',
                      borderColor: isDragOver ? 'success.dark' : 'primary.dark'
                    }
                  }}
                >
                  <input
                    accept=".json,.csv"
                    style={{ display: 'none' }}
                    id="file-upload"
                    type="file"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="file-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<FiUpload />}
                      size="large"
                      sx={{ mb: 2 }}
                    >
                      Choose File
                    </Button>
                  </label>

                  <Typography variant="body1" gutterBottom>
                    {isDragOver ? 'Drop your file here!' : 'Drag & drop or click to upload'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Supported formats: JSON, CSV (Max 1MB)
                  </Typography>
                </Box>

                {formData.file && (
                  <Alert severity="success" sx={{ mt: 3 }}>
                    <Typography variant="subtitle2">File uploaded successfully!</Typography>
                    <Typography variant="body2">
                      {formData.file.name} - {formData.data.length} rows, {formData.schema.length} columns
                    </Typography>
                  </Alert>
                )}
              </Box>
            )}

            {importSource === 'drive' && (
              <GoogleDriveImporter
                onFileSelected={async (file) => {
                  await processFile(file);
                  setFormData(prev => ({ ...prev, importSource: 'drive' }));
                }}
                onError={(err) => setError(err)}
              />
            )}

            {importSource === 'sheets' && (
              <GoogleSheetsImporter
                onDataImported={(imported) => {
                  setFormData(prev => ({
                    ...prev,
                    data: imported.data,
                    schema: imported.schema,
                    name: imported.sheetData.title,
                    importSource: 'sheets',
                    sheetData: imported.sheetData,
                    syncConfig: imported.syncConfig
                  }));
                  // Auto-advance to next step
                  setActiveStep(1);
                }}
                onError={(err) => setError(err)}
              />
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Dataset Information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configure your dataset details
            </Typography>

            <TextField
              fullWidth
              label="Dataset Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              sx={{ mb: 3 }}
              required
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              sx={{ mb: 3 }}
              placeholder="Describe what this dataset contains and its purpose..."
            />

            <TextField
              fullWidth
              label="Tags (comma separated)"
              value={formData.tags?.join(', ') || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
              }))}
              helperText="Add tags to help organize and find your dataset"
              sx={{ mb: 3 }}
            />

            {/* Visibility toggle for admin users only */}
            {isUserAdmin ? (
              <FormControl sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="subtitle2">Dataset Visibility:</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FiLock size={16} color={formData.visibility === 'private' ? '#1976d2' : '#ccc'} />
                    <Typography variant="body2" color={formData.visibility === 'private' ? 'primary' : 'text.secondary'}>
                      Private
                    </Typography>
                    <Switch
                      checked={formData.visibility === 'public'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        visibility: e.target.checked ? 'public' : 'private'
                      }))}
                      size="small"
                    />
                    <Typography variant="body2" color={formData.visibility === 'public' ? 'primary' : 'text.secondary'}>
                      Public
                    </Typography>
                    <FiGlobe size={16} color={formData.visibility === 'public' ? '#1976d2' : '#ccc'} />
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  {formData.visibility === 'public'
                    ? 'Public datasets are visible to all users'
                    : 'Private datasets are only visible to you'
                  }
                </Typography>
              </FormControl>
            ) : (
              <Alert severity="info" sx={{ mb: 3 }}>
                This dataset will be created as <strong>private</strong> and will only be visible to you.
              </Alert>
            )}

            {formData.file && (
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Preview</Typography>
                <Typography variant="body2">
                  <strong>File:</strong> {formData.file.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Rows:</strong> {formData.data.length}
                </Typography>
                <Typography variant="body2">
                  <strong>Columns:</strong> {formData.schema.map(col => col.name).join(', ')}
                </Typography>
              </Box>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review & Create Dataset
            </Typography>

            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>Dataset Information</Typography>
              <Typography><strong>Name:</strong> {formData.name}</Typography>
              <Typography><strong>Description:</strong> {formData.description || 'No description'}</Typography>
              <Typography>
                <strong>Visibility:</strong> {formData.visibility === 'public' ? 'Public' : 'Private'}
                {formData.visibility === 'public' ?
                  <FiGlobe size={14} style={{ marginLeft: 8, verticalAlign: 'middle' }} /> :
                  <FiLock size={14} style={{ marginLeft: 8, verticalAlign: 'middle' }} />
                }
              </Typography>
              <Typography><strong>Source:</strong> File Upload</Typography>
              <Typography><strong>File:</strong> {formData.file?.name}</Typography>
              <Typography><strong>Rows:</strong> {formData.data.length}</Typography>
              <Typography><strong>Columns:</strong> {formData.schema.length}</Typography>

              {formData.tags && formData.tags.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography component="span"><strong>Tags:</strong> </Typography>
                  {formData.tags.map((tag, index) => (
                    <Chip key={index} label={tag} size="small" sx={{ ml: 0.5 }} />
                  ))}
                </Box>
              )}
            </Box>

            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>Schema Preview</Typography>
              <Grid container spacing={2}>
                {formData.schema.map((col, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Typography variant="body2">
                      <strong>{col.name}</strong> ({col.type})
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Alert severity="success">
              {formData.visibility === 'public'
                ? 'Ready to create your public dataset! All users will be able to view and use this data.'
                : 'Ready to create your private dataset! Only you will be able to view and use this data.'
              }
            </Alert>
          </Box>
        );


      default:
        return null;
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{ zIndex: 1000 }} // Lower z-index to allow Google Picker to appear above
      PaperProps={{ sx: { minHeight: 600 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 500 }}>Create New Dataset</span>
        <Button onClick={onClose} sx={{ minWidth: 'auto', p: 1 }}>
          <FiX />
        </Button>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={activeStep === 0 ? onClose : () => setActiveStep(prev => prev - 1)}
          startIcon={activeStep === 0 ? <FiX /> : <FiArrowLeft />}
          disabled={loading}
        >
          {activeStep === 0 ? 'Cancel' : 'Back'}
        </Button>

        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={() => setActiveStep(prev => prev + 1)}
            endIcon={<FiArrowRight />}
            disabled={!canProceed() || loading}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!canProceed() || loading}
            sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
          >
            {loading ? <CircularProgress size={20} /> : 'Create Dataset'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateDatasetModal;