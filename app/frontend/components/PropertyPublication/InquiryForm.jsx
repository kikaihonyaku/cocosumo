import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  Send as SendIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import axios from 'axios';
import { PropertyAnalytics } from '../../services/analytics';

// Phone number formatting for Japanese numbers
const formatPhoneNumber = (value) => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');

  // Format based on length and pattern
  if (digits.length === 0) return '';

  // Mobile numbers (080, 090, 070)
  if (/^0[789]0/.test(digits)) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  }

  // Tokyo (03)
  if (digits.startsWith('03')) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  }

  // Other landlines (0X-XXXX-XXXX pattern)
  if (digits.startsWith('0')) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  }

  return digits;
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number format (Japanese)
const isValidPhone = (phone) => {
  if (!phone) return true; // Optional field
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 11;
};

// LocalStorage key for form recovery
const getStorageKey = (publicationId) => `inquiry_form_${publicationId}`;

export default function InquiryForm({ publicationId, sourceType = 'public_page' }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  // Track touched fields for validation display
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    message: false
  });

  // Spam prevention: honeypot field and form load timestamp
  const [honeypot, setHoneypot] = useState('');
  const formLoadTimeRef = useRef(Date.now());
  const MIN_FORM_FILL_TIME_MS = 3000; // Minimum 3 seconds to fill form

  // Track if form start has been recorded
  const formStartTrackedRef = useRef(false);

  // Load saved form data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(getStorageKey(publicationId));
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(parsed);
      } catch (e) {
        // Invalid data, ignore
      }
    }
  }, [publicationId]);

  // Save form data to localStorage when it changes
  useEffect(() => {
    if (formData.name || formData.email || formData.phone || formData.message) {
      localStorage.setItem(getStorageKey(publicationId), JSON.stringify(formData));
    }
  }, [formData, publicationId]);

  // Clear saved form data
  const clearSavedFormData = useCallback(() => {
    localStorage.removeItem(getStorageKey(publicationId));
  }, [publicationId]);

  // Calculate form completion progress
  const getCompletionProgress = () => {
    const requiredFields = ['name', 'email', 'message'];
    const completed = requiredFields.filter(field => formData[field].trim() !== '').length;
    return (completed / requiredFields.length) * 100;
  };

  // Validate a single field
  const validateField = useCallback((field, value) => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'お名前を入力してください';
        if (value.trim().length < 2) return 'お名前は2文字以上で入力してください';
        return '';
      case 'email':
        if (!value.trim()) return 'メールアドレスを入力してください';
        if (!isValidEmail(value)) return '有効なメールアドレスを入力してください';
        return '';
      case 'phone':
        if (value && !isValidPhone(value)) return '有効な電話番号を入力してください';
        return '';
      case 'message':
        if (!value.trim()) return 'お問い合わせ内容を入力してください';
        if (value.trim().length < 10) return 'お問い合わせ内容は10文字以上で入力してください';
        return '';
      default:
        return '';
    }
  }, []);

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
    let value = event.target.value;

    // Auto-format phone number
    if (field === 'phone') {
      value = formatPhoneNumber(value);
    }

    setFormData({
      ...formData,
      [field]: value
    });

    // Validate on change if field was already touched
    if (touched[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: validateField(field, value)
      }));
    }
  };

  // Handle field blur for validation
  const handleBlur = (field) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setFieldErrors(prev => ({
      ...prev,
      [field]: validateField(field, formData[field])
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate all fields before submission
    const newErrors = {
      name: validateField('name', formData.name),
      email: validateField('email', formData.email),
      phone: validateField('phone', formData.phone),
      message: validateField('message', formData.message)
    };

    setFieldErrors(newErrors);
    setTouched({ name: true, email: true, phone: true, message: true });

    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some(error => error !== '');
    if (hasErrors) {
      setError('入力内容を確認してください');
      return;
    }

    setSubmitting(true);
    setSuccess(false);

    // Spam check 1: Honeypot field should be empty (bots often fill all fields)
    if (honeypot) {
      // Silently reject but show success to prevent bot from knowing
      setSuccess(true);
      setSubmitting(false);
      clearSavedFormData();
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
        ...trackingData,
        source_type: sourceType,
        source_url: window.location.href
      };

      await axios.post(`/api/v1/property_publications/${publicationId}/property_inquiries`, {
        property_inquiry: inquiryData
      });

      // Track successful inquiry submission
      PropertyAnalytics.submitInquiry(publicationId, trackingData.source);

      setSuccess(true);
      // Clear form and saved data
      clearSavedFormData();
      formStartTrackedRef.current = false; // Reset for potential re-submission
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
      setTouched({ name: false, email: false, phone: false, message: false });
      setFieldErrors({ name: '', email: '', phone: '', message: '' });
      formLoadTimeRef.current = Date.now();
    } catch (err) {
      console.error('Error submitting inquiry:', err);
      setError('お問い合わせの送信に失敗しました。もう一度お試しください。');
    } finally {
      setSubmitting(false);
    }
  };

  // Check if form is valid for submit button state
  const isFormValid = () => {
    return formData.name.trim().length >= 2 &&
           isValidEmail(formData.email) &&
           (!formData.phone || isValidPhone(formData.phone)) &&
           formData.message.trim().length >= 10;
  };

  const completionProgress = getCompletionProgress();

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">
          お問い合わせ
        </Typography>
        {completionProgress > 0 && completionProgress < 100 && (
          <Chip
            size="small"
            label={`${Math.round(completionProgress)}% 入力済み`}
            color="primary"
            variant="outlined"
            sx={{ height: 24 }}
          />
        )}
        {completionProgress === 100 && (
          <Chip
            size="small"
            icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
            label="入力完了"
            color="success"
            variant="outlined"
            sx={{ height: 24 }}
          />
        )}
      </Box>

      {/* Progress bar */}
      <LinearProgress
        variant="determinate"
        value={completionProgress}
        sx={{
          mb: 2,
          height: 4,
          borderRadius: 2,
          bgcolor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            borderRadius: 2,
            bgcolor: completionProgress === 100 ? 'success.main' : 'primary.main'
          }
        }}
      />

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
        <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircleIcon />}>
          <Typography variant="body2" fontWeight={600}>
            お問い合わせを送信しました
          </Typography>
          <Typography variant="caption" color="text.secondary">
            担当者より折り返しご連絡いたします（通常1営業日以内）
          </Typography>
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
        onBlur={handleBlur('name')}
        required
        margin="normal"
        size="small"
        disabled={submitting}
        error={touched.name && Boolean(fieldErrors.name)}
        helperText={touched.name && fieldErrors.name}
        inputProps={{
          'aria-describedby': 'name-helper-text',
          'aria-invalid': touched.name && Boolean(fieldErrors.name)
        }}
      />

      <TextField
        fullWidth
        label="メールアドレス"
        type="email"
        value={formData.email}
        onChange={handleChange('email')}
        onBlur={handleBlur('email')}
        required
        margin="normal"
        size="small"
        disabled={submitting}
        error={touched.email && Boolean(fieldErrors.email)}
        helperText={touched.email && fieldErrors.email}
        inputProps={{
          'aria-describedby': 'email-helper-text',
          'aria-invalid': touched.email && Boolean(fieldErrors.email)
        }}
      />

      <TextField
        fullWidth
        label="電話番号（任意）"
        value={formData.phone}
        onChange={handleChange('phone')}
        onBlur={handleBlur('phone')}
        margin="normal"
        size="small"
        disabled={submitting}
        placeholder="03-1234-5678"
        error={touched.phone && Boolean(fieldErrors.phone)}
        helperText={touched.phone && fieldErrors.phone ? fieldErrors.phone : '自動でハイフンが入力されます'}
        inputProps={{
          inputMode: 'tel',
          'aria-describedby': 'phone-helper-text'
        }}
      />

      <TextField
        fullWidth
        label="お問い合わせ内容"
        value={formData.message}
        onChange={handleChange('message')}
        onBlur={handleBlur('message')}
        required
        multiline
        rows={4}
        margin="normal"
        size="small"
        disabled={submitting}
        placeholder="内見希望日時、ご質問などをご記入ください"
        error={touched.message && Boolean(fieldErrors.message)}
        helperText={
          touched.message && fieldErrors.message
            ? fieldErrors.message
            : `${formData.message.length}/10文字以上`
        }
        inputProps={{
          'aria-describedby': 'message-helper-text',
          'aria-invalid': touched.message && Boolean(fieldErrors.message)
        }}
      />

      <Button
        fullWidth
        type="submit"
        variant="contained"
        color="primary"
        disabled={submitting || !isFormValid()}
        startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
        sx={{
          mt: 2,
          py: 1.5,
          fontSize: '1rem',
          fontWeight: 600
        }}
      >
        {submitting ? '送信中...' : 'お問い合わせを送信'}
      </Button>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
        * は必須項目です
      </Typography>
    </Box>
  );
}
