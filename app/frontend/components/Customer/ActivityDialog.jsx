import React, { useState, useEffect } from 'react';
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
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import axios from 'axios';

const ACTIVITY_TYPES = [
  { value: 'phone_call', label: '電話' },
  { value: 'email', label: 'メール' },
  { value: 'visit', label: '来店' },
  { value: 'viewing', label: '内見' },
  { value: 'note', label: 'メモ' },
  { value: 'line_message', label: 'LINE' }
];

const DIRECTIONS = [
  { value: 'outbound', label: '発信（こちらから）' },
  { value: 'inbound', label: '受信（顧客から）' },
  { value: 'internal', label: '社内メモ' }
];

const DEFAULT_FORM = {
  activity_type: 'phone_call',
  direction: 'outbound',
  subject: '',
  content: ''
};

export default function ActivityDialog({ open, onClose, customerId, activity, onCreated, onUpdated }) {
  const isEditMode = !!activity;
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize form data when activity prop changes
  useEffect(() => {
    if (activity) {
      setFormData({
        activity_type: activity.activity_type || 'phone_call',
        direction: activity.direction || 'outbound',
        subject: activity.subject || '',
        content: activity.content || ''
      });
    } else {
      setFormData(DEFAULT_FORM);
    }
  }, [activity]);

  const handleChange = (field) => (event) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async () => {
    if (!formData.subject.trim()) {
      setError('件名を入力してください');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isEditMode) {
        await axios.patch(`/api/v1/customers/${customerId}/activities/${activity.id}`, {
          activity: formData
        });
        handleClose();
        onUpdated?.();
      } else {
        await axios.post(`/api/v1/customers/${customerId}/activities`, {
          activity: formData
        });
        handleClose();
        onCreated?.();
      }
    } catch (err) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} activity:`, err);
      setError(err.response?.data?.errors?.join('\n') || `対応履歴の${isEditMode ? '更新' : '追加'}に失敗しました`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(DEFAULT_FORM);
    setError(null);
    onClose();
  };

  // Check if this is a system-generated activity (inquiry, access_issued, status_change)
  const isSystemActivity = activity && ['inquiry', 'access_issued', 'status_change'].includes(activity.activity_type);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {isEditMode ? <EditIcon color="primary" /> : <AddIcon color="primary" />}
        {isEditMode ? '対応履歴を編集' : '対応履歴を追加'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {isSystemActivity && (
            <Alert severity="info">
              この履歴はシステムによって自動生成されたため、種類と方向は変更できません。
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth disabled={isSystemActivity}>
              <InputLabel>種類</InputLabel>
              <Select
                value={formData.activity_type}
                onChange={handleChange('activity_type')}
                label="種類"
              >
                {ACTIVITY_TYPES.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={isSystemActivity}>
              <InputLabel>方向</InputLabel>
              <Select
                value={formData.direction}
                onChange={handleChange('direction')}
                label="方向"
              >
                {DIRECTIONS.map(dir => (
                  <MenuItem key={dir.value} value={dir.value}>
                    {dir.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TextField
            label="件名"
            value={formData.subject}
            onChange={handleChange('subject')}
            fullWidth
            required
            placeholder="例: 内見日程の確認"
          />

          <TextField
            label="詳細（任意）"
            value={formData.content}
            onChange={handleChange('content')}
            fullWidth
            multiline
            rows={10}
            placeholder="対応内容の詳細を記入..."
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
          {loading ? (isEditMode ? '更新中...' : '追加中...') : (isEditMode ? '更新' : '追加')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
