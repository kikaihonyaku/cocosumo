import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Box, Alert, Snackbar,
  CircularProgress, Chip, IconButton, Select, MenuItem, FormControl,
  InputLabel, Switch, FormControlLabel, Tooltip
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  People as PeopleIcon, LockOpen as LockOpenIcon, Lock as LockIcon,
  CheckCircle as CheckCircleIcon, Cancel as CancelIcon
} from '@mui/icons-material';
import { adminUsersApi, storesApi } from '../../services/tenantApi';
import { useAuth } from '../../contexts/AuthContext';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'member',
    phone: '',
    position: '',
    employee_code: '',
    active: true,
    store_id: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchStores();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await adminUsersApi.list();
      setUsers(data);
    } catch (error) {
      showSnackbar('ユーザー一覧の取得に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const { data } = await storesApi.list();
      setStores(data);
    } catch (error) {
      console.error('店舗一覧の取得に失敗:', error);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'member',
      phone: '',
      position: '',
      employee_code: '',
      active: true,
      store_id: '',
    });
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        phone: user.phone || '',
        position: user.position || '',
        employee_code: user.employee_code || '',
        active: user.active,
        store_id: user.store_id || '',
      });
    } else {
      setEditingUser(null);
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    resetForm();
  };

  const handleSubmit = async () => {
    try {
      const submitData = { ...formData };
      if (editingUser && !submitData.password) {
        delete submitData.password;
      }
      if (!submitData.store_id) {
        submitData.store_id = null;
      }

      if (editingUser) {
        await adminUsersApi.update(editingUser.id, submitData);
        showSnackbar('ユーザーを更新しました');
      } else {
        await adminUsersApi.create(submitData);
        showSnackbar('ユーザーを作成しました');
      }
      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      showSnackbar(error.response?.data?.errors?.join(', ') || error.response?.data?.error || 'エラーが発生しました', 'error');
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`${user.name} を削除しますか？`)) return;
    try {
      await adminUsersApi.delete(user.id);
      showSnackbar('ユーザーを削除しました');
      fetchUsers();
    } catch (error) {
      showSnackbar(error.response?.data?.error || '削除に失敗しました', 'error');
    }
  };

  const handleUnlock = async (user) => {
    try {
      await adminUsersApi.unlock(user.id);
      showSnackbar('アカウントのロックを解除しました');
      fetchUsers();
    } catch (error) {
      showSnackbar('ロック解除に失敗しました', 'error');
    }
  };

  const roleLabel = (role) => {
    const labels = { member: 'メンバー', admin: '管理者', super_admin: 'スーパー管理者' };
    return labels[role] || role;
  };

  const roleColor = (role) => {
    const colors = { member: 'default', admin: 'primary', super_admin: 'secondary' };
    return colors[role] || 'default';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('ja-JP');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleIcon fontSize="large" color="primary" />
          <Typography variant="h4">ユーザー管理</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          新規ユーザー
        </Button>
      </Box>

      {/* ユーザー一覧テーブル */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>名前</TableCell>
              <TableCell>メールアドレス</TableCell>
              <TableCell>電話番号</TableCell>
              <TableCell>役職</TableCell>
              <TableCell>所属店舗</TableCell>
              <TableCell align="center">権限</TableCell>
              <TableCell align="center">状態</TableCell>
              <TableCell>最終ログイン</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {user.name}
                    {user.employee_code && (
                      <Typography variant="caption" color="text.secondary">
                        ({user.employee_code})
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone || '-'}</TableCell>
                <TableCell>{user.position || '-'}</TableCell>
                <TableCell>{user.store?.name || '-'}</TableCell>
                <TableCell align="center">
                  <Chip label={roleLabel(user.role)} color={roleColor(user.role)} size="small" />
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                    {user.active ? (
                      <Tooltip title="有効">
                        <CheckCircleIcon color="success" fontSize="small" />
                      </Tooltip>
                    ) : (
                      <Tooltip title="無効">
                        <CancelIcon color="error" fontSize="small" />
                      </Tooltip>
                    )}
                    {user.locked_at && (
                      <Tooltip title="ロック中">
                        <LockIcon color="warning" fontSize="small" />
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {formatDate(user.last_login_at)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                    <Tooltip title="編集">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(user)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {user.locked_at && (
                      <Tooltip title="ロック解除">
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => handleUnlock(user)}
                        >
                          <LockOpenIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="削除">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(user)}
                        disabled={user.id === currentUser?.id || user.role === 'super_admin'}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 作成/編集ダイアログ */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'ユーザー編集' : '新規ユーザー作成'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="名前"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="社員番号"
                value={formData.employee_code}
                onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                sx={{ width: '40%' }}
              />
            </Box>
            <TextField
              label="メールアドレス"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="電話番号"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                fullWidth
                placeholder="090-1234-5678"
              />
              <TextField
                label="役職"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                fullWidth
                placeholder="店長、営業など"
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>所属店舗</InputLabel>
                <Select
                  value={formData.store_id}
                  label="所属店舗"
                  onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                >
                  <MenuItem value="">未所属</MenuItem>
                  {stores.map((store) => (
                    <MenuItem key={store.id} value={store.id}>{store.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>権限</InputLabel>
                <Select
                  value={formData.role}
                  label="権限"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <MenuItem value="member">メンバー</MenuItem>
                  <MenuItem value="admin">管理者</MenuItem>
                  {currentUser?.role === 'super_admin' && (
                    <MenuItem value="super_admin">スーパー管理者</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Box>
            <TextField
              label="パスワード"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingUser}
              fullWidth
              helperText={editingUser ? '変更しない場合は空欄のまま' : '6文字以上'}
            />
            {editingUser && (
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                }
                label="アカウント有効"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingUser ? '更新' : '作成'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* スナックバー */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
