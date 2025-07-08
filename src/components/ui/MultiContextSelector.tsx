import React, { useState, useRef, useEffect } from 'react';
import { Box, Chip, Typography, Tooltip, ClickAwayListener } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArticleIcon from '@mui/icons-material/Article';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import MonitorIcon from '@mui/icons-material/Monitor';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import TrendSelector from './TrendSelector';
import MonitoreosSelector from './MonitoreosSelector';

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
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTrendSelector, setShowTrendSelector] = useState(false);
  const [showMonitoreosSelector, setShowMonitoreosSelector] = useState(false);
  const [selectedTrends, setSelectedTrends] = useState<string[]>([]);
  
  const handleContextToggle = (contextValue: string) => {
    if (disabled) return;
    
    if (selectedContexts.includes(contextValue)) {
      // Remove context
      onContextChange(selectedContexts.filter(c => c !== contextValue));
      if (contextValue === 'tendencias') {
        setShowTrendSelector(false);
      }
      if (contextValue === 'monitoreos') {
        setShowMonitoreosSelector(false);
      }
    } else {
      // Add context
      onContextChange([...selectedContexts, contextValue]);
      if (contextValue === 'tendencias') {
        setShowTrendSelector(true);
      }
      if (contextValue === 'monitoreos') {
        setShowMonitoreosSelector(true);
      }
    }
  };

  const getDisplayLabel = () => {
    if (selectedContexts.length === 0) return 'Contexto';
    if (selectedContexts.length === 1) {
      const option = contextOptions.find(opt => opt.value === selectedContexts[0]);
      return option?.label || 'Contexto';
    }
    return `${selectedContexts.length} seleccionados`;
  };

  return (
    <ClickAwayListener onClickAway={() => setIsOpen(false)}>
      <Box sx={{ position: 'relative' }}>
        {/* Toggle Button */}
        <Box
          onClick={() => !disabled && setIsOpen(!isOpen)}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            minWidth: '160px',
            px: 1.5,
            py: 1,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-input)',
            color: 'var(--color-foreground)',
            fontSize: '14px',
            fontWeight: 500,
            cursor: disabled ? 'not-allowed' : 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: disabled ? 0.6 : 1,
            letterSpacing: 'var(--tracking-normal)',
            '&:hover': !disabled ? {
              backgroundColor: 'var(--color-muted)',
              borderColor: 'var(--color-ring)',
              transform: 'translateY(-1px)',
              boxShadow: 'var(--shadow-md)',
            } : {},
            '&:focus': {
              outline: 'none',
              borderColor: 'var(--color-ring)',
              boxShadow: '0 0 0 2px var(--color-ring)',
            }
          }}
        >
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '14px', 
              color: 'var(--color-foreground)',
              fontWeight: 500,
              letterSpacing: 'var(--tracking-normal)',
            }}
          >
            {getDisplayLabel()}
          </Typography>
          <KeyboardArrowDownIcon 
            sx={{ 
              fontSize: 20, 
              color: 'var(--color-muted-foreground)',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }} 
          />
        </Box>

        {/* Dropdown Menu */}
        {isOpen && (
          <Box
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              mt: 0.5,
              py: 1.5,
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-popover)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 10,
              backdropFilter: 'blur(12px)',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '-6px',
                left: '20px',
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderBottom: '6px solid var(--color-border)',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: '-5px',
                left: '21px',
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderBottom: '5px solid var(--color-popover)',
              }
            }}
          >
            {contextOptions.map((option) => {
              const isSelected = selectedContexts.includes(option.value);
              
              return (
                <Tooltip 
                  key={option.value}
                  title={option.description}
                  placement="left"
                  arrow
                  sx={{
                    '& .MuiTooltip-tooltip': {
                      backgroundColor: 'var(--color-popover)',
                      color: 'var(--color-popover-foreground)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '12px',
                      boxShadow: 'var(--shadow-md)',
                    },
                    '& .MuiTooltip-arrow': {
                      color: 'var(--color-border)',
                    }
                  }}
                >
                  <Box
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContextToggle(option.value);
                    }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      px: 1.5,
                      py: 1,
                      mx: 1,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      backgroundColor: isSelected ? 'var(--color-accent)' : 'transparent',
                      color: isSelected ? 'var(--color-accent-foreground)' : 'var(--color-popover-foreground)',
                      '&:hover': {
                        backgroundColor: isSelected ? 'var(--color-accent)' : 'var(--color-muted)',
                        transform: 'translateX(2px)',
                      }
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--radius-sm)',
                        background: option.gradient,
                        color: 'white',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      {option.icon}
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontSize: '14px',
                          fontWeight: isSelected ? 600 : 500,
                          letterSpacing: 'var(--tracking-normal)',
                          color: 'inherit',
                        }}
                      >
                        {option.label}
                      </Typography>
                    </Box>

                    {/* Custom Checkbox */}
                    <Box
                      sx={{
                        width: 18,
                        height: 18,
                        borderRadius: 'var(--radius-sm)',
                        border: `2px solid ${isSelected ? 'currentColor' : 'var(--color-border)'}`,
                        backgroundColor: isSelected ? 'currentColor' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      {isSelected && (
                        <svg 
                          width="12" 
                          height="12" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke={isSelected ? 'var(--color-accent-foreground)' : 'white'}
                          strokeWidth="3"
                        >
                          <polyline points="20,6 9,17 4,12" />
                        </svg>
                      )}
                    </Box>
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        )}

        {/* Trend Selector */}
        {showTrendSelector && (
          <Box sx={{ mt: 2 }}>
            <TrendSelector 
              selectedTrends={selectedTrends}
              onTrendChange={(trends) => {
                setSelectedTrends(trends);
                if (onTrendsChange) {
                  onTrendsChange(trends);
                }
              }}
            />
          </Box>
        )}
        
        {/* Monitoreos Selector */}
        {showMonitoreosSelector && (
          <Box sx={{ mt: 2 }}>
            <MonitoreosSelector 
              onSelectionChange={(monitoreosIds) => {
                if (onMonitoreosChange) {
                  onMonitoreosChange(monitoreosIds);
                }
              }}
            />
          </Box>
        )}
      </Box>
    </ClickAwayListener>
  );
};

export default MultiContextSelector; 