import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  FiArrowLeft,
  FiEdit3,
  FiTrash2,
  FiDownload,
  FiDatabase,
  FiCalendar,
  FiLock,
  FiGlobe,
  FiTag
} from 'react-icons/fi';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Dataset, datasetsService } from '../../services/datasets';
import DatasetQueryEditor from './DatasetQueryEditor';
import AdvancedDatasetEditor from './AdvancedDatasetEditor';
import { useAuth } from '../../context/AuthContext';

interface DatasetDetailViewProps {
  dataset: Dataset;
  onBack: () => void;
  onDatasetDeleted: (datasetId: string) => void;
  onDatasetUpdated: (dataset: Dataset) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const DatasetDetailView: React.FC<DatasetDetailViewProps> = ({
  dataset,
  onBack,
  onDatasetDeleted,
  onDatasetUpdated
}) => {
  const { isAdmin } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [advancedEditorOpen, setAdvancedEditorOpen] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);

  // Check if user can edit this dataset
  useEffect(() => {
    const checkPermissions = async () => {
      if (dataset.visibility === 'private') {
        setIsAdminUser(true); // Owner can edit private datasets
      } else {
        const adminStatus = await isAdmin();
        setIsAdminUser(adminStatus);
      }
    };
    checkPermissions();
  }, [dataset.visibility, isAdmin]);

  useEffect(() => {
    loadPreviewData();
  }, [dataset.id]);

  const loadPreviewData = async () => {
    try {
      setLoading(true);
      const data = await datasetsService.previewData(dataset.id, 100);
      setPreviewData(data);
      setError(null);
    } catch (err) {
      console.error('Error loading preview data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load preview data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      setError(null);
      await datasetsService.deleteDataset(dataset.id);

      // Update the dataset list and navigate back
      onDatasetDeleted(dataset.id);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete dataset');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleAdvancedEdit = () => {
    if (!isAdminUser) {
      setError('No tienes permiso para editar este conjunto de datos');
      return;
    }
    setAdvancedEditorOpen(true);
  };

  const handleDatasetSaved = (updatedDataset: Dataset) => {
    onDatasetUpdated(updatedDataset);
    setAdvancedEditorOpen(false);
  };

  const handleExport = () => {
    // Simple CSV export
    if (previewData.length === 0) return;

    const headers = Object.keys(previewData[0]);
    const csvContent = [
      headers.join(','),
      ...previewData.map(row =>
        headers.map(header => `"${String(row[header] || '')}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataset.name}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getVisibilityIcon = () => {
    return dataset.visibility === 'private' ? <FiLock size={16} /> : <FiGlobe size={16} />;
  };

  const getVisibilityColor = () => {
    return dataset.visibility === 'private' ? 'secondary' : 'info';
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<FiArrowLeft />}
            onClick={onBack}
            variant="outlined"
          >
            Volver a Datos
          </Button>
          <Typography variant="h4" component="h1">
            {dataset.name}
          </Typography>
          <Chip
            icon={getVisibilityIcon()}
            label={dataset.visibility === 'private' ? 'Privado' : 'Público'}
            color={getVisibilityColor()}
            size="small"
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Exportar datos">
            <IconButton onClick={handleExport} disabled={previewData.length === 0}>
              <FiDownload />
            </IconButton>
          </Tooltip>
          <Tooltip title={isAdminUser ? "Editar datos" : "Solo los administradores pueden editar datos públicos"}>
            <span>
              <IconButton
                onClick={handleAdvancedEdit}
                disabled={!isAdminUser}
              >
                <FiEdit3 />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Eliminar datos">
            <IconButton onClick={() => setDeleteDialogOpen(true)} color="error">
              <FiTrash2 />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Dataset Info */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información de Datos
              </Typography>
              {dataset.description && (
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {dataset.description}
                </Typography>
              )}

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FiDatabase size={16} />
                  <Typography variant="body2">
                    {dataset.row_count.toLocaleString()} filas, {dataset.schema_definition.length} columnas
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FiCalendar size={16} />
                  <Typography variant="body2">
                    Creado {formatDistanceToNow(parseISO(dataset.created_at), { addSuffix: true })}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">
                    Tamaño: {formatBytes(dataset.size_bytes)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">
                    Fuente: {dataset.source}
                  </Typography>
                </Box>
              </Box>

              {dataset.tags.length > 0 && (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>Etiquetas:</Typography>
                  {dataset.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      icon={<FiTag size={12} />}
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Esquema
              </Typography>
              {dataset.schema_definition.map((field, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {field.name}
                  </Typography>
                  <Chip label={field.type} size="small" variant="outlined" />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 0 }}>
        <Tabs value={tabValue} onChange={(_, value) => setTabValue(value)}>
          <Tab label="Vista Previa de Datos" />
          <Tab label="Editor de Consultas" />
        </Tabs>
      </Box>

      {/* Data Preview Tab */}
      <TabPanel value={tabValue} index={0}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : previewData.length > 0 ? (
          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {Object.keys(previewData[0]).map((header) => (
                    <TableCell key={header} sx={{ fontWeight: 'bold' }}>
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {previewData.map((row, index) => (
                  <TableRow key={index} hover>
                    {Object.keys(previewData[0]).map((header) => {
                      const value = row[header];
                      let displayValue = '';

                      if (value === null || value === undefined) {
                        displayValue = '';
                      } else if (typeof value === 'object') {
                        // Handle special column types
                        if ('amount' in value && 'currency' in value) {
                          displayValue = `${value.currency} ${value.amount}`;
                        } else if ('municipality' in value || 'department' in value) {
                          displayValue = value.formatted_address || `${value.municipality}, ${value.department}`;
                        } else {
                          // Fallback for other objects
                          try {
                            displayValue = JSON.stringify(value);
                          } catch (e) {
                            displayValue = '[Complex Data]';
                          }
                        }
                      } else {
                        displayValue = String(value);
                      }

                      return (
                        <TableCell key={header}>
                          {displayValue}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No hay datos disponibles para previsualizar
            </Typography>
          </Box>
        )}
      </TabPanel>

      {/* Query Editor Tab */}
      <TabPanel value={tabValue} index={1}>
        <DatasetQueryEditor dataset={dataset} />
      </TabPanel>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => !deleting && setDeleteDialogOpen(false)}>
        <DialogTitle>Eliminar Datos</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que quieres eliminar permanentemente "{dataset.name}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer. Todos los datos ({dataset.row_count.toLocaleString()} filas) se perderán permanentemente.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancelar
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Eliminando...
              </>
            ) : (
              'Eliminar'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Advanced Dataset Editor */}
      <AdvancedDatasetEditor
        dataset={dataset}
        open={advancedEditorOpen}
        onClose={() => setAdvancedEditorOpen(false)}
        onSave={handleDatasetSaved}
      />
    </Box>
  );
};

export default DatasetDetailView;