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
        }
        itemTwo={
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
        }
        position={50}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      />
      {/* ラベルをスライダーの外側に配置して常に表示 */}
      {showLabels && (
        <>
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
              pointerEvents: 'none',
              zIndex: 5,
            }}
          >
            <Typography variant="body2" fontWeight="bold">
              {beforeLabel}
            </Typography>
          </Box>
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
              pointerEvents: 'none',
              zIndex: 5,
            }}
          >
            <Typography variant="body2" fontWeight="bold">
              {afterLabel}
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
};

export default BeforeAfterSlider;
