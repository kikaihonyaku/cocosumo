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
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  Collapse
} from "@mui/material";
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  AdminPanelSettings as AdminIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CloudDownload as CloudDownloadIcon,
  Layers as LayersIcon,
  Store as StoreIcon,
  Analytics as AnalyticsIcon,
  Web as WebIcon,
  People as PeopleIcon,
  Email as EmailIcon,
  TrendingUp as TrendingUpIcon,
  VideoLibrary as VideoLibraryIcon,
  ViewInAr as ViewInArIcon,
  Chair as ChairIcon
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminMenuAnchor, setAdminMenuAnchor] = useState(null);
  const [contentMenuAnchor, setContentMenuAnchor] = useState(null);
  const [mobileAdminExpanded, setMobileAdminExpanded] = useState(false);
  const [mobileContentExpanded, setMobileContentExpanded] = useState(false);
  
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

  const handleAdminMenuOpen = (event) => {
    setAdminMenuAnchor(event.currentTarget);
  };

  const handleAdminMenuClose = () => {
    setAdminMenuAnchor(null);
  };

  const handleMobileAdminToggle = () => {
    setMobileAdminExpanded(!mobileAdminExpanded);
  };

  const handleContentMenuOpen = (event) => {
    setContentMenuAnchor(event.currentTarget);
  };

  const handleContentMenuClose = () => {
    setContentMenuAnchor(null);
  };

  const handleMobileContentToggle = () => {
    setMobileContentExpanded(!mobileContentExpanded);
  };

  const contentMenuItems = [
    { to: "/vr-tours", label: "VRルームツアー", icon: <ViewInArIcon fontSize="small" /> },
    { to: "/virtual-stagings", label: "バーチャルステージング", icon: <ChairIcon fontSize="small" /> },
  ];

  const adminMenuItems = [
    { to: "/admin/stores", label: "店舗管理", icon: <StoreIcon fontSize="small" /> },
    { to: "/admin/suumo-import", label: "SUUMOインポート", icon: <CloudDownloadIcon fontSize="small" /> },
    { to: "/admin/layers", label: "レイヤー管理", icon: <LayersIcon fontSize="small" /> },
    { to: "/admin/publications", label: "公開ページ管理", icon: <WebIcon fontSize="small" /> },
    { to: "/admin/customer-accesses", label: "顧客アクセス管理", icon: <PeopleIcon fontSize="small" /> },
    { to: "/admin/inquiries", label: "問い合わせ管理", icon: <EmailIcon fontSize="small" /> },
    { to: "/analytics/inquiries", label: "問い合わせ分析", icon: <AnalyticsIcon fontSize="small" /> },
    { to: "/analytics/customer-accesses", label: "顧客アクセス分析", icon: <TrendingUpIcon fontSize="small" /> },
  ];

  const menuItems = [
    { to: "/home", label: "ホーム", end: false },
    { to: "/map", label: "物件管理" },
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
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
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
                {/* コンテンツメニュー */}
                <Button
                  onClick={handleContentMenuOpen}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    textTransform: 'none',
                    '&:hover': {
                      color: 'white',
                      bgcolor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                  endIcon={<ExpandMoreIcon />}
                  startIcon={<VideoLibraryIcon />}
                >
                  コンテンツ
                </Button>
                <Menu
                  anchorEl={contentMenuAnchor}
                  open={Boolean(contentMenuAnchor)}
                  onClose={handleContentMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                >
                  {contentMenuItems.map((item) => (
                    <MenuItem
                      key={item.to}
                      component={NavLink}
                      to={item.to}
                      onClick={handleContentMenuClose}
                      sx={{
                        '&.active': {
                          bgcolor: 'action.selected',
                        }
                      }}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText>{item.label}</ListItemText>
                    </MenuItem>
                  ))}
                </Menu>
                {/* 管理者メニュー */}
                <Button
                  onClick={handleAdminMenuOpen}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    textTransform: 'none',
                    '&:hover': {
                      color: 'white',
                      bgcolor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                  endIcon={<ExpandMoreIcon />}
                  startIcon={<AdminIcon />}
                >
                  管理
                </Button>
                <Menu
                  anchorEl={adminMenuAnchor}
                  open={Boolean(adminMenuAnchor)}
                  onClose={handleAdminMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                >
                  {adminMenuItems.map((item) => (
                    <MenuItem
                      key={item.to}
                      component={NavLink}
                      to={item.to}
                      onClick={handleAdminMenuClose}
                      sx={{
                        '&.active': {
                          bgcolor: 'action.selected',
                        }
                      }}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText>{item.label}</ListItemText>
                    </MenuItem>
                  ))}
                </Menu>
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

          {/* コンテンツメニュー（折りたたみ式） */}
          <ListItem disablePadding>
            <ListItemButton onClick={handleMobileContentToggle}>
              <ListItemIcon sx={{ color: 'white', minWidth: 36 }}>
                <VideoLibraryIcon />
              </ListItemIcon>
              <ListItemText primary="コンテンツ" sx={{ color: 'white' }} />
              {mobileContentExpanded ? (
                <ExpandLessIcon sx={{ color: 'white' }} />
              ) : (
                <ExpandMoreIcon sx={{ color: 'white' }} />
              )}
            </ListItemButton>
          </ListItem>
          <Collapse in={mobileContentExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {contentMenuItems.map((item) => (
                <ListItem key={item.to} disablePadding>
                  <ListItemButton
                    component={NavLink}
                    to={item.to}
                    onClick={handleMobileMenuClose}
                    sx={{
                      pl: 4,
                      '&.active': {
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', minWidth: 36 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      sx={{ color: 'rgba(255, 255, 255, 0.9)' }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>

          {/* 管理者メニュー（折りたたみ式） */}
          <ListItem disablePadding>
            <ListItemButton onClick={handleMobileAdminToggle}>
              <ListItemIcon sx={{ color: 'white', minWidth: 36 }}>
                <AdminIcon />
              </ListItemIcon>
              <ListItemText primary="管理" sx={{ color: 'white' }} />
              {mobileAdminExpanded ? (
                <ExpandLessIcon sx={{ color: 'white' }} />
              ) : (
                <ExpandMoreIcon sx={{ color: 'white' }} />
              )}
            </ListItemButton>
          </ListItem>
          <Collapse in={mobileAdminExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {adminMenuItems.map((item) => (
                <ListItem key={item.to} disablePadding>
                  <ListItemButton
                    component={NavLink}
                    to={item.to}
                    onClick={handleMobileMenuClose}
                    sx={{
                      pl: 4,
                      '&.active': {
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', minWidth: 36 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      sx={{ color: 'rgba(255, 255, 255, 0.9)' }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
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