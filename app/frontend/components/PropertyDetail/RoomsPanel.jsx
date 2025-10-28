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
  Paper,
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
} from '@mui/icons-material';

export default function RoomsPanel({ propertyId, rooms, onRoomsUpdate }) {
  const navigate = useNavigate();
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    room_number: '',
    floor: '',
    area: '',
    rent: '',
    status: 'vacant',
    room_type: '1K',
  });

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
    setFormData({
      room_number: '',
      floor: '',
      area: '',
      rent: '',
      status: 'vacant',
      room_type: '1K',
    });
    setRoomDialogOpen(true);
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setFormData({
      room_number: room.room_number || '',
      floor: room.floor || '',
      area: room.area || '',
      rent: room.rent || '',
      status: room.status || 'vacant',
      room_type: room.room_type || '1K',
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

      const url = editingRoom
        ? `/api/v1/buildings/${propertyId}/rooms/${editingRoom.id}`
        : `/api/v1/buildings/${propertyId}/rooms`;

      const method = editingRoom ? 'PUT' : 'POST';

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

      const response = await fetch(`/api/v1/buildings/${propertyId}/rooms/${roomToDelete.id}`, {
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
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <Box sx={{
        px: 2,
        py: 1.5,
        borderBottom: '1px solid #e0e0e0',
        bgcolor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        minHeight: 56
      }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1, fontWeight: 600, fontSize: '1.05rem' }}>
          <HomeIcon color="primary" sx={{ fontSize: 26 }} />
          部屋一覧 ({rooms.length}室)
        </Typography>

        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddRoom}
        >
          部屋追加
        </Button>
      </Box>

      {/* 統計情報 */}
      <Box sx={{ p: 1, bgcolor: 'grey.50', borderBottom: '1px solid #ddd', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
                  const roomType = room.room_type || '-';

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
                        <Tooltip title={roomType} placement="top">
                          <span>{roomType}</span>
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
      >
        <DialogTitle>
          {editingRoom ? '部屋編集' : '部屋追加'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
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

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="階数"
                type="number"
                value={formData.floor}
                onChange={handleChange('floor')}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
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

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="面積"
                type="number"
                value={formData.area}
                onChange={handleChange('area')}
                size="small"
                InputProps={{
                  endAdornment: <Typography variant="body2" color="text.secondary">㎡</Typography>
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="賃料"
                type="number"
                value={formData.rent}
                onChange={handleChange('rent')}
                size="small"
                InputProps={{
                  endAdornment: <Typography variant="body2" color="text.secondary">円</Typography>
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoomDialogOpen(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleSaveRoom}
            variant="contained"
            disabled={loading || !formData.room_number}
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
