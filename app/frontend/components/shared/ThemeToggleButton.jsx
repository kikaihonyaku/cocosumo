/**
 * Theme Toggle Button Component
 * Toggle between light, dark, and system theme modes
 */

import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Divider
} from '@mui/material';
import {
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  SettingsBrightness as SystemIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useThemeMode, THEME_MODES } from '../../contexts/ThemeContext';

/**
 * Simple toggle button (light/dark only)
 */
export function ThemeToggleButton({ size = 'medium', tooltip = true }) {
  const { isDarkMode, cycleTheme } = useThemeMode();

  const button = (
    <IconButton
      onClick={cycleTheme}
      size={size}
      color="inherit"
      aria-label={isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
    >
      {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  );

  if (tooltip) {
    return (
      <Tooltip title={isDarkMode ? 'ライトモード' : 'ダークモード'}>
        {button}
      </Tooltip>
    );
  }

  return button;
}

/**
 * Theme selector with menu (light/dark/system)
 */
export function ThemeSelector({ size = 'medium' }) {
  const { themeMode, effectiveMode, setLightMode, setDarkMode, setSystemMode } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectMode = (mode) => {
    switch (mode) {
      case THEME_MODES.LIGHT:
        setLightMode();
        break;
      case THEME_MODES.DARK:
        setDarkMode();
        break;
      case THEME_MODES.SYSTEM:
        setSystemMode();
        break;
    }
    handleClose();
  };

  const getCurrentIcon = () => {
    if (themeMode === THEME_MODES.SYSTEM) {
      return <SystemIcon />;
    }
    return effectiveMode === 'dark' ? <DarkModeIcon /> : <LightModeIcon />;
  };

  const menuItems = [
    {
      mode: THEME_MODES.LIGHT,
      icon: <LightModeIcon fontSize="small" />,
      label: 'ライトモード'
    },
    {
      mode: THEME_MODES.DARK,
      icon: <DarkModeIcon fontSize="small" />,
      label: 'ダークモード'
    },
    {
      mode: THEME_MODES.SYSTEM,
      icon: <SystemIcon fontSize="small" />,
      label: 'システム設定'
    }
  ];

  return (
    <>
      <Tooltip title="テーマを変更">
        <IconButton
          onClick={handleClick}
          size={size}
          color="inherit"
          aria-label="テーマを変更"
          aria-controls={open ? 'theme-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          {getCurrentIcon()}
        </IconButton>
      </Tooltip>

      <Menu
        id="theme-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'theme-button'
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {menuItems.map((item) => (
          <MenuItem
            key={item.mode}
            onClick={() => handleSelectMode(item.mode)}
            selected={themeMode === item.mode}
          >
            <ListItemIcon>
              {themeMode === item.mode ? (
                <CheckIcon fontSize="small" color="primary" />
              ) : (
                item.icon
              )}
            </ListItemIcon>
            <ListItemText>{item.label}</ListItemText>
          </MenuItem>
        ))}

        {themeMode === THEME_MODES.SYSTEM && (
          <>
            <Divider />
            <MenuItem disabled>
              <ListItemText
                secondary={`現在: ${effectiveMode === 'dark' ? 'ダーク' : 'ライト'}`}
              />
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
}

/**
 * Theme indicator badge
 */
export function ThemeIndicator() {
  const { effectiveMode, themeMode } = useThemeMode();

  const label = themeMode === THEME_MODES.SYSTEM
    ? `システム (${effectiveMode === 'dark' ? 'ダーク' : 'ライト'})`
    : effectiveMode === 'dark' ? 'ダークモード' : 'ライトモード';

  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {effectiveMode === 'dark' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
      <span>{label}</span>
    </span>
  );
}

export default ThemeToggleButton;
