import React from 'react';
import { AppBar, Toolbar, Box } from '@mui/material';

const Header: React.FC = () => {

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
          {/* New Logo Image */}
          <img
            src="/logo.png"
            alt="Pulse Journal Logo"
            style={{
              height: 40,
              width: 'auto',
              objectFit: 'contain'
            }}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;