import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from 'react-compare-slider';

/**
 * Before/After画像比較スライダーコンポーネント
 */
const BeforeAfterSlider = ({
  beforeImageUrl,
  afterImageUrl,
  beforeLabel = 'Before',
  afterLabel = 'After',
  height = '600px',
  showLabels = true,
}) => {
  return (
    <Box sx={{
      position: 'relative',
      width: '100%',
      height: height,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <ReactCompareSlider
        itemOne={
          <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <ReactCompareSliderImage
              src={beforeImageUrl}
              alt={beforeLabel}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
            {showLabels && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  bgcolor: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" fontWeight="bold">
                  {beforeLabel}
                </Typography>
              </Box>
            )}
          </Box>
        }
        itemTwo={
          <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <ReactCompareSliderImage
              src={afterImageUrl}
              alt={afterLabel}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
            {showLabels && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  bgcolor: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" fontWeight="bold">
                  {afterLabel}
                </Typography>
              </Box>
            )}
          </Box>
        }
        position={50}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      />
    </Box>
  );
};

export default BeforeAfterSlider;
