import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';

const MAX_FILES = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function BulkUploadStep({ onUpload, loading, error }) {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // Validate files
  const validateFiles = useCallback((fileList) => {
    const errors = [];
    const validFiles = [];

    Array.from(fileList).forEach(file => {
      if (file.type !== 'application/pdf') {
        errors.push(`${file.name}: PDFファイルのみアップロード可能です`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: 10MB以下のファイルのみアップロード可能です`);
        return;
      }
      validFiles.push(file);
    });

    return { validFiles, errors };
  }, []);

  // Handle file drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);

    const { validFiles, errors } = validateFiles(e.dataTransfer.files);
    setValidationErrors(errors);

    if (validFiles.length > 0) {
      const newFiles = [...files, ...validFiles].slice(0, MAX_FILES);
      setFiles(newFiles);
    }
  }, [files, validateFiles]);

  // Handle file input change
  const handleFileChange = useCallback((e) => {
    const { validFiles, errors } = validateFiles(e.target.files);
    setValidationErrors(errors);

    if (validFiles.length > 0) {
      const newFiles = [...files, ...validFiles].slice(0, MAX_FILES);
      setFiles(newFiles);
    }
    e.target.value = ''; // Reset input
  }, [files, validateFiles]);

  // Remove file
  const handleRemoveFile = useCallback((index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Handle upload
  const handleUploadClick = useCallback(() => {
    if (files.length > 0) {
      onUpload(files);
    }
  }, [files, onUpload]);

  // Drag handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Box>
      {/* Drop zone */}
      <Paper
        onDrop={handleDrop}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        sx={{
          p: 4,
          textAlign: 'center',
          border: '2px dashed',
          borderColor: dragActive ? 'primary.main' : 'grey.300',
          bgcolor: dragActive ? 'primary.50' : 'grey.50',
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'primary.50',
          },
        }}
        onClick={() => document.getElementById('file-input').click()}
      >
        <input
          id="file-input"
          type="file"
          accept="application/pdf"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <CloudUploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />

        <Typography variant="h6" gutterBottom>
          PDFファイルをドラッグ＆ドロップ
        </Typography>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          または クリックしてファイルを選択
        </Typography>

        <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Chip label={`最大${MAX_FILES}ファイル`} size="small" />
          <Chip label="各10MB以下" size="small" />
          <Chip label="PDF形式のみ" size="small" />
        </Box>
      </Paper>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {validationErrors.map((err, i) => (
            <Typography key={i} variant="body2">{err}</Typography>
          ))}
        </Alert>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* File list */}
      {files.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            選択されたファイル ({files.length}件)
          </Typography>

          <Paper variant="outlined">
            <List dense>
              {files.map((file, index) => (
                <ListItem key={index} divider={index < files.length - 1}>
                  <PdfIcon color="error" sx={{ mr: 2 }} />
                  <ListItemText
                    primary={file.name}
                    secondary={formatFileSize(file.size)}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveFile(index)}
                      disabled={loading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleUploadClick}
              disabled={loading || files.length === 0}
              startIcon={loading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
            >
              {loading ? '解析中...' : `${files.length}件のPDFを解析`}
            </Button>

            {files.length <= 5 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                5件以下のため同期処理で即座に解析されます
              </Typography>
            )}

            {files.length > 5 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                6件以上のためバックグラウンドで解析されます
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
