import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Divider,
  Alert,
  Pagination,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  History as HistoryIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  GetApp as GetAppIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  Search as SearchIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { getSondeoHistorial, getSondeoById } from '../../services/api';

interface SondeoHistoryModalProps {
  open: boolean;
  onClose: () => void;
  onSelectSondeo: (sondeo: any) => void;
}

interface SondeoItem {
  id: string;
  pregunta: string;
  contextos_utilizados: string[];
  respuesta_ia: string;
  datos_visualizacion: any;
  created_at: string;
  costo_creditos: number;
  status: string;
}

const SondeoHistoryModal: React.FC<SondeoHistoryModalProps> = ({
  open,
  onClose,
  onSelectSondeo
}) => {
  const [sondeos, setSondeos] = useState<SondeoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSondeo, setSelectedSondeo] = useState<SondeoItem | null>(null);
  const [viewDetailModal, setViewDetailModal] = useState(false);

  const itemsPerPage = 5;

  useEffect(() => {
    if (open) {
      fetchSondeos();
    }
  }, [open, page]);

  const fetchSondeos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const offset = (page - 1) * itemsPerPage;
      const response = await getSondeoHistorial(itemsPerPage, offset);
      
      if (response.success && response.sondeos) {
        setSondeos(response.sondeos);
        const total = response.pagination?.total || 0;
        setTotalPages(Math.ceil(total / itemsPerPage));
      } else {
        setError('No se pudieron cargar los sondeos');
      }
    } catch (err: any) {
      setError(err.message || 'Error cargando historial');
      console.error('Error fetching sondeos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (sondeo: SondeoItem) => {
    try {
      const response = await getSondeoById(sondeo.id);
      if (response.success && response.sondeo) {
        setSelectedSondeo(response.sondeo);
        setViewDetailModal(true);
      }
    } catch (err: any) {
      console.error('Error loading sondeo detail:', err);
      setError('Error cargando detalles del sondeo');
    }
  };

  const handleSelectSondeo = (sondeo: SondeoItem) => {
    onSelectSondeo(sondeo);
    onClose();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'error': return 'error';
      case 'processing': return 'warning';
      default: return 'default';
    }
  };

  const filteredSondeos = sondeos.filter(sondeo =>
    sondeo.pregunta.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sondeo.contextos_utilizados.some(contexto => 
      contexto.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(59, 130, 246, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <HistoryIcon />
            <Typography variant="h5" fontWeight="bold">
              Historial de Sondeos
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {/* Search Bar */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Buscar por pregunta o contexto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#f8fafc'
                }
              }}
            />
          </Box>

          {/* Loading State */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
              <CircularProgress size={40} />
              <Typography variant="body1" sx={{ ml: 2 }}>
                Cargando historial...
              </Typography>
            </Box>
          )}

          {/* Error State */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Sondeos List */}
          {!loading && !error && (
            <>
              {filteredSondeos.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <AssessmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No hay sondeos en el historial
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Crea tu primer sondeo para verlo aquí
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {filteredSondeos.map((sondeo, index) => (
                    <Card 
                      key={sondeo.id}
                      sx={{ 
                        mb: 2,
                        border: '1px solid #e5e7eb',
                        borderRadius: 2,
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          transform: 'translateY(-2px)',
                          transition: 'all 0.2s ease'
                        }
                      }}
                    >
                      <CardContent sx={{ pb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1f2937', mb: 1 }}>
                            {sondeo.pregunta}
                          </Typography>
                          <Chip 
                            label={sondeo.status}
                            color={getStatusColor(sondeo.status) as any}
                            size="small"
                          />
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <AccessTimeIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(sondeo.created_at)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                            • {sondeo.costo_creditos} créditos
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                          {sondeo.contextos_utilizados?.map((contexto, idx) => (
                            <Chip 
                              key={idx}
                              label={contexto}
                              size="small"
                              variant="outlined"
                              icon={<TrendingUpIcon />}
                            />
                          ))}
                        </Box>

                        {sondeo.respuesta_ia && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {sondeo.respuesta_ia.length > 150 
                              ? `${sondeo.respuesta_ia.slice(0, 150)}...` 
                              : sondeo.respuesta_ia
                            }
                          </Typography>
                        )}
                      </CardContent>

                      <Divider />

                      <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
                        <Box>
                          <Button
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleViewDetail(sondeo)}
                            sx={{ mr: 1 }}
                          >
                            Ver Detalles
                          </Button>
                        </Box>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<GetAppIcon />}
                          onClick={() => handleSelectSondeo(sondeo)}
                          sx={{
                            background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
                            }
                          }}
                        >
                          Cargar Sondeo
                        </Button>
                      </CardActions>
                    </Card>
                  ))}
                </List>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, newPage) => setPage(newPage)}
                    color="primary"
                    size="medium"
                  />
                </Box>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: '1px solid #e5e7eb' }}>
          <Button onClick={onClose} variant="outlined">
            Cancelar
          </Button>
          <Button
            onClick={fetchSondeos}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
              }
            }}
          >
            Actualizar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Modal */}
      <Dialog
        open={viewDetailModal}
        onClose={() => setViewDetailModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #e5e7eb' }}>
          <Typography variant="h6">Detalles del Sondeo</Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedSondeo && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedSondeo.pregunta}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Contextos utilizados:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedSondeo.contextos_utilizados?.map((contexto, idx) => (
                    <Chip key={idx} label={contexto} size="small" />
                  ))}
                </Box>
              </Box>

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Respuesta:
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                {selectedSondeo.respuesta_ia}
              </Typography>

              <Typography variant="caption" color="text.secondary">
                Creado: {formatDate(selectedSondeo.created_at)} • {selectedSondeo.costo_creditos} créditos
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDetailModal(false)}>
            Cerrar
          </Button>
          {selectedSondeo && (
            <Button
              variant="contained"
              onClick={() => {
                handleSelectSondeo(selectedSondeo);
                setViewDetailModal(false);
              }}
            >
              Cargar Este Sondeo
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SondeoHistoryModal;