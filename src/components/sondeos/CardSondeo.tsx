import React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

export interface CardSondeoProps {
  /** Encabezado de la tarjeta */
  title: string;
  /** Subtítulo opcional */
  subtitle?: string;
  /** Gradiente CSS para el encabezado. Ej: "linear-gradient(90deg,#8b5cf6,#ec4899)" */
  headerGradient?: string;
  /** Icono MUI/Lucide a renderizar en el encabezado */
  icon?: React.ReactNode;
  /** Contenido principal de la tarjeta (gráfico u otro) */
  children: React.ReactNode;
  /** Extra footer (métricas rápidas, botones, etc.) */
  footer?: React.ReactNode;
  /** Estilos extra al contenedor Card */
  sx?: SxProps<Theme>;
  /** Variante de color del tema */
  variant?: 'primary' | 'secondary' | 'accent' | 'chart-1' | 'chart-2' | 'chart-3';
}

/**
 * CardSondeo – Tarjeta estilizada usando el nuevo sistema de diseño.
 * Utiliza variables CSS personalizadas para temas y colores.
 */
const CardSondeo: React.FC<CardSondeoProps> = ({
  title,
  subtitle,
  headerGradient,
  icon,
  children,
  footer,
  sx,
  variant = 'primary'
}) => {
  // Definir gradientes basados en las variables CSS del sistema
  const getVariantGradient = () => {
    if (headerGradient) return headerGradient;
    
    switch (variant) {
      case 'primary':
        return 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-chart-1) 100%)';
      case 'secondary':
        return 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-chart-2) 100%)';
      case 'accent':
        return 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-chart-3) 100%)';
      case 'chart-1':
        return 'linear-gradient(135deg, var(--color-chart-1) 0%, var(--color-primary) 100%)';
      case 'chart-2':
        return 'linear-gradient(135deg, var(--color-chart-2) 0%, var(--color-secondary) 100%)';
      case 'chart-3':
        return 'linear-gradient(135deg, var(--color-chart-3) 0%, var(--color-accent) 100%)';
      default:
        return 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-chart-1) 100%)';
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        overflow: 'hidden',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        backgroundColor: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 'var(--shadow-xl)',
        },
        ...sx
      }}
    >
      {/* Header with gradient */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          background: getVariantGradient(),
          color: 'var(--color-primary-foreground)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, position: 'relative', zIndex: 1 }}>
          {icon && (
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                p: 0.5,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {icon}
            </Box>
          )}
          <Box>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 700,
                fontSize: '1.1rem',
                letterSpacing: 'var(--tracking-tight)',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography 
                variant="caption" 
                sx={{ 
                  opacity: 0.9, 
                  lineHeight: 1.2,
                  fontSize: '0.75rem',
                  letterSpacing: 'var(--tracking-normal)',
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <CardContent 
        sx={{ 
          p: 3,
          backgroundColor: 'var(--color-card)',
          color: 'var(--color-card-foreground)',
          '&:last-child': {
            paddingBottom: 3
          }
        }}
      >
        {children}
      </CardContent>

      {footer && (
        <Box 
          sx={{ 
            px: 3, 
            py: 1.5, 
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-muted)',
            color: 'var(--color-muted-foreground)',
          }}
        >
          {footer}
        </Box>
      )}
    </Card>
  );
};

export default CardSondeo;
