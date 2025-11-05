import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Container, Typography, CircularProgress, Paper } from '@mui/material';
import BeforeAfterSlider from '../components/VirtualStaging/BeforeAfterSlider';

const PublicVirtualStaging = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [virtualStaging, setVirtualStaging] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadVirtualStaging();
  }, [id]);

  const loadVirtualStaging = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/virtual_stagings/${id}/public`);

      if (response.ok) {
        const data = await response.json();
        setVirtualStaging(data);
      } else if (response.status === 404) {
        setError('このバーチャルステージングは公開されていないか、存在しません');
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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !virtualStaging) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Container maxWidth="md">
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="error" variant="h6">
              {error || 'データが見つかりません'}
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: 2,
      }}
    >
      <Container maxWidth="xl">
        {/* ヘッダー情報 */}
        <Box
          sx={{
            mb: 2,
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 1,
          }}
        >
          <Typography variant="h4" gutterBottom>
            {virtualStaging.title}
          </Typography>
          {virtualStaging.description && (
            <Typography variant="body1" color="text.secondary" paragraph>
              {virtualStaging.description}
            </Typography>
          )}
          {virtualStaging.room && (
            <Typography variant="body2" color="text.secondary">
              {virtualStaging.room.building?.name}
              {virtualStaging.room.building?.address && ` - ${virtualStaging.room.building.address}`}
              {' '}- {virtualStaging.room.room_number}
            </Typography>
          )}
        </Box>

        {/* スライダー表示 */}
        <Paper
          sx={{
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 2,
          }}
        >
          <BeforeAfterSlider
            beforeImageUrl={virtualStaging.before_photo_url}
            afterImageUrl={virtualStaging.after_photo_url}
            beforeLabel="Before"
            afterLabel="After"
            height="calc(100vh - 250px)"
          />
        </Paper>

        {/* フッター */}
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Powered by CoCoSuMo
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default PublicVirtualStaging;
