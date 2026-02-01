import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Chip,
  TextField,
  IconButton,
  Stack,
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
        lineMap[line.id] = line;
        allLines.push(line);
        line.stations.forEach(station => {
          stationMap[station.id] = { ...station, railway_line: line };
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
              <FormControl size="small" sx={{ minWidth: 160, flex: 1 }}>
                <InputLabel>路線</InputLabel>
                <Select
                  value={selectedLineId || ''}
                  label="路線"
                  onChange={(e) => handleLineChange(index, e.target.value)}
                  disabled={disabled}
                >
                  {allLines.map(line => (
                    <MenuItem key={line.id} value={line.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {line.color && (
                          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: line.color, flexShrink: 0 }} />
                        )}
                        <Typography variant="body2" noWrap>{line.name}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* 駅選択 */}
              <FormControl size="small" sx={{ minWidth: 120, flex: 1 }}>
                <InputLabel>駅</InputLabel>
                <Select
                  value={entry.station_id || ''}
                  label="駅"
                  onChange={(e) => handleStationChange(index, e.target.value)}
                  disabled={disabled || !selectedLineId}
                >
                  {stationsForLine.map(station => (
                    <MenuItem key={station.id} value={station.id}>
                      {station.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* 徒歩分数 */}
              <TextField
                size="small"
                type="number"
                label="徒歩"
                value={entry.walking_minutes || ''}
                onChange={(e) => handleWalkingMinutesChange(index, e.target.value ? parseInt(e.target.value) : '')}
                disabled={disabled}
                sx={{ width: 80 }}
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
  const { allLines, stationsForSelectedLines } = useMemo(() => {
    const allLines = railwayData.flatMap(company => company.lines);
    const stationsForSelectedLines = selectedLineIds.length > 0
      ? allLines.filter(l => selectedLineIds.includes(l.id)).flatMap(l => l.stations.map(s => ({ ...s, railway_line_name: l.name, railway_line_color: l.color })))
      : allLines.flatMap(l => l.stations.map(s => ({ ...s, railway_line_name: l.name, railway_line_color: l.color })));
    return { allLines, stationsForSelectedLines };
  }, [railwayData, selectedLineIds]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* 路線マルチセレクト */}
      <FormControl fullWidth size="small">
        <InputLabel>路線</InputLabel>
        <Select
          multiple
          value={selectedLineIds}
          onChange={(e) => onLineChange(e.target.value)}
          input={<OutlinedInput label="路線" />}
          renderValue={(selected) =>
            selected.map(id => allLines.find(l => l.id === id)?.name).filter(Boolean).join(', ')
          }
          MenuProps={{ sx: { zIndex: 1500 } }}
        >
          {railwayData.map(company => [
            <MenuItem key={`company-${company.company_code}`} disabled sx={{ opacity: '1 !important' }}>
              <Typography variant="caption" color="primary" fontWeight={600}>
                {company.company}
              </Typography>
            </MenuItem>,
            ...company.lines.map(line => (
              <MenuItem key={line.id} value={line.id}>
                <Checkbox checked={selectedLineIds.includes(line.id)} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {line.color && (
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: line.color, flexShrink: 0 }} />
                  )}
                  <ListItemText primary={line.name} />
                </Box>
              </MenuItem>
            ))
          ]).flat()}
        </Select>
      </FormControl>

      {/* 駅マルチセレクト */}
      <FormControl fullWidth size="small">
        <InputLabel>駅</InputLabel>
        <Select
          multiple
          value={selectedStationIds}
          onChange={(e) => onStationChange(e.target.value)}
          input={<OutlinedInput label="駅" />}
          renderValue={(selected) =>
            selected.map(id => stationsForSelectedLines.find(s => s.id === id)?.name).filter(Boolean).join(', ')
          }
          MenuProps={{ sx: { zIndex: 1500, maxHeight: 400 } }}
        >
          {stationsForSelectedLines.map(station => (
            <MenuItem key={station.id} value={station.id}>
              <Checkbox checked={selectedStationIds.includes(station.id)} />
              <ListItemText
                primary={station.name}
                secondary={station.railway_line_name}
              />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

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
