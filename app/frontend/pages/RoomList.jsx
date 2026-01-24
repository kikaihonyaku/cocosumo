import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Chip,
  IconButton,
  TextField,
  CircularProgress,
  Alert,
  Tooltip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Collapse,
  Checkbox,
  ListItemText,
  OutlinedInput,
  FormControlLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  MeetingRoom as RoomIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon,
  FilterAlt as FilterIcon,
  Clear as ClearIcon,
  Pets as PetsIcon,
  People as PeopleIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import axios from 'axios';

// ステータスマッピング
const STATUS_MAP = {
  0: { label: '空室', color: 'success' },
  1: { label: '入居中', color: 'default' },
  2: { label: '予約済', color: 'warning' },
  3: { label: 'メンテナンス中', color: 'error' }
};

// 間取りマッピング
const ROOM_TYPE_OPTIONS = [
  { value: 'studio', label: 'ワンルーム' },
  { value: 'one_bedroom', label: '1K' },
  { value: 'one_dk', label: '1DK' },
  { value: 'one_ldk', label: '1LDK' },
  { value: 'two_bedroom', label: '2K' },
  { value: 'two_dk', label: '2DK' },
  { value: 'two_ldk', label: '2LDK' },
  { value: 'three_bedroom', label: '3K' },
  { value: 'three_dk', label: '3DK' },
  { value: 'three_ldk', label: '3LDK' },
  { value: 'other', label: 'その他' }
];

// ステータスオプション
const STATUS_OPTIONS = [
  { value: 0, label: '空室' },
  { value: 1, label: '入居中' },
  { value: 2, label: '予約済' },
  { value: 3, label: 'メンテナンス中' }
];

// 向きオプション
const DIRECTION_OPTIONS = [
  '北', '北東', '東', '南東', '南', '南西', '西', '北西'
];

// 建物種別オプション
const BUILDING_TYPE_OPTIONS = [
  { value: 'apartment', label: 'アパート' },
  { value: 'mansion', label: 'マンション' },
  { value: 'house', label: '一戸建て' },
  { value: 'store', label: '店舗' },
  { value: 'office', label: 'オフィス' },
  { value: 'other', label: 'その他' }
];

// 金額フォーマット
const formatCurrency = (value) => {
  if (value == null) return '-';
  return `${Number(value).toLocaleString()}円`;
};

