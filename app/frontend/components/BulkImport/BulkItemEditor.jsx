import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  Paper,
  Chip,
  FormControlLabel,
  Switch,
  Alert,
  RadioGroup,
  Radio,
} from '@mui/material';
import {
  Save as SaveIcon,
  Star as StarIcon,
  Home as HomeIcon,
  Add as AddIcon,
} from '@mui/icons-material';

const buildingTypes = [
  { value: 'mansion', label: 'マンション' },
  { value: 'apartment', label: 'アパート' },
  { value: 'house', label: '一戸建て' },
  { value: 'office', label: 'オフィス・店舗' },
];

const roomTypes = [
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

const directions = ['南', '南東', '東', '北東', '北', '北西', '西', '南西'];

export default function BulkItemEditor({ item, onSave }) {
  const [buildingData, setBuildingData] = useState({});
  const [roomData, setRoomData] = useState({});
  const [selectedBuildingId, setSelectedBuildingId] = useState(null);
  const [buildingChoice, setBuildingChoice] = useState('new'); // 'new' or 'existing'
  const [saving, setSaving] = useState(false);
  const [modified, setModified] = useState(false);

  // Initialize from item data
  useEffect(() => {
    if (item.edited_data) {
      setBuildingData(item.edited_data.building || {});
      setRoomData(item.edited_data.room || {});
    }
    if (item.selected_building_id) {
      setSelectedBuildingId(item.selected_building_id);
      setBuildingChoice('existing');
    }
  }, [item]);

  // Handle building data change
  const handleBuildingChange = (field) => (e) => {
    setBuildingData(prev => ({ ...prev, [field]: e.target.value }));
    setModified(true);
  };

  // Handle room data change
  const handleRoomChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setRoomData(prev => ({ ...prev, [field]: value }));
    setModified(true);
  };

  // Handle building selection
  const handleBuildingSelect = (buildingId) => {
    setSelectedBuildingId(buildingId);
    setBuildingChoice('existing');
    setModified(true);
  };

  // Handle building choice change
  const handleBuildingChoiceChange = (e) => {
    setBuildingChoice(e.target.value);
    if (e.target.value === 'new') {
      setSelectedBuildingId(null);
    }
    setModified(true);
  };

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    const editedData = {
      building: buildingData,
      room: roomData,
    };
    const success = await onSave(
      editedData,
      buildingChoice === 'existing' ? selectedBuildingId : null
    );
    setSaving(false);
    if (success) {
      setModified(false);
    }
  };

  const similarBuildings = item.similar_buildings || [];

  return (
    <Box sx={{ p: 3 }}>
      {/* Building Selection */}
      {similarBuildings.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'warning.50' }}>
          <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <StarIcon color="warning" />
            類似建物が見つかりました
          </Typography>

          <RadioGroup value={buildingChoice} onChange={handleBuildingChoiceChange}>
            <FormControlLabel
              value="new"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AddIcon fontSize="small" />
                  新規建物として登録
                </Box>
              }
            />

            {similarBuildings.map((building) => (
              <FormControlLabel
                key={building.id}
                value="existing"
                control={<Radio />}
                onClick={() => handleBuildingSelect(building.id)}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HomeIcon fontSize="small" color={building.score >= 80 ? 'primary' : 'inherit'} />
                    <Box>
                      <Typography variant="body2">
                        {building.name}
                        {building.score >= 80 && (
                          <Chip label="推奨" size="small" color="primary" sx={{ ml: 1 }} />
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {building.address} (一致度: {building.score}%)
                      </Typography>
                    </Box>
                  </Box>
                }
                sx={{
                  bgcolor: selectedBuildingId === building.id ? 'primary.50' : 'transparent',
                  borderRadius: 1,
                  m: 0.5,
                  pl: 1,
                }}
              />
            ))}
          </RadioGroup>
        </Paper>
      )}

      {/* Building Info */}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        建物情報
        {buildingChoice === 'existing' && (
          <Chip label="既存建物を使用" size="small" color="primary" sx={{ ml: 1 }} />
        )}
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="建物名"
            value={buildingData.name || ''}
            onChange={handleBuildingChange('name')}
            fullWidth
            required
            disabled={buildingChoice === 'existing'}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl fullWidth disabled={buildingChoice === 'existing'}>
            <InputLabel>建物種別</InputLabel>
            <Select
              value={buildingData.building_type || 'mansion'}
              onChange={handleBuildingChange('building_type')}
              label="建物種別"
            >
              {buildingTypes.map(type => (
                <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            label="住所"
            value={buildingData.address || ''}
            onChange={handleBuildingChange('address')}
            fullWidth
            required
            disabled={buildingChoice === 'existing'}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            label="構造"
            value={buildingData.structure || ''}
            onChange={handleBuildingChange('structure')}
            fullWidth
            disabled={buildingChoice === 'existing'}
            placeholder="例: RC造"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <TextField
            label="階数"
            type="number"
            value={buildingData.floors || ''}
            onChange={handleBuildingChange('floors')}
            fullWidth
            disabled={buildingChoice === 'existing'}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <TextField
            label="総戸数"
            type="number"
            value={buildingData.total_units || ''}
            onChange={handleBuildingChange('total_units')}
            fullWidth
            disabled={buildingChoice === 'existing'}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Room Info */}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        部屋情報
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <TextField
            label="部屋番号"
            value={roomData.room_number || ''}
            onChange={handleRoomChange('room_number')}
            fullWidth
            placeholder="例: 101"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <FormControl fullWidth>
            <InputLabel>間取り</InputLabel>
            <Select
              value={roomData.room_type || ''}
              onChange={handleRoomChange('room_type')}
              label="間取り"
            >
              {roomTypes.map(type => (
                <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <TextField
            label="階"
            type="number"
            value={roomData.floor || ''}
            onChange={handleRoomChange('floor')}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <TextField
            label="面積 (m²)"
            type="number"
            value={roomData.area || ''}
            onChange={handleRoomChange('area')}
            fullWidth
          />
        </Grid>

        <Grid size={{ xs: 6, md: 3 }}>
          <TextField
            label="賃料 (円)"
            type="number"
            value={roomData.rent || ''}
            onChange={handleRoomChange('rent')}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <TextField
            label="管理費 (円)"
            type="number"
            value={roomData.management_fee || ''}
            onChange={handleRoomChange('management_fee')}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <TextField
            label="敷金 (円)"
            type="number"
            value={roomData.deposit || ''}
            onChange={handleRoomChange('deposit')}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <TextField
            label="礼金 (円)"
            type="number"
            value={roomData.key_money || ''}
            onChange={handleRoomChange('key_money')}
            fullWidth
          />
        </Grid>

        <Grid size={{ xs: 6, md: 3 }}>
          <FormControl fullWidth>
            <InputLabel>向き</InputLabel>
            <Select
              value={roomData.direction || ''}
              onChange={handleRoomChange('direction')}
              label="向き"
            >
              {directions.map(dir => (
                <MenuItem key={dir} value={dir}>{dir}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <TextField
            label="駐車場 (円)"
            type="number"
            value={roomData.parking_fee || ''}
            onChange={handleRoomChange('parking_fee')}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="入居可能日"
            type="date"
            value={roomData.available_date || ''}
            onChange={handleRoomChange('available_date')}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={roomData.pets_allowed || false}
                  onChange={handleRoomChange('pets_allowed')}
                />
              }
              label="ペット可"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={roomData.guarantor_required !== false}
                  onChange={handleRoomChange('guarantor_required')}
                />
              }
              label="保証人必要"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={roomData.two_person_allowed || false}
                  onChange={handleRoomChange('two_person_allowed')}
                />
              }
              label="二人入居可"
            />
          </Box>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            label="物件説明"
            value={roomData.description || ''}
            onChange={handleRoomChange('description')}
            fullWidth
            multiline
            rows={2}
          />
        </Grid>
      </Grid>

      {/* Save button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        {modified && (
          <Alert severity="info" sx={{ flex: 1 }}>
            変更があります。保存してください。
          </Alert>
        )}
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={<SaveIcon />}
        >
          {saving ? '保存中...' : '変更を保存'}
        </Button>
      </Box>
    </Box>
  );
}
