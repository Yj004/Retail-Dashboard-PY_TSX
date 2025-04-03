# Dashboard Layout Component

## Overview

The `DashboardLayout.js` file located in `frontend/src/components` defines the layout wrapper used across all authenticated pages in the application. It provides a consistent user interface with navigation, header, and content areas.

## Purpose and Functionality

The `DashboardLayout` component:
- Provides a responsive layout with a sidebar and main content area
- Implements a collapsible sidebar for mobile devices
- Handles navigation between different sections of the application
- Displays user information and authentication status
- Provides logout functionality
- Maintains consistent styling and branding

## Component Structure

```jsx
const DashboardLayout = ({ children, title }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Component methods and rendering...
}
```

The component:
- Accepts `children` (content to be rendered) and a `title` prop
- Uses state for handling mobile drawer and dropdown menu
- Accesses authentication context for user data and logout function
- Uses React Router's navigation hook

## Navigation and Drawer

```jsx
const handleDrawerToggle = () => {
  setMobileOpen(!mobileOpen);
};

const handleNavigation = (path) => {
  navigate(path);
  setMobileOpen(false);
};

const handleLogout = () => {
  logout();
  navigate('/login');
};
```

These functions:
- Toggle the mobile drawer visibility
- Navigate to different routes and close the drawer
- Handle user logout and redirect to login page

## UI Components

### Drawer Content

```jsx
const drawer = (
  <Box sx={{ 
    height: '100%', 
    display: 'flex', 
    flexDirection: 'column',
    backgroundColor: colors.white,
  }}>
    {/* Brand header */}
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
    <Box>
      <Avatar>{user?.username?.charAt(0)?.toUpperCase() || 'A'}</Avatar>
      <Typography>{user?.username || 'Admin User'}</Typography>
      <Typography>Administrator</Typography>
    </Box>
    
    {/* Navigation links */}
    <List component="nav">
      <ListItem>
        <ListItemButton onClick={() => handleNavigation('/dashboard')}>
          <ListItemIcon><DashboardIcon /></ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>
      </ListItem>
      
      {/* Additional navigation items... */}
    </List>
  </Box>
);
```

The drawer includes:
- Branding with logo and application name
- User information section with avatar
- Navigation menu with icons and text
- Visual indicators for the active page
- Logout option

### App Bar

```jsx
<AppBar
  position="fixed"
  sx={{
    width: { sm: `calc(100% - ${drawerWidth}px)` },
    ml: { sm: `${drawerWidth}px` },
    backgroundColor: colors.white,
    color: colors.text,
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
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
    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
      {title}
    </Typography>
    
    {/* Notification icon */}
    <IconButton color="inherit">
      <Badge badgeContent={4} color="primary">
        <NotificationsIcon />
      </Badge>
    </IconButton>
    
    {/* User menu */}
    <IconButton onClick={handleMenuOpen}>
      <Avatar>{user?.username?.charAt(0)?.toUpperCase() || 'A'}</Avatar>
    </IconButton>
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
      <MenuItem onClick={handleMenuClose}>Settings</MenuItem>
      <MenuItem onClick={handleLogout}>Logout</MenuItem>
    </Menu>
  </Toolbar>
</AppBar>
```

The app bar includes:
- Mobile drawer toggle button
- Page title
- Notification icon with badge
- User avatar that opens a dropdown menu
- Dropdown menu with profile, settings, and logout options

## Responsive Layout

```jsx
<Box sx={{ display: 'flex' }}>
  <CssBaseline />
  
  {/* App Bar */}
  <AppBar>...</AppBar>
  
  {/* Sidebar - Mobile drawer */}
  <Box
    component="nav"
    sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
  >
    <Drawer
      variant="temporary"
      open={mobileOpen}
      onClose={handleDrawerToggle}
      sx={{
        display: { xs: 'block', sm: 'none' },
        '& .MuiDrawer-paper': { width: drawerWidth },
      }}
    >
      {drawer}
    </Drawer>
    
    {/* Sidebar - Permanent drawer */}
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', sm: 'block' },
        '& .MuiDrawer-paper': { width: drawerWidth },
      }}
      open
    >
      {drawer}
    </Drawer>
  </Box>
  
  {/* Main content */}
  <Box
    component="main"
    sx={{
      flexGrow: 1,
      width: { sm: `calc(100% - ${drawerWidth}px)` },
      ml: { sm: `${drawerWidth}px` },
    }}
  >
    <Toolbar /> {/* Spacer for fixed app bar */}
    {children}
  </Box>
</Box>
```

The layout implements:
- A responsive design that adapts to different screen sizes
- A permanent sidebar for larger screens
- A collapsible drawer for mobile devices
- A main content area that adjusts based on the sidebar

## Styling

The component uses a consistent color scheme defined at the top of the file:

```jsx
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
```

This ensures consistent styling throughout the layout and makes it easy to adjust the theme.

## Usage

```jsx
import DashboardLayout from '../components/DashboardLayout';

const MyPage = () => {
  return (
    <DashboardLayout title="My Page Title">
      {/* Page content */}
      <Typography>Hello World</Typography>
    </DashboardLayout>
  );
};
```

The DashboardLayout is used to wrap page components, providing a consistent interface across the application. 