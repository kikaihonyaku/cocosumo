import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  Typography,
  Menu,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Email as EmailIcon,
  Send as SendIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import axios from 'axios';

export default function EmailComposeDialog({
  open,
  onClose,
  customer,
  inquiries = [],
  selectedInquiryId = null,
  onSent
}) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [inquiryId, setInquiryId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Templates
  const [templates, setTemplates] = useState([]);
  const [templateMenuAnchor, setTemplateMenuAnchor] = useState(null);

  // Load templates on open
  useEffect(() => {
    if (open) {
      setSubject('');
      setBody('');
      setInquiryId(selectedInquiryId || (inquiries.length > 0 ? inquiries[0].id : ''));
      setError(null);
      setConfirmOpen(false);
      loadTemplates();
    }
  }, [open, selectedInquiryId, inquiries]);

  const loadTemplates = async () => {
    try {
      const res = await axios.get('/api/v1/email_templates');
      setTemplates(res.data);
    } catch (e) {
      // テンプレート取得失敗は無視（送信自体に影響なし）
    }
  };

  const handleTemplateSelect = (template) => {
    setSubject(template.subject);
    setBody(template.body);
    setTemplateMenuAnchor(null);
  };

  const handleSendClick = () => {
    if (!subject.trim() || !body.trim()) {
      setError('件名と本文を入力してください');
      return;
    }
    if (!inquiryId) {
      setError('案件を選択してください');
      return;
    }
    setError(null);
    setConfirmOpen(true);
  };

  const handleSend = async () => {
    setConfirmOpen(false);
    setLoading(true);
    setError(null);

    try {
      await axios.post(`/api/v1/customers/${customer.id}/send_email`, {
        subject: subject.trim(),
        body: body.trim(),
        inquiry_id: inquiryId
      });
      onSent?.();
      onClose();
    } catch (e) {
      const msg = e.response?.data?.errors?.[0] || e.response?.data?.error || 'メール送信に失敗しました';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const hasEmail = customer?.email;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon color="primary" />
          メールを送信
        </DialogTitle>
        <DialogContent>
          {!hasEmail && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              この顧客にはメールアドレスが登録されていません。メールを送信するにはメールアドレスを設定してください。
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* 宛先（読み取り専用） */}
          <TextField
            label="宛先"
            value={hasEmail ? `${customer.name} <${customer.email}>` : `${customer?.name || ''} (メール未登録)`}
            fullWidth
            margin="normal"
            size="small"
            slotProps={{ input: { readOnly: true } }}
          />

          {/* 案件セレクター */}
          <FormControl fullWidth margin="normal" size="small">
            <InputLabel>案件</InputLabel>
            <Select
              value={inquiryId}
              label="案件"
              onChange={(e) => setInquiryId(e.target.value)}
            >
              {inquiries.map((inq) => {
                const piNames = (inq.property_inquiries || [])
                  .map(pi => pi.building_name ? `${pi.building_name} ${pi.room_number || ''}`.trim() : null)
                  .filter(Boolean);
                const label = piNames.length > 0
                  ? `案件 #${inq.id} - ${piNames.join(', ')}`
                  : `案件 #${inq.id}`;
                return (
                  <MenuItem key={inq.id} value={inq.id}>
                    {label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {/* テンプレートボタン + 件名 */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', mt: 1 }}>
            <TextField
              label="件名"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              fullWidth
              size="small"
              required
              disabled={!hasEmail}
            />
            {templates.length > 0 && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<DescriptionIcon />}
                onClick={(e) => setTemplateMenuAnchor(e.currentTarget)}
                sx={{ whiteSpace: 'nowrap', minWidth: 'auto', height: 40 }}
                disabled={!hasEmail}
              >
                テンプレート
              </Button>
            )}
          </Box>

          {/* 本文 */}
          <TextField
            label="本文"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            fullWidth
            margin="normal"
            size="small"
            multiline
            rows={10}
            required
            disabled={!hasEmail}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            キャンセル
          </Button>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={18} /> : <SendIcon />}
            onClick={handleSendClick}
            disabled={loading || !hasEmail}
          >
            送信
          </Button>
        </DialogActions>
      </Dialog>

      {/* テンプレート選択メニュー */}
      <Menu
        anchorEl={templateMenuAnchor}
        open={Boolean(templateMenuAnchor)}
        onClose={() => setTemplateMenuAnchor(null)}
      >
        <Typography variant="caption" sx={{ px: 2, py: 0.5, color: 'text.secondary', display: 'block' }}>
          テンプレートを選択
        </Typography>
        <Divider />
        {templates.map((t) => (
          <MenuItem key={t.id} onClick={() => handleTemplateSelect(t)}>
            {t.name}
          </MenuItem>
        ))}
      </Menu>

      {/* 送信確認ダイアログ */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs">
        <DialogTitle>メール送信の確認</DialogTitle>
        <DialogContent>
          <Typography>
            {customer?.name} 様（{customer?.email}）にメールを送信します。よろしいですか？
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            件名: {subject}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>キャンセル</Button>
          <Button variant="contained" onClick={handleSend}>送信する</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
