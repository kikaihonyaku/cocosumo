import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
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
  Chair as ChairIcon,
  Campaign as CampaignIcon,
  Business as BusinessIcon,
  SupervisorAccount as SupervisorAccountIcon,
  Lock as LockIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Map as MapIcon
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { useThemeMode } from "../../contexts/ThemeContext";
import ChangePasswordDialog from "./ChangePasswordDialog";

export default function Header() {
  const { user, tenant, logout } = useAuth();
  const { zoomLevel } = useThemeMode();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminMenuAnchor, setAdminMenuAnchor] = useState(null);
  const [contentMenuAnchor, setContentMenuAnchor] = useState(null);
  const [responseMenuAnchor, setResponseMenuAnchor] = useState(null);
  const [mobileAdminExpanded, setMobileAdminExpanded] = useState(false);
  const [mobileContentExpanded, setMobileContentExpanded] = useState(false);
  const [mobileResponseExpanded, setMobileResponseExpanded] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  // Adjust menu positions when CSS zoom is applied
  // MUI Menu uses getBoundingClientRect which returns zoomed coordinates,
  // but positions the menu without considering zoom, causing misalignment
  useEffect(() => {
    if (zoomLevel === 100) return;

    const menuConfigs = [
      { anchor: userMenuAnchor, id: 'user-menu-popover' },
      { anchor: contentMenuAnchor, id: 'content-menu-popover' },
      { anchor: responseMenuAnchor, id: 'response-menu-popover' },
      { anchor: adminMenuAnchor, id: 'admin-menu-popover' },
    ];

    const activeMenu = menuConfigs.find(config => config.anchor);
    if (!activeMenu) return;

    const timer = setTimeout(() => {
      const popover = document.getElementById(activeMenu.id);
      if (popover) {
        const paper = popover.querySelector('.MuiPaper-root');
        if (paper) {
          const zoomFactor = zoomLevel / 100;
          const currentLeft = parseFloat(paper.style.left) || 0;
          const currentTop = parseFloat(paper.style.top) || 0;
          paper.style.left = `${currentLeft / zoomFactor}px`;
          paper.style.top = `${currentTop / zoomFactor}px`;
        }
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [userMenuAnchor, contentMenuAnchor, responseMenuAnchor, adminMenuAnchor, zoomLevel]);
  
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

  const handleResponseMenuOpen = (event) => {
    setResponseMenuAnchor(event.currentTarget);
  };

  const handleResponseMenuClose = () => {
    setResponseMenuAnchor(null);
  };

  const handleMobileResponseToggle = () => {
    setMobileResponseExpanded(!mobileResponseExpanded);
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleChangePasswordOpen = () => {
    handleUserMenuClose();
    setChangePasswordOpen(true);
  };

  const handleChangePasswordClose = () => {
    setChangePasswordOpen(false);
  };

  const handleLogoutFromMenu = async () => {
    handleUserMenuClose();
    await logout();
  };

  const handleProfileOpen = () => {
    handleUserMenuClose();
    navigate('/profile');
  };

  const contentMenuItems = [
    { to: "/vr-tours", label: "VRルームツアー", icon: <ViewInArIcon fontSize="small" /> },
    { to: "/virtual-stagings", label: "バーチャルステージング", icon: <ChairIcon fontSize="small" /> },
    { to: "/admin/publications", label: "公開ページ管理", icon: <WebIcon fontSize="small" /> },
  ];

  const responseMenuItems = [
    { to: "/customers", label: "顧客管理", icon: <PersonIcon fontSize="small" /> },
    { to: "/admin/inquiries", label: "問い合わせ管理", icon: <EmailIcon fontSize="small" /> },
    { to: "/analytics/inquiries", label: "問い合わせ分析", icon: <AnalyticsIcon fontSize="small" /> },
    { to: "/admin/customer-accesses", label: "顧客アクセス管理", icon: <PeopleIcon fontSize="small" /> },
    { to: "/analytics/customer-accesses", label: "顧客アクセス分析", icon: <TrendingUpIcon fontSize="small" /> },
  ];

  // 管理者メニュー（roleに応じて動的に生成）
  const getAdminMenuItems = () => {
    const items = [
      { to: "/admin/users", label: "ユーザー管理", icon: <SupervisorAccountIcon fontSize="small" />, minRole: 'admin' },
      { to: "/admin/stores", label: "店舗管理", icon: <StoreIcon fontSize="small" />, minRole: 'admin' },
      { to: "/admin/suumo-import", label: "SUUMOインポート", icon: <CloudDownloadIcon fontSize="small" />, minRole: 'admin' },
      { to: "/admin/layers", label: "レイヤー管理", icon: <LayersIcon fontSize="small" />, minRole: 'admin' },
      { to: "/super-admin/tenants", label: "テナント管理", icon: <BusinessIcon fontSize="small" />, minRole: 'super_admin' },
    ];

    return items.filter(item => {
      if (item.minRole === 'super_admin') {
        return user?.role === 'super_admin';
      }
      return user?.role === 'admin' || user?.role === 'super_admin';
    });
  };

  const adminMenuItems = getAdminMenuItems();

  const menuItems = [
    { to: "/map", label: "物件管理", icon: <MapIcon fontSize="small" /> },
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
                <Link to="/home" style={{ textDecoration: "none", fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center' }}>
                  <img src="/cocosumo-logo_blue.png" alt="CoCoスモ" style={{ height: '28px', width: 'auto' }} />
                </Link>
              </Box>
              <Box sx={{ width: 48 }} /> {/* 右側のバランス調整用 */}
            </>
          ) : (
            // デスクトップ表示
            <>
              <Link to="/home" style={{ textDecoration: "none", fontWeight: 700, marginRight: "1.5rem", color: 'white', display: 'flex', alignItems: 'center' }}>
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {item.icon}
                      {item.label}
                    </Box>
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
                  id="content-menu-popover"
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
                {/* 反響メニュー */}
                <Button
                  onClick={handleResponseMenuOpen}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    textTransform: 'none',
                    '&:hover': {
                      color: 'white',
                      bgcolor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                  endIcon={<ExpandMoreIcon />}
                  startIcon={<CampaignIcon />}
                >
                  反響
                </Button>
                <Menu
                  id="response-menu-popover"
                  anchorEl={responseMenuAnchor}
                  open={Boolean(responseMenuAnchor)}
                  onClose={handleResponseMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                >
                  {responseMenuItems.map((item) => (
                    <MenuItem
                      key={item.to}
                      component={NavLink}
                      to={item.to}
                      onClick={handleResponseMenuClose}
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
                  id="admin-menu-popover"
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    onClick={handleUserMenuOpen}
                    sx={{
                      color: 'white',
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                    startIcon={<PersonIcon />}
                    endIcon={<ExpandMoreIcon />}
                  >
                    {user.name}
                  </Button>
                  <Menu
                    id="user-menu-popover"
                    anchorEl={userMenuAnchor}
                    open={Boolean(userMenuAnchor)}
                    onClose={handleUserMenuClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                  >
                    {tenant && (
                      <MenuItem disabled>
                        <Typography variant="body2" color="text.secondary">
                          {tenant.name}
                        </Typography>
                      </MenuItem>
                    )}
                    <Divider />
                    <MenuItem onClick={handleProfileOpen}>
                      <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                      <ListItemText>プロフィール設定</ListItemText>
                    </MenuItem>
                    {user.auth_provider !== 'google' && (
                      <MenuItem onClick={handleChangePasswordOpen}>
                        <ListItemIcon><LockIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>パスワード変更</ListItemText>
                      </MenuItem>
                    )}
                    <Divider />
                    <MenuItem onClick={handleLogoutFromMenu}>
                      <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                      <ListItemText>ログアウト</ListItemText>
                    </MenuItem>
                  </Menu>
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
                <ListItemIcon sx={{ color: 'white', minWidth: 36 }}>
                  {item.icon}
                </ListItemIcon>
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

          {/* 反響メニュー（折りたたみ式） */}
          <ListItem disablePadding>
            <ListItemButton onClick={handleMobileResponseToggle}>
              <ListItemIcon sx={{ color: 'white', minWidth: 36 }}>
                <CampaignIcon />
              </ListItemIcon>
              <ListItemText primary="反響" sx={{ color: 'white' }} />
              {mobileResponseExpanded ? (
                <ExpandLessIcon sx={{ color: 'white' }} />
              ) : (
                <ExpandMoreIcon sx={{ color: 'white' }} />
              )}
            </ListItemButton>
          </ListItem>
          <Collapse in={mobileResponseExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {responseMenuItems.map((item) => (
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
              {tenant && (
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 1, display: 'block' }}>
                  {tenant.name}
                </Typography>
              )}
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1 }}>
                {user.name}
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  handleMobileMenuClose();
                  navigate('/profile');
                }}
                startIcon={<SettingsIcon />}
                sx={{
                  color: 'white',
                  borderColor: 'white',
                  mb: 1,
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                プロフィール設定
              </Button>
              {user.auth_provider !== 'google' && (
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    handleMobileMenuClose();
                    setChangePasswordOpen(true);
                  }}
                  startIcon={<LockIcon />}
                  sx={{
                    color: 'white',
                    borderColor: 'white',
                    mb: 1,
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  パスワード変更
                </Button>
              )}
              <Button
                variant="outlined"
                fullWidth
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
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

      {/* パスワード変更ダイアログ */}
      <ChangePasswordDialog
        open={changePasswordOpen}
        onClose={handleChangePasswordClose}
      />
    </>
  );
}