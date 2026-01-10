
import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  CircularProgress
} from '@mui/material';
import {
  FiEye,
  FiLock,
  FiGlobe,
  FiCalendar,
  FiTag,
  FiDatabase,
  FiTrendingUp,
  FiGrid
} from 'react-icons/fi';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Dataset } from '../../services/datasets';
import { DATASETS_CONFIG } from '../../config/datasets';

interface DatasetListProps {
  datasets: Dataset[];
  loading: boolean;
  onSelectDataset: (dataset: Dataset) => void;
  searchQuery: string;
}

const DatasetList: React.FC<DatasetListProps> = ({
  datasets,
  loading,
  onSelectDataset,
  searchQuery
}) => {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'upload': return '📤';
      case 'scraper': return '🕷️';
      case 'api': return '🔌';
      case 'sql': return '🗃️';
      case 'python': return '🐍';
      default: return '📊';
    }
  };

  const getSourceLabel = (source: string) => {
    const sourceMap = {
      upload: 'Subida de archivo',
      scraper: 'Web Scraper',
      api: 'Importación API',
      sql: 'Consulta SQL',
      python: 'Script Python'
    };
    return sourceMap[source as keyof typeof sourceMap] || source;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (datasets.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 8,
          px: 2,
          border: '2px dashed',
          borderColor: 'grey.300',
          borderRadius: 2,
          backgroundColor: 'grey.50'
        }}
      >
        <FiDatabase size={48} style={{ color: '#9e9e9e', marginBottom: 16 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {searchQuery ? 'No se encontraron datos' : 'Aún no hay datos'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {searchQuery
            ? `No se encontraron datos que coincidan con "${searchQuery}".Intenta ajustar tus términos de búsqueda.`
            : 'Crea tus primeros datos para comenzar con el análisis.'
          }
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {datasets.map((dataset) => (
        <Grid item xs={12} sm={6} md={4} key={dataset.id}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.2s ease-in-out',
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4
              },
              border: '1px solid',
              borderColor: 'divider'
            }}
            onClick={() => onSelectDataset(dataset)}
          >
            <CardContent sx={{ flexGrow: 1, pb: 1 }}>
              {/* Header with visibility and source */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Tooltip title={dataset.visibility === 'private' ? 'Dato Privado' : 'Dato Público'}>
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        bgcolor: dataset.visibility === 'private' ? 'secondary.main' : 'info.main',
                        fontSize: 12
                      }}
                    >
                      {dataset.visibility === 'private' ? <FiLock size={12} /> : <FiGlobe size={12} />}
                    </Avatar>
                  </Tooltip>
                  <Chip
                    size="small"
                    label={getSourceLabel(dataset.source)}
                    variant="outlined"
                  />
                </Box>

                <Tooltip title={`${(dataset.json_data?.length || dataset.row_count).toLocaleString()} filas`}>
                  <Chip
                    size="small"
                    label={`${(dataset.json_data?.length || dataset.row_count).toLocaleString()} filas`}
                    color={(dataset.json_data?.length || dataset.row_count) >= DATASETS_CONFIG.MAX_ROWS_PER_DATASET * 0.8 ? 'warning' : 'default'}
                  />
                </Tooltip>
              </Box>

              {/* Dataset name */}
              <Typography
                variant="h6"
                component="h3"
                gutterBottom
                sx={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {dataset.name}
              </Typography>

              {/* Description */}
              {dataset.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: 1.4
                  }}
                >
                  {dataset.description}
                </Typography>
              )}

              {/* Tags */}
              {dataset.tags && dataset.tags.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  {dataset.tags.slice(0, 3).map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }}
                      icon={<FiTag size={10} />}
                    />
                  ))}
                  {dataset.tags.length > 3 && (
                    <Chip
                      label={`+ ${dataset.tags.length - 3} más`}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
              )}

              {/* Metadata */}
              <Box sx={{ mt: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                  <Tooltip title="Número de filas">
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <FiGrid size={12} />
                      {(dataset.json_data?.length || dataset.row_count).toLocaleString()} filas
                    </Typography>
                  </Tooltip>

                  <Tooltip title="Tamaño del dataset">
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <FiDatabase size={12} />
                      {formatBytes(dataset.size_bytes)}
                    </Typography>
                  </Tooltip>

                  <Tooltip title="Creado">
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <FiCalendar size={12} />
                      {formatDistanceToNow(parseISO(dataset.created_at), { addSuffix: true })}
                    </Typography>
                  </Tooltip>
                </Box>

                {dataset.last_queried_at && (
                  <Tooltip title="Última consulta">
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <FiTrendingUp size={12} />
                      Consultado {formatDistanceToNow(parseISO(dataset.last_queried_at), { addSuffix: true })}
                    </Typography>
                  </Tooltip>
                )}
              </Box>
            </CardContent>

            <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
              <Button
                size="small"
                startIcon={<FiEye />}
                sx={{ ml: 'auto' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectDataset(dataset);
                }}
              >
                Ver Datos
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default DatasetList;