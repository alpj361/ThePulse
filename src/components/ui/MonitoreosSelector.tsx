import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Chip, 
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  Twitter as TwitterIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  Public as PublicIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { getRecentScrapeGroups, RecentScrapeGroup } from '../../services/recentScrapes';
import { useAuth } from '../../context/AuthContext';

interface MonitoreosSelectorProps {
  onSelectionChange?: (selectedMonitoreos: string[]) => void;
}

const MonitoreosSelector: React.FC<MonitoreosSelectorProps> = ({ onSelectionChange }) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<RecentScrapeGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMonitoreos, setSelectedMonitoreos] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadMonitoreos();
    }
  }, [user]);

  const loadMonitoreos = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    
    try {
      const groupsData = await getRecentScrapeGroups(user.id, 50);
      setGroups(groupsData);

      // Los IDs de los scrapes representativos permitirán la selección
    } catch (error) {
      console.error('Error cargando monitoreos:', error);
      setError('No se pudieron cargar los monitoreos recientes');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMonitoreo = (monitoreoId: string) => {
    const newSelected = [...selectedMonitoreos];
    
    if (newSelected.includes(monitoreoId)) {
      // Remover si ya está seleccionado
      const index = newSelected.indexOf(monitoreoId);
      newSelected.splice(index, 1);
    } else {
      // Agregar si no está seleccionado
      newSelected.push(monitoreoId);
    }
    
    setSelectedMonitoreos(newSelected);
    
    // Notificar al componente padre
    if (onSelectionChange) {
      onSelectionChange(newSelected);
    }
  };

  const getHerramientaIcon = (herramienta: string) => {
    switch (herramienta?.toLowerCase()) {
      case 'twitter':
      case 'nitter_context':
        return <TwitterIcon fontSize="small" sx={{ color: '#1DA1F2' }} />;
      case 'nitter_profile':
        return <PersonIcon fontSize="small" sx={{ color: '#1DA1F2' }} />;
      case 'facebook':
        return <FacebookIcon fontSize="small" sx={{ color: '#1877F2' }} />;
      case 'instagram':
        return <InstagramIcon fontSize="small" sx={{ color: '#E1306C' }} />;
      default:
        return <PublicIcon fontSize="small" sx={{ color: '#9E9E9E' }} />;
    }
  };

  // Función para determinar si un grupo debe expandirse (mostrar todos los scrapes)
  const shouldExpandGroup = (group: RecentScrapeGroup): boolean => {
    const groupKey = group.group_key.toLowerCase();
    const isProfileGroup = groupKey.includes('perfil') || 
                          groupKey.includes('usuario') || 
                          groupKey.includes('profile') ||
                          groupKey.includes('user');
    
    // También expandir si tiene múltiples scrapes de nitter_profile
    const hasMultipleProfiles = group.scrapes.length > 1 && 
                               group.scrapes.some(s => s.herramienta === 'nitter_profile');
    
    return isProfileGroup || hasMultipleProfiles;
  };

  // Función para generar todos los elementos de la lista
  const generateListItems = () => {
    const items: React.ReactNode[] = [];
    let itemIndex = 0;

    groups.forEach((group, groupIndex) => {
      if (shouldExpandGroup(group)) {
        // Expandir el grupo: mostrar cada scrape individualmente
        group.scrapes.forEach((scrape, scrapeIndex) => {
          items.push(
            <React.Fragment key={scrape.id}>
              <ListItem 
                button 
                onClick={() => handleToggleMonitoreo(scrape.id)}
                sx={{ 
                  py: 1,
                  '&:hover': {
                    bgcolor: 'var(--color-accent-muted)',
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                  {getHerramientaIcon(scrape.herramienta)}
                </Box>
                <ListItemText 
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {scrape.generated_title || scrape.query_clean || scrape.query_original || scrape.profile}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip 
                        label={scrape.categoria || "General"} 
                        size="small" 
                        sx={{ 
                          height: '18px',
                          fontSize: '10px',
                          bgcolor: 'var(--color-muted)',
                          color: 'var(--color-muted-foreground)'
                        }} 
                      />
                      <Typography variant="caption" color="text.secondary">
                        {scrape.tweet_count || 0} tweets
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Checkbox
                    edge="end"
                    checked={selectedMonitoreos.includes(scrape.id)}
                    onChange={() => handleToggleMonitoreo(scrape.id)}
                    sx={{
                      color: 'var(--color-muted-foreground)',
                      '&.Mui-checked': {
                        color: 'var(--color-primary)',
                      },
                    }}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              {(itemIndex < getTotalItems() - 1) && (
                <Divider variant="fullWidth" sx={{ opacity: 0.6 }} />
              )}
            </React.Fragment>
          );
          itemIndex++;
        });
      } else {
        // Comportamiento original: mostrar solo el primer scrape del grupo
        const monitoreo = group.scrapes[0];
        items.push(
          <React.Fragment key={monitoreo.id}>
            <ListItem 
              button 
              onClick={() => handleToggleMonitoreo(monitoreo.id)}
              sx={{ 
                py: 1,
                '&:hover': {
                  bgcolor: 'var(--color-accent-muted)',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                {getHerramientaIcon(monitoreo.herramienta)}
              </Box>
              <ListItemText 
                primary={
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {monitoreo.generated_title || group.group_key || monitoreo.query_clean || monitoreo.query_original}
                  </Typography>
                }
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Chip 
                      label={monitoreo.categoria || "General"} 
                      size="small" 
                      sx={{ 
                        height: '18px',
                        fontSize: '10px',
                        bgcolor: 'var(--color-muted)',
                        color: 'var(--color-muted-foreground)'
                      }} 
                    />
                    <Typography variant="caption" color="text.secondary">
                      {group.total_tweets || monitoreo.tweet_count || 0} tweets
                    </Typography>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <Checkbox
                  edge="end"
                  checked={selectedMonitoreos.includes(monitoreo.id)}
                  onChange={() => handleToggleMonitoreo(monitoreo.id)}
                  sx={{
                    color: 'var(--color-muted-foreground)',
                    '&.Mui-checked': {
                      color: 'var(--color-primary)',
                    },
                  }}
                />
              </ListItemSecondaryAction>
            </ListItem>
            {(itemIndex < getTotalItems() - 1) && (
              <Divider variant="fullWidth" sx={{ opacity: 0.6 }} />
            )}
          </React.Fragment>
        );
        itemIndex++;
      }
    });

    return items;
  };

  // Función para calcular el total de elementos que se mostrarán
  const getTotalItems = (): number => {
    return groups.reduce((total, group) => {
      return total + (shouldExpandGroup(group) ? group.scrapes.length : 1);
    }, 0);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} sx={{ color: 'var(--color-primary)' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="error">{error}</Typography>
        <IconButton 
          size="small" 
          onClick={loadMonitoreos} 
          sx={{ mt: 1 }}
          aria-label="Recargar monitoreos"
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  }

  if (groups.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No hay monitoreos recientes disponibles
        </Typography>
      </Box>
    );
  }

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        maxHeight: '300px', 
        overflow: 'auto',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        bgcolor: 'var(--color-background)'
      }}
    >
      <List dense sx={{ p: 0 }}>
        {generateListItems()}
      </List>
    </Paper>
  );
};

export default MonitoreosSelector; 