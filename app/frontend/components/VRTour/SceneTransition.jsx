import React from 'react';
import { Box, CircularProgress, Typography, Fade, Zoom } from '@mui/material';
import { ThreeSixty as PanoramaIcon } from '@mui/icons-material';

/**
 * シーン切り替えトランジションオーバーレイ
 * シーン変更時にフェードイン/アウト効果を表示
 */
const SceneTransition = ({
  show,
  transitionType = 'fade', // 'fade' | 'zoom' | 'blur'
  sceneName = '',
}) => {
  if (!show) return null;

  return (
    <Fade in={show} timeout={300}>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: transitionType === 'blur' ? 'blur(10px)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        <Zoom in={show} timeout={400}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            {/* パノラマアイコンアニメーション */}
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 1.5s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%': {
                    transform: 'scale(1)',
                    boxShadow: '0 0 0 0 rgba(255, 255, 255, 0.3)',
                  },
                  '50%': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 0 0 15px rgba(255, 255, 255, 0)',
                  },
                  '100%': {
                    transform: 'scale(1)',
                    boxShadow: '0 0 0 0 rgba(255, 255, 255, 0)',
                  },
                },
              }}
            >
              <PanoramaIcon
                sx={{
                  fontSize: 40,
                  color: 'primary.main',
                  animation: 'spin 2s linear infinite',
                  '@keyframes spin': {
                    '0%': { transform: 'rotateY(0deg)' },
                    '100%': { transform: 'rotateY(360deg)' },
                  },
                }}
              />
            </Box>

            {/* ローディングインジケーター */}
            <CircularProgress
              size={24}
              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
            />

            {/* シーン名 */}
            {sceneName && (
              <Typography
                variant="body1"
                sx={{
                  color: 'white',
                  fontWeight: 500,
                  mt: 1,
                  textAlign: 'center',
                }}
              >
                {sceneName}
              </Typography>
            )}

            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.5)',
                mt: 0.5,
              }}
            >
              読み込み中...
            </Typography>
          </Box>
        </Zoom>
      </Box>
    </Fade>
  );
};

export default SceneTransition;
