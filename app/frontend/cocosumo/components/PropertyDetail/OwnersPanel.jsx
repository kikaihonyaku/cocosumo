import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Email as EmailIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

export default function OwnersPanel({ propertyId, owners = [], onOwnersUpdate }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    is_primary: false,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleOpenDialog = (owner = null) => {
    if (owner) {
      setEditingOwner(owner);
      setFormData({
        name: owner.name || '',
        phone: owner.phone || '',
        email: owner.email || '',
        address: owner.address || '',
        notes: owner.notes || '',
        is_primary: owner.is_primary || false,
      });
    } else {
      setEditingOwner(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
        is_primary: owners.length === 0, // 最初の家主はデフォルトで主家主
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingOwner(null);
  };

  const handleSave = async () => {
    try {
      const url = editingOwner
        ? `/api/v1/buildings/${propertyId}/owners/${editingOwner.id}`
        : `/api/v1/buildings/${propertyId}/owners`;

      const method = editingOwner ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ owner: formData }),
      });

      if (!response.ok) {
        throw new Error('保存に失敗しました');
      }

      showSnackbar(editingOwner ? '家主情報を更新しました' : '家主を追加しました', 'success');
      handleCloseDialog();
      onOwnersUpdate && onOwnersUpdate();
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  };

  const handleDelete = async (ownerId) => {
    if (!window.confirm('この家主を削除してもよろしいですか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/buildings/${propertyId}/owners/${ownerId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('削除に失敗しました');
      }

      showSnackbar('家主を削除しました', 'success');
      onOwnersUpdate && onOwnersUpdate();
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <Box sx={{
        px: 2,
        py: 1.5,
        borderBottom: '1px solid #e0e0e0',
        bgcolor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 56
      }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 600, fontSize: '1.05rem' }}>
          <PersonIcon color="primary" sx={{ fontSize: 26 }} />
          家主情報 ({owners.length}名)
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          variant="contained"
          sx={{ minWidth: 100 }}
        >
          追加
        </Button>
      </Box>

      {/* コンテンツ */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {owners.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography color="text.secondary">
              家主情報が登録されていません
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              「追加」ボタンから家主情報を登録できます
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {owners.map((owner, index) => (
              <React.Fragment key={owner.id || index}>
                <ListItem sx={{ py: 2, px: 2, alignItems: 'flex-start' }}>
                  <ListItemText
                    disableTypography
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="600">
                          {owner.name}
                        </Typography>
                        {owner.is_primary && (
                          <Chip label="主家主" size="small" color="primary" variant="outlined" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {owner.address && (
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <HomeIcon fontSize="small" color="action" sx={{ mt: 0.5 }} />
                            <Typography variant="body2" color="text.secondary">
                              {owner.address}
                            </Typography>
                          </Box>
                        )}
                        {owner.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhoneIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {owner.phone}
                            </Typography>
                          </Box>
                        )}
                        {owner.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmailIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {owner.email}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => handleOpenDialog(owner)} color="primary">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(owner.id)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </ListItem>
                {index < owners.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      {/* 家主追加/編集ダイアログ */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingOwner ? '家主情報編集' : '家主追加'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="氏名"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="電話番号"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              fullWidth
            />
            <TextField
              label="メールアドレス"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
            />
            <TextField
              label="住所"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="備考"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.is_primary}
                  onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                />
              }
              label="主家主として設定"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button onClick={handleSave} variant="contained" disabled={!formData.name}>
            {editingOwner ? '更新' : '追加'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* スナックバー */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
