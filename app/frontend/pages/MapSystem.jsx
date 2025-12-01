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
  const [properties, setProperties] = useState([]);
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
  const [advancedSearchAggregations, setAdvancedSearchAggregations] = useState(null);
  const [isAdvancedSearchLoading, setIsAdvancedSearchLoading] = useState(false);
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
    fetchBuildings();
    fetchMapLayers();
    // 初期ロード時に詳細検索も実行（左パネルの集計データ取得）
    fetchAdvancedSearch();
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

  // 物件データの取得
  const fetchBuildings = async (conditions = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      // クエリパラメータを構築
      const params = new URLSearchParams();
      if (conditions.propertyName) params.append('name', conditions.propertyName);
      if (conditions.address) params.append('address', conditions.address);
      if (conditions.buildingType) params.append('building_type', conditions.buildingType);
      if (conditions.hasVacancy === 'true') params.append('has_vacancy', 'true');
      if (conditions.hasVacancy === 'false') params.append('has_vacancy', 'false');
      if (conditions.minRooms) params.append('min_rooms', conditions.minRooms);
      if (conditions.maxRooms) params.append('max_rooms', conditions.maxRooms);
      if (conditions.maxVacancyRate) params.append('max_vacancy_rate', conditions.maxVacancyRate);

      // 登録元フィルタ
      if (conditions.externalImport !== undefined) {
        params.append('external_import', conditions.externalImport);
      }
      if (conditions.ownRegistration !== undefined) {
        params.append('own_registration', conditions.ownRegistration);
      }

      const queryString = params.toString();
      const url = queryString ? `/api/v1/buildings?${queryString}` : '/api/v1/buildings';

      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProperties(data);
      } else if (response.status === 401) {
        // 認証エラーの場合、ログインページにリダイレクト
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

  // 詳細検索APIの呼び出し（searchConditionsも含める）
  const fetchAdvancedSearch = async (
    filters = advancedSearchFilters,
    geo = geoFilter,
    baseConditions = searchConditions,
    rentRanges = selectedRentRanges,
    areaRanges = selectedAreaRanges,
    ageRanges = selectedAgeRanges
  ) => {
    setIsAdvancedSearchLoading(true);
    try {
      const params = new URLSearchParams();

      // ベース検索条件（検索条件を設定で指定された条件）
      if (baseConditions.propertyName) params.append('name', baseConditions.propertyName);
      if (baseConditions.address) params.append('address', baseConditions.address);
      if (baseConditions.buildingType) params.append('building_type', baseConditions.buildingType);
      if (baseConditions.hasVacancy === 'true') params.append('has_vacancy', 'true');
      if (baseConditions.hasVacancy === 'false') params.append('has_vacancy', 'false');
      if (baseConditions.minRooms) params.append('min_rooms', baseConditions.minRooms);
      if (baseConditions.maxRooms) params.append('max_rooms', baseConditions.maxRooms);
      if (baseConditions.maxVacancyRate) params.append('max_vacancy_rate', baseConditions.maxVacancyRate);
      if (baseConditions.externalImport !== undefined) {
        params.append('external_import', baseConditions.externalImport);
      }
      if (baseConditions.ownRegistration !== undefined) {
        params.append('own_registration', baseConditions.ownRegistration);
      }

      // フィルタパラメータ（スライダーで指定された条件）
      if (filters.rentRange[0] > 0) params.append('rent_min', filters.rentRange[0]);
      if (filters.rentRange[1] < 300000) params.append('rent_max', filters.rentRange[1]);
      if (filters.roomTypes.length > 0) params.append('room_types', filters.roomTypes.join(','));
      if (filters.areaRange[0] > 0) params.append('area_min', filters.areaRange[0]);
      if (filters.areaRange[1] < 200) params.append('area_max', filters.areaRange[1]);
      if (filters.ageRange[0] > 0) params.append('age_min', filters.ageRange[0]);
      if (filters.ageRange[1] < 40) params.append('age_max', filters.ageRange[1]);

      // 棒グラフ選択範囲パラメータ
      if (rentRanges.length > 0) params.append('rent_ranges', rentRanges.join(','));
      if (areaRanges.length > 0) params.append('area_ranges', areaRanges.join(','));
      if (ageRanges.length > 0) params.append('age_ranges', ageRanges.join(','));

      // GISパラメータ
      if (geo.type === 'circle' && geo.circle) {
        params.append('lat', geo.circle.center.lat);
        params.append('lng', geo.circle.center.lng);
        params.append('radius', geo.circle.radius);
      }
      if (geo.type === 'polygon' && geo.polygon) {
        params.append('polygon', geo.polygon);
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
        setAdvancedSearchAggregations(data.aggregations || null);
        // 検索結果の物件リストも更新（サマリーや地図マーカーに反映）
        if (data.properties) {
          setProperties(data.properties);
        }
      } else if (response.status === 401) {
        window.location.href = '/login';
        return;
      } else {
        console.error('詳細検索エラー:', response.status);
      }
    } catch (err) {
      console.error('詳細検索エラー:', err);
    } finally {
      setIsAdvancedSearchLoading(false);
    }
  };

  // 詳細検索の適用（引数で新しいフィルター値やgeoFilterを受け取れるようにする）
  const handleApplyAdvancedSearch = (newFilters = null, newGeoFilter = null) => {
    const filtersToUse = newFilters || advancedSearchFilters;
    const geoToUse = newGeoFilter !== null ? newGeoFilter : geoFilter;
    fetchAdvancedSearch(filtersToUse, geoToUse);
  };

  // 詳細検索のリセット
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
    fetchAdvancedSearch(defaultFilters, { type: null, circle: null, polygon: null }, searchConditions, [], [], []);
  };

  // 棒グラフ範囲選択のトグルハンドラー
  const handleRentRangeToggle = (range) => {
    const newRanges = selectedRentRanges.includes(range)
      ? selectedRentRanges.filter(r => r !== range)
      : [...selectedRentRanges, range];
    setSelectedRentRanges(newRanges);
    fetchAdvancedSearch(advancedSearchFilters, geoFilter, searchConditions, newRanges, selectedAreaRanges, selectedAgeRanges);
  };

  const handleAreaRangeToggle = (range) => {
    const newRanges = selectedAreaRanges.includes(range)
      ? selectedAreaRanges.filter(r => r !== range)
      : [...selectedAreaRanges, range];
    setSelectedAreaRanges(newRanges);
    fetchAdvancedSearch(advancedSearchFilters, geoFilter, searchConditions, selectedRentRanges, newRanges, selectedAgeRanges);
  };

  const handleAgeRangeToggle = (range) => {
    const newRanges = selectedAgeRanges.includes(range)
      ? selectedAgeRanges.filter(r => r !== range)
      : [...selectedAgeRanges, range];
    setSelectedAgeRanges(newRanges);
    fetchAdvancedSearch(advancedSearchFilters, geoFilter, searchConditions, selectedRentRanges, selectedAreaRanges, newRanges);
  };

  // GeoFilterのクリア
  const handleClearGeoFilter = () => {
    setGeoFilter({ type: null, circle: null, polygon: null });
  };

  // geoFilterが変更されたら自動的に検索を実行
  useEffect(() => {
    // geoFilterが設定されている場合のみ自動検索
    if (geoFilter && geoFilter.type) {
      fetchAdvancedSearch(advancedSearchFilters, geoFilter, searchConditions, selectedRentRanges, selectedAreaRanges, selectedAgeRanges);
    }
  }, [geoFilter]);

  // タブ変更時に検索タブに切り替えた場合は初回データ取得
  const handleTabChange = (newTab) => {
    setLeftPanelActiveTab(newTab);
    if (newTab === 1 && !advancedSearchAggregations) {
      fetchAdvancedSearch();
    }
  };

  // サマリーデータを計算
  const summary = useMemo(() => {
    if (!properties || properties.length === 0) {
      return {
        buildingCount: 0,
        roomCount: 0,
        avgRent: null,
        avgAge: null,
      };
    }

    const buildingCount = properties.length;
    let roomCount = 0;
    let totalRent = 0;
    let rentCount = 0;
    let totalAge = 0;
    let ageCount = 0;
    const currentYear = new Date().getFullYear();

    properties.forEach(property => {
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
  }, [properties]);

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
      await fetchBuildings(conditions);
      // 検索条件を設定した後、詳細検索も再実行して該当物件数を更新
      // 現在のadvancedSearchFiltersとgeoFilterを維持しつつ、新しい検索条件で再検索
      await fetchAdvancedSearch(advancedSearchFilters, geoFilter, conditions);
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

  const getBuildingTypeLabel = (type) => {
    const typeMap = {
      mansion: 'マンション',
      apartment: 'アパート',
      house: '一戸建て',
      office: 'オフィス',
      store: '店舗',
      other: 'その他'
    };
    return typeMap[type] || type;
  };

  // 新規物件登録成功時のハンドラー
  const handleBuildingRegistered = (newBuilding) => {
    // 物件詳細画面を別タブで開く
    window.open(`/building/${newBuilding.id}`, '_blank');
    // 物件一覧を再取得
    fetchBuildings(searchConditions);
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
              advancedSearchAggregations={advancedSearchAggregations}
              isAdvancedSearchLoading={isAdvancedSearchLoading}
              onApplyAdvancedSearch={handleApplyAdvancedSearch}
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
                          properties={properties}
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
                    properties={properties}
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
                    onApplyFilters={handleApplyAdvancedSearch}
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
                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Box sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', mb: 0.5 }}>
                                  物件名
                                </Box>
                                <Box sx={{ fontSize: '1rem', color: 'text.primary' }}>
                                  {selectedObject.data.name}
                                </Box>
                              </Paper>

                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Box sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', mb: 0.5 }}>
                                  住所
                                </Box>
                                <Box sx={{ fontSize: '1rem', color: 'text.primary' }}>
                                  {selectedObject.data.address}
                                </Box>
                              </Paper>

                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Box sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', mb: 0.5 }}>
                                  建物種別
                                </Box>
                                <Box sx={{ fontSize: '1rem', color: 'text.primary' }}>
                                  {getBuildingTypeLabel(selectedObject.data.building_type)}
                                </Box>
                              </Paper>

                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
                                  <Box sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', mb: 0.5 }}>
                                    総戸数
                                  </Box>
                                  <Box sx={{ fontSize: '1rem', color: 'text.primary' }}>
                                    {selectedObject.data.room_cnt || 0}戸
                                  </Box>
                                </Paper>

                                <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
                                  <Box sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', mb: 0.5 }}>
                                    空室数
                                  </Box>
                                  <Box sx={{ fontSize: '1rem', color: 'text.primary' }}>
                                    {selectedObject.data.free_cnt || 0}戸
                                  </Box>
                                </Paper>
                              </Box>

                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Box sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', mb: 0.5 }}>
                                  空室率
                                </Box>
                                <Box sx={{ fontSize: '1rem', color: 'text.primary' }}>
                                  {selectedObject.data.room_cnt > 0
                                    ? ((selectedObject.data.free_cnt / selectedObject.data.room_cnt) * 100).toFixed(1)
                                    : '0.0'}%
                                </Box>
                              </Paper>

                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                                <Button
                                  variant="contained"
                                  fullWidth
                                  onClick={() => window.open(`/building/${selectedObject.data.id}`, '_blank')}
                                  sx={{
                                    minHeight: isMobile ? '48px' : 'auto',
                                    fontSize: isMobile ? '1rem' : '0.875rem'
                                  }}
                                >
                                  詳細ページを開く
                                </Button>
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
                      properties={properties}
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
