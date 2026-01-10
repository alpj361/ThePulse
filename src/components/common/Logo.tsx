import React from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';

interface PulseLogoProps {
  size?: number;
  variant?: 'full' | 'icon'; // 'full' includes text, 'icon' is just the logo
  textColor?: string;
}

const PulseLogoComponent: React.FC<PulseLogoProps> = ({ size, variant = 'full' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const defaultSize = isMobile ? 40 : 50;
  const logoSize = size !== undefined ? size : defaultSize;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <img
        src="/logo.png"
        alt="Pulse Journal Logo"
        style={{
          height: logoSize,
          width: 'auto',
          maxWidth: variant === 'icon' ? logoSize : 'auto',
          objectFit: 'contain'
        }}
      />
    </Box>
  );
};

export default PulseLogoComponent; 