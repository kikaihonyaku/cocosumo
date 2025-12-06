import React, { useState, useEffect, useMemo } from "react";
import {
  ThemeProvider,
  CssBaseline,
  Box,
  useMediaQuery,
  Fade,
  Button,
  Paper,
  Collapse,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon
} from '@mui/icons-material';
import muiTheme from '../theme/muiTheme';
import Header from "../components/shared/Header";
import MapContainer from "../components/MapSystem/MapContainer";
import LeftPanel from "../components/MapSystem/LeftPanel/LeftPanel";
import PropertyTable from "../components/MapSystem/BottomPanel/PropertyTable";
import BuildingFormModal from "../components/MapSystem/BuildingFormModal";
import { usePropertyFilter } from "../hooks/usePropertyFilter";

export default function MapSystem() {
  const [leftPanelPinned, setLeftPanelPinned] = useState(true);
  const [bottomPanelVisible, setBottomPanelVisible] = useState(false);
  const [selectedObject, setSelectedObject] = useState(null);
  const [selectedLayers, setSelectedLayers] = useState([]);
  const [rightPanelVisible, setRightPanelVisible] = useState(false);
  const [leftPanelHovered, setLeftPanelHovered] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [propertyListMaximized, setPropertyListMaximized] = useState(false);
  const [leftPanelForceClose, setLeftPanelForceClose] = useState(false);
  const [buildingFormModalOpen, setBuildingFormModalOpen] = useState(false);

  // データ管理用のステート
  // allProperties: API取得データ（フィルタ前）
  // filteredProperties, aggregations: usePropertyFilterフックから取得（フィルタ後）
  const [allProperties, setAllProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchConditions, setSearchConditions] = useState({
    externalImport: true,      // 外部取込み（デフォルト: チェックあり）
    ownRegistration: true,     // 自社登録（デフォルト: チェックあり）
  });
  const [mapControllers, setMapControllers] = useState(null);
  const [availableLayers, setAvailableLayers] = useState([]);

  // 詳細検索関連のステート
  const [leftPanelActiveTab, setLeftPanelActiveTab] = useState(0);
  const [advancedSearchFilters, setAdvancedSearchFilters] = useState({
    rentRange: [0, 300000],
    roomTypes: [],
    areaRange: [0, 200],
    ageRange: [0, 40],
  });
  const [geoFilter, setGeoFilter] = useState({
    type: null,  // 'circle' | 'polygon' | null
    circle: null,
    polygon: null,
  });
  const [drawingMode, setDrawingMode] = useState(null);

  // 棒グラフ選択状態
  const [selectedRentRanges, setSelectedRentRanges] = useState([]);
  const [selectedAreaRanges, setSelectedAreaRanges] = useState([]);
  const [selectedAgeRanges, setSelectedAgeRanges] = useState([]);

  // GISフィルタで絞り込まれた物件ID（PostGIS精度を維持）
  const [geoFilteredIds, setGeoFilteredIds] = useState(null);

  // フロントエンドフィルタリング（usePropertyFilterフック）
  // allPropertiesに対してフィルタ・集計を行い、filteredProperties, aggregationsを取得
  // geoFilteredIdsを渡すことで、GISフィルタも適用
  const { filteredProperties, aggregations, propertiesForMapPins } = usePropertyFilter(
    allProperties,
    advancedSearchFilters,
    {
      selectedRentRanges,
      selectedAreaRanges,
      selectedAgeRanges,
    },
    geoFilteredIds
  );

  // レスポンシブ設定
  const isMdUp = useMediaQuery(muiTheme.breakpoints.up('md'));
  const isSmUp = useMediaQuery(muiTheme.breakpoints.up('sm'));
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md')); // 960px未満（モバイル）

  // モバイル時は左パネルをピン止めしない
  useEffect(() => {
    if (isMobile) {
      setLeftPanelPinned(false);
    }
  }, [isMobile]);

  // 初回データ取得
  useEffect(() => {
    fetchBasePropertyData();
    fetchMapLayers();
  }, []);

  // ウィンドウがフォーカスされたときにレイヤー情報を再取得
  // (レイヤー管理画面で変更した後、このページに戻ったときに反映される)
  useEffect(() => {
    const handleFocus = () => {
      fetchMapLayers();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // ベース物件データの取得（検索条件のみ適用、GISフィルタは別APIで処理）
  const fetchBasePropertyData = async (conditions = searchConditions) => {
    setIsLoading(true);
    setError(null);
    try {
      // クエリパラメータを構築（ベース検索条件のみ、GISは含まない）
      const params = new URLSearchParams();

      // ベース検索条件
      if (conditions.propertyName) params.append('name', conditions.propertyName);
      if (conditions.address) params.append('address', conditions.address);
      if (conditions.buildingType) params.append('building_type', conditions.buildingType);
      if (conditions.hasVacancy === 'true') params.append('has_vacancy', 'true');
      if (conditions.hasVacancy === 'false') params.append('has_vacancy', 'false');
      if (conditions.minRooms) params.append('min_rooms', conditions.minRooms);
      if (conditions.maxRooms) params.append('max_rooms', conditions.maxRooms);
      if (conditions.maxVacancyRate) params.append('max_vacancy_rate', conditions.maxVacancyRate);
      if (conditions.externalImport !== undefined) {
        params.append('external_import', conditions.externalImport);
      }
      if (conditions.ownRegistration !== undefined) {
        params.append('own_registration', conditions.ownRegistration);
      }

      const queryString = params.toString();
      const url = queryString ? `/api/v1/property_analysis?${queryString}` : '/api/v1/property_analysis';

      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // 全物件データをstateに保存（フィルタはフロントエンドで行う）
        setAllProperties(data.properties || []);
      } else if (response.status === 401) {
        window.location.href = '/login';
        return;
      } else {
        throw new Error('物件情報の取得に失敗しました');
      }
    } catch (err) {
      console.error('取得エラー:', err);
      setError(err.message || 'ネットワークエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // GISフィルタAPIを呼び出し、範囲内の物件IDを取得（軽量API）
  // POSTリクエストを使用（ポリゴン座標が大きくなるため）
  const fetchGeoFilteredIds = async (geo, conditions = searchConditions) => {
    if (!geo || !geo.type) {
      // GISフィルタがない場合はnullをセット
      setGeoFilteredIds(null);
      return;
    }

    try {
      // リクエストボディを構築
      const requestBody = {
        // ベース検索条件
        name: conditions.propertyName || null,
        address: conditions.address || null,
        building_type: conditions.buildingType || null,
        has_vacancy: conditions.hasVacancy || null,
        min_rooms: conditions.minRooms || null,
        max_rooms: conditions.maxRooms || null,
        external_import: conditions.externalImport,
        own_registration: conditions.ownRegistration,
        // GISパラメータ
        geo_type: geo.type,
      };

      if (geo.type === 'circle' && geo.circle) {
        requestBody.lat = geo.circle.center.lat;
        requestBody.lng = geo.circle.center.lng;
        requestBody.radius = geo.circle.radius;
      }
      if (geo.type === 'polygon' && geo.polygon) {
        requestBody.polygon = geo.polygon;
      }

      const response = await fetch('/api/v1/property_analysis/geo_filter', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        setGeoFilteredIds(data.building_ids || []);
      } else if (response.status === 401) {
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('GISフィルタ取得エラー:', err);
      // エラー時はGISフィルタなしとして扱う
      setGeoFilteredIds(null);
    }
  };

  // レイヤー情報の取得（一般ユーザー用API使用）
  const fetchMapLayers = async () => {
    try {
      const response = await fetch('/api/v1/map_layers', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // map_layersから取得したデータをLeftPanel用に変換
        const layers = data.map(layer => ({
          id: layer.layer_key,
          label: layer.name,
          description: `${layer.feature_count}件のフィーチャー`,
          color: layer.color,
          opacity: layer.opacity,
          is_active: layer.is_active,
          layer_type: layer.layer_type,
          attribution: layer.attribution,
        }));

        setAvailableLayers(layers);
      } else if (response.status === 403 || response.status === 401) {
        // 権限がない場合は空配列（レイヤー機能を表示しない）
        setAvailableLayers([]);
      }
    } catch (error) {
      console.error('レイヤー情報の取得エラー:', error);
      setAvailableLayers([]);
    }
  };

  // 詳細検索のリセット（フィルタ条件をデフォルトに戻す）
  const handleResetAdvancedSearch = () => {
    const defaultFilters = {
      rentRange: [0, 300000],
      roomTypes: [],
      areaRange: [0, 200],
      ageRange: [0, 40],
    };
    setAdvancedSearchFilters(defaultFilters);
    setGeoFilter({ type: null, circle: null, polygon: null });
    setDrawingMode(null);
    // 棒グラフ選択もリセット
    setSelectedRentRanges([]);
    setSelectedAreaRanges([]);
    setSelectedAgeRanges([]);
    // GISフィルタをクリア（useEffectで自動的にfetchGeoFilteredIdsが呼ばれる）
    setGeoFilteredIds(null);
  };

  // 棒グラフ範囲選択のトグルハンドラー（API呼び出しなし、stateのみ更新）
  const handleRentRangeToggle = (range) => {
    setSelectedRentRanges(prev =>
      prev.includes(range) ? prev.filter(r => r !== range) : [...prev, range]
    );
  };

  const handleAreaRangeToggle = (range) => {
    setSelectedAreaRanges(prev =>
      prev.includes(range) ? prev.filter(r => r !== range) : [...prev, range]
    );
  };

  const handleAgeRangeToggle = (range) => {
    setSelectedAgeRanges(prev =>
      prev.includes(range) ? prev.filter(r => r !== range) : [...prev, range]
    );
  };

  // GeoFilterのクリア
  const handleClearGeoFilter = () => {
    setGeoFilter({ type: null, circle: null, polygon: null });
  };

  // geoFilterが変更されたらGISフィルタAPIを呼び出し
  useEffect(() => {
    fetchGeoFilteredIds(geoFilter, searchConditions);
  }, [geoFilter]);

  // タブ変更ハンドラー
  const handleTabChange = (newTab) => {
    setLeftPanelActiveTab(newTab);
  };

  // サマリーデータを計算（フィルタ後のデータを使用）
  const summary = useMemo(() => {
    if (!filteredProperties || filteredProperties.length === 0) {
      return {
        buildingCount: 0,
        roomCount: 0,
        avgRent: null,
        avgAge: null,
      };
    }

    const buildingCount = filteredProperties.length;
    let roomCount = 0;
    let totalRent = 0;
    let rentCount = 0;
    let totalAge = 0;
    let ageCount = 0;
    const currentYear = new Date().getFullYear();

    filteredProperties.forEach(property => {
      // 部屋数
      roomCount += property.room_cnt || 0;

      // 平均賃料（部屋の賃料から計算）
      if (property.rooms && Array.isArray(property.rooms)) {
        property.rooms.forEach(room => {
          if (room.rent && room.rent > 0) {
            totalRent += room.rent;
            rentCount++;
          }
        });
      }

      // 平均築年数
      if (property.built_date) {
        const builtYear = new Date(property.built_date).getFullYear();
        const age = currentYear - builtYear;
        if (age >= 0) {
          totalAge += age;
          ageCount++;
        }
      }
    });

    return {
      buildingCount,
      roomCount,
      avgRent: rentCount > 0 ? totalRent / rentCount : null,
      avgAge: ageCount > 0 ? totalAge / ageCount : null,
    };
  }, [filteredProperties]);

  const handleMarkerSelect = (type, data) => {
    setSelectedObject({ type, data });
    setRightPanelVisible(true);

    // 右パネルが表示される時に左パネルのホバー状態を閉じる
    if (!leftPanelPinned && leftPanelHovered) {
      setLeftPanelForceClose(true);
      setLeftPanelHovered(false);
      setTimeout(() => setLeftPanelForceClose(false), 300);
    }
  };

  const handleSearch = async (conditions) => {
    try {
      setSearchConditions(conditions);
      // 検索条件変更時はベースデータを再取得（フィルタはフロントエンドで自動適用）
      await fetchBasePropertyData(conditions);
      // GISフィルタがある場合は再取得
      if (geoFilter && geoFilter.type) {
        await fetchGeoFilteredIds(geoFilter, conditions);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleLayerToggle = (layerId, enabled) => {
    setSelectedLayers(prev => {
      if (enabled) {
        return [...prev, layerId];
      } else {
        return prev.filter(id => id !== layerId);
      }
    });
  };

  const handleTogglePin = () => {
    setLeftPanelPinned(!leftPanelPinned);
  };

  const handleToggleBottomPanel = () => {
    setBottomPanelVisible(!bottomPanelVisible);
  };

  const handleTogglePropertyListMaximize = () => {
    setPropertyListMaximized(!propertyListMaximized);
    // 最大化時は下ペインを非表示に
    if (!propertyListMaximized) {
      setBottomPanelVisible(false);
    } else {
      // 最小化時（最大化を解除時）は下ペインを表示
      setBottomPanelVisible(true);
    }
  };

  const handleClosePropertyList = () => {
    setPropertyListMaximized(false);
    setBottomPanelVisible(false);
  };

  const handleMapAreaClick = () => {
    // 左パネルがピン止めされておらず、ホバー状態の場合は強制的に閉じる
    if (!leftPanelPinned && leftPanelHovered) {
      setLeftPanelForceClose(true);
      setLeftPanelHovered(false);
      // 少し遅延後にフォースクローズ状態をリセット
      setTimeout(() => setLeftPanelForceClose(false), 300);
    }
  };

  // 新規物件登録成功時のハンドラー
  const handleBuildingRegistered = (newBuilding) => {
    // 物件詳細画面を別タブで開く
    window.open(`/building/${newBuilding.id}`, '_blank');
    // 物件一覧を再取得
    fetchBasePropertyData(searchConditions);
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* デスクトップ時のヘッダーホバーエリア */}
        {!isMobile && (
          <>
            <Box
              sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '20px',
                zIndex: 2200,
                pointerEvents: 'all',
              }}
              onMouseEnter={() => setHeaderVisible(true)}
              onMouseLeave={() => setHeaderVisible(false)}
            />

            {/* ヘッダーエリア */}
            <Fade in={headerVisible} timeout={200}>
              <Box
                sx={{
                  position: 'fixed',
                  top: headerVisible ? 0 : '-60px',
                  left: 0,
                  right: 0,
                  zIndex: 2100,
                  transition: 'top 0.2s ease-in-out',
                }}
                onMouseEnter={() => setHeaderVisible(true)}
                onMouseLeave={() => setHeaderVisible(false)}
              >
                <Header />
              </Box>
            </Fade>
          </>
        )}

        {/* コンテンツエリア */}
        <Box
          sx={{
            display: 'flex',
            flex: 1,
            overflow: 'hidden',
            bgcolor: 'background.default',
            paddingTop: !isMobile ? (headerVisible ? '45px' : '0px') : '0px',
            transition: 'padding-top 0.2s ease-in-out',
          }}
        >
          {/* メインコンテンツエリア */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* 左ペイン（ピン止め時・フローティング時共通） */}
            <LeftPanel
              isPinned={leftPanelPinned}
              onTogglePin={handleTogglePin}
              onSearch={handleSearch}
              onLayerToggle={handleLayerToggle}
              searchConditions={searchConditions}
              selectedLayers={selectedLayers}
              availableLayers={availableLayers}
              onHoverChange={setLeftPanelHovered}
              isLoading={isLoading}
              error={error}
              forceClose={leftPanelForceClose}
              // 検索タブ用のprops
              advancedSearchFilters={advancedSearchFilters}
              onAdvancedSearchFiltersChange={setAdvancedSearchFilters}
              advancedSearchAggregations={aggregations}
              onResetAdvancedSearch={handleResetAdvancedSearch}
              geoFilter={geoFilter}
              activeTab={leftPanelActiveTab}
              onTabChange={handleTabChange}
              // サマリー用のprops
              summary={summary}
              // 棒グラフ選択状態
              selectedRentRanges={selectedRentRanges}
              selectedAreaRanges={selectedAreaRanges}
              selectedAgeRanges={selectedAgeRanges}
              onRentRangeToggle={handleRentRangeToggle}
              onAreaRangeToggle={handleAreaRangeToggle}
              onAgeRangeToggle={handleAgeRangeToggle}
            />
            {/* 上部エリア（地図 + 右ペイン） */}
            <Box
              sx={{
                display: 'flex',
                flex: 1,
                overflow: 'hidden',
                marginLeft: leftPanelPinned ? '363px' : '0px',
                transition: 'margin-left 0.3s ease',
              }}
            >
              {/* 中央の地図エリア */}
              <Box
                sx={{ flex: 1, position: 'relative' }}
                onClick={handleMapAreaClick}
              >
                {propertyListMaximized ? (
                  /* 最大化された物件一覧 */
                  <Fade in={true} timeout={300}>
                    <Paper
                      elevation={2}
                      sx={{
                        position: 'absolute',
                        top: '2px',
                        left: '2px',
                        right: rightPanelVisible && !isMobile ? '4px' : '2px',
                        bottom: '2px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                      }}
                    >
                      <Box sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        px: 2,
                        py: 0.5,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        minHeight: '40px'
                      }}>
                        <Box component="h3" sx={{ m: 0, fontSize: '1rem', fontWeight: 600 }}>
                          物件一覧（最大化表示）
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="元に戻す" placement="top">
                            <Button
                              size="small"
                              onClick={handleTogglePropertyListMaximize}
                              sx={{
                                color: 'white',
                                minWidth: 'auto',
                                p: 0.5,
                                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
                              }}
                            >
                              <FullscreenExitIcon fontSize="small" />
                            </Button>
                          </Tooltip>
                          <Tooltip title="閉じる" placement="top">
                            <Button
                              size="small"
                              onClick={handleClosePropertyList}
                              sx={{
                                color: 'white',
                                minWidth: 'auto',
                                p: 0.5,
                                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
                              }}
                            >
                              ✕
                            </Button>
                          </Tooltip>
                        </Box>
                      </Box>
                      <Box sx={{ flex: 1, overflow: 'auto' }}>
                        <PropertyTable
                          properties={filteredProperties}
                          onPropertySelect={(property) => {
                            setSelectedObject({ type: 'property', data: property });
                            setRightPanelVisible(true);
                            // 左パネルのホバー状態を閉じる
                            if (!leftPanelPinned && leftPanelHovered) {
                              setLeftPanelForceClose(true);
                              setLeftPanelHovered(false);
                              setTimeout(() => setLeftPanelForceClose(false), 300);
                            }
                          }}
                          searchConditions={searchConditions}
                        />
                      </Box>
                    </Paper>
                  </Fade>
                ) : (
                  /* 通常の地図表示 */
                  <MapContainer
                    onMarkerSelect={handleMarkerSelect}
                    rightPanelVisible={rightPanelVisible}
                    onToggleRightPanel={() => setRightPanelVisible(true)}
                    selectedObject={selectedObject}
                    properties={propertiesForMapPins}
                    isLoading={isLoading}
                    onNewBuildingClick={() => setBuildingFormModalOpen(true)}
                    selectedLayers={selectedLayers}
                    availableLayers={availableLayers}
                    // 描画ツール関連のprops（検索タブ時のみ表示）
                    showDrawingTools={leftPanelActiveTab === 0}
                    drawingMode={drawingMode}
                    onDrawingModeChange={setDrawingMode}
                    geoFilter={geoFilter}
                    onGeoFilterChange={setGeoFilter}
                    onClearGeoFilter={handleClearGeoFilter}
                    // レイヤーポリゴンクリック時のGISフィルタ適用
                    onApplyFilters={fetchGeoFilteredIds}
                    // GISフィルタが有効かどうか
                    hasGeoFilter={geoFilteredIds !== null}
                  />
                )}
              </Box>

              {/* モバイル用背景オーバーレイ */}
              {isMobile && rightPanelVisible && (
                <Box
                  sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'rgba(0, 0, 0, 0.4)',
                    zIndex: 1300,
                  }}
                  onClick={() => setRightPanelVisible(false)}
                />
              )}

              {/* 右ペイン */}
              {rightPanelVisible && (
                <Paper
                  elevation={2}
                  square
                  sx={{
                    width: isMobile ? 'calc(100% - 16px)' : 320,
                    position: isMobile ? 'fixed' : 'relative',
                    top: isMobile ? '50%' : '2px',
                    left: isMobile ? '50%' : 'auto',
                    right: isMobile ? 'auto' : '2px',
                    height: isMobile ? 'auto' : 'calc(100% - 4px)',
                    maxHeight: isMobile ? '70vh' : 'calc(100% - 4px)',
                    transform: isMobile ? 'translate(-50%, -50%)' : 'none',
                    zIndex: isMobile ? 1400 : 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    '&&': {
                      borderTopLeftRadius: isMobile ? 8 : 8,
                      borderTopRightRadius: isMobile ? 8 : 8,
                      borderBottomLeftRadius: isMobile ? 8 : 0,
                      borderBottomRightRadius: isMobile ? 8 : 0,
                    }
                  }}
                >
                    <Box
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        px: 2,
                        py: 0.5,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        minHeight: '40px',
                      }}
                    >
                      <Box component="h3" sx={{ m: 0, fontSize: '1rem', fontWeight: 600 }}>
                        物件詳細
                      </Box>
                      <Button
                        size="small"
                        onClick={() => setRightPanelVisible(false)}
                        sx={{
                          color: 'white',
                          minWidth: 'auto',
                          p: 0.5,
                          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
                        }}
                        title="物件詳細を閉じる"
                      >
                        ✕
                      </Button>
                    </Box>

                    <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
                      {selectedObject ? (
                        <Box>
                          {selectedObject.type === 'property' && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {/* サムネイル画像 */}
                              {selectedObject.data.thumbnail_url ? (
                                <Box
                                  sx={{
                                    width: '100%',
                                    height: 160,
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    bgcolor: 'grey.100',
                                    cursor: 'pointer',
                                  }}
                                  onClick={() => window.open(`/building/${selectedObject.data.id}`, '_blank')}
                                >
                                  <Box
                                    component="img"
                                    src={selectedObject.data.thumbnail_url}
                                    alt={selectedObject.data.name}
                                    sx={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                    }}
                                  />
                                </Box>
                              ) : (
                                <Box
                                  sx={{
                                    width: '100%',
                                    height: 100,
                                    borderRadius: 1,
                                    bgcolor: 'grey.200',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'text.secondary',
                                    fontSize: '0.875rem',
                                  }}
                                >
                                  写真なし
                                </Box>
                              )}

                              {/* 建物名 */}
                              <Box
                                sx={{
                                  fontSize: '1.1rem',
                                  fontWeight: 600,
                                  color: 'text.primary',
                                  cursor: 'pointer',
                                  '&:hover': {
                                    color: 'primary.main',
                                    textDecoration: 'underline',
                                  }
                                }}
                                onClick={() => window.open(`/building/${selectedObject.data.id}`, '_blank')}
                              >
                                {selectedObject.data.name}
                              </Box>

                              {/* 外観写真枚数 */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', fontSize: '0.875rem' }}>
                                <span>外観写真: {selectedObject.data.exterior_photo_count || 0}枚</span>
                              </Box>

                              {/* 部屋リスト */}
                              <Box>
                                <Box sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.secondary', mb: 1 }}>
                                  部屋一覧 ({selectedObject.data.rooms?.length || 0}件)
                                </Box>
                                {selectedObject.data.rooms && selectedObject.data.rooms.length > 0 ? (
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    {selectedObject.data.rooms.map((room) => (
                                      <Paper
                                        key={room.id}
                                        variant="outlined"
                                        sx={{
                                          p: 1.5,
                                          cursor: 'pointer',
                                          transition: 'all 0.2s',
                                          '&:hover': {
                                            bgcolor: 'action.hover',
                                            borderColor: 'primary.main',
                                          }
                                        }}
                                        onClick={() => window.open(`/building/${selectedObject.data.id}/room/${room.id}`, '_blank')}
                                      >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Box sx={{ fontWeight: 600, fontSize: '0.9rem', minWidth: '50px' }}>
                                              {room.room_number || '-'}
                                            </Box>
                                            <Box sx={{ fontSize: '0.85rem', color: 'text.secondary', minWidth: '50px' }}>
                                              {room.room_type || '-'}
                                            </Box>
                                          </Box>
                                          <Box sx={{ fontWeight: 600, fontSize: '0.9rem', color: 'primary.main' }}>
                                            {room.rent ? `${(room.rent / 10000).toFixed(1)}万円` : '-'}
                                          </Box>
                                        </Box>
                                      </Paper>
                                    ))}
                                  </Box>
                                ) : (
                                  <Box sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                                    部屋情報がありません
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      ) : (
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 3,
                            textAlign: 'center',
                            color: 'text.secondary',
                            border: '2px dashed',
                            borderColor: 'grey.300',
                          }}
                        >
                          地図上の物件を選択してください
                        </Paper>
                      )}
                    </Box>
                  </Paper>
              )}
            </Box>

            {/* 下ペイン - 最大化時は非表示 */}
            {(!leftPanelPinned || isMdUp) && !propertyListMaximized && (
              <Collapse in={bottomPanelVisible}>
                <Paper
                  elevation={2}
                  sx={{
                    height: '50vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    zIndex: 1200,
                    position: 'relative',
                    marginLeft: leftPanelPinned ? '364px' : '0px',
                    marginRight: '1px',
                    transition: 'margin-left 0.3s ease',
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      px: 2,
                      py: 0.5,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      minHeight: '40px',
                      flexShrink: 0,
                    }}
                  >
                    <Box component="h3" sx={{ m: 0, fontSize: '1rem', fontWeight: 600 }}>
                      物件一覧
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="最大化" placement="top">
                        <IconButton
                          size="small"
                          onClick={handleTogglePropertyListMaximize}
                          sx={{
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)'
                            }
                          }}
                        >
                          <FullscreenIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Button
                        size="small"
                        onClick={() => setBottomPanelVisible(false)}
                        sx={{ color: 'white', minWidth: 'auto', p: 0.5 }}
                        title="閉じる"
                      >
                        ✕
                      </Button>
                    </Box>
                  </Box>
                  <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <PropertyTable
                      properties={filteredProperties}
                      onPropertySelect={(property) => {
                        setSelectedObject({ type: 'property', data: property });
                        setRightPanelVisible(true);

                        // 地図マーカーをクリックした時と同じ動作をグローバル関数で実行
                        if (window.selectProperty && property.id) {
                          window.selectProperty(property.id);
                        }

                        // 左パネルのホバー状態を閉じる
                        if (!leftPanelPinned && leftPanelHovered) {
                          setLeftPanelForceClose(true);
                          setLeftPanelHovered(false);
                          setTimeout(() => setLeftPanelForceClose(false), 300);
                        }
                      }}
                      searchConditions={searchConditions}
                    />
                  </Box>
                </Paper>
              </Collapse>
            )}
          </Box>

          {/* 下ペイン表示ボタン（非表示時かつ非最大化時） */}
          {!bottomPanelVisible && !propertyListMaximized && (
            <Box
              sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: '80px',
                pointerEvents: 'none', // 背景はクリック不可
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingLeft: isMobile ? '20px' : (leftPanelPinned || leftPanelHovered ? '360px' : '60px'),
                paddingRight: isMobile ? '20px' : '0px',
                transition: 'padding-left 0.3s ease',
                zIndex: 1000,
              }}
            >
              <Fade in={true}>
                <Button
                  variant="contained"
                  onClick={() => {
                    setBottomPanelVisible(true);
                    if (selectedObject) {
                      setRightPanelVisible(true);
                    }
                  }}
                  sx={{
                    pointerEvents: 'all', // ボタンのみクリック可能
                    borderRadius: '25px',
                    px: isMobile ? 2.5 : 3,
                    py: isMobile ? 1.5 : 1.5,
                    fontSize: isMobile ? '1rem' : '1rem',
                    minHeight: isMobile ? '44px' : 'auto',
                    maxWidth: isMobile ? '200px' : 'auto',
                  }}
                >
                  物件一覧を表示
                </Button>
              </Fade>
            </Box>
          )}

        </Box>

        {/* 物件新規登録モーダル */}
        <BuildingFormModal
          isOpen={buildingFormModalOpen}
          onClose={() => setBuildingFormModalOpen(false)}
          onSuccess={handleBuildingRegistered}
        />
      </Box>
    </ThemeProvider>
  );
}
