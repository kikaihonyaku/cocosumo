import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Grid,
  MenuItem,
  Chip,
  FormControlLabel,
  Checkbox,
  Divider,
  Autocomplete,
} from "@mui/material";

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

const DIRECTIONS = ['南', '南東', '東', '北東', '北', '北西', '西', '南西'];

export default function RoomInfoStep({
  data,
  onChange,
  facilityCodes,
  normalizedFacilities,
  unmatchedFacilities,
  onFacilityCodesChange,
}) {
  const [facilitiesMaster, setFacilitiesMaster] = useState([]);

  // Fetch facilities master
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const response = await fetch('/api/v1/facilities', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          // APIはカテゴリごとにグループ化されたオブジェクトを返すので、フラットな配列に変換
          const flatList = [];
          Object.values(data).forEach(categoryItems => {
            if (Array.isArray(categoryItems)) {
              flatList.push(...categoryItems);
            }
          });
          setFacilitiesMaster(flatList);
        }
      } catch (err) {
        console.error('Failed to fetch facilities:', err);
      }
    };
    fetchFacilities();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    onChange(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFacilityChange = (event, newValue) => {
    const codes = newValue.map(f => f.code);
    onFacilityCodesChange(codes);
  };

  // Get selected facilities from master
  const selectedFacilities = Array.isArray(facilitiesMaster)
    ? facilitiesMaster.filter(f => facilityCodes.includes(f.code))
    : [];

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        部屋情報
      </Typography>

      <Grid container spacing={2}>
        {/* Basic Info */}
        <Grid item xs={6} sm={4}>
          <TextField
            fullWidth
            label="部屋番号"
            name="room_number"
            value={data.room_number}
            onChange={handleChange}
            size="small"
            placeholder="例: 301"
          />
        </Grid>

        <Grid item xs={6} sm={4}>
          <TextField
            select
            fullWidth
            label="間取り"
            name="room_type"
            value={data.room_type}
            onChange={handleChange}
            size="small"
          >
            {ROOM_TYPES.map(type => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={6} sm={4}>
          <TextField
            fullWidth
            label="階数"
            name="floor"
            type="number"
            value={data.floor}
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
            label="専有面積"
            name="area"
            type="number"
            value={data.area}
            onChange={handleChange}
            size="small"
            inputProps={{ step: 0.01 }}
            InputProps={{
              endAdornment: <Typography variant="body2" color="text.secondary">m²</Typography>
            }}
          />
        </Grid>

        <Grid item xs={6} sm={4}>
          <TextField
            select
            fullWidth
            label="向き"
            name="direction"
            value={data.direction}
            onChange={handleChange}
            size="small"
          >
            <MenuItem value="">-</MenuItem>
            {DIRECTIONS.map(d => (
              <MenuItem key={d} value={d}>{d}</MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Pricing */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
        賃料・費用
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={6} sm={4}>
          <TextField
            fullWidth
            label="賃料"
            name="rent"
            type="number"
            value={data.rent}
            onChange={handleChange}
            size="small"
            InputProps={{
              endAdornment: <Typography variant="body2" color="text.secondary">円</Typography>
            }}
          />
        </Grid>

        <Grid item xs={6} sm={4}>
          <TextField
            fullWidth
            label="管理費"
            name="management_fee"
            type="number"
            value={data.management_fee}
            onChange={handleChange}
            size="small"
            InputProps={{
              endAdornment: <Typography variant="body2" color="text.secondary">円</Typography>
            }}
          />
        </Grid>

        <Grid item xs={6} sm={4}>
          <TextField
            fullWidth
            label="敷金"
            name="deposit"
            type="number"
            value={data.deposit}
            onChange={handleChange}
            size="small"
            InputProps={{
              endAdornment: <Typography variant="body2" color="text.secondary">円</Typography>
            }}
          />
        </Grid>

        <Grid item xs={6} sm={4}>
          <TextField
            fullWidth
            label="礼金"
            name="key_money"
            type="number"
            value={data.key_money}
            onChange={handleChange}
            size="small"
            InputProps={{
              endAdornment: <Typography variant="body2" color="text.secondary">円</Typography>
            }}
          />
        </Grid>

        <Grid item xs={6} sm={4}>
          <TextField
            fullWidth
            label="駐車場料金"
            name="parking_fee"
            type="number"
            value={data.parking_fee}
            onChange={handleChange}
            size="small"
            InputProps={{
              endAdornment: <Typography variant="body2" color="text.secondary">円</Typography>
            }}
          />
        </Grid>

        <Grid item xs={6} sm={4}>
          <TextField
            fullWidth
            label="入居可能日"
            name="available_date"
            type="date"
            value={data.available_date}
            onChange={handleChange}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Conditions */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
        入居条件
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={data.pets_allowed}
              onChange={handleChange}
              name="pets_allowed"
            />
          }
          label="ペット可"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={data.two_person_allowed}
              onChange={handleChange}
              name="two_person_allowed"
            />
          }
          label="二人入居可"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={data.guarantor_required}
              onChange={handleChange}
              name="guarantor_required"
            />
          }
          label="保証人必要"
        />
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Facilities */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
        設備
      </Typography>

      {facilitiesMaster.length > 0 && (
        <Autocomplete
          multiple
          options={facilitiesMaster}
          getOptionLabel={(option) => option.name}
          value={selectedFacilities}
          onChange={handleFacilityChange}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              placeholder="設備を選択"
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                label={option.name}
                size="small"
                color="primary"
                variant="outlined"
                {...getTagProps({ index })}
                key={option.code}
              />
            ))
          }
          sx={{ mb: 2 }}
        />
      )}

      {unmatchedFacilities?.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            未登録の設備（マスタに追加が必要）:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {unmatchedFacilities.map((f, i) => (
              <Chip
                key={i}
                label={f}
                size="small"
                color="warning"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Description */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
        物件説明
      </Typography>

      <TextField
        fullWidth
        multiline
        rows={3}
        name="description"
        value={data.description}
        onChange={handleChange}
        size="small"
        placeholder="物件のアピールポイントなど"
      />
    </Box>
  );
}
