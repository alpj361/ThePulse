import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Alert,
  AlertTitle,
  CircularProgress,
  TextField,
  InputAdornment,
  Chip,
  Badge
} from '@mui/material';
import {
  FiPlus,
  FiSearch,
  FiDatabase,
  FiLock,
  FiGlobe
} from 'react-icons/fi';
import { datasetsService, type Dataset } from '../../services/datasets';
import { DATASETS_CONFIG } from '../../config/datasets';
import DatasetList from './DatasetList';
import CreateDatasetModal from './CreateDatasetModal';
import DatasetDetailView from './DatasetDetailView';

interface DatasetsTabProps {
  projectId?: string;
}

type FilterType = 'all' | 'private' | 'public';

const DatasetsTab: React.FC<DatasetsTabProps> = ({ projectId }) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [storageUsage, setStorageUsage] = useState({
    datasets_count: 0,
    total_size_bytes: 0,
    quota: { max_datasets: 10, max_size_bytes: 10 * 1024 * 1024 }
  });

  // Load datasets and storage usage
  useEffect(() => {
    loadData();
  }, [filter, projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load datasets
      const datasetsData = await datasetsService.listDatasets({
        visibility: filter === 'all' ? undefined : filter,
        project_id: projectId,
        search: searchQuery
      });

      // Load storage usage
      const usageData = await datasetsService.getStorageUsage();

      setDatasets(datasetsData);
      setStorageUsage(usageData);
    } catch (err) {
      console.error('Error loading datasets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load datasets');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    // Debounce search if needed
    loadData();
  };

  const handleDatasetCreated = (newDataset: Dataset) => {
    setIsCreating(false);
    setDatasets(prev => [newDataset, ...prev]);
    setSelectedDataset(newDataset);
    loadData(); // Refresh usage stats
  };

  const handleDatasetDeleted = (datasetId: string) => {
    // Remove dataset from list
    setDatasets(prev => prev.filter(d => d.id !== datasetId));

    // Close dataset detail view
    setSelectedDataset(null);

    // Refresh usage stats
    loadData();
  };

  const filteredDatasets = datasets.filter(dataset => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      dataset.name.toLowerCase().includes(query) ||
      (dataset.description && dataset.description.toLowerCase().includes(query)) ||
      dataset.tags.some(tag => tag.toLowerCase().includes(query))
    );
  });

  const getDatasetCounts = () => {
    const privateCount = datasets.filter(d => d.visibility === 'private').length;
    const publicCount = datasets.filter(d => d.visibility === 'public').length;
    return { privateCount, publicCount, totalCount: datasets.length };
  };

  const { privateCount, publicCount, totalCount } = getDatasetCounts();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUsagePercentage = () => {
    return Math.round((storageUsage.total_size_bytes / storageUsage.quota.max_size_bytes) * 100);
  };

  if (!DATASETS_CONFIG.FEATURE_ENABLED) {
    return (
      <Box p={3}>
        <Alert severity="info">
          <AlertTitle>Feature Disabled</AlertTitle>
          The datasets feature is currently disabled.
        </Alert>
      </Box>
    );
  }

  return (
    <Box className="datasets-tab" sx={{ p: 3 }}>
      {/* Alpha Feature Warning */}
      {DATASETS_CONFIG.IS_ALPHA && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>Función en Alpha</AlertTitle>
          Datos está actualmente en alpha. Las funciones están limitadas a la vista de tabla con un máximo de{' '}
          {DATASETS_CONFIG.MAX_ROWS_PER_DATASET.toLocaleString()} filas por conjunto de datos.
          Las consultas avanzadas y visualizaciones estarán disponibles pronto.
        </Alert>
      )}

      {/* Header with storage info and create button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FiDatabase />
            Datasets
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {totalCount} dato{totalCount !== 1 ? 's' : ''}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatBytes(storageUsage.total_size_bytes)} de {formatBytes(storageUsage.quota.max_size_bytes)} usados
              ({getUsagePercentage()}%)
            </Typography>
            <Chip
              size="small"
              label={`${storageUsage.datasets_count}/${storageUsage.quota.max_datasets} datos`}
              color={storageUsage.datasets_count >= storageUsage.quota.max_datasets ? 'error' : 'default'}
            />
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<FiPlus />}
          onClick={() => setIsCreating(true)}
          disabled={loading || storageUsage.datasets_count >= storageUsage.quota.max_datasets}
          sx={{
            bgcolor: 'success.main',
            '&:hover': { bgcolor: 'success.dark' }
          }}
        >
          Crear Datos
        </Button>
      </Box>

      {/* Filter tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={filter} onChange={(_, value) => setFilter(value)} aria-label="dataset filters">
          <Tab
            value="all"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Todos
                <Badge badgeContent={totalCount} color="primary" />
              </Box>
            }
          />
          <Tab
            value="private"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FiLock size={14} />
                Privados
                <Badge badgeContent={privateCount} color="secondary" />
              </Box>
            }
          />
          <Tab
            value="public"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FiGlobe size={14} />
                Públicos
                <Badge badgeContent={publicCount} color="info" />
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* Search bar */}
      <TextField
        fullWidth
        placeholder="Buscar datos por nombre, descripción o etiquetas..."
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <FiSearch />
            </InputAdornment>
          )
        }}
        sx={{ mb: 3 }}
      />

      {/* Loading state */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error Loading Datasets</AlertTitle>
          {error}
          <Button onClick={loadData} sx={{ mt: 1 }}>
            Retry
          </Button>
        </Alert>
      )}

      {/* Content area */}
      {!loading && !error && (
        <>
          {selectedDataset ? (
            <DatasetDetailView
              dataset={selectedDataset}
              onBack={() => setSelectedDataset(null)}
              onDatasetDeleted={handleDatasetDeleted}
              onDatasetUpdated={(updated) => {
                setDatasets(prev => prev.map(d => d.id === updated.id ? updated : d));
                setSelectedDataset(updated);
              }}
            />
          ) : (
            <DatasetList
              datasets={filteredDatasets}
              loading={loading}
              onSelectDataset={setSelectedDataset}
              searchQuery={searchQuery}
            />
          )}
        </>
      )}

      {/* Create Dataset Modal */}
      {isCreating && (
        <CreateDatasetModal
          projectId={projectId}
          onClose={() => setIsCreating(false)}
          onCreated={handleDatasetCreated}
        />
      )}
    </Box>
  );
};

export default DatasetsTab;