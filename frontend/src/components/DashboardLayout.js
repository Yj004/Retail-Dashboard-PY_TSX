import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  Paper,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TableChartIcon from '@mui/icons-material/TableChart';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { AuthContext } from '../context/AuthContext';

const drawerWidth = 260;

// Professional color scheme
const colors = {
  primary: '#1a237e',    // Deep indigo
  secondary: '#3949ab',  // Medium indigo
  accent: '#5c6bc0',     // Light indigo
  light: '#e8eaf6',      // Very light indigo
  success: '#388e3c',    // Green
  warning: '#f57c00',    // Orange
  text: '#263238',       // Dark blue-grey
  textLight: '#546e7a',  // Medium blue-grey
  background: '#f8f9fa', // Light grey
  white: '#ffffff',      // White
  border: '#e0e0e0',     // Grey border
};

const DashboardLayout = ({ children, title }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNotificationsClick = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };

  const handleProfileClick = (event) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const drawer = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: colors.white,
    }}>
      <Box sx={{ 
        p: 2, 
        backgroundColor: colors.primary, 
        color: colors.white,
        display: 'flex',
        alignItems: 'center',
        height: '64px',
      }}>
        <ShoppingCartIcon sx={{ fontSize: 28, mr: 1.5 }} />
        <Typography variant="h6" fontWeight="bold" noWrap>
          Shopify Admin
        </Typography>
      </Box>
      <Divider />
      
      {/* User info section */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        backgroundColor: colors.light,
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <Avatar 
          sx={{ 
            width: 70, 
            height: 70, 
            mb: 1, 
            bgcolor: colors.secondary,
            boxShadow: 2,
          }}
        >
          {user?.username?.charAt(0)?.toUpperCase() || 'A'}
        </Avatar>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 0.5 }}>
          {user?.username || 'Admin User'}
        </Typography>
        <Typography variant="body2" color={colors.textLight}>
          Administrator
        </Typography>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflow: 'auto', pt: 2 }}>
        <List component="nav">
          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemButton 
              onClick={() => handleNavigation('/dashboard')}
              sx={{ 
                borderRadius: '0 24px 24px 0',
                mr: 2,
                pl: 3,
                '&:hover': {
                  backgroundColor: colors.light,
                },
                ...(window.location.pathname === '/dashboard' && {
                  backgroundColor: colors.light,
                  color: colors.primary,
                  borderLeft: `4px solid ${colors.primary}`,
                }),
              }}
            >
              <ListItemIcon sx={{ 
                color: window.location.pathname === '/dashboard' ? colors.primary : 'inherit',
                minWidth: '40px',
              }}>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Dashboard" 
                primaryTypographyProps={{ 
                  fontWeight: window.location.pathname === '/dashboard' ? 'bold' : 'normal',
                }}
              />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemButton 
              onClick={() => handleNavigation('/data')}
              sx={{ 
                borderRadius: '0 24px 24px 0',
                mr: 2,
                pl: 3,
                '&:hover': {
                  backgroundColor: colors.light,
                },
                ...(window.location.pathname === '/data' && {
                  backgroundColor: colors.light,
                  color: colors.primary,
                  borderLeft: `4px solid ${colors.primary}`,
                }),
              }}
            >
              <ListItemIcon sx={{ 
                color: window.location.pathname === '/data' ? colors.primary : 'inherit',
                minWidth: '40px',
              }}>
                <TableChartIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Data Table" 
                primaryTypographyProps={{ 
                  fontWeight: window.location.pathname === '/data' ? 'bold' : 'normal',
                }}
              />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemButton 
              onClick={() => handleNavigation('/settings')}
              sx={{ 
                borderRadius: '0 24px 24px 0',
                mr: 2,
                pl: 3,
                '&:hover': {
                  backgroundColor: colors.light,
                },
                ...(window.location.pathname === '/settings' && {
                  backgroundColor: colors.light,
                  color: colors.primary,
                  borderLeft: `4px solid ${colors.primary}`,
                }),
              }}
            >
              <ListItemIcon sx={{ 
                color: window.location.pathname === '/settings' ? colors.primary : 'inherit',
                minWidth: '40px',
              }}>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Settings" 
                primaryTypographyProps={{ 
                  fontWeight: window.location.pathname === '/settings' ? 'bold' : 'normal',
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
      
      <Box sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
        <Button 
          fullWidth 
          variant="outlined" 
          color="error" 
          onClick={handleLogout}
          startIcon={<LogoutIcon />}
          sx={{ 
            justifyContent: 'flex-start', 
            textTransform: 'none',
            fontWeight: 'bold',
            borderRadius: 2,
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: colors.white,
          color: colors.text,
          boxShadow: '0px 1px 10px rgba(0, 0, 0, 0.05)',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 'bold',
              color: colors.primary,
            }}
          >
            {title}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              color="inherit" 
              onClick={handleNotificationsClick}
              sx={{ 
                mr: 1,
                backgroundColor: colors.light,
                '&:hover': {
                  backgroundColor: '#d1d9ff',
                },
              }}
            >
              <Badge badgeContent={4} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
              <IconButton
                onClick={handleProfileClick}
                sx={{ 
                  p: 0.5,
                  '&:hover': {
                    backgroundColor: colors.light,
                  },
                }}
              >
                <Avatar
                  sx={{ 
                    bgcolor: colors.primary,
                    width: 35,
                    height: 35,
                  }}
                >
                  {user?.username?.charAt(0)?.toUpperCase() || 'A'}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={notificationsAnchorEl}
                open={Boolean(notificationsAnchorEl)}
                onClose={handleNotificationsClose}
                PaperProps={{
                  elevation: 3,
                  sx: { minWidth: 180, borderRadius: 2, mt: 1 }
                }}
              >
                <MenuItem onClick={handleNotificationsClose}>Recent Orders (3)</MenuItem>
                <MenuItem onClick={handleNotificationsClose}>New Messages (1)</MenuItem>
                <MenuItem onClick={handleNotificationsClose}>View All Notifications</MenuItem>
              </Menu>
              
              <Menu
                anchorEl={profileAnchorEl}
                open={Boolean(profileAnchorEl)}
                onClose={handleProfileClose}
                PaperProps={{
                  elevation: 3,
                  sx: { minWidth: 180, borderRadius: 2, mt: 1 }
                }}
              >
                <MenuItem onClick={() => handleNavigation('/settings')}>Settings</MenuItem>
                <MenuItem onClick={() => handleNavigation('/profile')}>Profile</MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ 
          width: { sm: drawerWidth }, 
          flexShrink: { sm: 0 } 
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: `1px solid ${colors.border}`,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: `1px solid ${colors.border}`,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, md: 3 }, 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: colors.background,
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Paper 
          elevation={0} 
          sx={{ 
            borderRadius: 2, 
            backgroundColor: 'transparent',
            overflow: 'visible',
          }}
        >
          {children}
        </Paper>
      </Box>
    </Box>
  );
};

export default DashboardLayout; 