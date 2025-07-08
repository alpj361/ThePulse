import React, { useState, useEffect, useContext } from 'react';
import { flushSync } from 'react-dom';
import { BarChart3 as BarChartIcon, LayoutDashboard, Search, TrendingUp } from 'lucide-react';
import WordCloud from '../components/ui/WordCloud';
import BarChart from '../components/ui/BarChart';
import KeywordListCard from '../components/ui/KeywordListCard';
import AboutCard from '../components/ui/AboutCard';
import StatisticsCard from '../components/ui/StatisticsCard';
import TrendingTweetsSection from '../components/ui/TrendingTweetsSection';
import NitterTweetsSection from '../components/ui/NitterTweetsSection';

import { wordCloudData as mockWordCloudData, topKeywords as mockTopKeywords, categoryData as mockCategoryData } from '../data/mockData';
import { fetchAndStoreTrends, getLatestTrends, AboutInfo, Statistics } from '../services/api';
import { LanguageContext } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { CategoryCount } from '../types';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Backdrop,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Collapse
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import UpdateIcon from '@mui/icons-material/Update';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TwitterIcon from '@mui/icons-material/Twitter';

const translations = {
  es: {
    summary: 'Resumen de Tendencias',
    location: 'Ubicación: Guatemala',
    searchTrends: 'Buscar Tendencias',
    searching: 'Buscando...',
    lastUpdate: 'Última actualización',
    trendingKeywords: 'Palabras Clave Tendencia',
    selected: 'Seleccionado',
    categoryDistribution: 'Distribución por Categoría',
    mainTopics: 'Temas Principales',
    about: 'Información Detallada',
    aboutDesc: 'Información detallada sobre cada tendencia con contexto y relevancia.',
    statistics: 'Estadísticas de Procesamiento',
    statisticsDesc: 'Métricas detalladas sobre el análisis de tendencias.',
    loading: 'Cargando datos de tendencias...',
    loadingTrends: 'Obteniendo datos de tendencias...',
    loadingDetails: 'Cargando información detallada...',
    error: 'Error',
    close: 'Cerrar',
    dataError: 'Los datos recibidos no tienen el formato esperado. Por favor, intente de nuevo.',
    fetchError: 'Error al obtener datos de tendencias. Por favor, intente nuevamente.',
    noDetailsAvailable: 'Información detallada no disponible. Haz clic en "Buscar Tendencias" para obtener datos actualizados.',
    noStatisticsAvailable: 'Estadísticas de procesamiento no disponibles.'
  },
  en: {
    summary: 'Trends Summary',
    location: 'Location: Guatemala',
    searchTrends: 'Search Trends',
    searching: 'Searching...',
    lastUpdate: 'Last update',
    trendingKeywords: 'Trending Keywords',
    selected: 'Selected',
    categoryDistribution: 'Category Distribution',
    mainTopics: 'Main Topics',
    about: 'Detailed Information',
    aboutDesc: 'Detailed information about each trend with context and relevance.',
    statistics: 'Processing Statistics',
    statisticsDesc: 'Detailed metrics about trend analysis.',
    loading: 'Loading trend data...',
    loadingTrends: 'Fetching trend data...',
    loadingDetails: 'Loading detailed information...',
    error: 'Error',
    close: 'Close',
    dataError: 'The received data is not in the expected format. Please try again.',
    fetchError: 'Error fetching trend data. Please try again.',
    noDetailsAvailable: 'Detailed information not available. Click "Search Trends" to get updated data.',
    noStatisticsAvailable: 'Processing statistics not available.'
  },
};

