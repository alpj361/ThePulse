import React, { useState, useRef, useEffect } from 'react';
import { Box, Chip, Typography, Tooltip, ClickAwayListener, Button } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArticleIcon from '@mui/icons-material/Article';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import MonitorIcon from '@mui/icons-material/Monitor';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SettingsIcon from '@mui/icons-material/Settings';
import ContextSelectorModal from './ContextSelectorModal';

interface ContextOption {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
}

interface MultiContextSelectorProps {
  selectedContexts: string[];
  onContextChange: (contexts: string[]) => void;
  onMonitoreosChange?: (monitoreosIds: string[]) => void;
  onTrendsChange?: (trends: string[]) => void;
  selectedMonitoreos?: string[];
  selectedTrends?: string[];
  disabled?: boolean;
}

const contextOptions: ContextOption[] = [
  {
    value: 'tendencias',
    label: 'Tendencias',
    description: 'Analiza tendencias actuales en redes sociales',
    icon: <TrendingUpIcon />,
    color: 'var(--color-primary)',
    gradient: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)'
  },
  {
    value: 'noticias',
    label: 'Noticias',
    description: 'Analiza noticias recientes de medios',
    icon: <ArticleIcon />,
    color: 'var(--color-secondary)',
    gradient: 'linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)'
  },
  {
    value: 'codex',
    label: 'Codex',
    description: 'Analiza documentos de tu biblioteca',
    icon: <LibraryBooksIcon />,
    color: 'var(--color-accent)',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
  },
  {
    value: 'monitoreos',
    label: 'Monitoreos',
    description: 'Analiza monitoreos de actividad reciente',
    icon: <MonitorIcon />,
    color: 'var(--color-warning)',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
  }
];

const MultiContextSelector: React.FC<MultiContextSelectorProps> = ({
  selectedContexts,
  onContextChange,
  onMonitoreosChange,
  onTrendsChange,
  selectedMonitoreos = [],
  selectedTrends = [],
  disabled = false
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  
  const getDisplayLabel = () => {
    if (selectedContexts.length === 0) return 'Seleccionar contextos';
    if (selectedContexts.length === 1) {
      const option = contextOptions.find(opt => opt.value === selectedContexts[0]);
      return option?.label || 'Contexto';
    }
    return `${selectedContexts.length} contextos seleccionados`;
  };

  const getSelectedContextsDetails = () => {
    return selectedContexts.map(contextValue => {
      const option = contextOptions.find(opt => opt.value === contextValue);
      let subItemsCount = 0;
      
      if (contextValue === 'monitoreos') {
        subItemsCount = selectedMonitoreos.length;
      } else if (contextValue === 'tendencias') {
        subItemsCount = selectedTrends.length;
      }
      
      return {
        ...option,
        subItemsCount
      };
    });
  };

  const handleOpenModal = () => {
    if (!disabled) {
      setModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <>
      <Box sx={{ position: 'relative', width: '100%' }}>
        <Button
          onClick={handleOpenModal}
          disabled={disabled}
          variant="outlined"
          sx={{
            width: '100%',
            justifyContent: 'space-between',
            p: 1.5,
            borderRadius: 'var(--radius-md)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-foreground)',
            textTransform: 'none',
            '&:hover': {
              borderColor: 'var(--color-primary)',
              bgcolor: 'var(--color-accent-muted)'
            },
            '&:disabled': {
              opacity: 0.6,
              cursor: 'not-allowed'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon sx={{ fontSize: '1.2rem', color: 'var(--color-muted-foreground)' }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {getDisplayLabel()}
            </Typography>
          </Box>
          <KeyboardArrowDownIcon sx={{ fontSize: '1.2rem', color: 'var(--color-muted-foreground)' }} />
        </Button>

        {/* Preview de contextos seleccionados */}
        {selectedContexts.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1, 
            mt: 1.5,
            p: 1,
            bgcolor: 'var(--color-muted)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)'
          }}>
                         {getSelectedContextsDetails().map((context) => {
               const chipProps: any = {
                 key: context.value,
                 label: (
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                     <Typography variant="caption" sx={{ fontWeight: 500 }}>
                       {context.label}
                     </Typography>
                     {context.subItemsCount > 0 && (
                       <Typography 
                         variant="caption" 
                         sx={{ 
                           color: 'var(--color-muted-foreground)',
                           fontWeight: 400
                         }}
                       >
                         ({context.subItemsCount})
                       </Typography>
                     )}
                   </Box>
                 ),
                 size: "small" as const,
                 sx: {
                   bgcolor: `${context.color}20`,
                   color: context.color,
                   border: `1px solid ${context.color}40`,
                   '& .MuiChip-icon': {
                     color: context.color
                   }
                 }
               };
               
               if (React.isValidElement(context.icon)) {
                 chipProps.icon = context.icon;
               }
               
               return <Chip {...chipProps} />;
             })}
          </Box>
        )}

        {/* Mensaje de ayuda */}
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ 
            display: 'block', 
            mt: 1,
            fontSize: '0.75rem'
          }}
        >
          {selectedContexts.length === 0 
            ? 'Haz clic para seleccionar fuentes de información'
            : `${selectedContexts.length} fuente${selectedContexts.length !== 1 ? 's' : ''} seleccionada${selectedContexts.length !== 1 ? 's' : ''}`
          }
        </Typography>
      </Box>

      {/* Modal de selección */}
      <ContextSelectorModal
        open={modalOpen}
        onClose={handleCloseModal}
        selectedContexts={selectedContexts}
        onContextChange={onContextChange}
        onMonitoreosChange={onMonitoreosChange}
        onTrendsChange={onTrendsChange}
        selectedMonitoreos={selectedMonitoreos}
        selectedTrends={selectedTrends}
      />
    </>
  );
};

export default MultiContextSelector; 