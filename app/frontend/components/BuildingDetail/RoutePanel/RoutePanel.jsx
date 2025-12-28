import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  Chip,
  Collapse,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  DirectionsWalk as WalkIcon,
  DirectionsCar as CarIcon,
  Train as TrainIcon,
  School as SchoolIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  Route as RouteIcon,
} from '@mui/icons-material';
import RouteEditor from './RouteEditor';

// 経路タイプの設定
const ROUTE_TYPE_CONFIG = {
  station: { label: '駅まで', icon: TrainIcon, color: 'primary' },
  school: { label: '学校まで', icon: SchoolIcon, color: 'secondary' },
  custom: { label: 'カスタム', icon: RouteIcon, color: 'default' },
};

// 移動手段のアイコン
const TRAVEL_MODE_ICONS = {
  walking: WalkIcon,
  driving: CarIcon,
  transit: TrainIcon,
  bicycling: WalkIcon, // 自転車アイコンがないのでWalkIconで代用
};

export default function RoutePanel({
  buildingId,
  buildingLocation,
  routes = [],
  loading = false,
  activeRoute,
  onRouteSelect,
  onRouteCreate,
  onRouteUpdate,
  onRouteDelete,
  onRouteRecalculate,
  onSlideshowStart,
  isAdmin = true,
  isMobile = false,
  expanded: controlledExpanded,
  onExpandedChange,
  // 外部地図からの位置選択用
  onRequestMapPick = null, // 地図選択モードを開始するコールバック (field) => void
  pendingLocation = null, // 外部地図から選択された位置 { lat, lng, field }
  onClearPendingLocation = null, // 保留中の位置をクリア
}) {
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
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  // 地図選択モード用：フォームデータを一時保存
  const [pendingFormData, setPendingFormData] = useState(null);

  // 外部地図から位置が選択された時、エディタを再度開く
  useEffect(() => {
    if (pendingLocation && pendingFormData) {
      setEditorOpen(true);
    }
  }, [pendingLocation, pendingFormData]);

  const handleAddRoute = () => {
    setEditingRoute(null);
    setPendingFormData(null);
    setEditorOpen(true);
  };

  // 地図選択モードを開始
  const handleStartMapPick = (formData, field) => {
    // 前回のpendingLocationをクリアしてから新しい選択を開始
    onClearPendingLocation?.();
    setPendingFormData(formData);
    setEditorOpen(false);
    onRequestMapPick?.(field);
  };

  // エディタを閉じる時に保留データもクリア
  const handleEditorClose = () => {
    setEditorOpen(false);
    setPendingFormData(null);
    onClearPendingLocation?.();
  };

  const handleEditRoute = (route, e) => {
    e.stopPropagation();
    setEditingRoute(route);
    setPendingFormData(null);
    setEditorOpen(true);
  };

  const handleDeleteRoute = async (route, e) => {
    e.stopPropagation();
    if (!window.confirm(`「${route.name}」を削除しますか？`)) return;

    setActionLoading(route.id);
    try {
      await onRouteDelete(route.id);
    } catch (err) {
      alert('経路の削除に失敗しました');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRecalculate = async (route, e) => {
    e.stopPropagation();
    setActionLoading(route.id);
    try {
      await onRouteRecalculate(route.id);
    } catch (err) {
      alert('経路の再計算に失敗しました');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveRoute = async (routeData) => {
    setActionLoading('save');
    try {
      if (editingRoute) {
        await onRouteUpdate(editingRoute.id, routeData);
      } else {
        await onRouteCreate(routeData);
      }
      setEditorOpen(false);
      setPendingFormData(null);
      onClearPendingLocation?.();
    } catch (err) {
      alert(err.message || '経路の保存に失敗しました');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartSlideshow = (route, e) => {
    e.stopPropagation();
    if (route.calculated) {
      onSlideshowStart?.(route);
    } else {
      alert('経路が計算されていません。再計算してください。');
    }
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
          <RouteIcon color="action" />
          <Typography variant="subtitle2" fontWeight={600}>
            経路情報
          </Typography>
          <Chip label={routes.length} size="small" sx={{ height: 20, fontSize: '0.75rem' }} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isAdmin && (
            <Tooltip title="経路を追加">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddRoute();
                }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Box>
      </Box>

      {/* 経路リスト */}
      {expanded && (
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        ) : routes.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              登録された経路はありません
            </Typography>
            {isAdmin && (
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddRoute}
                sx={{ mt: 1 }}
              >
                経路を追加
              </Button>
            )}
          </Box>
        ) : (
          <List dense disablePadding sx={{ flex: 1, overflow: 'auto' }}>
            {routes.map((route) => {
              const typeConfig = ROUTE_TYPE_CONFIG[route.route_type] || ROUTE_TYPE_CONFIG.custom;
              const TypeIcon = typeConfig.icon;
              const TravelIcon = TRAVEL_MODE_ICONS[route.travel_mode] || WalkIcon;
              const isActive = activeRoute?.id === route.id;
              const isLoading = actionLoading === route.id;

              return (
                <ListItem
                  key={route.id}
                  disablePadding
                  secondaryAction={
                    isLoading ? (
                      <CircularProgress size={isMobile ? 24 : 20} />
                    ) : !isMobile ? (
                      // デスクトップ: 従来のレイアウト
                      <Box sx={{ display: 'flex', gap: 0 }}>
                        {route.calculated && (
                          <Tooltip title="スライドショー">
                            <IconButton
                              size="small"
                              onClick={(e) => handleStartSlideshow(route, e)}
                              color="primary"
                            >
                              <PlayIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {isAdmin && (
                          <>
                            <Tooltip title="再計算">
                              <IconButton
                                size="small"
                                onClick={(e) => handleRecalculate(route, e)}
                              >
                                <RefreshIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="編集">
                              <IconButton
                                size="small"
                                onClick={(e) => handleEditRoute(route, e)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="削除">
                              <IconButton
                                size="small"
                                onClick={(e) => handleDeleteRoute(route, e)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    ) : (
                      // モバイル: 管理ボタンのみ（再生ボタンは別途表示）
                      isAdmin && (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={(e) => handleRecalculate(route, e)}
                          >
                            <RefreshIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => handleEditRoute(route, e)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => handleDeleteRoute(route, e)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )
                    )
                  }
                  sx={{ borderBottom: '1px solid #f0f0f0' }}
                >
                  <ListItemButton
                    selected={isActive}
                    onClick={() => onRouteSelect(route)}
                    sx={{
                      py: isMobile ? 1 : 0.5,
                      '&.Mui-selected': {
                        bgcolor: 'primary.light',
                        '&:hover': { bgcolor: 'primary.light' },
                      },
                    }}
                  >
                    {/* モバイル: 再生ボタンを左側に大きく配置 */}
                    {isMobile && route.calculated && (
                      <IconButton
                        onClick={(e) => handleStartSlideshow(route, e)}
                        color="primary"
                        sx={{
                          mr: 1,
                          bgcolor: 'primary.main',
                          color: 'white',
                          width: 44,
                          height: 44,
                          '&:hover': { bgcolor: 'primary.dark' },
                        }}
                      >
                        <PlayIcon />
                      </IconButton>
                    )}
                    {/* モバイル: 未計算の場合はアイコンのみ */}
                    {isMobile && !route.calculated && (
                      <ListItemIcon sx={{ minWidth: 44, mr: 1 }}>
                        <TypeIcon color={typeConfig.color} />
                      </ListItemIcon>
                    )}
                    {/* デスクトップ: 従来のアイコン */}
                    {!isMobile && (
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <TypeIcon fontSize="small" color={typeConfig.color} />
                      </ListItemIcon>
                    )}
                    <ListItemText
                      primary={
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography
                            component="span"
                            variant={isMobile ? 'body1' : 'body2'}
                            fontWeight={500}
                            noWrap
                          >
                            {route.name}
                          </Typography>
                          {!route.calculated && (
                            <Chip
                              label="未計算"
                              size="small"
                              color="warning"
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                          <TravelIcon sx={{ fontSize: isMobile ? 16 : 14, color: 'text.secondary' }} />
                          {route.formatted_distance && (
                            <Typography component="span" variant={isMobile ? 'body2' : 'caption'} color="text.secondary">
                              {route.formatted_distance}
                            </Typography>
                          )}
                          {route.formatted_duration && (
                            <>
                              <Typography component="span" variant={isMobile ? 'body2' : 'caption'} color="text.secondary">
                                ・
                              </Typography>
                              <Typography component="span" variant={isMobile ? 'body2' : 'caption'} color="text.secondary">
                                {route.formatted_duration}
                              </Typography>
                            </>
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
        </Box>
      )}

      {/* 経路エディタダイアログ */}
      <RouteEditor
        open={editorOpen}
        onClose={handleEditorClose}
        route={editingRoute}
        buildingLocation={buildingLocation}
        onSave={handleSaveRoute}
        loading={actionLoading === 'save'}
        isMobile={isMobile}
        onStartMapPick={onRequestMapPick ? handleStartMapPick : null}
        initialLocation={pendingLocation}
        initialFormData={pendingFormData}
      />
    </Box>
  );
}
