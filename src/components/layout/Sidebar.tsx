import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp,
  ActivitySquare,
  Search,
  Database,
  Bookmark,
  Layers
} from 'lucide-react';
import { LanguageContext } from '../../context/LanguageContext';
import { useAdmin } from '../../hooks/useAdmin';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Chip,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  Paper,
  Tooltip
} from '@mui/material';
import { AdminPanelSettings } from '@mui/icons-material';

const translations = {
  es: {
    dashboard: 'Dashboard',
    trends: 'Tendencias',
    recent: 'Actividad reciente',
    sources: 'Fuentes',
    analytics: 'Analítica',
    library: 'Librería',
    administration: 'Administración',
    adminPanel: 'Panel Admin',
    comingSoon: 'Próximamente',
    version: 'Jornal V.0.0900',
    securityDisabled: 'Maintenance',
    securityTooltip: 'En mantenimiento por razones de seguridad'
  },
  en: {
    dashboard: 'Dashboard',
    trends: 'Trends',
    recent: 'Recent Activity',
    sources: 'Sources',
    analytics: 'Analytics',
    library: 'Codex',
    administration: 'Administration',
    adminPanel: 'Admin Panel',
    comingSoon: 'Coming Soon',
    version: 'Jornal V.0.0462',
    securityDisabled: 'Maintenance',
    securityTooltip: 'Under maintenance for security reasons'
  },
};

