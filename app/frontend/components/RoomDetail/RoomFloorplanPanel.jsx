import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Description as DescriptionIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  OpenInNew as OpenInNewIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

export default function RoomFloorplanPanel({
  roomId,
  floorplanPdfUrl,
  floorplanPdfFilename,
  onFloorplanUpdate,
}) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpload = async (file) => {
    if (!file) return;

    // PDFファイルチェック
    if (file.type !== 'application/pdf') {
      alert('PDFファイルのみアップロード可能です');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/v1/rooms/${roomId}/upload_floorplan`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onFloorplanUpdate?.(data.floorplan_pdf_url, data.floorplan_pdf_filename);
      } else {
        const error = await response.json();
        alert(error.error || 'アップロードに失敗しました');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('ネットワークエラーが発生しました');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('募集図面を削除してもよろしいですか？')) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/v1/rooms/${roomId}/delete_floorplan`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        onFloorplanUpdate?.(null, null);
      } else {
        const error = await response.json();
        alert(error.error || '削除に失敗しました');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('ネットワークエラーが発生しました');
    } finally {
      setDeleting(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        mb: 2,
      }}
    >
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DescriptionIcon color="primary" />
          <Typography variant="subtitle1" fontWeight="bold">
            募集図面
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {floorplanPdfUrl && (
            <>
              <Tooltip title="新しいタブで開く">
                <IconButton
                  size="small"
                  onClick={() => window.open(floorplanPdfUrl, '_blank')}
                >
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="ダウンロード">
                <IconButton
                  size="small"
                  component="a"
                  href={floorplanPdfUrl}
                  download={floorplanPdfFilename}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="削除">
                <IconButton
                  size="small"
                  onClick={handleDelete}
                  disabled={deleting}
                  color="error"
                >
                  {deleting ? <CircularProgress size={18} /> : <DeleteIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>

      {/* PDFプレビューまたはアップロードエリア */}
      {floorplanPdfUrl ? (
        <Box
          sx={{
            width: '100%',
            height: 400,
            bgcolor: '#f5f5f5',
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          <embed
            src={floorplanPdfUrl}
            type="application/pdf"
            width="100%"
            height="100%"
            style={{ border: 'none' }}
          />
        </Box>
      ) : (
        <Box
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          sx={{
            width: '100%',
            height: 200,
            border: '2px dashed',
            borderColor: dragActive ? 'primary.main' : 'grey.300',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: dragActive ? 'action.hover' : 'grey.50',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'action.hover',
            },
          }}
        >
          {uploading ? (
            <CircularProgress />
          ) : (
            <>
              <CloudUploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
              <Typography color="text.secondary">
                PDFファイルをドラッグ＆ドロップ
              </Typography>
              <Typography variant="caption" color="text.secondary">
                またはクリックしてファイルを選択
              </Typography>
            </>
          )}
        </Box>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {/* ファイル名表示 */}
      {floorplanPdfFilename && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          ファイル名: {floorplanPdfFilename}
        </Typography>
      )}

      {/* 差し替えボタン */}
      {floorplanPdfUrl && (
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'アップロード中...' : '差し替え'}
          </Button>
        </Box>
      )}
    </Paper>
  );
}
