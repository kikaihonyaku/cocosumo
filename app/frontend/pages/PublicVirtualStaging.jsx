import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Paper, Alert, Chip, Stack } from '@mui/material';
import { LocationOn as LocationIcon } from '@mui/icons-material';
import BeforeAfterViewer from '../components/VirtualStaging/BeforeAfterViewer';
import SharePanel from '../components/VirtualStaging/SharePanel';

const PublicVirtualStaging = () => {
  const { publicId } = useParams();
  const [loading, setLoading] = useState(true);
  const [virtualStaging, setVirtualStaging] = useState(null);
  const [error, setError] = useState(null);
  const [selectedVariationId, setSelectedVariationId] = useState(null);

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
          bgcolor: '#1a1a2e',
        }}
      >
        <CircularProgress sx={{ color: 'white' }} />
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
          bgcolor: '#1a1a2e',
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          {error || 'データが見つかりません'}
        </Alert>
      </Box>
    );
  }

  // 現在表示するAfter画像を取得
  const getActiveAfterImageUrl = () => {
    if (selectedVariationId && virtualStaging.variations) {
      const variation = virtualStaging.variations.find(v => v.id === selectedVariationId);
      if (variation) {
        return variation.after_photo_url;
      }
    }
    return virtualStaging.after_photo_url;
  };

  const hasVariations = virtualStaging.variations && virtualStaging.variations.length > 0;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#1a1a2e',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ビューワー表示 */}
      <Box
        sx={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          pt: 10,
          pb: 16,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 1400 }}>
          <BeforeAfterViewer
            beforeImageUrl={virtualStaging.before_photo_url}
            afterImageUrl={getActiveAfterImageUrl()}
            beforeLabel="Before"
            afterLabel="After"
            showTitle={false}
            darkMode
          />
        </Box>
      </Box>

      {/* バリエーション切り替え（下部中央） */}
      {hasVariations && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
          }}
        >
          <Paper
            sx={{
              bgcolor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(8px)',
              px: 2,
              py: 1.5,
              borderRadius: 2,
            }}
          >
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', mb: 1, textAlign: 'center' }}>
              スタイルを選択
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
              <Chip
                label="オリジナル"
                onClick={() => setSelectedVariationId(null)}
                color={selectedVariationId === null ? 'primary' : 'default'}
                variant={selectedVariationId === null ? 'filled' : 'outlined'}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.5)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                }}
              />
              {virtualStaging.variations.map((variation) => (
                <Chip
                  key={variation.id}
                  label={variation.style_name}
                  onClick={() => setSelectedVariationId(variation.id)}
                  color={selectedVariationId === variation.id ? 'primary' : 'default'}
                  variant={selectedVariationId === variation.id ? 'filled' : 'outlined'}
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.5)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                />
              ))}
            </Stack>
          </Paper>
        </Box>
      )}

      {/* タイトル（上部中央にオーバーレイ） */}
      <Box
        sx={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          bgcolor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          color: 'white',
          px: 4,
          py: 1.5,
          borderRadius: 2,
          zIndex: 10,
          textAlign: 'center',
          maxWidth: '80%',
        }}
      >
        <Typography variant="h5" fontWeight="600" noWrap>
          {virtualStaging.title}
        </Typography>
        {virtualStaging.description && (
          <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
            {virtualStaging.description}
          </Typography>
        )}
      </Box>

      {/* 物件情報（左下にオーバーレイ） */}
      {virtualStaging.room && (
        <Paper
          sx={{
            position: 'absolute',
            bottom: 60,
            left: 20,
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            px: 2,
            py: 1.5,
            borderRadius: 1,
            zIndex: 10,
            maxWidth: 300,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <LocationIcon fontSize="small" color="primary" sx={{ mt: 0.5 }} />
            <Box>
              {virtualStaging.room.building && (
                <>
                  <Typography variant="body2" fontWeight="600">
                    {virtualStaging.room.building.name}
                  </Typography>
                  {virtualStaging.room.room_number && (
                    <Typography variant="body2" color="text.secondary">
                      {virtualStaging.room.room_number}号室
                    </Typography>
                  )}
                  {virtualStaging.room.building.address && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {virtualStaging.room.building.address}
                    </Typography>
                  )}
                </>
              )}
            </Box>
          </Box>
        </Paper>
      )}

      {/* 共有ボタン（右上） */}
      <Box
        sx={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 10,
        }}
      >
        <SharePanel
          publicUrl={window.location.href}
          title={virtualStaging.title}
          variant="icon"
        />
      </Box>

      {/* フッター（右下に控えめに表示） */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 20,
          zIndex: 10,
        }}
      >
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          Powered by CoCoSuMo
        </Typography>
      </Box>
    </Box>
  );
};

export default PublicVirtualStaging;
