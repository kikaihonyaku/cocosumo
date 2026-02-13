import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  Typography,
  CircularProgress
} from '@mui/material';
import {
  Chat as ChatIcon,
  Send as SendIcon
} from '@mui/icons-material';
import axios from 'axios';

export default function BulkLineGuidanceDialog({
  open,
  onClose,
  selectedCustomerIds = [],
  onSent
}) {
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setResult(null);
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/v1/email_templates');
      setTemplates(res.data);
      // デフォルトでLINE案内テンプレートを選択
      const lineTemplate = res.data.find(t => t.name === 'LINE友だち追加のご案内');
      if (lineTemplate) {
        setTemplateId(lineTemplate.id);
      } else if (res.data.length > 0) {
        setTemplateId(res.data[0].id);
      }
    } catch (e) {
      setError('テンプレートの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!templateId) {
      setError('テンプレートを選択してください');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await axios.post('/api/v1/customers/bulk_send_line_guidance', {
        customer_ids: selectedCustomerIds,
        template_id: templateId
      });
      setResult(res.data);
      onSent?.();
    } catch (e) {
      const msg = e.response?.data?.error || e.response?.data?.errors?.[0] || '送信に失敗しました';
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ChatIcon sx={{ color: '#06C755' }} />
        LINE案内メール一括送信
      </DialogTitle>
      <DialogContent>
        {result ? (
          <Alert severity="success" sx={{ mt: 1 }}>
            {result.message}
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {error && (
              <Alert severity="error">{error}</Alert>
            )}

            <Alert severity="info">
              選択した {selectedCustomerIds.length} 件の顧客にLINE友だち追加の案内メールを送信します。
              LINE連携済みの顧客やメールアドレス未登録の顧客は自動的に除外されます。
            </Alert>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <FormControl fullWidth>
                <InputLabel>メールテンプレート</InputLabel>
                <Select
                  value={templateId}
                  label="メールテンプレート"
                  onChange={(e) => setTemplateId(e.target.value)}
                >
                  {templates.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Typography variant="caption" color="text.secondary">
              テンプレート内の {'{{LINE友だち追加URL}}'} はLINE設定で登録した友だち追加URLに自動置換されます。
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          {result ? '閉じる' : 'キャンセル'}
        </Button>
        {!result && (
          <Button
            variant="contained"
            startIcon={sending ? <CircularProgress size={18} /> : <SendIcon />}
            onClick={handleSend}
            disabled={sending || loading || !templateId}
            sx={{ bgcolor: '#06C755', '&:hover': { bgcolor: '#05b04c' } }}
          >
            {sending ? '送信中...' : '送信'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
