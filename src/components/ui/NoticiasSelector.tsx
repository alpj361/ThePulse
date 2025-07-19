import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Button,
  IconButton
} from '@mui/material';
import {
  Search as SearchIcon,
  Article as ArticleIcon,
  SelectAll as SelectAllIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { getLatestNews } from '../../services/supabase';

interface NewsItem {
  id: string;
  titulo: string;
  resumen?: string;
  fuente: string;
  url?: string;
  fecha: string;
  categoria?: string;
  keywords?: string[];
}

interface NoticiasSelectorProps {
  selectedNoticias: string[];
  onNoticiasChange: (noticias: string[]) => void;
}

const NoticiasSelector: React.FC<NoticiasSelectorProps> = ({
  selectedNoticias,
  onNoticiasChange
}) => {
  const { user } = useAuth();
  const [noticias, setNoticias] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredNoticias, setFilteredNoticias] = useState<NewsItem[]>([]);

  // Cargar noticias disponibles
  useEffect(() => {
    if (user) {
      loadNoticias();
    }
  }, [user]);

  // Filtrar noticias por término de búsqueda
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = noticias.filter(noticia =>
        noticia.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        noticia.resumen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        noticia.fuente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        noticia.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredNoticias(filtered);
    } else {
      setFilteredNoticias(noticias.slice(0, 20)); // Mostrar las primeras 20
    }
  }, [searchTerm, noticias]);

  const loadNoticias = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Bypass getLatestNews y usar supabase directamente para evitar problemas de mapeo
      const { supabase } = await import('../../services/supabase');
      const { data: newsData, error } = await supabase
        .from('news')
        .select('*')
        .order('fecha', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      console.log('📰 Datos directos de BD:', newsData);
      if (newsData && newsData.length > 0) {
        console.log('📰 Primera noticia ejemplo:', newsData[0]);
        setNoticias(newsData);
      } else {
        setNoticias([]);
      }
    } catch (err: any) {
      console.error('Error cargando noticias:', err);
      setError('Error cargando noticias: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNoticia = (noticiaId: string) => {
    const newSelection = selectedNoticias.includes(noticiaId)
      ? selectedNoticias.filter(id => id !== noticiaId)
      : [...selectedNoticias, noticiaId];
    
    onNoticiasChange(newSelection);
  };

  const handleSelectAll = () => {
    const allIds = filteredNoticias.map(n => `noticia_${n.id}`);
    onNoticiasChange(allIds);
  };

  const handleClearAll = () => {
    onNoticiasChange([]);
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'Sin fecha';
      
      // Intentar parsear la fecha
      const date = new Date(dateString);
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        console.warn('📰 Fecha inválida recibida:', dateString);
        return 'Fecha inválida';
      }
      
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('📰 Error formateando fecha:', dateString, error);
      return dateString || 'Sin fecha';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={32} />
        <Typography sx={{ ml: 2 }}>Cargando noticias...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        <Button onClick={loadNoticias} size="small" sx={{ ml: 1 }}>
          Reintentar
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Barra de búsqueda y controles */}
      <Box sx={{ mb: 2 }}>
        <TextField
          placeholder="Buscar noticias..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            startIcon={<SelectAllIcon />}
            onClick={handleSelectAll}
            size="small"
            variant="outlined"
          >
            Seleccionar Todo
          </Button>
          <Button
            startIcon={<ClearIcon />}
            onClick={handleClearAll}
            size="small"
            variant="outlined"
          >
            Limpiar
          </Button>
        </Box>

        {selectedNoticias.length > 0 && (
          <Typography variant="body2" color="primary" sx={{ mb: 2 }}>
            ✅ {selectedNoticias.length} noticias seleccionadas
          </Typography>
        )}
      </Box>

      {/* Lista de noticias */}
      <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
        {filteredNoticias.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            {searchTerm ? 'No se encontraron noticias' : 'No hay noticias disponibles'}
          </Typography>
        ) : (
          filteredNoticias.map((noticia) => {
            const noticiaId = `noticia_${noticia.id}`;
            const isSelected = selectedNoticias.includes(noticiaId);
            
            // Debug: log de cada noticia al renderizar
            console.log('📰 Renderizando noticia:', {
              id: noticia.id,
              titulo: noticia.titulo,
              fecha: noticia.fecha,
              fuente: noticia.fuente,
              categoria: noticia.categoria,
              resumen: noticia.resumen?.substring(0, 50) + '...'
            });
            
            return (
              <Card 
                key={noticia.id}
                sx={{ 
                  mb: 1, 
                  border: isSelected ? 2 : 1,
                  borderColor: isSelected ? 'primary.main' : 'grey.300',
                  bgcolor: isSelected ? 'primary.50' : 'background.paper',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: 1
                  }
                }}
                onClick={() => handleToggleNoticia(noticiaId)}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleToggleNoticia(noticiaId)}
                      size="small"
                      sx={{ mt: -0.5 }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    <ArticleIcon 
                      sx={{ 
                        color: 'primary.main', 
                        mt: 0.5, 
                        fontSize: '1.2rem' 
                      }} 
                    />
                    
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: 600,
                          mb: 0.5,
                          lineHeight: 1.3
                        }}
                      >
                        {noticia.titulo || 'Sin título'}
                      </Typography>
                      
                      {noticia.resumen && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            mb: 1,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {noticia.resumen}
                        </Typography>
                      )}
                      
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Chip 
                          label={noticia.fuente || 'Sin fuente'}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        
                        {noticia.categoria && (
                          <Chip 
                            label={noticia.categoria}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        )}
                        
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(noticia.fecha)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })
        )}
      </Box>
    </Box>
  );
};

export default NoticiasSelector; 