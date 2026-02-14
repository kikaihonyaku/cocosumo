import React, { useState, useMemo } from 'react';
import {
  Autocomplete,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Chip,
  TextField,
  IconButton,
  Stack,
  Popper,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Train as TrainIcon,
} from '@mui/icons-material';

/**
 * 路線→駅カスケード選択コンポーネント
 * 建物の最寄り駅を複数登録するためのUI
 *
 * @param {Array} railwayData - useRailwayLines().railwayData
 * @param {Array} value - [{ station_id, walking_minutes }, ...]
 * @param {Function} onChange - (newValue) => void
 * @param {boolean} disabled
 */
export default function StationSelect({ railwayData = [], value = [], onChange, disabled = false }) {
  // 路線・駅のフラット化マップ
  const { lineMap, stationMap, allLines } = useMemo(() => {
    const lineMap = {};
    const stationMap = {};
    const allLines = [];

    railwayData.forEach(company => {
      company.lines.forEach(line => {
        const lineWithCompany = { ...line, company: company.company };
        lineMap[line.id] = lineWithCompany;
        allLines.push(lineWithCompany);
        line.stations.forEach(station => {
          stationMap[station.id] = { ...station, railway_line: lineWithCompany };
        });
      });
    });

    return { lineMap, stationMap, allLines };
  }, [railwayData]);

  const handleAddStation = () => {
    onChange([...value, { station_id: '', walking_minutes: '', _selectedLineId: '' }]);
  };

  const handleRemoveStation = (index) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  };

  const handleLineChange = (index, lineId) => {
    const newValue = [...value];
    newValue[index] = { ...newValue[index], _selectedLineId: lineId, station_id: '' };
    onChange(newValue);
  };

  const handleStationChange = (index, stationId) => {
    const newValue = [...value];
    newValue[index] = { ...newValue[index], station_id: stationId };
    onChange(newValue);
  };

  const handleWalkingMinutesChange = (index, minutes) => {
    const newValue = [...value];
    newValue[index] = { ...newValue[index], walking_minutes: minutes };
    onChange(newValue);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <TrainIcon color="action" fontSize="small" />
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.875rem' }}>
            最寄り駅
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleAddStation} disabled={disabled} color="primary">
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>

      {value.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
          「+」ボタンで最寄り駅を追加
        </Typography>
      )}

      <Stack spacing={1.5}>
        {value.map((entry, index) => {
          const selectedLineId = entry._selectedLineId || (entry.station_id ? stationMap[entry.station_id]?.railway_line?.id : '');
          const selectedLine = selectedLineId ? lineMap[selectedLineId] : null;
          const stationsForLine = selectedLine ? selectedLine.stations : [];
          const stationInfo = entry.station_id ? stationMap[entry.station_id] : null;

          return (
            <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              {/* 路線選択 */}
              <Autocomplete
                options={allLines}
                value={selectedLine || null}
                onChange={(_, newValue) => handleLineChange(index, newValue?.id || '')}
                groupBy={(option) => option.company}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderOption={(props, option) => {
                  const { key, ...rest } = props;
                  return (
                    <li key={key} {...rest}>
                      {option.color && (
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: option.color, flexShrink: 0, mr: 1 }} />
                      )}
                      <Typography variant="body2" noWrap>{option.name}</Typography>
                    </li>
                  );
                }}
                renderInput={(params) => <TextField {...params} label="路線" />}
                disabled={disabled}
                size="small"
                sx={{ minWidth: 160, flex: 1 }}
                slots={{ popper: ZoomCorrectedPopper }}
                slotProps={{ paper: { sx: { zoom: 'var(--body-zoom, 1)' } } }}
              />

              {/* 駅選択 */}
              <Autocomplete
                options={stationsForLine}
                value={stationsForLine.find(s => s.id === entry.station_id) || null}
                onChange={(_, newValue) => handleStationChange(index, newValue?.id || '')}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => <TextField {...params} label="駅" />}
                disabled={disabled || !selectedLineId}
                size="small"
                sx={{ minWidth: 120, flex: 1 }}
                slots={{ popper: ZoomCorrectedPopper }}
                slotProps={{ paper: { sx: { zoom: 'var(--body-zoom, 1)' } } }}
              />

              {/* 徒歩分数 */}
              <TextField
                size="small"
                type="number"
                label="徒歩"
                value={entry.walking_minutes || ''}
                onChange={(e) => handleWalkingMinutesChange(index, e.target.value ? parseInt(e.target.value) : '')}
                disabled={disabled}
                sx={{ width: 80, flexShrink: 0 }}
                slotProps={{ htmlInput: { min: 0, max: 99 } }}
                InputProps={{
                  endAdornment: <Typography variant="caption" color="text.secondary">分</Typography>
                }}
              />

              {/* 削除ボタン */}
              <IconButton size="small" onClick={() => handleRemoveStation(index)} disabled={disabled} color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

const ZoomCorrectedPopper = React.forwardRef(function ZoomCorrectedPopper({ style, ...props }, ref) {
  const zoomFactor = parseFloat(document.body.style.zoom) / 100 || 1;
  const correctedStyle = zoomFactor !== 1 ? {
    ...style,
    zoom: 1 / zoomFactor,
    width: style?.width != null ? style.width * zoomFactor : style?.width,
  } : style;

  return <Popper ref={ref} style={correctedStyle} {...props} />;
});

/**
 * 路線・駅マルチセレクトコンポーネント（検索フィルタ用）
 *
 * @param {Array} railwayData - useRailwayLines().railwayData
 * @param {Array} selectedLineIds - 選択中の路線ID配列
 * @param {Function} onLineChange - (lineIds) => void
 * @param {Array} selectedStationIds - 選択中の駅ID配列
 * @param {Function} onStationChange - (stationIds) => void
 * @param {number|string} maxWalkingMinutes - 最大徒歩分数
 * @param {Function} onMaxWalkingMinutesChange - (value) => void
 */
export function StationFilter({
  railwayData = [],
  selectedLineIds = [],
  onLineChange,
  selectedStationIds = [],
  onStationChange,
  maxWalkingMinutes = '',
  onMaxWalkingMinutesChange,
}) {
  const { allLines, stationsForSelectedLines, selectedLineObjects, selectedStationObjects } = useMemo(() => {
    const allLines = railwayData.flatMap(company =>
      company.lines.map(l => ({ ...l, company: company.company }))
    );
    const filteredLines = selectedLineIds.length > 0
      ? allLines.filter(l => selectedLineIds.includes(l.id))
      : allLines;
    const stationsForSelectedLines = filteredLines.flatMap(l =>
      l.stations.map(s => ({ ...s, railway_line_name: l.name, railway_line_color: l.color }))
    );
    const selectedLineObjects = allLines.filter(l => selectedLineIds.includes(l.id));
    const selectedStationObjects = stationsForSelectedLines.filter(s => selectedStationIds.includes(s.id));
    return { allLines, stationsForSelectedLines, selectedLineObjects, selectedStationObjects };
  }, [railwayData, selectedLineIds, selectedStationIds]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* 路線マルチセレクト */}
      <Autocomplete
        multiple
        disableCloseOnSelect
        options={allLines}
        value={selectedLineObjects}
        onChange={(_, newValue) => onLineChange(newValue.map(l => l.id))}
        groupBy={(option) => option.company}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderOption={(props, option, { selected }) => {
          const { key, ...rest } = props;
          return (
            <li key={key} {...rest}>
              <Checkbox checked={selected} sx={{ mr: 1 }} />
              {option.color && (
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: option.color, flexShrink: 0, mr: 1 }} />
              )}
              <Typography variant="body2">{option.name}</Typography>
            </li>
          );
        }}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => {
            const { key, ...rest } = getTagProps({ index });
            return (
              <Chip
                key={key}
                label={option.name}
                size="small"
                sx={option.color ? { borderLeft: `3px solid ${option.color}` } : undefined}
                {...rest}
              />
            );
          })
        }
        renderInput={(params) => <TextField {...params} label="路線" size="small" />}
        slots={{ popper: ZoomCorrectedPopper }}
        slotProps={{
          popper: { sx: { zIndex: 1500 } },
          paper: { sx: { zoom: 'var(--body-zoom, 1)' } },
        }}
      />

      {/* 駅マルチセレクト */}
      <Autocomplete
        multiple
        disableCloseOnSelect
        options={stationsForSelectedLines}
        value={selectedStationObjects}
        onChange={(_, newValue) => onStationChange(newValue.map(s => s.id))}
        groupBy={(option) => option.railway_line_name}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderOption={(props, option, { selected }) => {
          const { key, ...rest } = props;
          return (
            <li key={key} {...rest}>
              <Checkbox checked={selected} sx={{ mr: 1 }} />
              <Typography variant="body2">{option.name}</Typography>
            </li>
          );
        }}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => {
            const { key, ...rest } = getTagProps({ index });
            return (
              <Chip key={key} label={option.name} size="small" {...rest} />
            );
          })
        }
        renderInput={(params) => <TextField {...params} label="駅" size="small" />}
        slots={{ popper: ZoomCorrectedPopper }}
        slotProps={{
          popper: { sx: { zIndex: 1500 } },
          paper: { sx: { zoom: 'var(--body-zoom, 1)' } },
        }}
      />

      {/* 最大徒歩分数 */}
      <TextField
        fullWidth
        size="small"
        type="number"
        label="最大徒歩分数"
        value={maxWalkingMinutes}
        onChange={(e) => onMaxWalkingMinutesChange(e.target.value)}
        slotProps={{ htmlInput: { min: 1, max: 60 } }}
        placeholder="例: 10"
      />
    </Box>
  );
}
