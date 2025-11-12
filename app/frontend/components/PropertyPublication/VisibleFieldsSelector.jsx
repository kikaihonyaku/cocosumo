import React from 'react';
import {
  Box,
  Paper,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Grid,
  Divider
} from '@mui/material';
import {
  Home as BuildingIcon,
  MeetingRoom as RoomIcon
} from '@mui/icons-material';

export default function VisibleFieldsSelector({ visibleFields = {}, onVisibleFieldsChange }) {
  // デフォルト値の定義
  const defaultVisibleFields = {
    // 物件情報
    building_name: true,
    address: true,
    building_type: true,
    construction_date: true,
    total_floors: true,
    structure: true,
    access: true,
    parking: true,

    // 部屋情報
    room_number: true,
    floor: true,
    area: true,
    room_type: true,
    status: true,
    rent: true,
    management_fee: true,
    deposit: true,
    key_money: true,
    facilities: true,
    description: true
  };

  // 現在の値を取得（未設定の場合はデフォルト値を使用）
  const currentFields = { ...defaultVisibleFields, ...visibleFields };

  const handleToggle = (field) => {
    const newFields = {
      ...currentFields,
      [field]: !currentFields[field]
    };
    onVisibleFieldsChange(newFields);
  };

  // 物件情報のフィールド
  const buildingFields = [
    { key: 'building_name', label: '物件名' },
    { key: 'address', label: '住所' },
    { key: 'building_type', label: '物件種別' },
    { key: 'construction_date', label: '築年月' },
    { key: 'total_floors', label: '階数' },
    { key: 'structure', label: '構造' },
    { key: 'access', label: 'アクセス' },
    { key: 'parking', label: '駐車場' }
  ];

  // 部屋情報のフィールド
  const roomFields = [
    { key: 'room_number', label: '部屋番号' },
    { key: 'floor', label: '階数' },
    { key: 'area', label: '面積' },
    { key: 'room_type', label: '間取り' },
    { key: 'status', label: '空室状況' },
    { key: 'rent', label: '賃料' },
    { key: 'management_fee', label: '管理費' },
    { key: 'deposit', label: '敷金' },
    { key: 'key_money', label: '礼金' },
    { key: 'facilities', label: '設備' },
    { key: 'description', label: '備考' }
  ];

  return (
    <Box>
      <Grid container spacing={3}>
        {/* 物件情報 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BuildingIcon color="primary" />
              物件情報
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              公開ページに表示する物件情報を選択してください
            </Typography>
            <Divider sx={{ my: 2 }} />

            <FormGroup>
              {buildingFields.map((field) => (
                <FormControlLabel
                  key={field.key}
                  control={
                    <Checkbox
                      checked={currentFields[field.key] || false}
                      onChange={() => handleToggle(field.key)}
                      sx={{
                        '&.Mui-checked': {
                          color: 'primary.main'
                        },
                        '& .MuiSvgIcon-root': {
                          fontSize: 24
                        }
                      }}
                    />
                  }
                  label={field.label}
                />
              ))}
            </FormGroup>
          </Paper>
        </Grid>

        {/* 部屋情報 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <RoomIcon color="primary" />
              部屋情報
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              公開ページに表示する部屋情報を選択してください
            </Typography>
            <Divider sx={{ my: 2 }} />

            <FormGroup>
              {roomFields.map((field) => (
                <FormControlLabel
                  key={field.key}
                  control={
                    <Checkbox
                      checked={currentFields[field.key] || false}
                      onChange={() => handleToggle(field.key)}
                      sx={{
                        '&.Mui-checked': {
                          color: 'primary.main'
                        },
                        '& .MuiSvgIcon-root': {
                          fontSize: 24
                        }
                      }}
                    />
                  }
                  label={field.label}
                />
              ))}
            </FormGroup>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
