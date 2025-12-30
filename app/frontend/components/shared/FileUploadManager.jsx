/**
 * File Upload Manager Component
 * Provides drop zone, file list, and upload progress UI
 */

import React, { useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  Stack,
  Chip,
  Alert
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  Delete as DeleteIcon,
  Refresh as RetryIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useDropZone } from '../../hooks/useDragDrop';
import { useMultiFileUpload, UPLOAD_STATUS } from '../../hooks/useFileUpload';
import { formatFileSize, getFileIcon } from '../../utils/fileUploadUtils';

// Icon mapping
const FILE_ICONS = {
  image: ImageIcon,
  video: VideoIcon,
  audio: AudioIcon,
  pdf: PdfIcon,
  word: DocIcon,
  excel: DocIcon,
  text: DocIcon,
  file: FileIcon
};

/**
 * File item component
 */
function FileItem({ item, onRemove }) {
  const IconComponent = FILE_ICONS[getFileIcon(item.file)] || FileIcon;

  const getStatusIcon = () => {
    switch (item.status) {
      case UPLOAD_STATUS.SUCCESS:
        return <SuccessIcon color="success" fontSize="small" />;
      case UPLOAD_STATUS.ERROR:
        return <ErrorIcon color="error" fontSize="small" />;
      case UPLOAD_STATUS.UPLOADING:
        return null;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (item.status) {
      case UPLOAD_STATUS.SUCCESS:
        return 'success';
      case UPLOAD_STATUS.ERROR:
        return 'error';
      case UPLOAD_STATUS.UPLOADING:
        return 'primary';
      default:
        return 'default';
    }
  };

  return (
    <ListItem
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 1,
        mb: 1,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <ListItemIcon>
        {item.preview ? (
          <Box
            component="img"
            src={item.preview}
            alt={item.name}
            sx={{
              width: 40,
              height: 40,
              objectFit: 'cover',
              borderRadius: 1
            }}
          />
        ) : (
          <IconComponent color="action" />
        )}
      </ListItemIcon>

      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
              {item.name}
            </Typography>
            {getStatusIcon()}
          </Box>
        }
        secondary={
          <Box>
            <Typography variant="caption" color="text.secondary">
              {formatFileSize(item.size)}
            </Typography>
            {item.status === UPLOAD_STATUS.UPLOADING && (
              <LinearProgress
                variant="determinate"
                value={item.progress}
                sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
              />
            )}
            {item.error && (
              <Typography variant="caption" color="error" display="block">
                {item.error}
              </Typography>
            )}
          </Box>
        }
      />

      <ListItemSecondaryAction>
        <Chip
          label={
            item.status === UPLOAD_STATUS.UPLOADING
              ? `${item.progress}%`
              : item.status === UPLOAD_STATUS.SUCCESS
                ? '完了'
                : item.status === UPLOAD_STATUS.ERROR
                  ? 'エラー'
                  : '待機中'
          }
          size="small"
          color={getStatusColor()}
          sx={{ mr: 1 }}
        />
        <IconButton
          edge="end"
          size="small"
          onClick={() => onRemove(item.id)}
          disabled={item.status === UPLOAD_STATUS.UPLOADING}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
}

/**
 * Drop zone component
 */
function DropZone({ onFilesAdded, accept, disabled }) {
  const { isDragOver, getRootProps } = useDropZone({
    accept,
    multiple: true,
    disabled,
    onDropAccepted: onFilesAdded
  });

  return (
    <Paper
      {...getRootProps()}
      sx={{
        p: 4,
        textAlign: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: '2px dashed',
        borderColor: isDragOver ? 'primary.main' : 'divider',
        bgcolor: isDragOver ? 'action.hover' : 'background.default',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: disabled ? 'divider' : 'primary.main',
          bgcolor: disabled ? 'background.default' : 'action.hover'
        }
      }}
    >
      <UploadIcon
        sx={{
          fontSize: 48,
          color: isDragOver ? 'primary.main' : 'action.disabled',
          mb: 1
        }}
      />
      <Typography variant="body1" color="text.secondary">
        ファイルをドラッグ&ドロップ
      </Typography>
      <Typography variant="caption" color="text.secondary">
        またはクリックして選択
      </Typography>
    </Paper>
  );
}

