import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Tooltip,
  useTheme,
  Avatar,
  Divider,
  Button,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import {
  AccessTime,
  DataUsage,
  LocationOn,
  Link as LinkIcon,
  FolderOpen,
  Analytics
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { RecentScrape } from '../../services/recentScrapes';
import { MagicTweetCard } from './MagicTweetCard';

interface CodexMonitoreoData {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: 'monitoreos';
  recent_scrape_id: string;
  recent_scrape?: RecentScrape;
  etiquetas: string[];
  proyecto: string;
  created_at: string;
}

interface MonitoreoCardProps {
  monitoreo: CodexMonitoreoData;
  layout?: 'compact' | 'expanded' | 'full';
  showActions?: boolean;
  onEdit?: (monitoreo: CodexMonitoreoData) => void;
  onDelete?: (monitoreoId: string) => void;
  onAddToProject?: (monitoreo: CodexMonitoreoData) => void;
}

const MonitoreoCard: React.FC<MonitoreoCardProps> = ({ 
  monitoreo, 
  layout = 'expanded',
  showActions = true,
  onEdit,
  onDelete,
  onAddToProject
}) => {
  const theme = useTheme();
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingTweets, setLoadingTweets] = useState(false);

  const scrape = monitoreo.recent_scrape;

  // Debug: Solo mostrar monitoreos con contenido
  if (scrape && (scrape.tweets?.length > 0 || scrape.tweet_count > 0)) {
    console.log('✅ Monitoreo con contenido:', monitoreo.titulo);
  }

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Colores por categoría
  const getCategoryColor = (categoria: string) => {
    const colors = {
      'Política': '#f44336',
      'Económica': '#2196f3',
      'Sociales': '#4caf50',
      'General': '#9e9e9e',
      'Tecnología': '#9c27b0',
      'Deportes': '#ff9800'
    };
    return colors[categoria as keyof typeof colors] || theme.palette.grey[500];
  };

  const openModal = async () => {
    setModalOpen(true);
    if (scrape && (!scrape.tweets || scrape.tweets.length === 0)) {
      // Si no hay tweets cargados, mostrar loading
      setLoadingTweets(true);
      // Aquí podrías hacer una llamada para cargar los tweets si es necesario
      setTimeout(() => setLoadingTweets(false), 1000); // Simulado
    }
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  return (
    <Card
      sx={{
        position: 'relative',
        background: theme.palette.mode === 'dark' 
          ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)}, ${alpha(theme.palette.background.default, 0.9)})`
          : `linear-gradient(135deg, ${alpha(theme.palette.common.white, 0.9)}, ${alpha(theme.palette.grey[50], 0.8)})`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 3,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 25px ${alpha(theme.palette.common.black, 0.15)}`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <Avatar 
            sx={{ 
              width: 40, 
              height: 40,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main
            }}
          >
            <Analytics />
          </Avatar>
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Título del monitoreo */}
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                fontSize: '1.1rem',
                lineHeight: 1.3,
                mb: 0.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
{monitoreo.titulo}
            </Typography>

            {/* Fecha de creación */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Creado {formatDate(monitoreo.created_at)}
            </Typography>

            {/* Tags del proyecto y herramienta */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {monitoreo.proyecto && monitoreo.proyecto !== 'Sin proyecto' && (
                <Chip
                  size="small"
                  icon={<FolderOpen sx={{ fontSize: 14 }} />}
                  label={monitoreo.proyecto}
                  sx={{
                    height: 24,
                    fontSize: '0.75rem',
                    backgroundColor: alpha(theme.palette.info.main, 0.1),
                    color: theme.palette.info.main
                  }}
                />
              )}
              
              {/* Chip con número de tweets disponibles */}
              {scrape && (scrape.tweets?.length || scrape.tweet_count) && (
                <Chip
                  size="small"
                  label={`${scrape.tweets?.length || scrape.tweet_count} tweets`}
                  sx={{
                    height: 24,
                    fontSize: '0.75rem',
                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                    color: theme.palette.success.main,
                    fontWeight: 'medium'
                  }}
                />
              )}
              
              {scrape && scrape.categoria && (
                <Chip
                  size="small"
                  label={scrape.categoria}
                  sx={{
                    height: 24,
                    fontSize: '0.75rem',
                    backgroundColor: alpha(getCategoryColor(scrape.categoria), 0.1),
                    color: getCategoryColor(scrape.categoria)
                  }}
                />
              )}
            </Box>
          </Box>
        </Box>

        {/* Contenido del tweet original */}
        {scrape && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ bgcolor: alpha(theme.palette.background.default, 0.5), p: 2, borderRadius: 2 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: layout === 'compact' ? 2 : 4,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {(scrape as any).texto || 'Contenido del tweet...'}
              </Typography>
              
              {/* Ubicación */}
              {scrape.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                  <LocationOn sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                  <Typography variant="caption" color="text.secondary">
                    {scrape.location}
                  </Typography>
                </Box>
              )}
            </Box>
          </>
        )}

        {/* Métricas básicas del scrape */}
        {scrape && scrape.tweet_count && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              mb: 2,
              p: 2,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.primary.main, 0.05)
            }}>
              <Tooltip title="Contenidos extraídos">
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight="bold" color="primary.main">
                    {scrape.tweet_count}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    contenidos encontrados
                  </Typography>
                </Box>
              </Tooltip>
            </Box>
          </>
        )}

        {/* Descripción/análisis del monitoreo */}
        {monitoreo.descripcion && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontStyle: 'italic',
                lineHeight: 1.5
              }}
            >
              {monitoreo.descripcion}
            </Typography>
          </>
        )}

        {/* Footer con acciones */}
        {showActions && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mt: 2,
            pt: 2,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTime sx={{ fontSize: 14, color: theme.palette.text.disabled }} />
              <Typography variant="caption" color="text.disabled">
                Añadido {formatDate(monitoreo.created_at)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {/* Botón para abrir contenidos */}
              {scrape && (scrape.tweets?.length > 0 || scrape.tweet_count > 0) && (
                <Button 
                  size="small" 
                  variant="text"
                  onClick={openModal}
                  sx={{ 
                    color: theme.palette.text.secondary,
                    '&:hover': { color: theme.palette.primary.main }
                  }}
                >
                  Abrir
                </Button>
              )}
              
              {onEdit && (
                <Button 
                  size="small" 
                  variant="text"
                  onClick={() => onEdit(monitoreo)}
                  sx={{ 
                    color: theme.palette.text.secondary,
                    '&:hover': { color: theme.palette.primary.main }
                  }}
                >
                  Editar
                </Button>
              )}

              {onAddToProject && (
                <Button 
                  size="small" 
                  variant="text"
                  startIcon={<FolderOpen sx={{ fontSize: 16 }} />}
                  onClick={() => onAddToProject(monitoreo)}
                  sx={{ 
                    color: theme.palette.text.secondary,
                    '&:hover': { color: theme.palette.success.main }
                  }}
                >
                  Proyecto
                </Button>
              )}
            </Box>
          </Box>
        )}

      </CardContent>
      
      {/* Modal para visualización completa */}
      <Dialog
        open={modalOpen}
        onClose={closeModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            minHeight: '70vh',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}>
          <Avatar sx={{ 
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
            width: 32,
            height: 32
          }}>
            <Analytics />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">{monitoreo.titulo}</Typography>
            <Typography variant="body2" color="text.secondary">
              {scrape && scrape.tweets ? `${scrape.tweets.length} contenidos encontrados` : 'Contenidos del monitoreo'}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {loadingTweets ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
              <Typography variant="body2" sx={{ ml: 2 }}>
                Cargando contenidos...
              </Typography>
            </Box>
          ) : scrape && scrape.tweets && scrape.tweets.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {scrape.tweets.map((tweet: any, index: number) => (
                <MagicTweetCard 
                  key={tweet.tweet_id || tweet.id || index} 
                  tweet={tweet} 
                  layout="expanded" 
                />
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <DataUsage sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No hay contenidos disponibles
              </Typography>
              <Typography variant="body2" color="text.disabled">
                Este monitoreo aún no tiene contenidos extraídos
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          {scrape && (scrape as any).enlace && (
            <Button 
              component={Link}
              href={(scrape as any).enlace}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<LinkIcon />}
            >
              Ver original
            </Button>
          )}
          <Button onClick={closeModal} variant="contained">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default MonitoreoCard;