import React from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Vrpano as VrpanoIcon,
  Add as AddIcon,
  OpenInFull as OpenInFullIcon,
  CloseFullscreen as CloseFullscreenIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import VRTourList from '../VRTour/VRTourList';

export default function RoomVRTourPanel({ roomId, isMaximized, onToggleMaximize, isMobile = false }) {
  const navigate = useNavigate();

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <Box sx={{
        px: 2,
        py: 1.5,
        borderBottom: '1px solid #e0e0e0',
        bgcolor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        minHeight: 56
      }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1, fontWeight: 600, fontSize: '1.05rem' }}>
          <VrpanoIcon color="primary" sx={{ fontSize: 26 }} />
          VRルームツアー
        </Typography>

        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => navigate(`/room/${roomId}/vr-tour/new`)}
          sx={{ mr: 1 }}
        >
          VRツアー作成
        </Button>

        {!isMobile && isMaximized && (
          <Tooltip title={isMaximized ? "最小化" : "最大化"}>
            <IconButton
              size="small"
              onClick={onToggleMaximize}
            >
              {isMaximized ? <CloseFullscreenIcon /> : <OpenInFullIcon />}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* コンテンツ */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <VRTourList roomId={roomId} />
      </Box>
    </Box>
  );
}
