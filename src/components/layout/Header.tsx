import React from 'react';
import { AppBar, Toolbar, Box, Chip, Switch } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useAdmin } from '../../hooks/useAdmin';
import { useViewMode } from '../../context/ViewModeContext';
import Logo from '../common/Logo';

const Header: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { viewMode, toggleViewMode, isBetaView } = useViewMode();

  return (
    <AppBar
      position="static"
      color="default"
      elevation={1}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        transition: 'background-color 0.2s'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Logo size={40} />
        </Box>

        {/* Beta View Switch - Only visible to Admin users */}
        {user && isAdmin && (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            marginRight: '100px' // Espacio para evitar solapamiento con Vizta
          }}>
            <Chip
              label={isBetaView ? "Beta View" : "Normal View"}
              color={isBetaView ? "warning" : "primary"}
              size="small"
              sx={{ fontWeight: 600 }}
            />
            <Switch
              checked={isBetaView}
              onChange={toggleViewMode}
              color="primary"
              inputProps={{ 'aria-label': 'Toggle Beta View mode' }}
            />
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;