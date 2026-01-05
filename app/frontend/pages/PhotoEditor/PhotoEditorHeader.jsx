import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
} from '@mui/icons-material';
import { getPhotoTypeLabel } from './constants';

export default function PhotoEditorHeader({
  photo,
  isBuilding,
  isMobile,
  editHistory,
  currentHistoryIndex,
  saving,
  aiProcessing,
  onBack,
  onSave,
  onUndo,
  onRedo,
}) {
  return (
    <AppBar position="static" elevation={0} sx={{
      bgcolor: 'primary.main',
      borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
      borderRadius: '12px 12px 0 0'
    }}>
      <Toolbar variant="dense" sx={{ minHeight: 52 }}>
        <IconButton
          edge="start"
          color="inherit"
          onClick={onBack}
          sx={{ mr: 1 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h6" component="h1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
            {isBuilding ? '建物写真編集' : '部屋写真編集'}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, fontSize: '0.85rem' }}>
            {isBuilding
              ? `${photo.building_name || ''}${photo.photo_type ? ` ${getPhotoTypeLabel(photo.photo_type, isBuilding)}` : ''}`
              : `${photo.building_name || ''}${photo.room_name ? ` ${photo.room_name}` : ''}${photo.photo_type ? ` ${getPhotoTypeLabel(photo.photo_type, isBuilding)}` : ''}`
            }
          </Typography>
        </Box>
        {/* 編集履歴（Undo/Redo） */}
        {editHistory.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
            <IconButton
              color="inherit"
              onClick={onUndo}
              disabled={currentHistoryIndex <= 0 || aiProcessing}
              title="元に戻す"
              sx={{
                '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.3)' }
              }}
            >
              <UndoIcon />
            </IconButton>
            <IconButton
              color="inherit"
              onClick={onRedo}
              disabled={currentHistoryIndex >= editHistory.length - 1 || aiProcessing}
              title="やり直す"
              sx={{
                '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.3)' }
              }}
            >
              <RedoIcon />
            </IconButton>
          </Box>
        )}
        {isMobile ? (
          <IconButton
            color="inherit"
            onClick={onSave}
            disabled={saving}
            sx={{
              bgcolor: 'success.main',
              '&:hover': { bgcolor: 'success.dark' },
              '&.Mui-disabled': { bgcolor: 'action.disabledBackground' }
            }}
          >
            <SaveIcon />
          </IconButton>
        ) : (
          <Button
            variant="contained"
            color="success"
            startIcon={<SaveIcon />}
            onClick={onSave}
            disabled={saving}
          >
            {saving ? '保存中...' : '保存'}
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
