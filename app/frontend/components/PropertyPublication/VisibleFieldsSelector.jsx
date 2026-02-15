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
  MeetingRoom as RoomIcon,
  Visibility as SectionIcon
} from '@mui/icons-material';

export default function VisibleFieldsSelector({ visibleFields = {}, onVisibleFieldsChange }) {
  // デフォルト値の定義
  const defaultVisibleFields = {
    // 物件情報
    building_name: true,
    address: true,
    postcode: true,
    building_type: true,
    structure: true,
    built_year: true,
    floors: true,
    total_units: true,
    // 部屋情報
    room_number: true,
    floor: true,
    area: true,
    room_type: true,
    direction: true,
    rent: true,
    management_fee: true,
    deposit: true,
    key_money: true,
    description: true,
    // セクション表示
    access_section: true,
    cost_section: true,
    facilities_section: true,
    conditions_section: true,
    building_amenities_section: true,
    routes_section: true,
    map_section: true,
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
    { key: 'postcode', label: '郵便番号' },
    { key: 'building_type', label: '物件種別' },
    { key: 'structure', label: '構造' },
    { key: 'built_year', label: '築年' },
    { key: 'floors', label: '階建' },
    { key: 'total_units', label: '総戸数' },
  ];

  // 部屋情報のフィールド
  const roomFields = [
    { key: 'room_number', label: '部屋番号' },
    { key: 'floor', label: '階数' },
    { key: 'area', label: '面積' },
    { key: 'room_type', label: '間取り' },
    { key: 'direction', label: '向き' },
    { key: 'rent', label: '賃料' },
    { key: 'management_fee', label: '管理費' },
    { key: 'deposit', label: '敷金' },
    { key: 'key_money', label: '礼金' },
    { key: 'description', label: '備考' },
  ];

  // セクション表示のフィールド
  const sectionFields = [
    { key: 'access_section', label: 'アクセス情報', description: '最寄り駅・路線情報' },
    { key: 'cost_section', label: '賃料・初期費用', description: '更新料・駐車場料金を含む費用一覧' },
    { key: 'facilities_section', label: '設備カテゴリ表示', description: 'カテゴリ別設備グリッド' },
    { key: 'conditions_section', label: '入居条件', description: 'ペット可否・二人入居可否等' },
    { key: 'building_amenities_section', label: '建物設備', description: '駐車場・エレベーター・駐輪場' },
    { key: 'routes_section', label: '周辺施設経路', description: '周辺施設への距離・所要時間' },
    { key: 'map_section', label: '周辺地図', description: 'Google Maps地図表示' },
  ];

  const renderCheckboxGroup = (fields, showDescription = false) => (
    <FormGroup>
      {fields.map((field) => (
        <FormControlLabel
          key={field.key}
          control={
            <Checkbox
              checked={currentFields[field.key] || false}
              onChange={() => handleToggle(field.key)}
              sx={{
                '&.Mui-checked': { color: 'primary.main' },
                '& .MuiSvgIcon-root': { fontSize: 24 }
              }}
            />
          }
          label={
            showDescription ? (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{field.label}</Typography>
                {field.description && (
                  <Typography variant="caption" color="text.secondary">{field.description}</Typography>
                )}
              </Box>
            ) : field.label
          }
        />
      ))}
    </FormGroup>
  );

  return (
    <Box>
      <Grid container spacing={3}>
        {/* 物件情報 */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BuildingIcon color="primary" />
              物件情報
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              公開ページに表示する物件情報を選択
            </Typography>
            <Divider sx={{ my: 2 }} />
            {renderCheckboxGroup(buildingFields)}
          </Paper>
        </Grid>

        {/* 部屋情報 */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <RoomIcon color="primary" />
              部屋情報
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              公開ページに表示する部屋情報を選択
            </Typography>
            <Divider sx={{ my: 2 }} />
            {renderCheckboxGroup(roomFields)}
          </Paper>
        </Grid>

        {/* セクション表示 */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SectionIcon color="primary" />
              セクション表示
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              公開ページに表示するセクションを選択
            </Typography>
            <Divider sx={{ my: 2 }} />
            {renderCheckboxGroup(sectionFields, true)}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
