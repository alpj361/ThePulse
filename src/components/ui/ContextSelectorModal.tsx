import React, { useState, useEffect } from 'react';
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
  FormControlLabel,
  Card
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
import NoticiasSelector from './NoticiasSelector';
import CodexSelector from './CodexSelector';
import { previewPrompt } from '../../services/sondeos';
import { useAuth } from '../../context/AuthContext';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { CircularProgress } from '@mui/material';

interface ContextSelectorModalProps {
  open: boolean;
  onClose: () => void;
  selectedContexts: string[];
  onContextChange: (contexts: string[]) => void;
  onMonitoreosChange?: (monitoreosIds: string[]) => void;
  onTrendsChange?: (trends: string[]) => void;
  onNoticiasChange?: (noticias: string[]) => void;
  onCodexChange?: (codex: string[]) => void;
  selectedMonitoreos?: string[];
  selectedTrends?: string[];
  selectedNoticias?: string[];
  selectedCodex?: string[];
  input?: string;  // Añadir input opcional para preview
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
    hasSubSelector: true
  },
  {
    value: 'codex',
    label: 'Codex',
    description: 'Analiza documentos y contenido de tu biblioteca personal',
    icon: <LibraryBooksIcon />,
    color: '#10B981',
    hasSubSelector: true
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
  onNoticiasChange,
  onCodexChange,
  selectedMonitoreos = [],
  selectedTrends = [],
  selectedNoticias = [],
  selectedCodex = [],
  input = 'Análisis de Tendencias'
}) => {
  const { user, isAdmin } = useAuth();
  const [expandedAccordions, setExpandedAccordions] = useState<string[]>([]);
  const [localSelectedContexts, setLocalSelectedContexts] = useState<string[]>(selectedContexts);
  const [localSelectedMonitoreos, setLocalSelectedMonitoreos] = useState<string[]>(selectedMonitoreos);
  const [localSelectedTrends, setLocalSelectedTrends] = useState<string[]>(selectedTrends);
  const [localSelectedNoticias, setLocalSelectedNoticias] = useState<string[]>(selectedNoticias);
  const [localSelectedCodex, setLocalSelectedCodex] = useState<string[]>(selectedCodex);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [promptPreview, setPromptPreview] = useState<{
    prompt_preview?: string;
    prompt_length?: number;
    contexto_stats?: any;
  }>({});
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  // Verificar rol de admin al montar el componente
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        const adminStatus = await isAdmin();
        setIsUserAdmin(adminStatus);
      }
    };
    checkAdminStatus();
  }, [user, isAdmin]);

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

  const handleNoticiasChange = (noticias: string[]) => {
    setLocalSelectedNoticias(noticias);
  };

  const handleCodexChange = (codex: string[]) => {
    setLocalSelectedCodex(codex);
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
    
    if (onNoticiasChange) {
      onNoticiasChange(localSelectedNoticias);
    }
    
    if (onCodexChange) {
      onCodexChange(localSelectedCodex);
    }
    
    onClose();
  };

  const handleCancel = () => {
    // Revertir cambios locales
    setLocalSelectedContexts(selectedContexts);
    setLocalSelectedMonitoreos(selectedMonitoreos);
    setLocalSelectedTrends(selectedTrends);
    setLocalSelectedNoticias(selectedNoticias);
    setLocalSelectedCodex(selectedCodex);
    onClose();
  };

  const handlePreviewPrompt = async () => {
    if (!isUserAdmin) {
      alert('Solo administradores pueden ver preview del prompt');
      return;
    }

    try {
      setLoadingPreview(true);
      const preview = await previewPrompt(
        input,
        localSelectedContexts,
        user?.id || '',
        {
          selectedTrends: localSelectedTrends,
          selectedNoticias: localSelectedNoticias,
          selectedCodex: localSelectedCodex
        }
      );
      setPromptPreview(preview);
      setPreviewModalOpen(true);
    } catch (error) {
      console.error('Error al generar preview:', error);
      alert('No se pudo generar el preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  const getSelectedItemsCount = (contextValue: string): number => {
    switch (contextValue) {
      case 'monitoreos':
        return localSelectedMonitoreos.length;
      case 'tendencias':
        return localSelectedTrends.length;
      case 'noticias':
        return localSelectedNoticias.length;
      case 'codex':
        return localSelectedCodex.length;
      default:
        return 0;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
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
        <IconButton onClick={onClose} size="small">
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
                  
                  {section.value === 'noticias' && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 500 }}>
                        Selecciona noticias específicas:
                      </Typography>
                      <NoticiasSelector 
                        selectedNoticias={localSelectedNoticias}
                        onNoticiasChange={handleNoticiasChange}
                      />
                    </Box>
                  )}
                  
                  {section.value === 'codex' && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 500 }}>
                        Selecciona documentos específicos:
                      </Typography>
                      <CodexSelector 
                        selectedCodex={localSelectedCodex}
                        onCodexChange={handleCodexChange}
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
          onClick={onClose}
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

        {/* Nuevo botón de preview para admins */}
        {isUserAdmin && (
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={handlePreviewPrompt}
            disabled={loadingPreview}
            startIcon={loadingPreview ? <CircularProgress size={20} /> : <VisibilityIcon />}
          >
            {loadingPreview ? 'Generando Preview...' : 'Preview del Prompt'}
          </Button>
        )}
      </DialogActions>

      {/* Modal de Preview */}
      <Dialog 
        open={previewModalOpen} 
        onClose={() => setPreviewModalOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Preview del Prompt</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Longitud del Prompt: {promptPreview.prompt_length} caracteres
          </Typography>
          <Card variant="outlined" style={{ marginTop: 16, padding: 16 }}>
            <Typography variant="body2" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
              {promptPreview.prompt_preview}
            </Typography>
          </Card>
          {promptPreview.contexto_stats && (
            <Box mt={2}>
              <Typography variant="h6">Estadísticas del Contexto</Typography>
              <pre>{JSON.stringify(promptPreview.contexto_stats, null, 2)}</pre>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewModalOpen(false)} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default ContextSelectorModal; 