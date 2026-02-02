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
  Box,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Store as StoreIcon,
  LocationOn as LocationOnIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

export default function StoreManagement() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    email: '',
    address: '',
    latitude: '',
    longitude: '',
  });
  const [geocoding, setGeocoding] = useState(false);
  const [codeChangeWarningOpen, setCodeChangeWarningOpen] = useState(false);

  // 店舗一覧を取得
  const fetchStores = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/stores', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setStores(data);
      } else if (response.status === 401) {
        window.location.href = '/login';
      } else {
        showSnackbar('店舗一覧の取得に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      showSnackbar('エラーが発生しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      email: '',
      address: '',
      latitude: '',
      longitude: '',
    });
  };

  // 住所からジオコーディング（バックエンドAPI経由）
  const handleGeocode = async () => {
    if (!formData.address.trim()) {
      showSnackbar('住所を入力してください', 'error');
      return;
    }

    try {
      setGeocoding(true);
      const response = await fetch('/api/v1/stores/geocode', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: formData.address }),
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          ...formData,
          latitude: data.latitude.toFixed(7),
          longitude: data.longitude.toFixed(7),
        });
        showSnackbar('座標を取得しました', 'success');
      } else {
        const error = await response.json();
        showSnackbar(error.error || '住所から座標を取得できませんでした', 'error');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      showSnackbar('住所から座標を取得できませんでした', 'error');
    } finally {
      setGeocoding(false);
    }
  };

  // 新規店舗作成
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      showSnackbar('店舗名を入力してください', 'error');
      return;
    }
    if (!formData.code.trim()) {
      showSnackbar('店舗コードを入力してください', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/v1/stores', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store: formData }),
      });

      if (response.ok) {
        showSnackbar('店舗を作成しました', 'success');
        setCreateDialogOpen(false);
        resetForm();
        fetchStores();
      } else {
        const error = await response.json();
        showSnackbar(error.errors?.join(', ') || '店舗の作成に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Error creating store:', error);
      showSnackbar('エラーが発生しました', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 編集ボタンクリック
  const handleEdit = (store) => {
    setSelectedStore(store);
    setFormData({
      name: store.name,
      code: store.code || '',
      email: store.email || '',
      address: store.address || '',
      latitude: store.latitude || '',
      longitude: store.longitude || '',
    });
    setEditDialogOpen(true);
  };

  // 店舗コード変更時の警告チェック
  const handleUpdateClick = () => {
    if (!formData.name.trim()) {
      showSnackbar('店舗名を入力してください', 'error');
      return;
    }
    if (!formData.code.trim()) {
      showSnackbar('店舗コードを入力してください', 'error');
      return;
    }
    // 店舗コードが変更された場合は警告ダイアログを表示
    if (selectedStore && formData.code !== selectedStore.code) {
      setCodeChangeWarningOpen(true);
      return;
    }
    handleUpdate();
  };

  // 店舗情報更新
  const handleUpdate = async () => {
    setCodeChangeWarningOpen(false);

    try {
      setSubmitting(true);
      const response = await fetch(`/api/v1/stores/${selectedStore.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store: formData }),
      });

      if (response.ok) {
        showSnackbar('店舗情報を更新しました', 'success');
        setEditDialogOpen(false);
        resetForm();
        setSelectedStore(null);
        fetchStores();
      } else {
        const error = await response.json();
        showSnackbar(error.errors?.join(', ') || '店舗の更新に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Error updating store:', error);
      showSnackbar('エラーが発生しました', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StoreIcon fontSize="large" color="primary" />
          <Typography variant="h4" component="h1">
            店舗管理
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          新規店舗作成
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
                <TableCell>店舗名</TableCell>
                <TableCell>店舗コード</TableCell>
                <TableCell>メールアドレス</TableCell>
                <TableCell>住所</TableCell>
                <TableCell align="center">座標</TableCell>
                <TableCell align="center">紐付き建物数</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                    店舗がありません。新規作成ボタンから店舗を作成してください。
                  </TableCell>
                </TableRow>
              ) : (
                stores.map((store) => (
                  <TableRow key={store.id} hover>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {store.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {store.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {store.email ? (
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {store.email}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="error">
                          未設定
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', display: 'block' }}>
                        問い合わせ受信: {store.inquiry_email_address}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {store.address || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {store.latitude && store.longitude ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                          <Typography variant="caption" color="text.secondary">
                            設定済み
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          未設定
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{store.buildings_count}件</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEdit(store)}
                        title="編集"
                      >
                        <EditIcon fontSize="small" />
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
        onClose={() => !submitting && setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>新規店舗作成</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="店舗名"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              autoFocus
            />
            <TextField
              label="店舗コード"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6) })}
              fullWidth
              required
              helperText="半角英数字、最大6文字（問い合わせメールアドレスに使用されます）"
              inputProps={{ maxLength: 6 }}
            />
            <TextField
              label="メールアドレス（送信元）"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
              type="email"
              helperText="顧客へのメール送信時に送信元として使用されます"
            />
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                label="住所"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                sx={{ flex: 1 }}
                multiline
                rows={2}
              />
              <Button
                variant="outlined"
                onClick={handleGeocode}
                disabled={geocoding || !formData.address.trim()}
                sx={{ mt: 1, minWidth: 120, whiteSpace: 'nowrap' }}
                startIcon={geocoding ? <CircularProgress size={16} /> : <LocationOnIcon />}
              >
                座標取得
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="緯度"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                fullWidth
                type="number"
                inputProps={{ step: '0.0000001' }}
                helperText="例: 35.6812362"
              />
              <TextField
                label="経度"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                fullWidth
                type="number"
                inputProps={{ step: '0.0000001' }}
                helperText="例: 139.7671248"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={submitting}>
            キャンセル
          </Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={submitting || !formData.name.trim() || !formData.code.trim()}
            startIcon={submitting && <CircularProgress size={20} />}
          >
            {submitting ? '作成中...' : '作成'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 編集ダイアログ */}
      <Dialog
        open={editDialogOpen}
        onClose={() => !submitting && setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>店舗情報の編集</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="店舗名"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              autoFocus
            />
            <TextField
              label="店舗コード"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6) })}
              fullWidth
              required
              helperText="半角英数字、最大6文字（変更するとメールアドレスが変わります）"
              inputProps={{ maxLength: 6 }}
            />
            <TextField
              label="メールアドレス（送信元）"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
              type="email"
              helperText="顧客へのメール送信時に送信元として使用されます"
            />
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                label="住所"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                sx={{ flex: 1 }}
                multiline
                rows={2}
              />
              <Button
                variant="outlined"
                onClick={handleGeocode}
                disabled={geocoding || !formData.address.trim()}
                sx={{ mt: 1, minWidth: 120, whiteSpace: 'nowrap' }}
                startIcon={geocoding ? <CircularProgress size={16} /> : <LocationOnIcon />}
              >
                座標取得
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="緯度"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                fullWidth
                type="number"
                inputProps={{ step: '0.0000001' }}
                helperText="例: 35.6812362"
              />
              <TextField
                label="経度"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                fullWidth
                type="number"
                inputProps={{ step: '0.0000001' }}
                helperText="例: 139.7671248"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={submitting}>
            キャンセル
          </Button>
          <Button
            onClick={handleUpdateClick}
            variant="contained"
            disabled={submitting || !formData.name.trim() || !formData.code.trim()}
            startIcon={submitting && <CircularProgress size={20} />}
          >
            {submitting ? '更新中...' : '更新'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 店舗コード変更警告ダイアログ */}
      <Dialog
        open={codeChangeWarningOpen}
        onClose={() => setCodeChangeWarningOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          店舗コード変更の確認
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            店舗コードを変更すると、問い合わせ受信用のメールアドレスが変更されます。
          </Typography>
          <Typography variant="body2" color="error">
            ポータルサイト等に設定済みのメールアドレスも更新する必要があります。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCodeChangeWarningOpen(false)}>
            キャンセル
          </Button>
          <Button onClick={handleUpdate} variant="contained" color="warning">
            変更する
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
