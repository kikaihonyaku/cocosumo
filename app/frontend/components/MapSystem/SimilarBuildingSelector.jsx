import React from "react";
import {
  Box,
  Typography,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import AddIcon from '@mui/icons-material/Add';

export default function SimilarBuildingSelector({
  buildings,
  selected,
  onSelect,
  loading,
}) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{ ml: 1 }}>
          類似建物を検索中...
        </Typography>
      </Box>
    );
  }

  if (!buildings || buildings.length === 0) {
    return null;
  }

  const handleChange = (event) => {
    const value = event.target.value;
    if (value === 'new') {
      onSelect(null);
    } else {
      const building = buildings.find(b => b.id.toString() === value);
      onSelect(building);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 50) return 'warning';
    return 'default';
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Alert severity="info" sx={{ mb: 2 }}>
        類似する建物が見つかりました。既存の建物に部屋を追加するか、新規建物として登録するかを選択してください。
      </Alert>

      <RadioGroup
        value={selected ? selected.id.toString() : 'new'}
        onChange={handleChange}
      >
        {/* Existing buildings */}
        {buildings.map((building) => (
          <Paper
            key={building.id}
            sx={{
              p: 2,
              mb: 1,
              border: 2,
              borderColor: selected?.id === building.id ? 'primary.main' : 'grey.200',
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: 'primary.light',
                bgcolor: 'grey.50',
              },
            }}
            onClick={() => onSelect(building)}
          >
            <FormControlLabel
              value={building.id.toString()}
              control={<Radio />}
              label={
                <Box sx={{ ml: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <HomeWorkIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {building.name}
                    </Typography>
                    <Chip
                      label={`マッチ度 ${building.score}%`}
                      size="small"
                      color={getScoreColor(building.score)}
                    />
                    {building.score >= 80 && (
                      <Chip label="推奨" size="small" color="primary" />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {building.address}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      部屋数: {building.room_cnt}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      空室: {building.free_cnt}
                    </Typography>
                  </Box>
                  {building.reasons && building.reasons.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                      {building.reasons.map((reason, i) => (
                        <Chip
                          key={i}
                          label={reason}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              }
              sx={{ m: 0, width: '100%', alignItems: 'flex-start' }}
            />
          </Paper>
        ))}

        {/* New building option */}
        <Paper
          sx={{
            p: 2,
            border: 2,
            borderColor: !selected ? 'secondary.main' : 'grey.200',
            borderRadius: 2,
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'secondary.light',
              bgcolor: 'grey.50',
            },
          }}
          onClick={() => onSelect(null)}
        >
          <FormControlLabel
            value="new"
            control={<Radio />}
            label={
              <Box sx={{ ml: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AddIcon color="secondary" />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  新規建物として登録
                </Typography>
              </Box>
            }
            sx={{ m: 0 }}
          />
        </Paper>
      </RadioGroup>
    </Box>
  );
}
