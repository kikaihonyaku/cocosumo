import React, { Component } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  Collapse
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { trackEvent } from '../services/analytics';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({ errorInfo });

    // Track error to analytics
    try {
      trackEvent('error_boundary_catch', {
        error_message: error?.message || 'Unknown error',
        error_stack: error?.stack?.substring(0, 500),
        component_stack: errorInfo?.componentStack?.substring(0, 500),
        page_url: window.location.href
      });
    } catch (e) {
      // Silently fail if analytics fails
    }

    // Call optional error callback
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    });

    // Call optional retry callback
    this.props.onRetry?.();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    const { hasError, error, errorInfo, showDetails } = this.state;
    const { children, fallback, level = 'page' } = this.props;

    if (hasError) {
      // Custom fallback provided
      if (fallback) {
        return typeof fallback === 'function'
          ? fallback({ error, errorInfo, retry: this.handleRetry })
          : fallback;
      }

      // Section-level error (compact)
      if (level === 'section') {
        return (
          <Paper
            sx={{
              p: 3,
              textAlign: 'center',
              bgcolor: 'error.lighter',
              border: '1px solid',
              borderColor: 'error.light'
            }}
          >
            <ErrorIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="body1" color="error" gutterBottom>
              このセクションの読み込みに失敗しました
            </Typography>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={this.handleRetry}
            >
              再試行
            </Button>
          </Paper>
        );
      }

      // Page-level error (full page)
      const isDev = process.env.NODE_ENV === 'development';

      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#f5f5f5',
            p: 2
          }}
        >
          <Container maxWidth="sm">
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <ErrorIcon color="error" sx={{ fontSize: 64, mb: 2 }} />

              <Typography variant="h5" gutterBottom>
                エラーが発生しました
              </Typography>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                申し訳ございません。予期しないエラーが発生しました。
                <br />
                ページを再読み込みするか、ホームに戻ってください。
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleRetry}
                >
                  再試行
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<HomeIcon />}
                  onClick={this.handleGoHome}
                >
                  ホームに戻る
                </Button>
              </Box>

              {/* Error details (dev mode or expandable) */}
              {(isDev || error?.message) && (
                <>
                  <Button
                    size="small"
                    onClick={this.toggleDetails}
                    endIcon={
                      <ExpandMoreIcon
                        sx={{
                          transform: showDetails ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s'
                        }}
                      />
                    }
                  >
                    {showDetails ? '詳細を隠す' : '詳細を表示'}
                  </Button>

                  <Collapse in={showDetails}>
                    <Alert
                      severity="error"
                      sx={{
                        mt: 2,
                        textAlign: 'left',
                        '& .MuiAlert-message': { width: '100%' }
                      }}
                    >
                      <Typography variant="subtitle2" gutterBottom>
                        Error: {error?.message || 'Unknown error'}
                      </Typography>
                      {isDev && errorInfo?.componentStack && (
                        <Box
                          component="pre"
                          sx={{
                            fontSize: '0.75rem',
                            overflow: 'auto',
                            maxHeight: 200,
                            bgcolor: 'grey.100',
                            p: 1,
                            borderRadius: 1,
                            mt: 1
                          }}
                        >
                          {errorInfo.componentStack}
                        </Box>
                      )}
                    </Alert>
                  </Collapse>
                </>
              )}
            </Paper>
          </Container>
        </Box>
      );
    }

    return children;
  }
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary(WrappedComponent, options = {}) {
  return function WithErrorBoundary(props) {
    return (
      <ErrorBoundary {...options}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;
