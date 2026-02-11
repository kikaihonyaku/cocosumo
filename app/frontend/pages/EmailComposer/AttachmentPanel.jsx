import React, { useRef } from 'react';
import {
  Box, Typography, Chip, Button, LinearProgress
} from '@mui/material';
import {
  AttachFile as AttachIcon,
  Close as CloseIcon,
  Add as AddIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ACCEPT_TYPES = '.pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.csv,.txt';

export default function AttachmentPanel({
  attachments,
  onAddAttachments,
  onRemoveAttachment,
  totalAttachmentSize,
  isMobile
}) {
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer?.files;
    if (files?.length > 0) {
      onAddAttachments(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileSelect = (e) => {
    if (e.target.files?.length > 0) {
      onAddAttachments(e.target.files);
      e.target.value = '';
    }
  };

  const maxTotal = 25 * 1024 * 1024;
  const usagePercent = (totalAttachmentSize / maxTotal) * 100;

  return (
    <Box
      sx={{
        px: 2,
        py: 1,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'grey.50',
        flexShrink: 0,
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: attachments.length > 0 ? 0.5 : 0 }}>
        <AttachIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          添付ファイル
        </Typography>

        {attachments.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            ({attachments.length}/10 ・ {formatFileSize(totalAttachmentSize)}/25MB)
          </Typography>
        )}

        <Box sx={{ flex: 1 }} />

        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={attachments.length >= 10}
          sx={{ fontSize: '0.75rem' }}
        >
          ファイルを追加
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPT_TYPES}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </Box>

      {attachments.length > 0 && (
        <>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
            {attachments.map((file, index) => (
              <Chip
                key={`${file.name}-${index}`}
                icon={<FileIcon sx={{ fontSize: 14 }} />}
                label={`${file.name} (${formatFileSize(file.size)})`}
                onDelete={() => onRemoveAttachment(index)}
                deleteIcon={<CloseIcon sx={{ fontSize: 14 }} />}
                size="small"
                variant="outlined"
                sx={{ height: 24, fontSize: '0.75rem', maxWidth: isMobile ? 200 : 300 }}
              />
            ))}
          </Box>
          {usagePercent > 50 && (
            <LinearProgress
              variant="determinate"
              value={Math.min(usagePercent, 100)}
              color={usagePercent > 90 ? 'error' : 'primary'}
              sx={{ height: 2, borderRadius: 1 }}
            />
          )}
        </>
      )}

      {attachments.length === 0 && (
        <Box
          sx={{
            border: '1px dashed',
            borderColor: 'grey.300',
            borderRadius: 1,
            py: 1.5,
            textAlign: 'center',
            cursor: 'pointer',
            '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
            transition: 'all 0.15s',
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <Typography variant="caption" color="text.secondary">
            ここにファイルをドラッグ&ドロップ、またはクリックして追加
          </Typography>
        </Box>
      )}
    </Box>
  );
}
