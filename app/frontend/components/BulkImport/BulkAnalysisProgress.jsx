import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
  Loop as AnalyzingIcon,
} from '@mui/icons-material';

const getStatusIcon = (status) => {
  switch (status) {
    case 'analyzed':
      return <CheckCircleIcon color="success" />;
    case 'error':
      return <ErrorIcon color="error" />;
    case 'analyzing':
      return <AnalyzingIcon color="primary" sx={{ animation: 'spin 1s linear infinite' }} />;
    default:
      return <PendingIcon color="disabled" />;
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'analyzed':
      return '完了';
    case 'error':
      return 'エラー';
    case 'analyzing':
      return '解析中';
    default:
      return '待機中';
  }
};

export default function BulkAnalysisProgress({ historyData }) {
  const { total_files, analyzed_count, progress_percentage, items = [], logs = [] } = historyData || {};

  return (
    <Box>
      {/* Progress bar */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            AI解析中...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {analyzed_count} / {total_files} 件完了
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={progress_percentage || 0}
          sx={{ height: 10, borderRadius: 5 }}
        />

        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
          {progress_percentage || 0}%
        </Typography>
      </Paper>

      {/* Item list */}
      <Paper sx={{ mb: 3 }}>
        <List>
          {items.map((item, index) => (
            <ListItem key={item.id} divider={index < items.length - 1}>
              <ListItemIcon>
                {getStatusIcon(item.status)}
              </ListItemIcon>
              <ListItemText
                primary={item.original_filename}
                secondary={
                  item.status === 'error' ? item.error_message : null
                }
              />
              <Chip
                label={getStatusLabel(item.status)}
                size="small"
                color={
                  item.status === 'analyzed' ? 'success' :
                  item.status === 'error' ? 'error' :
                  item.status === 'analyzing' ? 'primary' : 'default'
                }
                variant={item.status === 'pending' ? 'outlined' : 'filled'}
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Logs */}
      {logs.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            実行ログ
          </Typography>
          <Box
            sx={{
              bgcolor: 'grey.900',
              color: 'grey.100',
              p: 2,
              borderRadius: 1,
              maxHeight: 200,
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
            }}
          >
            {logs.map((log, index) => (
              <Box
                key={index}
                sx={{
                  color: log.type === 'error' ? 'error.light' :
                         log.type === 'success' ? 'success.light' :
                         'grey.300',
                  mb: 0.5,
                }}
              >
                <span style={{ color: '#888' }}>[{log.timestamp}]</span> {log.message}
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </Box>
  );
}
