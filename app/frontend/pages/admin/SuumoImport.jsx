import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Button,
  Paper,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  Collapse,
  IconButton,
  LinearProgress,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Preview as PreviewIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Home as HomeIcon,
  MeetingRoom as MeetingRoomIcon,
  Image as ImageIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  AccessTime as AccessTimeIcon,
  Close as CloseIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Loop as LoopIcon,
} from '@mui/icons-material';

export default function SuumoImport() {
  const [url, setUrl] = useState('');
  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [maxPages, setMaxPages] = useState(1);
  const [skipImages, setSkipImages] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [expandedProperties, setExpandedProperties] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [importLogs, setImportLogs] = useState([]);
  const logEndRef = useRef(null);

  // 履歴関連
  const [histories, setHistories] = useState([]);
  const [loadingHistories, setLoadingHistories] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  // テナント一覧を取得
  useEffect(() => {
    fetchTenants();
    fetchHistories();
  }, []);

  // ログが追加されたら自動スクロール
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [importLogs]);

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/v1/admin/suumo_imports/tenants', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setTenants(data.tenants || []);
        // デフォルトで最初のテナントを選択
        if (data.tenants && data.tenants.length > 0) {
          setSelectedTenantId(data.tenants[0].id);
        }
      } else if (response.status === 401) {
        window.location.href = '/login';
      } else if (response.status === 403) {
        showSnackbar('管理者権限が必要です', 'error');
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
      showSnackbar('テナント一覧の取得に失敗しました', 'error');
    }
  };

  const fetchHistories = async () => {
    try {
      setLoadingHistories(true);
      const response = await fetch('/api/v1/admin/suumo_imports', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setHistories(data.histories || []);
      }
    } catch (error) {
      console.error('Error fetching histories:', error);
    } finally {
      setLoadingHistories(false);
    }
  };

  const fetchHistoryDetail = async (historyId) => {
    try {
      const response = await fetch(`/api/v1/admin/suumo_imports/${historyId}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedHistory(data.history);
        setHistoryDialogOpen(true);
      }
    } catch (error) {
      console.error('Error fetching history detail:', error);
      showSnackbar('履歴の取得に失敗しました', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('ja-JP');
    setImportLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const validateUrl = () => {
    if (!url) {
      showSnackbar('URLを入力してください', 'error');
      return false;
    }
    if (!url.startsWith('https://suumo.jp/')) {
      showSnackbar('SUUMOのURLを指定してください（https://suumo.jp/で始まる必要があります）', 'error');
      return false;
    }
    return true;
  };

  // プレビュー実行
  const handlePreview = async () => {
    if (!validateUrl()) return;

    try {
      setPreviewing(true);
      setPreviewData(null);
      addLog('プレビューを開始します...', 'info');

      const response = await fetch('/api/v1/admin/suumo_imports/preview', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewData(data);
        addLog(`プレビュー完了: ${data.properties_on_page}件の物件を検出`, 'success');
        showSnackbar('プレビューが完了しました', 'success');
      } else {
        const error = await response.json();
        addLog(`プレビューエラー: ${error.error}`, 'error');
        showSnackbar(error.error || 'プレビューに失敗しました', 'error');
      }
    } catch (error) {
      console.error('Preview error:', error);
      addLog(`プレビューエラー: ${error.message}`, 'error');
      showSnackbar('エラーが発生しました', 'error');
    } finally {
      setPreviewing(false);
    }
  };

  // インポート実行（同期）
  const handleImportSync = async () => {
    if (!validateUrl()) return;
    if (!selectedTenantId) {
      showSnackbar('テナントを選択してください', 'error');
      return;
    }

    try {
      setLoading(true);
      setImportResult(null);
      setImportLogs([]);
      addLog('インポートを開始します...', 'info');
      addLog(`URL: ${url}`, 'info');
      addLog(`最大ページ数: ${maxPages}`, 'info');
      addLog(`画像スキップ: ${skipImages ? 'はい' : 'いいえ'}`, 'info');

      const response = await fetch('/api/v1/admin/suumo_imports/sync', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          tenant_id: selectedTenantId,
          max_pages: maxPages,
          skip_images: skipImages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setImportResult(data.stats);
        addLog('インポートが完了しました！', 'success');
        addLog(`物件作成: ${data.stats.buildings_created}件`, 'success');
        addLog(`物件更新: ${data.stats.buildings_updated || 0}件`, 'success');
        addLog(`物件スキップ: ${data.stats.buildings_skipped}件`, 'info');
        addLog(`部屋作成: ${data.stats.rooms_created}件`, 'success');
        addLog(`部屋更新: ${data.stats.rooms_updated || 0}件`, 'success');
        addLog(`部屋スキップ: ${data.stats.rooms_skipped}件`, 'info');
        addLog(`画像ダウンロード: ${data.stats.images_downloaded}件`, 'success');
        addLog(`画像スキップ: ${data.stats.images_skipped || 0}件`, 'info');

        if (data.stats.errors && data.stats.errors.length > 0) {
          data.stats.errors.forEach(err => addLog(`エラー: ${err}`, 'error'));
        }

        showSnackbar('インポートが完了しました', 'success');

        // 履歴を更新
        fetchHistories();
      } else {
        const error = await response.json();
        addLog(`インポートエラー: ${error.error}`, 'error');
        if (error.details) {
          addLog(`詳細: ${error.details}`, 'error');
        }
        showSnackbar(error.error || 'インポートに失敗しました', 'error');

        // 履歴を更新
        fetchHistories();
      }
    } catch (error) {
      console.error('Import error:', error);
      addLog(`インポートエラー: ${error.message}`, 'error');
      showSnackbar('エラーが発生しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  // インポート実行（非同期）
  const handleImportAsync = async () => {
    if (!validateUrl()) return;
    if (!selectedTenantId) {
      showSnackbar('テナントを選択してください', 'error');
      return;
    }

    try {
      setLoading(true);
      setImportLogs([]);
      addLog('バックグラウンドインポートジョブを開始します...', 'info');

      const response = await fetch('/api/v1/admin/suumo_imports', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          tenant_id: selectedTenantId,
          max_pages: maxPages,
          skip_images: skipImages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        addLog(`ジョブID: ${data.job_id}`, 'success');
        addLog(`履歴ID: ${data.history_id}`, 'info');
        addLog('インポートジョブがバックグラウンドで実行されています', 'info');
        addLog('完了後、物件一覧で確認できます', 'info');
        showSnackbar('インポートジョブを開始しました', 'success');

        // 履歴を更新
        fetchHistories();
      } else {
        const error = await response.json();
        addLog(`エラー: ${error.error}`, 'error');
        showSnackbar(error.error || 'ジョブの開始に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Import error:', error);
      addLog(`エラー: ${error.message}`, 'error');
      showSnackbar('エラーが発生しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  const togglePropertyExpand = (index) => {
    setExpandedProperties(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const formatPrice = (price) => {
    if (!price) return '-';
    return `¥${price.toLocaleString()}`;
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString('ja-JP');
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}秒`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { label: '待機中', color: 'default', icon: <HourglassEmptyIcon sx={{ fontSize: 16 }} /> },
      running: { label: '実行中', color: 'primary', icon: <LoopIcon sx={{ fontSize: 16 }} /> },
      completed: { label: '完了', color: 'success', icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> },
      failed: { label: 'エラー', color: 'error', icon: <ErrorIcon sx={{ fontSize: 16 }} /> },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={config.icon}
      />
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        SUUMOインポート
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        SUUMOの検索結果ページから物件情報をインポートします
      </Typography>

      {/* 設定フォーム */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          インポート設定
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="SUUMO URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            fullWidth
            placeholder="https://suumo.jp/jj/chintai/ichiran/..."
            helperText="SUUMOの検索結果ページのURLを入力してください"
            disabled={loading || previewing}
          />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>テナント</InputLabel>
              <Select
                value={selectedTenantId}
                label="テナント"
                onChange={(e) => setSelectedTenantId(e.target.value)}
                disabled={loading || previewing}
              >
                {tenants.map((tenant) => (
                  <MenuItem key={tenant.id} value={tenant.id}>
                    {tenant.name} ({tenant.buildings_count}物件, {tenant.rooms_count}部屋)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="最大ページ数"
              type="number"
              value={maxPages}
              onChange={(e) => setMaxPages(Math.max(1, parseInt(e.target.value) || 1))}
              sx={{ width: 150 }}
              inputProps={{ min: 1, max: 100 }}
              disabled={loading || previewing}
              helperText="1ページ=約30件"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={skipImages}
                  onChange={(e) => setSkipImages(e.target.checked)}
                  disabled={loading || previewing}
                />
              }
              label="画像スキップ"
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={previewing ? <CircularProgress size={20} /> : <PreviewIcon />}
              onClick={handlePreview}
              disabled={loading || previewing || !url}
            >
              {previewing ? 'プレビュー中...' : 'プレビュー'}
            </Button>

            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
              onClick={handleImportSync}
              disabled={loading || previewing || !url || !selectedTenantId}
            >
              {loading ? 'インポート中...' : '同期インポート'}
            </Button>

            <Button
              variant="contained"
              color="secondary"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ScheduleIcon />}
              onClick={handleImportAsync}
              disabled={loading || previewing || !url || !selectedTenantId}
            >
              {loading ? '送信中...' : 'バックグラウンドインポート'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* インポート履歴 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            インポート履歴
          </Typography>
          <IconButton onClick={fetchHistories} disabled={loadingHistories}>
            <RefreshIcon />
          </IconButton>
        </Box>

        {loadingHistories ? (
          <LinearProgress />
        ) : histories.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            まだ履歴がありません
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>実行日時</TableCell>
                  <TableCell>テナント</TableCell>
                  <TableCell>状態</TableCell>
                  <TableCell align="right">物件</TableCell>
                  <TableCell align="right">部屋</TableCell>
                  <TableCell align="right">画像</TableCell>
                  <TableCell align="right">実行時間</TableCell>
                  <TableCell>URL</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {histories.map((history) => (
                  <TableRow
                    key={history.id}
                    hover
                    onClick={() => fetchHistoryDetail(history.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {formatDateTime(history.started_at || history.created_at)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{history.tenant_name}</TableCell>
                    <TableCell>{getStatusChip(history.status)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title={`作成: ${history.buildings_created}, 更新: ${history.buildings_updated}`}>
                        <span>{history.buildings_created + history.buildings_updated}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={`作成: ${history.rooms_created}, 更新: ${history.rooms_updated}`}>
                        <span>{history.rooms_created + history.rooms_updated}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={`DL: ${history.images_downloaded}, スキップ: ${history.images_skipped}`}>
                        <span>{history.images_downloaded}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">{formatDuration(history.duration_seconds)}</TableCell>
                    <TableCell>
                      <Tooltip title={history.url}>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {history.url}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* インポート結果サマリー */}
      {importResult && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon color="success" />
            インポート結果
          </Typography>

          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mt: 2 }}>
            <Card sx={{ minWidth: 180 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <HomeIcon color="primary" />
                  <Typography variant="body2" color="text.secondary">物件</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'baseline' }}>
                  <Box>
                    <Typography variant="h4" color="success.main">{importResult.buildings_created}</Typography>
                    <Typography variant="caption" color="text.secondary">作成</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h5" color="info.main">{importResult.buildings_updated || 0}</Typography>
                    <Typography variant="caption" color="text.secondary">更新</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ minWidth: 180 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <MeetingRoomIcon color="primary" />
                  <Typography variant="body2" color="text.secondary">部屋</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'baseline' }}>
                  <Box>
                    <Typography variant="h4" color="success.main">{importResult.rooms_created}</Typography>
                    <Typography variant="caption" color="text.secondary">作成</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h5" color="info.main">{importResult.rooms_updated || 0}</Typography>
                    <Typography variant="caption" color="text.secondary">更新</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ minWidth: 180 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ImageIcon color="primary" />
                  <Typography variant="body2" color="text.secondary">画像</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'baseline' }}>
                  <Box>
                    <Typography variant="h4" color="success.main">{importResult.images_downloaded}</Typography>
                    <Typography variant="caption" color="text.secondary">DL</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h5" color="text.secondary">{importResult.images_skipped || 0}</Typography>
                    <Typography variant="caption" color="text.secondary">スキップ</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {importResult.errors && importResult.errors.length > 0 && (
              <Card sx={{ minWidth: 150, bgcolor: 'error.light' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <ErrorIcon color="error" />
                    <Typography variant="body2" color="error.dark">エラー</Typography>
                  </Box>
                  <Typography variant="h4" color="error.dark">{importResult.errors.length}</Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        </Paper>
      )}

      {/* プレビュー結果 */}
      {previewData && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            プレビュー結果
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Chip label={`総件数: ${previewData.total_count}件`} color="primary" />
            <Chip label={`このページ: ${previewData.properties_on_page}件`} />
            <Chip
              label={previewData.has_next_page ? '次ページあり' : '最終ページ'}
              color={previewData.has_next_page ? 'success' : 'default'}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <List>
            {previewData.properties?.map((property, index) => (
              <React.Fragment key={index}>
                <ListItem
                  button
                  onClick={() => togglePropertyExpand(index)}
                  sx={{ bgcolor: 'grey.50', borderRadius: 1, mb: 1 }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {property.building_name}
                        </Typography>
                        <Chip label={property.building_type || '不明'} size="small" variant="outlined" />
                        <Chip label={`${property.rooms?.length || 0}部屋`} size="small" color="primary" />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {property.address}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {property.floors && `${property.floors}階建`}
                          {property.built_date && ` / 築${property.built_date}`}
                          {` / 画像${property.building_images_count}枚`}
                        </Typography>
                      </Box>
                    }
                  />
                  <IconButton>
                    {expandedProperties[index] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </ListItem>

                <Collapse in={expandedProperties[index]} timeout="auto" unmountOnExit>
                  <Box sx={{ pl: 4, pr: 2, pb: 2 }}>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>階</TableCell>
                            <TableCell>間取り</TableCell>
                            <TableCell>面積</TableCell>
                            <TableCell align="right">賃料</TableCell>
                            <TableCell align="right">管理費</TableCell>
                            <TableCell align="right">敷金</TableCell>
                            <TableCell align="right">礼金</TableCell>
                            <TableCell align="center">画像</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {property.rooms?.map((room, roomIndex) => (
                            <TableRow key={roomIndex}>
                              <TableCell>{room.floor}階</TableCell>
                              <TableCell>{room.room_type || '-'}</TableCell>
                              <TableCell>{room.area ? `${room.area}m²` : '-'}</TableCell>
                              <TableCell align="right">{formatPrice(room.rent)}</TableCell>
                              <TableCell align="right">{formatPrice(room.management_fee)}</TableCell>
                              <TableCell align="right">{formatPrice(room.deposit)}</TableCell>
                              <TableCell align="right">{formatPrice(room.key_money)}</TableCell>
                              <TableCell align="center">{room.images_count}枚</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Collapse>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* ログ表示 */}
      {importLogs.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            実行ログ
          </Typography>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          <Box
            sx={{
              bgcolor: 'grey.900',
              color: 'grey.100',
              p: 2,
              borderRadius: 1,
              maxHeight: 300,
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
            }}
          >
            {importLogs.map((log, index) => (
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
            <div ref={logEndRef} />
          </Box>
        </Paper>
      )}

      {/* 履歴詳細ダイアログ */}
      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedHistory && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                インポート詳細
                {getStatusChip(selectedHistory.status)}
              </Box>
              <IconButton onClick={() => setHistoryDialogOpen(false)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              {/* 基本情報 */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  基本情報
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">テナント</Typography>
                    <Typography variant="body2">{selectedHistory.tenant_name}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">実行時間</Typography>
                    <Typography variant="body2">{formatDuration(selectedHistory.duration_seconds)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">開始日時</Typography>
                    <Typography variant="body2">{formatDateTime(selectedHistory.started_at)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">完了日時</Typography>
                    <Typography variant="body2">{formatDateTime(selectedHistory.completed_at)}</Typography>
                  </Box>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">URL</Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    {selectedHistory.url}
                  </Typography>
                </Box>
                {selectedHistory.error_message && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {selectedHistory.error_message}
                  </Alert>
                )}
              </Box>

              {/* 統計情報 */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  処理結果
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<HomeIcon />}
                    label={`物件: 作成${selectedHistory.buildings_created} / 更新${selectedHistory.buildings_updated}`}
                    variant="outlined"
                  />
                  <Chip
                    icon={<MeetingRoomIcon />}
                    label={`部屋: 作成${selectedHistory.rooms_created} / 更新${selectedHistory.rooms_updated}`}
                    variant="outlined"
                  />
                  <Chip
                    icon={<ImageIcon />}
                    label={`画像: DL${selectedHistory.images_downloaded} / スキップ${selectedHistory.images_skipped}`}
                    variant="outlined"
                  />
                  {selectedHistory.error_count > 0 && (
                    <Chip
                      icon={<ErrorIcon />}
                      label={`エラー: ${selectedHistory.error_count}`}
                      color="error"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>

              {/* ログ */}
              {selectedHistory.logs && selectedHistory.logs.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    実行ログ
                  </Typography>
                  <Box
                    sx={{
                      bgcolor: 'grey.900',
                      color: 'grey.100',
                      p: 2,
                      borderRadius: 1,
                      maxHeight: 300,
                      overflow: 'auto',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                    }}
                  >
                    {selectedHistory.logs.map((log, index) => (
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
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setHistoryDialogOpen(false)}>
                閉じる
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* スナックバー */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
