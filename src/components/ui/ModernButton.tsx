import React from 'react';
import { Button, ButtonProps, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

interface ModernButtonProps extends Omit<ButtonProps, 'variant' | 'size'> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const StyledButton = styled(Button)<{ 
  buttonvariant: string; 
  buttonsize: string;
  loading: boolean;
}>(({ buttonvariant, buttonsize, loading }) => {
  const getVariantStyles = () => {
    switch (buttonvariant) {
      case 'primary':
        return {
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-primary-foreground)',
          boxShadow: 'var(--shadow-sm)',
          '&:hover': {
            backgroundColor: 'var(--color-primary)',
            filter: 'brightness(0.9)',
            transform: 'translateY(-1px)',
            boxShadow: 'var(--shadow-md)',
          },
          '&:active': {
            transform: 'translateY(0)',
            boxShadow: 'var(--shadow-sm)',
          },
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--color-secondary)',
          color: 'var(--color-secondary-foreground)',
          boxShadow: 'var(--shadow-sm)',
          '&:hover': {
            backgroundColor: 'var(--color-secondary)',
            filter: 'brightness(0.9)',
            transform: 'translateY(-1px)',
            boxShadow: 'var(--shadow-md)',
          },
        };
      case 'accent':
        return {
          backgroundColor: 'var(--color-accent)',
          color: 'var(--color-accent-foreground)',
          boxShadow: 'var(--shadow-sm)',
          '&:hover': {
            backgroundColor: 'var(--color-accent)',
            filter: 'brightness(0.9)',
            transform: 'translateY(-1px)',
            boxShadow: 'var(--shadow-md)',
          },
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: 'var(--color-foreground)',
          border: '1px solid var(--color-border)',
          '&:hover': {
            backgroundColor: 'var(--color-muted)',
            borderColor: 'var(--color-ring)',
            transform: 'translateY(-1px)',
          },
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--color-foreground)',
          '&:hover': {
            backgroundColor: 'var(--color-muted)',
            transform: 'translateY(-1px)',
          },
        };
      case 'destructive':
        return {
          backgroundColor: 'var(--color-destructive)',
          color: 'var(--color-destructive-foreground)',
          boxShadow: 'var(--shadow-sm)',
          '&:hover': {
            backgroundColor: 'var(--color-destructive)',
            filter: 'brightness(0.9)',
            transform: 'translateY(-1px)',
            boxShadow: 'var(--shadow-md)',
          },
        };
      default:
        return {};
    }
  };

  const getSizeStyles = () => {
    switch (buttonsize) {
      case 'sm':
        return {
          fontSize: '12px',
          padding: '6px 12px',
          minHeight: '32px',
        };
      case 'md':
        return {
          fontSize: '14px',
          padding: '8px 16px',
          minHeight: '36px',
        };
      case 'lg':
        return {
          fontSize: '16px',
          padding: '12px 24px',
          minHeight: '44px',
        };
      default:
        return {};
    }
  };

  return {
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
    letterSpacing: 'var(--tracking-normal)',
    textTransform: 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    border: 'none',
    fontFamily: 'var(--font-sans)',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1,
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
      transform: 'none',
    },
    '&:focus': {
      outline: 'none',
      boxShadow: '0 0 0 2px var(--color-ring)',
    },
    ...getVariantStyles(),
    ...getSizeStyles(),
  };
});

const ModernButton: React.FC<ModernButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  icon,
  iconPosition = 'left',
  startIcon,
  endIcon,
  ...props
}) => {
  const finalStartIcon = iconPosition === 'left' ? (icon || startIcon) : startIcon;
  const finalEndIcon = iconPosition === 'right' ? (icon || endIcon) : endIcon;

  return (
    <StyledButton
      buttonvariant={variant}
      buttonsize={size}
      loading={loading}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={16} /> : finalStartIcon}
      endIcon={!loading ? finalEndIcon : undefined}
      {...props}
    >
      {children}
    </StyledButton>
  );
};

export default ModernButton; 