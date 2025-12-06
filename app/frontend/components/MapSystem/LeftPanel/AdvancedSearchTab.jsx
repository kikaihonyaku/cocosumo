import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Slider,
  Chip,
  Button,
  Paper,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Clear as ClearIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import DistributionBarChart from './DistributionBarChart';

// 間取りタイプ定義
const ROOM_TYPES = [
  { value: 'studio', label: 'ワンルーム' },
  { value: '1K', label: '1K' },
  { value: '1DK', label: '1DK' },
  { value: '1LDK', label: '1LDK' },
  { value: '2K', label: '2K' },
  { value: '2DK', label: '2DK' },
  { value: '2LDK', label: '2LDK' },
  { value: '3K', label: '3K' },
  { value: '3DK', label: '3DK' },
  { value: '3LDK', label: '3LDK' },
  { value: 'other', label: 'その他' },
];

// スライダーのマーク（賃料）
const RENT_MARKS = [
  { value: 0, label: '0' },
  { value: 100000, label: '10万' },
  { value: 200000, label: '20万' },
  { value: 300000, label: '30万+' },
];

// 賃料の最大値（この値を選択したら「以上」として扱う）
const RENT_MAX = 300000;

// スライダーのマーク（面積）
const AREA_MARKS = [
  { value: 0, label: '0' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
  { value: 150, label: '150' },
  { value: 200, label: '200' },
];

// スライダーのマーク（築年数）
const AGE_MARKS = [
  { value: 0, label: '新築' },
  { value: 10, label: '10年' },
  { value: 20, label: '20年' },
  { value: 30, label: '30年' },
  { value: 40, label: '40年+' },
];

// 築年数の最大値（この値を選択したら「以上」として扱う）
const AGE_MAX = 40;

export default function AdvancedSearchTab({
  filters,
  onFiltersChange,
  aggregations,
  isLoading = false,
  onResetFilters,
  geoFilter,
  onOpenSearchModal,
  searchConditions = {},
  summary = null,
  // 棒グラフ選択状態
  selectedRentRanges = [],
  selectedAreaRanges = [],
  selectedAgeRanges = [],
  onRentRangeToggle,
  onAreaRangeToggle,
  onAgeRangeToggle,
}) {
  // ローカルステートでスライダー値を管理（ドラッグ中のパフォーマンス向上のため）
  const [localRentRange, setLocalRentRange] = useState(filters.rentRange);
  const [localAreaRange, setLocalAreaRange] = useState(filters.areaRange);
  const [localAgeRange, setLocalAgeRange] = useState(filters.ageRange);

  // 親のフィルター変更時にローカルステートを同期
  useEffect(() => {
    setLocalRentRange(filters.rentRange);
    setLocalAreaRange(filters.areaRange);
    setLocalAgeRange(filters.ageRange);
  }, [filters]);

  // 間取りチップの選択（フロントエンドフィルタにより即座に反映）
  const handleRoomTypeToggle = useCallback((roomType) => {
    const currentTypes = filters.roomTypes || [];
    const newTypes = currentTypes.includes(roomType)
      ? currentTypes.filter(t => t !== roomType)
      : [...currentTypes, roomType];
    const newFilters = { ...filters, roomTypes: newTypes };
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  // スライダー変更完了時にフィルター更新（フロントエンドフィルタにより即座に反映）
  const handleRentChangeCommitted = useCallback((event, newValue) => {
    const newFilters = { ...filters, rentRange: newValue };
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  const handleAreaChangeCommitted = useCallback((event, newValue) => {
    const newFilters = { ...filters, areaRange: newValue };
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  const handleAgeChangeCommitted = useCallback((event, newValue) => {
    const newFilters = { ...filters, ageRange: newValue };
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  // 賃料のフォーマット
  const formatRent = (value, isMax = false) => {
    if (value >= RENT_MAX && isMax) {
      return `${(value / 10000).toFixed(0)}万円+`;
    }
    if (value >= 10000) {
      return `${(value / 10000).toFixed(0)}万円`;
    }
    return `${value}円`;
  };

  // 間取りごとの件数を取得
  const getRoomTypeCount = useMemo(() => {
    return (roomType) => {
      if (!aggregations || !aggregations.by_room_type) return 0;
      return aggregations.by_room_type[roomType] || 0;
    };
  }, [aggregations]);

  // 範囲情報の表示
  const getGeoFilterInfo = useMemo(() => {
    if (!geoFilter || !geoFilter.type) return null;

    if (geoFilter.type === 'circle' && geoFilter.circle) {
      const radius = geoFilter.circle.radius;
      if (radius >= 1000) {
        return `円範囲: 半径 ${(radius / 1000).toFixed(2)} km`;
      }
      return `円範囲: 半径 ${radius.toFixed(0)} m`;
    }

    if (geoFilter.type === 'polygon') {
      return 'ポリゴン範囲で検索中';
    }

    return null;
  }, [geoFilter]);

  // 検索条件をChip形式で表示するためのヘルパー
  const getConditionChips = useMemo(() => {
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
    return chips;
  }, [searchConditions]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* スクロール可能なコンテンツエリア */}
      <Box sx={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        pb: 1,
        pr: 1,
        // カスタムスクロールバー（パネルになじむデザイン）
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: '3px',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.5)',
          },
        },
      }}>
      {/* 検索条件ボタン */}
      {onOpenSearchModal && (
        <Box>
          <Button
            variant="contained"
            startIcon={<FilterListIcon />}
            onClick={onOpenSearchModal}
            fullWidth
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
            }}
          >
            検索条件を設定
          </Button>
          {/* 現在の検索条件表示 */}
          {getConditionChips.length > 0 && (
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {getConditionChips.map((chip) => (
                <Chip
                  key={chip.key}
                  label={chip.label}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                    color: 'white',
                    fontSize: '0.65rem',
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* サマリー表示（2x2グリッド） */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} sx={{ color: 'white' }} />
        </Box>
      ) : (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 1,
        }}>
          <Box sx={{
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 1,
            p: 1.5,
            textAlign: 'center',
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {summary?.buildingCount?.toLocaleString() || 0}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              物件数
            </Typography>
          </Box>
          <Box sx={{
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 1,
            p: 1.5,
            textAlign: 'center',
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {summary?.roomCount?.toLocaleString() || 0}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              部屋数
            </Typography>
          </Box>
          <Box sx={{
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 1,
            p: 1.5,
            textAlign: 'center',
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {summary?.avgRent ? `${Math.round(summary.avgRent / 10000)}万` : '-'}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              平均賃料
            </Typography>
          </Box>
          <Box sx={{
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 1,
            p: 1.5,
            textAlign: 'center',
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {summary?.avgAge ? `${Math.round(summary.avgAge)}年` : '-'}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              平均築年数
            </Typography>
          </Box>
        </Box>
      )}
      {getGeoFilterInfo && (
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', opacity: 0.8 }}>
          {getGeoFilterInfo}
        </Typography>
      )}

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />

      {/* 賃料スライダー */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          賃料
        </Typography>
        {/* 賃料分布棒グラフ */}
        {aggregations?.by_rent && (
          <DistributionBarChart
            data={aggregations.by_rent}
            selectedRanges={selectedRentRanges}
            onToggle={onRentRangeToggle}
            disabled={isLoading}
          />
        )}
        <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 1 }}>
          {formatRent(localRentRange[0])} 〜 {formatRent(localRentRange[1], true)}
        </Typography>
        <Box sx={{ pl: 1.5, pr: 1 }}>
          <Slider
            value={localRentRange}
            onChange={(e, value) => setLocalRentRange(value)}
            onChangeCommitted={handleRentChangeCommitted}
            min={0}
            max={RENT_MAX}
            step={10000}
            marks={RENT_MARKS}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => formatRent(v, v === RENT_MAX)}
            sx={{
              color: 'white',
              '& .MuiSlider-markLabel': {
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.65rem',
              },
              '& .MuiSlider-thumb': {
                bgcolor: 'white',
              },
              '& .MuiSlider-track': {
                bgcolor: 'rgba(255, 255, 255, 0.8)',
              },
              '& .MuiSlider-rail': {
                bgcolor: 'rgba(255, 255, 255, 0.3)',
              },
            }}
          />
        </Box>
      </Box>

      {/* 間取りチップ */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          間取り
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {ROOM_TYPES.map((type) => {
            const count = getRoomTypeCount(type.value);
            const isSelected = (filters.roomTypes || []).includes(type.value);
            return (
              <Chip
                key={type.value}
                label={`${type.label} (${count})`}
                size="small"
                onClick={() => handleRoomTypeToggle(type.value)}
                sx={{
                  bgcolor: isSelected ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: isSelected ? '2px solid white' : '1px solid rgba(255, 255, 255, 0.3)',
                  fontSize: '0.7rem',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                  },
                }}
              />
            );
          })}
        </Box>
      </Box>

      {/* 面積スライダー */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          面積
        </Typography>
        {/* 面積分布棒グラフ */}
        {aggregations?.by_area && (
          <DistributionBarChart
            data={aggregations.by_area}
            selectedRanges={selectedAreaRanges}
            onToggle={onAreaRangeToggle}
            disabled={isLoading}
          />
        )}
        <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 1 }}>
          {localAreaRange[0]}㎡ 〜 {localAreaRange[1]}㎡
        </Typography>
        <Box sx={{ pl: 1.5, pr: 1 }}>
          <Slider
            value={localAreaRange}
            onChange={(e, value) => setLocalAreaRange(value)}
            onChangeCommitted={handleAreaChangeCommitted}
            min={0}
            max={200}
            step={5}
            marks={AREA_MARKS}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `${v}㎡`}
            sx={{
              color: 'white',
              '& .MuiSlider-markLabel': {
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.65rem',
              },
              '& .MuiSlider-thumb': {
                bgcolor: 'white',
              },
              '& .MuiSlider-track': {
                bgcolor: 'rgba(255, 255, 255, 0.8)',
              },
              '& .MuiSlider-rail': {
                bgcolor: 'rgba(255, 255, 255, 0.3)',
              },
            }}
          />
        </Box>
      </Box>

      {/* 築年数スライダー */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          築年数
        </Typography>
        {/* 築年数分布棒グラフ */}
        {aggregations?.by_building_age && (
          <DistributionBarChart
            data={aggregations.by_building_age}
            selectedRanges={selectedAgeRanges}
            onToggle={onAgeRangeToggle}
            disabled={isLoading}
          />
        )}
        <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 1 }}>
          {localAgeRange[0] === 0 ? '新築' : `築${localAgeRange[0]}年`} 〜 {localAgeRange[1] >= AGE_MAX ? `築${localAgeRange[1]}年+` : `築${localAgeRange[1]}年`}
        </Typography>
        <Box sx={{ pl: 1.5, pr: 1 }}>
          <Slider
            value={localAgeRange}
            onChange={(e, value) => setLocalAgeRange(value)}
            onChangeCommitted={handleAgeChangeCommitted}
            min={0}
            max={AGE_MAX}
            step={1}
            marks={AGE_MARKS}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => v === 0 ? '新築' : (v >= AGE_MAX ? `${v}年+` : `${v}年`)}
            sx={{
              color: 'white',
              '& .MuiSlider-markLabel': {
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.65rem',
              },
              '& .MuiSlider-thumb': {
                bgcolor: 'white',
              },
              '& .MuiSlider-track': {
                bgcolor: 'rgba(255, 255, 255, 0.8)',
              },
              '& .MuiSlider-rail': {
                bgcolor: 'rgba(255, 255, 255, 0.3)',
              },
            }}
          />
        </Box>
      </Box>
      </Box>

      {/* 固定ボタンエリア */}
      <Box sx={{
        flexShrink: 0,
        pt: 1.5,
        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
      }}>
        <Button
          variant="outlined"
          startIcon={<ClearIcon />}
          onClick={onResetFilters}
          disabled={isLoading}
          fullWidth
          sx={{
            color: 'white',
            borderColor: 'rgba(255, 255, 255, 0.5)',
            '&:hover': {
              borderColor: 'white',
              bgcolor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          条件をリセット
        </Button>
      </Box>
    </Box>
  );
}
