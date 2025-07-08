import React from 'react';
import { TextField, TextFieldProps, InputAdornment } from '@mui/material';
import { styled } from '@mui/material/styles';

interface ModernInputProps extends Omit<TextFieldProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'outline';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const StyledTextField = styled(TextField)<{ inputvariant: string }>(({ inputvariant }) => {
  const getVariantStyles = () => {
    switch (inputvariant) {
      case 'primary':
        return {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'var(--color-input)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '& fieldset': {
              border: 'none',
            },
            '&:hover': {
              backgroundColor: 'var(--color-muted)',
              borderColor: 'var(--color-ring)',
              transform: 'translateY(-1px)',
              boxShadow: 'var(--shadow-md)',
            },
            '&.Mui-focused': {
              backgroundColor: 'var(--color-input)',
              borderColor: 'var(--color-ring)',
              boxShadow: '0 0 0 2px var(--color-ring)',
              transform: 'translateY(-1px)',
            },
            '&.Mui-error': {
              borderColor: 'var(--color-destructive)',
              boxShadow: '0 0 0 2px var(--color-destructive)',
            },
          },
          '& .MuiInputBase-input': {
            color: 'var(--color-foreground)',
            fontSize: '14px',
            fontWeight: 500,
            letterSpacing: 'var(--tracking-normal)',
            fontFamily: 'var(--font-sans)',
            padding: '12px 16px',
            '&::placeholder': {
              color: 'var(--color-muted-foreground)',
              opacity: 1,
            },
          },
          '& .MuiInputLabel-root': {
            color: 'var(--color-muted-foreground)',
            fontSize: '14px',
            fontWeight: 500,
            letterSpacing: 'var(--tracking-normal)',
            transform: 'translate(14px, 12px) scale(1)',
            '&.Mui-focused': {
              color: 'var(--color-ring)',
            },
            '&.MuiInputLabel-shrink': {
              transform: 'translate(14px, -6px) scale(0.85)',
              backgroundColor: 'var(--color-input)',
              padding: '0 4px',
            },
          },
        };
      case 'secondary':
        return {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'var(--color-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            '& fieldset': {
              border: 'none',
            },
            '&:hover': {
              backgroundColor: 'var(--color-secondary)',
              filter: 'brightness(0.95)',
            },
            '&.Mui-focused': {
              backgroundColor: 'var(--color-secondary)',
              borderColor: 'var(--color-ring)',
              boxShadow: '0 0 0 2px var(--color-ring)',
            },
          },
          '& .MuiInputBase-input': {
            color: 'var(--color-secondary-foreground)',
          },
        };
      case 'outline':
        return {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'transparent',
            borderRadius: 'var(--radius-md)',
            border: '2px solid var(--color-border)',
            '& fieldset': {
              border: 'none',
            },
            '&:hover': {
              borderColor: 'var(--color-ring)',
            },
            '&.Mui-focused': {
              borderColor: 'var(--color-ring)',
              boxShadow: '0 0 0 2px var(--color-ring)',
            },
          },
          '& .MuiInputBase-input': {
            color: 'var(--color-foreground)',
          },
        };
      default:
        return {};
    }
  };

  return {
    width: '100%',
    ...getVariantStyles(),
  };
});

const ModernInput: React.FC<ModernInputProps> = ({
  variant = 'primary',
  leftIcon,
  rightIcon,
  InputProps,
  ...props
}) => {
  const inputProps = {
    ...InputProps,
    startAdornment: leftIcon ? (
      <InputAdornment 
        position="start"
        sx={{ 
          color: 'var(--color-muted-foreground)',
          '& svg': {
            fontSize: '20px',
          }
        }}
      >
        {leftIcon}
      </InputAdornment>
    ) : InputProps?.startAdornment,
    endAdornment: rightIcon ? (
      <InputAdornment 
        position="end"
        sx={{ 
          color: 'var(--color-muted-foreground)',
          '& svg': {
            fontSize: '20px',
          }
        }}
      >
        {rightIcon}
      </InputAdornment>
    ) : InputProps?.endAdornment,
  };

  return (
    <StyledTextField
      inputvariant={variant}
      InputProps={inputProps}
      {...props}
    />
  );
};

export default ModernInput; 