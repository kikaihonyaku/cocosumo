import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon
} from '@mui/material';
import {
  Add as AddIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon,
  Block as BlockIcon,
  Schedule as ScheduleIcon,
  Visibility as VisibilityIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  QrCode as QrCodeIcon
} from '@mui/icons-material';
import axios from 'axios';
import CustomerAccessDialog from './CustomerAccessDialog';
import CustomerAccessDetailDialog from './CustomerAccessDetailDialog';

export default function CustomerAccessPanel({ publicationId, onAccessCreated }) {
  const [accesses, setAccesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedAccess, setSelectedAccess] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuAccess, setMenuAccess] = useState(null);

  const loadAccesses = useCallback(async () => {
    if (!publicationId) return;

    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/property_publications/${publicationId}/customer_accesses`);
      setAccesses(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load customer accesses:', err);
      setError('顧客アクセス一覧の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [publicationId]);

  useEffect(() => {
    loadAccesses();
  }, [loadAccesses]);

  const handleMenuOpen = (event, access) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setMenuAccess(access);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuAccess(null);
  };

  const handleCopyUrl = async (access) => {
    try {
      await navigator.clipboard.writeText(access.public_url);
      alert('URLをコピーしました');
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
    handleMenuClose();
  };

  const handleRevoke = async (access) => {
    if (!confirm(`${access.customer_name}様のアクセス権を取り消しますか？`)) {
      handleMenuClose();
      return;
    }

    try {
      await axios.post(`/api/v1/customer_accesses/${access.id}/revoke`);
      loadAccesses();
    } catch (err) {
      console.error('Failed to revoke access:', err);
      alert('アクセス権の取り消しに失敗しました');
    }
    handleMenuClose();
  };

  const handleExtendExpiry = async (access) => {
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 14);

    try {
      await axios.post(`/api/v1/customer_accesses/${access.id}/extend_expiry`, {
        expires_at: newExpiry.toISOString()
      });
      loadAccesses();
      alert('有効期限を延長しました');
    } catch (err) {
      console.error('Failed to extend expiry:', err);
      alert('有効期限の延長に失敗しました');
    }
    handleMenuClose();
  };

  const handleDelete = async (access) => {
    if (!confirm(`${access.customer_name}様のアクセス権を完全に削除しますか？この操作は取り消せません。`)) {
      handleMenuClose();
      return;
    }

    try {
      await axios.delete(`/api/v1/customer_accesses/${access.id}`);
      loadAccesses();
    } catch (err) {
      console.error('Failed to delete access:', err);
      alert('アクセス権の削除に失敗しました');
    }
    handleMenuClose();
  };

  const handleViewDetails = (access) => {
    setSelectedAccess(access);
    setDetailDialogOpen(true);
    handleMenuClose();
  };

  const handleAccessCreated = () => {
    loadAccesses();
    setDialogOpen(false);
    onAccessCreated?.();
  };

  const getStatusChip = (access) => {
    if (access.status === 'revoked') {
      return <Chip label="取消済み" size="small" color="error" />;
    }
    if (access.status === 'expired' || !access['accessible?']) {
      return <Chip label="期限切れ" size="small" color="warning" />;
    }
    return <Chip label="有効" size="small" color="success" />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          顧客アクセス管理
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
          disabled={!publicationId}
        >
          発行
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {accesses.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
          <PersonIcon sx={{ fontSize: 48, opacity: 0.5, mb: 1 }} />
          <Typography variant="body2">
            まだ顧客アクセスがありません
          </Typography>
          <Typography variant="caption" color="text.secondary">
            「発行」ボタンから顧客にアクセス権を付与できます
          </Typography>
        </Box>
      ) : (
        <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
          {accesses.map((access, index) => (
            <React.Fragment key={access.id}>
              {index > 0 && <Divider />}
              <ListItem
                sx={{
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                  opacity: access['accessible?'] ? 1 : 0.6
                }}
                onClick={() => handleViewDetails(access)}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {access.customer_name}
                      </Typography>
                      {getStatusChip(access)}
                    </Box>
                  }
                  secondary={
                    <Box component="span" sx={{ display: 'block' }}>
                      <Typography variant="caption" color="text.secondary" component="span">
                        {access.customer_email}
                      </Typography>
                      <br />
                      <Typography variant="caption" color="text.secondary" component="span">
                        閲覧: {access.view_count}回
                        {access.days_until_expiry !== null && (
                          <> | 残り{access.days_until_expiry}日</>
                        )}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, access)}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}

      {/* アクションメニュー */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleViewDetails(menuAccess)}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          詳細を見る
        </MenuItem>
        <MenuItem onClick={() => handleCopyUrl(menuAccess)}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          URLをコピー
        </MenuItem>
        {menuAccess?.['accessible?'] && (
          <MenuItem onClick={() => handleRevoke(menuAccess)}>
            <ListItemIcon>
              <BlockIcon fontSize="small" />
            </ListItemIcon>
            アクセス取消
          </MenuItem>
        )}
        {menuAccess && !menuAccess['accessible?'] && menuAccess.status !== 'revoked' && (
          <MenuItem onClick={() => handleExtendExpiry(menuAccess)}>
            <ListItemIcon>
              <ScheduleIcon fontSize="small" />
            </ListItemIcon>
            期限延長 (+14日)
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={() => handleDelete(menuAccess)} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          削除
        </MenuItem>
      </Menu>

      {/* 発行ダイアログ */}
      <CustomerAccessDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        publicationId={publicationId}
        onCreated={handleAccessCreated}
      />

      {/* 詳細ダイアログ */}
      <CustomerAccessDetailDialog
        open={detailDialogOpen}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedAccess(null);
        }}
        accessId={selectedAccess?.id}
        onUpdate={loadAccesses}
      />
    </Box>
  );
}
