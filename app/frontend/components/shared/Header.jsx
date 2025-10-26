import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { 
  Box, 
  Button, 
  Typography, 
  AppBar, 
  Toolbar, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  Divider,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { 
  Menu as MenuIcon, 
  Close as CloseIcon 
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navStyle = ({ isActive }) => ({
    fontWeight: isActive ? "700" : "400",
    textDecoration: "none",
    marginRight: "1rem",
    color: isActive ? 'white' : 'rgba(255, 255, 255, 0.7)',
  });

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const menuItems = [
    { to: "/home", label: "ホーム", end: false },
    { to: "/map", label: "物件管理" },
    { to: "/vr-tours", label: "VRツアー管理" },
  ];

  return (
    <>
      <AppBar 
        position="static" 
        elevation={1} 
        sx={{ 
          bgcolor: 'primary.main', 
          borderBottom: '1px solid #ddd',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0
        }}
      >
        <Toolbar variant="dense" sx={{ minHeight: '56px' }}>
          {isMobile ? (
            // モバイル表示
            <>
              <IconButton
                color="inherit"
                aria-label="menu"
                onClick={handleMobileMenuToggle}
                edge="start"
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
              <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Link to="/" style={{ textDecoration: "none", fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center' }}>
                  <img src="/cocosumo-logo_blue.png" alt="CoCoスモ" style={{ height: '28px', width: 'auto' }} />
                </Link>
              </Box>
              <Box sx={{ width: 48 }} /> {/* 右側のバランス調整用 */}
            </>
          ) : (
            // デスクトップ表示
            <>
              <Link to="/" style={{ textDecoration: "none", fontWeight: 700, marginRight: "1.5rem", color: 'white', display: 'flex', alignItems: 'center' }}>
                <img src="/cocosumo-logo_blue.png" alt="CoCoスモ" style={{ height: '28px', width: 'auto' }} />
              </Link>
            </>
          )}
          
          {!isMobile && (
            <>
              <Box sx={{ flexGrow: 1, display: 'flex' }}>
                {menuItems.map((item) => (
                  <NavLink 
                    key={item.to}
                    to={item.to} 
                    style={navStyle} 
                    end={item.end}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </Box>

              {user && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" sx={{ color: 'white' }}>
                    {user.name} ({user.auth_provider === 'google' ? 'Google' : user.code})
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleLogout}
                    sx={{ 
                      minWidth: 'auto',
                      color: 'white',
                      borderColor: 'white',
                      '&:hover': {
                        borderColor: 'white',
                        bgcolor: 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                  >
                    ログアウト
                  </Button>
                </Box>
              )}
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* モバイルメニュードロワー */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={handleMobileMenuClose}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: 280,
            bgcolor: 'primary.main',
            color: 'white',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ color: 'white' }}>
            メニュー
          </Typography>
          <IconButton
            color="inherit"
            onClick={handleMobileMenuClose}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.3)' }} />
        
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.to} disablePadding>
              <ListItemButton
                component={NavLink}
                to={item.to}
                onClick={handleMobileMenuClose}
                end={item.end}
                sx={{
                  '&.active': {
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                  },
                }}
              >
                <ListItemText 
                  primary={item.label}
                  sx={{ color: 'white' }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        {user && (
          <>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.3)', my: 2 }} />
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
                {user.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 2, display: 'block' }}>
                ({user.auth_provider === 'google' ? 'Google' : user.code})
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                onClick={handleLogout}
                sx={{ 
                  color: 'white',
                  borderColor: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                ログアウト
              </Button>
            </Box>
          </>
        )}
      </Drawer>
    </>
  );
}