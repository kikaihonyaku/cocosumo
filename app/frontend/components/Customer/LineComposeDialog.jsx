import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  Typography,
  Menu,
  Divider,
  CircularProgress,
  Collapse,
  ToggleButton,
  ToggleButtonGroup,
  Autocomplete
} from '@mui/material';
import {
  Chat as ChatIcon,
  Send as SendIcon,
  Description as DescriptionIcon,
  Image as ImageIcon,
  TextFields as TextFieldsIcon,
  Home as HomeIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import axios from 'axios';
import ContentLinkPicker from './ContentLinkPicker';
import ConfirmAddPropertyDialog from './ConfirmAddPropertyDialog';
import useConfirmAddProperty from '../../hooks/useConfirmAddProperty';

export default function LineComposeDialog({
  open,
  onClose,
  customer,
  inquiries = [],
  selectedInquiryId = null,
  onSent,
  onInquiriesReload
}) {
  const [messageType, setMessageType] = useState('text');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [inquiryId, setInquiryId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [linkPickerOpen, setLinkPickerOpen] = useState(false);

  // Templates
  const [templates, setTemplates] = useState([]);
  const [templateMenuAnchor, setTemplateMenuAnchor] = useState(null);

  // Rooms for property card
  const [rooms, setRooms] = useState([]);

  const confirmAddProperty = useConfirmAddProperty({
    inquiries,
    selectedInquiryId: inquiryId,
    mediaType: 'line',
    onPropertyAdded: onInquiriesReload
  });

  useEffect(() => {
    if (open) {
      setMessageType('text');
      setContent('');
      setImageUrl('');
      setInquiryId(selectedInquiryId || (inquiries.length > 0 ? inquiries[0].id : ''));
      setError(null);
      setConfirmOpen(false);
      setSelectedRoom(null);
      setLinkPickerOpen(false);
      loadTemplates();
      loadRooms();
    }
  }, [open, selectedInquiryId, inquiries]);

  const loadTemplates = async () => {
    try {
      const res = await axios.get('/api/v1/line_templates');
      setTemplates(res.data);
    } catch (e) {
      // テンプレート取得失敗は無視
    }
  };

  const loadRooms = async () => {
    try {
      const res = await axios.get('/api/v1/rooms/search', { params: { per_page: 100 } });
      setRooms(res.data.rooms || []);
    } catch (e) {
      // 物件取得失敗は無視
    }
  };

  const handleTemplateSelect = (template) => {
    setMessageType(template.message_type);
    setContent(template.content);
    if (template.image_url) setImageUrl(template.image_url);
    setTemplateMenuAnchor(null);
  };

  const handleSendClick = () => {
    if (messageType === 'text' && !content.trim()) {
      setError('メッセージを入力してください');
      return;
    }
    if (messageType === 'image' && !imageUrl.trim()) {
      setError('画像URLを入力してください');
      return;
    }
    if (messageType === 'property_card' && !selectedRoom) {
      setError('物件を選択してください');
      return;
    }
    if (!inquiryId) {
      setError('案件を選択してください');
      return;
    }
    setError(null);
    setConfirmOpen(true);
  };

  const handleSend = async () => {
    setConfirmOpen(false);
    setLoading(true);
    setError(null);

    try {
      const payload = {
        message_type: messageType,
        content: content.trim(),
        inquiry_id: inquiryId
      };

      if (messageType === 'image') {
        payload.image_url = imageUrl.trim();
      }
      if (messageType === 'property_card') {
        payload.room_id = selectedRoom.id;
      }

      await axios.post(`/api/v1/customers/${customer.id}/send_line_message`, payload);
      onSent?.();
      onClose();
    } catch (e) {
      const msg = e.response?.data?.errors?.[0] || e.response?.data?.error || 'LINE送信に失敗しました';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const hasLine = customer?.line_user_id;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ChatIcon sx={{ color: '#06C755' }} />
          LINEメッセージを送信
        </DialogTitle>
        <DialogContent>
          {!hasLine && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              この顧客にはLINEが連携されていません。メッセージを送信するにはLINE連携が必要です。
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* メッセージタイプ選択 */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              メッセージタイプ
            </Typography>
            <ToggleButtonGroup
              value={messageType}
              exclusive
              onChange={(e, v) => v && setMessageType(v)}
              size="small"
              fullWidth
            >
              <ToggleButton value="text">
                <TextFieldsIcon sx={{ mr: 0.5 }} fontSize="small" />
                テキスト
              </ToggleButton>
              <ToggleButton value="image">
                <ImageIcon sx={{ mr: 0.5 }} fontSize="small" />
                画像
              </ToggleButton>
              <ToggleButton value="property_card">
                <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
                物件カード
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* 案件セレクター */}
          <FormControl fullWidth margin="normal" size="small">
            <InputLabel>案件</InputLabel>
            <Select
              value={inquiryId}
              label="案件"
              onChange={(e) => setInquiryId(e.target.value)}
            >
              {inquiries.map((inq) => {
                const piNames = (inq.property_inquiries || [])
                  .map(pi => pi.building_name ? `${pi.building_name} ${pi.room_number || ''}`.trim() : null)
                  .filter(Boolean);
                const label = piNames.length > 0
                  ? `案件 #${inq.id} - ${piNames.join(', ')}`
                  : `案件 #${inq.id}`;
                return (
                  <MenuItem key={inq.id} value={inq.id}>
                    {label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {/* テキストメッセージ */}
          {messageType === 'text' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Box sx={{ flex: 1 }} />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<LinkIcon />}
                  onClick={() => setLinkPickerOpen(prev => !prev)}
                  sx={{ whiteSpace: 'nowrap', minWidth: 'auto' }}
                  disabled={!hasLine}
                  color={linkPickerOpen ? 'primary' : 'inherit'}
                >
                  リンク挿入
                </Button>
                {templates.length > 0 && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DescriptionIcon />}
                    onClick={(e) => setTemplateMenuAnchor(e.currentTarget)}
                    sx={{ whiteSpace: 'nowrap', minWidth: 'auto' }}
                    disabled={!hasLine}
                  >
                    テンプレート
                  </Button>
                )}
              </Box>
              <Collapse in={linkPickerOpen}>
                <ContentLinkPicker
                  customerId={customer?.id}
                  onInsertLink={(url) => setContent(prev => prev ? prev + '\n' + url : url)}
                  onRoomSelected={confirmAddProperty.checkAndPrompt}
                />
              </Collapse>
              <TextField
                label="メッセージ"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                fullWidth
                size="small"
                multiline
                rows={8}
                required
                disabled={!hasLine}
                placeholder="LINEで送信するメッセージを入力..."
              />
            </Box>
          )}

          {/* 画像メッセージ */}
          {messageType === 'image' && (
            <Box sx={{ mt: 1 }}>
              <TextField
                label="画像URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                fullWidth
                margin="normal"
                size="small"
                required
                disabled={!hasLine}
                placeholder="https://example.com/image.jpg"
                helperText="HTTPS URLのみ対応（JPEG, PNG）"
              />
              {imageUrl && (
                <Box sx={{ mt: 1, textAlign: 'center' }}>
                  <img
                    src={imageUrl}
                    alt="プレビュー"
                    style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </Box>
              )}
            </Box>
          )}

          {/* 物件カード */}
          {messageType === 'property_card' && (
            <Box sx={{ mt: 1 }}>
              <Autocomplete
                options={rooms}
                getOptionLabel={(option) =>
                  `${option.building_name || ''} ${option.room_number || ''}`.trim()
                }
                value={selectedRoom}
                onChange={(e, v) => {
                  setSelectedRoom(v);
                  if (v) confirmAddProperty.checkAndPrompt(v);
                }}
                disabled={!hasLine}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="物件を選択"
                    size="small"
                    required
                    placeholder="建物名・部屋番号で検索..."
                  />
                )}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <li key={key} {...otherProps}>
                      <Box>
                        <Typography variant="body2">
                          {option.building_name} {option.room_number}
                        </Typography>
                        {option.rent && (
                          <Typography variant="caption" color="text.secondary">
                            {Number(option.rent).toLocaleString()}円
                            {option.room_type_label && ` / ${option.room_type_label}`}
                          </Typography>
                        )}
                      </Box>
                    </li>
                  );
                }}
              />
              {selectedRoom && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  {selectedRoom.building_name} {selectedRoom.room_number} の物件カード（Flex Message）を送信します
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            キャンセル
          </Button>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={18} /> : <SendIcon />}
            onClick={handleSendClick}
            disabled={loading || !hasLine}
            sx={{ bgcolor: '#06C755', '&:hover': { bgcolor: '#05b04c' } }}
          >
            送信
          </Button>
        </DialogActions>
      </Dialog>

      {/* テンプレート選択メニュー */}
      <Menu
        anchorEl={templateMenuAnchor}
        open={Boolean(templateMenuAnchor)}
        onClose={() => setTemplateMenuAnchor(null)}
      >
        <Typography variant="caption" sx={{ px: 2, py: 0.5, color: 'text.secondary', display: 'block' }}>
          LINEテンプレートを選択
        </Typography>
        <Divider />
        {templates.map((t) => (
          <MenuItem key={t.id} onClick={() => handleTemplateSelect(t)}>
            <Box>
              <Typography variant="body2">{t.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {t.message_type === 'text' ? 'テキスト' : t.message_type === 'image' ? '画像' : 'Flex'}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>

      {/* 送信確認ダイアログ */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs">
        <DialogTitle>LINE送信の確認</DialogTitle>
        <DialogContent>
          <Typography>
            {customer?.name} 様にLINEメッセージを送信します。よろしいですか？
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            タイプ: {messageType === 'text' ? 'テキスト' : messageType === 'image' ? '画像' : '物件カード'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>キャンセル</Button>
          <Button
            variant="contained"
            onClick={handleSend}
            sx={{ bgcolor: '#06C755', '&:hover': { bgcolor: '#05b04c' } }}
          >
            送信する
          </Button>
        </DialogActions>
      </Dialog>

      {/* 案件外物件の登録確認ダイアログ */}
      <ConfirmAddPropertyDialog
        open={confirmAddProperty.dialogOpen}
        onClose={confirmAddProperty.handleDismiss}
        onConfirm={confirmAddProperty.handleConfirm}
        loading={confirmAddProperty.dialogLoading}
        roomName={
          confirmAddProperty.pendingRoom
            ? `${confirmAddProperty.pendingRoom.building_name || ''} ${confirmAddProperty.pendingRoom.room_number || ''}`.trim()
            : ''
        }
        error={confirmAddProperty.dialogError}
      />
    </>
  );
}
