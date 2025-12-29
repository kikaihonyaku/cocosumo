import React, { useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Link as LinkIcon,
  Info as InfoIcon
} from "@mui/icons-material";

export default function HotspotEditor({
  hotspots = [],
  scenes = [],
  currentSceneId,
  onHotspotsChange,
  onAddHotspotRequest,
  pendingPosition,
  onHotspotEdit
}) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingHotspot, setEditingHotspot] = useState(null);
  const [hotspotForm, setHotspotForm] = useState({
    type: 'scene_link',
    text: '',
    target_scene_id: '',
    arrow_direction: 'right',
    yaw: 0,
    pitch: 0,
    // info type fields
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    link_text: ''
  });

  const ARROW_DIRECTIONS = [
    { value: 'right', label: '→ 右' },
    { value: 'down-right', label: '↘ 右下' },
    { value: 'down', label: '↓ 下' },
    { value: 'down-left', label: '↙ 左下' },
    { value: 'left', label: '← 左' },
    { value: 'up-left', label: '↖ 左上' },
    { value: 'up', label: '↑ 上' },
    { value: 'up-right', label: '↗ 右上' },
  ];

  // Update form when pendingPosition changes
  React.useEffect(() => {
    if (pendingPosition && editDialogOpen && !editingHotspot) {
      setHotspotForm(prev => ({
        ...prev,
        yaw: pendingPosition.yaw,
        pitch: pendingPosition.pitch
      }));
    }
  }, [pendingPosition, editDialogOpen, editingHotspot]);

  // 外部からホットスポット編集を開始
  React.useEffect(() => {
    if (onHotspotEdit) {
      onHotspotEdit((hotspotId) => {
        const hotspot = hotspots.find(h => h.id === hotspotId);
        if (hotspot) {
          handleEditHotspot(hotspot);
        }
      });
    }
  }, []);

  const handleAddHotspot = () => {
    setEditingHotspot(null);
    setHotspotForm({
      type: 'scene_link',
      text: '',
      target_scene_id: '',
      arrow_direction: 'right',
      yaw: pendingPosition?.yaw || 0,
      pitch: pendingPosition?.pitch || 0,
      title: '',
      description: '',
      image_url: '',
      link_url: '',
      link_text: ''
    });
    setEditDialogOpen(true);
    onAddHotspotRequest && onAddHotspotRequest();
  };

  const handleEditHotspot = (hotspot) => {
    setEditingHotspot(hotspot);
    setHotspotForm({
      type: hotspot.data?.type || 'scene_link',
      text: hotspot.text || '',
      target_scene_id: hotspot.data?.target_scene_id ? String(hotspot.data.target_scene_id) : '',
      arrow_direction: hotspot.data?.arrow_direction || 'right',
      yaw: hotspot.yaw || 0,
      pitch: hotspot.pitch || 0,
      title: hotspot.data?.title || '',
      description: hotspot.data?.description || '',
      image_url: hotspot.data?.image_url || '',
      link_url: hotspot.data?.link_url || '',
      link_text: hotspot.data?.link_text || ''
    });
    setEditDialogOpen(true);
  };

  const handleDeleteHotspot = (hotspotId) => {
    if (!confirm('このホットスポットを削除してもよろしいですか？')) {
      return;
    }
    const newHotspots = hotspots.filter(h => h.id !== hotspotId);
    onHotspotsChange && onHotspotsChange(newHotspots);
  };

  const handleSaveHotspot = () => {
    if (!hotspotForm.text) {
      alert('テキストを入力してください');
      return;
    }

    if (hotspotForm.type === 'scene_link' && !hotspotForm.target_scene_id) {
      alert('リンク先のシーンを選択してください');
      return;
    }

    // Build data object based on type
    const data = { type: hotspotForm.type };
    if (hotspotForm.type === 'scene_link') {
      data.target_scene_id = hotspotForm.target_scene_id;
      data.arrow_direction = hotspotForm.arrow_direction;
    } else if (hotspotForm.type === 'info') {
      data.title = hotspotForm.title;
      data.description = hotspotForm.description;
      data.image_url = hotspotForm.image_url;
      data.link_url = hotspotForm.link_url;
      data.link_text = hotspotForm.link_text;
    }

    let newHotspots;
    if (editingHotspot) {
      // 編集
      newHotspots = hotspots.map(h =>
        h.id === editingHotspot.id ? {
          id: h.id,
          text: hotspotForm.text,
          yaw: hotspotForm.yaw,
          pitch: hotspotForm.pitch,
          data
        } : h
      );
    } else {
      // 新規追加
      const newHotspot = {
        id: Date.now().toString(),
        text: hotspotForm.text,
        yaw: hotspotForm.yaw,
        pitch: hotspotForm.pitch,
        data
      };
      newHotspots = [...hotspots, newHotspot];
    }

    onHotspotsChange && onHotspotsChange(newHotspots);
    setEditDialogOpen(false);
  };

  const getHotspotTypeLabel = (type) => {
    switch (type) {
      case 'scene_link':
        return 'シーンリンク';
      case 'info':
        return '情報';
      default:
        return type;
    }
  };

  const getTargetSceneName = (hotspot) => {
    if (!hotspot.data?.target_scene_id) return '';
    const scene = scenes.find(s => s.id === parseInt(hotspot.data.target_scene_id));
    return scene ? scene.title : '不明';
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{
        px: 2,
        py: 1.5,
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center'
      }}>
        <Typography variant="subtitle1" sx={{ flexGrow: 1, fontWeight: 600 }}>
          ホットスポット
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddHotspot}
        >
          追加
        </Button>
      </Box>
      <Alert severity="info" sx={{ mx: 2, mt: 2, py: 0.5 }}>
        <Typography variant="caption">
          変更は自動的に保存されます
        </Typography>
      </Alert>

      <List sx={{ flex: 1, overflow: 'auto' }}>
        {hotspots.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              ホットスポットがありません
            </Typography>
            <Typography variant="caption" color="text.secondary">
              画面をクリックして追加してください
            </Typography>
          </Box>
        ) : (
          hotspots.map((hotspot) => (
            <ListItem
              key={hotspot.id}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">{hotspot.text}</Typography>
                    <Chip
                      size="small"
                      label={getHotspotTypeLabel(hotspot.data?.type || 'scene_link')}
                      color={hotspot.data?.type === 'scene_link' ? 'primary' : 'default'}
                      icon={hotspot.data?.type === 'scene_link' ? <LinkIcon /> : <InfoIcon />}
                    />
                  </Box>
                }
                secondary={
                  <>
                    {hotspot.data?.type === 'scene_link' && (
                      <Typography variant="caption" component="span" display="block">
                        → {getTargetSceneName(hotspot)}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" component="span" display="block">
                      位置: yaw={hotspot.yaw?.toFixed(2)}, pitch={hotspot.pitch?.toFixed(2)}
                    </Typography>
                  </>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  size="small"
                  onClick={() => handleEditHotspot(hotspot)}
                  sx={{ mr: 1 }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  size="small"
                  onClick={() => handleDeleteHotspot(hotspot.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))
        )}
      </List>

      {/* ホットスポット編集ダイアログ */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingHotspot ? 'ホットスポットを編集' : 'ホットスポットを追加'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>タイプ</InputLabel>
              <Select
                value={hotspotForm.type}
                onChange={(e) => setHotspotForm({ ...hotspotForm, type: e.target.value })}
                label="タイプ"
              >
                <MenuItem value="scene_link">シーンリンク</MenuItem>
                <MenuItem value="info">情報</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="テキスト"
              value={hotspotForm.text}
              onChange={(e) => setHotspotForm({ ...hotspotForm, text: e.target.value })}
              required
            />

            {hotspotForm.type === 'scene_link' && (
              <>
                <FormControl fullWidth required>
                  <InputLabel>リンク先シーン</InputLabel>
                  <Select
                    value={hotspotForm.target_scene_id}
                    onChange={(e) => setHotspotForm({ ...hotspotForm, target_scene_id: e.target.value })}
                    label="リンク先シーン"
                  >
                    {scenes
                      .filter(s => s.id !== currentSceneId)
                      .map((scene) => (
                        <MenuItem key={scene.id} value={String(scene.id)}>
                          {scene.title}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>矢印の向き</InputLabel>
                  <Select
                    value={hotspotForm.arrow_direction}
                    onChange={(e) => setHotspotForm({ ...hotspotForm, arrow_direction: e.target.value })}
                    label="矢印の向き"
                  >
                    {ARROW_DIRECTIONS.map((dir) => (
                      <MenuItem key={dir.value} value={dir.value}>
                        {dir.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}

            {hotspotForm.type === 'info' && (
              <>
                <TextField
                  fullWidth
                  label="タイトル（オプション）"
                  value={hotspotForm.title}
                  onChange={(e) => setHotspotForm({ ...hotspotForm, title: e.target.value })}
                  helperText="空の場合はテキストがタイトルとして使用されます"
                />

                <TextField
                  fullWidth
                  label="説明文"
                  value={hotspotForm.description}
                  onChange={(e) => setHotspotForm({ ...hotspotForm, description: e.target.value })}
                  multiline
                  rows={3}
                />

                <TextField
                  fullWidth
                  label="画像URL（オプション）"
                  value={hotspotForm.image_url}
                  onChange={(e) => setHotspotForm({ ...hotspotForm, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />

                <TextField
                  fullWidth
                  label="リンクURL（オプション）"
                  value={hotspotForm.link_url}
                  onChange={(e) => setHotspotForm({ ...hotspotForm, link_url: e.target.value })}
                  placeholder="https://example.com"
                />

                {hotspotForm.link_url && (
                  <TextField
                    fullWidth
                    label="リンクテキスト"
                    value={hotspotForm.link_text}
                    onChange={(e) => setHotspotForm({ ...hotspotForm, link_text: e.target.value })}
                    placeholder="詳細を見る"
                  />
                )}
              </>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                type="number"
                label="Yaw (左右)"
                value={hotspotForm.yaw}
                onChange={(e) => setHotspotForm({ ...hotspotForm, yaw: parseFloat(e.target.value) })}
                inputProps={{ step: 0.1 }}
              />
              <TextField
                fullWidth
                type="number"
                label="Pitch (上下)"
                value={hotspotForm.pitch}
                onChange={(e) => setHotspotForm({ ...hotspotForm, pitch: parseFloat(e.target.value) })}
                inputProps={{ step: 0.1 }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleSaveHotspot}
            variant="contained"
            disabled={!hotspotForm.text || (hotspotForm.type === 'scene_link' && !hotspotForm.target_scene_id)}
          >
            {editingHotspot ? '更新' : '追加'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
