import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon
} from '@mui/icons-material';
import axios from 'axios';

export default function EditCustomerDialog({ open, onClose, customer, onUpdated }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (customer && open) {
      setName(customer.name || '');
      setEmail(customer.email || '');
      setPhone(customer.phone || '');
      setError(null);
    }
  }, [customer, open]);

  const nameEmpty = name.trim() === '';
  const emailInvalid = email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = async () => {
    if (!customer || nameEmpty) return;

    try {
      setLoading(true);
      setError(null);

      await axios.patch(`/api/v1/customers/${customer.id}`, {
        customer: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim()
        }
      });

      handleClose();
      onUpdated?.();
    } catch (err) {
      console.error('Failed to update customer:', err);
      setError(err.response?.data?.errors?.join('\n') || '顧客情報の更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <EditIcon color="primary" />
        顧客情報を編集
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
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            error={nameEmpty}
            helperText={nameEmpty ? '顧客名は必須です' : ''}
          />

          <TextField
            label="メールアドレス"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            error={emailInvalid}
            helperText={emailInvalid ? 'メールアドレスの形式が正しくありません' : ''}
          />

          <TextField
            label="電話番号"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            fullWidth
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
          disabled={loading || nameEmpty || emailInvalid}
        >
          {loading ? '保存中...' : '保存'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
