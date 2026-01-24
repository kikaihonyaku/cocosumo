import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

import BulkUploadStep from '../components/BulkImport/BulkUploadStep';
import BulkAnalysisProgress from '../components/BulkImport/BulkAnalysisProgress';
import BulkItemList from '../components/BulkImport/BulkItemList';
import BulkConfirmation from '../components/BulkImport/BulkConfirmation';

const steps = ['PDFアップロード', '解析結果確認', '登録確認'];

export default function BulkImport() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Import history state
  const [historyId, setHistoryId] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [isAsync, setIsAsync] = useState(false);

  // Polling interval for async analysis
  const [polling, setPolling] = useState(false);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Fetch history data
  const fetchHistory = useCallback(async (id) => {
    try {
      const response = await fetch(`/api/v1/bulk_imports/${id}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return null;
      }

      if (response.ok) {
        const data = await response.json();
        setHistoryData(data);
        return data;
      } else {
        const data = await response.json();
        setError(data.error || '履歴の取得に失敗しました');
        return null;
      }
    } catch (err) {
      console.error('Fetch history error:', err);
      setError('ネットワークエラーが発生しました');
      return null;
    }
  }, []);

  // Poll for analysis progress
  const startPolling = useCallback((id) => {
    setPolling(true);
    const poll = async () => {
      const data = await fetchHistory(id);
      if (data) {
        if (data.status === 'confirming' || data.status === 'completed' || data.status === 'failed') {
          setPolling(false);
          if (data.status === 'confirming') {
            setActiveStep(1);
          } else if (data.status === 'failed') {
            setError('解析に失敗しました');
          }
          return;
        }
      }
      // Continue polling
      setTimeout(poll, 2000);
    };
    poll();
  }, [fetchHistory]);

  // Handle file upload
  const handleUpload = async (files) => {
    if (files.length === 0) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files[]', file);
      });

      const response = await fetch('/api/v1/bulk_imports', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      const data = await response.json();

      if (response.ok && data.success) {
        setHistoryId(data.id);
        setIsAsync(data.async);

        if (data.async) {
          // Start polling for async analysis
          showSnackbar('解析ジョブを開始しました。完了までお待ちください。', 'info');
          startPolling(data.id);
        } else {
          // Sync analysis completed, fetch results
          await fetchHistory(data.id);
          showSnackbar('解析が完了しました', 'success');
          setActiveStep(1);
        }
      } else {
        setError(data.error || 'アップロードに失敗しました');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // Handle item edit
  const handleItemEdit = async (itemId, editedData, selectedBuildingId) => {
    try {
      const response = await fetch(`/api/v1/bulk_imports/${historyId}/items/${itemId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edited_data: editedData,
          selected_building_id: selectedBuildingId,
        }),
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return false;
      }

      if (response.ok) {
        // Refresh history data
        await fetchHistory(historyId);
        return true;
      } else {
        const data = await response.json();
        showSnackbar(data.error || '更新に失敗しました', 'error');
        return false;
      }
    } catch (err) {
      console.error('Edit error:', err);
      showSnackbar('ネットワークエラーが発生しました', 'error');
      return false;
    }
  };

  // Handle registration
  const handleRegister = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/v1/bulk_imports/${historyId}/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      const data = await response.json();

      if (response.ok && data.success) {
        showSnackbar(`登録が完了しました（建物: ${data.buildings_created}件新規 / ${data.buildings_matched}件既存追加、部屋: ${data.rooms_created}件）`, 'success');
        // Navigate back to map
        setTimeout(() => {
          navigate('/map');
        }, 2000);
      } else {
        setError(data.error || '登録に失敗しました');
      }
    } catch (err) {
      console.error('Register error:', err);
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // Navigation
  const handleNext = () => {
    if (activeStep === 1) {
      setActiveStep(2);
    }
  };

  const handleBack = () => {
    if (activeStep === 1) {
      setActiveStep(0);
      setHistoryId(null);
      setHistoryData(null);
    } else if (activeStep === 2) {
      setActiveStep(1);
    }
  };

  // Check if can proceed
  const canProceed = () => {
    if (activeStep === 1) {
      // At least one analyzed item
      return historyData?.items?.some(item => item.status === 'analyzed');
    }
    return true;
  };

  // Render step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        if (polling && historyData) {
          return (
            <BulkAnalysisProgress
              historyData={historyData}
            />
          );
        }
        return (
          <BulkUploadStep
            onUpload={handleUpload}
            loading={loading}
            error={error}
          />
        );
      case 1:
        return (
          <BulkItemList
            items={historyData?.items || []}
            onItemEdit={handleItemEdit}
          />
        );
      case 2:
        return (
          <BulkConfirmation
            historyData={historyData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/map')} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          一括物件登録
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        複数のPDFファイル（募集図面）をまとめてアップロードし、AI解析後に一括登録します。
      </Typography>

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Content */}
      <Paper sx={{ p: 3, mb: 3 }}>
        {error && activeStep !== 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {renderStepContent()}
      </Paper>

      {/* Navigation */}
      {activeStep > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            onClick={handleBack}
            disabled={loading || polling}
            startIcon={<ArrowBackIcon />}
          >
            戻る
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            {activeStep === 1 && (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || loading}
                variant="contained"
                endIcon={<ArrowForwardIcon />}
              >
                次へ
              </Button>
            )}

            {activeStep === 2 && (
              <Button
                onClick={handleRegister}
                disabled={loading}
                variant="contained"
                color="primary"
              >
                {loading ? <CircularProgress size={24} /> : '一括登録を実行'}
              </Button>
            )}
          </Box>
        </Box>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
