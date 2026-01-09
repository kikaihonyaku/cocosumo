import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Collapse,
  Snackbar
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Slideshow as SlideshowIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import axios from 'axios';

export default function PresentationAccessDialog({ open, onClose, publicationId, onCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    password: '',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7日後
    notes: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        presentation_access: {
          title: formData.title.trim() || null,
          password: usePassword && formData.password ? formData.password : null,
          expires_at: formData.expires_at?.toISOString() || null,
          notes: formData.notes.trim() || null
        }
      };

      const response = await axios.post(
        `/api/v1/property_publications/${publicationId}/presentation_accesses`,
        payload
      );

      if (response.data.success) {
        const accessUrl = response.data.presentation_access.public_url;

        // クリップボードにコピー
        try {
          await navigator.clipboard.writeText(accessUrl);
          setSnackbar({ open: true, message: 'URLをクリップボードにコピーしました' });
        } catch (clipboardErr) {
          console.warn('Clipboard copy failed:', clipboardErr);
        }

        handleClose();
        onCreated?.(response.data.presentation_access);

        // 成功メッセージとURLを表示
        alert(`プレゼンURLを発行しました。\n\nURL: ${accessUrl}\n\n（クリップボードにコピー済み）`);
      }
    } catch (err) {
      console.error('Failed to create presentation access:', err);
      if (err.response?.data?.errors) {
        setError(err.response.data.errors.join('\n'));
      } else {
        setError('プレゼンURLの発行に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      password: '',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notes: ''
    });
    setUsePassword(false);
    setShowPassword(false);
    setError(null);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SlideshowIcon color="primary" />
          プレゼンURLの発行
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Alert severity="info" icon={<SlideshowIcon />}>
              <Typography variant="body2">
                営業説明用のプレゼンURLを発行します。
                進行順が固定されたUIで、Zoom/対面/LINE共有で即使えます。
              </Typography>
            </Alert>

            <TextField
              label="タイトル（任意）"
              value={formData.title}
              onChange={handleChange('title')}
              fullWidth
              placeholder="例: 山田様向けプレゼン"
              helperText="空欄の場合は物件タイトルが使用されます"
            />

            <TextField
              label="有効期限"
              type="date"
              value={formData.expires_at ? formData.expires_at.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value + 'T23:59:59') : null;
                setFormData(prev => ({ ...prev, expires_at: date }));
              }}
              fullWidth
              helperText="指定日の23:59まで有効です"
              InputLabelProps={{ shrink: true }}
              inputProps={{
                min: new Date().toISOString().split('T')[0]
              }}
            />

            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={usePassword}
                    onChange={(e) => {
                      setUsePassword(e.target.checked);
                      if (!e.target.checked) {
                        setFormData(prev => ({ ...prev, password: '' }));
                      }
                    }}
                  />
                }
                label="パスワード保護を設定する"
              />
              <Collapse in={usePassword}>
                <TextField
                  label="パスワード"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange('password')}
                  helperText="4文字以上で入力してください（4桁数字推奨）"
                  fullWidth
                  sx={{ mt: 1 }}
                  placeholder="例: 1234"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Collapse>
            </Box>

            <TextField
              label="メモ（任意・管理用）"
              value={formData.notes}
              onChange={handleChange('notes')}
              fullWidth
              multiline
              rows={2}
              placeholder="用途や備考などを記入"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            キャンセル
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            startIcon={<ContentCopyIcon />}
          >
            {loading ? '発行中...' : '発行してコピー'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </>
  );
}
