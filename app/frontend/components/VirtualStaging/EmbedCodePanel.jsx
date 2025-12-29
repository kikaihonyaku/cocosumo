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
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Code as CodeIcon,
  OpenInNew as PreviewIcon,
} from '@mui/icons-material';

/**
 * 埋め込みコード生成パネル
 */
const EmbedCodePanel = ({ publicId, title }) => {
  const [tabValue, setTabValue] = useState(0);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [responsive, setResponsive] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const baseUrl = window.location.origin;
  const embedUrl = `${baseUrl}/embed/virtual-staging/${publicId}`;

  // iframeコード生成
  const iframeCode = useMemo(() => {
    const params = new URLSearchParams();
    if (!showLabels) params.set('labels', 'false');
    const url = params.toString() ? `${embedUrl}?${params}` : embedUrl;

    if (responsive) {
      return `<div style="position: relative; width: 100%; padding-bottom: 75%; overflow: hidden;">
  <iframe
    src="${url}"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
    title="${title}"
    loading="lazy"
    allowfullscreen
  ></iframe>
</div>`;
    }

    return `<iframe
  src="${url}"
  width="${width}"
  height="${height}"
  style="border: none;"
  title="${title}"
  loading="lazy"
  allowfullscreen
></iframe>`;
  }, [embedUrl, width, height, responsive, showLabels, title]);

  // JavaScriptウィジェットコード
  const jsWidgetCode = useMemo(() => {
    const params = new URLSearchParams();
    params.set('id', publicId);
    if (!showLabels) params.set('labels', 'false');
    if (!responsive) {
      params.set('width', width);
      params.set('height', height);
    }

    return `<div id="cocosumo-vs-${publicId}"></div>
<script src="${baseUrl}/embed/virtual-staging.js"></script>
<script>
  CocosumoVS.init({
    container: '#cocosumo-vs-${publicId}',
    publicId: '${publicId}',
    responsive: ${responsive},
    ${!responsive ? `width: ${width},\n    height: ${height},` : ''}
    showLabels: ${showLabels}
  });
</script>`;
  }, [publicId, baseUrl, width, height, responsive, showLabels]);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
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
        外部Webサイトにバーチャルステージングを埋め込むことができます
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
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
              />
            }
            label="Before/Afterラベルを表示"
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

      {/* コード表示タブ */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="iframe" icon={<CodeIcon />} iconPosition="start" />
          <Tab label="JavaScript" icon={<CodeIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* iframeコード */}
      {tabValue === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <Button
              size="small"
              startIcon={<CopyIcon />}
              onClick={() => handleCopy(iframeCode)}
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
      )}

      {/* JavaScriptウィジェットコード */}
      {tabValue === 1 && (
        <Box>
          <Alert severity="warning" sx={{ mb: 1, fontSize: '0.75rem' }}>
            JavaScript埋め込みは準備中です。iframeをご利用ください。
          </Alert>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <Button
              size="small"
              startIcon={<CopyIcon />}
              onClick={() => handleCopy(jsWidgetCode)}
              disabled
            >
              コピー
            </Button>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={10}
            value={jsWidgetCode}
            InputProps={{
              readOnly: true,
              sx: {
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                bgcolor: 'grey.100',
                opacity: 0.7,
              },
            }}
          />
        </Box>
      )}

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