interface SidebarProps {
  closeSidebar?: () => void;
}

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  disabled?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ closeSidebar }) => {
  const { language, setLanguage } = useContext(LanguageContext);
  const { isAdmin } = useAdmin();

  const handleLanguageChange = (e: SelectChangeEvent<string>) => {
    setLanguage(e.target.value as 'es' | 'en');
    localStorage.setItem('lang', e.target.value);
  };

  const t = translations[language];

  const mainNavItems: NavItem[] = [
    {
      icon: <BarChart3 size={20} />,
      label: t.trends,
      path: '/dashboard'
    },
    {
      icon: <ActivitySquare size={20} />,
      label: t.recent,
      path: '/recent'
    },
    {
      icon: <Database size={20} />,
      label: t.library,
      path: '/codex'
    },
    {
      icon: <Bookmark size={20} />,
      label: 'News',
      path: '/news'
    },
    {
      icon: <BarChart3 size={20} />,
      label: 'Sondeos',
      path: '/sondeos'
    },
    {
      icon: <Layers size={20} />,
      label: language === 'es' ? 'Proyectos' : 'Projects',
      path: '/Projects'
    },
    {
      icon: <Search size={20} />,
      label: t.sources,
      path: '/sources',
      disabled: true
    },
    {
      icon: <TrendingUp size={20} />,
      label: t.analytics,
      path: '/analytics',
      disabled: true
    }
  ];

  const adminNavItems: NavItem[] = [
    {
      icon: <AdminPanelSettings />,
      label: t.adminPanel,
      path: '/admin'
    }
  ];

  return (
    <Box
      sx={{
        width: 240,
        height: '100vh',
        bgcolor: 'background.paper',
        borderRight: 1,
        borderColor: 'divider',
        overflowY: 'auto',
        pt: 2,
        pb: 6
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" color="text.primary" fontWeight="medium">
          {t.dashboard}
        </Typography>
      </Box>
      
      <List component="nav" sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        {mainNavItems.map((item) => (
          <ListItem 
            key={item.path} 
            disablePadding 
            onClick={item.disabled ? (e) => e.preventDefault() : closeSidebar}
            sx={{ 
              color: item.disabled ? 'text.disabled' : 'inherit',
              pointerEvents: item.disabled ? 'none' : 'auto',
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              opacity: item.disabled ? 0.5 : 1
            }}
          >
            {item.disabled ? (
              <Box 
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '0 20px 20px 0',
                  mr: 2,
                  ml: 1,
                  mb: 0.5,
                  py: 1.25,
                  px: 2,
                  position: 'relative',
                  ...(item.path === '#' && {
                    bgcolor: 'grey.100',
                    '&:hover': {
                      bgcolor: 'grey.100',
                    }
                  })
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: item.path === '#' ? 'grey.500' : 'text.disabled' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    color: item.path === '#' ? 'grey.500' : 'text.disabled',
                    fontStyle: item.path === '#' ? 'italic' : 'normal'
                  }}
                />
                {item.path === '#' ? (
                  <Tooltip 
                    title={t.securityTooltip}
                    arrow
                    placement="right"
                  >
                    <Chip
                      label={t.securityDisabled}
                      size="small"
                      sx={{
                        ml: 1,
                        fontSize: '0.6rem',
                        height: 20,
                        bgcolor: 'grey.200',
                        color: 'grey.700'
                      }}
                    />
                  </Tooltip>
                ) : (
                  <Chip
                    label={t.comingSoon}
                    size="small"
                    sx={{
                      ml: 1,
                      fontSize: '0.6rem',
                      height: 20,
                      bgcolor: 'action.disabledBackground',
                      color: 'text.disabled'
                    }}
                  />
                )}
              </Box>
            ) : (
              <ListItemButton
                component={NavLink}
                to={item.path}
                sx={{
                  borderRadius: '0 20px 20px 0',
                  mr: 2,
                  ml: 1,
                  mb: 0.5,
                  py: 1.25,
                  '&.active': {
                    bgcolor: 'action.selected',
                    '& .MuiListItemIcon-root': {
                      color: 'primary.main',
                    },
                    '& .MuiListItemText-primary': {
                      fontWeight: 'bold',
                      color: 'primary.main',
                    },
                    '& .indicator': {
                      backgroundColor: 'primary.main',
                      opacity: 1,
                      transform: 'scaleY(1)',
                    }
                  },
                  '&:hover': {
                    bgcolor: 'action.hover',
                    '& .indicator': {
                      backgroundColor: 'primary.lighter',
                      opacity: 0.5,
                      transform: 'scaleY(0.7)',
                    }
                  },
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
              >
                <Box 
                  className="indicator"
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: 6,
                    bottom: 6,
                    width: 3,
                    opacity: 0,
                    borderRadius: 4,
                    transform: 'scaleY(0.3)',
                    transition: 'all 0.3s ease',
                    backgroundColor: 'transparent',
                  }}
                />
                <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: 'medium'
                  }}
                />
              </ListItemButton>
            )}
          </ListItem>
        ))}
      </List>

      {/* Sección de Administración - Solo para admins */}
      {isAdmin && (
        <>
          <Divider sx={{ mx: 2 }} />
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight="medium">
              {t.administration}
            </Typography>
          </Box>
          <List component="nav" sx={{ py: 0 }}>
            {adminNavItems.map((item) => (
              <ListItem 
                key={item.path} 
                disablePadding 
                onClick={closeSidebar}
              >
                <ListItemButton
                  component={NavLink}
                  to={item.path}
                  sx={{
                    borderRadius: '0 20px 20px 0',
                    mr: 2,
                    ml: 1,
                    mb: 0.5,
                    py: 1.25,
                    '&.active': {
                      bgcolor: 'action.selected',
                      '& .MuiListItemIcon-root': {
                        color: 'primary.main',
                      },
                      '& .MuiListItemText-primary': {
                        fontWeight: 'bold',
                        color: 'primary.main',
                      },
                      '& .indicator': {
                        backgroundColor: 'primary.main',
                        opacity: 1,
                        transform: 'scaleY(1)',
                      }
                    },
                    '&:hover': {
                      bgcolor: 'action.hover',
                      '& .indicator': {
                        backgroundColor: 'primary.lighter',
                        opacity: 0.5,
                        transform: 'scaleY(0.7)',
                      }
                    },
                    transition: 'all 0.2s',
                    position: 'relative',
                  }}
                >
                  <Box 
                    className="indicator"
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 6,
                      bottom: 6,
                      width: 3,
                      opacity: 0,
                      borderRadius: 4,
                      transform: 'scaleY(0.3)',
                      transition: 'all 0.3s ease',
                      backgroundColor: 'transparent',
                    }}
                  />
                  <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: 'medium'
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}

      <Box
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          fontSize: '0.875rem',
          color: 'text.secondary',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="caption">{t.version}</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ mr: 1 }}>🌐</Typography>
          <FormControl size="small" variant="outlined" fullWidth>
            <Select
              value={language}
              onChange={handleLanguageChange}
              sx={{ 
                fontSize: '0.75rem',
                height: 28,
                '& fieldset': { 
                  borderColor: 'divider' 
                },
              }}
            >
              <MenuItem value="es">Español</MenuItem>
              <MenuItem value="en">English</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar;