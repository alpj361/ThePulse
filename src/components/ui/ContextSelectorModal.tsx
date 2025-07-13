import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  Article as ArticleIcon,
  LibraryBooks as LibraryBooksIcon,
  Monitor as MonitorIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import TrendSelector from './TrendSelector';
import MonitoreosSelector from './MonitoreosSelector';

interface ContextSelectorModalProps {
  open: boolean;
  onClose: () => void;
  selectedContexts: string[];
  onContextChange: (contexts: string[]) => void;
  onMonitoreosChange?: (monitoreosIds: string[]) => void;
  onTrendsChange?: (trends: string[]) => void;
  selectedMonitoreos?: string[];
  selectedTrends?: string[];
}

interface ContextSection {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  hasSubSelector: boolean;
}

const contextSections: ContextSection[] = [
  {
    value: 'tendencias',
    label: 'Tendencias',
    description: 'Analiza tendencias actuales en redes sociales y temas virales',
    icon: <TrendingUpIcon />,
    color: '#4F46E5',
    hasSubSelector: true
  },
  {
    value: 'noticias',
    label: 'Noticias',
    description: 'Analiza noticias recientes de medios de comunicación',
    icon: <ArticleIcon />,
    color: '#0EA5E9',
    hasSubSelector: false
  },
  {
    value: 'codex',
    label: 'Codex',
    description: 'Analiza documentos y contenido de tu biblioteca personal',
    icon: <LibraryBooksIcon />,
    color: '#10B981',
    hasSubSelector: false
  },
  {
    value: 'monitoreos',
    label: 'Monitoreos',
    description: 'Analiza monitoreos de actividad reciente y perfiles seguidos',
    icon: <MonitorIcon />,
    color: '#F59E0B',
    hasSubSelector: true
  }
];

