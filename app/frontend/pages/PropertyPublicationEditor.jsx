import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  OpenInNew as OpenInNewIcon,
  CloudDone as CloudDoneIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import axios from 'axios';
import PhotoSelector from '../components/PropertyPublication/PhotoSelector';
import ContentSelector from '../components/PropertyPublication/ContentSelector';
import VisibleFieldsSelector from '../components/PropertyPublication/VisibleFieldsSelector';
import PhotoGallery from '../components/PropertyPublication/PhotoGallery';
import RichTextEditor from '../components/shared/RichTextEditor';
import InquiryList from '../components/PropertyPublication/InquiryList';
import ViewAnalyticsDashboard from '../components/PropertyPublication/ViewAnalyticsDashboard';
import CustomerAccessPanel from '../components/CustomerAccess/CustomerAccessPanel';
import PresentationAccessPanel from '../components/SalesPresentation/PresentationAccessPanel';
import BeforeAfterViewer from '../components/VirtualStaging/BeforeAfterViewer';
import { getRoomTypeLabel } from '../utils/formatters';
import { useCopyToClipboard } from '../hooks/useClipboard';

function PropertyPublicationEditor() {
  const { roomId, id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = Boolean(id);

  // Get initial tab from URL parameter (tab=inquiries, tab=access, etc.)
  const getInitialTab = () => {
    const tabParam = searchParams.get('tab');
    if (!isEditMode) return 0;
    switch (tabParam) {
      case 'photos': return 1;
      case 'content': return 2;
      case 'fields': return 3;
      case 'preview': return 4;
      case 'access': return 5;
      case 'inquiries': return 6;
      case 'analytics': return 7;
      default: return 0;
    }
  };

  // State
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [qrCodeDialog, setQrCodeDialog] = useState(false);

  // Auto-save state
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const autoSaveIntervalRef = useRef(null);
  const lastSavedDataRef = useRef(null);

  // Data state
  const [propertyPublication, setPropertyPublication] = useState({
    title: '',
    catch_copy: '',
    pr_text: '',
    status: 'draft',
    template_type: 'template1',
    visible_fields: {},
    publication_id: '',
    public_url: '',
    primary_color: '',
    accent_color: '',
    access_password: '',
    expires_at: ''
  });
  const [room, setRoom] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState([]); // [{photo_id: number, comment: string}]
  const [selectedVrTourIds, setSelectedVrTourIds] = useState([]);
  const [selectedVirtualStagingIds, setSelectedVirtualStagingIds] = useState([]);

  // Preview data
  const [previewPhotos, setPreviewPhotos] = useState([]);
  const [previewVrTours, setPreviewVrTours] = useState([]);
  const [previewVirtualStagings, setPreviewVirtualStagings] = useState([]);

  // Clipboard hook (supports fallback for non-secure contexts)
  const { copy: copyToClipboard } = useCopyToClipboard();

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

  // Create current data snapshot for comparison
  const getCurrentDataSnapshot = useCallback(() => {
    return JSON.stringify({
      propertyPublication: {
        title: propertyPublication.title,
        catch_copy: propertyPublication.catch_copy,
        pr_text: propertyPublication.pr_text,
        template_type: propertyPublication.template_type,
        visible_fields: propertyPublication.visible_fields,
        primary_color: propertyPublication.primary_color,
        accent_color: propertyPublication.accent_color,
        access_password: propertyPublication.access_password,
        expires_at: propertyPublication.expires_at
      },
      selectedPhotos,
      selectedVrTourIds,
      selectedVirtualStagingIds
    });
  }, [propertyPublication, selectedPhotos, selectedVrTourIds, selectedVirtualStagingIds]);

  // Initialize lastSavedDataRef after data is loaded
  useEffect(() => {
    if (!loading && !lastSavedDataRef.current) {
      // Set initial snapshot after first load
      setTimeout(() => {
        lastSavedDataRef.current = getCurrentDataSnapshot();
      }, 100);
    }
  }, [loading, getCurrentDataSnapshot]);

  // Check if data has changed
  useEffect(() => {
    if (loading) return;

    const currentSnapshot = getCurrentDataSnapshot();
    if (lastSavedDataRef.current && currentSnapshot !== lastSavedDataRef.current) {
      setIsDirty(true);
    }
  }, [getCurrentDataSnapshot, loading]);

  // Auto-save effect
  useEffect(() => {
    if (!autoSaveEnabled || !isEditMode) return;

    // Clear existing interval
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }

    // Set up new interval (30 seconds)
    autoSaveIntervalRef.current = setInterval(() => {
      if (isDirty && !saving) {
        handleAutoSave();
      }
    }, 30000);

    // Cleanup on unmount
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [autoSaveEnabled, isEditMode, isDirty, saving]);

  // Auto-save handler (silent save without navigation)
  const handleAutoSave = async () => {
    if (!isEditMode || saving) return;

    setSaving(true);
    try {
      const payload = {
        property_publication: {
          title: propertyPublication.title,
          catch_copy: propertyPublication.catch_copy,
          pr_text: propertyPublication.pr_text,
          status: propertyPublication.status,
          template_type: propertyPublication.template_type,
          visible_fields: propertyPublication.visible_fields,
          primary_color: propertyPublication.primary_color || null,
          accent_color: propertyPublication.accent_color || null,
          access_password: propertyPublication.access_password || null,
          expires_at: propertyPublication.expires_at || null
        },
        photos: selectedPhotos,
        vr_tour_ids: selectedVrTourIds,
        virtual_staging_ids: selectedVirtualStagingIds
      };

      await axios.patch(`/api/v1/rooms/${roomId}/property_publications/${id}`, payload);
      lastSavedDataRef.current = getCurrentDataSnapshot();
      setIsDirty(false);
      setLastSavedAt(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Don't show error for auto-save, just log it
    } finally {
      setSaving(false);
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
          visible_fields: propertyPublication.visible_fields,
          primary_color: propertyPublication.primary_color || null,
          accent_color: propertyPublication.accent_color || null,
          access_password: propertyPublication.access_password || null,
          expires_at: propertyPublication.expires_at || null
        },
        photos: selectedPhotos,
        vr_tour_ids: selectedVrTourIds,
        virtual_staging_ids: selectedVirtualStagingIds
      };

      if (isEditMode) {
        const response = await axios.patch(`/api/v1/rooms/${roomId}/property_publications/${id}`, payload);
        setPropertyPublication(response.data);
        lastSavedDataRef.current = getCurrentDataSnapshot();
        setIsDirty(false);
        setLastSavedAt(new Date());
        showSnackbar('保存しました', 'success');
      } else {
        const response = await axios.post(`/api/v1/rooms/${roomId}/property_publications`, payload);
        setPropertyPublication(response.data);
        lastSavedDataRef.current = getCurrentDataSnapshot();
        setIsDirty(false);
        setLastSavedAt(new Date());
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

  const handleCopyUrl = async () => {
    if (propertyPublication.public_url) {
      const success = await copyToClipboard(propertyPublication.public_url);
      if (success) {
        showSnackbar('URLをコピーしました', 'success');
      } else {
        showSnackbar('URLのコピーに失敗しました', 'error');
      }
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh * var(--vh-correction, 1))' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh * var(--vh-correction, 1))' }}>
      {/* Header */}
      <AppBar position="static" elevation={0} sx={{
        bgcolor: 'primary.main',
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        borderRadius: '12px 12px 0 0',
      }}>
        <Toolbar variant="dense" sx={{ minHeight: 52 }}>
          <IconButton
            edge="start"
            onClick={() => navigate(-1)}
            sx={{ mr: 1, color: 'white' }}
          >
            <ArrowBackIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h6" component="h1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
              {isEditMode ? '公開ページ編集' : '公開ページ作成'}
            </Typography>
            {room && (
              <Typography variant="body2" sx={{ opacity: 0.8, fontSize: '0.85rem' }}>
                {room.building?.name} - {room.room_number}号室
              </Typography>
            )}
          </Box>

          {isEditMode && (
            <Chip
              label={propertyPublication.status === 'published' ? '公開中' : '下書き'}
              color={propertyPublication.status === 'published' ? 'success' : 'default'}
              icon={propertyPublication.status === 'published' ? <PublicIcon /> : <PublicOffIcon />}
              size="small"
              sx={{ mr: 2 }}
            />
          )}

          {/* Auto-save status indicator */}
          {isEditMode && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                mr: 2,
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.75rem'
              }}
            >
              {saving ? (
                <>
                  <CloudUploadIcon sx={{ fontSize: 18 }} />
                  <Typography variant="caption">保存中...</Typography>
                </>
              ) : isDirty ? (
                <>
                  <CloudUploadIcon sx={{ fontSize: 18, opacity: 0.7 }} />
                  <Typography variant="caption">未保存の変更あり</Typography>
                </>
              ) : lastSavedAt ? (
                <>
                  <CloudDoneIcon sx={{ fontSize: 18 }} />
                  <Typography variant="caption">
                    保存済み {lastSavedAt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </>
              ) : null}
            </Box>
          )}

          <Button
            variant="contained"
            color="secondary"
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
                  sx={{
                    mr: 1,
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                    }
                  }}
                >
                  非公開
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<PublicIcon />}
                  onClick={handlePublish}
                  sx={{ mr: 1 }}
                >
                  公開
                </Button>
              )}

              {propertyPublication.status === 'published' && (
                <>
                  <IconButton
                    onClick={handleCopyUrl}
                    title="URLをコピー"
                    sx={{ color: 'white' }}
                  >
                    <ContentCopyIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => setQrCodeDialog(true)}
                    title="QRコード"
                    sx={{ color: 'white' }}
                  >
                    <QrCodeIcon />
                  </IconButton>
                </>
              )}
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          px: 1,
          minHeight: 36,
          '& .MuiTab-root': {
            minHeight: 36,
            py: 0.5,
            fontSize: '0.85rem',
          }
        }}
      >
        <Tab label="基本情報" />
        <Tab label="画像選択" />
        <Tab label="コンテンツ" />
        <Tab label="表示項目" />
        <Tab label="プレビュー" />
        {isEditMode && <Tab label="顧客アクセス" />}
        {isEditMode && <Tab label="問い合わせ" />}
        {isEditMode && <Tab label="分析" />}
      </Tabs>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {/* Tab 0: Basic Info */}
        {activeTab === 0 && (
          <Box sx={{ display: 'flex', gap: 3, maxWidth: 1400 }}>
            {/* 左ペイン */}
            <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* 基本情報カード */}
            <Paper sx={{ p: 3 }}>
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

              <Box sx={{ mt: 2 }}>
                <RichTextEditor
                  label="PR文"
                  value={propertyPublication.pr_text}
                  onChange={(html) => setPropertyPublication({ ...propertyPublication, pr_text: html })}
                  placeholder="物件の詳細な説明や特徴を記載してください"
                  minHeight={150}
                />
              </Box>
            </Paper>

            {/* テンプレート選択カード */}
            <Paper sx={{ p: 3 }}>
              <FormControl component="fieldset" sx={{ width: '100%' }}>
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
                            navigate(`/property/${propertyPublication.publication_id}?preview=true&template=template0&roomId=${roomId}&publicationId=${id}`);
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
                      {isEditMode && propertyPublication.publication_id && (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => {
                            navigate(`/property/${propertyPublication.publication_id}?preview=true&template=template1&roomId=${roomId}&publicationId=${id}`);
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
                      {isEditMode && propertyPublication.publication_id && (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => {
                            navigate(`/property/${propertyPublication.publication_id}?preview=true&template=template2&roomId=${roomId}&publicationId=${id}`);
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
                          <Typography variant="body1" fontWeight="bold">テンプレート3（H-Sys風）</Typography>
                          <Typography variant="caption" color="text.secondary">
                            シンプルなレイアウト
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
                            navigate(`/property/${propertyPublication.publication_id}?preview=true&template=template3&roomId=${roomId}&publicationId=${id}`);
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
            </Box>

            {/* 右ペイン */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* カラーカスタマイズ */}
            <Paper sx={{ p: 3 }}>
              <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold' }}>
                カラーカスタマイズ（オプション）
              </FormLabel>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                カスタムカラーを指定しない場合、テンプレートのデフォルトカラーが使用されます
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>メインカラー</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <input
                      type="color"
                      value={propertyPublication.primary_color || '#1976d2'}
                      onChange={(e) => setPropertyPublication({ ...propertyPublication, primary_color: e.target.value })}
                      style={{ width: 50, height: 40, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    />
                    <TextField
                      size="small"
                      value={propertyPublication.primary_color || ''}
                      onChange={(e) => setPropertyPublication({ ...propertyPublication, primary_color: e.target.value })}
                      placeholder="#1976d2"
                      sx={{ width: 120 }}
                    />
                    {propertyPublication.primary_color && (
                      <Button
                        size="small"
                        onClick={() => setPropertyPublication({ ...propertyPublication, primary_color: '' })}
                      >
                        リセット
                      </Button>
                    )}
                  </Box>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>アクセントカラー</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <input
                      type="color"
                      value={propertyPublication.accent_color || '#ff5722'}
                      onChange={(e) => setPropertyPublication({ ...propertyPublication, accent_color: e.target.value })}
                      style={{ width: 50, height: 40, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    />
                    <TextField
                      size="small"
                      value={propertyPublication.accent_color || ''}
                      onChange={(e) => setPropertyPublication({ ...propertyPublication, accent_color: e.target.value })}
                      placeholder="#ff5722"
                      sx={{ width: 120 }}
                    />
                    {propertyPublication.accent_color && (
                      <Button
                        size="small"
                        onClick={() => setPropertyPublication({ ...propertyPublication, accent_color: '' })}
                      >
                        リセット
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>
            </Paper>

            {/* アクセス制限設定 */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>アクセス制限</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>パスワード保護（任意）</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="text"
                    value={propertyPublication.access_password || ''}
                    onChange={(e) => setPropertyPublication({ ...propertyPublication, access_password: e.target.value })}
                    placeholder="設定するとパスワード入力が必要になります"
                    helperText="空白の場合は誰でもアクセス可能"
                  />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>有効期限（任意）</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="datetime-local"
                    value={propertyPublication.expires_at ? new Date(propertyPublication.expires_at).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setPropertyPublication({ ...propertyPublication, expires_at: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                    helperText="設定すると指定日時以降はアクセス不可"
                    InputLabelProps={{ shrink: true }}
                  />
                  {propertyPublication.expires_at && (
                    <Button
                      size="small"
                      sx={{ mt: 1 }}
                      onClick={() => setPropertyPublication({ ...propertyPublication, expires_at: '' })}
                    >
                      期限をクリア
                    </Button>
                  )}
                </Box>
              </Box>
            </Paper>
            </Box>
          </Box>
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
            publicationId={id}
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
                        <Box
                          sx={{
                            '& p': { margin: '0 0 0.5em 0' },
                            '& h2': { fontSize: '1.25rem', fontWeight: 600, margin: '1em 0 0.5em 0' },
                            '& h3': { fontSize: '1.1rem', fontWeight: 600, margin: '1em 0 0.5em 0' },
                            '& ul, & ol': { paddingLeft: '1.5em', margin: '0.5em 0' },
                            '& li': { margin: '0.25em 0' },
                            '& blockquote': {
                              borderLeft: '3px solid',
                              borderColor: 'grey.300',
                              paddingLeft: '1em',
                              margin: '0.5em 0',
                              color: 'text.secondary',
                              fontStyle: 'italic',
                            },
                            '& a': { color: 'primary.main', textDecoration: 'underline' },
                          }}
                          dangerouslySetInnerHTML={{ __html: propertyPublication.pr_text }}
                        />
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
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="subtitle1" fontWeight={600}>
                                {item.virtual_staging.title}
                              </Typography>
                              {item.virtual_staging.status !== 'published' && (
                                <Chip
                                  label="未公開"
                                  size="small"
                                  color="warning"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                            {item.virtual_staging.status !== 'published' && (
                              <Alert severity="warning" sx={{ mb: 1, py: 0 }}>
                                このバーチャルステージングは未公開のため、公開ページには表示されません
                              </Alert>
                            )}
                            {item.virtual_staging.description && (
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {item.virtual_staging.description}
                              </Typography>
                            )}
                            <Box sx={{ mt: 1 }}>
                              <BeforeAfterViewer
                                beforeImageUrl={item.virtual_staging.before_photo_url}
                                afterImageUrl={item.virtual_staging.after_photo_url}
                                beforeLabel="Before"
                                afterLabel="After"
                                showTitle={false}
                              />
                            </Box>
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

        {/* Tab 5: Customer Access & Presentation (Edit mode only) */}
        {activeTab === 5 && isEditMode && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 800 }}>
            <Paper sx={{ p: 3 }}>
              <CustomerAccessPanel publicationId={id} />
            </Paper>
            <Paper sx={{ p: 3 }}>
              <PresentationAccessPanel publicationId={id} />
            </Paper>
          </Box>
        )}

        {/* Tab 6: Inquiries (Edit mode only) */}
        {activeTab === 6 && isEditMode && (
          <Paper sx={{ p: 3, maxWidth: 900 }}>
            <InquiryList publicationId={id} roomId={roomId} />
          </Paper>
        )}

        {/* Tab 7: 分析タブ */}
        {activeTab === 7 && isEditMode && (
          <Paper sx={{ p: 3, maxWidth: 1200 }}>
            <ViewAnalyticsDashboard publicationId={propertyPublication.publication_id} />
          </Paper>
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
