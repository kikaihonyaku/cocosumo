import React, { useState, useEffect } from 'react';
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Button,
  IconButton,
  FormControlLabel,
  Checkbox,
  Chip,
  Paper,
  Tooltip,
  Fade,
  useMediaQuery,
  CircularProgress,
  Fab,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Layers as LayersIcon,
  FilterList as FilterListIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import SearchModal from './SearchModal';
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
  error = null,
  forceClose = false
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

  // 検索条件をChip形式で取得
  const getConditionChips = () => {
    const chips = [];

    if (searchConditions.propertyName) {
      chips.push({ key: 'propertyName', label: `物件名: ${searchConditions.propertyName}` });
    }
    if (searchConditions.address) {
      chips.push({ key: 'address', label: `住所: ${searchConditions.address}` });
    }
    if (searchConditions.buildingType) {
      const typeMap = {
        mansion: 'マンション',
        apartment: 'アパート',
        house: '一戸建て',
        office: 'オフィス',
        store: '店舗',
        other: 'その他'
      };
      chips.push({ key: 'buildingType', label: `種別: ${typeMap[searchConditions.buildingType]}` });
    }
    if (searchConditions.hasVacancy === 'true') {
      chips.push({ key: 'hasVacancy', label: '空室あり' });
    } else if (searchConditions.hasVacancy === 'false') {
      chips.push({ key: 'hasVacancy', label: '満室' });
    }
    if (searchConditions.minRooms || searchConditions.maxRooms) {
      const min = searchConditions.minRooms || '制限なし';
      const max = searchConditions.maxRooms || '制限なし';
      chips.push({ key: 'rooms', label: `戸数: ${min}〜${max}戸` });
    }
    if (searchConditions.maxVacancyRate) {
      chips.push({ key: 'maxVacancyRate', label: `空室率: ${searchConditions.maxVacancyRate}%以下` });
    }

    return chips;
  };

  const handleChipDelete = (chipKey) => {
    const newConditions = { ...searchConditions };

    switch (chipKey) {
      case 'propertyName':
        delete newConditions.propertyName;
        break;
      case 'address':
        delete newConditions.address;
        break;
      case 'buildingType':
        delete newConditions.buildingType;
        break;
      case 'hasVacancy':
        delete newConditions.hasVacancy;
        break;
      case 'rooms':
        delete newConditions.minRooms;
        delete newConditions.maxRooms;
        break;
      case 'maxVacancyRate':
        delete newConditions.maxVacancyRate;
        break;
    }

    onSearch(newConditions);
  };

  const conditionChips = getConditionChips();

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
              width: isPinned ? 320 : (isHovered ? 320 : 60),
              boxSizing: 'border-box',
              bgcolor: 'primary.main',
              color: 'white',
              overflow: isPinned || isHovered ? 'auto' : 'visible',
              transition: 'width 0.3s ease, left 0.3s ease, top 0.3s ease',
              position: 'absolute',
              top: isPinned || isHovered ? '2px' : '80px',
              left: isPinned ? '2px' : (isHovered ? 0 : '16px'),
              height: isPinned ? '100vh' : (isHovered ? '100vh' : '220px'),
              zIndex: isPinned ? 1100 : (isHovered ? 1350 : 1300),
              flexShrink: isPinned ? 0 : undefined,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box
              sx={{
                width: isPinned || isHovered ? 320 : 60,
                height: '100%',
                p: isExpanded ? 2 : (!isMdUp ? 1 : 0),
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
                  {/* 検索セクション */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<SearchIcon />}
                      onClick={() => setIsSearchModalOpen(true)}
                      sx={{
                        flex: 1,
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
                      }}
                    >
                      検索条件
                    </Button>
                    <IconButton
                      onClick={onTogglePin}
                      size="small"
                      title={isPinned ? "固定解除" : "固定"}
                      sx={{
                        color: 'white',
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
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

              {isExpanded && (
                <>
                  {/* 現在の検索条件 */}
                  <Accordion
                    expanded={expanded.conditions}
                    onChange={handleAccordionChange('conditions')}
                    disableGutters
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        現在の検索条件
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {/* ローディング状態表示 */}
                        {isLoading && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                            <CircularProgress size={16} sx={{ color: 'white' }} />
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                              検索中...
                            </Typography>
                          </Box>
                        )}

                        {/* エラー状態表示 */}
                        {error && (
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            py: 1,
                            px: 2,
                            bgcolor: 'rgba(244, 67, 54, 0.1)',
                            borderRadius: 1,
                            border: '1px solid rgba(244, 67, 54, 0.3)'
                          }}>
                            <WarningIcon size={16} sx={{ color: '#f44336' }} />
                            <Typography variant="body2" sx={{ color: '#f44336', fontSize: '0.75rem' }}>
                              {error}
                            </Typography>
                          </Box>
                        )}

                        {conditionChips.length > 0 ? (
                          <>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {conditionChips.map((chip) => (
                                <Chip
                                  key={chip.key}
                                  label={chip.label}
                                  size="small"
                                  onDelete={() => handleChipDelete(chip.key)}
                                  deleteIcon={<ClearIcon sx={{ color: 'white !important' }} />}
                                  sx={{
                                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    '& .MuiChip-deleteIcon': { color: 'white' },
                                  }}
                                />
                              ))}
                            </Box>
                            <Button
                              size="small"
                              startIcon={<ClearIcon />}
                              onClick={() => onSearch({})}
                              sx={{
                                alignSelf: 'flex-start',
                                bgcolor: 'rgba(244, 67, 54, 0.8)',
                                color: 'white',
                                '&:hover': { bgcolor: 'rgba(244, 67, 54, 1)' },
                                mt: 1,
                              }}
                            >
                              条件をクリア
                            </Button>
                          </>
                        ) : !isLoading && !error && (
                          <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            条件なし
                          </Typography>
                        )}
                      </Box>
                    </AccordionDetails>
                  </Accordion>

                  {/* レイヤー選択 */}
                  <Accordion
                    expanded={expanded.layers}
                    onChange={handleAccordionChange('layers')}
                    disableGutters
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        レイヤー選択
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {availableLayers.map(layer => (
                          <FormControlLabel
                            key={layer.id}
                            control={
                              <Checkbox
                                checked={selectedLayers.includes(layer.id)}
                                onChange={(e) => onLayerToggle(layer.id, e.target.checked)}
                                size="small"
                                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2 }}>
                                  {layer.label}
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.7, lineHeight: 1.3 }}>
                                  {layer.description}
                                </Typography>
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
                        ))}
                      </Box>
                    </AccordionDetails>
                  </Accordion>

                  {/* クイックアクション */}
                  <Accordion
                    expanded={expanded.quickActions}
                    onChange={handleAccordionChange('quickActions')}
                    disableGutters
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        クイックアクション
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Button
                          size="small"
                          onClick={() => onSearch({ hasVacancy: 'true' })}
                          sx={{
                            justifyContent: 'flex-start',
                            bgcolor: 'rgba(255, 255, 255, 0.15)',
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' },
                          }}
                        >
                          空室あり物件
                        </Button>
                        <Button
                          size="small"
                          onClick={() => onSearch({ buildingType: 'mansion' })}
                          sx={{
                            justifyContent: 'flex-start',
                            bgcolor: 'rgba(255, 255, 255, 0.15)',
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' },
                          }}
                        >
                          マンションのみ
                        </Button>
                        <Button
                          size="small"
                          onClick={() => onSearch({ minRooms: '20' })}
                          sx={{
                            justifyContent: 'flex-start',
                            bgcolor: 'rgba(255, 255, 255, 0.15)',
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' },
                          }}
                        >
                          20戸以上
                        </Button>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </>
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
