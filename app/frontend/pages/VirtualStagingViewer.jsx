import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import BeforeAfterSlider from '../components/VirtualStaging/BeforeAfterSlider';

const VirtualStagingViewer = () => {
  const { roomId, id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [virtualStaging, setVirtualStaging] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadVirtualStaging();
  }, [id]);

  const loadVirtualStaging = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/rooms/${roomId}/virtual_stagings/${id}`);

      if (response.ok) {
        const data = await response.json();
        setVirtualStaging(data);
      } else if (response.status === 401) {
        navigate('/login');
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
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !virtualStaging) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography color="error">{error || 'データが見つかりません'}</Typography>
      </Container>
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
        {/* ヘッダー */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 2,
          }}
        >
          <IconButton onClick={() => navigate(`/room/${roomId}`)}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h5">{virtualStaging.title}</Typography>
            {virtualStaging.description && (
              <Typography variant="body2" color="text.secondary">
                {virtualStaging.description}
              </Typography>
            )}
          </Box>
        </Box>

        {/* スライダー表示 */}
        <Paper
          sx={{
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 2,
          }}
        >
          <BeforeAfterSlider
            beforeImageUrl={virtualStaging.before_photo_url}
            afterImageUrl={virtualStaging.after_photo_url}
            beforeLabel="Before"
            afterLabel="After"
            height="calc(100vh - 200px)"
          />
        </Paper>

        {/* 物件情報 */}
        {virtualStaging.room && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {virtualStaging.room.building?.name} - {virtualStaging.room.room_number}
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default VirtualStagingViewer;
