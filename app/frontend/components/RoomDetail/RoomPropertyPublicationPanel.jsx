import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Article as ArticleIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PropertyPublicationList from '../PropertyPublication/PropertyPublicationList';

export default function RoomPropertyPublicationPanel({
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
          <ArticleIcon color="action" />
          <Typography variant="subtitle2" fontWeight={600}>
            物件公開ページ
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="物件公開ページ作成">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/room/${roomId}/property-publication/new`);
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
          <PropertyPublicationList roomId={roomId} />
        </Box>
      )}
    </Box>
  );
}
