import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Alert,
  Snackbar,
  Slider,
  FormControlLabel,
  Switch,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Code as CodeIcon,
  OpenInNew as PreviewIcon,
} from '@mui/icons-material';

/**
 * VRツアー埋め込みコード生成パネル
 */
const EmbedCodePanel = ({ publicId, title }) => {
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [responsive, setResponsive] = useState(true);
  const [autoplay, setAutoplay] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const baseUrl = window.location.origin;
  const embedUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (autoplay) params.set('autoplay', 'true');
    const paramStr = params.toString();
    return `${baseUrl}/embed/vr/${publicId}${paramStr ? `?${paramStr}` : ''}`;
  }, [baseUrl, publicId, autoplay]);

  // iframeコード生成
  const iframeCode = useMemo(() => {
    if (responsive) {
      return `<div style="position: relative; width: 100%; padding-bottom: 56.25%; overflow: hidden;">
  <iframe
    src="${embedUrl}"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
    title="${title || 'VRツアー'}"
    loading="lazy"
    allowfullscreen
  ></iframe>
</div>`;
    }

    return `<iframe
  src="${embedUrl}"
  width="${width}"
  height="${height}"
  style="border: none;"
  title="${title || 'VRツアー'}"
  loading="lazy"
  allowfullscreen
></iframe>`;
  }, [embedUrl, width, height, responsive, title]);

  const handleCopy = () => {
    navigator.clipboard.writeText(iframeCode);
    setSnackbar({ open: true, message: 'コードをコピーしました' });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenPreview = () => {
    window.open(embedUrl, '_blank', 'width=900,height=700');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="600">
          埋め込みコード
        </Typography>
        <Tooltip title="プレビュー">
          <IconButton onClick={handleOpenPreview} color="primary">
            <PreviewIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        外部WebサイトにVRツアーを埋め込むことができます
      </Alert>

      {/* オプション設定 */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="body2" fontWeight="500" gutterBottom>
          表示オプション
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={responsive}
                onChange={(e) => setResponsive(e.target.checked)}
              />
            }
            label="レスポンシブ（幅100%）"
          />
          <FormControlLabel
            control={
              <Switch
                checked={autoplay}
                onChange={(e) => setAutoplay(e.target.checked)}
              />
            }
            label="オートプレイ（自動再生）"
          />

          {!responsive && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  幅: {width}px
                </Typography>
                <Slider
                  value={width}
                  onChange={(e, v) => setWidth(v)}
                  min={300}
                  max={1200}
                  step={50}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  高さ: {height}px
                </Typography>
                <Slider
                  value={height}
                  onChange={(e, v) => setHeight(v)}
                  min={200}
                  max={900}
                  step={50}
                />
              </Box>
            </Box>
          )}
        </Box>
      </Paper>

      {/* コード表示 */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button
            size="small"
            startIcon={<CopyIcon />}
            onClick={handleCopy}
          >
            コピー
          </Button>
        </Box>
        <TextField
          fullWidth
          multiline
          rows={responsive ? 10 : 8}
          value={iframeCode}
          InputProps={{
            readOnly: true,
            sx: {
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              bgcolor: 'grey.50',
            },
          }}
        />
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default EmbedCodePanel;
