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
  Slideshow as SlideshowIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Block as BlockIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  OpenInNew as OpenInNewIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon
} from '@mui/icons-material';
import axios from 'axios';
import PresentationAccessDialog from './PresentationAccessDialog';

export default function PresentationAccessPanel({ publicationId, onAccessCreated }) {
  const [accesses, setAccesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuAccess, setMenuAccess] = useState(null);

  const loadAccesses = useCallback(async () => {
    if (!publicationId) return;

    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/property_publications/${publicationId}/presentation_accesses`);
      setAccesses(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load presentation accesses:', err);
      setError('プレゼンURL一覧の読み込みに失敗しました');
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
    const url = `${window.location.origin}${access.public_url}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('URLをコピーしました');
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
    handleMenuClose();
  };

  const handleOpenUrl = (access) => {
    const url = `${window.location.origin}${access.public_url}`;
    window.open(url, '_blank');
    handleMenuClose();
  };

  const handleRevoke = async (access) => {
    if (!confirm(`このプレゼンURL（${access.title || 'タイトルなし'}）を取り消しますか？`)) {
      handleMenuClose();
      return;
    }

    try {
      await axios.post(`/api/v1/presentation_accesses/${access.id}/revoke`);
      loadAccesses();
    } catch (err) {
      console.error('Failed to revoke access:', err);
      alert('プレゼンURLの取り消しに失敗しました');
    }
    handleMenuClose();
  };

  const handleDelete = async (access) => {
    if (!confirm(`このプレゼンURLを完全に削除しますか？この操作は取り消せません。`)) {
      handleMenuClose();
      return;
    }

    try {
      await axios.delete(`/api/v1/presentation_accesses/${access.id}`);
      loadAccesses();
    } catch (err) {
      console.error('Failed to delete access:', err);
      alert('プレゼンURLの削除に失敗しました');
    }
    handleMenuClose();
  };

  const handleCreated = () => {
    loadAccesses();
    onAccessCreated?.();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getStatusChip = (access) => {
    if (access.status === 'revoked') {
      return <Chip size="small" label="取消済" color="error" variant="outlined" />;
    }
    if (!access['accessible?']) {
      return <Chip size="small" label="期限切れ" color="warning" variant="outlined" />;
    }
    return <Chip size="small" label="有効" color="success" variant="outlined" />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SlideshowIcon color="primary" />
          プレゼンURL
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size="small"
          onClick={() => setDialogOpen(true)}
        >
          発行
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        営業説明用のプレゼンURLを発行できます。進行順が固定されたUIで、Zoom/対面/LINE共有で即使えます。
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {accesses.length === 0 ? (
        <Box sx={{ py: 3, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 1 }}>
          <SlideshowIcon sx={{ fontSize: 40, color: 'grey.400', mb: 1 }} />
          <Typography color="text.secondary">
            プレゼンURLはまだありません
          </Typography>
        </Box>
      ) : (
        <List dense>
          {accesses.map((access, index) => (
            <React.Fragment key={access.id}>
              {index > 0 && <Divider />}
              <ListItem>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {access.title || 'タイトルなし'}
                      </Typography>
                      {getStatusChip(access)}
                      {access['password_protected?'] && (
                        <Tooltip title="パスワード保護">
                          <LockIcon fontSize="small" color="action" />
                        </Tooltip>
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        有効期限: {access.days_until_expiry != null ? `${access.days_until_expiry}日後` : '無期限'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        閲覧: {access.view_count}回
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title="URLをコピー">
                    <IconButton
                      size="small"
                      onClick={() => handleCopyUrl(access)}
                      disabled={!access['accessible?']}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
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

      {/* メニュー */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleOpenUrl(menuAccess)}>
          <ListItemIcon><OpenInNewIcon fontSize="small" /></ListItemIcon>
          開く
        </MenuItem>
        <MenuItem onClick={() => handleCopyUrl(menuAccess)}>
          <ListItemIcon><CopyIcon fontSize="small" /></ListItemIcon>
          URLをコピー
        </MenuItem>
        <Divider />
        {menuAccess?.status === 'active' && (
          <MenuItem onClick={() => handleRevoke(menuAccess)}>
            <ListItemIcon><BlockIcon fontSize="small" color="warning" /></ListItemIcon>
            取り消し
          </MenuItem>
        )}
        <MenuItem onClick={() => handleDelete(menuAccess)} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          削除
        </MenuItem>
      </Menu>

      {/* 発行ダイアログ */}
      <PresentationAccessDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        publicationId={publicationId}
        onCreated={handleCreated}
      />
    </Box>
  );
}
