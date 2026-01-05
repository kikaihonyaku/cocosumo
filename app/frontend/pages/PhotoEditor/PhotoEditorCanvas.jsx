import React from 'react';
import { Box } from '@mui/material';
import { LocationOn as LocationOnIcon } from '@mui/icons-material';

export default function PhotoEditorCanvas({
  canvasRef,
  canvasContainerRef,
  isMobile,
  editMode,
  cropMode,
  clickPoints,
  onCanvasClick,
  onCropMouseDown,
  onCropMouseMove,
  onCropMouseUp,
}) {
  return (
    <Box
      ref={canvasContainerRef}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f5f5',
        p: 1,
        overflow: 'auto',
        flex: isMobile ? '0 0 auto' : 1,
        minHeight: isMobile ? 'auto' : '100%',
        position: 'relative'
      }}
    >
      <canvas
        ref={canvasRef}
        onClick={cropMode ? undefined : onCanvasClick}
        onTouchStart={cropMode ? undefined : onCanvasClick}
        onMouseDown={cropMode ? onCropMouseDown : undefined}
        onMouseMove={cropMode ? onCropMouseMove : undefined}
        onMouseUp={cropMode ? onCropMouseUp : undefined}
        onTouchMove={cropMode ? onCropMouseMove : undefined}
        onTouchEnd={cropMode ? onCropMouseUp : undefined}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          cursor: cropMode ? 'crosshair' : (editMode === 'point' ? 'crosshair' : 'default'),
          touchAction: (cropMode || editMode === 'point') ? 'none' : 'auto',
        }}
      />

      {/* クリックポイントのマーカー */}
      {editMode === 'point' && clickPoints.map((point, index) => {
        const canvas = canvasRef.current;
        const container = canvasContainerRef.current;
        if (!canvas || !container) return null;

        const canvasRect = canvas.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Canvas上の絶対位置を計算（containerを基準に）
        const left = canvasRect.left - containerRect.left + (point.x * canvasRect.width);
        const top = canvasRect.top - containerRect.top + (point.y * canvasRect.height);

        // マーカーのサイズをモバイルとデスクトップで調整
        const markerSize = isMobile ? 32 : 40;
        const numberSize = isMobile ? 16 : 20;
        const numberTopOffset = isMobile ? -20 : -24;

        return (
          <Box
            key={index}
            sx={{
              position: 'absolute',
              left: `${left}px`,
              top: `${top}px`,
              transform: 'translate(-50%, -100%)',
              pointerEvents: 'none',
              zIndex: 1000
            }}
          >
            <LocationOnIcon
              sx={{
                fontSize: markerSize,
                color: 'error.main',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: `${numberTopOffset}px`,
                left: '50%',
                transform: 'translateX(-50%)',
                bgcolor: 'error.main',
                color: 'white',
                borderRadius: '50%',
                width: numberSize,
                height: numberSize,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile ? '0.625rem' : '0.75rem',
                fontWeight: 'bold',
              }}
            >
              {index + 1}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
