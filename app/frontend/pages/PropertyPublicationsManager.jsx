import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  IconButton,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Public as PublicIcon,
  PublicOff as PublicOffIcon,
  Delete as DeleteIcon,
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  ContentCopy as ContentCopyIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const templateLabels = {
  template0: 'クラシック',
  template1: 'SUUMO風',
  template2: 'モダン',
  template3: 'ナチュラル'
};

export default function PropertyPublicationsManager() {
  const navigate = useNavigate();
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedPublication, setSelectedPublication] = useState(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('template1');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [successMessage, setSuccessMessage] = useState(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleType, setScheduleType] = useState('publish'); // 'publish' or 'unpublish'
  const [scheduleDate, setScheduleDate] = useState('');

  const loadPublications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/v1/property_publications');
      setPublications(response.data);
    } catch (err) {
      console.error('Error loading publications:', err);
      setError('物件公開ページの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPublications();
  }, [loadPublications]);

  const filteredPublications = publications.filter(pub => {
    const matchesSearch = !searchQuery ||
      pub.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pub.room?.building?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pub.room?.building?.address?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || pub.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedIds(filteredPublications.map(pub => pub.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const handleBulkAction = async (action, templateType = null) => {
    setBulkMenuAnchor(null);

    if (selectedIds.length === 0) return;

    try {
      const params = { ids: selectedIds, bulk_action: action };
      if (templateType) {
        params.template_type = templateType;
      }

      const response = await axios.post('/api/v1/property_publications/bulk_action', params);

      if (response.data.success) {
        setSuccessMessage(response.data.message);
        setSelectedIds([]);
        loadPublications();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error performing bulk action:', err);
      setError(err.response?.data?.error || '一括操作に失敗しました');
    }
  };

  const handleTemplateChange = () => {
    setTemplateDialogOpen(false);
    handleBulkAction('change_template', selectedTemplate);
  };

  const handleScheduleOpen = (type) => {
    setScheduleType(type);
    setScheduleDate('');
    setScheduleDialogOpen(true);
    setBulkMenuAnchor(null);
  };

  const handleScheduleSubmit = async () => {
    if (selectedIds.length === 0 || !scheduleDate) return;

    try {
      const fieldName = scheduleType === 'publish' ? 'scheduled_publish_at' : 'scheduled_unpublish_at';

      // Update each publication with the schedule
      await Promise.all(selectedIds.map(id => {
        const pub = publications.find(p => p.id === id);
        if (pub) {
          return axios.patch(`/api/v1/rooms/${pub.room?.id}/property_publications/${id}`, {
            property_publication: { [fieldName]: scheduleDate }
          });
        }
        return Promise.resolve();
      }));

      setSuccessMessage(`${selectedIds.length}件の物件に${scheduleType === 'publish' ? '公開' : '非公開'}予約を設定しました`);
      setSelectedIds([]);
      loadPublications();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error setting schedule:', err);
      setError('スケジュール設定に失敗しました');
    }
    setScheduleDialogOpen(false);
  };

  const handleClearSchedule = async (publication, type) => {
    try {
      const fieldName = type === 'publish' ? 'scheduled_publish_at' : 'scheduled_unpublish_at';
      await axios.patch(`/api/v1/rooms/${publication.room?.id}/property_publications/${publication.id}`, {
        property_publication: { [fieldName]: null }
      });
      setSuccessMessage('スケジュールを解除しました');
      loadPublications();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('スケジュール解除に失敗しました');
    }
  };

  const handleActionMenuOpen = (event, publication) => {
    event.stopPropagation();
    setActionMenuAnchor(event.currentTarget);
    setSelectedPublication(publication);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedPublication(null);
  };

  const handleView = () => {
    if (selectedPublication) {
      navigate(`/property/${selectedPublication.publication_id}?preview=true`);
    }
    handleActionMenuClose();
  };

  const handleEdit = () => {
    if (selectedPublication) {
      navigate(`/room/${selectedPublication.room?.id}/property-publication/${selectedPublication.id}/edit`);
    }
    handleActionMenuClose();
  };

  const handleDuplicate = async () => {
    if (selectedPublication) {
      try {
        await axios.post(`/api/v1/rooms/${selectedPublication.room?.id}/property_publications/${selectedPublication.id}/duplicate`);
        setSuccessMessage('物件公開ページを複製しました');
        loadPublications();
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        setError('複製に失敗しました');
      }
    }
    handleActionMenuClose();
  };

  const handleTogglePublish = async (publication) => {
    try {
      const endpoint = publication.status === 'published'
        ? `/api/v1/rooms/${publication.room?.id}/property_publications/${publication.id}/unpublish`
        : `/api/v1/rooms/${publication.room?.id}/property_publications/${publication.id}/publish`;

      await axios.post(endpoint);
      loadPublications();
    } catch (err) {
      setError('公開状態の変更に失敗しました');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const isAllSelected = filteredPublications.length > 0 && selectedIds.length === filteredPublications.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < filteredPublications.length;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          物件公開ページ管理
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {publications.length}件中 {filteredPublications.length}件表示
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Filters and Bulk Actions */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="物件名・建物名・住所で検索"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              )
            }}
            sx={{ minWidth: 280 }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>ステータス</InputLabel>
            <Select
              value={statusFilter}
              label="ステータス"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">すべて</MenuItem>
              <MenuItem value="published">公開中</MenuItem>
              <MenuItem value="draft">下書き</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ flexGrow: 1 }} />

          {selectedIds.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={`${selectedIds.length}件選択中`}
                color="primary"
                onDelete={() => setSelectedIds([])}
              />
              <Button
                variant="contained"
                size="small"
                onClick={(e) => setBulkMenuAnchor(e.currentTarget)}
              >
                一括操作
              </Button>
              <Menu
                anchorEl={bulkMenuAnchor}
                open={Boolean(bulkMenuAnchor)}
                onClose={() => setBulkMenuAnchor(null)}
              >
                <MenuItem onClick={() => handleBulkAction('publish')}>
                  <ListItemIcon><PublicIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>一括公開</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleBulkAction('unpublish')}>
                  <ListItemIcon><PublicOffIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>一括非公開</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => setTemplateDialogOpen(true)}>
                  <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>テンプレート変更</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleScheduleOpen('publish')}>
                  <ListItemIcon><ScheduleIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>公開予約</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleScheduleOpen('unpublish')}>
                  <ListItemIcon><ScheduleIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>非公開予約</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => {
                  if (window.confirm(`${selectedIds.length}件の物件を削除してもよろしいですか？`)) {
                    handleBulkAction('delete');
                  }
                }} sx={{ color: 'error.main' }}>
                  <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                  <ListItemText>一括削除</ListItemText>
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Publications Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={isIndeterminate}
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>タイトル</TableCell>
              <TableCell>建物</TableCell>
              <TableCell>部屋</TableCell>
              <TableCell>テンプレート</TableCell>
              <TableCell>ステータス</TableCell>
              <TableCell>スケジュール</TableCell>
              <TableCell align="right">閲覧数</TableCell>
              <TableCell>更新日</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPublications.map((pub) => (
              <TableRow
                key={pub.id}
                hover
                selected={selectedIds.includes(pub.id)}
                sx={{ cursor: 'pointer' }}
                onClick={() => handleSelectOne(pub.id)}
              >
                <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.includes(pub.id)}
                    onChange={() => handleSelectOne(pub.id)}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 200 }}>
                    {pub.title || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                    {pub.room?.building?.name || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  {pub.room?.room_number || '-'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={templateLabels[pub.template_type] || pub.template_type}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={pub.status === 'published' ? '公開中' : '下書き'}
                    size="small"
                    color={pub.status === 'published' ? 'success' : 'default'}
                    icon={pub.status === 'published' ? <PublicIcon /> : undefined}
                  />
                </TableCell>
                <TableCell>
                  {pub.scheduled_publish_at && (
                    <Tooltip title={`公開予約: ${new Date(pub.scheduled_publish_at).toLocaleString('ja-JP')}`}>
                      <Chip
                        label={`公開 ${new Date(pub.scheduled_publish_at).toLocaleDateString('ja-JP')}`}
                        size="small"
                        color="info"
                        icon={<ScheduleIcon />}
                        onDelete={() => handleClearSchedule(pub, 'publish')}
                        sx={{ mb: pub.scheduled_unpublish_at ? 0.5 : 0 }}
                      />
                    </Tooltip>
                  )}
                  {pub.scheduled_unpublish_at && (
                    <Tooltip title={`非公開予約: ${new Date(pub.scheduled_unpublish_at).toLocaleString('ja-JP')}`}>
                      <Chip
                        label={`非公開 ${new Date(pub.scheduled_unpublish_at).toLocaleDateString('ja-JP')}`}
                        size="small"
                        color="warning"
                        icon={<ScheduleIcon />}
                        onDelete={() => handleClearSchedule(pub, 'unpublish')}
                      />
                    </Tooltip>
                  )}
                  {!pub.scheduled_publish_at && !pub.scheduled_unpublish_at && (
                    <Typography variant="caption" color="text.secondary">-</Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={pub.view_count > 0 ? 500 : 400}>
                    {(pub.view_count || 0).toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(pub.updated_at).toLocaleDateString('ja-JP')}
                  </Typography>
                </TableCell>
                <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                  <Tooltip title="公開/非公開">
                    <IconButton
                      size="small"
                      onClick={() => handleTogglePublish(pub)}
                    >
                      {pub.status === 'published' ? <PublicOffIcon fontSize="small" /> : <PublicIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                  <IconButton
                    size="small"
                    onClick={(e) => handleActionMenuOpen(e, pub)}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredPublications.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    物件公開ページがありません
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        <MenuItem onClick={handleView}>
          <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
          <ListItemText>表示</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>編集</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDuplicate}>
          <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
          <ListItemText>複製</ListItemText>
        </MenuItem>
      </Menu>

      {/* Template Change Dialog */}
      <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)}>
        <DialogTitle>テンプレート変更</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedIds.length}件の物件のテンプレートを変更します
          </Typography>
          <FormControl fullWidth>
            <InputLabel>テンプレート</InputLabel>
            <Select
              value={selectedTemplate}
              label="テンプレート"
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              {Object.entries(templateLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialogOpen(false)}>キャンセル</Button>
          <Button onClick={handleTemplateChange} variant="contained">変更</Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)}>
        <DialogTitle>
          {scheduleType === 'publish' ? '公開予約' : '非公開予約'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedIds.length}件の物件に{scheduleType === 'publish' ? '公開' : '非公開'}予約を設定します
          </Typography>
          <TextField
            type="datetime-local"
            label={scheduleType === 'publish' ? '公開日時' : '非公開日時'}
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            inputProps={{
              min: new Date().toISOString().slice(0, 16)
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>キャンセル</Button>
          <Button onClick={handleScheduleSubmit} variant="contained" disabled={!scheduleDate}>
            設定
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
