import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Snackbar,
  Alert,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  ContentCopy as CopyIcon,
  Public as PublicIcon,
  VisibilityOff as UnpublishIcon
} from '@mui/icons-material';

export default function VrTours() {
  const navigate = useNavigate();
  const [vrTours, setVrTours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  useEffect(() => {
    fetchVrTours();
  }, []);

  const fetchVrTours = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/vr_tours', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('VRツアーデータ:', data);
        setVrTours(data);
      } else {
        console.error('APIエラー:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('エラー詳細:', errorData);
        showSnackbar(`VRツアーの取得に失敗しました (${response.status})`, 'error');
      }
    } catch (err) {
      console.error('取得エラー:', err);
      showSnackbar('ネットワークエラーが発生しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) {
      showSnackbar('VRツアーを選択してください', 'warning');
      return;
    }

    try {
      const response = await fetch('/api/v1/vr_tours/bulk_action', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vr_tour_ids: selectedIds,
          action: action,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showSnackbar(data.message, 'success');
        fetchVrTours();
        setSelectedIds([]);
      } else {
        const data = await response.json();
        showSnackbar(data.error || '操作に失敗しました', 'error');
      }
    } catch (err) {
      console.error('操作エラー:', err);
      showSnackbar('ネットワークエラーが発生しました', 'error');
    }
  };

  const copyPublicUrl = (id) => {
    const url = `${window.location.origin}/vr/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      showSnackbar('公開URLをコピーしました', 'success');
    });
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedIds(vrTours.map((tour) => tour.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    const selectedIndex = selectedIds.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedIds, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedIds.slice(1));
    } else if (selectedIndex === selectedIds.length - 1) {
      newSelected = newSelected.concat(selectedIds.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedIds.slice(0, selectedIndex),
        selectedIds.slice(selectedIndex + 1)
      );
    }

    setSelectedIds(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const isSelected = (id) => selectedIds.indexOf(id) !== -1;

  const paginatedTours = vrTours.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            VRツアー管理
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<PublicIcon />}
              onClick={() => handleBulkAction('publish')}
              disabled={selectedIds.length === 0}
            >
              一括公開
            </Button>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<UnpublishIcon />}
              onClick={() => handleBulkAction('unpublish')}
              disabled={selectedIds.length === 0}
            >
              一括非公開
            </Button>
          </Box>
        </Box>

        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedIds.length > 0 && selectedIds.length < vrTours.length}
                      checked={vrTours.length > 0 && selectedIds.length === vrTours.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>タイトル</TableCell>
                  <TableCell>建物名</TableCell>
                  <TableCell>部屋番号</TableCell>
                  <TableCell>ステータス</TableCell>
                  <TableCell align="right">シーン数</TableCell>
                  <TableCell>最終更新</TableCell>
                  <TableCell>アクション</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : paginatedTours.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                      <Typography color="text.secondary">
                        VRツアーがありません
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTours.map((tour) => {
                    const isItemSelected = isSelected(tour.id);
                    return (
                      <TableRow
                        key={tour.id}
                        hover
                        selected={isItemSelected}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isItemSelected}
                            onChange={() => handleSelectOne(tour.id)}
                          />
                        </TableCell>
                        <TableCell>{tour.title}</TableCell>
                        <TableCell>{tour.room?.building?.name || '-'}</TableCell>
                        <TableCell>{tour.room?.room_number || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={tour.status === 'published' ? '公開中' : '下書き'}
                            color={tour.status === 'published' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">{tour.scenes_count}</TableCell>
                        <TableCell>
                          {tour.updated_at
                            ? new Date(tour.updated_at).toLocaleString('ja-JP')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/room/${tour.room?.id}/vr-tour/${tour.id}/edit`)}
                              title="編集"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/room/${tour.room?.id}/vr-tour/${tour.id}/viewer`)}
                              title="プレビュー"
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            {tour.status === 'published' && (
                              <IconButton
                                size="small"
                                onClick={() => copyPublicUrl(tour.id)}
                                title="公開URLコピー"
                              >
                                <CopyIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={vrTours.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="1ページあたりの行数:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
          />
        </Paper>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
