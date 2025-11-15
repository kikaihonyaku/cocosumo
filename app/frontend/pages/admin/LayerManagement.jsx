import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Alert,
  Snackbar,
  CircularProgress,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CloudUpload as CloudUploadIcon,
  AddCircle as AddCircleIcon,
} from '@mui/icons-material';

// レイヤータイプの定義
const LAYER_TYPES = {
  school_districts: {
    label: '学区',
    description: '小学校区・中学校区の境界データ',
    supports_school_type: true,
  },
};

// 学校種別の定義
const SCHOOL_TYPES = {
  elementary: { label: '小学校', color: '#FF6B00' },
  junior_high: { label: '中学校', color: '#2196F3' },
};

export default function LayerManagement() {
  const [layers, setLayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dataManagementDialogOpen, setDataManagementDialogOpen] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [managementMode, setManagementMode] = useState('append'); // 'append' or 'replace'
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // 新規作成フォームの状態
  const [formData, setFormData] = useState({
    name: '',
    layer_key: '',
    description: '',
    layer_type: 'school_districts',
    school_type: 'elementary', // school_districts用
    color: '#FF6B00',
    opacity: 0.15,
    display_order: 0,
    is_active: true,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // レイヤー一覧を取得
  const fetchLayers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/admin/map_layers', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setLayers(data);
      } else if (response.status === 403) {
        showSnackbar('管理者権限が必要です', 'error');
      } else if (response.status === 401) {
        window.location.href = '/login';
      } else {
        showSnackbar('レイヤー一覧の取得に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Error fetching layers:', error);
      showSnackbar('エラーが発生しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLayers();
  }, []);

  // スナックバー表示
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // フォームリセット
  const resetForm = () => {
    setFormData({
      name: '',
      layer_key: '',
      description: '',
      layer_type: 'school_districts',
      school_type: 'elementary',
      color: '#FF6B00',
      opacity: 0.15,
      display_order: 0,
      is_active: true,
    });
    setSelectedFile(null);
  };

  // 新規レイヤー作成
  const handleCreate = async () => {
    if (!selectedFile) {
      showSnackbar('GeoJSONファイルを選択してください', 'error');
      return;
    }

    try {
      setUploading(true);
      const formDataObj = new FormData();
      formDataObj.append('file', selectedFile);
      formDataObj.append('name', formData.name);
      formDataObj.append('layer_key', formData.layer_key);
      formDataObj.append('description', formData.description);
      formDataObj.append('layer_type', formData.layer_type);
      formDataObj.append('color', formData.color);
      formDataObj.append('opacity', formData.opacity);
      formDataObj.append('display_order', formData.display_order);
      formDataObj.append('is_active', formData.is_active);

      const response = await fetch('/api/v1/admin/map_layers', {
        method: 'POST',
        credentials: 'include',
        body: formDataObj,
      });

      if (response.ok) {
        showSnackbar('レイヤーを作成しました', 'success');
        setCreateDialogOpen(false);
        resetForm();
        fetchLayers();
      } else {
        const error = await response.json();
        showSnackbar(error.error || 'レイヤーの作成に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Error creating layer:', error);
      showSnackbar('エラーが発生しました', 'error');
    } finally {
      setUploading(false);
    }
  };

  // ファイル選択
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // ファイル名から情報を推測
      const filename = file.name.toLowerCase();

      setSelectedFile(file);

      // layer_keyを自動生成（ファイル名から）
      if (!formData.layer_key) {
        const key = filename.replace(/\.geojson$|\.json$/i, '').replace(/[^a-z0-9-]/gi, '-');
        setFormData(prev => ({ ...prev, layer_key: key }));
      }
    }
  };

  // 学校種別が変更されたときに色を自動設定
  const handleSchoolTypeChange = (schoolType) => {
    const typeConfig = SCHOOL_TYPES[schoolType];
    setFormData(prev => ({
      ...prev,
      school_type: schoolType,
      color: typeConfig?.color || prev.color,
    }));
  };

  // 編集ボタンクリック
  const handleEdit = (layer) => {
    setSelectedLayer(layer);
    setFormData({
      name: layer.name,
      layer_key: layer.layer_key,
      description: layer.description || '',
      layer_type: layer.layer_type,
      color: layer.color,
      opacity: layer.opacity,
      display_order: layer.display_order,
      is_active: layer.is_active,
    });
    setEditDialogOpen(true);
  };

  // レイヤー情報更新
  const handleUpdate = async () => {
    try {
      setUploading(true);
      const response = await fetch(`/api/v1/admin/map_layers/${selectedLayer.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showSnackbar('レイヤー情報を更新しました', 'success');
        setEditDialogOpen(false);
        resetForm();
        setSelectedLayer(null);
        fetchLayers();
      } else {
        const error = await response.json();
        showSnackbar(error.error || 'レイヤーの更新に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Error updating layer:', error);
      showSnackbar('エラーが発生しました', 'error');
    } finally {
      setUploading(false);
    }
  };

  // 削除ボタンクリック
  const handleDelete = (layer) => {
    setSelectedLayer(layer);
    setDeleteDialogOpen(true);
  };

  // 削除確認
  const handleDeleteConfirm = async () => {
    try {
      setUploading(true);
      const response = await fetch(`/api/v1/admin/map_layers/${selectedLayer.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        showSnackbar('レイヤーを削除しました', 'success');
        setDeleteDialogOpen(false);
        setSelectedLayer(null);
        fetchLayers();
      } else {
        const error = await response.json();
        showSnackbar(error.error || 'レイヤーの削除に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Error deleting layer:', error);
      showSnackbar('エラーが発生しました', 'error');
    } finally {
      setUploading(false);
    }
  };

  // データ管理ボタンクリック
  const handleDataManagement = (layer, mode) => {
    setSelectedLayer(layer);
    setManagementMode(mode);
    setSelectedFile(null);
    setDataManagementDialogOpen(true);
  };

  // フィーチャー追加
  const handleAppendFeatures = async () => {
    if (!selectedFile) {
      showSnackbar('ファイルを選択してください', 'error');
      return;
    }

    try {
      setUploading(true);
      const formDataObj = new FormData();
      formDataObj.append('file', selectedFile);

      const response = await fetch(`/api/v1/admin/map_layers/${selectedLayer.id}/append_features`, {
        method: 'POST',
        credentials: 'include',
        body: formDataObj,
      });

      if (response.ok) {
        const result = await response.json();
        showSnackbar(result.message, 'success');
        setDataManagementDialogOpen(false);
        setSelectedFile(null);
        setSelectedLayer(null);
        fetchLayers();
      } else {
        const error = await response.json();
        showSnackbar(error.error || 'フィーチャーの追加に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Error appending features:', error);
      showSnackbar('エラーが発生しました', 'error');
    } finally {
      setUploading(false);
    }
  };

  // データ上書き
  const handleReplaceFeatures = async () => {
    if (!selectedFile) {
      showSnackbar('ファイルを選択してください', 'error');
      return;
    }

    try {
      setUploading(true);
      const formDataObj = new FormData();
      formDataObj.append('file', selectedFile);

      const response = await fetch(`/api/v1/admin/map_layers/${selectedLayer.id}/replace_features`, {
        method: 'POST',
        credentials: 'include',
        body: formDataObj,
      });

      if (response.ok) {
        const result = await response.json();
        showSnackbar(result.message, 'success');
        setDataManagementDialogOpen(false);
        setSelectedFile(null);
        setSelectedLayer(null);
        fetchLayers();
      } else {
        const error = await response.json();
        showSnackbar(error.error || 'データの上書きに失敗しました', 'error');
      }
    } catch (error) {
      console.error('Error replacing features:', error);
      showSnackbar('エラーが発生しました', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          レイヤー管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          新規レイヤー作成
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>レイヤー名</TableCell>
                <TableCell>タイプ</TableCell>
                <TableCell align="center">フィーチャー数</TableCell>
                <TableCell align="center">色</TableCell>
                <TableCell align="center">透明度</TableCell>
                <TableCell align="center">表示順</TableCell>
                <TableCell align="center">状態</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {layers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                    レイヤーがありません。新規作成ボタンからレイヤーを作成してください。
                  </TableCell>
                </TableRow>
              ) : (
                layers.map((layer) => (
                  <TableRow key={layer.id} hover>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {layer.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {layer.layer_key}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={LAYER_TYPES[layer.layer_type]?.label || layer.layer_type}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{layer.feature_count}件</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          backgroundColor: layer.color,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          mx: 'auto',
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{(layer.opacity * 100).toFixed(0)}%</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{layer.display_order}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      {layer.is_active ? (
                        <Chip label="有効" color="success" size="small" />
                      ) : (
                        <Chip label="無効" color="default" size="small" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEdit(layer)}
                        title="編集"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(layer)}
                        title="削除"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => handleDataManagement(layer, 'append')}
                        title="データ管理"
                      >
                        <AddCircleIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 新規作成ダイアログ */}
      <Dialog
        open={createDialogOpen}
        onClose={() => !uploading && setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>新規レイヤー作成</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {/* ファイルアップロード */}
            <Box sx={{ border: '2px dashed', borderColor: 'divider', borderRadius: 2, p: 3, textAlign: 'center' }}>
              <input
                accept=".geojson,.json"
                style={{ display: 'none' }}
                id="file-upload"
                type="file"
                onChange={handleFileSelect}
              />
              <label htmlFor="file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  size="large"
                >
                  GeoJSONファイルを選択
                </Button>
              </label>
              {selectedFile && (
                <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                  選択: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </Typography>
              )}
            </Box>

            <TextField
              label="レイヤー名"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              helperText="表示用の名前（例：埼玉県小学校区）"
            />

            <TextField
              label="レイヤーキー"
              value={formData.layer_key}
              onChange={(e) => setFormData({ ...formData, layer_key: e.target.value })}
              fullWidth
              required
              helperText="システム識別子（例：elementary-school-district）"
            />

            <TextField
              label="説明"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />

            <FormControl fullWidth>
              <InputLabel>レイヤータイプ</InputLabel>
              <Select
                value={formData.layer_type}
                label="レイヤータイプ"
                onChange={(e) => setFormData({ ...formData, layer_type: e.target.value })}
              >
                {Object.entries(LAYER_TYPES).map(([key, config]) => (
                  <MenuItem key={key} value={key}>
                    {config.label} - {config.description}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 学区専用：学校種別選択 */}
            {formData.layer_type === 'school_districts' && (
              <FormControl fullWidth>
                <InputLabel>学校種別</InputLabel>
                <Select
                  value={formData.school_type}
                  label="学校種別"
                  onChange={(e) => handleSchoolTypeChange(e.target.value)}
                >
                  {Object.entries(SCHOOL_TYPES).map(([key, config]) => (
                    <MenuItem key={key} value={key}>
                      {config.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Box>
              <Typography gutterBottom>表示色</Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  style={{ width: 60, height: 40, border: 'none', borderRadius: 4 }}
                />
                <TextField
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  size="small"
                  sx={{ flex: 1 }}
                />
              </Box>
            </Box>

            <Box>
              <Typography gutterBottom>透明度: {(formData.opacity * 100).toFixed(0)}%</Typography>
              <Slider
                value={formData.opacity}
                onChange={(e, value) => setFormData({ ...formData, opacity: value })}
                min={0}
                max={1}
                step={0.05}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
              />
            </Box>

            <TextField
              label="表示順序"
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              fullWidth
              helperText="小さい数字ほど先に表示されます"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              }
              label="有効化"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={uploading}>
            キャンセル
          </Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={uploading || !selectedFile || !formData.name || !formData.layer_key}
            startIcon={uploading && <CircularProgress size={20} />}
          >
            {uploading ? 'アップロード中...' : '作成'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 編集ダイアログ */}
      <Dialog
        open={editDialogOpen}
        onClose={() => !uploading && setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>レイヤー情報の編集</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="レイヤー名"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              helperText="表示用の名前（例：埼玉県小学校区）"
            />

            <TextField
              label="レイヤーキー"
              value={formData.layer_key}
              onChange={(e) => setFormData({ ...formData, layer_key: e.target.value })}
              fullWidth
              required
              disabled
              helperText="レイヤーキーは変更できません"
            />

            <TextField
              label="説明"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />

            <FormControl fullWidth disabled>
              <InputLabel>レイヤータイプ</InputLabel>
              <Select
                value={formData.layer_type}
                label="レイヤータイプ"
              >
                {Object.entries(LAYER_TYPES).map(([key, config]) => (
                  <MenuItem key={key} value={key}>
                    {config.label} - {config.description}
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.5 }}>
                レイヤータイプは変更できません
              </Typography>
            </FormControl>

            <Box>
              <Typography gutterBottom>表示色</Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  style={{ width: 60, height: 40, border: 'none', borderRadius: 4 }}
                />
                <TextField
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  size="small"
                  sx={{ flex: 1 }}
                />
              </Box>
            </Box>

            <Box>
              <Typography gutterBottom>透明度: {(formData.opacity * 100).toFixed(0)}%</Typography>
              <Slider
                value={formData.opacity}
                onChange={(e, value) => setFormData({ ...formData, opacity: value })}
                min={0}
                max={1}
                step={0.05}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
              />
            </Box>

            <TextField
              label="表示順序"
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              fullWidth
              helperText="小さい数字ほど先に表示されます"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              }
              label="有効化"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={uploading}>
            キャンセル
          </Button>
          <Button
            onClick={handleUpdate}
            variant="contained"
            disabled={uploading || !formData.name || !formData.layer_key}
            startIcon={uploading && <CircularProgress size={20} />}
          >
            {uploading ? '更新中...' : '更新'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !uploading && setDeleteDialogOpen(false)}
        maxWidth="sm"
      >
        <DialogTitle>レイヤーの削除</DialogTitle>
        <DialogContent>
          {selectedLayer && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                このレイヤーを削除すると、関連する全てのデータも削除されます。この操作は元に戻せません。
              </Alert>
              <Typography variant="body1" gutterBottom>
                以下のレイヤーを削除してもよろしいですか？
              </Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>レイヤー名:</strong> {selectedLayer.name}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>レイヤーキー:</strong> {selectedLayer.layer_key}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>フィーチャー数:</strong> {selectedLayer.feature_count}件
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={uploading}>
            キャンセル
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={uploading}
            startIcon={uploading && <CircularProgress size={20} />}
          >
            {uploading ? '削除中...' : '削除'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* データ管理ダイアログ */}
      <Dialog
        open={dataManagementDialogOpen}
        onClose={() => !uploading && setDataManagementDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>データ管理</DialogTitle>
        <DialogContent>
          {selectedLayer && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>レイヤー名:</strong> {selectedLayer.name}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>現在のフィーチャー数:</strong> {selectedLayer.feature_count}件
                </Typography>
              </Box>

              <FormControl fullWidth>
                <InputLabel>操作モード</InputLabel>
                <Select
                  value={managementMode}
                  label="操作モード"
                  onChange={(e) => setManagementMode(e.target.value)}
                >
                  <MenuItem value="append">
                    追記 - 既存データに新しいフィーチャーを追加
                  </MenuItem>
                  <MenuItem value="replace">
                    上書き - 既存データを削除して新しいデータに置き換え
                  </MenuItem>
                </Select>
              </FormControl>

              {managementMode === 'replace' && (
                <Alert severity="warning">
                  上書きモードでは、既存の全データが削除されます。この操作は元に戻せません。
                </Alert>
              )}

              <Box sx={{ border: '2px dashed', borderColor: 'divider', borderRadius: 2, p: 3, textAlign: 'center' }}>
                <input
                  accept=".geojson,.json"
                  style={{ display: 'none' }}
                  id="data-file-upload"
                  type="file"
                  onChange={handleFileSelect}
                />
                <label htmlFor="data-file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    size="large"
                  >
                    GeoJSONファイルを選択
                  </Button>
                </label>
                {selectedFile && (
                  <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                    選択: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDataManagementDialogOpen(false)} disabled={uploading}>
            キャンセル
          </Button>
          <Button
            onClick={managementMode === 'append' ? handleAppendFeatures : handleReplaceFeatures}
            variant="contained"
            color={managementMode === 'replace' ? 'error' : 'primary'}
            disabled={uploading || !selectedFile}
            startIcon={uploading && <CircularProgress size={20} />}
          >
            {uploading
              ? '処理中...'
              : managementMode === 'append'
              ? 'フィーチャーを追加'
              : 'データを上書き'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* スナックバー */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
