import React, { useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper,
} from "@mui/material";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';

export default function FloorplanUploadStep({
  pdfFile,
  onFileChange,
  analyzing,
  analyzed,
  onAnalyze,
  onSkip,
  error,
}) {
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      if (files[0].type === 'application/pdf') {
        onFileChange(files[0]);
      }
    }
  }, [onFileChange]);

  const handleFileSelect = useCallback((e) => {
    const files = e.target.files;
    if (files && files[0]) {
      onFileChange(files[0]);
    }
  }, [onFileChange]);

  const handleRemove = useCallback(() => {
    onFileChange(null);
  }, [onFileChange]);

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        募集図面（マイソク）をアップロード
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        募集図面PDFをアップロードすると、AIが建物情報と部屋情報を自動で抽出します。
        図面がない場合は「スキップして手入力」をクリックしてください。
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!pdfFile ? (
        <Paper
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          sx={{
            p: 4,
            border: '2px dashed',
            borderColor: 'grey.300',
            borderRadius: 2,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: 'grey.50',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'primary.50',
            },
          }}
          onClick={() => document.getElementById('floorplan-upload').click()}
        >
          <input
            id="floorplan-upload"
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <CloudUploadIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            PDFをドラッグ&ドロップ
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            または
          </Typography>
          <Button variant="outlined" startIcon={<PictureAsPdfIcon />}>
            ファイルを選択
          </Button>
        </Paper>
      ) : (
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PictureAsPdfIcon sx={{ fontSize: 48, color: 'error.main' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                {pdfFile.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
              </Typography>
            </Box>
            {analyzed ? (
              <CheckCircleIcon sx={{ fontSize: 32, color: 'success.main' }} />
            ) : (
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<DeleteIcon />}
                onClick={handleRemove}
                disabled={analyzing}
              >
                削除
              </Button>
            )}
          </Box>

          {analyzed && (
            <Alert severity="success" sx={{ mt: 2 }}>
              AI解析が完了しました。建物情報と部屋情報を抽出しました。
            </Alert>
          )}

          {!analyzed && (
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={onAnalyze}
                disabled={analyzing}
                startIcon={analyzing ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {analyzing ? 'AI解析中...' : 'AI解析を実行'}
              </Button>
            </Box>
          )}
        </Paper>
      )}

      {!pdfFile && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            図面がない場合
          </Typography>
          <Button variant="text" onClick={onSkip}>
            スキップして手入力
          </Button>
        </Box>
      )}
    </Box>
  );
}
