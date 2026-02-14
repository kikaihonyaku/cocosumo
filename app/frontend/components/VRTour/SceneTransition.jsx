import React from 'react';
import { Box, Typography, Fade } from '@mui/material';

/**
 * シーン切り替え時の軽量トースト表示
 * 操作を阻害しない（pointerEvents: 'none'）
 */
const SceneTransition = ({
  show,
  sceneName = '',
}) => {
  return (
    <Fade in={show} timeout={{ enter: 200, exit: 400 }}>
      <Box
        sx={{
          position: 'absolute',
          top: 64,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          pointerEvents: 'none',
        }}
      >
        <Box
          sx={{
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            px: 3,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {sceneName && (
            <Typography
              variant="body2"
              sx={{
                color: 'white',
                fontWeight: 500,
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              {sceneName}
            </Typography>
          )}
        </Box>
      </Box>
    </Fade>
  );
};

export default SceneTransition;
