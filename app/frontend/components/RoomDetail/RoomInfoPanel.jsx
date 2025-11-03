import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

export default function RoomInfoPanel({ room, onSave, loading, isMobile = false, onFormChange }) {
  const [formData, setFormData] = useState({
    room_number: '',
    floor: '',
    area: '',
    room_type: '',
    status: '',
    rent: '',
    management_fee: '',
    deposit: '',
    key_money: '',
    description: '',
    ...room
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (room) {
      setFormData({
        ...room,
        room_number: room.room_number || '',
        floor: room.floor || '',
        area: room.area || '',
        room_type: room.room_type || '',
        status: room.status || '',
        description: room.description || '',
        // 金額フィールドは整数に変換
        rent: room.rent ? Math.round(parseFloat(room.rent)) : '',
        management_fee: room.management_fee ? Math.round(parseFloat(room.management_fee)) : '',
        deposit: room.deposit ? Math.round(parseFloat(room.deposit)) : '',
        key_money: room.key_money ? Math.round(parseFloat(room.key_money)) : '',
      });
    }
  }, [room]);

  const handleChange = (field) => (event) => {
    let value = event.target.value;

    // 金額フィールドは整数に変換
    const monetaryFields = ['rent', 'management_fee', 'deposit', 'key_money'];
    if (monetaryFields.includes(field) && value !== '') {
      value = Math.round(parseFloat(value)) || 0;
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
  };

  const handleSubmit = () => {
    onSave(formData);
    setHasUnsavedChanges(false);
  };

  // 未保存の変更を親コンポーネントに通知
  useEffect(() => {
    if (onFormChange) {
      onFormChange(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges, onFormChange]);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/v1/rooms/${room.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        window.location.href = `/property/${room.building_id}`;
      } else {
        alert(data.error || '削除に失敗しました');
        setDeleting(false);
        setDeleteDialogOpen(false);
      }
    } catch (err) {
      console.error('削除エラー:', err);
      alert('ネットワークエラーが発生しました');
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const roomTypes = [
    { id: 'studio', name: 'ワンルーム' },
    { id: 'one_bedroom', name: '1K' },
    { id: 'one_dk', name: '1DK' },
    { id: 'one_ldk', name: '1LDK' },
    { id: 'two_bedroom', name: '2K' },
    { id: 'two_dk', name: '2DK' },
    { id: 'two_ldk', name: '2LDK' },
    { id: 'three_bedroom', name: '3K' },
    { id: 'three_dk', name: '3DK' },
    { id: 'three_ldk', name: '3LDK' },
    { id: 'other', name: 'その他' },
  ];

  const statusOptions = [
    { id: 'vacant', name: '空室' },
    { id: 'occupied', name: '入居中' },
    { id: 'reserved', name: '予約済み' },
  ];

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
        minHeight: 56
      }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1, fontWeight: 600, fontSize: '1.05rem' }}>
          <HomeIcon color="primary" sx={{ fontSize: 26 }} />
          部屋情報
        </Typography>
      </Box>

      {/* コンテンツ */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Stack spacing={3}>

        {/* 基本情報 */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.5, fontSize: '0.875rem' }}>
            基本情報
          </Typography>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="部屋番号"
                value={formData.room_number || ''}
                onChange={handleChange('room_number')}
                variant="outlined"
                size="small"
                sx={{ flex: 1 }}
              />

              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>状態</InputLabel>
                <Select
                  value={formData.status || ''}
                  label="状態"
                  onChange={handleChange('status')}
                  variant="outlined"
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="階数"
                type="number"
                value={formData.floor || ''}
                onChange={handleChange('floor')}
                variant="outlined"
                size="small"
                sx={{ flex: 1 }}
                InputProps={{
                  endAdornment: <Typography variant="body2" color="text.secondary">階</Typography>
                }}
              />

              <TextField
                label="面積"
                type="number"
                value={formData.area || ''}
                onChange={handleChange('area')}
                variant="outlined"
                size="small"
                sx={{ flex: 1 }}
                InputProps={{
                  endAdornment: <Typography variant="body2" color="text.secondary">㎡</Typography>
                }}
              />
            </Box>

            <FormControl fullWidth size="small">
              <InputLabel>間取り</InputLabel>
              <Select
                value={formData.room_type || ''}
                label="間取り"
                onChange={handleChange('room_type')}
                variant="outlined"
              >
                {roomTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="説明・備考"
              multiline
              rows={2}
              value={formData.description || ''}
              onChange={handleChange('description')}
              variant="outlined"
              size="small"
            />
          </Stack>
        </Box>

        {/* 賃貸情報 */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.5, fontSize: '0.875rem' }}>
            賃貸情報
          </Typography>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="賃料"
                type="number"
                value={formData.rent || ''}
                onChange={handleChange('rent')}
                variant="outlined"
                size="small"
                sx={{ flex: 1 }}
                inputProps={{ step: 1 }}
                InputProps={{
                  endAdornment: <Typography variant="body2" color="text.secondary">円</Typography>
                }}
              />

              <TextField
                label="管理費"
                type="number"
                value={formData.management_fee || ''}
                onChange={handleChange('management_fee')}
                variant="outlined"
                size="small"
                sx={{ flex: 1 }}
                inputProps={{ step: 1 }}
                InputProps={{
                  endAdornment: <Typography variant="body2" color="text.secondary">円</Typography>
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="敷金"
                type="number"
                value={formData.deposit || ''}
                onChange={handleChange('deposit')}
                variant="outlined"
                size="small"
                sx={{ flex: 1 }}
                inputProps={{ step: 1 }}
                InputProps={{
                  endAdornment: <Typography variant="body2" color="text.secondary">円</Typography>
                }}
              />

              <TextField
                label="礼金"
                type="number"
                value={formData.key_money || ''}
                onChange={handleChange('key_money')}
                variant="outlined"
                size="small"
                sx={{ flex: 1 }}
                inputProps={{ step: 1 }}
                InputProps={{
                  endAdornment: <Typography variant="body2" color="text.secondary">円</Typography>
                }}
              />
            </Box>
          </Stack>
        </Box>

        {/* 最終更新日 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pt: 1 }}>
          <CalendarIcon color="action" fontSize="small" />
          <Typography variant="body2" color="text.secondary">
            最終更新: {room?.updated_at ? new Date(room.updated_at).toLocaleDateString('ja-JP') : '不明'}
          </Typography>
        </Box>

        {/* 設備情報 */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.5, fontSize: '0.875rem' }}>
            設備情報
          </Typography>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="設備・特記事項"
              multiline
              rows={3}
              value={formData.facilities || ''}
              onChange={handleChange('facilities')}
              variant="outlined"
              size="small"
              placeholder="例: エアコン、バストイレ別、フローリングなど"
            />
          </Stack>
        </Box>

        {/* 入居者情報 */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.5, fontSize: '0.875rem' }}>
            入居者情報
          </Typography>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="入居者名"
              value={formData.tenant_name || ''}
              onChange={handleChange('tenant_name')}
              variant="outlined"
              size="small"
            />
            <TextField
              fullWidth
              label="入居者電話番号"
              value={formData.tenant_phone || ''}
              onChange={handleChange('tenant_phone')}
              variant="outlined"
              size="small"
              placeholder="03-1234-5678"
            />
            <TextField
              fullWidth
              label="契約開始日"
              type="date"
              value={formData.contract_start_date || ''}
              onChange={handleChange('contract_start_date')}
              variant="outlined"
              size="small"
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              fullWidth
              label="契約終了日"
              type="date"
              value={formData.contract_end_date || ''}
              onChange={handleChange('contract_end_date')}
              variant="outlined"
              size="small"
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Stack>
        </Box>

        {/* その他メモ */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.5, fontSize: '0.875rem' }}>
            その他メモ
          </Typography>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="メモ"
              multiline
              rows={4}
              value={formData.notes || ''}
              onChange={handleChange('notes')}
              variant="outlined"
              size="small"
              placeholder="管理上の注意事項、修繕履歴など"
            />
          </Stack>
        </Box>

        </Stack>
      </Box>

      {/* 保存ボタンと削除ボタン */}
      <Box sx={{ p: 2, borderTop: '1px solid #ddd', bgcolor: 'grey.50' }}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={{ mb: 1 }}
        >
          {loading ? '保存中...' : '変更を保存'}
        </Button>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={handleDeleteClick}
          disabled={loading || deleting}
        >
          部屋を削除
        </Button>
      </Box>

      {/* 削除確認ダイアログ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          部屋を削除しますか？
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            この部屋「{room?.room_number}号室」を削除してもよろしいですか？
            <br />
            削除後も履歴から復元することができます。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            キャンセル
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {deleting ? '削除中...' : '削除する'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
