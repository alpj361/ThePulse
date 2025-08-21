import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  Collapse,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  LocationOn,
  Delete,
  Analytics,
  FolderOpen
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { RecentScrape } from '../../services/recentScrapes';
import { MagicTweetCard } from './MagicTweetCard';
import { EXTRACTORW_API_URL } from '../../services/api';
import CommentIcon from '@mui/icons-material/Comment';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useSpreadsheet } from '../../context/SpreadsheetContext';
import { useAuth } from '../../context/AuthContext';
import { saveCodexItem, saveCodexItemsBatch, saveLinkRelations, supabase } from '../../services/supabase.ts';
import { processScrapeForSpreadsheet } from '../../utils/spreadsheetHelpers';
import { FaTable } from 'react-icons/fa';

interface RecentScrapeCardProps {
  scrape: RecentScrape;
  layout?: 'compact' | 'expanded' | 'full';
  showActions?: boolean;
  onDelete?: (scrapeId: string) => void;
  isDeleting?: boolean;
  onAddToProject?: (scrape: RecentScrape) => void;
}

const RecentScrapeCard: React.FC<RecentScrapeCardProps> = ({ 
  scrape, 
  layout = 'expanded',
  showActions = true,
  onDelete,
  isDeleting = false,
  onAddToProject
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [spreadsheetSent, setSpreadsheetSent] = useState(false);
  const [savingToCodex, setSavingToCodex] = useState(false);
  const [selectTweetsOpen, setSelectTweetsOpen] = useState(false);
  const [selectedTweets, setSelectedTweets] = useState<{ idx: number; text: string; url?: string; selected: boolean }[]>([]);
  const [analyzeMedia, setAnalyzeMedia] = useState<boolean>(true);
  
  // Contexto del spreadsheet
  const { addTweetData } = useSpreadsheet();

  // Helper: extract URL from a tweet
  const extractUrlFromTweet = (tweet: any): string | undefined => {
    if (tweet?.enlace && typeof tweet.enlace === 'string') return tweet.enlace;
    if (Array.isArray(tweet?.urls) && tweet.urls.length > 0) {
      const first = tweet.urls.find((u: any) => typeof u === 'string');
      if (first) return first;
    }
    const text = tweet?.texto || tweet?.contenido || '';
    const urlRegex = /(https?:\/\/[\w\-\.\/?#&=;%+:,~@!$'*\(\)\[\]]+)/g;
    const found = (typeof text === 'string' ? text.match(urlRegex) : null) || [];
    if (found.length > 0) return found[0];
    return undefined;
  };

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

  // Colores por grupo detectado
  const getGroupColor = (grupo: string) => {
    const colors = {
      'politica-guatemala': '#f44336',
      'economia-guatemala': '#2196f3', 
      'deportes-guatemala': '#ff9800',
      'cultura-guatemala': '#9c27b0',
      'social-guatemala': '#4caf50',
      'tecnologia': '#3f51b5',
      'internacional': '#795548',
      'entretenimiento': '#e91e63',
      'general': '#9e9e9e'
    };
    return colors[grupo as keyof typeof colors] || theme.palette.grey[500];
  };

  // Nombres de display para grupos
  const getGroupDisplayName = (grupo: string) => {
    const names = {
      'politica-guatemala': '🏛️ Política',
      'economia-guatemala': '💰 Economía',
      'deportes-guatemala': '⚽ Deportes', 
      'cultura-guatemala': '🎭 Cultura',
      'social-guatemala': '✊ Social',
      'tecnologia': '💻 Tecnología',
      'internacional': '🌍 Internacional',
      'entretenimiento': '🎬 Entretenimiento',
      'general': '📱 General'
    };
    return names[grupo as keyof typeof names] || grupo;
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  // Comentarios por tweet (map por tweet_id)
  const [tweetComments, setTweetComments] = useState<Record<string, any[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [errorComments, setErrorComments] = useState<Record<string, string>>({});
  const [commentsExpanded, setCommentsExpanded] = useState<Record<string, boolean>>({});

  const loadCommentsForTweet = async (tweet: any) => {
    try {
      setLoadingComments(prev => ({ ...prev, [tweet.tweet_id]: true }));
      setErrorComments(prev => ({ ...prev, [tweet.tweet_id]: '' }));

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('No hay sesión activa');

      // Usamos tweet_id numérico, el backend resolverá el scrape y el vínculo
      const resp = await fetch(`${EXTRACTORW_API_URL}/tweet-comments/${tweet.tweet_id}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Error obteniendo comentarios');
      setTweetComments(prev => ({ ...prev, [tweet.tweet_id]: data.comments || [] }));
    } catch (e: any) {
      setErrorComments(prev => ({ ...prev, [tweet.tweet_id]: e.message || 'Error' }));
    } finally {
      setLoadingComments(prev => ({ ...prev, [tweet.tweet_id]: false }));
    }
  };

  const extractCommentsForTweet = async (tweet: any) => {
    try {
      setLoadingComments(prev => ({ ...prev, [tweet.tweet_id]: true }));
      setErrorComments(prev => ({ ...prev, [tweet.tweet_id]: '' }));

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('No hay sesión activa');

      const url = extractUrlFromTweet(tweet) || `https://x.com/${(tweet.usuario || '').replace('@','')}/status/${tweet.tweet_id}`;
      const resp = await fetch(`${EXTRACTORW_API_URL}/nitter-comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ urls: [url], reply_limit: 20 })
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) throw new Error(data.error || 'Error extrayendo comentarios');

      // Tras extraer, cargar y mostrar
      await loadCommentsForTweet(tweet);
    } catch (e: any) {
      setErrorComments(prev => ({ ...prev, [tweet.tweet_id]: e.message || 'Error' }));
    } finally {
      setLoadingComments(prev => ({ ...prev, [tweet.tweet_id]: false }));
    }
  };

  // Autocargar comentarios guardados al expandir la sección de tweets
  useEffect(() => {
    if (expanded && Array.isArray((scrape as any).tweets)) {
      (scrape as any).tweets.forEach((t: any) => {
        const key = t?.tweet_id;
        if (!key) return;
        const already = Array.isArray(tweetComments[key]) && tweetComments[key].length > 0;
        const loading = !!loadingComments[key];
        if (!already && !loading) {
          loadCommentsForTweet(t);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (onDelete) {
      onDelete(scrape.id);
    }
    setDeleteDialogOpen(false);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleAddToProject = () => {
    if (onAddToProject) {
      onAddToProject(scrape);
    }
  };



  const handleAddLinksClick = async () => {
    if (!user?.id) {
      console.error('Usuario no autenticado');
      return;
    }
    // Build selection list from tweets
    const tweets = Array.isArray((scrape as any).tweets) ? (scrape as any).tweets : [];
    const opts = tweets.map((t: any, idx: number) => ({
      idx,
      text: t?.texto || t?.contenido || '',
      url: extractUrlFromTweet(t),
      selected: true
    }));
    setSelectedTweets(opts);
    setAnalyzeMedia(true);
    setSelectTweetsOpen(true);
  };

  const handleConfirmSaveToCodex = async () => {
    if (!user?.id) return;
    setSavingToCodex(true);
    try {
      // 1) Parent item (monitor)
      const parentItem = await saveCodexItem({
        user_id: user.id,
        tipo: 'item',
        original_type: 'monitor',
        titulo: `Monitoreo: ${scrape.query_clean || scrape.query_original || 'Sin título'}`,
        descripcion: (() => {
          const tweetCount = (scrape.tweets?.length || 0);
          const herramienta = scrape.herramienta || 'twitter';
          const query = scrape.query_clean || scrape.query_original || 'consulta';
          return `Análisis de ${tweetCount} tweets sobre "${query}" usando ${herramienta}`;
        })(),
        etiquetas: [
          scrape.categoria || 'sin-categoria',
          scrape.herramienta || 'twitter',
          scrape.location || 'guatemala',
          `${scrape.tweets?.length || 0} tweets`
        ].filter(Boolean),
        proyecto: 'Sin proyecto',
        recent_scrape_id: scrape.id,
        fecha: new Date().toISOString(),
        source_url: null,
        content: null,
        analyzed: false
      });

      if (!parentItem?.id) throw new Error('No se pudo crear el item de monitoreo');

      // 2) Child items for selected tweets having URL (multimedia links)
      const selected = selectedTweets.filter((s) => s.selected && s.url);
      let childItems: any[] = [];
      if (selected.length > 0) {
        const now = new Date().toISOString();
        const items = selected.map((s, idx) => ({
          user_id: user.id,
          tipo: 'item',
          original_type: 'link',
          titulo: `Enlace ${idx + 1}`,
          descripcion: s.text,
          etiquetas: ['link'],
          proyecto: 'Sin proyecto',
          fecha: now,
          source_url: s.url,
          url: s.url,
          analyzed: false
        }));
        childItems = await saveCodexItemsBatch(items);
        if (childItems.length > 0) {
          const relations = childItems.map((ci: any) => ({ item_id: ci.id, user_id: user.id, parent_item_id: parentItem.id }));
          try { await saveLinkRelations(relations); } catch {}
        }
      }

      // 3) Trigger multimedia analysis if requested
      if (analyzeMedia && childItems.length > 0) {
        try {
          const { analyzePendingLinks } = await import('../../services/pendingAnalysis');
          const itemIds = childItems.map((ci: any) => ci.id);
          const sessionRes = await supabase.auth.getSession();
          const authToken = sessionRes.data.session?.access_token || undefined;
          await analyzePendingLinks({ itemIds, processAll: false, dryRun: false }, authToken);
        } catch (e) {
          console.warn('Análisis de enlaces no disparado:', e);
        }
      }

      setSelectTweetsOpen(false);
      console.log('✅ Monitoreo y enlaces seleccionados guardados en Codex');
    } catch (err) {
      console.error('❌ Error guardando en Codex desde selección:', err);
    } finally {
      setSavingToCodex(false);
    }
  };



  // Función para enviar datos al spreadsheet
  const handleSendToSpreadsheet = () => {
    try {
      const processedData = processScrapeForSpreadsheet(scrape);
      
      if (processedData.length === 0) {
        console.warn('No se encontraron tweets para agregar al spreadsheet');
        return;
      }

      const title = scrape.generated_title || scrape.query_original || 'Tweets';
      addTweetData(processedData, title);

      // Mostrar feedback visual temporal
      setSpreadsheetSent(true);
      setTimeout(() => setSpreadsheetSent(false), 2000);
      
    } catch (error) {
      console.error('❌ Error enviando datos al spreadsheet:', error);
    }
  };

  return (
    <>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          border: `1px solid ${alpha(getToolColor(scrape.herramienta), 0.2)}`,
          borderLeft: `4px solid ${getToolColor(scrape.herramienta)}`,
          transition: 'all 0.2s ease-in-out',
          opacity: isDeleting ? 0.6 : 1,
          pointerEvents: isDeleting ? 'none' : 'auto',
          '&:hover': {
            transform: layout === 'compact' ? 'translateY(-2px)' : 'translateY(-4px)',
            boxShadow: `0 8px 25px ${alpha(getToolColor(scrape.herramienta), 0.15)}`,
            borderColor: alpha(getToolColor(scrape.herramienta), 0.4)
          },
        }}
      >
        <CardContent>
          {/* Overlay de carga para eliminación */}
          {isDeleting && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: alpha(theme.palette.background.paper, 0.8),
                zIndex: 1,
                borderRadius: 2
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={32} thickness={4} />
                <Typography variant="caption" color="text.secondary">
                  Eliminando...
                </Typography>
              </Box>
            </Box>
          )}

          {/* Header con Título Generado y botones de acción */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {scrape.generated_title || scrape.query_original}
              </Typography>
              {/* Query original como subtítulo si hay título generado */}
              {scrape.generated_title && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'block',
                    mt: 0.5
                  }}
                >
                  Query: {scrape.query_original}
                </Typography>
              )}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                <Chip
                  label={scrape.categoria || ''}
                  size="small"
                  sx={{
                    backgroundColor: alpha(getCategoryColor(scrape.categoria || ''), 0.1),
                    color: getCategoryColor(scrape.categoria || ''),
                    fontWeight: 'medium',
                  }}
                />
                {/* Mostrar grupo detectado si está disponible */}
                {scrape.detected_group && (
                  <Chip
                    label={getGroupDisplayName(scrape.detected_group || '')}
                    size="small"
                    sx={{
                      backgroundColor: alpha(getGroupColor(scrape.detected_group || ''), 0.1),
                      color: getGroupColor(scrape.detected_group || ''),
                      fontWeight: 'medium',
                    }}
                  />
                )}
                {scrape.location && (
                  <Chip
                    icon={<LocationOn sx={{ fontSize: 14 }} />}
                    label={scrape.location}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
              {/* Botón para enviar al spreadsheet */}
              <Tooltip title={spreadsheetSent ? "¡Enviado al spreadsheet!" : "Enviar tweets al spreadsheet"}>
                <span>
                  <IconButton
                    onClick={handleSendToSpreadsheet}
                    size="small"
                    sx={{
                      color: spreadsheetSent ? '#4caf50' : theme.palette.primary.main,
                      backgroundColor: spreadsheetSent 
                        ? alpha('#4caf50', 0.15) 
                        : alpha(theme.palette.primary.main, 0.08),
                      border: spreadsheetSent 
                        ? `1.5px solid #4caf50` 
                        : `1.5px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                      ml: 0.5,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: spreadsheetSent 
                          ? alpha('#4caf50', 0.25) 
                          : alpha(theme.palette.primary.main, 0.18),
                        border: spreadsheetSent 
                          ? `1.5px solid #4caf50` 
                          : `1.5px solid ${theme.palette.primary.main}`
                      }
                    }}
                    disabled={!scrape.tweets || scrape.tweets.length === 0}
                  >
                    <FaTable size={14} />
                  </IconButton>
                </span>
              </Tooltip>
              
              {/* Botón de guardar en Codex */}
              <Tooltip title="Guardar en Codex">
                <span>
                  <IconButton
                    onClick={handleAddLinksClick}
                    size="small"
                    sx={{
                      color: theme.palette.primary.main,
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      border: `1.5px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                      ml: 0.5,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.18),
                        border: `1.5px solid ${theme.palette.primary.main}`
                      }
                    }}
                    disabled={savingToCodex}
                  >
                    {savingToCodex ? (
                      <CircularProgress size={14} />
                    ) : (
                      <Analytics fontSize="small" />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
              {/* Botón de agregar al proyecto */}
              {showActions && onAddToProject && (
                <Tooltip title="Agregar a proyecto">
                  <IconButton
                    onClick={handleAddToProject}
                    size="small"
                    sx={{
                      color: theme.palette.success.main,
                      backgroundColor: alpha(theme.palette.success.main, 0.08),
                      border: `1.5px solid ${alpha(theme.palette.success.main, 0.3)}`,
                      ml: 0.5,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.success.main, 0.18),
                        border: `1.5px solid ${theme.palette.success.main}`
                      }
                    }}
                  >
                    <FolderOpen fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              
              {/* Botón de eliminar */}
              {showActions && onDelete && (
                <Tooltip title="Eliminar extracción">
                  <IconButton 
                    onClick={handleDeleteClick} 
                    size="small"
                    disabled={isDeleting}
                    sx={{
                      color: theme.palette.error.main,
                      backgroundColor: alpha(theme.palette.error.main, 0.08),
                      border: `1.5px solid ${alpha(theme.palette.error.main, 0.3)}`,
                      ml: 0.5,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.error.main, 0.18),
                        border: `1.5px solid ${theme.palette.error.main}`
                      }
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {/* Botón de expandir */}
              <Tooltip title={expanded ? 'Mostrar menos' : 'Mostrar tweets'}>
                <IconButton onClick={toggleExpanded} size="small" disabled={isDeleting}>
                  {expanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Métricas del scrape */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-around', 
            alignItems: 'center', 
            mb: 2,
            p: 1,
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.grey[500], 0.05)
          }}>
              <Tooltip title="Tweets extraídos">
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight="bold">{scrape.tweet_count}</Typography>
                  <Typography variant="caption" color="text.secondary">Tweets</Typography>
                </Box>
              </Tooltip>
              <Divider orientation="vertical" flexItem />
              <Tooltip title="Engagement total">
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight="bold">{(scrape.total_engagement ?? 0).toLocaleString()}</Typography>
                  <Typography variant="caption" color="text.secondary">Engagement</Typography>
                </Box>
              </Tooltip>
              <Divider orientation="vertical" flexItem />
              <Tooltip title="Engagement promedio">
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight="bold">{scrape.avg_engagement ?? 0}</Typography>
                  <Typography variant="caption" color="text.secondary">Promedio</Typography>
                </Box>
              </Tooltip>
          </Box>

          {/* Tweets extraídos */}
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {scrape.tweets && scrape.tweets.length > 0 ? (
                scrape.tweets.map((tweet: any) => (
                  <Box key={tweet.tweet_id || tweet.id}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 1 }}>
                      <Tooltip title="Extraer comentarios">
                        <span>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<CommentIcon />}
                            disabled={!!loadingComments[tweet.tweet_id]}
                            onClick={() => extractCommentsForTweet(tweet)}
                          >
                            {loadingComments[tweet.tweet_id] ? 'Extrayendo...' : 'Comentarios'}
                          </Button>
                        </span>
                      </Tooltip>
                      <Tooltip title="Actualizar comentarios">
                        <span>
                          <IconButton size="small" disabled={!!loadingComments[tweet.tweet_id]} onClick={() => loadCommentsForTweet(tweet)}>
                            <RefreshIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>

                    <MagicTweetCard tweet={tweet} layout="expanded" />

                    {/* Hilo de comentarios */}
                    {errorComments[tweet.tweet_id] && (
                      <Typography variant="caption" color="error">{errorComments[tweet.tweet_id]}</Typography>
                    )}
                    {Array.isArray(tweetComments[tweet.tweet_id]) && tweetComments[tweet.tweet_id].length > 0 && (
                      <Box sx={{ mt: 1, pl: 2, borderLeft: `2px solid ${alpha(theme.palette.divider, 0.6)}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            Comentarios ({tweetComments[tweet.tweet_id].length})
                          </Typography>
                          <IconButton size="small" onClick={() => setCommentsExpanded(prev => ({ ...prev, [tweet.tweet_id]: !prev[tweet.tweet_id] }))}>
                            {commentsExpanded[tweet.tweet_id] ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                          </IconButton>
                        </Box>
                        <Collapse in={!!commentsExpanded[tweet.tweet_id]} timeout="auto" unmountOnExit>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {tweetComments[tweet.tweet_id].map((c: any, idx: number) => (
                              <Box key={idx} sx={{ bgcolor: alpha(theme.palette.background.default, 0.6), p: 1, borderRadius: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  @{c.comment_user} {c.comment_likes > 0 ? `· ${c.comment_likes} ❤` : ''}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">{c.comment_text}</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Collapse>
                      </Box>
                    )}
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 2 }}>
                  No se encontraron tweets para este scrape.
                </Typography>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* <Warning color="warning" /> */}
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-dialog-description" variant="body2">
            ¿Estás seguro de que quieres eliminar esta extracción de tweets?
          </Typography>
          <Box sx={{ mt: 2, p: 2, backgroundColor: alpha(theme.palette.grey[500], 0.1), borderRadius: 1 }}>
            <Typography variant="body2" fontWeight="medium">
              {scrape.generated_title || scrape.query_original}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {scrape.tweet_count} tweets extraídos • {formatDate(scrape.created_at)}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            startIcon={<Delete />}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal seleccionar tweets a incluir */}
      <Dialog open={selectTweetsOpen} onClose={() => setSelectTweetsOpen(false)}>
        <DialogTitle>Selecciona tweets a incluir en el Codex</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Se creará un item de monitoreo y subitems para los enlaces seleccionados.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <Button
              size="small"
              onClick={() =>
                setSelectedTweets((prev) => prev.map((s) => ({ ...s, selected: true })))
              }
            >
              Seleccionar todo
            </Button>
            <Button
              size="small"
              onClick={() =>
                setSelectedTweets((prev) => prev.map((s) => ({ ...s, selected: false })))
              }
            >
              Deseleccionar todo
            </Button>
          </Box>
          <Box sx={{ maxHeight: 360, overflow: 'auto', pr: 1 }}>
            {selectedTweets.map((s, i) => (
              <Box key={s.idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <Checkbox
                  checked={s.selected}
                  onChange={(e) => {
                    const copy = [...selectedTweets]
                    copy[i] = { ...s, selected: e.target.checked }
                    setSelectedTweets(copy)
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{s.text || '(sin texto)'}</Typography>
                  {s.url && (
                    <Typography variant="caption" color="primary">
                      {s.url}
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
          <FormControlLabel
            sx={{ mt: 2 }}
            control={<Checkbox checked={analyzeMedia} onChange={(e) => setAnalyzeMedia(e.target.checked)} />}
            label="Analizar multimedia (enlaces seleccionados)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectTweetsOpen(false)} disabled={savingToCodex}>Cancelar</Button>
          <Button onClick={handleConfirmSaveToCodex} variant="contained" disabled={savingToCodex}>
            {savingToCodex ? <CircularProgress size={18} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>


    </>
  );
};

export default RecentScrapeCard; 