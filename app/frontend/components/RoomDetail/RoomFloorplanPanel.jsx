import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Tooltip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Alert,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Description as DescriptionIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  OpenInNew as OpenInNewIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AutoAwesome as AutoAwesomeIcon,
  Check as CheckIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

// 間取りタイプのラベル
const ROOM_TYPE_LABELS = {
  'studio': 'ワンルーム',
  '1K': '1K',
  '1DK': '1DK',
  '1LDK': '1LDK',
  '2K': '2K',
  '2DK': '2DK',
  '2LDK': '2LDK',
  '3K': '3K',
  '3DK': '3DK',
  '3LDK': '3LDK',
  'other': 'その他',
};

// フィールドラベル
const FIELD_LABELS = {
  room_type: '間取り',
  area: '専有面積',
  rent: '賃料',
  management_fee: '管理費・共益費',
  deposit: '敷金',
  key_money: '礼金',
  direction: '向き',
  floor: '階数',
  facilities: '設備',
  parking_fee: '駐車場料金',
  available_date: '入居可能日',
  pets_allowed: 'ペット可',
  guarantor_required: '保証人',
  two_person_allowed: '二人入居可',
  description: '物件説明',
};

export default function RoomFloorplanPanel({
  roomId,
  floorplanPdfUrl,
  floorplanPdfFilename,
  floorplanThumbnailUrl,
  onFloorplanUpdate,
  onRoomDataExtracted,
  expanded: controlledExpanded,
  onExpandedChange,
}) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // AI解析関連
  const [analyzing, setAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [selectedFields, setSelectedFields] = useState({});

  // 親から制御される場合はcontrolledExpanded、そうでなければローカルステート
  const [localExpanded, setLocalExpanded] = useState(true);
  const isControlled = controlledExpanded !== undefined;
  const expanded = isControlled ? controlledExpanded : localExpanded;

  const handleExpandToggle = () => {
    const newExpanded = !expanded;
    if (isControlled) {
      onExpandedChange?.(newExpanded);
    } else {
      setLocalExpanded(newExpanded);
    }
  };

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
        onFloorplanUpdate?.(data.floorplan_pdf_url, data.floorplan_pdf_filename, data.floorplan_thumbnail_url);
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
        onFloorplanUpdate?.(null, null, null);
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

  // サムネイルを再生成
  const handleRegenerateThumbnail = async () => {
    setRegenerating(true);
    try {
      const response = await fetch(`/api/v1/rooms/${roomId}/regenerate_floorplan_thumbnail`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        onFloorplanUpdate?.(floorplanPdfUrl, floorplanPdfFilename, data.floorplan_thumbnail_url);
      } else {
        const error = await response.json();
        alert(error.error || 'サムネイルの再生成に失敗しました');
      }
    } catch (err) {
      console.error('Regenerate thumbnail error:', err);
      alert('ネットワークエラーが発生しました');
    } finally {
      setRegenerating(false);
    }
  };

  // AI解析を実行
  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch(`/api/v1/rooms/${roomId}/analyze_floorplan`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setExtractedData(data.extracted_data);
        // 初期状態で全フィールドを選択
        const initialSelected = {};
        Object.keys(data.extracted_data).forEach(key => {
          if (data.extracted_data[key] !== null && FIELD_LABELS[key]) {
            initialSelected[key] = true;
          }
        });
        setSelectedFields(initialSelected);
        setAnalysisDialogOpen(true);
      } else {
        setAnalysisError(data.error || '解析に失敗しました');
        setAnalysisDialogOpen(true);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setAnalysisError('ネットワークエラーが発生しました');
      setAnalysisDialogOpen(true);
    } finally {
      setAnalyzing(false);
    }
  };

  // フィールド選択の切り替え
  const handleFieldToggle = (field) => {
    setSelectedFields(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // 全選択/全解除
  const handleSelectAll = (selectAll) => {
    const newSelected = {};
    Object.keys(extractedData || {}).forEach(key => {
      if (extractedData[key] !== null && FIELD_LABELS[key]) {
        newSelected[key] = selectAll;
      }
    });
    setSelectedFields(newSelected);
  };

  // 選択したデータを適用
  const handleApplyData = () => {
    if (!extractedData || !onRoomDataExtracted) return;

    const dataToApply = {};
    Object.keys(selectedFields).forEach(key => {
      if (selectedFields[key] && extractedData[key] !== null) {
        dataToApply[key] = extractedData[key];
      }
    });

    onRoomDataExtracted(dataToApply);
    setAnalysisDialogOpen(false);
  };

  // 値を表示用にフォーマット
  const formatValue = (key, value) => {
    if (value === null || value === undefined) return '-';

    switch (key) {
      case 'room_type':
        return ROOM_TYPE_LABELS[value] || value;
      case 'area':
        return `${value} ㎡`;
      case 'rent':
      case 'management_fee':
      case 'deposit':
      case 'key_money':
      case 'parking_fee':
        return value === 0 ? 'なし' : `${value.toLocaleString()} 円`;
      case 'floor':
        return `${value} 階`;
      case 'pets_allowed':
      case 'two_person_allowed':
        return value ? '可' : '不可';
      case 'guarantor_required':
        return value ? '必要' : '不要';
      default:
        return String(value);
    }
  };

  // 選択されているフィールド数を取得
  const selectedCount = Object.values(selectedFields).filter(Boolean).length;
  const totalFields = Object.keys(extractedData || {}).filter(
    key => extractedData[key] !== null && FIELD_LABELS[key]
  ).length;

  return (
    <Paper
      elevation={3}
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* ヘッダー */}
      <Box
        sx={{
          px: 2,
          py: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid #e0e0e0' : 'none',
          '&:hover': { bgcolor: 'action.hover' },
          flexShrink: 0,
        }}
        onClick={handleExpandToggle}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DescriptionIcon color="primary" />
          <Typography variant="subtitle2" fontWeight={600}>
            募集図面
          </Typography>
          {floorplanPdfFilename && !expanded && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              ({floorplanPdfFilename})
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {floorplanPdfUrl && (
            <>
              <Tooltip title="新しいタブで開く">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(floorplanPdfUrl, '_blank');
                  }}
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
                  onClick={(e) => e.stopPropagation()}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="削除">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  disabled={deleting}
                  color="error"
                >
                  {deleting ? <CircularProgress size={18} /> : <DeleteIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </>
          )}
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Box>
      </Box>

      {/* コンテンツ */}
      {expanded && (
        <Box sx={{ p: 2 }}>
          {/* PDFサムネイルまたはアップロードエリア */}
          {floorplanPdfUrl ? (
            floorplanThumbnailUrl ? (
              // サムネイルがある場合：クリックでPDFを開く
              <Box
                sx={{
                  width: '100%',
                  bgcolor: '#f5f5f5',
                  borderRadius: 1,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                  '&:hover': {
                    '& .overlay': {
                      opacity: 1,
                    },
                  },
                }}
                onClick={() => window.open(floorplanPdfUrl, '_blank')}
              >
                <img
                  src={floorplanThumbnailUrl}
                  alt="募集図面"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                  }}
                />
                {/* ホバー時のオーバーレイ */}
                <Box
                  className="overlay"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <Typography variant="h6" sx={{ color: 'white' }}>
                    クリックでPDFを開く
                  </Typography>
                </Box>
              </Box>
            ) : (
              // サムネイルがない場合：サムネイル生成を促す表示
              <Box
                sx={{
                  width: '100%',
                  height: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: '#fafafa',
                  borderRadius: 1,
                }}
              >
                <DescriptionIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {floorplanPdfFilename}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={regenerating ? <CircularProgress size={16} /> : <RefreshIcon />}
                  onClick={handleRegenerateThumbnail}
                  disabled={regenerating}
                >
                  {regenerating ? '生成中...' : 'サムネイルを生成'}
                </Button>
              </Box>
            )
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

          {/* ファイル名表示とアクションボタン */}
          {floorplanPdfUrl && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                ファイル名: {floorplanPdfFilename}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  color="secondary"
                  startIcon={analyzing ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
                  onClick={handleAnalyze}
                  disabled={analyzing}
                >
                  {analyzing ? '解析中...' : 'AI解析'}
                </Button>
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
            </Box>
          )}
        </Box>
      )}

      {/* AI解析結果ダイアログ */}
      <Dialog
        open={analysisDialogOpen}
        onClose={() => setAnalysisDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon color="secondary" />
          募集図面 AI解析結果
        </DialogTitle>
        <DialogContent>
          {analysisError ? (
            <Alert severity="error" sx={{ mt: 1 }}>
              {analysisError}
            </Alert>
          ) : extractedData ? (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                適用したい項目にチェックを入れて「適用」ボタンを押してください。
              </Alert>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {selectedCount} / {totalFields} 項目選択中
                </Typography>
                <Box>
                  <Button size="small" onClick={() => handleSelectAll(true)}>全選択</Button>
                  <Button size="small" onClick={() => handleSelectAll(false)}>全解除</Button>
                </Box>
              </Box>
              <Table size="small">
                <TableBody>
                  {Object.entries(FIELD_LABELS).map(([key, label]) => {
                    const value = extractedData[key];
                    if (value === null || value === undefined) return null;
                    return (
                      <TableRow key={key} hover>
                        <TableCell padding="checkbox" sx={{ width: 40 }}>
                          <Checkbox
                            checked={!!selectedFields[key]}
                            onChange={() => handleFieldToggle(key)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500, width: 120 }}>
                          {label}
                        </TableCell>
                        <TableCell>
                          {key === 'facilities' ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {String(value).split(',').map((item, i) => (
                                <Chip key={i} label={item.trim()} size="small" variant="outlined" />
                              ))}
                            </Box>
                          ) : (
                            formatValue(key, value)
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnalysisDialogOpen(false)}>
            キャンセル
          </Button>
          {extractedData && !analysisError && (
            <Button
              variant="contained"
              onClick={handleApplyData}
              disabled={selectedCount === 0}
              startIcon={<CheckIcon />}
            >
              選択した項目を適用
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
