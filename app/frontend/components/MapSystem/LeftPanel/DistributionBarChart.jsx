import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';

/**
 * 分布を表示するインタラクティブな棒グラフコンポーネント
 *
 * @param {Array} data - [{range: "0-50000", label: "〜5万", count: 23}, ...]
 * @param {Array} selectedRanges - 選択中の範囲 ['0-50000', '50000-100000']
 * @param {Function} onToggle - 範囲がクリックされた時のコールバック (range) => void
 * @param {boolean} disabled - 無効状態
 */
export default function DistributionBarChart({
  data = [],
  selectedRanges = [],
  onToggle,
  disabled = false,
}) {
  // 最大件数を計算（バーの幅計算用）
  const maxCount = useMemo(() => {
    if (!data || data.length === 0) return 1;
    return Math.max(...data.map(item => item.count || 0), 1);
  }, [data]);

  // 合計件数
  const totalCount = useMemo(() => {
    if (!data || data.length === 0) return 0;
    return data.reduce((sum, item) => sum + (item.count || 0), 0);
  }, [data]);

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 1.5 }}>
      {data.map((item) => {
        const isSelected = selectedRanges.includes(item.range);
        const isEmpty = item.count === 0;
        const widthPercent = (item.count / maxCount) * 100;

        return (
          <Box
            key={item.range}
            onClick={() => {
              if (!disabled && !isEmpty && onToggle) {
                onToggle(item.range);
              }
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              py: 0.4,
              px: 0.5,
              borderRadius: 0.5,
              cursor: isEmpty || disabled ? 'default' : 'pointer',
              opacity: isEmpty ? 0.4 : 1,
              bgcolor: isSelected ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              '&:hover': {
                bgcolor: isEmpty || disabled ? undefined : 'rgba(255, 255, 255, 0.1)',
              },
              transition: 'background-color 0.15s ease',
            }}
          >
            {/* バー部分 */}
            <Box
              sx={{
                width: 80,
                height: 16,
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 0.5,
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  width: `${widthPercent}%`,
                  height: '100%',
                  bgcolor: isSelected
                    ? 'rgba(255, 255, 255, 0.9)'
                    : 'rgba(255, 255, 255, 0.5)',
                  borderRadius: 0.5,
                  transition: 'width 0.3s ease, background-color 0.15s ease',
                }}
              />
            </Box>

            {/* ラベル */}
            <Typography
              variant="caption"
              sx={{
                flex: 1,
                fontSize: '0.7rem',
                color: isSelected ? 'white' : 'rgba(255, 255, 255, 0.8)',
                fontWeight: isSelected ? 600 : 400,
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </Typography>

            {/* 件数 */}
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.65rem',
                color: isSelected ? 'white' : 'rgba(255, 255, 255, 0.6)',
                fontWeight: isSelected ? 600 : 400,
                minWidth: 30,
                textAlign: 'right',
              }}
            >
              ({item.count})
            </Typography>
          </Box>
        );
      })}

      {/* 選択中の件数表示 */}
      {selectedRanges.length > 0 && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 0.5,
            fontSize: '0.65rem',
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'right',
          }}
        >
          選択中: {data.filter(d => selectedRanges.includes(d.range)).reduce((s, d) => s + d.count, 0)} / {totalCount}
        </Typography>
      )}
    </Box>
  );
}
