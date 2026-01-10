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
import { FiX, FiUpload, FiDatabase, FiGlobe, FiLock, FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import { datasetsService, type CreateDatasetInput } from '../../services/datasets';
import { DATASETS_CONFIG } from '../../config/datasets';
import { useAuth } from '../../context/AuthContext';

interface CreateDatasetModalProps {
  projectId?: string;
  onClose: () => void;
  onCreated: (dataset: any) => void;
}

interface FormData extends CreateDatasetInput {
  file?: File;
  captureType?: string;
}

const CreateDatasetModal: React.FC<CreateDatasetModalProps> = ({
  projectId,
  onClose,
  onCreated
}) => {
  const { isAdmin } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
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
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
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
        setError('The file contains no valid data');
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

      if (!formData.file || !formData.data.length) {
        setError('Please upload a valid file');
        return;
      }

      // Validate required fields
      if (!formData.name.trim()) {
        setError('Dataset name is required');
        return;
      }

      if (!formData.data || formData.data.length === 0) {
        setError('Dataset must contain at least one row of data');
        return;
      }

      if (!formData.schema || formData.schema.length === 0) {
        setError('Dataset schema is required');
        return;
      }

      // Prepare data for submission with proper defaults
      const submitData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        visibility: formData.visibility,
        project_id: formData.project_id || null,
        source: 'upload' as const,
        data: formData.data,
        schema: formData.schema,
        tags: Array.isArray(formData.tags) ? formData.tags.filter(Boolean) : []
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
        return formData.file && formData.data.length > 0;
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
              Upload Dataset File
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Upload a JSON or CSV file to create a {isUserAdmin ? 'dataset' : 'private dataset'}
            </Typography>

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