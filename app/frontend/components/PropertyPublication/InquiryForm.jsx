import React, { useState, useRef, useEffect } from 'react';
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
import { PropertyAnalytics } from '../../services/analytics';

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

  // Spam prevention: honeypot field and form load timestamp
  const [honeypot, setHoneypot] = useState('');
  const formLoadTimeRef = useRef(Date.now());
  const MIN_FORM_FILL_TIME_MS = 3000; // Minimum 3 seconds to fill form

  // Track if form start has been recorded
  const formStartTrackedRef = useRef(false);

  // Track form start when user focuses on first field
  const handleFormStart = () => {
    if (!formStartTrackedRef.current) {
      PropertyAnalytics.startInquiry(publicationId);
      formStartTrackedRef.current = true;
    }
  };

  // Source tracking: collect UTM parameters and referrer
  const getTrackingData = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const referrer = document.referrer || '';

    // Determine source based on referrer and UTM parameters
    let source = 'direct';
    if (urlParams.get('utm_source')) {
      source = 'campaign';
    } else if (referrer) {
      const referrerUrl = new URL(referrer);
      const socialDomains = ['twitter.com', 'x.com', 'facebook.com', 'line.me', 'instagram.com', 'linkedin.com'];
      const searchDomains = ['google.com', 'google.co.jp', 'yahoo.co.jp', 'bing.com'];

      if (socialDomains.some(domain => referrerUrl.hostname.includes(domain))) {
        source = 'social';
      } else if (searchDomains.some(domain => referrerUrl.hostname.includes(domain))) {
        source = 'organic_search';
      } else if (!referrerUrl.hostname.includes(window.location.hostname)) {
        source = 'referral';
      }
    }

    return {
      source,
      utm_source: urlParams.get('utm_source') || '',
      utm_medium: urlParams.get('utm_medium') || '',
      utm_campaign: urlParams.get('utm_campaign') || '',
      referrer: referrer.substring(0, 500) // Limit referrer length
    };
  };

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

    // Spam check 1: Honeypot field should be empty (bots often fill all fields)
    if (honeypot) {
      // Silently reject but show success to prevent bot from knowing
      setSuccess(true);
      setSubmitting(false);
      return;
    }

    // Spam check 2: Form should take at least 3 seconds to fill (bots are too fast)
    const formFillTime = Date.now() - formLoadTimeRef.current;
    if (formFillTime < MIN_FORM_FILL_TIME_MS) {
      setError('フォームの送信が早すぎます。もう一度お試しください。');
      setSubmitting(false);
      return;
    }

    try {
      // Merge form data with tracking data
      const trackingData = getTrackingData();
      const inquiryData = {
        ...formData,
        ...trackingData
      };

      await axios.post(`/api/v1/property_publications/${publicationId}/inquiries`, {
        property_inquiry: inquiryData
      });

      // Track successful inquiry submission
      PropertyAnalytics.submitInquiry(publicationId, trackingData.source);

      setSuccess(true);
      // Clear form and reset load time
      formStartTrackedRef.current = false; // Reset for potential re-submission
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
      formLoadTimeRef.current = Date.now();
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

      {/* Honeypot field - hidden from humans, visible to bots */}
      <TextField
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        sx={{
          position: 'absolute',
          left: '-9999px',
          opacity: 0,
          height: 0,
          width: 0,
          overflow: 'hidden'
        }}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        name="website_url"
        label="Website"
      />

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
        onFocus={handleFormStart}
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
