import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  Avatar,
  Divider,
  Button,
  Link
} from '@mui/material';
import {
  Search,
  SmartToy,
  TrendingUp,
  AccessTime,
  DataUsage,
  LocationOn,
  Twitter,
  Link as LinkIcon,
  FolderOpen,
  Analytics
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { RecentScrape } from '../../services/recentScrapes';

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
  const [expanded, setExpanded] = useState(false);

  const scrape = monitoreo.recent_scrape;

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

  // Colores por herramienta
  const getToolColor = (herramienta: string) => {
    const colors = {
      'nitter_context': theme.palette.primary.main,
      'nitter_profile': '#8B5CF6',
      'twitter_search': '#1DA1F2',
      'news_search': '#FF6B35',
      'web_search': '#4CAF50'
    };
    return colors[herramienta as keyof typeof colors] || theme.palette.grey[500];
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

  const engagement = scrape ? (scrape.likes || 0) + (scrape.retweets || 0) + (scrape.replies || 0) : 0;

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

            {/* Metadatos del tweet original */}
            {scrape && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Twitter sx={{ fontSize: 14, color: '#1DA1F2' }} />
                <Typography variant="body2" color="text.secondary">
                  @{scrape.usuario}
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  •
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(scrape.fecha_tweet || scrape.created_at)}
                </Typography>
              </Box>
            )}

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
              
              {scrape && (
                <>
                  <Chip
                    size="small"
                    icon={<Search sx={{ fontSize: 14 }} />}
                    label={scrape.herramienta}
                    sx={{
                      height: 24,
                      fontSize: '0.75rem',
                      backgroundColor: alpha(getToolColor(scrape.herramienta), 0.1),
                      color: getToolColor(scrape.herramienta)
                    }}
                  />
                  
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
                </>
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
                {scrape.texto}
              </Typography>
              
              {/* Métricas de engagement */}
              {engagement > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUp sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                    <Typography variant="caption" color="text.secondary">
                      {engagement.toLocaleString()} interacciones
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOn sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                    <Typography variant="caption" color="text.secondary">
                      {scrape.location || 'Guatemala'}
                    </Typography>
                  </Box>
                </Box>
              )}
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

            <Box sx={{ display: 'flex', gap: 1 }}>
              {scrape?.enlace && (
                <Tooltip title="Ver tweet original">
                  <IconButton 
                    size="small" 
                    component={Link}
                    href={scrape.enlace}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <LinkIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
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
    </Card>
  );
};

export default MonitoreoCard;