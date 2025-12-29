import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PushPin as PinIcon,
  TextFields as TextIcon,
  Close as CloseIcon,
  Done as DoneIcon,
} from '@mui/icons-material';

/**
 * アノテーション管理パネル
 */
const AnnotationsPanel = ({
  annotations = [],
  onAnnotationsChange,
  beforeImageUrl,
  afterImageUrl,
}) => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [positionMode, setPositionMode] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState(null);
  const [tempAnnotation, setTempAnnotation] = useState({
    text: '',
    side: 'both',
    color: '#667eea',
  });
  const imageContainerRef = useRef(null);

  // アノテーションタイプ
  const ANNOTATION_COLORS = [
    { value: '#667eea', label: 'パープル' },
    { value: '#4CAF50', label: 'グリーン' },
    { value: '#FF5722', label: 'オレンジ' },
    { value: '#2196F3', label: 'ブルー' },
    { value: '#E91E63', label: 'ピンク' },
  ];

  const SIDE_OPTIONS = [
    { value: 'before', label: 'Before のみ' },
    { value: 'after', label: 'After のみ' },
    { value: 'both', label: '両方' },
  ];

  const handleOpenAddDialog = () => {
    setTempAnnotation({
      text: '',
      side: 'both',
      color: '#667eea',
      x: 50,
      y: 50,
    });
    setAddDialogOpen(true);
  };

  const handleOpenEditDialog = (annotation, index) => {
    setCurrentAnnotation({ ...annotation, index });
    setTempAnnotation({ ...annotation });
    setEditDialogOpen(true);
  };

  const handleStartPositioning = () => {
    if (!tempAnnotation.text.trim()) {
      return;
    }
    setAddDialogOpen(false);
    setEditDialogOpen(false);
    setPositionMode(true);
  };

  const handleImageClick = useCallback((e) => {
    if (!positionMode) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newAnnotation = {
      ...tempAnnotation,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      id: currentAnnotation?.id || Date.now(),
    };

    if (currentAnnotation?.index !== undefined) {
      // 編集モード
      const updatedAnnotations = [...annotations];
      updatedAnnotations[currentAnnotation.index] = newAnnotation;
      onAnnotationsChange(updatedAnnotations);
    } else {
      // 追加モード
      onAnnotationsChange([...annotations, newAnnotation]);
    }

    setPositionMode(false);
    setCurrentAnnotation(null);
    setTempAnnotation({ text: '', side: 'both', color: '#667eea' });
  }, [positionMode, tempAnnotation, currentAnnotation, annotations, onAnnotationsChange]);

  const handleCancelPositioning = () => {
    setPositionMode(false);
    setCurrentAnnotation(null);
  };

  const handleDeleteAnnotation = (index) => {
    const updatedAnnotations = annotations.filter((_, i) => i !== index);
    onAnnotationsChange(updatedAnnotations);
  };

  const handleUpdateAnnotation = () => {
    if (!tempAnnotation.text.trim()) return;

    const updatedAnnotations = [...annotations];
    updatedAnnotations[currentAnnotation.index] = {
      ...currentAnnotation,
      ...tempAnnotation,
    };
    onAnnotationsChange(updatedAnnotations);
    setEditDialogOpen(false);
    setCurrentAnnotation(null);
  };

  const getSideLabel = (side) => {
    return SIDE_OPTIONS.find((o) => o.value === side)?.label || side;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="600">
          アノテーション
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
        >
          追加
        </Button>
      </Box>

      {annotations.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          画像にポイントやテキストを追加して、変更点をハイライトできます
        </Alert>
      ) : (
        <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
          {annotations.map((annotation, index) => (
            <ListItem key={annotation.id || index} divider>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                <PinIcon sx={{ color: annotation.color, fontSize: 20 }} />
              </Box>
              <ListItemText
                primary={annotation.text}
                secondary={
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                    <Chip
                      label={getSideLabel(annotation.side)}
                      size="small"
                      sx={{ fontSize: '0.65rem', height: 20 }}
                    />
                    <Chip
                      label={`${Math.round(annotation.x)}%, ${Math.round(annotation.y)}%`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.65rem', height: 20 }}
                    />
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <Tooltip title="編集">
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => handleOpenEditDialog(annotation, index)}
                    sx={{ mr: 0.5 }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="削除">
                  <IconButton
                    edge="end"
                    size="small"
                    color="error"
                    onClick={() => handleDeleteAnnotation(index)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      {/* 位置選択モード */}
      {positionMode && (
        <Dialog
          open={positionMode}
          onClose={handleCancelPositioning}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: { height: '90vh' }
          }}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6">アノテーションの位置を選択</Typography>
              <Typography variant="body2" color="text.secondary">
                画像をクリックしてピンを配置してください
              </Typography>
            </Box>
            <IconButton onClick={handleCancelPositioning}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Box
              ref={imageContainerRef}
              sx={{
                position: 'relative',
                width: '100%',
                height: 'calc(100% - 16px)',
                cursor: 'crosshair',
                bgcolor: '#1a1a2e',
                borderRadius: 2,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={handleImageClick}
            >
              <Box
                component="img"
                src={tempAnnotation.side === 'after' ? afterImageUrl : beforeImageUrl}
                alt="Annotation target"
                sx={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
              />
              {/* プレビューピン（マウス位置に追従） */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  pointerEvents: 'none',
                }}
              >
                {/* 既存のアノテーションを表示 */}
                {annotations.map((ann, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      position: 'absolute',
                      left: `${ann.x}%`,
                      top: `${ann.y}%`,
                      transform: 'translate(-50%, -100%)',
                      opacity: 0.5,
                    }}
                  >
                    <PinIcon sx={{ color: ann.color, fontSize: 28 }} />
                  </Box>
                ))}
              </Box>
            </Box>
          </DialogContent>
        </Dialog>
      )}

      {/* 追加ダイアログ */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>アノテーションを追加</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="テキスト"
              placeholder="例: リビングを明るく改装"
              fullWidth
              value={tempAnnotation.text}
              onChange={(e) => setTempAnnotation({ ...tempAnnotation, text: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>表示箇所</InputLabel>
              <Select
                value={tempAnnotation.side}
                label="表示箇所"
                onChange={(e) => setTempAnnotation({ ...tempAnnotation, side: e.target.value })}
              >
                {SIDE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box>
              <Typography variant="body2" gutterBottom>
                カラー
              </Typography>
              <ToggleButtonGroup
                value={tempAnnotation.color}
                exclusive
                onChange={(e, value) => value && setTempAnnotation({ ...tempAnnotation, color: value })}
                size="small"
              >
                {ANNOTATION_COLORS.map((color) => (
                  <ToggleButton key={color.value} value={color.value}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        bgcolor: color.value,
                        border: tempAnnotation.color === color.value ? '2px solid white' : 'none',
                        boxShadow: tempAnnotation.color === color.value ? `0 0 0 2px ${color.value}` : 'none',
                      }}
                    />
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>キャンセル</Button>
          <Button
            variant="contained"
            onClick={handleStartPositioning}
            disabled={!tempAnnotation.text.trim()}
            startIcon={<PinIcon />}
          >
            位置を選択
          </Button>
        </DialogActions>
      </Dialog>

      {/* 編集ダイアログ */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>アノテーションを編集</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="テキスト"
              fullWidth
              value={tempAnnotation.text}
              onChange={(e) => setTempAnnotation({ ...tempAnnotation, text: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>表示箇所</InputLabel>
              <Select
                value={tempAnnotation.side}
                label="表示箇所"
                onChange={(e) => setTempAnnotation({ ...tempAnnotation, side: e.target.value })}
              >
                {SIDE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box>
              <Typography variant="body2" gutterBottom>
                カラー
              </Typography>
              <ToggleButtonGroup
                value={tempAnnotation.color}
                exclusive
                onChange={(e, value) => value && setTempAnnotation({ ...tempAnnotation, color: value })}
                size="small"
              >
                {ANNOTATION_COLORS.map((color) => (
                  <ToggleButton key={color.value} value={color.value}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        bgcolor: color.value,
                      }}
                    />
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>キャンセル</Button>
          <Button
            variant="outlined"
            onClick={handleStartPositioning}
            startIcon={<PinIcon />}
          >
            位置を変更
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateAnnotation}
            disabled={!tempAnnotation.text.trim()}
          >
            更新
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AnnotationsPanel;
