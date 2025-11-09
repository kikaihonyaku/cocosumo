import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Tabs,
  Tab,
  TextField,
  Paper,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  Public as PublicIcon,
  PublicOff as PublicOffIcon,
  ContentCopy as ContentCopyIcon,
  QrCode as QrCodeIcon
} from '@mui/icons-material';
import axios from 'axios';
import PhotoSelector from '../components/PropertyPublication/PhotoSelector';
import ContentSelector from '../components/PropertyPublication/ContentSelector';
import VisibleFieldsSelector from '../components/PropertyPublication/VisibleFieldsSelector';

function PropertyPublicationEditor() {
  const { roomId, id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // State
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [qrCodeDialog, setQrCodeDialog] = useState(false);

  // Data state
  const [propertyPublication, setPropertyPublication] = useState({
    title: '',
    catch_copy: '',
    pr_text: '',
    status: 'draft',
    visible_fields: {},
    publication_id: '',
    public_url: ''
  });
  const [room, setRoom] = useState(null);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);
  const [selectedVrTourIds, setSelectedVrTourIds] = useState([]);
  const [selectedVirtualStagingIds, setSelectedVirtualStagingIds] = useState([]);

  // Load data
  useEffect(() => {
    loadData();
  }, [roomId, id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load room data
      const roomResponse = await axios.get(`/api/v1/rooms/${roomId}`);
      setRoom(roomResponse.data);

      // Load property publication data if in edit mode
      if (isEditMode) {
        const response = await axios.get(`/api/v1/rooms/${roomId}/property_publications/${id}`);
        const data = response.data;

        setPropertyPublication(data);

        // Extract selected IDs
        if (data.property_publication_photos) {
          setSelectedPhotoIds(data.property_publication_photos.map(p => p.room_photo.id));
        }
        if (data.property_publication_vr_tours) {
          setSelectedVrTourIds(data.property_publication_vr_tours.map(v => v.vr_tour.id));
        }
        if (data.property_publication_virtual_stagings) {
          setSelectedVirtualStagingIds(data.property_publication_virtual_stagings.map(v => v.virtual_staging.id));
        }
      } else {
        // Set default title for new publication
        setPropertyPublication(prev => ({
          ...prev,
          title: `${roomResponse.data.building.name} ${roomResponse.data.room_number}号室`
        }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showSnackbar('データの読み込みに失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        property_publication: {
          title: propertyPublication.title,
          catch_copy: propertyPublication.catch_copy,
          pr_text: propertyPublication.pr_text,
          status: propertyPublication.status,
          visible_fields: propertyPublication.visible_fields
        },
        photo_ids: selectedPhotoIds,
        vr_tour_ids: selectedVrTourIds,
        virtual_staging_ids: selectedVirtualStagingIds
      };

      if (isEditMode) {
        const response = await axios.patch(`/api/v1/rooms/${roomId}/property_publications/${id}`, payload);
        setPropertyPublication(response.data);
        showSnackbar('保存しました', 'success');
      } else {
        const response = await axios.post(`/api/v1/rooms/${roomId}/property_publications`, payload);
        setPropertyPublication(response.data);
        showSnackbar('作成しました', 'success');
        // Navigate to edit mode
        navigate(`/room/${roomId}/property-publication/${response.data.id}/edit`, { replace: true });
      }
    } catch (error) {
      console.error('Error saving:', error);
      showSnackbar('保存に失敗しました', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      const response = await axios.post(`/api/v1/rooms/${roomId}/property_publications/${id}/publish`);
      setPropertyPublication(response.data.property_publication);
      showSnackbar('公開しました', 'success');
    } catch (error) {
      console.error('Error publishing:', error);
      showSnackbar('公開に失敗しました', 'error');
    }
  };

  const handleUnpublish = async () => {
    try {
      const response = await axios.post(`/api/v1/rooms/${roomId}/property_publications/${id}/unpublish`);
      setPropertyPublication(response.data.property_publication);
      showSnackbar('非公開にしました', 'success');
    } catch (error) {
      console.error('Error unpublishing:', error);
      showSnackbar('非公開に失敗しました', 'error');
    }
  };

  const handleCopyUrl = () => {
    if (propertyPublication.public_url) {
      navigator.clipboard.writeText(propertyPublication.public_url);
      showSnackbar('URLをコピーしました', 'success');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate(`/room/${roomId}`)}>
            <ArrowBackIcon />
          </IconButton>

          <Typography variant="h6" sx={{ flexGrow: 1, ml: 2 }}>
            {isEditMode ? '物件公開ページ編集' : '物件公開ページ作成'}
          </Typography>

          {isEditMode && (
            <Chip
              label={propertyPublication.status === 'published' ? '公開中' : '下書き'}
              color={propertyPublication.status === 'published' ? 'success' : 'default'}
              size="small"
              sx={{ mr: 2 }}
            />
          )}

          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving}
            sx={{ mr: 1 }}
          >
            保存
          </Button>

          {isEditMode && (
            <>
              {propertyPublication.status === 'published' ? (
                <Button
                  variant="outlined"
                  startIcon={<PublicOffIcon />}
                  onClick={handleUnpublish}
                  sx={{ mr: 1 }}
                >
                  非公開
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PublicIcon />}
                  onClick={handlePublish}
                  sx={{ mr: 1 }}
                >
                  公開
                </Button>
              )}

              {propertyPublication.status === 'published' && (
                <>
                  <IconButton onClick={handleCopyUrl} title="URLをコピー">
                    <ContentCopyIcon />
                  </IconButton>
                  <IconButton onClick={() => setQrCodeDialog(true)} title="QRコード">
                    <QrCodeIcon />
                  </IconButton>
                </>
              )}
            </>
          )}
        </Toolbar>

        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="基本情報" />
          <Tab label="画像選択" />
          <Tab label="コンテンツ" />
          <Tab label="表示項目" />
        </Tabs>
      </AppBar>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {/* Tab 0: Basic Info */}
        {activeTab === 0 && (
          <Paper sx={{ p: 3, maxWidth: 800 }}>
            <Typography variant="h6" gutterBottom>
              基本情報
            </Typography>

            <TextField
              fullWidth
              label="タイトル"
              value={propertyPublication.title}
              onChange={(e) => setPropertyPublication({ ...propertyPublication, title: e.target.value })}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="キャッチコピー"
              value={propertyPublication.catch_copy}
              onChange={(e) => setPropertyPublication({ ...propertyPublication, catch_copy: e.target.value })}
              margin="normal"
              multiline
              rows={2}
              placeholder="物件の魅力を一言で表現してください"
            />

            <TextField
              fullWidth
              label="PR文"
              value={propertyPublication.pr_text}
              onChange={(e) => setPropertyPublication({ ...propertyPublication, pr_text: e.target.value })}
              margin="normal"
              multiline
              rows={4}
              placeholder="物件の詳細な説明や特徴を記載してください"
            />
          </Paper>
        )}

        {/* Tab 1: Photo Selection */}
        {activeTab === 1 && (
          <PhotoSelector
            roomId={roomId}
            selectedPhotoIds={selectedPhotoIds}
            onSelectionChange={setSelectedPhotoIds}
          />
        )}

        {/* Tab 2: Content */}
        {activeTab === 2 && (
          <ContentSelector
            roomId={roomId}
            selectedVrTourIds={selectedVrTourIds}
            selectedVirtualStagingIds={selectedVirtualStagingIds}
            onVrTourSelectionChange={setSelectedVrTourIds}
            onVirtualStagingSelectionChange={setSelectedVirtualStagingIds}
          />
        )}

        {/* Tab 3: Visible Fields */}
        {activeTab === 3 && (
          <VisibleFieldsSelector
            visibleFields={propertyPublication.visible_fields}
            onVisibleFieldsChange={(newFields) =>
              setPropertyPublication({ ...propertyPublication, visible_fields: newFields })
            }
          />
        )}
      </Box>

      {/* QR Code Dialog */}
      <Dialog open={qrCodeDialog} onClose={() => setQrCodeDialog(false)}>
        <DialogTitle>QRコード</DialogTitle>
        <DialogContent>
          {propertyPublication.qr_code_data_url && (
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <img src={propertyPublication.qr_code_data_url} alt="QR Code" style={{ maxWidth: '100%' }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrCodeDialog(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default PropertyPublicationEditor;
