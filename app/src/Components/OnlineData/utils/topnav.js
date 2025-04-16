import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Button,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import { useNavigate } from 'react-router-dom';
import closeConnection from './API/CloseConnection';

const TopNavbar = ({
  drawerItems = [],
  handleMenuClick,
  onToggleTheme,
  isDarkMode,
  isDisconnecting,
}) => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const [isClosingConn, setIsClosingConn] = useState(false);

  const handleDisconnect = async () => {
      setIsClosingConn(true);
      const responseData = await closeConnection();
      setIsClosingConn(false);
      if (responseData.status === "success") {
        navigate("/live-home");
      } else {
        navigate("/error-page", {
          state: {
            message: responseData.message,
            status_code: responseData.status_code,
          },
        });
      }
    };

  return (
    <>
      <AppBar position="static">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <IconButton edge="start" color="inherit" onClick={() => setDrawerOpen(true)}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ ml: 1 }}>
              Bigsync
            </Typography>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<PowerSettingsNewIcon />}
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              sx={{ ml: 2, textTransform: 'none' }}
            >
              {isDisconnecting ? "Disconnecting..." : "Disconnect"}
            </Button>
          </div>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <List sx={{ width: 250 }}>
          {drawerItems.map(({ label }) => (
            <ListItem button key={label} onClick={() => handleMenuClick(label)}>
              <ListItemText primary={label} />
            </ListItem>
          ))}
        </List>
      </Drawer>
    </>
  );
};

export default TopNavbar;
