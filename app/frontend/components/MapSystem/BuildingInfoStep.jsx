import React from "react";
import DateField from '../shared/DateField';
import {
  Box,
  Typography,
  TextField,
  Grid,
  MenuItem,
  InputAdornment,
  IconButton,
  Tooltip,
  Alert,
} from "@mui/material";
import PlaceIcon from '@mui/icons-material/Place';

export default function BuildingInfoStep({
  data,
  onChange,
  disabled = false,
  onStartMapPick,
}) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange(prev => {
      const newData = { ...prev, [name]: value };
      // Clear coordinates when address changes manually
      if (name === 'address') {
        newData.latitude = null;
        newData.longitude = null;
      }
      return newData;
    });
  };

  if (disabled) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          既存の建物が選択されています。建物情報の編集はできません。
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        建物情報
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="建物名"
            name="name"
            value={data.name}
            onChange={handleChange}
            size="small"
            placeholder="例: サンシャインマンション渋谷"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="住所"
            name="address"
            value={data.address}
            onChange={handleChange}
            size="small"
            placeholder="例: 東京都渋谷区道玄坂1-2-3"
            helperText={
              data.latitude && data.longitude
                ? `座標: ${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`
                : "住所を入力してください"
            }
            InputProps={{
              endAdornment: onStartMapPick && (
                <InputAdornment position="end">
                  <Tooltip title="地図から選択">
                    <IconButton
                      onClick={onStartMapPick}
                      edge="end"
                      color="secondary"
                      size="small"
                    >
                      <PlaceIcon />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            select
            fullWidth
            label="物件種別"
            name="building_type"
            value={data.building_type}
            onChange={handleChange}
            size="small"
          >
            <MenuItem value="mansion">マンション</MenuItem>
            <MenuItem value="apartment">アパート</MenuItem>
            <MenuItem value="house">一戸建て</MenuItem>
            <MenuItem value="office">オフィス</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="構造"
            name="structure"
            value={data.structure}
            onChange={handleChange}
            size="small"
            placeholder="例: RC造、鉄骨造"
          />
        </Grid>

        <Grid item xs={6} sm={4}>
          <TextField
            fullWidth
            label="階数"
            name="floors"
            type="number"
            value={data.floors}
            onChange={handleChange}
            size="small"
            InputProps={{
              endAdornment: <Typography variant="body2" color="text.secondary">階</Typography>
            }}
          />
        </Grid>

        <Grid item xs={6} sm={4}>
          <TextField
            fullWidth
            label="総戸数"
            name="total_units"
            type="number"
            value={data.total_units}
            onChange={handleChange}
            size="small"
            InputProps={{
              endAdornment: <Typography variant="body2" color="text.secondary">戸</Typography>
            }}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <DateField
            fullWidth
            label="築年月"
            value={data.built_date || ''}
            onChange={(val) => onChange(prev => ({ ...prev, built_date: val }))}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
