import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Home as HomeIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import axios from 'axios';

// 媒体タイプ選択肢
const MEDIA_TYPES = [
  { value: 'suumo', label: 'SUUMO' },
  { value: 'athome', label: 'at home' },
  { value: 'homes', label: 'HOMES' },
  { value: 'lifull', label: 'LIFULL' },
  { value: 'own_website', label: '自社HP' },
  { value: 'line', label: 'LINE' },
  { value: 'phone', label: '電話' },
  { value: 'walk_in', label: '飛び込み' },
  { value: 'referral', label: '紹介' },
  { value: 'other_media', label: 'その他' }
];

// 発生元タイプ選択肢
const ORIGIN_TYPES = [
  { value: 'document_request', label: '資料請求' },
  { value: 'visit_reservation', label: '来場予約' },
  { value: 'general_inquiry', label: 'その他問い合わせ' },
  { value: 'staff_proposal', label: '提案' },
  { value: 'other_origin', label: 'その他' }
];

export default function CreateInquiryDialog({ open, onClose, customerId, onCreated, users = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [message, setMessage] = useState('');
  const [mediaType, setMediaType] = useState('other_media');
  const [originType, setOriginType] = useState('staff_proposal');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  // Debounced search
  const searchRooms = useCallback(async (query) => {
    if (!query.trim()) {
      setRooms([]);
      return;
    }

    try {
      setSearching(true);
      const response = await axios.get('/api/v1/rooms/search', {
        params: { q: query }
      });
      setRooms(response.data.rooms || []);
    } catch (err) {
      console.error('Failed to search rooms:', err);
      setRooms([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      searchRooms(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchRooms]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        message: message || null
      };

      if (selectedRoom) {
        payload.room_id = selectedRoom.id;
        payload.media_type = mediaType;
        payload.origin_type = originType;
      }

      if (assignedUserId) {
        payload.assigned_user_id = assignedUserId;
      }

      await axios.post(`/api/v1/customers/${customerId}/create_inquiry`, payload);

      handleClose();
      onCreated?.();
    } catch (err) {
      console.error('Failed to create inquiry:', err);
      setError(err.response?.data?.errors?.join('\n') || err.response?.data?.error || '案件の作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setRooms([]);
    setSelectedRoom(null);
    setMessage('');
    setMediaType('other_media');
    setOriginType('staff_proposal');
    setAssignedUserId('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AddIcon color="primary" />
        案件を作成
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Room Search */}
          <TextField
            label="物件を検索（任意）"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            placeholder="建物名、部屋番号で検索..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searching && (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              )
            }}
          />

          {/* Search Results */}
          {rooms.length > 0 && (
            <Box sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              maxHeight: 200,
              overflow: 'auto'
            }}>
              <List dense disablePadding>
                {rooms.map((room) => (
                  <ListItem key={room.id} disablePadding>
                    <ListItemButton
                      selected={selectedRoom?.id === room.id}
                      onClick={() => {
                        setSelectedRoom(room);
                        setSearchQuery('');
                        setRooms([]);
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar variant="rounded" sx={{ width: 40, height: 40 }}>
                          <HomeIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={room.full_name}
                        secondary={`${room.room_type_label || ''} ${room.area ? room.area + '㎡' : ''} ${room.rent ? '¥' + room.rent.toLocaleString() : ''}`}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* No results message */}
          {searchQuery && rooms.length === 0 && !searching && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              該当する物件が見つかりませんでした
            </Typography>
          )}

          {/* Selected Room Display */}
          {selectedRoom && (
            <Box sx={{
              bgcolor: 'primary.light',
              color: 'primary.contrastText',
              p: 1.5,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5
            }}>
              <Avatar variant="rounded" sx={{ width: 48, height: 48, bgcolor: 'primary.dark' }}>
                <HomeIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {selectedRoom.full_name}
                </Typography>
                <Typography variant="caption">
                  {selectedRoom.room_type_label || ''} {selectedRoom.area ? selectedRoom.area + '㎡' : ''} {selectedRoom.rent ? '¥' + selectedRoom.rent.toLocaleString() : ''}
                </Typography>
              </Box>
            </Box>
          )}

          <Divider />

          {/* Origin Type / Media Type - PropertyInquiry固有の項目のため物件選択時のみ表示 */}
          {selectedRoom && (
            <>
              <FormControl fullWidth>
                <InputLabel>発生元</InputLabel>
                <Select
                  value={originType}
                  onChange={(e) => setOriginType(e.target.value)}
                  label="発生元"
                >
                  {ORIGIN_TYPES.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>媒体</InputLabel>
                <Select
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value)}
                  label="媒体"
                >
                  {MEDIA_TYPES.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}

          {/* Assigned User */}
          {users.length > 0 && (
            <FormControl fullWidth>
              <InputLabel>担当者（任意）</InputLabel>
              <Select
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                label="担当者（任意）"
              >
                <MenuItem value="">
                  <Typography variant="body2" color="text.secondary">未設定</Typography>
                </MenuItem>
                {users.map(user => (
                  <MenuItem key={user.id} value={user.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" color="action" />
                      {user.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Message (Optional) */}
          <TextField
            label="メモ（任意）"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="この案件に関するメモ..."
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          キャンセル
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? '作成中...' : '案件を作成'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
