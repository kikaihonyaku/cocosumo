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
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  OpenInFull as OpenInFullIcon,
  CloseFullscreen as CloseFullscreenIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

export default function PropertyInfoPanel({ property, onSave, loading, isMaximized, onToggleMaximize, isMobile = false, onFormChange }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    building_type: '',
    built_year: '',
    description: '',
    postcode: '',
    total_units: '',
    structure: '',
    floors: '',
    ...property
  });

  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (property) {
      setFormData({
        name: property.name || '',
        address: property.address || '',
        building_type: property.building_type || '',
        built_year: property.built_year || '',
        description: property.description || '',
        postcode: property.postcode || '',
        total_units: property.total_units || '',
        structure: property.structure || '',
        floors: property.floors || '',
        ...property
      });
    }
  }, [property]);

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
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

  // Google Maps Geocoding APIを使用して住所から座標を取得
  const handleGeocodeAddress = async () => {
    if (!formData.address) {
      setGeocodeError('住所を入力してください');
      return;
    }

    setGeocoding(true);
    setGeocodeError('');

    try {
      const geocoder = new window.google.maps.Geocoder();

      geocoder.geocode({ address: formData.address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();

          setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng
          }));

          if (property.id) {
            onSave({
              ...formData,
              latitude: lat,
              longitude: lng
            });
            setHasUnsavedChanges(false);
          }

          setGeocoding(false);
        } else {
          setGeocodeError('住所から位置情報を取得できませんでした');
          setGeocoding(false);
        }
      });
    } catch (err) {
      console.error('Geocoding error:', err);
      setGeocodeError('位置情報の取得に失敗しました');
      setGeocoding(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/v1/buildings/${property.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        window.location.href = '/map';
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

  const buildingTypes = [
    { id: 'mansion', name: 'マンション' },
    { id: 'apartment', name: 'アパート' },
    { id: 'house', name: '一戸建て' },
    { id: 'office', name: 'オフィス' },
    { id: 'store', name: '店舗' },
    { id: 'other', name: 'その他' },
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
          <BusinessIcon color="primary" sx={{ fontSize: 26 }} />
          建物（土地）
        </Typography>

        {!isMobile && (
          <Tooltip title={isMaximized ? "最小化" : "最大化"}>
            <IconButton
              size="small"
              onClick={onToggleMaximize}
              sx={{ ml: 1 }}
            >
              {isMaximized ? <CloseFullscreenIcon /> : <OpenInFullIcon />}
            </IconButton>
          </Tooltip>
        )}
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
            <TextField
              fullWidth
              label="建物名"
              value={formData.name || ''}
              onChange={handleChange('name')}
              variant="outlined"
              size="small"
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>建物種別</InputLabel>
                <Select
                  value={formData.building_type || ''}
                  label="建物種別"
                  onChange={handleChange('building_type')}
                  variant="outlined"
                >
                  {buildingTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="築年"
                type="number"
                value={formData.built_year || ''}
                onChange={handleChange('built_year')}
                variant="outlined"
                size="small"
                InputProps={{
                  endAdornment: <Typography variant="body2" color="text.secondary">年</Typography>
                }}
              />
            </Box>

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

        {/* 所在地情報 */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.5, fontSize: '0.875rem' }}>
            所在地
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="郵便番号"
              value={formData.postcode || ''}
              onChange={handleChange('postcode')}
              variant="outlined"
              size="small"
              placeholder="000-0000"
              sx={{ maxWidth: 200 }}
            />

            <Box>
              <TextField
                fullWidth
                label="住所"
                value={formData.address || ''}
                onChange={handleChange('address')}
                variant="outlined"
                size="small"
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={geocoding ? <CircularProgress size={16} /> : <SearchIcon />}
                onClick={handleGeocodeAddress}
                disabled={geocoding || !formData.address}
                sx={{ mt: 1 }}
              >
                {geocoding ? '検索中...' : '住所から位置情報を取得'}
              </Button>
              {geocodeError && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {geocodeError}
                </Alert>
              )}
            </Box>

            {property?.latitude && property?.longitude && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                <LocationIcon color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  緯度: {parseFloat(property.latitude).toFixed(6)}, 経度: {parseFloat(property.longitude).toFixed(6)}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>

        {/* 建築情報 */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.5, fontSize: '0.875rem' }}>
            建築情報
          </Typography>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="構造"
                value={formData.structure || ''}
                onChange={handleChange('structure')}
                variant="outlined"
                size="small"
                sx={{ flex: 1 }}
                placeholder="例: RC造"
              />

              <TextField
                label="階数"
                type="number"
                value={formData.floors || ''}
                onChange={handleChange('floors')}
                variant="outlined"
                size="small"
                sx={{ flex: 1 }}
                InputProps={{
                  endAdornment: <Typography variant="body2" color="text.secondary">階</Typography>
                }}
              />
            </Box>

            <TextField
              label="総戸数"
              type="number"
              value={formData.total_units || ''}
              onChange={handleChange('total_units')}
              variant="outlined"
              size="small"
              InputProps={{
                endAdornment: <Typography variant="body2" color="text.secondary">戸</Typography>
              }}
            />
          </Stack>
        </Box>

        {/* 最終更新日 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pt: 1 }}>
          <CalendarIcon color="action" fontSize="small" />
          <Typography variant="body2" color="text.secondary">
            最終更新: {property?.updated_at ? new Date(property.updated_at).toLocaleDateString('ja-JP') : '不明'}
          </Typography>
        </Box>

        {/* 最大化時のみ表示される追加項目 */}
        {isMaximized && (
          <>
            {/* 管理会社情報 */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.5, fontSize: '0.875rem' }}>
                管理会社情報
              </Typography>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="管理会社名"
                  value={formData.management_company || ''}
                  onChange={handleChange('management_company')}
                  variant="outlined"
                  size="small"
                />
                <TextField
                  fullWidth
                  label="管理会社電話番号"
                  value={formData.management_phone || ''}
                  onChange={handleChange('management_phone')}
                  variant="outlined"
                  size="small"
                  placeholder="03-1234-5678"
                />
                <TextField
                  fullWidth
                  label="管理会社担当者"
                  value={formData.management_contact || ''}
                  onChange={handleChange('management_contact')}
                  variant="outlined"
                  size="small"
                />
              </Stack>
            </Box>

            {/* 駐車場情報 */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.5, fontSize: '0.875rem' }}>
                駐車場情報
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="駐車場台数"
                    type="number"
                    value={formData.parking_spaces || ''}
                    onChange={handleChange('parking_spaces')}
                    variant="outlined"
                    size="small"
                    sx={{ flex: 1 }}
                    InputProps={{
                      endAdornment: <Typography variant="body2" color="text.secondary">台</Typography>
                    }}
                  />
                  <TextField
                    label="駐車場料金"
                    type="number"
                    value={formData.parking_fee || ''}
                    onChange={handleChange('parking_fee')}
                    variant="outlined"
                    size="small"
                    sx={{ flex: 1 }}
                    InputProps={{
                      endAdornment: <Typography variant="body2" color="text.secondary">円/月</Typography>
                    }}
                  />
                </Box>
              </Stack>
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
                  placeholder="例: エレベーター、オートロック、防犯カメラ、宅配BOXなど"
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
          </>
        )}

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
          物件を削除
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
          物件を削除しますか？
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            この物件「{property?.name}」を削除してもよろしいですか？
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
