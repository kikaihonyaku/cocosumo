import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ThemeProvider,
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  useMediaQuery,
  Snackbar,
  Tabs,
  Tab,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  PhotoLibrary as PhotoLibraryIcon,
  CompareArrows as CompareArrowsIcon,
  Vrpano as VrpanoIcon,
  Article as ArticleIcon,
} from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import muiTheme from '../theme/muiTheme';
import RoomInfoPanel from "../components/RoomDetail/RoomInfoPanel";
import RoomFloorplanPanel from "../components/RoomDetail/RoomFloorplanPanel";
import RoomPhotosPanel from "../components/RoomDetail/RoomPhotosPanel";
import RoomVRTourPanel from "../components/RoomDetail/RoomVRTourPanel";
import RoomVirtualStagingPanel from "../components/RoomDetail/RoomVirtualStagingPanel";
import RoomPropertyPublicationPanel from "../components/RoomDetail/RoomPropertyPublicationPanel";

export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isLgUp = useMediaQuery(muiTheme.breakpoints.up('lg'));
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md')); // 960px未満（スマホ・小タブレット）
  const isSmallMobile = useMediaQuery(muiTheme.breakpoints.down('sm')); // 600px未満（小画面スマホ）

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [mobileActiveTab, setMobileActiveTab] = useState(0); // モバイル用タブ管理

  // ペイン幅の管理
  const [leftPaneWidth, setLeftPaneWidth] = useState(400); // 左ペインの横幅
  const [rightPaneWidth, setRightPaneWidth] = useState(400); // 右ペインの横幅
  const [isResizingLeft, setIsResizingLeft] = useState(false); // 左側リサイズ中かどうか
  const [isResizingRight, setIsResizingRight] = useState(false); // 右側リサイズ中かどうか

  // 右ペイン内パネルの展開状態
  const [vsExpanded, setVsExpanded] = useState(true);
  const [vrTourExpanded, setVrTourExpanded] = useState(true);
  const [publicationExpanded, setPublicationExpanded] = useState(true);

  // 右ペイン内パネルの高さ管理（展開時の割合）
  const [vsPanelFlex, setVsPanelFlex] = useState(1);
  const [vrTourPanelFlex, setVrTourPanelFlex] = useState(1);
  const [publicationPanelFlex, setPublicationPanelFlex] = useState(1);

  // 右ペインの垂直リサイズ
  const [isResizingVsSplitter, setIsResizingVsSplitter] = useState(false);
  const [isResizingVrTourSplitter, setIsResizingVrTourSplitter] = useState(false);

  useEffect(() => {
    fetchRoom();
  }, [id]);

  const fetchRoom = async () => {
    try {
      const response = await fetch(`/api/v1/rooms/${id}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRoom(data);
      } else {
        setError('部屋情報の取得に失敗しました');
      }
    } catch (err) {
      console.error('取得エラー:', err);
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedData) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/v1/rooms/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ room: updatedData }),
      });

      if (response.ok) {
        const data = await response.json();
        setRoom(data);
        setHasUnsavedChanges(false);
        showSnackbar('部屋情報を保存しました', 'success');
      } else {
        showSnackbar('保存に失敗しました', 'error');
      }
    } catch (err) {
      console.error('保存エラー:', err);
      showSnackbar('ネットワークエラーが発生しました', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFormChange = (hasChanges) => {
    setHasUnsavedChanges(hasChanges);
  };

  // AI解析で抽出されたデータを部屋情報に適用
  const handleRoomDataExtracted = async (extractedData) => {
    setSaving(true);
    try {
      // room_typeの変換（フロントエンドのenum値に変換）
      const roomTypeMapping = {
        'studio': 'studio',
        '1K': 'one_bedroom',
        '1DK': 'one_dk',
        '1LDK': 'one_ldk',
        '2K': 'two_bedroom',
        '2DK': 'two_dk',
        '2LDK': 'two_ldk',
        '3K': 'three_bedroom',
        '3DK': 'three_dk',
        '3LDK': 'three_ldk',
        'other': 'other',
      };

      const dataToSave = { ...extractedData };
      if (dataToSave.room_type && roomTypeMapping[dataToSave.room_type]) {
        dataToSave.room_type = roomTypeMapping[dataToSave.room_type];
      }

      const response = await fetch(`/api/v1/rooms/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ room: dataToSave }),
      });

      if (response.ok) {
        const data = await response.json();
        setRoom(prev => ({ ...prev, ...data }));
        showSnackbar(`${Object.keys(extractedData).length}項目の部屋情報を更新しました`, 'success');
      } else {
        showSnackbar('部屋情報の更新に失敗しました', 'error');
      }
    } catch (err) {
      console.error('更新エラー:', err);
      showSnackbar('ネットワークエラーが発生しました', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleMobileTabChange = (event, newValue) => {
    setMobileActiveTab(newValue);
  };

  // スプリッタバーのリサイズ処理（左側）
  const handleLeftMouseDown = (e) => {
    setIsResizingLeft(true);
    e.preventDefault();
  };

  // スプリッタバーのリサイズ処理（右側）
  const handleRightMouseDown = (e) => {
    setIsResizingRight(true);
    e.preventDefault();
  };

  // 右ペイン内の垂直スプリッター（VSパネルとVRツアーパネルの間）
  const handleVsSplitterMouseDown = (e) => {
    setIsResizingVsSplitter(true);
    e.preventDefault();
  };

  // 右ペイン内の垂直スプリッター（VRツアーパネルと物件公開パネルの間）
  const handleVrTourSplitterMouseDown = (e) => {
    setIsResizingVrTourSplitter(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      const containerRect = document.querySelector('.room-layout-container')?.getBoundingClientRect();
      if (!containerRect) return;

      if (isResizingLeft) {
        // 左ペインのリサイズ：左端からマウス位置までの距離を計算
        const newWidth = e.clientX - containerRect.left - 8;
        // 最小幅250px、最大幅600px
        const clampedWidth = Math.max(250, Math.min(600, newWidth));
        setLeftPaneWidth(clampedWidth);
      }

      if (isResizingRight) {
        // 右ペインのリサイズ：右端からマウス位置までの距離を計算
        const newWidth = containerRect.right - e.clientX - 8;
        // 最小幅250px、最大幅600px
        const clampedWidth = Math.max(250, Math.min(600, newWidth));
        setRightPaneWidth(clampedWidth);
      }

      // 右ペイン内の垂直リサイズ
      if (isResizingVsSplitter || isResizingVrTourSplitter) {
        const rightPaneContainer = document.querySelector('.right-pane-container');
        if (!rightPaneContainer) return;
        const rightPaneRect = rightPaneContainer.getBoundingClientRect();
        const relativeY = e.clientY - rightPaneRect.top;
        const totalHeight = rightPaneRect.height;

        if (isResizingVsSplitter && vsExpanded && vrTourExpanded) {
          // VSパネルとVRツアーパネルの境界
          const ratio = relativeY / totalHeight;
          const newVsFlex = Math.max(0.2, Math.min(0.6, ratio)) * 3;
          setVsPanelFlex(newVsFlex);
        }

        if (isResizingVrTourSplitter && vrTourExpanded && publicationExpanded) {
          // VRツアーパネルと物件公開パネルの境界
          const headerHeight = vsExpanded ? 0 : 44;
          const adjustedY = relativeY - headerHeight;
          const adjustedTotal = totalHeight - headerHeight;
          const ratio = adjustedY / adjustedTotal;
          const newVrTourFlex = Math.max(0.2, Math.min(0.6, ratio)) * 2;
          setVrTourPanelFlex(newVrTourFlex);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
      setIsResizingVsSplitter(false);
      setIsResizingVrTourSplitter(false);
    };

    const isAnyResizing = isResizingLeft || isResizingRight || isResizingVsSplitter || isResizingVrTourSplitter;
    const cursorType = (isResizingVsSplitter || isResizingVrTourSplitter) ? 'row-resize' : 'col-resize';

    if (isAnyResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = cursorType;
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizingLeft, isResizingRight, isResizingVsSplitter, isResizingVrTourSplitter, vsExpanded, vrTourExpanded, publicationExpanded]);

  const handlePhotosUpdate = () => {
    fetchRoom();
  };

  // ページ離脱時の警告
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (loading) {
    return (
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
          <CircularProgress size={60} />
        </Box>
      </ThemeProvider>
    );
  }

  if (error || !room) {
    return (
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default', gap: 2 }}>
          <Typography variant="h6" color="error">
            {error || '部屋が見つかりません'}
          </Typography>
          <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={() => navigate('/buildings')}>
            物件一覧に戻る
          </Button>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
        {/* ヘッダー */}
        <AppBar position="static" elevation={0} sx={{
          bgcolor: 'primary.main',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
          borderRadius: '12px 12px 0 0',
        }}>
          <Toolbar variant="dense" sx={{ minHeight: 52 }}>
            <IconButton
              edge="start"
              onClick={() => navigate(`/building/${room.building_id}`)}
              sx={{
                mr: 1,
                color: 'white',
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h6" component="h1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                {room.building?.name} - {room.room_number}号室
              </Typography>
            </Box>
            <Button
              color="inherit"
              onClick={() => window.close()}
              sx={{
                minWidth: 'auto',
                p: 1,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
              title="閉じる"
            >
              <CloseIcon />
            </Button>
          </Toolbar>
        </AppBar>

      {/* メインコンテンツ */}
      {isMobile ? (
        // モバイルレイアウト: タブ形式
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {/* タブヘッダー */}
          <Paper elevation={1} sx={{ borderRadius: 0 }}>
            <Tabs
              value={mobileActiveTab}
              onChange={handleMobileTabChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              indicatorColor="primary"
              textColor="primary"
              sx={{ borderBottom: '1px solid #ddd' }}
            >
              <Tab
                icon={<HomeIcon />}
                label={isSmallMobile ? undefined : "部屋"}
                id="mobile-tab-0"
                aria-controls="mobile-tabpanel-0"
                sx={{ minHeight: isSmallMobile ? 56 : 64, minWidth: isSmallMobile ? 56 : 80 }}
              />
              <Tab
                icon={<PhotoLibraryIcon />}
                label={isSmallMobile ? undefined : "写真"}
                id="mobile-tab-1"
                aria-controls="mobile-tabpanel-1"
                sx={{ minHeight: isSmallMobile ? 56 : 64, minWidth: isSmallMobile ? 56 : 80 }}
              />
              <Tab
                icon={<VrpanoIcon />}
                label={isSmallMobile ? undefined : "VR"}
                id="mobile-tab-2"
                aria-controls="mobile-tabpanel-2"
                sx={{ minHeight: isSmallMobile ? 56 : 64, minWidth: isSmallMobile ? 56 : 80 }}
              />
              <Tab
                icon={<CompareArrowsIcon />}
                label={isSmallMobile ? undefined : "VS"}
                id="mobile-tab-3"
                aria-controls="mobile-tabpanel-3"
                sx={{ minHeight: isSmallMobile ? 56 : 64, minWidth: isSmallMobile ? 56 : 80 }}
              />
              <Tab
                icon={<ArticleIcon />}
                label={isSmallMobile ? undefined : "公開"}
                id="mobile-tab-4"
                aria-controls="mobile-tabpanel-4"
                sx={{ minHeight: isSmallMobile ? 56 : 64, minWidth: isSmallMobile ? 56 : 80 }}
              />
            </Tabs>
          </Paper>

          {/* タブコンテンツ */}
          <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* 部屋情報タブ */}
            <Box sx={{ display: mobileActiveTab === 0 ? 'flex' : 'none', flex: 1, overflow: 'auto', flexDirection: 'column' }}>
              <RoomInfoPanel
                room={room}
                onSave={handleSave}
                loading={saving}
                isMobile={true}
                onFormChange={handleFormChange}
              />
            </Box>

            {/* 写真タブ */}
            <Box sx={{ display: mobileActiveTab === 1 ? 'flex' : 'none', flex: 1, overflow: 'hidden', flexDirection: 'column' }}>
              <Box sx={{ overflow: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* 募集図面セクション */}
                <RoomFloorplanPanel
                  roomId={room.id}
                  floorplanPdfUrl={room.floorplan_pdf_url}
                  floorplanPdfFilename={room.floorplan_pdf_filename}
                  floorplanThumbnailUrl={room.floorplan_thumbnail_url}
                  onFloorplanUpdate={(url, filename, thumbnailUrl) => {
                    setRoom(prev => ({
                      ...prev,
                      floorplan_pdf_url: url,
                      floorplan_pdf_filename: filename,
                      floorplan_thumbnail_url: thumbnailUrl,
                    }));
                  }}
                  onRoomDataExtracted={handleRoomDataExtracted}
                />
                {/* 部屋写真 */}
                <RoomPhotosPanel
                  roomId={room.id}
                  buildingId={room.building?.id}
                  buildingName={room.building?.name}
                  roomNumber={room.room_number}
                  onPhotosUpdate={handlePhotosUpdate}
                  isMobile={true}
                />
              </Box>
            </Box>

            {/* VRツアータブ */}
            <Box sx={{ display: mobileActiveTab === 2 ? 'flex' : 'none', flex: 1, overflow: 'auto', flexDirection: 'column' }}>
              <RoomVRTourPanel
                roomId={room.id}
                isMobile={true}
              />
            </Box>

            {/* バーチャルステージングタブ */}
            <Box sx={{ display: mobileActiveTab === 3 ? 'flex' : 'none', flex: 1, overflow: 'auto', flexDirection: 'column' }}>
              <RoomVirtualStagingPanel
                roomId={room.id}
                isMobile={true}
              />
            </Box>

            {/* 物件公開タブ */}
            <Box sx={{ display: mobileActiveTab === 4 ? 'flex' : 'none', flex: 1, overflow: 'auto', flexDirection: 'column' }}>
              <RoomPropertyPublicationPanel
                roomId={room.id}
                isMobile={true}
              />
            </Box>
          </Box>
        </Box>
      ) : (
        // デスクトップレイアウト: 3カラムカードレイアウト
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            px: 1,
            py: 1,
            bgcolor: 'grey.50'
          }}
        >
          <Box
            className="room-layout-container"
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: 1,
              height: '100%',
              maxWidth: '100%',
              mx: 'auto',
            }}
          >
            {/* 左カラム: 部屋情報 */}
            <Paper elevation={3} sx={{
              width: isLgUp ? leftPaneWidth : 350,
              flexShrink: 0,
              borderRadius: 2,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 800,
            }}>
              <RoomInfoPanel
                room={room}
                onSave={handleSave}
                loading={saving}
                onFormChange={handleFormChange}
              />
            </Paper>

            {/* 左スプリッタ */}
            {isLgUp && (
              <Box
                onMouseDown={handleLeftMouseDown}
                sx={{
                  width: 6,
                  cursor: 'col-resize',
                  bgcolor: isResizingLeft ? 'primary.main' : 'transparent',
                  '&:hover': {
                    bgcolor: 'primary.light',
                  },
                  transition: 'background-color 0.2s',
                  flexShrink: 0,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 2,
                    height: 40,
                    bgcolor: isResizingLeft ? 'primary.main' : 'grey.400',
                    borderRadius: 1,
                  },
                }}
              />
            )}

            {/* 中央カラム: 募集図面・部屋写真 */}
            <Box sx={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}>
              {/* 募集図面セクション */}
              <RoomFloorplanPanel
                roomId={room.id}
                floorplanPdfUrl={room.floorplan_pdf_url}
                floorplanPdfFilename={room.floorplan_pdf_filename}
                floorplanThumbnailUrl={room.floorplan_thumbnail_url}
                onFloorplanUpdate={(url, filename, thumbnailUrl) => {
                  setRoom(prev => ({
                    ...prev,
                    floorplan_pdf_url: url,
                    floorplan_pdf_filename: filename,
                    floorplan_thumbnail_url: thumbnailUrl,
                  }));
                }}
                onRoomDataExtracted={handleRoomDataExtracted}
              />

              {/* 部屋写真セクション */}
              <RoomPhotosPanel
                roomId={room.id}
                buildingId={room.building?.id}
                buildingName={room.building?.name}
                roomNumber={room.room_number}
                onPhotosUpdate={handlePhotosUpdate}
              />
            </Box>

            {/* 右スプリッタ */}
            {isLgUp && (
              <Box
                onMouseDown={handleRightMouseDown}
                sx={{
                  width: 6,
                  cursor: 'col-resize',
                  bgcolor: isResizingRight ? 'primary.main' : 'transparent',
                  '&:hover': {
                    bgcolor: 'primary.light',
                  },
                  transition: 'background-color 0.2s',
                  flexShrink: 0,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 2,
                    height: 40,
                    bgcolor: isResizingRight ? 'primary.main' : 'grey.400',
                    borderRadius: 1,
                  },
                }}
              />
            )}

            {/* 右カラム: コンテナ */}
            <Box
              className="right-pane-container"
              sx={{
                width: isLgUp ? rightPaneWidth : 350,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 800,
              }}
            >
              {/* バーチャルステージング */}
              <Paper elevation={3} sx={{
                borderRadius: 2,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                flex: vsExpanded ? vsPanelFlex : 'none',
                height: vsExpanded ? 'auto' : 44,
                minHeight: vsExpanded ? 0 : 44,
                flexShrink: vsExpanded ? 1 : 0,
              }}>
                <RoomVirtualStagingPanel
                  roomId={room.id}
                  expanded={vsExpanded}
                  onExpandedChange={setVsExpanded}
                />
              </Paper>

              {/* VSとVRツアーの間のスプリッター */}
              {vsExpanded && vrTourExpanded && (
                <Box
                  onMouseDown={handleVsSplitterMouseDown}
                  sx={{
                    height: 6,
                    cursor: 'row-resize',
                    bgcolor: isResizingVsSplitter ? 'primary.main' : 'transparent',
                    '&:hover': { bgcolor: 'primary.light' },
                    transition: 'background-color 0.2s',
                    flexShrink: 0,
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      height: 2,
                      width: 40,
                      bgcolor: isResizingVsSplitter ? 'primary.main' : 'grey.400',
                      borderRadius: 1,
                    },
                  }}
                />
              )}
              {/* 折りたたみ時の隙間 */}
              {(!vsExpanded || !vrTourExpanded) && (
                <Box sx={{ height: 6, flexShrink: 0 }} />
              )}

              {/* VRツアー */}
              <Paper elevation={3} sx={{
                borderRadius: 2,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                flex: vrTourExpanded ? vrTourPanelFlex : 'none',
                height: vrTourExpanded ? 'auto' : 44,
                minHeight: vrTourExpanded ? 0 : 44,
                flexShrink: vrTourExpanded ? 1 : 0,
              }}>
                <RoomVRTourPanel
                  roomId={room.id}
                  expanded={vrTourExpanded}
                  onExpandedChange={setVrTourExpanded}
                />
              </Paper>

              {/* VRツアーと物件公開の間のスプリッター */}
              {vrTourExpanded && publicationExpanded && (
                <Box
                  onMouseDown={handleVrTourSplitterMouseDown}
                  sx={{
                    height: 6,
                    cursor: 'row-resize',
                    bgcolor: isResizingVrTourSplitter ? 'primary.main' : 'transparent',
                    '&:hover': { bgcolor: 'primary.light' },
                    transition: 'background-color 0.2s',
                    flexShrink: 0,
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      height: 2,
                      width: 40,
                      bgcolor: isResizingVrTourSplitter ? 'primary.main' : 'grey.400',
                      borderRadius: 1,
                    },
                  }}
                />
              )}
              {/* 折りたたみ時の隙間 */}
              {(!vrTourExpanded || !publicationExpanded) && (
                <Box sx={{ height: 6, flexShrink: 0 }} />
              )}

              {/* 物件公開ページ */}
              <Paper elevation={3} sx={{
                borderRadius: 2,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                flex: publicationExpanded ? publicationPanelFlex : 'none',
                height: publicationExpanded ? 'auto' : 44,
                minHeight: publicationExpanded ? 0 : 44,
                flexShrink: publicationExpanded ? 1 : 0,
              }}>
                <RoomPropertyPublicationPanel
                  roomId={room.id}
                  expanded={publicationExpanded}
                  onExpandedChange={setPublicationExpanded}
                />
              </Paper>
            </Box>
          </Box>
        </Box>
      )}
      </Box>

      {/* Snackbar通知 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
