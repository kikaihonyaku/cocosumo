import { createTheme } from '@mui/material/styles';

const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0168B7',
      light: '#4087cc',
      dark: '#004987',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#E70012',
      light: '#eb3347',
      dark: '#a1000d',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    error: {
      main: '#f44336',
      light: '#ef5350',
      dark: '#d32f2f',
    },
    info: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
    },
  },
  typography: {
    fontFamily: [
      'Segoe UI',
      'Tahoma',
      'Geneva',
      'Verdana',
      'sans-serif',
      'Hiragino Kaku Gothic ProN',
      'Hiragino Sans',
      'Meiryo',
      'sans-serif'
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.66,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transform: 'translateY(-1px)',
          },
        },
        containedPrimary: {
          backgroundColor: '#0168B7',
          '&:hover': {
            backgroundColor: '#004987',
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0 3px 5px -1px rgba(0,0,0,.2), 0 6px 10px 0 rgba(0,0,0,.14), 0 1px 18px 0 rgba(0,0,0,.12)',
          '&:hover': {
            transform: 'scale(1.05)',
            boxShadow: '0 5px 8px -1px rgba(0,0,0,.2), 0 8px 12px 0 rgba(0,0,0,.14), 0 2px 20px 0 rgba(0,0,0,.12)',
          },
        },
        primary: {
          backgroundColor: '#0168B7',
          '&:hover': {
            backgroundColor: '#004987',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0168B7',
          color: '#ffffff',
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          color: '#ffffff',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: 0,
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 8,
          marginBottom: 8,
          '&.Mui-expanded': {
            minHeight: 48,
          },
        },
        content: {
          '&.Mui-expanded': {
            margin: '12px 0',
          },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: '8px 16px 16px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        },
        elevation2: {
          boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
        },
        colorPrimary: {
          backgroundColor: '#0168B7',
          color: '#ffffff',
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          borderRadius: 12,
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#f5f7fa',
            borderBottom: '2px solid #0168B7',
            color: '#333333',
            fontSize: '0.875rem',
            fontWeight: 600,
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 600,
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'rgba(102, 126, 234, 0.04)',
          },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid rgba(224, 224, 224, 0.5)',
          },
          '& .MuiDataGrid-sortIcon': {
            color: '#0168B7',
          },
          '& .MuiDataGrid-menuIconButton': {
            color: '#0168B7',
          },
          '& .MuiDataGrid-filterIcon': {
            color: '#0168B7',
          },
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          marginLeft: 0,
          marginRight: 0,
        },
        label: {
          color: 'inherit',
          fontSize: '0.875rem',
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          // デフォルトはMUI標準色（白背景のテーブル等で使用）
          // 青背景で使う場合は個別にsx={{ color: 'rgba(255,255,255,0.7)', '&.Mui-checked': { color: '#fff' } }}を指定
        },
      },
    },
  },
});

export default muiTheme;