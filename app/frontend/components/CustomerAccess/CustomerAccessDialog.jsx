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
  Collapse
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import axios from 'axios';

export default function CustomerAccessDialog({ open, onClose, publicationId, onCreated }) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    password: '',
    expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14日後
    notes: '',
    send_notification: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    setValidationErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const errors = {};

    if (!formData.customer_name.trim()) {
      errors.customer_name = '顧客名を入力してください';
    }

    if (!formData.customer_email.trim()) {
      errors.customer_email = 'メールアドレスを入力してください';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      errors.customer_email = '有効なメールアドレスを入力してください';
    }

    if (usePassword && formData.password.length > 0 && formData.password.length < 6) {
      errors.password = 'パスワードは6文字以上で入力してください';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      setError(null);

      const payload = {
        customer_access: {
          customer_name: formData.customer_name.trim(),
          customer_email: formData.customer_email.trim(),
          customer_phone: formData.customer_phone.trim() || null,
          password: usePassword && formData.password ? formData.password : null,
          expires_at: formData.expires_at?.toISOString() || null,
          notes: formData.notes.trim() || null
        },
        send_notification: formData.send_notification,
        raw_password: usePassword && formData.password ? formData.password : null
      };

      const response = await axios.post(
        `/api/v1/property_publications/${publicationId}/customer_accesses`,
        payload
      );

      if (response.data.success) {
        // 成功時にダイアログを閉じてリロード
        handleClose();
        onCreated?.();

        // 成功メッセージとURLを表示
        const accessUrl = `${window.location.origin}${response.data.customer_access.public_url}`;
        alert(`顧客アクセス権を発行しました。\n\nURL: ${accessUrl}`);
      }
    } catch (err) {
      console.error('Failed to create customer access:', err);
      if (err.response?.data?.errors) {
        setError(err.response.data.errors.join('\n'));
      } else {
        setError('顧客アクセス権の発行に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      password: '',
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      notes: '',
      send_notification: false
    });
    setUsePassword(false);
    setShowPassword(false);
    setError(null);
    setValidationErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonAddIcon color="primary" />
        顧客アクセス権の発行
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TextField
            label="顧客名"
            value={formData.customer_name}
            onChange={handleChange('customer_name')}
            error={!!validationErrors.customer_name}
            helperText={validationErrors.customer_name}
            required
            fullWidth
            placeholder="山田 太郎"
          />

          <TextField
            label="メールアドレス"
            type="email"
            value={formData.customer_email}
            onChange={handleChange('customer_email')}
            error={!!validationErrors.customer_email}
            helperText={validationErrors.customer_email}
            required
            fullWidth
            placeholder="example@email.com"
          />

          <TextField
            label="電話番号（任意）"
            value={formData.customer_phone}
            onChange={handleChange('customer_phone')}
            fullWidth
            placeholder="090-1234-5678"
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
                error={!!validationErrors.password}
                helperText={validationErrors.password || '6文字以上で入力してください'}
                fullWidth
                sx={{ mt: 1 }}
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
            placeholder="反響経路や備考などを記入"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.send_notification}
                onChange={handleChange('send_notification')}
              />
            }
            label={
              <Box>
                <Typography variant="body2">顧客にメールで通知する</Typography>
                <Typography variant="caption" color="text.secondary">
                  アクセスURLとパスワードを含むメールを送信します
                </Typography>
              </Box>
            }
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
        >
          {loading ? '発行中...' : '発行する'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
