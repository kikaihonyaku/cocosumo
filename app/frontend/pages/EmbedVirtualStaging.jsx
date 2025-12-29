import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Alert, ThemeProvider, CssBaseline } from '@mui/material';
import BeforeAfterSlider from '../components/VirtualStaging/BeforeAfterSlider';
import { createTheme } from '@mui/material/styles';

// 埋め込み用の最小限テーマ
const embedTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: 'transparent',
    },
  },
});

/**
 * 埋め込み用バーチャルステージングページ
 * iframeで外部サイトに埋め込むための軽量版
 */
const EmbedVirtualStaging = () => {
  const { publicId } = useParams();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [virtualStaging, setVirtualStaging] = useState(null);
  const [error, setError] = useState(null);

  // URLパラメータからオプションを取得
  const showLabels = searchParams.get('labels') !== 'false';

  useEffect(() => {
    loadVirtualStaging();
  }, [publicId]);

  const loadVirtualStaging = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/virtual_stagings/${publicId}/public`);

      if (response.ok) {
        const data = await response.json();
        setVirtualStaging(data);
      } else if (response.status === 404) {
        setError('このバーチャルステージングは公開されていません');
      } else {
        setError('読み込みに失敗しました');
      }
    } catch (error) {
      console.error('Failed to load virtual staging:', error);
      setError('読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ThemeProvider theme={embedTheme}>
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            width: '100vw',
            bgcolor: 'transparent',
          }}
        >
          <CircularProgress sx={{ color: 'white' }} />
        </Box>
      </ThemeProvider>
    );
  }

  if (error || !virtualStaging) {
    return (
      <ThemeProvider theme={embedTheme}>
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            width: '100vw',
            bgcolor: '#1a1a2e',
            p: 2,
          }}
        >
          <Alert severity="error" sx={{ maxWidth: 400 }}>
            {error || 'データが見つかりません'}
          </Alert>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={embedTheme}>
      <CssBaseline />
      <Box
        sx={{
          width: '100vw',
          height: '100vh',
          bgcolor: '#1a1a2e',
          overflow: 'hidden',
        }}
      >
        <BeforeAfterSlider
          beforeImageUrl={virtualStaging.before_photo_url}
          afterImageUrl={virtualStaging.after_photo_url}
          beforeLabel="Before"
          afterLabel="After"
          height="100vh"
          showLabels={showLabels}
          showGuide={true}
          showFullscreenButton={false}
          annotations={virtualStaging.annotations || []}
        />
      </Box>
    </ThemeProvider>
  );
};

export default EmbedVirtualStaging;
