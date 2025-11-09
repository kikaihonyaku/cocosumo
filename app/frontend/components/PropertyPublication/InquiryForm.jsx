import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Send as SendIcon
} from '@mui/icons-material';
import axios from 'axios';

export default function InquiryForm({ publicationId }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await axios.post(`/api/v1/property_publications/${publicationId}/inquiries`, {
        property_inquiry: formData
      });

      setSuccess(true);
      // Clear form
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
    } catch (err) {
      console.error('Error submitting inquiry:', err);
      setError('お問い合わせの送信に失敗しました。もう一度お試しください。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom>
        お問い合わせ
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
        この物件についてのお問い合わせはこちらから
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          お問い合わせを送信しました。担当者より折り返しご連絡いたします。
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label="お名前"
        value={formData.name}
        onChange={handleChange('name')}
        required
        margin="normal"
        size="small"
        disabled={submitting}
      />

      <TextField
        fullWidth
        label="メールアドレス"
        type="email"
        value={formData.email}
        onChange={handleChange('email')}
        required
        margin="normal"
        size="small"
        disabled={submitting}
      />

      <TextField
        fullWidth
        label="電話番号"
        value={formData.phone}
        onChange={handleChange('phone')}
        margin="normal"
        size="small"
        disabled={submitting}
        placeholder="03-1234-5678"
      />

      <TextField
        fullWidth
        label="お問い合わせ内容"
        value={formData.message}
        onChange={handleChange('message')}
        required
        multiline
        rows={4}
        margin="normal"
        size="small"
        disabled={submitting}
        placeholder="内見希望日時、ご質問などをご記入ください"
      />

      <Button
        fullWidth
        type="submit"
        variant="contained"
        color="primary"
        disabled={submitting}
        startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
        sx={{ mt: 2 }}
      >
        {submitting ? '送信中...' : 'お問い合わせを送信'}
      </Button>
    </Box>
  );
}
