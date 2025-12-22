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
  FormControlLabel,
  Checkbox,
  Collapse,
  Chip,
} from '@mui/material';
import {
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

export default function BuildingInfoPanel({
  property,
  onSave,
  loading,
  isMobile = false,
  onFormChange,
  stores = [],
  expanded: controlledExpanded,
  onExpandedChange,
}) {
  // 親から制御される場合はcontrolledExpanded、そうでなければローカルステート
  const [localExpanded, setLocalExpanded] = useState(true);
  const isControlled = controlledExpanded !== undefined;
  const expanded = isControlled ? controlledExpanded : localExpanded;

  const handleExpandToggle = () => {
    const newExpanded = !expanded;
    if (isControlled) {
      onExpandedChange?.(newExpanded);
    } else {
      setLocalExpanded(newExpanded);
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    building_type: '',
    built_date: '',
    description: '',
    postcode: '',
    total_units: '',
    structure: '',
    floors: '',
    has_elevator: false,
    has_bicycle_parking: false,
    has_parking: false,
    parking_spaces: '',
    store_id: '',
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
        built_date: property.built_date || '',
        description: property.description || '',
        postcode: property.postcode || '',
        total_units: property.total_units || '',
        structure: property.structure || '',
        floors: property.floors || '',
        has_elevator: property.has_elevator || false,
        has_bicycle_parking: property.has_bicycle_parking || false,
        has_parking: property.has_parking || false,
        parking_spaces: property.parking_spaces || '',
        store_id: property.store_id || '',
        ...property
      });
    }
  }, [property]);

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
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
    <Box sx={{ height: expanded ? '100%' : 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <Box
        sx={{
          px: 2,
          py: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          borderBottom: '1px solid #e0e0e0',
          '&:hover': { bgcolor: 'action.hover' },
          flexShrink: 0,
        }}
        onClick={handleExpandToggle}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon color="action" />
          <Typography variant="subtitle2" fontWeight={600}>
            建物（土地）
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="変更を保存">
            <span>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSubmit();
                }}
                disabled={loading}
                color={hasUnsavedChanges ? "primary" : "default"}
              >
                {loading ? <CircularProgress size={18} /> : <SaveIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="物件を削除">
            <span>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick();
                }}
                disabled={loading || deleting}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Box>
      </Box>

      {/* コンテンツ */}
      {expanded && (
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 2 }}>
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

            <FormControl fullWidth size="small">
              <InputLabel>担当店舗</InputLabel>
              <Select
                value={formData.store_id || ''}
                label="担当店舗"
                onChange={handleChange('store_id')}
                variant="outlined"
              >
                <MenuItem value="">
                  <em>未選択</em>
                </MenuItem>
                {stores.map((store) => (
                  <MenuItem key={store.id} value={store.id}>
                    {store.name}
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
            <TextField
              label="築年月日"
              type="date"
              value={formData.built_date || ''}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, built_date: e.target.value }));
                setHasUnsavedChanges(true);
              }}
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
            />

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
              sx={{ maxWidth: 200 }}
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
            最終更新: {property?.updated_at ? new Date(property.updated_at).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '不明'}
          </Typography>
        </Box>

        {/* 追加情報 */}
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

            {/* 設備情報 */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.5, fontSize: '0.875rem' }}>
                設備情報
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.has_elevator || false}
                        onChange={handleChange('has_elevator')}
                        sx={{
                          '& .MuiSvgIcon-root': { fontSize: 24 },
                          color: '#9e9e9e',
                          '&.Mui-checked': { color: '#1976d2' }
                        }}
                      />
                    }
                    label="エレベーター"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.has_bicycle_parking || false}
                        onChange={handleChange('has_bicycle_parking')}
                        sx={{
                          '& .MuiSvgIcon-root': { fontSize: 24 },
                          color: '#9e9e9e',
                          '&.Mui-checked': { color: '#1976d2' }
                        }}
                      />
                    }
                    label="駐輪場"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.has_parking || false}
                        onChange={handleChange('has_parking')}
                        sx={{
                          '& .MuiSvgIcon-root': { fontSize: 24 },
                          color: '#9e9e9e',
                          '&.Mui-checked': { color: '#1976d2' }
                        }}
                      />
                    }
                    label="駐車場"
                  />
                </Box>
                {formData.has_parking && (
                  <TextField
                    label="駐車場台数"
                    type="number"
                    value={formData.parking_spaces || ''}
                    onChange={handleChange('parking_spaces')}
                    variant="outlined"
                    size="small"
                    sx={{ maxWidth: 200 }}
                    InputProps={{
                      endAdornment: <Typography variant="body2" color="text.secondary">台</Typography>
                    }}
                  />
                )}
                <TextField
                  fullWidth
                  label="その他設備・特記事項"
                  multiline
                  rows={3}
                  value={formData.facilities || ''}
                  onChange={handleChange('facilities')}
                  variant="outlined"
                  size="small"
                  placeholder="例: オートロック、防犯カメラ、宅配BOXなど"
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
      )}

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
