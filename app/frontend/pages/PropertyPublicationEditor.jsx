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
  Alert,
  Grid,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  Public as PublicIcon,
  PublicOff as PublicOffIcon,
  ContentCopy as ContentCopyIcon,
  QrCode as QrCodeIcon,
  Home as HomeIcon,
  LocationOn as LocationOnIcon,
  AttachMoney as AttachMoneyIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import axios from 'axios';
import PhotoSelector from '../components/PropertyPublication/PhotoSelector';
import ContentSelector from '../components/PropertyPublication/ContentSelector';
import VisibleFieldsSelector from '../components/PropertyPublication/VisibleFieldsSelector';
import PhotoGallery from '../components/PropertyPublication/PhotoGallery';

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
    template_type: 'template1',
    visible_fields: {},
    publication_id: '',
    public_url: ''
  });
  const [room, setRoom] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState([]); // [{photo_id: number, comment: string}]
  const [selectedVrTourIds, setSelectedVrTourIds] = useState([]);
  const [selectedVirtualStagingIds, setSelectedVirtualStagingIds] = useState([]);

  // Preview data
  const [previewPhotos, setPreviewPhotos] = useState([]);
  const [previewVrTours, setPreviewVrTours] = useState([]);
  const [previewVirtualStagings, setPreviewVirtualStagings] = useState([]);

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

        // Ensure visible_fields is an object (not null/undefined)
        if (!data.visible_fields || typeof data.visible_fields !== 'object') {
          data.visible_fields = {};
        }

        setPropertyPublication(data);

        // Extract selected IDs and comments
        if (data.property_publication_photos) {
          setSelectedPhotos(data.property_publication_photos.map(p => ({
            photo_id: p.room_photo.id,
            comment: p.comment || ''
          })));
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
          template_type: propertyPublication.template_type,
          visible_fields: propertyPublication.visible_fields
        },
        photos: selectedPhotos,
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

  // Load preview data when preview tab is opened
  useEffect(() => {
    if (activeTab === 4 && room) {
      loadPreviewData();
    }
  }, [activeTab, selectedPhotos, selectedVrTourIds, selectedVirtualStagingIds]);

  const loadPreviewData = async () => {
    try {
      // Load photos
      if (selectedPhotos.length > 0) {
        const photoPromises = selectedPhotos.map(({ photo_id }) =>
          axios.get(`/api/v1/rooms/${roomId}/room_photos/${photo_id}`)
        );
        const photoResponses = await Promise.all(photoPromises);
        setPreviewPhotos(photoResponses.map((res, index) => ({
          room_photo: res.data,
          display_order: index,
          comment: selectedPhotos[index].comment
        })));
      } else {
        setPreviewPhotos([]);
      }

      // Load VR tours
      if (selectedVrTourIds.length > 0) {
        const vrTourPromises = selectedVrTourIds.map(vrTourId =>
          axios.get(`/api/v1/rooms/${roomId}/vr_tours/${vrTourId}`)
        );
        const vrTourResponses = await Promise.all(vrTourPromises);
        setPreviewVrTours(vrTourResponses.map(res => ({ vr_tour: res.data })));
      } else {
        setPreviewVrTours([]);
      }

      // Load virtual stagings
      if (selectedVirtualStagingIds.length > 0) {
        const virtualStagingPromises = selectedVirtualStagingIds.map(vsId =>
          axios.get(`/api/v1/rooms/${roomId}/virtual_stagings/${vsId}`)
        );
        const vsResponses = await Promise.all(virtualStagingPromises);
        setPreviewVirtualStagings(vsResponses.map(res => ({ virtual_staging: res.data })));
      } else {
        setPreviewVirtualStagings([]);
      }
    } catch (error) {
      console.error('Error loading preview data:', error);
    }
  };

  // Helper functions for display
  const getRoomTypeLabel = (roomType) => {
    const labels = {
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
      'other': 'その他'
    };
    return labels[roomType] || roomType;
  };

  const getBuildingTypeLabel = (buildingType) => {
    const labels = {
      'apartment': 'アパート',
      'mansion': 'マンション',
      'house': '一戸建て',
      'office': 'オフィス'
    };
    return labels[buildingType] || buildingType;
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
          <Tab label="プレビュー" />
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

            <Divider sx={{ my: 3 }} />

            <FormControl component="fieldset" sx={{ mt: 2 }}>
              <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold' }}>
                テンプレート選択
              </FormLabel>
              <RadioGroup
                value={propertyPublication.template_type}
                onChange={(e) => setPropertyPublication({ ...propertyPublication, template_type: e.target.value })}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <FormControlLabel
                      value="template0"
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography variant="body1" fontWeight="bold">テンプレート0（旧SUUMO風）</Typography>
                          <Typography variant="caption" color="text.secondary">
                            シンプルなブルー系デザイン
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {isEditMode && propertyPublication.publication_id && (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => {
                            window.open(`/property/${propertyPublication.publication_id}?preview=true&template=template0`, '_blank');
                          }}
                        >
                          プレビュー
                        </Button>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <FormControlLabel
                      value="template1"
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography variant="body1" fontWeight="bold">テンプレート1（新SUUMO風）</Typography>
                          <Typography variant="caption" color="text.secondary">
                            サンプル: SUUMO風デザイン
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<OpenInNewIcon />}
                        onClick={() => window.open('https://suumo.jp/chintai/jnc_000092620118/?bc=100395360648', '_blank')}
                      >
                        サンプル
                      </Button>
                      {isEditMode && propertyPublication.publication_id && (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => {
                            window.open(`/property/${propertyPublication.publication_id}?preview=true&template=template1`, '_blank');
                          }}
                        >
                          プレビュー
                        </Button>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <FormControlLabel
                      value="template2"
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography variant="body1" fontWeight="bold">テンプレート2（RoomSpot風）</Typography>
                          <Typography variant="caption" color="text.secondary">
                            グラデーションヒーロー、モダンカードデザイン
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<OpenInNewIcon />}
                        onClick={() => window.open('https://www.roomspot.net/rent/1139288674810000284493/', '_blank')}
                      >
                        サンプル
                      </Button>
                      {isEditMode && propertyPublication.publication_id && (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => {
                            window.open(`/property/${propertyPublication.publication_id}?preview=true&template=template2`, '_blank');
                          }}
                        >
                          プレビュー
                        </Button>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <FormControlLabel
                      value="template3"
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography variant="body1" fontWeight="bold">テンプレート3</Typography>
                          <Typography variant="caption" color="text.secondary">
                            サンプル: H-Sys風デザイン
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<OpenInNewIcon />}
                        onClick={() => window.open('https://www.h-sys.jp/chintai/detail-690a5b9951464927a166209b/', '_blank')}
                      >
                        サンプル
                      </Button>
                      {isEditMode && propertyPublication.publication_id && (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => {
                            window.open(`/property/${propertyPublication.publication_id}?preview=true&template=template3`, '_blank');
                          }}
                        >
                          プレビュー
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Box>
              </RadioGroup>
            </FormControl>
          </Paper>
        )}

        {/* Tab 1: Photo Selection */}
        {activeTab === 1 && (
          <PhotoSelector
            roomId={roomId}
            selectedPhotos={selectedPhotos}
            onSelectionChange={setSelectedPhotos}
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
              setPropertyPublication(prev => ({ ...prev, visible_fields: newFields }))
            }
          />
        )}

        {/* Tab 4: Preview */}
        {activeTab === 4 && room && (
          <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100%', p: 3 }}>
            <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
              {/* Header */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {propertyPublication.title || '（タイトル未設定）'}
                </Typography>

                {propertyPublication.catch_copy && (
                  <Typography variant="h6" color="primary" gutterBottom sx={{ fontWeight: 'medium' }}>
                    {propertyPublication.catch_copy}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                  {propertyPublication.visible_fields?.rent !== false && room.rent && (
                    <Chip
                      icon={<AttachMoneyIcon />}
                      label={`賃料: ${room.rent.toLocaleString()}円`}
                      color="primary"
                      size="medium"
                    />
                  )}
                  {propertyPublication.visible_fields?.room_type !== false && room.room_type && (
                    <Chip
                      icon={<HomeIcon />}
                      label={getRoomTypeLabel(room.room_type)}
                      size="medium"
                    />
                  )}
                  {propertyPublication.visible_fields?.address !== false && room.building?.address && (
                    <Chip
                      icon={<LocationOnIcon />}
                      label={room.building.address}
                      size="medium"
                    />
                  )}
                </Box>
              </Paper>

              <Grid container spacing={3}>
                {/* Left Column */}
                <Grid size={{ xs: 12, md: 8 }}>
                  {/* Image Gallery */}
                  {previewPhotos.length > 0 && (
                    <Paper sx={{ p: 3, mb: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        写真
                      </Typography>
                      <PhotoGallery photos={previewPhotos} />
                    </Paper>
                  )}

                  {/* Property Details */}
                  <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      物件詳細
                    </Typography>

                    {propertyPublication.pr_text && (
                      <>
                        <Typography variant="body1" paragraph>
                          {propertyPublication.pr_text}
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                      </>
                    )}

                    <Table size="small">
                      <TableBody>
                        {propertyPublication.visible_fields?.rent !== false && room.rent && (
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>賃料</TableCell>
                            <TableCell>{room.rent.toLocaleString()}円</TableCell>
                          </TableRow>
                        )}
                        {propertyPublication.visible_fields?.management_fee !== false && room.management_fee && (
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>管理費</TableCell>
                            <TableCell>{room.management_fee.toLocaleString()}円</TableCell>
                          </TableRow>
                        )}
                        {propertyPublication.visible_fields?.deposit !== false && room.deposit && (
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>敷金</TableCell>
                            <TableCell>{room.deposit.toLocaleString()}円</TableCell>
                          </TableRow>
                        )}
                        {propertyPublication.visible_fields?.key_money !== false && room.key_money && (
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>礼金</TableCell>
                            <TableCell>{room.key_money.toLocaleString()}円</TableCell>
                          </TableRow>
                        )}
                        {propertyPublication.visible_fields?.room_type !== false && room.room_type && (
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>間取り</TableCell>
                            <TableCell>{getRoomTypeLabel(room.room_type)}</TableCell>
                          </TableRow>
                        )}
                        {propertyPublication.visible_fields?.area !== false && room.area && (
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>専有面積</TableCell>
                            <TableCell>{room.area}m²</TableCell>
                          </TableRow>
                        )}
                        {propertyPublication.visible_fields?.floor !== false && room.floor && (
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>階数</TableCell>
                            <TableCell>{room.floor}階</TableCell>
                          </TableRow>
                        )}
                        {propertyPublication.visible_fields?.building_type !== false && room.building?.building_type && (
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>建物種別</TableCell>
                            <TableCell>{getBuildingTypeLabel(room.building.building_type)}</TableCell>
                          </TableRow>
                        )}
                        {propertyPublication.visible_fields?.structure !== false && room.building?.structure && (
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>構造</TableCell>
                            <TableCell>{room.building.structure}</TableCell>
                          </TableRow>
                        )}
                        {propertyPublication.visible_fields?.built_year !== false && room.building?.built_year && (
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>築年</TableCell>
                            <TableCell>{room.building.built_year}年</TableCell>
                          </TableRow>
                        )}
                        {propertyPublication.visible_fields?.facilities !== false && room.facilities && (
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>設備</TableCell>
                            <TableCell>{room.facilities}</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </Paper>

                  {/* VR Tour & Virtual Staging */}
                  <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      バーチャルコンテンツ
                    </Typography>

                    {/* VR Tours */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        VRツアー
                      </Typography>
                      {previewVrTours.length > 0 ? (
                        previewVrTours.map((item, index) => (
                          <Box key={item.vr_tour.id} sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                              {item.vr_tour.title}
                            </Typography>
                            {item.vr_tour.description && (
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {item.vr_tour.description}
                              </Typography>
                            )}
                            <Box
                              component="iframe"
                              src={`/room/${roomId}/vr-tour/${item.vr_tour.id}/viewer`}
                              sx={{
                                width: '100%',
                                height: 500,
                                border: '1px solid #e0e0e0',
                                borderRadius: 1,
                                mt: 1
                              }}
                            />
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          VRツアーが選択されていません
                        </Typography>
                      )}
                    </Box>

                    {/* Virtual Stagings */}
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        バーチャルステージング
                      </Typography>
                      {previewVirtualStagings.length > 0 ? (
                        previewVirtualStagings.map((item, index) => (
                          <Box key={item.virtual_staging.id} sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                              {item.virtual_staging.title}
                            </Typography>
                            {item.virtual_staging.description && (
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {item.virtual_staging.description}
                              </Typography>
                            )}
                            <Box
                              component="iframe"
                              src={`/room/${roomId}/virtual-staging/${item.virtual_staging.id}/viewer`}
                              sx={{
                                width: '100%',
                                height: 500,
                                border: '1px solid #e0e0e0',
                                borderRadius: 1,
                                mt: 1
                              }}
                            />
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          バーチャルステージングが選択されていません
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>

                {/* Right Column */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      プレビュー情報
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      これは編集中の内容のプレビューです。実際の公開ページとは異なる場合があります。
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" gutterBottom>
                      <strong>選択された画像:</strong> {selectedPhotos.length}枚
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>VRツアー:</strong> {selectedVrTourIds.length}件
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>バーチャルステージング:</strong> {selectedVirtualStagingIds.length}件
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Box>
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
