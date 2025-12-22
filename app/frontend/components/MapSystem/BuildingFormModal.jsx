import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  TextField,
  Box,
  Alert,
  CircularProgress,
  MenuItem,
  Grid,
  IconButton,
  Divider,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import muiTheme from '../../theme/muiTheme';

export default function BuildingFormModal({ isOpen, onClose, onSuccess }) {
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);
  const [formData, setFormData] = useState({
    // 基本情報
    name: "",
    building_type: "mansion",
    description: "",
    // 所在地
    postcode: "",
    address: "",
    // 建築情報
    built_date: "",
    structure: "",
    floors: "",
    total_units: "",
    // 管理会社情報
    management_company: "",
    management_phone: "",
    management_contact: "",
    // 設備情報
    has_elevator: false,
    has_bicycle_parking: false,
    has_parking: false,
    parking_spaces: "",
    facilities: "",
    // その他
    notes: "",
    // 位置情報
    latitude: null,
    longitude: null
  });

  // Google Maps Geocoding APIを使用して住所から座標を取得
  const geocodeAddress = (address) => {
    return new Promise((resolve, reject) => {
      if (!address) {
        resolve({ latitude: null, longitude: null });
        return;
      }

      if (!window.google || !window.google.maps) {
        console.warn('Google Maps API is not loaded');
        resolve({ latitude: null, longitude: null });
        return;
      }

      const geocoder = new window.google.maps.Geocoder();

      geocoder.geocode({ address: address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            latitude: location.lat(),
            longitude: location.lng()
          });
        } else {
          console.warn('Geocoding failed:', status);
          resolve({ latitude: null, longitude: null });
        }
      });
    });
  };

  // 座標から住所を取得（リバースジオコーディング）
  const reverseGeocode = (lat, lng) => {
    return new Promise((resolve, reject) => {
      if (!window.google || !window.google.maps) {
        reject(new Error('Google Maps API is not loaded'));
        return;
      }

      const geocoder = new window.google.maps.Geocoder();
      const latlng = { lat, lng };

      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === 'OK' && results[0]) {
          // 日本の住所形式を取得
          const address = results[0].formatted_address;
          // "日本、" のプレフィックスを削除
          const cleanedAddress = address.replace(/^日本、\s*/, '');
          resolve(cleanedAddress);
        } else {
          reject(new Error('住所の取得に失敗しました'));
        }
      });
    });
  };

  // 現在地から住所を取得
  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError('お使いのブラウザは位置情報に対応していません');
      return;
    }

    setGettingLocation(true);
    setError('');

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      const address = await reverseGeocode(latitude, longitude);

      setFormData(prev => ({
        ...prev,
        address,
        latitude,
        longitude,
      }));
    } catch (err) {
      console.error('位置情報取得エラー:', err);
      if (err.code === 1) {
        setError('位置情報へのアクセスが許可されていません。設定を確認してください。');
      } else if (err.code === 2) {
        setError('位置情報を取得できませんでした。電波状況を確認してください。');
      } else if (err.code === 3) {
        setError('位置情報の取得がタイムアウトしました。');
      } else {
        setError('位置情報の取得に失敗しました');
      }
    } finally {
      setGettingLocation(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      // 住所を手動で変更した場合は位置情報をクリア（再ジオコーディングが必要）
      if (name === 'address') {
        newData.latitude = null;
        newData.longitude = null;
      }
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // 既に位置情報がある場合（現在地から取得した場合）はジオコーディングをスキップ
      let latitude = formData.latitude;
      let longitude = formData.longitude;

      if (!latitude || !longitude) {
        // 住所から位置情報を取得
        const coords = await geocodeAddress(formData.address);
        latitude = coords.latitude;
        longitude = coords.longitude;
      }

      const dataToSubmit = {
        ...formData,
        latitude,
        longitude
      };

      const response = await fetch('/api/v1/buildings', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ building: dataToSubmit })
      });

      const data = await response.json();

      if (response.ok) {
        // 成功時のコールバックを実行（物件IDを渡す）
        if (onSuccess) {
          onSuccess(data);
        }
        // フォームをリセット
        setFormData({
          name: "",
          building_type: "mansion",
          description: "",
          postcode: "",
          address: "",
          built_date: "",
          structure: "",
          floors: "",
          total_units: "",
          management_company: "",
          management_phone: "",
          management_contact: "",
          has_elevator: false,
          has_bicycle_parking: false,
          has_parking: false,
          parking_spaces: "",
          facilities: "",
          notes: "",
          latitude: null,
          longitude: null
        });
        // モーダルを閉じる
        onClose();
      } else {
        setError(data.errors?.join(', ') || '保存に失敗しました');
      }
    } catch (err) {
      console.error('保存エラー:', err);
      setError('ネットワークエラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setError("");
      onClose();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'primary.main',
          color: 'white',
          m: 0,
          px: 2,
          py: 0.5,
          minHeight: '40px',
          flexShrink: 0
        }}
      >
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          新規物件登録
        </Typography>
        <IconButton
          onClick={handleClose}
          disabled={submitting}
          sx={{
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
        <DialogContent sx={{ p: 3, overflowY: 'auto' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* 基本情報 */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary', mb: 2 }}>
            基本情報
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="物件名"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={submitting}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                required
                fullWidth
                label="物件種別"
                name="building_type"
                value={formData.building_type}
                onChange={handleChange}
                disabled={submitting}
                size="small"
              >
                <MenuItem value="mansion">マンション</MenuItem>
                <MenuItem value="apartment">アパート</MenuItem>
                <MenuItem value="house">一戸建て</MenuItem>
                <MenuItem value="office">オフィス</MenuItem>
                <MenuItem value="store">店舗</MenuItem>
                <MenuItem value="other">その他</MenuItem>
              </TextField>
            </Grid>

          </Grid>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="説明・備考"
            name="description"
            value={formData.description}
            onChange={handleChange}
            disabled={submitting}
            size="small"
            sx={{ mt: 1 }}
          />

          <Divider sx={{ my: 2 }} />

          {/* 所在地 */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary', mb: 2 }}>
            所在地
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="郵便番号"
                name="postcode"
                value={formData.postcode}
                onChange={handleChange}
                disabled={submitting}
                size="small"
                placeholder="000-0000"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="住所"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={submitting || gettingLocation}
                size="small"
                helperText={isMobile ? "現在地ボタンで位置情報から住所を取得できます" : "住所から自動的に地図上の位置を取得します"}
                InputProps={{
                  endAdornment: isMobile && (
                    <InputAdornment position="end">
                      <Tooltip title="現在地から住所を取得">
                        <span>
                          <IconButton
                            onClick={handleGetCurrentLocation}
                            disabled={submitting || gettingLocation}
                            edge="end"
                            color="primary"
                            size="small"
                          >
                            {gettingLocation ? (
                              <CircularProgress size={20} />
                            ) : (
                              <MyLocationIcon />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* 建築情報 */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary', mb: 2 }}>
            建築情報
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="築年月日"
                name="built_date"
                type="date"
                value={formData.built_date}
                onChange={handleChange}
                disabled={submitting}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="構造"
                name="structure"
                value={formData.structure}
                onChange={handleChange}
                disabled={submitting}
                size="small"
                placeholder="例: RC造"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="階数"
                name="floors"
                type="number"
                value={formData.floors}
                onChange={handleChange}
                disabled={submitting}
                size="small"
                InputProps={{
                  endAdornment: <Typography variant="body2" color="text.secondary">階</Typography>
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="総戸数"
                name="total_units"
                type="number"
                value={formData.total_units}
                onChange={handleChange}
                disabled={submitting}
                size="small"
                InputProps={{
                  endAdornment: <Typography variant="body2" color="text.secondary">戸</Typography>
                }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* 管理会社情報 */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary', mb: 2 }}>
            管理会社情報
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="管理会社名"
                name="management_company"
                value={formData.management_company}
                onChange={handleChange}
                disabled={submitting}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="管理会社電話番号"
                name="management_phone"
                value={formData.management_phone}
                onChange={handleChange}
                disabled={submitting}
                size="small"
                placeholder="03-1234-5678"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="管理会社担当者"
                name="management_contact"
                value={formData.management_contact}
                onChange={handleChange}
                disabled={submitting}
                size="small"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* 設備情報 */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary', mb: 2 }}>
            設備情報
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.has_elevator}
                      onChange={handleChange}
                      name="has_elevator"
                      disabled={submitting}
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
                      checked={formData.has_bicycle_parking}
                      onChange={handleChange}
                      name="has_bicycle_parking"
                      disabled={submitting}
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
                      checked={formData.has_parking}
                      onChange={handleChange}
                      name="has_parking"
                      disabled={submitting}
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
            </Grid>

            {formData.has_parking && (
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="駐車場台数"
                  name="parking_spaces"
                  type="number"
                  value={formData.parking_spaces}
                  onChange={handleChange}
                  disabled={submitting}
                  size="small"
                  InputProps={{
                    endAdornment: <Typography variant="body2" color="text.secondary">台</Typography>
                  }}
                />
              </Grid>
            )}

          </Grid>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="その他設備・特記事項"
            name="facilities"
            value={formData.facilities}
            onChange={handleChange}
            disabled={submitting}
            size="small"
            placeholder="例: オートロック、防犯カメラ、宅配BOXなど"
            sx={{ mt: 1 }}
          />

          <Divider sx={{ my: 2 }} />

          {/* その他メモ */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary', mb: 2 }}>
            その他メモ
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="メモ"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            disabled={submitting}
            size="small"
            placeholder="管理上の注意事項、修繕履歴など"
          />
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1, gap: 1, flexShrink: 0 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            disabled={submitting}
            sx={{
              minWidth: 100,
              borderColor: 'grey.300',
              color: 'text.secondary',
              '&:hover': {
                borderColor: 'grey.400',
                backgroundColor: 'grey.50'
              }
            }}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            sx={{
              minWidth: 100,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 2
              }
            }}
          >
            {submitting ? <CircularProgress size={24} /> : '登録する'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
