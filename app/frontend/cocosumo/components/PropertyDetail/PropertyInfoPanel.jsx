import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  Paper,
  Chip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Business as BusinessIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  OpenInFull as OpenInFullIcon,
  CloseFullscreen as CloseFullscreenIcon,
  Domain as DomainIcon,
  Build as BuildIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

export default function PropertyInfoPanel({ property, onSave, loading, isMaximized, onToggleMaximize, isMobile = false }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    building_type: '',
    built_year: '',
    description: '',
    postcode: '',
    total_units: '',
    structure: '',
    floors: '',
    ...property
  });

  const [expanded, setExpanded] = useState({
    basic: true,
    location: true,
    details: true,
    building: isMaximized || isMobile,
    facilities: isMaximized || isMobile,
  });

  // 最大化状態が変更された時にアコーディオンの展開状態を更新
  useEffect(() => {
    if (isMaximized) {
      setExpanded({
        basic: true,
        location: true,
        details: true,
        building: true,
        facilities: true,
      });
    }
  }, [isMaximized]);

  // モバイル時は全てのセクションを展開
  useEffect(() => {
    if (isMobile) {
      setExpanded({
        basic: true,
        location: true,
        details: true,
        building: true,
        facilities: true,
      });
    }
  }, [isMobile]);

  useEffect(() => {
    if (property) {
      setFormData({
        name: property.name || '',
        address: property.address || '',
        building_type: property.building_type || '',
        built_year: property.built_year || '',
        description: property.description || '',
        postcode: property.postcode || '',
        total_units: property.total_units || '',
        structure: property.structure || '',
        floors: property.floors || '',
        ...property
      });
    }
  }, [property]);

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(prev => ({
      ...prev,
      [panel]: isExpanded
    }));
  };

  const buildingTypes = [
    { id: 'mansion', name: 'マンション' },
    { id: 'apartment', name: 'アパート' },
    { id: 'house', name: '一戸建て' },
    { id: 'office', name: 'オフィス' },
    { id: 'store', name: '店舗' },
    { id: 'other', name: 'その他' },
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid #ddd', bgcolor: 'grey.50', height: 56, display: 'flex', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
          <BusinessIcon color="primary" />
          建物（土地）
        </Typography>

        {!isMobile && (
          <Tooltip title={isMaximized ? "最小化" : "最大化"}>
            <IconButton
              size="small"
              onClick={onToggleMaximize}
              sx={{ ml: 1 }}
            >
              {isMaximized ? <CloseFullscreenIcon /> : <OpenInFullIcon />}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* コンテンツ */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 0 }}>

        {/* 最大化時は複数列レイアウト */}
        <Box sx={{
          display: isMaximized ? 'grid' : 'block',
          gridTemplateColumns: isMaximized ? 'repeat(auto-fit, minmax(350px, 1fr))' : 'none',
          gap: isMaximized ? 0 : 0,
        }}>

        {/* 基本情報 */}
        <Accordion
          expanded={expanded.basic}
          onChange={handleAccordionChange('basic')}
          elevation={0}
          sx={{
            '&:before': { display: 'none' },
            borderBottom: isMaximized ? 'none' : '1px solid #ddd',
            borderRight: isMaximized ? '1px solid #ddd' : 'none',
            borderRadius: 0
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              backgroundColor: 'grey.50',
              borderBottom: '1px solid #ddd',
              minHeight: 48,
              '&.Mui-expanded': {
                minHeight: 48
              },
              '& .MuiAccordionSummary-content': {
                margin: '12px 0'
              }
            }}
          >
            <Typography variant="subtitle1" fontWeight="600" color="primary.main">
              基本情報
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 2, p: 2 }}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="建物名"
                value={formData.name || ''}
                onChange={handleChange('name')}
                variant="outlined"
                size="small"
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>建物種別</InputLabel>
                  <Select
                    value={formData.building_type || ''}
                    label="建物種別"
                    onChange={handleChange('building_type')}
                    variant="outlined"
                  >
                    {buildingTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="築年"
                  type="number"
                  value={formData.built_year || ''}
                  onChange={handleChange('built_year')}
                  variant="outlined"
                  size="small"
                  InputProps={{
                    endAdornment: <Typography variant="body2" color="text.secondary">年</Typography>
                  }}
                />
              </Box>

              <TextField
                fullWidth
                label="説明・備考"
                multiline
                rows={3}
                value={formData.description || ''}
                onChange={handleChange('description')}
                variant="outlined"
                size="small"
              />
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* 所在地情報 */}
        <Accordion
          expanded={expanded.location}
          onChange={handleAccordionChange('location')}
          elevation={0}
          sx={{
            '&:before': { display: 'none' },
            borderBottom: isMaximized ? 'none' : '1px solid #ddd',
            borderRight: isMaximized ? '1px solid #ddd' : 'none',
            borderRadius: 0
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              backgroundColor: 'grey.50',
              borderBottom: '1px solid #ddd',
              minHeight: 48,
              '&.Mui-expanded': {
                minHeight: 48
              },
              '& .MuiAccordionSummary-content': {
                margin: '12px 0'
              }
            }}
          >
            <Typography variant="subtitle1" fontWeight="600" color="primary.main">
              所在地
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 2, p: 2 }}>
            <Stack spacing={2}>
              <TextField
                label="郵便番号"
                value={formData.postcode || ''}
                onChange={handleChange('postcode')}
                variant="outlined"
                size="small"
                placeholder="000-0000"
                sx={{ maxWidth: 200 }}
              />

              <TextField
                fullWidth
                label="住所"
                value={formData.address || ''}
                onChange={handleChange('address')}
                variant="outlined"
                size="small"
              />

              {property?.latitude && property?.longitude && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <LocationIcon color="action" fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    緯度: {parseFloat(property.latitude).toFixed(6)}, 経度: {parseFloat(property.longitude).toFixed(6)}
                  </Typography>
                </Box>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* 詳細情報 */}
        <Accordion
          expanded={expanded.details}
          onChange={handleAccordionChange('details')}
          elevation={0}
          sx={{
            '&:before': { display: 'none' },
            borderBottom: isMaximized ? 'none' : '1px solid #ddd',
            borderRight: isMaximized ? '1px solid #ddd' : 'none',
            borderRadius: 0
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              backgroundColor: 'grey.50',
              borderBottom: '1px solid #ddd',
              minHeight: 48,
              '&.Mui-expanded': {
                minHeight: 48
              },
              '& .MuiAccordionSummary-content': {
                margin: '12px 0'
              }
            }}
          >
            <Typography variant="subtitle1" fontWeight="600" color="primary.main">
              詳細情報
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 2, p: 2 }}>
            <Stack spacing={2}>
              {property?.id && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">物件ID:</Typography>
                  <Typography variant="body2" fontFamily="monospace">{property.id}</Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  最終更新: {property?.updated_at ? new Date(property.updated_at).toLocaleDateString('ja-JP') : '不明'}
                </Typography>
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* 建築情報 - 最大化時のみ表示 */}
        {isMaximized && (
          <Accordion
            expanded={expanded.building}
            onChange={handleAccordionChange('building')}
            elevation={0}
            sx={{
              '&:before': { display: 'none' },
              borderRight: '1px solid #ddd',
              borderRadius: 0
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                backgroundColor: 'grey.50',
                borderBottom: '1px solid #ddd',
                minHeight: 48,
                '&.Mui-expanded': {
                  minHeight: 48
                },
                '& .MuiAccordionSummary-content': {
                  margin: '12px 0'
                }
              }}
            >
              <Typography variant="subtitle1" fontWeight="600" color="primary.main">
                建築情報
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 2, p: 2 }}>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="構造"
                    value={formData.structure || ''}
                    onChange={handleChange('structure')}
                    variant="outlined"
                    size="small"
                    sx={{ flex: 1 }}
                    placeholder="例: RC造"
                  />

                  <TextField
                    label="階数"
                    type="number"
                    value={formData.floors || ''}
                    onChange={handleChange('floors')}
                    variant="outlined"
                    size="small"
                    sx={{ flex: 1 }}
                    InputProps={{
                      endAdornment: <Typography variant="body2" color="text.secondary">階</Typography>
                    }}
                  />
                </Box>

                <TextField
                  label="総戸数"
                  type="number"
                  value={formData.total_units || ''}
                  onChange={handleChange('total_units')}
                  variant="outlined"
                  size="small"
                  InputProps={{
                    endAdornment: <Typography variant="body2" color="text.secondary">戸</Typography>
                  }}
                />
              </Stack>
            </AccordionDetails>
          </Accordion>
        )}

        </Box>
      </Box>

      {/* 保存ボタン */}
      <Box sx={{ p: 2, borderTop: '1px solid #ddd', bgcolor: 'grey.50' }}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={{ mb: 1 }}
        >
          {loading ? '保存中...' : '変更を保存'}
        </Button>
      </Box>
    </Box>
  );
}
