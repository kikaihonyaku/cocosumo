import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CompareArrows as CompareArrowsIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import VirtualStagingList from '../VirtualStaging/VirtualStagingList';

export default function RoomVirtualStagingPanel({
  roomId,
  isMaximized,
  onToggleMaximize,
  isMobile = false,
  expanded: controlledExpanded,
  onExpandedChange,
}) {
  const navigate = useNavigate();

  // 親から制御される場合はcontrolledExpanded、そうでなければローカルステート
  const [localExpanded, setLocalExpanded] = useState(true);
  const isControlled = controlledExpanded !== undefined;
  const expanded = isControlled ? controlledExpanded : localExpanded;

  const handleExpandToggle = () => {
    const newExpanded = !expanded;
    if (isControlled) {
      onExpandedChange?.(newExpanded);
    } else {
      setLocalExpanded(newExpanded);
    }
  };

  return (
    <Box sx={{ height: expanded ? '100%' : 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <Box
        sx={{
          px: 2,
          py: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          borderBottom: '1px solid #e0e0e0',
          '&:hover': { bgcolor: 'action.hover' },
          flexShrink: 0,
        }}
        onClick={handleExpandToggle}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CompareArrowsIcon color="action" />
          <Typography variant="subtitle2" fontWeight={600}>
            バーチャルステージング
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="VS作成">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/room/${roomId}/virtual-staging/new`);
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Box>
      </Box>

      {/* コンテンツ */}
      {expanded && (
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <VirtualStagingList roomId={roomId} isMobile={isMobile} />
        </Box>
      )}
    </Box>
  );
}
