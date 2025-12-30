import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tooltip,
  Menu,
  MenuItem as MenuItemComponent,
  Alert,
  CircularProgress,
  Divider,
  Collapse,
  FormControlLabel,
  Checkbox,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Home as HomeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as HourglassEmptyIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { getRoomTypeLabel } from '../../utils/formatters';

export default function RoomsPanel({
  propertyId,
  rooms,
  onRoomsUpdate,
  expanded: controlledExpanded,
  onExpandedChange,
}) {
  const navigate = useNavigate();
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);

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
  const [editingRoom, setEditingRoom] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState({
    room_number: '',
    floor: '',
    area: '',
    rent: '',
    status: 'vacant',
    room_type: '1K',
    management_fee: '',
    deposit: '',
    key_money: '',
    direction: '',
    available_date: '',
    parking_fee: '',
    renewal_fee: '',
    guarantor_required: true,
    pets_allowed: false,
    two_person_allowed: false,
    office_use_allowed: false,
    description: '',
  });

  // 向きの定義
  const directions = [
    { id: '', name: '未設定' },
    { id: 'north', name: '北' },
    { id: 'northeast', name: '北東' },
    { id: 'east', name: '東' },
    { id: 'southeast', name: '南東' },
    { id: 'south', name: '南' },
    { id: 'southwest', name: '南西' },
    { id: 'west', name: '西' },
    { id: 'northwest', name: '北西' },
  ];

  // チェックボックスの共通スタイル
  const checkboxStyle = {
    '& .MuiSvgIcon-root': { fontSize: 24 },
    color: '#9e9e9e',
    '&.Mui-checked': { color: '#1976d2' }
  };

  // 部屋ステータスの定義
  const roomStatuses = [
    { id: 'vacant', name: '空室', color: 'success', icon: <CheckCircleIcon /> },
    { id: 'occupied', name: '入居中', color: 'default', icon: <HomeIcon /> },
    { id: 'reserved', name: '入居予定', color: 'warning', icon: <HourglassEmptyIcon /> },
    { id: 'leaving', name: '退去予定', color: 'error', icon: <CancelIcon /> },
  ];

  // 間取りの定義
  const roomTypes = [
    '1R', '1K', '1DK', '1LDK',
    '2K', '2DK', '2LDK',
    '3K', '3DK', '3LDK',
    '4LDK以上'
  ];

  const handleAddRoom = () => {
    setEditingRoom(null);
    setShowAdvanced(false);
    setFormData({
      room_number: '',
      floor: '',
      area: '',
      rent: '',
      status: 'vacant',
      room_type: '1K',
      management_fee: '',
      deposit: '',
      key_money: '',
      direction: '',
      available_date: '',
      parking_fee: '',
      renewal_fee: '',
      guarantor_required: true,
      pets_allowed: false,
      two_person_allowed: false,
      office_use_allowed: false,
      description: '',
    });
    setRoomDialogOpen(true);
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setShowAdvanced(false);
    setFormData({
      room_number: room.room_number || '',
      floor: room.floor || '',
      area: room.area || '',
      rent: room.rent || '',
      status: room.status || 'vacant',
      room_type: room.room_type || '1K',
      management_fee: room.management_fee || '',
      deposit: room.deposit || '',
      key_money: room.key_money || '',
      direction: room.direction || '',
      available_date: room.available_date || '',
      parking_fee: room.parking_fee || '',
      renewal_fee: room.renewal_fee || '',
      guarantor_required: room.guarantor_required ?? true,
      pets_allowed: room.pets_allowed || false,
      two_person_allowed: room.two_person_allowed || false,
      office_use_allowed: room.office_use_allowed || false,
      description: room.description || '',
    });
    setRoomDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteRoom = (room) => {
    setRoomToDelete(room);
    setDeleteConfirmOpen(true);
    handleMenuClose();
  };

  const handleSaveRoom = async () => {
    try {
      setLoading(true);

      // 編集時はスタンドアロンルート、新規作成時はネストされたルートを使用
      const url = editingRoom
        ? `/api/v1/rooms/${editingRoom.id}`
        : `/api/v1/buildings/${propertyId}/rooms`;

      const method = editingRoom ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ room: formData }),
      });

      if (!response.ok) {
        throw new Error('部屋の保存に失敗しました');
      }

      setRoomDialogOpen(false);
      onRoomsUpdate();

    } catch (error) {
      console.error('部屋保存エラー:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!roomToDelete) return;

    try {
      setLoading(true);

      // 削除はスタンドアロンルートを使用
      const response = await fetch(`/api/v1/rooms/${roomToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('部屋の削除に失敗しました');
      }

      setDeleteConfirmOpen(false);
      setRoomToDelete(null);
      onRoomsUpdate();

    } catch (error) {
      console.error('部屋削除エラー:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, room) => {
    setMenuAnchor(event.currentTarget);
    setSelectedRoom(room);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedRoom(null);
  };

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusInfo = (statusId) => {
    return roomStatuses.find(status => status.id === statusId) || roomStatuses[0];
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  const handleRoomClick = (room) => {
    navigate(`/room/${room.id}`);
  };

  return (
    <Box sx={{ height: expanded ? '100%' : 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <Box
        sx={{
          px: 2,
          py: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          borderBottom: '1px solid #e0e0e0',
          '&:hover': { bgcolor: 'action.hover' },
          flexShrink: 0,
        }}
        onClick={handleExpandToggle}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HomeIcon color="action" />
          <Typography variant="subtitle2" fontWeight={600}>
            部屋一覧
          </Typography>
          <Chip label={`${rooms.length}室`} size="small" sx={{ height: 20, fontSize: '0.75rem' }} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="部屋を追加">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleAddRoom();
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Box>
      </Box>

      {/* コンテンツ */}
      {expanded && (
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* 統計情報 */}
        <Box sx={{ p: 1, bgcolor: 'grey.50', borderBottom: '1px solid #ddd', display: 'flex', gap: 1, flexWrap: 'wrap', flexShrink: 0 }}>
          {roomStatuses.map(status => {
            const count = rooms.filter(room => room.status === status.id).length;
            return count > 0 ? (
              <Chip
                key={status.id}
                label={`${status.name}: ${count}`}
                size="small"
                color={status.color}
                variant="outlined"
              />
            ) : null;
          })}
        </Box>

        {/* 部屋一覧テーブル */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
        {rooms.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              部屋が登録されていません
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddRoom}
              sx={{ mt: 2 }}
            >
              最初の部屋を追加
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table
              size="small"
              stickyHeader
              sx={{
                tableLayout: 'fixed',
                '& .MuiTableCell-root': {
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '23%' }}>号室</TableCell>
                  <TableCell sx={{ width: '33%' }}>間取り</TableCell>
                  <TableCell sx={{ width: '28%' }}>状態</TableCell>
                  <TableCell sx={{ width: '16%' }} align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rooms.map((room) => {
                  const statusInfo = getStatusInfo(room.status);
                  const roomNumber = room.room_number || '-';
                  const roomTypeLabel = getRoomTypeLabel(room.room_type);

                  return (
                    <TableRow
                      key={room.id}
                      hover
                      onClick={() => handleRoomClick(room)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Tooltip title={roomNumber} placement="top">
                          <Typography variant="body2" fontWeight="500" noWrap>
                            {roomNumber}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={roomTypeLabel} placement="top">
                          <span>{roomTypeLabel}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={statusInfo.name} placement="top">
                          <Chip
                            label={statusInfo.name}
                            size="small"
                            color={statusInfo.color}
                            icon={statusInfo.icon}
                            sx={{ maxWidth: '100%' }}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMenuOpen(e, room);
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        </Box>
        </Box>
      )}

      {/* アクションメニュー */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItemComponent onClick={() => handleEditRoom(selectedRoom)}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          編集
        </MenuItemComponent>
        <MenuItemComponent onClick={() => handleDeleteRoom(selectedRoom)}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          削除
        </MenuItemComponent>
      </Menu>

      {/* 部屋編集ダイアログ */}
      <Dialog
        open={roomDialogOpen}
        onClose={() => setRoomDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle>
          {editingRoom ? '部屋編集' : '部屋追加'}
        </DialogTitle>
        <DialogContent dividers sx={{ overflowY: 'auto' }}>
          {/* 基本情報 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mb: 2 }}>
              基本情報
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="部屋番号"
                  value={formData.room_number}
                  onChange={handleChange('room_number')}
                  required
                  size="small"
                  placeholder="例: 101"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="階数"
                  type="number"
                  value={formData.floor}
                  onChange={handleChange('floor')}
                  required
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>間取り</InputLabel>
                  <Select
                    value={formData.room_type}
                    label="間取り"
                    onChange={handleChange('room_type')}
                  >
                    {roomTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="面積"
                  type="number"
                  value={formData.area}
                  onChange={handleChange('area')}
                  size="small"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">㎡</InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>向き</InputLabel>
                  <Select
                    value={formData.direction}
                    label="向き"
                    onChange={handleChange('direction')}
                  >
                    {directions.map((dir) => (
                      <MenuItem key={dir.id} value={dir.id}>
                        {dir.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>状態</InputLabel>
                  <Select
                    value={formData.status}
                    label="状態"
                    onChange={handleChange('status')}
                  >
                    {roomStatuses.map((status) => (
                      <MenuItem key={status.id} value={status.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {status.icon}
                          {status.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* 賃料情報 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mb: 2 }}>
              賃料・費用
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="賃料"
                  type="number"
                  value={formData.rent}
                  onChange={handleChange('rent')}
                  size="small"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">円</InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="管理費"
                  type="number"
                  value={formData.management_fee}
                  onChange={handleChange('management_fee')}
                  size="small"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">円</InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="敷金"
                  type="number"
                  value={formData.deposit}
                  onChange={handleChange('deposit')}
                  size="small"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">円</InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="礼金"
                  type="number"
                  value={formData.key_money}
                  onChange={handleChange('key_money')}
                  size="small"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">円</InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="入居可能日"
                  type="date"
                  value={formData.available_date}
                  onChange={handleChange('available_date')}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* 詳細設定（折りたたみ） */}
          <Box>
            <Button
              onClick={() => setShowAdvanced(!showAdvanced)}
              endIcon={<ExpandMoreIcon sx={{ transform: showAdvanced ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />}
              sx={{ textTransform: 'none', color: 'primary.main', mb: 1 }}
            >
              詳細設定
            </Button>

            <Collapse in={showAdvanced}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="駐車場料金"
                    type="number"
                    value={formData.parking_fee}
                    onChange={handleChange('parking_fee')}
                    size="small"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">円/月</InputAdornment>
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="更新料"
                    type="number"
                    value={formData.renewal_fee}
                    onChange={handleChange('renewal_fee')}
                    size="small"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">円</InputAdornment>
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    入居条件
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.guarantor_required}
                          onChange={handleChange('guarantor_required')}
                          sx={checkboxStyle}
                        />
                      }
                      label="保証人必要"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.pets_allowed}
                          onChange={handleChange('pets_allowed')}
                          sx={checkboxStyle}
                        />
                      }
                      label="ペット可"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.two_person_allowed}
                          onChange={handleChange('two_person_allowed')}
                          sx={checkboxStyle}
                        />
                      }
                      label="二人入居可"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.office_use_allowed}
                          onChange={handleChange('office_use_allowed')}
                          sx={checkboxStyle}
                        />
                      }
                      label="事務所利用可"
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="備考"
                    multiline
                    rows={3}
                    value={formData.description}
                    onChange={handleChange('description')}
                    size="small"
                    placeholder="部屋に関する特記事項など"
                  />
                </Grid>
              </Grid>
            </Collapse>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoomDialogOpen(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleSaveRoom}
            variant="contained"
            disabled={loading || !formData.room_number || !formData.floor}
          >
            {loading ? <CircularProgress size={20} /> : '保存'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>部屋の削除</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            この操作は取り消せません。
          </Alert>
          <Typography>
            部屋「{roomToDelete?.room_number}号室」を削除してもよろしいですか？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : '削除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
