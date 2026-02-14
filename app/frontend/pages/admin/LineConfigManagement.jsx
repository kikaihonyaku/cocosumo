import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  TextField,
  Paper,
  Box,
  Alert,
  Snackbar,
  CircularProgress,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ContentCopy as ContentCopyIcon,
  NetworkCheck as NetworkCheckIcon,
  Lock as LockIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

export default function LineConfigManagement() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [testResult, setTestResult] = useState(null);

  const [credentialsLocked, setCredentialsLocked] = useState(true);

  const [formData, setFormData] = useState({
    channel_id: '',
    channel_secret: '',
    channel_token: '',
    friend_add_url: '',
    greeting_message: '',
    rich_menu_id: '',
    active: true,
  });

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/line_config', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        if (data.configured) {
          setFormData({
            channel_id: '',
            channel_secret: '',
            channel_token: '',
            friend_add_url: data.friend_add_url || '',
            greeting_message: data.greeting_message || '',
            rich_menu_id: data.rich_menu_id || '',
            active: data.active ?? true,
          });
        }
      } else if (response.status === 401) {
        window.location.href = '/login';
      } else {
        showSnackbar('LINE設定の取得に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Error fetching LINE config:', error);
      showSnackbar('エラーが発生しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleUnlockCredentials = () => {
    setCredentialsLocked(false);
    setFormData(prev => ({ ...prev, channel_id: '', channel_secret: '', channel_token: '' }));
  };

  const handleLockCredentials = () => {
    setCredentialsLocked(true);
    setFormData(prev => ({ ...prev, channel_id: '', channel_secret: '', channel_token: '' }));
  };

  const handleSave = async () => {
    // channel_id/secret/token は空の場合（変更しない場合）は送信しない
    const payload = { ...formData };
    if (!payload.channel_id) delete payload.channel_id;
    if (!payload.channel_secret) delete payload.channel_secret;
    if (!payload.channel_token) delete payload.channel_token;

    try {
      setSaving(true);
      const response = await fetch('/api/v1/line_config', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line_config: payload }),
      });

      if (response.ok) {
        showSnackbar('LINE設定を保存しました', 'success');
        setCredentialsLocked(true);
        setFormData(prev => ({
          ...prev,
          channel_id: '',
          channel_secret: '',
          channel_token: '',
        }));
        fetchConfig();
      } else {
        const error = await response.json();
        showSnackbar(error.errors?.join(', ') || 'LINE設定の保存に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Error saving LINE config:', error);
      showSnackbar('エラーが発生しました', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const response = await fetch('/api/v1/line_config/test', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      if (response.ok) {
        setTestResult({ success: true, ...data });
        showSnackbar('接続テスト成功', 'success');
        fetchConfig();
      } else {
        setTestResult({ success: false, message: data.message || '接続テストに失敗しました' });
        showSnackbar(data.message || '接続テストに失敗しました', 'error');
      }
    } catch (error) {
      console.error('Error testing LINE config:', error);
      setTestResult({ success: false, message: 'エラーが発生しました' });
      showSnackbar('エラーが発生しました', 'error');
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showSnackbar('クリップボードにコピーしました', 'info');
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <ChatIcon fontSize="large" sx={{ color: '#06C755' }} />
        <Typography variant="h4" component="h1">
          LINE設定
        </Typography>
        {config?.configured && (
          <Chip
            size="small"
            icon={config.webhook_verified ? <CheckCircleIcon /> : <ErrorIcon />}
            label={config.webhook_verified ? '接続確認済み' : '未確認'}
            color={config.webhook_verified ? 'success' : 'warning'}
            variant="outlined"
          />
        )}
      </Box>

      {/* API設定 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          LINE Messaging API 設定
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          LINE Developers Console からチャネルの情報を入力してください。
          {config?.configured && credentialsLocked && ' 認証情報を変更するには「認証情報を変更する」ボタンを押してください。'}
        </Typography>

        {config?.configured && credentialsLocked ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { label: 'Channel ID', value: config.channel_id },
              { label: 'Channel Secret', value: config.channel_secret },
              { label: 'Channel Access Token', value: config.channel_token },
            ].map(({ label, value }) => (
              <Box key={label}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'grey.50', p: 1.5, borderRadius: 1, overflow: 'hidden' }}>
                  <LockIcon fontSize="small" color="action" sx={{ flexShrink: 0 }} />
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {value || '未設定'}
                  </Typography>
                </Box>
              </Box>
            ))}
            <Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                onClick={handleUnlockCredentials}
              >
                認証情報を変更する
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Channel ID"
              value={formData.channel_id}
              onChange={(e) => setFormData({ ...formData, channel_id: e.target.value })}
              fullWidth
              placeholder="Channel IDを入力"
              helperText="Messaging API チャネルのChannel ID"
              autoComplete="new-password"
              inputProps={{ 'data-1p-ignore': true, 'data-lpignore': 'true' }}
            />
            <TextField
              label="Channel Secret"
              type="password"
              value={formData.channel_secret}
              onChange={(e) => setFormData({ ...formData, channel_secret: e.target.value })}
              fullWidth
              placeholder="Channel Secretを入力"
              helperText="Messaging API チャネルのChannel Secret"
              autoComplete="new-password"
              inputProps={{ 'data-1p-ignore': true, 'data-lpignore': 'true' }}
            />
            <TextField
              label="Channel Access Token"
              type="password"
              value={formData.channel_token}
              onChange={(e) => setFormData({ ...formData, channel_token: e.target.value })}
              fullWidth
              placeholder="Channel Access Tokenを入力"
              helperText="Messaging API チャネルの長期チャネルアクセストークン"
              autoComplete="new-password"
              inputProps={{ 'data-1p-ignore': true, 'data-lpignore': 'true' }}
            />
            {config?.configured && (
              <Box>
                <Button
                  variant="text"
                  size="small"
                  onClick={handleLockCredentials}
                >
                  キャンセル
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* Webhook URL */}
      {config?.configured && config.webhook_url && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Webhook URL
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            LINE Developers Console の Messaging API 設定 → Webhook URL に以下のURLを設定してください。
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'grey.50', p: 1.5, borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', flex: 1, wordBreak: 'break-all' }}>
              {config.webhook_url}
            </Typography>
            <Tooltip title="コピー">
              <IconButton size="small" onClick={() => copyToClipboard(config.webhook_url)}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>
      )}

      {/* 友だち追加URL */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          LINE友だち追加URL
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          顧客へのメールにLINE友だち追加リンクを掲載するためのURLです。LINE Official Account Managerから取得してください。
        </Typography>
        <TextField
          label="友だち追加URL"
          value={formData.friend_add_url}
          onChange={(e) => setFormData({ ...formData, friend_add_url: e.target.value })}
          fullWidth
          placeholder="https://line.me/R/ti/p/@youraccountid"
          helperText="LINE Official Account Manager → 友だち追加ガイド → URLから取得できます"
        />
      </Paper>

      {/* 挨拶メッセージ */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          友だち追加時の設定
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="挨拶メッセージ"
            value={formData.greeting_message}
            onChange={(e) => setFormData({ ...formData, greeting_message: e.target.value })}
            fullWidth
            multiline
            rows={4}
            placeholder="友だち追加ありがとうございます！&#10;お部屋探しのご相談はこちらからお気軽にメッセージください。"
            helperText="友だち追加時に自動送信されるメッセージ（空欄の場合は送信しません）"
          />
          <TextField
            label="リッチメニューID"
            value={formData.rich_menu_id}
            onChange={(e) => setFormData({ ...formData, rich_menu_id: e.target.value })}
            fullWidth
            placeholder="richmenu-xxxxxxxxx"
            helperText="リッチメニューのID（LINE Developers Consoleで作成）"
          />
        </Box>
      </Paper>

      {/* 有効/無効 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              color="success"
            />
          }
          label="LINE連携を有効にする"
        />
      </Paper>

      {/* 接続テスト結果 */}
      {testResult && (
        <Alert
          severity={testResult.success ? 'success' : 'error'}
          sx={{ mb: 3 }}
          onClose={() => setTestResult(null)}
        >
          {testResult.success ? (
            <Box>
              <Typography variant="body2" fontWeight="bold">接続テスト成功</Typography>
              {testResult.bot_info && (
                <Typography variant="body2">
                  Bot名: {testResult.bot_info.display_name}
                </Typography>
              )}
            </Box>
          ) : (
            <Typography variant="body2">{testResult.message}</Typography>
          )}
        </Alert>
      )}

      {/* アクションボタン */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        {config?.configured && (
          <Button
            variant="outlined"
            startIcon={testing ? <CircularProgress size={18} /> : <NetworkCheckIcon />}
            onClick={handleTest}
            disabled={testing || saving}
          >
            接続テスト
          </Button>
        )}
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving || testing}
          sx={{ bgcolor: '#06C755', '&:hover': { bgcolor: '#05b04c' } }}
        >
          {saving ? '保存中...' : '保存'}
        </Button>
      </Box>

      {/* スナックバー */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
