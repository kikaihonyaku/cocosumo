import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Box, Alert, Snackbar,
  CircularProgress, Chip, IconButton, Select, MenuItem, FormControl,
  InputLabel
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { adminUsersApi } from '../../services/tenantApi';
import { useAuth } from '../../contexts/AuthContext';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'member',
  });

  useEffect(() => {
    fetchUsers();
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

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'member',
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

  const roleLabel = (role) => {
    const labels = { member: 'メンバー', admin: '管理者', super_admin: 'スーパー管理者' };
    return labels[role] || role;
  };

  const roleColor = (role) => {
    const colors = { member: 'default', admin: 'primary', super_admin: 'secondary' };
    return colors[role] || 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>名前</TableCell>
              <TableCell>メールアドレス</TableCell>
              <TableCell align="center">権限</TableCell>
              <TableCell align="center">認証方法</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell align="center">
                  <Chip label={roleLabel(user.role)} color={roleColor(user.role)} size="small" />
                </TableCell>
                <TableCell align="center">
                  {user.auth_provider === 'google' ? 'Google' : 'パスワード'}
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(user)}
                    disabled={user.id === currentUser?.id}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(user)}
                    disabled={user.id === currentUser?.id || user.role === 'super_admin'}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
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
            <TextField
              label="名前"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="メールアドレス"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="パスワード"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingUser}
              fullWidth
              helperText={editingUser ? '変更しない場合は空欄のまま' : '6文字以上'}
            />
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
