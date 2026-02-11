import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  IconButton,
  CircularProgress,
  Button,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon } from '@mui/icons-material';
import BeforeAfterViewer from '../components/VirtualStaging/BeforeAfterViewer';

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
          minHeight: 'calc(100vh * var(--vh-correction, 1))',
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
        minHeight: 'calc(100vh * var(--vh-correction, 1))',
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
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5">{virtualStaging.title}</Typography>
            {virtualStaging.description && (
              <Typography variant="body2" color="text.secondary">
                {virtualStaging.description}
              </Typography>
            )}
          </Box>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => window.open(`/room/${roomId}/virtual-staging/${id}/edit`, '_blank')}
          >
            編集
          </Button>
        </Box>

        {/* ビューワー表示 */}
        <Paper
          sx={{
            p: 3,
            bgcolor: 'background.paper',
            borderRadius: 2,
          }}
        >
          <BeforeAfterViewer
            beforeImageUrl={virtualStaging.before_photo_url}
            afterImageUrl={virtualStaging.after_photo_url}
            beforeLabel="Before"
            afterLabel="After"
            showTitle={false}
            showAiDisclaimer
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
