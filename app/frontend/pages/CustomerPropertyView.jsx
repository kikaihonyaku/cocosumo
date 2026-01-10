import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Divider,
  Chip,
  Grid,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Card,
  CardContent,
  CardActionArea,
  Container,
  useMediaQuery,
  useTheme,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import {
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Schedule as ScheduleIcon,
  Home as HomeIcon,
  LocationOn as LocationOnIcon,
  AttachMoney as AttachMoneyIcon,
  Map as MapIcon,
  Chat as ChatIcon,
  Directions as DirectionsIcon,
  DirectionsWalk as DirectionsWalkIcon,
  DirectionsTransit as DirectionsTransitIcon,
  DirectionsCar as DirectionsCarIcon,
  ViewInAr as ViewInArIcon,
  Image as ImageIcon,
  OpenInNew as OpenInNewIcon,
  PlayArrow as PlayArrowIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import axios from 'axios';
import CustomerHeader from '../components/CustomerAccess/CustomerHeader';
import PhotoGallery from '../components/PropertyPublication/PhotoGallery';
import PropertyMapPanel from '../components/BuildingDetail/PropertyMapPanel';
import CustomerRouteDialog from '../components/CustomerAccess/CustomerRouteDialog';
import InquiryForm from '../components/PropertyPublication/InquiryForm';
import { getRoomTypeLabel } from '../utils/formatters';

export default function CustomerPropertyView() {
  const { accessToken } = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [activeSection, setActiveSection] = useState('info');

  // 経路・スライドショー関連
  const [activeRoute, setActiveRoute] = useState(null);
  const [inlineSlideshow, setInlineSlideshow] = useState(null);

  // 顧客経路関連
  const [customerRoutes, setCustomerRoutes] = useState([]);
  const [isRouteDialogOpen, setIsRouteDialogOpen] = useState(false);
  const [deletingRouteId, setDeletingRouteId] = useState(null);

  // お問い合わせダイアログ
  const [inquiryDialogOpen, setInquiryDialogOpen] = useState(false);

  const loadData = useCallback(async (withPassword = null) => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (withPassword) {
        params.password = withPassword;
      }

      const response = await axios.get(`/api/v1/customer/${accessToken}`, { params });
      setData(response.data);
      setPasswordRequired(false);
      setVerifyingPassword(false);

      // 顧客経路を設定
      if (response.data.customer_routes) {
        setCustomerRoutes(response.data.customer_routes);
      }

      // トラッキング
      trackView();
    } catch (err) {
      console.error('Failed to load customer property data:', err);

      if (err.response?.status === 401) {
        if (err.response.data.error === 'password_required') {
          setPasswordRequired(true);
          setCustomerName(err.response.data.customer_name || '');
        } else if (err.response.data.error === 'invalid_password') {
          setPasswordError('パスワードが正しくありません');
        }
      } else if (err.response?.status === 410) {
        setPasswordRequired(false);
        setError('このページの有効期限が切れています');
      } else if (err.response?.status === 403) {
        setPasswordRequired(false);
        setError('このページへのアクセスは取り消されています');
      } else if (err.response?.status === 404) {
        setPasswordRequired(false);
        setError(err.response.data.error || 'ページが見つかりませんでした');
      } else {
        setPasswordRequired(false);
        setError('データの読み込みに失敗しました');
      }
      setVerifyingPassword(false);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const trackView = async () => {
    try {
      const deviceType = /mobile/i.test(navigator.userAgent) ? 'mobile' :
                        /tablet/i.test(navigator.userAgent) ? 'tablet' : 'desktop';
      await axios.post(`/api/v1/customer/${accessToken}/track_view`, {
        device_type: deviceType
      });
    } catch (err) {
      console.log('View tracking skipped');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setVerifyingPassword(true);
    loadData(password);
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

  // 経路選択ハンドラ
  const handleRouteSelect = (route) => {
    setActiveRoute(route);
  };

  // 経路スライドショー開始
  const handleStartSlideshow = async (route) => {
    if (!route.calculated || !route.id) {
      return;
    }

    try {
      const building = data?.room?.building;
      if (!building?.id) return;

      // ストリートビューポイントを取得
      const response = await axios.get(
        `/api/v1/buildings/${building.id}/routes/${route.id}/streetview_points`
      );

      if (!response.data.points || response.data.points.length === 0) {
        return;
      }

      // インラインスライドショーを開始
      setInlineSlideshow({
        route,
        points: response.data.points,
      });
      setActiveRoute(route);
    } catch (error) {
      console.error('Failed to start slideshow:', error);
    }
  };

  // スライドショー終了
  const handleSlideshowEnd = () => {
    setInlineSlideshow(null);
  };

  // 顧客経路作成
  const handleRouteCreated = (newRoute) => {
    setCustomerRoutes(prev => [...prev, newRoute]);
    setIsRouteDialogOpen(false);
  };

  // 顧客経路削除
  const handleDeleteCustomerRoute = async (routeId) => {
    if (!window.confirm('この経路を削除しますか？')) return;

    setDeletingRouteId(routeId);
    try {
      await axios.delete(`/api/v1/customer/${accessToken}/routes/${routeId}`);
      setCustomerRoutes(prev => prev.filter(r => r.id !== routeId));
      if (activeRoute?.id === routeId) {
        setActiveRoute(null);
        setInlineSlideshow(null);
      }
    } catch (err) {
      console.error('Failed to delete customer route:', err);
      alert('経路の削除に失敗しました');
    } finally {
      setDeletingRouteId(null);
    }
  };

  // 顧客経路のスライドショー開始
  const handleStartCustomerRouteSlideshow = async (route) => {
    if (!route.calculated || !route.id) {
      return;
    }

    try {
      // 顧客経路用のエンドポイントを使用
      const response = await axios.get(
        `/api/v1/customer/${accessToken}/routes/${route.id}/streetview_points`
      );

      if (!response.data.points || response.data.points.length === 0) {
        return;
      }

      // インラインスライドショーを開始
      setInlineSlideshow({
        route,
        points: response.data.points,
      });
      setActiveRoute(route);
    } catch (error) {
      console.error('Failed to start customer route slideshow:', error);
    }
  };

  // 移動手段アイコン取得
  const getTravelModeIcon = (travelMode) => {
    switch (travelMode) {
      case 'walking':
        return <DirectionsWalkIcon fontSize="small" />;
      case 'transit':
        return <DirectionsTransitIcon fontSize="small" />;
      case 'driving':
        return <DirectionsCarIcon fontSize="small" />;
      default:
        return <DirectionsIcon fontSize="small" />;
    }
  };

  // 移動手段ラベル取得
  const getTravelModeLabel = (travelMode) => {
    switch (travelMode) {
      case 'walking':
        return '徒歩';
      case 'transit':
        return '電車';
      case 'driving':
        return '車';
      default:
        return travelMode;
    }
  };

  // パスワード入力画面
  if (passwordRequired) {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e3f2fd 0%, #e8eaf6 50%, #f3e5f5 100%)',
        p: 2
      }}>
        <Paper
          elevation={8}
          sx={{
            p: { xs: 4, sm: 5 },
            maxWidth: 420,
            width: '100%',
            textAlign: 'center',
            borderRadius: 4
          }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              bgcolor: 'primary.50',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3
            }}
          >
            <LockIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          </Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            パスワードで保護されています
          </Typography>
          {customerName && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {customerName} 様専用ページ
            </Typography>
          )}
          <form onSubmit={handlePasswordSubmit}>
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              label="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!passwordError}
              helperText={passwordError}
              sx={{ mb: 2 }}
              disabled={verifyingPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={verifyingPassword}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <Button
              fullWidth
              variant="contained"
              type="submit"
              size="large"
              disabled={!password || verifyingPassword}
              startIcon={verifyingPassword ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{ py: 1.5, borderRadius: 2 }}
            >
              {verifyingPassword ? '確認中...' : '確認'}
            </Button>
          </form>
        </Paper>
      </Box>
    );
  }

  // ローディング画面
  if (loading) {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%)'
      }}>
        <CircularProgress size={48} />
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2, fontSize: '1rem' }}>
          読み込み中...
        </Typography>
      </Box>
    );
  }

  // エラー画面
  if (error) {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%)',
        p: 2
      }}>
        <Paper
          elevation={8}
          sx={{
            p: { xs: 4, sm: 5 },
            maxWidth: 420,
            width: '100%',
            textAlign: 'center',
            borderRadius: 4
          }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              bgcolor: 'error.50',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3
            }}
          >
            <CloseIcon sx={{ fontSize: 36, color: 'error.main' }} />
          </Box>
          <Alert severity="error" sx={{ mb: 3, fontSize: '0.95rem' }}>
            {error}
          </Alert>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.95rem' }}>
            お問い合わせは担当者までご連絡ください。
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (!data) return null;

  const { room, customer_access, property_publication_photos, property_publication_vr_tours,
          property_publication_virtual_stagings, building_routes, public_url } = data;
  const building = room?.building;
  const visibleFields = data.visible_fields_with_defaults || {};

  // 全経路（顧客経路（新しい順） + 建物経路）を統合
  const allRoutes = [
    ...[...customerRoutes].reverse().map(r => ({ ...r, is_customer_route: true })),
    ...(building_routes || []).map(r => ({ ...r, is_customer_route: false }))
  ];

  // 顧客経路の最大数
  const MAX_CUSTOMER_ROUTES = 4;
  const canAddMoreRoutes = customerRoutes.length < MAX_CUSTOMER_ROUTES;

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%)' }}>
      {/* 顧客向けヘッダー */}
      <CustomerHeader
        customerName={customer_access?.customer_name}
        expiresAt={customer_access?.expires_at}
        formattedExpiresAt={customer_access?.formatted_expires_at}
        daysUntilExpiry={customer_access?.days_until_expiry}
      />

      {/* 申し送り事項 */}
      {customer_access?.customer_message && (
        <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 3 } }}>
          <Paper
            sx={{
              p: 2,
              bgcolor: 'info.50',
              borderLeft: 4,
              borderColor: 'info.main',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'info.100',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <PersonIcon sx={{ color: 'info.main' }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" color="info.main" fontWeight="bold" gutterBottom sx={{ fontSize: '1rem' }}>
                  担当者からのメッセージ
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
                  {customer_access.customer_message}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Container>
      )}

      {/* メインコンテンツ */}
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
        {/* タイトルセクション */}
        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 1, fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
                {data.title}
              </Typography>
              {data.catch_copy && (
                <Typography variant="h6" color="primary" fontWeight="medium" gutterBottom sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                  {data.catch_copy}
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                {visibleFields.rent !== false && room?.rent && (
                  <Chip
                    icon={<AttachMoneyIcon />}
                    label={`賃料: ${room.rent.toLocaleString()}円`}
                    color="primary"
                  />
                )}
                {visibleFields.room_type !== false && room?.room_type && (
                  <Chip
                    icon={<HomeIcon />}
                    label={getRoomTypeLabel(room.room_type)}
                  />
                )}
                {visibleFields.address !== false && building?.address && (
                  <Chip
                    icon={<LocationOnIcon />}
                    label={building.address}
                  />
                )}
              </Box>
            </Box>
            {/* 右側：アクションボタン */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              {customer_access?.expires_at && (
                <Chip
                  icon={<ScheduleIcon />}
                  label={`${customer_access.formatted_expires_at}まで有効`}
                  color="warning"
                  variant="outlined"
                />
              )}
              {public_url && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<OpenInNewIcon />}
                  href={public_url}
                  target="_blank"
                >
                  ホームページ
                </Button>
              )}
            </Box>
          </Box>
        </Paper>

        {/* 写真 + 物件詳細（横並び） */}
        <Box sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 3,
          mb: 3,
        }}>
          {/* 写真ギャラリー */}
          {property_publication_photos && property_publication_photos.length > 0 && (
            <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, flex: isMobile ? 'none' : '1 1 60%', minWidth: 0, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.35rem' }}>
                <ImageIcon color="primary" />
                写真
              </Typography>
              <PhotoGallery photos={property_publication_photos} />
            </Paper>
          )}

          {/* 物件詳細 */}
          <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, flex: isMobile ? 'none' : '1 1 40%', minWidth: 0, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontSize: '1.35rem' }}>
              物件詳細
            </Typography>

            {data.pr_text && (
              <>
                <Box
                  sx={{
                    '& p': { margin: '0 0 0.5em 0' },
                    '& h2': { fontSize: '1.25rem', fontWeight: 600, margin: '1em 0 0.5em 0' },
                    '& h3': { fontSize: '1.1rem', fontWeight: 600, margin: '1em 0 0.5em 0' },
                    '& ul, & ol': { paddingLeft: '1.5em', margin: '0.5em 0' },
                  }}
                  dangerouslySetInnerHTML={{ __html: data.pr_text }}
                />
                <Divider sx={{ my: 2 }} />
              </>
            )}

            <Table size="small">
              <TableBody>
                {visibleFields.rent !== false && room?.rent && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>賃料</TableCell>
                    <TableCell>{room.rent.toLocaleString()}円</TableCell>
                  </TableRow>
                )}
                {visibleFields.management_fee !== false && room?.management_fee && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>管理費</TableCell>
                    <TableCell>{room.management_fee.toLocaleString()}円</TableCell>
                  </TableRow>
                )}
                {visibleFields.deposit !== false && room?.deposit && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>敷金</TableCell>
                    <TableCell>{room.deposit.toLocaleString()}円</TableCell>
                  </TableRow>
                )}
                {visibleFields.key_money !== false && room?.key_money && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>礼金</TableCell>
                    <TableCell>{room.key_money.toLocaleString()}円</TableCell>
                  </TableRow>
                )}
                {visibleFields.room_type !== false && room?.room_type && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>間取り</TableCell>
                    <TableCell>{getRoomTypeLabel(room.room_type)}</TableCell>
                  </TableRow>
                )}
                {visibleFields.area !== false && room?.area && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>専有面積</TableCell>
                    <TableCell>{room.area}m²</TableCell>
                  </TableRow>
                )}
                {visibleFields.floor !== false && room?.floor && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>階数</TableCell>
                    <TableCell>{room.floor}階</TableCell>
                  </TableRow>
                )}
                {visibleFields.building_type !== false && building?.building_type && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>建物種別</TableCell>
                    <TableCell>{getBuildingTypeLabel(building.building_type)}</TableCell>
                  </TableRow>
                )}
                {visibleFields.structure !== false && building?.structure && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>構造</TableCell>
                    <TableCell>{building.structure}</TableCell>
                  </TableRow>
                )}
                {visibleFields.built_year !== false && building?.built_year && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>築年</TableCell>
                    <TableCell>{building.built_year}年</TableCell>
                  </TableRow>
                )}
                {visibleFields.facilities !== false && room?.facilities && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>設備</TableCell>
                    <TableCell>{room.facilities}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Box>

        {/* 地図・周辺情報・アクセス */}
        {building?.latitude && building?.longitude && (
          <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.35rem' }}>
              <MapIcon color="primary" />
              地図・周辺情報
            </Typography>

            {/* 横並びレイアウト：地図(左) + 経路一覧(右) */}
            <Box sx={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: 2,
              height: isMobile ? 'auto' : 650,
            }}>
              {/* 地図エリア */}
              <Box sx={{
                flex: isMobile ? 'none' : '1 1 0',
                height: isMobile ? 500 : '100%',
                minWidth: 0,
              }}>
                <PropertyMapPanel
                  property={building}
                  routes={allRoutes}
                  activeRoute={activeRoute}
                  onRouteSelect={handleRouteSelect}
                  slideshowActive={!!inlineSlideshow}
                  slideshowPoints={inlineSlideshow?.points || []}
                  onSlideshowEnd={handleSlideshowEnd}
                  isMobile={isMobile}
                  hideHeader={true}
                  chatRightOffset={50}
                />
              </Box>

              {/* アクセス情報（経路一覧） */}
              <Box sx={{
                width: isMobile ? '100%' : 300,
                height: isMobile ? 'auto' : '100%',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexShrink: 0 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DirectionsIcon color="primary" />
                    アクセス情報
                  </Typography>
                  {canAddMoreRoutes && (
                    <Tooltip title={`経路を追加（残り${MAX_CUSTOMER_ROUTES - customerRoutes.length}件）`}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => setIsRouteDialogOpen(true)}
                      >
                        追加
                      </Button>
                    </Tooltip>
                  )}
                </Box>
                <Box sx={{
                  flex: 1,
                  overflow: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                }}>
                  {allRoutes.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        経路が登録されていません
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => setIsRouteDialogOpen(true)}
                        sx={{ mt: 1 }}
                      >
                        経路を追加
                      </Button>
                    </Box>
                  ) : (
                    allRoutes.map((route) => (
                      <Card
                        key={`${route.is_customer_route ? 'customer' : 'building'}-${route.id}`}
                        variant="outlined"
                        sx={{
                          border: activeRoute?.id === route.id && activeRoute?.is_customer_route === route.is_customer_route
                            ? '2px solid'
                            : '1px solid',
                          borderColor: activeRoute?.id === route.id && activeRoute?.is_customer_route === route.is_customer_route
                            ? 'primary.main'
                            : 'divider',
                          transition: 'all 0.2s',
                          flexShrink: 0,
                          bgcolor: route.is_customer_route ? 'action.hover' : 'background.paper',
                        }}
                      >
                        <CardActionArea
                          onClick={() => handleRouteSelect(route)}
                          sx={{ p: 0 }}
                        >
                          <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              {getTravelModeIcon(route.travel_mode)}
                              <Typography variant="subtitle2" fontWeight="bold" sx={{ flex: 1 }}>
                                {route.destination_name || route.name}
                              </Typography>
                              {route.is_customer_route && (
                                <Tooltip title="あなたが追加した経路">
                                  <Chip
                                    icon={<PersonIcon />}
                                    label="追加"
                                    size="small"
                                    color="secondary"
                                    sx={{ height: 20, '& .MuiChip-label': { px: 0.5, fontSize: '0.65rem' } }}
                                  />
                                </Tooltip>
                              )}
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {getTravelModeLabel(route.travel_mode)}
                              {route.duration_seconds && (
                                <> 約{Math.ceil(route.duration_seconds / 60)}分</>
                              )}
                              {route.distance_meters && (
                                <> ({(route.distance_meters / 1000).toFixed(1)}km)</>
                              )}
                            </Typography>
                          </CardContent>
                        </CardActionArea>
                        <Box sx={{ px: 2, pb: 1.5, display: 'flex', gap: 1 }}>
                          {route.calculated && (
                            <Button
                              size="small"
                              variant={activeRoute?.id === route.id && activeRoute?.is_customer_route === route.is_customer_route && inlineSlideshow ? 'contained' : 'outlined'}
                              startIcon={<PlayArrowIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (route.is_customer_route) {
                                  handleStartCustomerRouteSlideshow(route);
                                } else {
                                  handleStartSlideshow(route);
                                }
                              }}
                              sx={{ flex: 1 }}
                            >
                              経路を見る
                            </Button>
                          )}
                          {route.is_customer_route && (
                            <Tooltip title="経路を削除">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCustomerRoute(route.id);
                                }}
                                disabled={deletingRouteId === route.id}
                              >
                                {deletingRouteId === route.id ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <DeleteIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </Card>
                    ))
                  )}
                </Box>
              </Box>
            </Box>

            {/* 説明文 */}
            <Box sx={{
              mt: 2,
              p: 2,
              bgcolor: 'rgba(25, 118, 210, 0.08)',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'rgba(25, 118, 210, 0.12)',
            }}>
              <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                  <Typography variant="subtitle2" color="primary.dark" gutterBottom fontWeight="bold" sx={{ fontSize: '0.95rem' }}>
                    周辺施設を表示する
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                    地図左上の「地図オプション」から、周辺のコンビニ・病院・スーパー・学校・公園などを地図上に表示できます。
                    各施設をクリックすると詳細情報が確認できます。
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                  <Typography variant="subtitle2" color="primary.dark" gutterBottom fontWeight="bold" sx={{ fontSize: '0.95rem' }}>
                    周辺情報について質問する
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                    地図下のチャット欄から、周辺施設について質問できます。
                    「近くにコンビニはありますか？」「最寄りの小学校までの距離は？」などお気軽にお聞きください。
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                  <Typography variant="subtitle2" color="primary.dark" gutterBottom fontWeight="bold" sx={{ fontSize: '0.95rem' }}>
                    経路を追加する
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                    よく行く場所（職場、学校など）への経路を最大4件まで追加できます。
                    「追加」ボタンから目的地を設定すると、ルートと所要時間が表示されます。
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        )}

        {/* VRツアー・バーチャルステージング */}
        {((property_publication_vr_tours && property_publication_vr_tours.length > 0) ||
          (property_publication_virtual_stagings && property_publication_virtual_stagings.length > 0)) && (
          <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box sx={{
                width: 44,
                height: 44,
                bgcolor: 'primary.50',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ViewInArIcon sx={{ color: 'primary.main', fontSize: 26 }} />
              </Box>
              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.35rem' }}>
                バーチャルコンテンツ
              </Typography>
            </Box>

            <Grid container spacing={2}>
              {/* VRツアー */}
              {property_publication_vr_tours?.map((item) => (
                <Grid item xs={6} sm={6} md={4} lg={4} key={`vr-${item.vr_tour?.id}`}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 2,
                      },
                    }}
                  >
                    <CardActionArea
                      href={`/vr/${item.vr_tour?.public_id}`}
                      target="_blank"
                      sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                    >
                      <Box
                        sx={{
                          position: 'relative',
                          paddingTop: '56.25%',
                          bgcolor: 'grey.200',
                          overflow: 'hidden',
                        }}
                      >
                        {item.vr_tour?.thumbnail_url ? (
                          <Box
                            component="img"
                            src={item.vr_tour.thumbnail_url}
                            alt={item.vr_tour?.title}
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <ViewInArIcon sx={{ fontSize: 40, color: 'grey.400' }} />
                          </Box>
                        )}
                        <Chip
                          label="VRツアー"
                          size="small"
                          color="primary"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            fontSize: '0.7rem',
                            height: 22,
                          }}
                        />
                      </Box>
                      <CardContent sx={{ py: 1, px: 1.5 }}>
                        <Typography variant="body2" fontWeight="bold" noWrap>
                          {item.vr_tour?.title}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}

              {/* バーチャルステージング */}
              {property_publication_virtual_stagings?.map((item) => (
                <Grid item xs={6} sm={6} md={4} lg={4} key={`staging-${item.virtual_staging?.id}`}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 2,
                      },
                    }}
                  >
                    <CardActionArea
                      href={`/virtual-staging/${item.virtual_staging?.public_id}`}
                      target="_blank"
                      sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                    >
                      <Box
                        sx={{
                          position: 'relative',
                          paddingTop: '56.25%',
                          bgcolor: 'grey.200',
                          overflow: 'hidden',
                        }}
                      >
                        {item.virtual_staging?.after_photo_url ? (
                          <Box
                            component="img"
                            src={item.virtual_staging.after_photo_url}
                            alt={item.virtual_staging?.title}
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <ImageIcon sx={{ fontSize: 40, color: 'grey.400' }} />
                          </Box>
                        )}
                        <Chip
                          label="ステージング"
                          size="small"
                          color="secondary"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            fontSize: '0.7rem',
                            height: 22,
                          }}
                        />
                      </Box>
                      <CardContent sx={{ py: 1, px: 1.5 }}>
                        <Typography variant="body2" fontWeight="bold" noWrap>
                          {item.virtual_staging?.title}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        {/* お問い合わせ・QRコード */}
        <Paper elevation={0} sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)'
        }}>
          <Box sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: 3,
          }}>
            {/* お問い合わせ */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box sx={{
                  width: 44,
                  height: 44,
                  bgcolor: 'white',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 1
                }}>
                  <EmailIcon sx={{ color: 'primary.main', fontSize: 26 }} />
                </Box>
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.35rem' }}>
                  ご質問・ご内見希望
                </Typography>
              </Box>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2, fontSize: '1rem' }}>
                この物件についてのご質問やご内見のご希望がございましたら、
                お気軽にお問い合わせください。
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<EmailIcon />}
                onClick={() => setInquiryDialogOpen(true)}
                sx={{ borderRadius: 2, px: 3 }}
              >
                お問い合わせ
              </Button>
            </Box>

            {/* QRコード */}
            {data.qr_code_data_url && (
              <Box sx={{
                textAlign: 'center',
                flexShrink: 0,
                p: 2,
                bgcolor: 'white',
                borderRadius: 2,
                boxShadow: 1
              }}>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                  このページのQRコード
                </Typography>
                <img
                  src={data.qr_code_data_url}
                  alt="QR Code"
                  style={{ maxWidth: 120 }}
                />
              </Box>
            )}
          </Box>
        </Paper>
      </Container>

      {/* フッター */}
      <Box sx={{
        bgcolor: 'grey.900',
        color: 'grey.300',
        py: 4,
        mt: 0
      }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              &copy; {new Date().getFullYear()} CoCoスモ
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* 経路追加ダイアログ */}
      <CustomerRouteDialog
        open={isRouteDialogOpen}
        onClose={() => setIsRouteDialogOpen(false)}
        accessToken={accessToken}
        buildingLocation={building ? { lat: building.latitude, lng: building.longitude } : null}
        onCreated={handleRouteCreated}
      />

      {/* お問い合わせダイアログ */}
      <Dialog
        open={inquiryDialogOpen}
        onClose={() => setInquiryDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmailIcon color="primary" />
            お問い合わせ
          </Box>
          <IconButton onClick={() => setInquiryDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {data.title}についてのお問い合わせ
          </Typography>
          <InquiryForm publicationId={data.publication_id} sourceType="customer_limited" />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
