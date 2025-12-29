import React from 'react';
import { Box, Typography, Paper, Fade } from '@mui/material';
import { NavigateNext as NavigateNextIcon, Info as InfoIcon } from '@mui/icons-material';

/**
 * ホットスポットプレビューコンポーネント
 * マーカーホバー時に移動先シーンのプレビューを表示
 */
const HotspotPreview = ({
  show,
  marker,
  targetScene,
  position = { x: 0, y: 0 },
}) => {
  if (!show || !marker) return null;

  const isSceneLink = marker.data?.type === 'scene_link';
  const isInfo = marker.data?.type === 'info';

  // シーンリンクの場合はターゲットシーン情報を表示
  // インフォスポットの場合はタイトルと説明を表示
  const title = isSceneLink
    ? targetScene?.title || marker.text
    : marker.data?.title || marker.text;

  const description = isSceneLink
    ? targetScene?.description || null
    : marker.data?.description || null;

  const thumbnailUrl = isSceneLink
    ? targetScene?.thumbnail_url || targetScene?.photo_url
    : marker.data?.image_url || null;

  return (
    <Fade in={show} timeout={200}>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -100%) translateY(-20px)',
          zIndex: 2000,
          maxWidth: 280,
          minWidth: 180,
          bgcolor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          overflow: 'hidden',
          borderRadius: 2,
          pointerEvents: 'none', // プレビュー上でのマウスイベントを無視
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -8,
            left: '50%',
            transform: 'translateX(-50%)',
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid rgba(0, 0, 0, 0.9)',
          },
        }}
      >
        {/* サムネイル画像 */}
        {thumbnailUrl && (
          <Box
            sx={{
              width: '100%',
              height: 120,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <img
              src={thumbnailUrl}
              alt={title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {/* オーバーレイグラデーション */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 40,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
              }}
            />
          </Box>
        )}

        {/* コンテンツ */}
        <Box sx={{ p: 1.5 }}>
          {/* タイプアイコンとタイトル */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            {isSceneLink ? (
              <NavigateNextIcon sx={{ fontSize: 18, color: 'primary.main' }} />
            ) : (
              <InfoIcon sx={{ fontSize: 18, color: 'info.main' }} />
            )}
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                lineHeight: 1.3,
                flex: 1,
              }}
            >
              {title}
            </Typography>
          </Box>

          {/* 説明文 */}
          {description && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: 1.4,
                mt: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {description}
            </Typography>
          )}

          {/* シーンリンクの場合はクリックヒント */}
          {isSceneLink && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: 'rgba(255, 255, 255, 0.5)',
                mt: 1,
                fontSize: '0.7rem',
              }}
            >
              クリックで移動
            </Typography>
          )}
        </Box>
      </Paper>
    </Fade>
  );
};

export default HotspotPreview;
