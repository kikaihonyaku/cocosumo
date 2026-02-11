import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Paper, TextField, Button, Alert,
  Snackbar, CircularProgress, Divider, List, ListItem, ListItemText,
  ListItemIcon, Card, CardContent, Avatar, Slider
} from '@mui/material';
import {
  Person as PersonIcon, Email as EmailIcon, Phone as PhoneIcon,
  Work as WorkIcon, Badge as BadgeIcon, Store as StoreIcon,
  Lock as LockIcon, Schedule as ScheduleIcon, Save as SaveIcon,
  ZoomIn as ZoomInIcon, EditNote as EditNoteIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode, ZOOM_LEVELS } from '../contexts/ThemeContext';
import ChangePasswordDialog from '../components/shared/ChangePasswordDialog';
import RichTextEditor from '../components/shared/RichTextEditor';

export default function ProfileSettings() {
  const { user: authUser, checkAuthStatus } = useAuth();
  const { zoomLevel, setZoomLevel } = useThemeMode();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });
  const [emailSignature, setEmailSignature] = useState('');
  const [signatureSaving, setSignatureSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/auth/profile');
      const data = await response.json();
      setProfile(data.user);
      setFormData({
        name: data.user.name || '',
        phone: data.user.phone || '',
      });
      setEmailSignature(data.user.email_signature || '');
    } catch (error) {
      showSnackbar('プロフィールの取得に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/v1/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        showSnackbar('プロフィールを更新しました');
        setProfile(data.user);
        checkAuthStatus(); // AuthContextのユーザー情報を更新
      } else {
        showSnackbar(data.error || '更新に失敗しました', 'error');
      }
    } catch (error) {
      showSnackbar('エラーが発生しました', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSignature = async () => {
    setSignatureSaving(true);
    try {
      const response = await fetch('/api/v1/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_signature: emailSignature }),
      });
      const data = await response.json();
      if (data.success) {
        showSnackbar('署名を保存しました');
      } else {
        showSnackbar(data.error || '保存に失敗しました', 'error');
      }
    } catch (error) {
      showSnackbar('エラーが発生しました', 'error');
    } finally {
      setSignatureSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('ja-JP');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <PersonIcon fontSize="large" color="primary" />
        <Typography variant="h4">プロフィール設定</Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* アカウント情報カード */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                {profile?.name?.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h6">{profile?.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {profile?.email}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <List dense>
              <ListItem>
                <ListItemIcon><BadgeIcon /></ListItemIcon>
                <ListItemText
                  primary="社員番号"
                  secondary={profile?.employee_code || '未設定'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><WorkIcon /></ListItemIcon>
                <ListItemText
                  primary="役職"
                  secondary={profile?.position || '未設定'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><StoreIcon /></ListItemIcon>
                <ListItemText
                  primary="所属店舗"
                  secondary={profile?.store?.name || '未所属'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><EmailIcon /></ListItemIcon>
                <ListItemText
                  primary="認証方式"
                  secondary={profile?.auth_provider === 'google' ? 'Google認証' : 'パスワード認証'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><ScheduleIcon /></ListItemIcon>
                <ListItemText
                  primary="最終ログイン"
                  secondary={formatDate(profile?.last_login_at)}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><LockIcon /></ListItemIcon>
                <ListItemText
                  primary="パスワード最終変更"
                  secondary={formatDate(profile?.password_changed_at)}
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>

        {/* 編集フォーム */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>基本情報の編集</Typography>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="名前"
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
                placeholder="090-1234-5678"
                helperText="数字とハイフンのみ使用可能"
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={saving}
                >
                  {saving ? '保存中...' : '保存'}
                </Button>
              </Box>
            </Box>
          </form>
        </Paper>

        {/* パスワード変更セクション */}
        {profile?.auth_provider !== 'google' && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>セキュリティ</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body1">パスワード</Typography>
                <Typography variant="body2" color="text.secondary">
                  最終変更: {formatDate(profile?.password_changed_at)}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<LockIcon />}
                onClick={() => setChangePasswordOpen(true)}
              >
                パスワードを変更
              </Button>
            </Box>
          </Paper>
        )}

        {/* メール署名セクション */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            <EditNoteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            メール署名
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            リッチメール作成時に自動挿入される署名を設定できます。
          </Typography>
          <RichTextEditor
            value={emailSignature}
            onChange={setEmailSignature}
            placeholder="署名を入力してください（例: 会社名 / 担当者名 / 電話番号）"
            minHeight={120}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              startIcon={signatureSaving ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSaveSignature}
              disabled={signatureSaving}
            >
              {signatureSaving ? '保存中...' : '署名を保存'}
            </Button>
          </Box>
        </Paper>

        {/* 表示設定セクション */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            <ZoomInIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            表示設定
          </Typography>
          <Box>
            <Typography variant="body1" sx={{ mb: 1 }}>
              画面の表示倍率: {zoomLevel}%
            </Typography>
            <Slider
              value={zoomLevel}
              onChange={(e, val) => setZoomLevel(val)}
              step={null}
              marks={ZOOM_LEVELS.map(v => ({ value: v, label: `${v}%` }))}
              min={75}
              max={125}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              画面全体の表示サイズを調整できます。設定はこのブラウザに保存されます。
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* パスワード変更ダイアログ */}
      <ChangePasswordDialog
        open={changePasswordOpen}
        onClose={() => {
          setChangePasswordOpen(false);
          fetchProfile(); // パスワード変更後にプロフィールを再取得
        }}
      />

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
