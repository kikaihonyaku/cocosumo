import React, { useState, useEffect } from 'react';
import {
  Box,
  Fab,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
  Tooltip,
  Zoom
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  PhotoLibrary as PhotoIcon,
  ViewInAr as VrIcon,
  Compare as CompareIcon,
  Info as InfoIcon,
  Mail as MailIcon,
  KeyboardArrowUp as ScrollTopIcon
} from '@mui/icons-material';

const sections = [
  { id: 'top', label: 'トップ', icon: HomeIcon },
  { id: 'gallery', label: '写真', icon: PhotoIcon },
  { id: 'vr-tour', label: 'VRツアー', icon: VrIcon },
  { id: 'virtual-staging', label: 'ステージング', icon: CompareIcon },
  { id: 'property-info', label: '物件情報', icon: InfoIcon },
  { id: 'inquiry', label: 'お問い合わせ', icon: MailIcon }
];

export default function SectionNavigation({ availableSections = [] }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('top');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Filter sections based on what's available
  const visibleSections = sections.filter(
    section => section.id === 'top' || availableSections.includes(section.id)
  );

  useEffect(() => {
    const handleScroll = () => {
      // Show scroll-to-top button after scrolling 300px
      setShowScrollTop(window.scrollY > 300);

      // Determine active section
      const scrollPosition = window.scrollY + 150;

      for (let i = visibleSections.length - 1; i >= 0; i--) {
        const section = visibleSections[i];
        const element = document.getElementById(section.id);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(section.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [visibleSections]);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = sectionId === 'top' ? 0 : element.offsetTop - 80;
      window.scrollTo({
        top: offset,
        behavior: 'smooth'
      });
    }
    setDrawerOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Mobile: Floating action button with drawer
  if (isMobile) {
    return (
      <>
        {/* Menu FAB */}
        <Fab
          color="primary"
          size="medium"
          onClick={() => setDrawerOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            zIndex: 1000,
            boxShadow: 3
          }}
        >
          <MenuIcon />
        </Fab>

        {/* Scroll to top FAB */}
        <Zoom in={showScrollTop}>
          <Fab
            color="default"
            size="small"
            onClick={scrollToTop}
            sx={{
              position: 'fixed',
              bottom: 140,
              right: 20,
              zIndex: 1000,
              boxShadow: 2
            }}
          >
            <ScrollTopIcon />
          </Fab>
        </Zoom>

        {/* Navigation Drawer */}
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          <Box sx={{ width: 250, pt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, pb: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                ページ内移動
              </Typography>
              <IconButton onClick={() => setDrawerOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
            <List>
              {visibleSections.map((section) => {
                const Icon = section.icon;
                return (
                  <ListItemButton
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    selected={activeSection === section.id}
                  >
                    <ListItemIcon>
                      <Icon color={activeSection === section.id ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary={section.label} />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        </Drawer>
      </>
    );
  }

  // Desktop: Side navigation bar
  return (
    <>
      {/* Fixed side navigation */}
      <Box
        sx={{
          position: 'fixed',
          right: 24,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 3,
          p: 1
        }}
      >
        {visibleSections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <Tooltip key={section.id} title={section.label} placement="left">
              <IconButton
                onClick={() => scrollToSection(section.id)}
                color={isActive ? 'primary' : 'default'}
                sx={{
                  bgcolor: isActive ? 'primary.light' : 'transparent',
                  '&:hover': {
                    bgcolor: isActive ? 'primary.light' : 'action.hover'
                  }
                }}
              >
                <Icon fontSize="small" />
              </IconButton>
            </Tooltip>
          );
        })}
      </Box>

      {/* Scroll to top button */}
      <Zoom in={showScrollTop}>
        <Fab
          color="primary"
          size="small"
          onClick={scrollToTop}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000
          }}
        >
          <ScrollTopIcon />
        </Fab>
      </Zoom>
    </>
  );
}