export default function RoomList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 50,
    total_count: 0,
    total_pages: 1
  });

  // フィルター状態
  const [showFilters, setShowFilters] = useState(true);
  const [buildingName, setBuildingName] = useState('');
  const [address, setAddress] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [selectedRoomTypes, setSelectedRoomTypes] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [rentMin, setRentMin] = useState('');
  const [rentMax, setRentMax] = useState('');
  const [areaMin, setAreaMin] = useState('');
  const [areaMax, setAreaMax] = useState('');
  const [selectedDirections, setSelectedDirections] = useState([]);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [twoPersonAllowed, setTwoPersonAllowed] = useState(false);
  const [officeUseAllowed, setOfficeUseAllowed] = useState(false);
  const [selectedBuildingTypes, setSelectedBuildingTypes] = useState([]);

  // ページネーション
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // ソート
  const [sortColumn, setSortColumn] = useState('building_name');
  const [sortDirection, setSortDirection] = useState('asc');

  // 検索済みフラグ
  const [hasSearched, setHasSearched] = useState(false);

  const searchRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('page', page + 1);
      params.append('per_page', rowsPerPage);
      params.append('sort', sortColumn);
      params.append('direction', sortDirection);

      if (buildingName) params.append('building_name', buildingName);
      if (address) params.append('address', address);
      if (roomNumber) params.append('room_number', roomNumber);
      if (selectedRoomTypes.length > 0) {
        selectedRoomTypes.forEach(t => params.append('room_types[]', t));
      }
      if (selectedStatuses.length > 0) {
        selectedStatuses.forEach(s => params.append('statuses[]', s));
      }
      if (rentMin) params.append('rent_min', rentMin);
      if (rentMax) params.append('rent_max', rentMax);
      if (areaMin) params.append('area_min', areaMin);
      if (areaMax) params.append('area_max', areaMax);
      if (selectedDirections.length > 0) {
        selectedDirections.forEach(d => params.append('directions[]', d));
      }
      if (petsAllowed) params.append('pets_allowed', 'true');
      if (twoPersonAllowed) params.append('two_person_allowed', 'true');
      if (officeUseAllowed) params.append('office_use_allowed', 'true');
      if (selectedBuildingTypes.length > 0) {
        selectedBuildingTypes.forEach(t => params.append('building_types[]', t));
      }

      const response = await axios.get(`/api/v1/rooms/advanced_search?${params.toString()}`);
      setRooms(response.data.rooms);
      setPagination(response.data.pagination);
      setHasSearched(true);
    } catch (err) {
      console.error('Failed to search rooms:', err);
      if (err.response?.status === 401) {
        setError('部屋一覧を表示するにはログインが必要です');
      } else {
        setError('部屋一覧の検索に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  }, [
    page, rowsPerPage, sortColumn, sortDirection,
    buildingName, address, roomNumber,
    selectedRoomTypes, selectedStatuses,
    rentMin, rentMax, areaMin, areaMax,
    selectedDirections, petsAllowed, twoPersonAllowed, officeUseAllowed,
    selectedBuildingTypes
  ]);

  // ページやソートが変わったら再検索
  useEffect(() => {
    if (hasSearched) {
      searchRooms();
    }
  }, [page, rowsPerPage, sortColumn, sortDirection]);

  const handleSearch = () => {
    setPage(0);
    searchRooms();
  };

  const handleClearFilters = () => {
    setBuildingName('');
    setAddress('');
    setRoomNumber('');
    setSelectedRoomTypes([]);
    setSelectedStatuses([]);
    setRentMin('');
    setRentMax('');
    setAreaMin('');
    setAreaMax('');
    setSelectedDirections([]);
    setPetsAllowed(false);
    setTwoPersonAllowed(false);
    setOfficeUseAllowed(false);
    setSelectedBuildingTypes([]);
    setRooms([]);
    setHasSearched(false);
    setPagination({
      current_page: 1,
      per_page: 50,
      total_count: 0,
      total_pages: 1
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (column) => {
    const isAsc = sortColumn === column && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortColumn(column);
  };

  const handleViewRoom = (roomId) => {
    window.open(`/room/${roomId}`, '_blank');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Box sx={{ p: 3, minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RoomIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            物件一覧（部屋）
          </Typography>
          {hasSearched && (
            <Chip
              label={`${pagination.total_count}件`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            検索条件
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search Filters */}
      <Collapse in={showFilters}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            {/* 1行目: テキスト検索 */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="建物名"
                value={buildingName}
                onChange={(e) => setBuildingName(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="住所"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="部屋番号"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </Grid>

            {/* 2行目: セレクト */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>間取り</InputLabel>
                <Select
                  multiple
                  value={selectedRoomTypes}
                  onChange={(e) => setSelectedRoomTypes(e.target.value)}
                  input={<OutlinedInput label="間取り" />}
                  renderValue={(selected) =>
                    selected.map(v => ROOM_TYPE_OPTIONS.find(o => o.value === v)?.label).join(', ')
                  }
                >
                  {ROOM_TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Checkbox checked={selectedRoomTypes.includes(option.value)} />
                      <ListItemText primary={option.label} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>ステータス</InputLabel>
                <Select
                  multiple
                  value={selectedStatuses}
                  onChange={(e) => setSelectedStatuses(e.target.value)}
                  input={<OutlinedInput label="ステータス" />}
                  renderValue={(selected) =>
                    selected.map(v => STATUS_OPTIONS.find(o => o.value === v)?.label).join(', ')
                  }
                >
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Checkbox checked={selectedStatuses.includes(option.value)} />
                      <ListItemText primary={option.label} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>建物種別</InputLabel>
                <Select
                  multiple
                  value={selectedBuildingTypes}
                  onChange={(e) => setSelectedBuildingTypes(e.target.value)}
                  input={<OutlinedInput label="建物種別" />}
                  renderValue={(selected) =>
                    selected.map(v => BUILDING_TYPE_OPTIONS.find(o => o.value === v)?.label).join(', ')
                  }
                >
                  {BUILDING_TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Checkbox checked={selectedBuildingTypes.includes(option.value)} />
                      <ListItemText primary={option.label} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* 3行目: 数値範囲 */}
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="賃料（下限）"
                type="number"
                value={rentMin}
                onChange={(e) => setRentMin(e.target.value)}
                onKeyPress={handleKeyPress}
                slotProps={{ htmlInput: { min: 0, step: 10000 } }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="賃料（上限）"
                type="number"
                value={rentMax}
                onChange={(e) => setRentMax(e.target.value)}
                onKeyPress={handleKeyPress}
                slotProps={{ htmlInput: { min: 0, step: 10000 } }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="面積（下限）㎡"
                type="number"
                value={areaMin}
                onChange={(e) => setAreaMin(e.target.value)}
                onKeyPress={handleKeyPress}
                slotProps={{ htmlInput: { min: 0, step: 5 } }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="面積（上限）㎡"
                type="number"
                value={areaMax}
                onChange={(e) => setAreaMax(e.target.value)}
                onKeyPress={handleKeyPress}
                slotProps={{ htmlInput: { min: 0, step: 5 } }}
              />
            </Grid>

            {/* 4行目: 向きとオプション */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>向き</InputLabel>
                <Select
                  multiple
                  value={selectedDirections}
                  onChange={(e) => setSelectedDirections(e.target.value)}
                  input={<OutlinedInput label="向き" />}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {DIRECTION_OPTIONS.map((direction) => (
                    <MenuItem key={direction} value={direction}>
                      <Checkbox checked={selectedDirections.includes(direction)} />
                      <ListItemText primary={direction} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', height: '100%' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={petsAllowed}
                      onChange={(e) => setPetsAllowed(e.target.checked)}
                      icon={<PetsIcon />}
                      checkedIcon={<PetsIcon />}
                    />
                  }
                  label="ペット可"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={twoPersonAllowed}
                      onChange={(e) => setTwoPersonAllowed(e.target.checked)}
                      icon={<PeopleIcon />}
                      checkedIcon={<PeopleIcon />}
                    />
                  }
                  label="二人入居可"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={officeUseAllowed}
                      onChange={(e) => setOfficeUseAllowed(e.target.checked)}
                      icon={<BusinessIcon />}
                      checkedIcon={<BusinessIcon />}
                    />
                  }
                  label="事務所利用可"
                />
              </Box>
            </Grid>

            {/* 5行目: ボタン */}
            <Grid size={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilters}
                >
                  クリア
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={handleSearch}
                  disabled={loading}
                >
                  検索
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {/* Results Table */}
      <Paper sx={{ flex: 1, minHeight: 400, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <CircularProgress />
          </Box>
        ) : !hasSearched ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <Typography color="text.secondary">
              検索条件を入力して「検索」ボタンをクリックしてください
            </Typography>
          </Box>
        ) : rooms.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <Typography color="text.secondary">
              検索条件に一致する部屋が見つかりませんでした
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.100' }}>
                      <TableSortLabel
                        active={sortColumn === 'building_name'}
                        direction={sortColumn === 'building_name' ? sortDirection : 'asc'}
                        onClick={() => handleSort('building_name')}
                      >
                        建物名
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.100' }}>
                      <TableSortLabel
                        active={sortColumn === 'room_number'}
                        direction={sortColumn === 'room_number' ? sortDirection : 'asc'}
                        onClick={() => handleSort('room_number')}
                      >
                        部屋番号
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.100' }}>住所</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.100' }}>間取り</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.100' }} align="right">
                      <TableSortLabel
                        active={sortColumn === 'area'}
                        direction={sortColumn === 'area' ? sortDirection : 'asc'}
                        onClick={() => handleSort('area')}
                      >
                        面積
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.100' }} align="right">
                      <TableSortLabel
                        active={sortColumn === 'rent'}
                        direction={sortColumn === 'rent' ? sortDirection : 'asc'}
                        onClick={() => handleSort('rent')}
                      >
                        賃料
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.100' }} align="right">管理費</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.100' }}>
                      <TableSortLabel
                        active={sortColumn === 'floor'}
                        direction={sortColumn === 'floor' ? sortDirection : 'asc'}
                        onClick={() => handleSort('floor')}
                      >
                        階数
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.100' }}>ステータス</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.100' }} align="center">条件</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.100' }} align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rooms.map((room) => {
                    const statusInfo = STATUS_MAP[room.status] || { label: '-', color: 'default' };
                    return (
                      <TableRow
                        key={room.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleViewRoom(room.id)}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {room.building?.name || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>{room.room_number || '-'}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {room.building?.address || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>{room.room_type_label || '-'}</TableCell>
                        <TableCell align="right">
                          {room.area ? `${room.area}㎡` : '-'}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(room.rent)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(room.management_fee)}
                        </TableCell>
                        <TableCell>
                          {room.floor ? `${room.floor}階` : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={statusInfo.label}
                            size="small"
                            color={statusInfo.color}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            {room.pets_allowed && (
                              <Tooltip title="ペット可">
                                <PetsIcon fontSize="small" color="action" />
                              </Tooltip>
                            )}
                            {room.two_person_allowed && (
                              <Tooltip title="二人入居可">
                                <PeopleIcon fontSize="small" color="action" />
                              </Tooltip>
                            )}
                            {room.office_use_allowed && (
                              <Tooltip title="事務所利用可">
                                <BusinessIcon fontSize="small" color="action" />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="詳細を見る">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewRoom(room.id);
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={pagination.total_count}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[25, 50, 100]}
              labelRowsPerPage="表示件数:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}件`}
            />
          </>
        )}
      </Paper>
    </Box>
  );
}