/**
 * File upload manager component
 */
export function FileUploadManager({
  url,
  accept = '*/*',
  maxSize = 10 * 1024 * 1024,
  maxFiles = 10,
  onAllComplete,
  onFileSuccess,
  onFileError,
  showStats = true,
  autoUpload = false
}) {
  const {
    files,
    stats,
    isUploading,
    addFiles,
    removeFile,
    uploadAll,
    retryFailed,
    clearAll,
    clearCompleted,
    hasFiles,
    hasPending,
    hasErrors
  } = useMultiFileUpload({
    url,
    accept,
    maxSize,
    maxFiles,
    onAllComplete,
    onFileSuccess,
    onFileError
  });

  const handleFilesAdded = useCallback(
    (newFiles) => {
      const result = addFiles(newFiles);

      if (autoUpload && result.added > 0) {
        setTimeout(uploadAll, 100);
      }
    },
    [addFiles, autoUpload, uploadAll]
  );

  return (
    <Box>
      {/* Drop zone */}
      <DropZone
        onFilesAdded={handleFilesAdded}
        accept={accept}
        disabled={isUploading || files.length >= maxFiles}
      />

      {/* Stats */}
      {showStats && hasFiles && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label={`合計: ${stats.total}ファイル`} size="small" variant="outlined" />
          <Chip label={`サイズ: ${stats.formattedTotalSize}`} size="small" variant="outlined" />
          {stats.success > 0 && (
            <Chip label={`完了: ${stats.success}`} size="small" color="success" />
          )}
          {stats.error > 0 && (
            <Chip label={`エラー: ${stats.error}`} size="small" color="error" />
          )}
          {stats.pending > 0 && (
            <Chip label={`待機中: ${stats.pending}`} size="small" color="default" />
          )}
        </Box>
      )}

      {/* File list */}
      {hasFiles && (
        <List sx={{ mt: 2 }}>
          {files.map((item) => (
            <FileItem key={item.id} item={item} onRemove={removeFile} />
          ))}
        </List>
      )}

      {/* Actions */}
      {hasFiles && (
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          {hasPending && (
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={uploadAll}
              disabled={isUploading}
            >
              アップロード開始
            </Button>
          )}

          {hasErrors && (
            <Button
              variant="outlined"
              startIcon={<RetryIcon />}
              onClick={retryFailed}
              disabled={isUploading}
            >
              再試行
            </Button>
          )}

          {stats.success > 0 && (
            <Button variant="text" onClick={clearCompleted} disabled={isUploading}>
              完了を削除
            </Button>
          )}

          <Button
            variant="text"
            color="error"
            startIcon={<CloseIcon />}
            onClick={clearAll}
            disabled={isUploading}
          >
            すべて削除
          </Button>
        </Stack>
      )}

      {/* Overall progress */}
      {isUploading && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            アップロード中... ({stats.success + stats.uploading}/{stats.total})
          </Typography>
          <LinearProgress
            variant="determinate"
            value={stats.overallProgress}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      )}
    </Box>
  );
}

/**
 * Compact file input component
 */
export function FileInput({
  value,
  onChange,
  accept = '*/*',
  maxSize,
  label = 'ファイルを選択',
  error,
  helperText,
  disabled = false
}) {
  const { getRootProps, openFileDialog } = useDropZone({
    accept,
    maxSize,
    multiple: false,
    disabled,
    onDropAccepted: (files) => {
      if (files.length > 0) {
        onChange?.(files[0]);
      }
    }
  });

  return (
    <Box>
      <Button
        variant="outlined"
        onClick={openFileDialog}
        disabled={disabled}
        startIcon={<UploadIcon />}
        sx={{ width: '100%' }}
      >
        {value ? value.name : label}
      </Button>

      {value && (
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {formatFileSize(value.size)}
          </Typography>
          <IconButton
            size="small"
            onClick={() => onChange?.(null)}
            disabled={disabled}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {helperText || error}
        </Alert>
      )}
    </Box>
  );
}

export default FileUploadManager;
