import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Box, Alert, Snackbar,
  CircularProgress, Chip, IconButton, Menu, MenuItem,
  Card, CardContent, Grid
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon,
  MoreVert as MoreVertIcon, Business as BusinessIcon,
  People as PeopleIcon, Home as HomeIcon, Block as BlockIcon,
  PlayArrow as PlayArrowIcon, Login as LoginIcon
} from '@mui/icons-material';
import { superAdminTenantsApi } from '../../services/tenantApi';
import { useTenant } from '../../contexts/TenantContext';

export default function TenantManagement() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const { impersonate } = useTenant();

  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    plan: 'basic',
    max_users: 10,
    max_buildings: 100,
  });

  useEffect(() => {
    fetchTenants();
    fetchDashboard();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const { data } = await superAdminTenantsApi.list();
      setTenants(data);
    } catch (error) {
      showSnackbar('テナント一覧の取得に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      const { data } = await superAdminTenantsApi.dashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subdomain: '',
      plan: 'basic',
      max_users: 10,
      max_buildings: 100,
    });
  };

  const handleOpenDialog = (tenant = null) => {
    if (tenant) {
      setEditingTenant(tenant);
      setFormData({
        name: tenant.name,
        subdomain: tenant.subdomain,
        plan: tenant.plan || 'basic',
        max_users: tenant.max_users || 10,
        max_buildings: tenant.max_buildings || 100,
      });
    } else {
      setEditingTenant(null);
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTenant(null);
    resetForm();
  };

  const handleSubmit = async () => {
    try {
      if (editingTenant) {
        await superAdminTenantsApi.update(editingTenant.id, formData);
        showSnackbar('テナントを更新しました');
      } else {
        await superAdminTenantsApi.create(formData);
        showSnackbar('テナントを作成しました');
      }
      handleCloseDialog();
      fetchTenants();
      fetchDashboard();
    } catch (error) {
      showSnackbar(error.response?.data?.errors?.join(', ') || 'エラーが発生しました', 'error');
    }
  };

  const handleSuspend = async (tenant) => {
    if (!confirm(`${tenant.name} を停止しますか？`)) return;
    try {
      await superAdminTenantsApi.suspend(tenant.id, '管理者による停止');
      showSnackbar('テナントを停止しました');
      fetchTenants();
      setMenuAnchor(null);
    } catch (error) {
      showSnackbar('停止に失敗しました', 'error');
    }
  };

  const handleReactivate = async (tenant) => {
    try {
      await superAdminTenantsApi.reactivate(tenant.id);
      showSnackbar('テナントを再有効化しました');
      fetchTenants();
      setMenuAnchor(null);
    } catch (error) {
      showSnackbar('再有効化に失敗しました', 'error');
    }
  };

  const handleImpersonate = async (tenant) => {
    const result = await impersonate(tenant.id);
    if (result.success) {
      showSnackbar(`${tenant.name} としてログインしました`);
      window.location.href = '/home';
    } else {
      showSnackbar(result.error || '代理ログインに失敗しました', 'error');
    }
    setMenuAnchor(null);
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      active: { label: '有効', color: 'success' },
      suspended: { label: '停止中', color: 'error' },
      deleted: { label: '削除済み', color: 'default' },
    };
    const config = statusConfig[status] || statusConfig.active;
    return <Chip label={config.label} color={config.color} size="small" />;
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
      {/* ダッシュボードカード */}
      {dashboard && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <BusinessIcon color="primary" />
                  <Typography color="textSecondary" variant="body2">総テナント数</Typography>
                </Box>
                <Typography variant="h4" sx={{ mt: 1 }}>{dashboard.total_tenants}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <PlayArrowIcon color="success" />
                  <Typography color="textSecondary" variant="body2">有効テナント</Typography>
                </Box>
                <Typography variant="h4" sx={{ mt: 1 }}>{dashboard.active_tenants}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <PeopleIcon color="info" />
                  <Typography color="textSecondary" variant="body2">総ユーザー数</Typography>
                </Box>
                <Typography variant="h4" sx={{ mt: 1 }}>{dashboard.total_users}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <HomeIcon color="secondary" />
                  <Typography color="textSecondary" variant="body2">総物件数</Typography>
                </Box>
                <Typography variant="h4" sx={{ mt: 1 }}>{dashboard.total_buildings}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon fontSize="large" color="primary" />
          <Typography variant="h4">テナント管理</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          新規テナント
        </Button>
      </Box>

      {/* テナント一覧テーブル */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>テナント名</TableCell>
              <TableCell>サブドメイン</TableCell>
              <TableCell align="center">ステータス</TableCell>
              <TableCell align="center">プラン</TableCell>
              <TableCell align="center">ユーザー数</TableCell>
              <TableCell align="center">物件数</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell>{tenant.name}</TableCell>
                <TableCell>
                  <code>{tenant.subdomain}.lvh.me</code>
                </TableCell>
                <TableCell align="center">{getStatusChip(tenant.status)}</TableCell>
                <TableCell align="center">{tenant.plan || 'basic'}</TableCell>
                <TableCell align="center">{tenant.statistics?.users_count || 0}</TableCell>
                <TableCell align="center">{tenant.statistics?.buildings_count || 0}</TableCell>
                <TableCell align="center">
                  <IconButton
                    onClick={(e) => {
                      setMenuAnchor(e.currentTarget);
                      setSelectedTenant(tenant);
                    }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* アクションメニュー */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => { handleImpersonate(selectedTenant); }}>
          <LoginIcon sx={{ mr: 1 }} /> 代理ログイン
        </MenuItem>
        <MenuItem onClick={() => { handleOpenDialog(selectedTenant); setMenuAnchor(null); }}>
          <EditIcon sx={{ mr: 1 }} /> 編集
        </MenuItem>
        {selectedTenant?.status === 'active' ? (
          <MenuItem onClick={() => handleSuspend(selectedTenant)}>
            <BlockIcon sx={{ mr: 1 }} /> 停止
          </MenuItem>
        ) : selectedTenant?.status === 'suspended' ? (
          <MenuItem onClick={() => handleReactivate(selectedTenant)}>
            <PlayArrowIcon sx={{ mr: 1 }} /> 再有効化
          </MenuItem>
        ) : null}
      </Menu>

      {/* 作成/編集ダイアログ */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTenant ? 'テナント編集' : '新規テナント作成'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="テナント名"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="サブドメイン"
              value={formData.subdomain}
              onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })}
              required
              fullWidth
              helperText="英小文字、数字、ハイフンのみ使用可能"
              disabled={!!editingTenant}
            />
            <TextField
              label="最大ユーザー数"
              type="number"
              value={formData.max_users}
              onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) || 10 })}
              fullWidth
            />
            <TextField
              label="最大物件数"
              type="number"
              value={formData.max_buildings}
              onChange={(e) => setFormData({ ...formData, max_buildings: parseInt(e.target.value) || 100 })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingTenant ? '更新' : '作成'}
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
