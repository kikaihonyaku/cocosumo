import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  FormControlLabel,
  Checkbox,
  Paper,
  Tooltip,
  Fade,
  useMediaQuery,
  Fab,
  Tabs,
  Tab,
} from '@mui/material';
import {
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
  Search as SearchIcon,
  Layers as LayersIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import SearchModal from './SearchModal';
import AdvancedSearchTab from './AdvancedSearchTab';
import muiTheme from '../../../theme/muiTheme';

export default function LeftPanel({
  isPinned,
  onTogglePin,
  onSearch,
  onLayerToggle,
  searchConditions = {},
  selectedLayers = [],
  availableLayers = [],
  onHoverChange,
  isLoading = false,
  forceClose = false,
  // 検索タブ用のprops
  advancedSearchFilters = null,
  onAdvancedSearchFiltersChange = null,
  advancedSearchAggregations = null,
  onResetAdvancedSearch = null,
  geoFilter = null,
  activeTab = 0,
  onTabChange = null,
  // サマリー用のprops
  summary = null,
  // 棒グラフ選択状態
  selectedRentRanges = [],
  selectedAreaRanges = [],
  selectedAgeRanges = [],
  onRentRangeToggle = null,
  onAreaRangeToggle = null,
  onAgeRangeToggle = null,
}) {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [expanded, setExpanded] = useState({
    conditions: true,
    layers: true,
    quickActions: false,
  });
  const [isHovered, setIsHovered] = useState(false);

  // レスポンシブ設定
  const isMdUp = useMediaQuery(muiTheme.breakpoints.up('md'));

  // forceCloseが true になった時にホバー状態をリセット
  useEffect(() => {
    if (forceClose) {
      setIsHovered(false);
      onHoverChange && onHoverChange(false);
    }
  }, [forceClose, onHoverChange]);

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(prev => ({ ...prev, [panel]: isExpanded }));
  };

  // 表示状態を判定（ピン留めされているか、ホバーされているか）
  const isExpanded = isPinned || isHovered;

  return (
    <>
      {/* モバイル時は独立したFabボタンとして表示 */}
      {!isMdUp && !isPinned && !isHovered ? (
        <Box
          sx={{
            position: 'absolute',
            top: 60,
            left: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            zIndex: 1300,
          }}
        >
          <Tooltip title="検索条件" placement="right">
            <Fab
              size="small"
              color="primary"
              onClick={() => setIsSearchModalOpen(true)}
              sx={{
                boxShadow: 2,
                '&:hover': {
                  transform: 'scale(1.1)',
                },
              }}
            >
              <SearchIcon />
            </Fab>
          </Tooltip>

          <Tooltip title="検索パネルを開く" placement="right">
            <Fab
              size="small"
              color="primary"
              onClick={() => {
                setIsHovered(true);
                onHoverChange && onHoverChange(true);
              }}
              sx={{
                boxShadow: 2,
                '&:hover': {
                  transform: 'scale(1.1)',
                },
              }}
            >
              <FilterListIcon />
            </Fab>
          </Tooltip>
        </Box>
      ) : (
        /* デスクトップ時または展開時は従来のPaper形式 */
        <Fade in={true}>
          <Paper
            elevation={2}
            sx={{
              width: isPinned ? 360 : (isHovered ? 360 : 60),
              boxSizing: 'border-box',
              bgcolor: 'primary.main',
              color: 'white',
              overflow: 'hidden',
              transition: 'width 0.3s ease, left 0.3s ease, top 0.3s ease',
              position: 'absolute',
              top: isPinned || isHovered ? '2px' : '80px',
              left: isPinned ? '2px' : (isHovered ? 0 : '16px'),
              height: isPinned ? 'calc(100vh - 4px)' : (isHovered ? 'calc(100vh - 4px)' : '220px'),
              zIndex: isPinned ? 1100 : (isHovered ? 1350 : 1300),
              flexShrink: isPinned ? 0 : undefined,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box
              sx={{
                width: '100%',
                height: '100%',
                p: isExpanded ? 2 : (!isMdUp ? 1 : 0),
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                gap: isExpanded ? 2 : 0,
                overflow: 'hidden',
              }}
              onMouseEnter={() => {
                setIsHovered(true);
                onHoverChange && onHoverChange(true);
              }}
              onMouseLeave={() => {
                setIsHovered(false);
                onHoverChange && onHoverChange(false);
              }}
            >
              {isExpanded ? (
                // 展開時のコンテンツ
                <>
                  {/* ヘッダー（タブとピン留めボタンを横並び） */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexShrink: 0 }}>
                    {/* タブUI */}
                    {onTabChange && (
                      <Tabs
                        value={activeTab}
                        onChange={(e, newValue) => onTabChange(newValue)}
                        centered
                        sx={{
                          flex: 1,
                          minHeight: 36,
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: 1,
                          '& .MuiTab-root': {
                            color: 'rgba(255, 255, 255, 0.7)',
                            minHeight: 36,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            flex: 1,
                            px: 1.5,
                            '&.Mui-selected': {
                              color: 'white',
                            },
                          },
                          '& .MuiTabs-flexContainer': {
                            justifyContent: 'center',
                          },
                          '& .MuiTabs-indicator': {
                            bgcolor: 'white',
                          },
                        }}
                      >
                        <Tab icon={<SearchIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="検索メニュー" />
                        <Tab icon={<LayersIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="レイヤー" />
                      </Tabs>
                    )}

                    {/* ピン留めボタン */}
                    <IconButton
                      onClick={onTogglePin}
                      size="small"
                      title={isPinned ? "固定解除" : "固定"}
                      sx={{
                        color: 'white',
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
                        flexShrink: 0,
                      }}
                    >
                      {isPinned ? <PushPinIcon /> : <PushPinOutlinedIcon />}
                    </IconButton>
                  </Box>

                </>
              ) : (
                // 折りたたみ時のアイコンのみ
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: !isMdUp ? 0 : 1,
                    pt: !isMdUp ? 1 : 2,
                    width: 60,
                  }}
                >
                  {/* モバイル時は検索アイコンのみ表示 */}
                  {!isMdUp ? (
                    <Tooltip title="検索条件" placement="right">
                      <IconButton
                        onClick={() => setIsSearchModalOpen(true)}
                        size="small"
                        sx={{
                          color: 'white',
                          bgcolor: 'rgba(255, 255, 255, 0.2)',
                          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
                        }}
                      >
                        <SearchIcon />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    /* デスクトップ時は全アイコン表示 */
                    <>
                      <Tooltip title="検索条件" placement="right">
                        <IconButton
                          onClick={() => setIsSearchModalOpen(true)}
                          size="small"
                          sx={{
                            color: 'white',
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
                            mb: 1,
                          }}
                        >
                          <SearchIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="レイヤー" placement="right">
                        <IconButton
                          size="small"
                          sx={{
                            color: 'white',
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
                            mb: 1,
                          }}
                        >
                          <LayersIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="クイックアクション" placement="right">
                        <IconButton
                          size="small"
                          sx={{
                            color: 'white',
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
                            mb: 1,
                          }}
                        >
                          <FilterListIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={isPinned ? "固定解除" : "固定"} placement="right">
                        <IconButton
                          onClick={onTogglePin}
                          size="small"
                          sx={{
                            color: 'white',
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
                          }}
                        >
                          {isPinned ? <PushPinIcon /> : <PushPinOutlinedIcon />}
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </Box>
              )}

              {/* 検索タブのコンテンツ */}
              {isExpanded && activeTab === 0 && advancedSearchFilters && (
                <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <AdvancedSearchTab
                    filters={advancedSearchFilters}
                    onFiltersChange={onAdvancedSearchFiltersChange}
                    aggregations={advancedSearchAggregations}
                    isLoading={isLoading}
                    onResetFilters={onResetAdvancedSearch}
                    geoFilter={geoFilter}
                    onOpenSearchModal={() => setIsSearchModalOpen(true)}
                    searchConditions={searchConditions}
                    summary={summary}
                    // 棒グラフ選択状態
                    selectedRentRanges={selectedRentRanges}
                    selectedAreaRanges={selectedAreaRanges}
                    selectedAgeRanges={selectedAgeRanges}
                    onRentRangeToggle={onRentRangeToggle}
                    onAreaRangeToggle={onAreaRangeToggle}
                    onAgeRangeToggle={onAgeRangeToggle}
                  />
                </Box>
              )}

              {/* レイヤタブのコンテンツ */}
              {isExpanded && activeTab === 1 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, overflow: 'auto' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, flexShrink: 0 }}>
                    レイヤ選択
                  </Typography>
                  {availableLayers.length === 0 ? (
                    <Box sx={{
                      p: 2,
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 1,
                      textAlign: 'center'
                    }}>
                      <Typography variant="body2" sx={{ opacity: 0.7 }}>
                        表示可能なレイヤーがありません
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.5, display: 'block', mt: 1 }}>
                        管理画面からレイヤーを追加してください
                      </Typography>
                    </Box>
                  ) : (
                    availableLayers.map(layer => (
                      <FormControlLabel
                        key={layer.id}
                        control={
                          <Checkbox
                            checked={selectedLayers.includes(layer.id)}
                            onChange={(e) => onLayerToggle(layer.id, e.target.checked)}
                            size="small"
                            sx={{
                              color: 'rgba(255, 255, 255, 0.7)',
                              '&.Mui-checked': {
                                color: layer.color || 'rgba(255, 255, 255, 0.9)',
                              },
                            }}
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
                                borderRadius: '4px',
                                bgcolor: layer.color || '#888',
                                opacity: layer.opacity || 0.5,
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                flexShrink: 0,
                                mt: 0.25,
                              }}
                            />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2 }}>
                                {layer.label}
                              </Typography>
                              <Typography variant="caption" sx={{ opacity: 0.7, lineHeight: 1.3, display: 'block' }}>
                                {layer.description}
                              </Typography>
                              {layer.attribution && (
                                <Tooltip title={layer.attribution} placement="bottom">
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      opacity: 0.5,
                                      lineHeight: 1.2,
                                      display: 'block',
                                      mt: 0.5,
                                      cursor: 'help',
                                      textDecoration: 'underline',
                                      textDecorationStyle: 'dotted',
                                    }}
                                  >
                                    出典情報あり
                                  </Typography>
                                </Tooltip>
                              )}
                            </Box>
                          </Box>
                        }
                        sx={{
                          alignItems: 'flex-start',
                          ml: 0,
                          p: 1,
                          borderRadius: 1,
                          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
                        }}
                      />
                    ))
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Fade>
      )}

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSearch={onSearch}
        currentConditions={searchConditions}
        isLoading={isLoading}
      />
    </>
  );
}