export const Trends = () => {
  const { language } = useContext(LanguageContext);
  const { session } = useAuth();
  const t = translations[language];
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [wordCloudData, setWordCloudData] = useState<any[]>([]);
  const [topKeywords, setTopKeywords] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [showCategoryUpdate, setShowCategoryUpdate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [aboutInfo, setAboutInfo] = useState<AboutInfo[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isPollingForDetails, setIsPollingForDetails] = useState(false);
  const [lastProcessingTimestamp, setLastProcessingTimestamp] = useState<string | null>(null);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [tweetsExpanded, setTweetsExpanded] = useState(false);
  const [nitterTweetsExpanded, setNitterTweetsExpanded] = useState(false);

  const [statisticsExpanded, setStatisticsExpanded] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadLatestTrends = async () => {
      try {
        console.log('🔄 Intentando cargar las últimas tendencias...');
        const latestData = await getLatestTrends();
        console.log('📊 Datos de tendencias recibidos:', latestData);
        
        if (latestData) {
          console.log('✅ Actualizando con datos del backend...');
          
          // Actualizar solo si tenemos datos válidos
          if (latestData.wordCloudData && latestData.wordCloudData.length > 0) {
          setWordCloudData(latestData.wordCloudData);
          }
          if (latestData.topKeywords && latestData.topKeywords.length > 0) {
          setTopKeywords(latestData.topKeywords);
          }
          if (latestData.categoryData && latestData.categoryData.length > 0) {
            // Transformar formato del backend (name, value) al formato esperado por el frontend (category, count)
            const transformedCategoryData = latestData.categoryData.map((item: any) => ({
              category: item.name || item.category,
              count: item.value || item.count
            }));
            setCategoryData(transformedCategoryData);
          }
          if (latestData.about && Array.isArray(latestData.about)) {
            setAboutInfo(latestData.about);
          }
          if (latestData.statistics) {
            setStatistics(latestData.statistics);
          }
          
          setLastUpdated(new Date(latestData.timestamp));
        } else {
          console.log('⚠️  No hay datos previos disponibles');
          // No usar datos mock, simplemente mostrar pantalla vacía con botón para cargar
        }
      } catch (err) {
        console.error('❌ Error loading latest trends:', err);
        console.log('🔄 No hay datos previos, usuario debe hacer clic en buscar');
      } finally {
        setInitialLoading(false);
      }
    };

    loadLatestTrends();
  }, []);

  const fetchTrendingData = async () => {
    console.log('🚀 Botón Buscar Tendencias clickeado');
    setIsLoading(true);
    setError(null);
    
    try {
      // Obtener token de autenticación
      const authToken = session?.access_token;
      if (!authToken) {
        console.warn('⚠️  No se encontró token de autenticación');
        setError('No se encontró token de autenticación. Por favor, inicia sesión nuevamente.');
        return;
      }
      
      console.log('🔑 Token de autenticación obtenido');
      console.log('📡 Llamando a fetchAndStoreTrends() con token...');
      const data = await fetchAndStoreTrends(authToken);
      console.log('✅ Datos recibidos de fetchAndStoreTrends:', data);
        
      // Validar que tenemos datos básicos mínimos
      if (data && (data.wordCloudData || data.topKeywords || data.categoryData)) {
        console.log('📊 Actualizando estado con datos básicos...');
        
        // Actualizar con datos básicos inmediatamente
        if (data.wordCloudData && data.wordCloudData.length > 0) {
          setWordCloudData(data.wordCloudData);
        }
        if (data.topKeywords && data.topKeywords.length > 0) {
          setTopKeywords(data.topKeywords);
        }
        if (data.categoryData && data.categoryData.length > 0) {
          // Transformar formato del backend (name, value) al formato esperado por el frontend (category, count)
          const transformedCategoryData = data.categoryData.map((item: any) => ({
            category: item.name || item.category,
            count: item.value || item.count
          }));
          setCategoryData(transformedCategoryData);
        }
        
        // Actualizar about y statistics si están disponibles
        if (data.about && Array.isArray(data.about)) {
          setAboutInfo(data.about);
        }
        if (data.statistics) {
          setStatistics(data.statistics);
        }
        
        setLastUpdated(new Date(data.timestamp || new Date()));
        console.log('✅ Estado actualizado exitosamente');
        
        // Iniciar polling para datos completos si tenemos timestamp
        if (data.timestamp && data.processing_status === 'basic_completed') {
          console.log('🔄 Iniciando polling para datos completos...');
          setLastProcessingTimestamp(data.timestamp);
          pollForCompleteData(data.timestamp);
        }
        
      } else {
        console.warn('⚠️  Datos recibidos están vacíos o tienen formato inválido');
        setError('No se pudieron obtener datos de tendencias. Intentando con datos locales...');
        
        // Mantener los datos actuales en lugar de mostrar error
        console.log('📦 Manteniendo datos actuales en pantalla');
        }
      
      } catch (err) {
      console.error('❌ Error en fetchTrendingData:', err);
      setError('Error al obtener datos de tendencias. Mostrando datos previos.');
      
      // No limpiar los datos existentes, solo mostrar el error brevemente
      setTimeout(() => {
        setError(null);
      }, 3000);
      } finally {
      console.log('🏁 Finalizando carga...');
        setIsLoading(false);
      }
  };

  const handleWordClick = (word: string, value: number) => {
    setSelectedKeyword(word);
  };

  // Función para hacer polling de datos completos
  const pollForCompleteData = async (timestamp: string) => {
    console.log('🔄 Iniciando polling para datos completos...');
    setIsPollingForDetails(true);
    
    const maxAttempts = 15; // 15 intentos = ~150 segundos máximo
    let attempt = 0;
    
    const poll = async () => {
      attempt++;
      console.log(`📡 Polling intento ${attempt}/${maxAttempts} para timestamp: ${timestamp}`);
      
      try {
        const response = await fetch(`${import.meta.env.VITE_EXTRACTORW_API_URL || 'https://server.standatpd.com/api'}/processingStatus/${encodeURIComponent(timestamp)}`);
        
        if (response.ok) {
          const statusData = await response.json();
          console.log('📊 Estado del procesamiento:', statusData.status);
          
          if (statusData.status === 'complete' && statusData.has_about && statusData.has_statistics) {
            console.log('✅ ¡Datos completos listos!');
            
            // Actualizar con datos completos - forzar re-render inmediato
            flushSync(() => {
              if (statusData.data.about && Array.isArray(statusData.data.about)) {
                setAboutInfo(statusData.data.about);
                setAboutExpanded(true);
              }
              if (statusData.data.statistics) {
                setStatistics(statusData.data.statistics);
                setStatisticsExpanded(true);
              }
              if (statusData.data.categoryData && Array.isArray(statusData.data.categoryData)) {
                // Transformar formato del backend (name, value) al formato esperado por el frontend (category, count)
                const transformedCategoryData = statusData.data.categoryData.map((item: any) => ({
                  category: item.name || item.category,
                  count: item.value || item.count
                }));
                setCategoryData(transformedCategoryData);
                setShowCategoryUpdate(true);
              }
              
              setIsPollingForDetails(false);
            });
            
            // Ocultar el indicador de actualización después de un momento
            setTimeout(() => setShowCategoryUpdate(false), 3500);
            
            // Mostrar notificación de éxito
            console.log('🎉 Análisis IA completado - secciones expandidas automáticamente');
            
            return;
          }
          
          if (statusData.status === 'error') {
            console.error('❌ Error en procesamiento detectado');
            setIsPollingForDetails(false);
            return;
          }
        }
        
        // Continuar polling si no está completo
        if (attempt < maxAttempts) {
          setTimeout(poll, 8000); // Esperar 8 segundos antes del siguiente intento
        } else {
          console.log('⏰ Polling timeout - datos completos no disponibles');
          setIsPollingForDetails(false);
        }
        
      } catch (error) {
        console.error(`❌ Error en polling intento ${attempt}:`, error);
        if (attempt < maxAttempts) {
          setTimeout(poll, 8000);
        } else {
          setIsPollingForDetails(false);
        }
      }
    };
    
    // Esperar 10 segundos antes del primer poll para dar tiempo al procesamiento
    setTimeout(poll, 10000);
  };

  // Eliminar función de polling automático
  // Agregar función para reintentar consulta manualmente
  const retryFetchDetails = async () => {
    if (!lastProcessingTimestamp) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_EXTRACTORW_API_URL || 'https://server.standatpd.com/api'}/processingStatus/${encodeURIComponent(lastProcessingTimestamp)}`);
      if (response.ok) {
        const statusData = await response.json();
        if (statusData.status === 'complete' && statusData.has_about && statusData.has_statistics) {
          // Forzar re-render inmediato también en retry manual
          flushSync(() => {
            if (statusData.data.about && Array.isArray(statusData.data.about)) {
              setAboutInfo(statusData.data.about);
              setAboutExpanded(true); // Auto-expandir
            }
            if (statusData.data.statistics) {
              setStatistics(statusData.data.statistics);
              setStatisticsExpanded(true); // Auto-expandir
            }
            setIsPollingForDetails(false);
          });
        } else {
          setError('El análisis con IA aún está en proceso. Intenta de nuevo en 1-2 minutos.');
        }
      } else {
        setError('No se pudo consultar el estado del procesamiento.');
      }
    } catch (error) {
      setError('Error al consultar el estado del procesamiento.');
    } finally {
      setIsLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh'
        }}
      >
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 2,
            borderRadius: 4,
            bgcolor: 'background.paper',
            boxShadow: theme.shadows[1]
          }}
        >
          <CircularProgress size={24} color="primary" />
          <Typography>{t.loading}</Typography>
        </Paper>
      </Box>
    );
  }

  // Pantalla vacía cuando no hay datos cargados
  const hasData = wordCloudData.length > 0 || topKeywords.length > 0 || categoryData.length > 0;
  
  if (!hasData && !isLoading) {
    return (
      <Box sx={{ '& > *': { mb: 4 }, animation: 'fadeIn 0.4s ease-out' }}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: theme.shadows[1],
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: theme.shadows[2],
            },
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 2,
            position: 'relative',
            zIndex: 1
          }}>
            <Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 0.5,
                pb: 1,
                position: 'relative'
              }}>
                <Box 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    mr: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'rotate(5deg) scale(1.1)',
                      bgcolor: alpha(theme.palette.primary.main, 0.15)
                    }
                  }}
                >
                  <LayoutDashboard size={24} color={theme.palette.primary.main} />
                </Box>
                <Typography 
                  variant="h5" 
                  fontWeight="bold" 
                  color="text.primary"
                  sx={{
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                >
                  {t.summary}
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                color: 'text.secondary',
                ml: 1
              }}>
                <LocationOnIcon sx={{ fontSize: '1.1rem', mr: 0.5, color: alpha(theme.palette.primary.main, 0.7) }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 'medium',
                    borderRadius: 10,
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    px: 1.5, 
                    py: 0.5
                  }}
                >
                  {t.location}
                </Typography>
              </Box>
            </Box>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<SearchIcon />}
              onClick={fetchTrendingData}
              disabled={isLoading}
              sx={{ 
                px: 3, 
                py: 1.2,
                boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                borderRadius: 3,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.85)})`,
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
                transition: 'all 0.3s'
              }}
            >
              {isLoading ? t.searching : t.searchTrends}
            </Button>
          </Box>
        </Paper>

        {/* Welcome Message */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 4,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: theme.shadows[1],
            textAlign: 'center'
          }}
        >
          <Box sx={{ mb: 3 }}>
            <TrendingUp size={64} color={theme.palette.primary.main} />
          </Box>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Bienvenido al Dashboard de Tendencias
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
            Haz clic en "Buscar Tendencias" para obtener las últimas tendencias de redes sociales 
            con análisis detallado usando inteligencia artificial.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Chip label="Análisis en tiempo real" icon={<TrendingUp />} />
            <Chip label="Contexto con IA" icon={<Search />} />
            <Chip label="Estadísticas detalladas" icon={<BarChartIcon />} />
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ '& > *': { mb: 4 }, animation: 'fadeIn 0.4s ease-out' }}>
      {/* Header Section */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: theme.shadows[1],
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: theme.shadows[2],
          },
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          position: 'relative',
          zIndex: 1
        }}>
          <Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 0.5,
              pb: 1,
              position: 'relative'
            }}>
              <Box 
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  mr: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'rotate(5deg) scale(1.1)',
                    bgcolor: alpha(theme.palette.primary.main, 0.15)
                  }
                }}
              >
                <LayoutDashboard size={24} color={theme.palette.primary.main} />
              </Box>
              <Typography 
                variant="h5" 
                fontWeight="bold" 
                color="text.primary"
                sx={{
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              >
                {t.summary}
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              color: 'text.secondary',
              ml: 1
            }}>
              <LocationOnIcon sx={{ fontSize: '1.1rem', mr: 0.5, color: alpha(theme.palette.primary.main, 0.7) }} />
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 'medium',
                  borderRadius: 10,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  px: 1.5, 
                  py: 0.5
                }}
              >
                {t.location}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 2
          }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SearchIcon />}
              onClick={(e) => {
                e.preventDefault();
                console.log('Evento de click en botón detectado');
                fetchTrendingData();
              }}
              disabled={isLoading}
              sx={{ 
                px: 3, 
                py: 1.2,
                boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                borderRadius: 3,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.85)})`,
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
                transition: 'all 0.3s'
              }}
            >
              {isLoading ? t.searching : t.searchTrends}
            </Button>
            
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                bgcolor: alpha(theme.palette.secondary.main, 0.08),
                py: 0.8,
                px: 2,
                borderRadius: 3
              }}
            >
              <UpdateIcon sx={{ 
                fontSize: '1.1rem', 
                mr: 1, 
                color: theme.palette.secondary.main,
                animation: isLoading ? 'spin 2s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }} />
              <Typography 
                variant="body2" 
                sx={{ 
                  color: alpha(theme.palette.text.secondary, 0.9),
                  fontWeight: 'medium',
                  fontSize: '0.85rem'
                }}
              >
                {t.lastUpdate}: {new Intl.DateTimeFormat('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit'
                }).format(lastUpdated)}
              </Typography>
            </Box>
            
            {/* Indicador de procesamiento de detalles */}
            {isPollingForDetails && (
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  py: 0.8,
                  px: 2,
                  borderRadius: 3,
                  animation: 'pulse 2s infinite'
                }}
              >
                <CircularProgress size={16} sx={{ mr: 1 }} />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: theme.palette.info.main,
                    fontWeight: 'medium',
                    fontSize: '0.8rem'
                  }}
                >
                  Cargando detalles...
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Word Cloud Section */}
      <Paper
        ref={containerRef}
        elevation={0}
        sx={{
          p: 3,
          pt: 4,
          borderRadius: 4,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: theme.shadows[1],
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: theme.shadows[6],
            transform: 'translateY(-4px)'
          },
          overflow: 'hidden',
          position: 'relative',
          background: `linear-gradient(170deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
        }}
      >
        {/* Decorative top border with gradient */}
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            height: 5, 
            background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)' 
          }}
        />
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexWrap: 'wrap',
          gap: 1
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            pb: 1,
            borderBottom: '2px solid',
            borderColor: alpha(theme.palette.primary.main, 0.2),
            px: 1
          }}>
            <TrendingUp size={20} color={theme.palette.primary.main} style={{ marginRight: 8 }} />
            <Typography 
              variant="h6" 
              color="text.primary" 
              fontWeight="medium"
              fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
            >
              {t.trendingKeywords}
            </Typography>
          </Box>
          
          {selectedKeyword && (
            <Chip
              label={`${t.selected}: ${selectedKeyword}`}
              color="primary"
              sx={{ 
                borderRadius: 6,
                fontWeight: 'medium',
                background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.light, 0.9)} 100%)`,
                color: '#fff',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                '&:hover': {
                  transform: 'scale(1.05)'
                },
                transition: 'transform 0.2s ease',
                border: 'none',
                py: 0.5,
                '& .MuiChip-label': { 
                  fontWeight: 'medium' 
                }
              }}
            />
          )}
        </Box>
        
        <Box sx={{ 
          width: '100%',
          height: '450px',
          minHeight: '400px',
          position: 'relative',
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 3,
            background: alpha(theme.palette.primary.main, 0.03),
            zIndex: -1
          },
          animation: 'pulse 5s infinite ease-in-out',
          '@keyframes pulse': {
            '0%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.01)' },
            '100%': { transform: 'scale(1)' }
          }
        }}>
          {isPollingForDetails && (
            <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
              <CircularProgress size={24} color="secondary" />
            </Box>
          )}
          <WordCloud 
            data={wordCloudData}
            onWordClick={(word) => {
              console.log('Clicked word:', word);
            }}
          />
        </Box>
      </Paper>

      {/* Categories and Keywords Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              bgcolor: alpha(theme.palette.background.paper, 0.85),
              backdropFilter: 'blur(12px)',
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.15),
              boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.08)}`,
              height: '100%',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                boxShadow: `0 12px 48px ${alpha(theme.palette.primary.main, 0.12)}`,
                transform: 'translateY(-8px)',
                borderColor: alpha(theme.palette.primary.main, 0.25),
                bgcolor: alpha(theme.palette.background.paper, 0.9),
              },
              overflow: 'hidden',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(90deg, 
                  ${theme.palette.primary.main} 0%, 
                  ${alpha(theme.palette.primary.main, 0.8)} 50%, 
                  ${theme.palette.primary.light} 100%)`,
                borderRadius: '4px 4px 0 0',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `radial-gradient(ellipse at top left, ${alpha(theme.palette.primary.main, 0.03)} 0%, transparent 50%)`,
                pointerEvents: 'none',
                zIndex: -1
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1.5 }}>
              <Box 
                sx={{ 
                  p: 1.5, 
                  borderRadius: '12px',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  backdropFilter: 'blur(8px)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.15),
                    transform: 'scale(1.05)'
                  }
                }}
              >
                <BarChartIcon 
                  sx={{ 
                    fontSize: 20, 
                    color: theme.palette.primary.main,
                    filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))'
                  }} 
                />
              </Box>
              <Typography 
                variant="h6" 
                color="text.primary" 
                fontWeight="600"
                letterSpacing="-0.025em"
                sx={{
                  fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
                  background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${alpha(theme.palette.primary.main, 0.8)} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {t.categoryDistribution}
              </Typography>
              <Box sx={{ ml: 'auto' }}>
                <Chip
                  label={`${categoryData?.length || 0} categorías`}
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    color: theme.palette.primary.main,
                    fontWeight: '500',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                    backdropFilter: 'blur(4px)'
                  }}
                />
              </Box>
            </Box>
            {categoryData && categoryData.length > 0 ? (
              <Box sx={{ position: 'relative' }}>
                {isPollingForDetails && (
                  <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
                    <CircularProgress size={20} color="secondary" />
                  </Box>
                )}
                <BarChart data={categoryData} title={t.categoryDistribution} />
              </Box>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                minHeight: 180,
                flexDirection: 'column',
                gap: 2
              }}>
                <CircularProgress 
                  size={32} 
                  sx={{ 
                    color: theme.palette.primary.main,
                    filter: 'drop-shadow(0 2px 8px rgba(59, 130, 246, 0.3))'
                  }} 
                />
                <Typography 
                  color="text.secondary"
                  sx={{ 
                    fontWeight: '500',
                    letterSpacing: '-0.01em'
                  }}
                >
                  Cargando categorías...
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} lg={4}>
          <KeywordListCard 
            keywords={topKeywords} 
            title={t.mainTopics} 
          />
        </Grid>
      </Grid>

      {/* About Section - Desplegable */}
      <Accordion 
        expanded={aboutExpanded} 
        onChange={() => setAboutExpanded(!aboutExpanded)}
        elevation={0}
        sx={{
          mt: 4,
          borderRadius: 4,
          border: '1px solid',
          borderColor: alpha(theme.palette.success.main, 0.15),
          boxShadow: `0 8px 32px ${alpha(theme.palette.success.main, 0.08)}`,
          bgcolor: alpha(theme.palette.background.paper, 0.85),
          backdropFilter: 'blur(12px)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          position: 'relative',
          '&:hover': {
            boxShadow: `0 12px 48px ${alpha(theme.palette.success.main, 0.12)}`,
            borderColor: alpha(theme.palette.success.main, 0.25),
            bgcolor: alpha(theme.palette.background.paper, 0.9),
          },
          '&:before': {
            display: 'none',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, 
              ${theme.palette.success.main} 0%, 
              ${alpha(theme.palette.success.main, 0.8)} 50%, 
              ${theme.palette.success.light} 100%)`,
            borderRadius: '4px 4px 0 0',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(ellipse at top left, ${alpha(theme.palette.success.main, 0.03)} 0%, transparent 50%)`,
            pointerEvents: 'none',
            zIndex: -1
          }
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            p: 3,
            '& .MuiAccordionSummary-content': {
              alignItems: 'center',
              gap: 2
            },
            '& .MuiAccordionSummary-expandIconWrapper': {
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              color: theme.palette.success.main,
              '&.Mui-expanded': {
                transform: 'rotate(180deg)',
              }
            }
          }}
        >
          <Box 
            component="span" 
            sx={{ 
              display: 'inline-flex', 
              p: 1.5, 
              borderRadius: '12px',
              bgcolor: alpha(theme.palette.success.main, 0.1),
              backdropFilter: 'blur(8px)',
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: alpha(theme.palette.success.main, 0.15),
                transform: 'scale(1.05)'
              }
            }}
          >
            <InfoOutlinedIcon 
              sx={{ 
                fontSize: 18, 
                color: theme.palette.success.main,
                filter: 'drop-shadow(0 2px 4px rgba(76, 175, 80, 0.3))'
              }} 
            />
          </Box>
          <Typography 
            variant="h6" 
            color="text.primary" 
            fontWeight="600"
            letterSpacing="-0.025em"
            sx={{
              fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
              background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${alpha(theme.palette.success.main, 0.8)} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Información Detallada de Tendencias
          </Typography>
          {aboutInfo && aboutInfo.length > 0 && (
            <Chip 
              label={`${aboutInfo.length} tendencias`} 
              size="small" 
              sx={{ 
                bgcolor: alpha(theme.palette.success.main, 0.08),
                color: theme.palette.success.main,
                fontWeight: '500',
                border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
                backdropFilter: 'blur(4px)'
              }} 
            />
          )}
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3, pt: 0 }}>
          {aboutInfo && aboutInfo.length > 0 ? (
            <Grid container spacing={3}>
              {aboutInfo.map((about, index) => {
                const keyword = topKeywords && topKeywords[index] 
                  ? topKeywords[index].keyword 
                  : `Tendencia ${index + 1}`;
                return (
                  <Grid item xs={12} md={6} lg={4} key={index}>
                    <AboutCard 
                      keyword={keyword}
                      aboutInfo={about}
                      index={index}
                    />
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Box 
              sx={{ 
                textAlign: 'center', 
                py: 6,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
              }}
            >
              <CircularProgress size={32} />
              <Typography color="text.secondary">
                El análisis con IA está en proceso. Vuelve a intentar en 1-2 minutos.
              </Typography>
              <Button variant="outlined" onClick={retryFetchDetails} disabled={isLoading} sx={{ mt: 2 }}>
                Reintentar
              </Button>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Statistics Section - Desplegable */}
      <Accordion 
        expanded={statisticsExpanded} 
        onChange={() => setStatisticsExpanded(!statisticsExpanded)}
        elevation={0}
        sx={{
          mt: 3,
          borderRadius: 4,
          border: '1px solid',
          borderColor: alpha(theme.palette.warning.main, 0.15),
          boxShadow: `0 8px 32px ${alpha(theme.palette.warning.main, 0.08)}`,
          bgcolor: alpha(theme.palette.background.paper, 0.85),
          backdropFilter: 'blur(12px)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          position: 'relative',
          '&:hover': {
            boxShadow: `0 12px 48px ${alpha(theme.palette.warning.main, 0.12)}`,
            borderColor: alpha(theme.palette.warning.main, 0.25),
            bgcolor: alpha(theme.palette.background.paper, 0.9),
          },
          '&:before': {
            display: 'none',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, 
              ${theme.palette.warning.main} 0%, 
              ${alpha(theme.palette.warning.main, 0.8)} 50%, 
              ${theme.palette.warning.light} 100%)`,
            borderRadius: '4px 4px 0 0',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(ellipse at bottom right, ${alpha(theme.palette.warning.main, 0.03)} 0%, transparent 50%)`,
            pointerEvents: 'none',
            zIndex: -1
          }
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            p: 3,
            '& .MuiAccordionSummary-content': {
              alignItems: 'center',
              gap: 2
            },
            '& .MuiAccordionSummary-expandIconWrapper': {
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              color: theme.palette.warning.main,
              '&.Mui-expanded': {
                transform: 'rotate(180deg)',
              }
            }
          }}
        >
          <Box 
            component="span" 
            sx={{ 
              display: 'inline-flex', 
              p: 1.5, 
              borderRadius: '12px',
              bgcolor: alpha(theme.palette.warning.main, 0.1),
              backdropFilter: 'blur(8px)',
              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: alpha(theme.palette.warning.main, 0.15),
                transform: 'scale(1.05)'
              }
            }}
          >
            <BarChartIcon 
              sx={{ 
                fontSize: 18, 
                color: theme.palette.warning.main,
                filter: 'drop-shadow(0 2px 4px rgba(255, 152, 0, 0.3))'
              }} 
            />
          </Box>
          <Typography 
            variant="h6" 
            color="text.primary" 
            fontWeight="600"
            letterSpacing="-0.025em"
            sx={{
              fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
              background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${alpha(theme.palette.warning.main, 0.8)} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Estadísticas Detalladas
          </Typography>
          <Box sx={{ ml: 'auto' }}>
            <Chip
              label="Métricas avanzadas"
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.warning.main, 0.08),
                color: theme.palette.warning.main,
                fontWeight: '500',
                border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}`,
                backdropFilter: 'blur(4px)'
              }}
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3, pt: 0 }}>
          {statistics ? (
            <StatisticsCard statistics={statistics} />
          ) : (
            <Box 
              sx={{ 
                textAlign: 'center', 
                py: 6,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
              }}
            >
              {isPollingForDetails ? (
                <>
                  <CircularProgress size={32} />
                  <Typography color="text.secondary">
                    Generando estadísticas de procesamiento...
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    Analizando resultados de IA
                  </Typography>
                </>
              ) : hasData ? (
                <>
                  <BarChartIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                  <Typography color="text.secondary">
                    Estadísticas se generarán automáticamente tras el análisis con IA
                  </Typography>
                </>
              ) : (
                <>
                  <BarChartIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                  <Typography color="text.secondary">
                    {t.noStatisticsAvailable}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Trending Tweets Section - Desplegable */}
      <Accordion 
        expanded={tweetsExpanded} 
        onChange={() => setTweetsExpanded(!tweetsExpanded)}
        elevation={0}
        sx={{
          mt: 3,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: theme.shadows[1],
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: theme.shadows[3],
          },
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          '&:before': {
            display: 'none',
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            p: 3,
            '& .MuiAccordionSummary-content': {
              alignItems: 'center',
              gap: 1
            }
          }}
        >
          <Box 
            component="span" 
            sx={{ 
              display: 'inline-flex', 
              p: 1, 
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.secondary.main, 0.1)
            }}
          >
            <TwitterIcon sx={{ fontSize: 16, color: theme.palette.secondary.main }} />
          </Box>
          <Typography 
            variant="h6" 
            color="text.primary" 
            fontWeight="medium"
            fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
          >
            Lo que pasa en las redes
          </Typography>
          <Chip 
            label="Tweets en tiempo real" 
            size="small" 
            sx={{ 
              ml: 1,
              bgcolor: alpha(theme.palette.secondary.main, 0.1),
              color: theme.palette.secondary.main
            }} 
          />
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <TrendingTweetsSection />
        </AccordionDetails>
      </Accordion>



      {/* Error Dialog */}
      <Dialog 
        open={!!error} 
        onClose={() => setError(null)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 0,
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            maxWidth: 380
          }
        }}
        TransitionProps={{
          timeout: 400
        }}
      >
        <Box sx={{ 
          bgcolor: 'error.main', 
          py: 1.5, 
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Box 
            sx={{ 
              position: 'absolute',
              width: 120,
              height: 120,
              borderRadius: '50%',
              bgcolor: alpha('#fff', 0.1),
              top: -40,
              right: -40
            }} 
          />
          <Box 
            sx={{ 
              position: 'absolute',
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: alpha('#fff', 0.1),
              bottom: -20,
              left: -20
            }} 
          />
          <DialogTitle sx={{ 
            color: '#fff', 
            textAlign: 'center',
            fontWeight: 'bold',
            py: 0,
            position: 'relative'
          }}>
            {t.error}
          </DialogTitle>
        </Box>
        <DialogContent sx={{ mt: 2, mb: 1 }}>
          <Typography 
            color="text.secondary" 
            textAlign="center" 
            sx={{ 
              fontSize: '0.95rem',
              py: 1 
            }}
          >
            {error}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ 
          justifyContent: 'center', 
          pb: 3, 
          pt: 1
        }}>
          <Button 
            onClick={() => setError(null)}
            variant="contained" 
            color="primary"
            sx={{ 
              px: 4, 
              py: 1,
              borderRadius: 3,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.85)})`,
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
              }
            }}
          >
            {t.close}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading Backdrop */}
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backdropFilter: 'blur(5px)',
          backgroundColor: alpha(theme.palette.background.default, 0.7)
        }}
        open={isLoading}
      >
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            px: 4,
            py: 3,
            borderRadius: 4,
            bgcolor: 'background.paper',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            maxWidth: 400,
            position: 'relative',
            overflow: 'hidden',
            animation: 'pulse 2s infinite ease-in-out',
            '@keyframes pulse': {
              '0%': { boxShadow: '0 10px 30px rgba(0,0,0,0.12)' },
              '50%': { boxShadow: '0 10px 40px rgba(0,0,0,0.18)' },
              '100%': { boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }
            }
          }}
        >
          <Box sx={{ position: 'relative' }}>
            <CircularProgress 
              color="primary" 
              size={34}
              thickness={4}
              sx={{
                animation: 'spin 1.5s infinite ease',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }}
            />
          </Box>
          <Typography 
            sx={{ 
              fontWeight: 'medium',
              fontSize: '0.95rem',
              background: `linear-gradient(45deg, ${theme.palette.text.primary}, ${alpha(theme.palette.text.primary, 0.7)})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {t.loadingTrends}
          </Typography>
        </Paper>
      </Backdrop>
    </Box>
  );
};

export default Trends;