const ContextSelectorModal: React.FC<ContextSelectorModalProps> = ({
  open,
  onClose,
  selectedContexts,
  onContextChange,
  onMonitoreosChange,
  onTrendsChange,
  selectedMonitoreos = [],
  selectedTrends = []
}) => {
  const [expandedAccordions, setExpandedAccordions] = useState<string[]>([]);
  const [localSelectedContexts, setLocalSelectedContexts] = useState<string[]>(selectedContexts);
  const [localSelectedMonitoreos, setLocalSelectedMonitoreos] = useState<string[]>(selectedMonitoreos);
  const [localSelectedTrends, setLocalSelectedTrends] = useState<string[]>(selectedTrends);

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordions(prev => 
      isExpanded 
        ? [...prev, panel]
        : prev.filter(p => p !== panel)
    );
  };

  const handleContextToggle = (contextValue: string) => {
    const newContexts = localSelectedContexts.includes(contextValue)
      ? localSelectedContexts.filter(c => c !== contextValue)
      : [...localSelectedContexts, contextValue];
    
    setLocalSelectedContexts(newContexts);
    
    // Auto-expandir el accordion si se selecciona un contexto con sub-selector
    const contextSection = contextSections.find(s => s.value === contextValue);
    if (contextSection?.hasSubSelector && newContexts.includes(contextValue)) {
      setExpandedAccordions(prev => 
        prev.includes(contextValue) ? prev : [...prev, contextValue]
      );
    }
  };

  const handleMonitoreosChange = (monitoreosIds: string[]) => {
    setLocalSelectedMonitoreos(monitoreosIds);
  };

  const handleTrendsChange = (trends: string[]) => {
    setLocalSelectedTrends(trends);
  };

  const handleConfirm = () => {
    // Aplicar todos los cambios
    onContextChange(localSelectedContexts);
    
    if (onMonitoreosChange) {
      onMonitoreosChange(localSelectedMonitoreos);
    }
    
    if (onTrendsChange) {
      onTrendsChange(localSelectedTrends);
    }
    
    onClose();
  };

  const handleCancel = () => {
    // Revertir cambios locales
    setLocalSelectedContexts(selectedContexts);
    setLocalSelectedMonitoreos(selectedMonitoreos);
    setLocalSelectedTrends(selectedTrends);
    onClose();
  };

  const getSelectedItemsCount = (contextValue: string): number => {
    switch (contextValue) {
      case 'monitoreos':
        return localSelectedMonitoreos.length;
      case 'tendencias':
        return localSelectedTrends.length;
      default:
        return 0;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 'var(--radius-lg)',
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Fuentes de Contexto
          </Typography>
          <Chip 
            size="small" 
            label={`${localSelectedContexts.length} seleccionado${localSelectedContexts.length !== 1 ? 's' : ''}`}
            sx={{ 
              bgcolor: 'var(--color-primary)',
              color: 'white',
              fontSize: '0.75rem'
            }}
          />
        </Box>
        <IconButton onClick={handleCancel} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ px: 3, pb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Selecciona las fuentes de información que deseas incluir en tu análisis de sondeo.
          </Typography>
        </Box>

        <Divider />

        <Box sx={{ px: 3, py: 2 }}>
          {contextSections.map((section) => (
            <Accordion 
              key={section.value}
              expanded={expandedAccordions.includes(section.value)}
              onChange={handleAccordionChange(section.value)}
              sx={{ 
                mb: 1,
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                '&:before': { display: 'none' },
                boxShadow: 'none'
              }}
            >
              <AccordionSummary
                expandIcon={section.hasSubSelector ? <ExpandMoreIcon /> : null}
                sx={{ 
                  minHeight: 56,
                  '&.Mui-expanded': {
                    minHeight: 56,
                  },
                  '& .MuiAccordionSummary-content': {
                    my: 1,
                    alignItems: 'center'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSelectedContexts.includes(section.value)}
                        onChange={() => handleContextToggle(section.value)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: section.color,
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: section.color,
                          },
                        }}
                      />
                    }
                    label=""
                    sx={{ mr: 1 }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    color: section.color
                  }}>
                    {section.icon}
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {section.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                      {section.description}
                    </Typography>
                  </Box>

                  {localSelectedContexts.includes(section.value) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon 
                        sx={{ 
                          color: section.color, 
                          fontSize: '1.2rem' 
                        }} 
                      />
                      {section.hasSubSelector && getSelectedItemsCount(section.value) > 0 && (
                        <Chip 
                          size="small" 
                          label={`${getSelectedItemsCount(section.value)} elementos`}
                          sx={{ 
                            bgcolor: `${section.color}20`,
                            color: section.color,
                            fontSize: '0.75rem'
                          }}
                        />
                      )}
                    </Box>
                  )}
                </Box>
              </AccordionSummary>
              
              {section.hasSubSelector && (
                <AccordionDetails sx={{ pt: 0, pb: 2 }}>
                  <Divider sx={{ mb: 2 }} />
                  
                  {section.value === 'tendencias' && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 500 }}>
                        Selecciona tendencias específicas:
                      </Typography>
                      <TrendSelector 
                        selectedTrends={localSelectedTrends}
                        onTrendChange={handleTrendsChange}
                      />
                    </Box>
                  )}
                  
                  {section.value === 'monitoreos' && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 500 }}>
                        Selecciona monitoreos específicos:
                      </Typography>
                      <MonitoreosSelector 
                        onSelectionChange={handleMonitoreosChange}
                      />
                    </Box>
                  )}
                </AccordionDetails>
              )}
            </Accordion>
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button 
          onClick={handleCancel}
          variant="outlined"
          sx={{ borderColor: 'var(--color-border)' }}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleConfirm}
          variant="contained"
          sx={{ 
            bgcolor: 'var(--color-primary)',
            '&:hover': {
              bgcolor: 'var(--color-primary)',
              opacity: 0.9
            }
          }}
        >
          Confirmar Selección
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContextSelectorModal; 