import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Checkbox,
  InputLabel,
  Button,
  IconButton,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import { StationFilter } from '../../shared/StationSelect';

export default function SearchModal({ isOpen, onClose, onSearch, currentConditions = {}, isLoading = false, stores = [], railwayData = [] }) {
  const [searchForm, setSearchForm] = useState({
    propertyName: '',
    address: '',
    buildingType: '',
    storeId: '',
    minRooms: '',
    maxRooms: '',
    maxVacancyRate: '',
    hasVacancy: '',
    externalImport: true,
    ownRegistration: true,
    railwayLineIds: [],
    stationIds: [],
    maxWalkingMinutes: '',
  });

  // モーダルが開かれた時に現在の条件を設定
  useEffect(() => {
    if (isOpen) {
      setSearchForm({
        propertyName: currentConditions.propertyName || '',
        address: currentConditions.address || '',
        buildingType: currentConditions.buildingType || '',
        storeId: currentConditions.storeId || '',
        minRooms: currentConditions.minRooms || '',
        maxRooms: currentConditions.maxRooms || '',
        maxVacancyRate: currentConditions.maxVacancyRate || '',
        hasVacancy: currentConditions.hasVacancy || '',
        externalImport: currentConditions.externalImport !== undefined ? currentConditions.externalImport : true,
        ownRegistration: currentConditions.ownRegistration !== undefined ? currentConditions.ownRegistration : true,
        railwayLineIds: currentConditions.railwayLineIds || [],
        stationIds: currentConditions.stationIds || [],
        maxWalkingMinutes: currentConditions.maxWalkingMinutes || '',
      });
    }
  }, [isOpen, currentConditions]);

  const handleInputChange = (field, value) => {
    setSearchForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchForm);
    onClose();
  };

  const handleReset = () => {
    const defaultForm = {
      propertyName: '',
      address: '',
      buildingType: '',
      storeId: '',
      minRooms: '',
      maxRooms: '',
      maxVacancyRate: '',
      hasVacancy: '',
      externalImport: true,
      ownRegistration: true,
      railwayLineIds: [],
      stationIds: [],
      maxWalkingMinutes: '',
    };
    setSearchForm(defaultForm);
  };

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableRestoreFocus
      sx={{
        zIndex: 1400, // LeftPanelのz-index(1350)より上に表示
      }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'primary.main',
          color: 'white',
          m: 0,
          px: 2,
          py: 0.5,
          minHeight: '40px',
          flexShrink: 0,
        }}
      >
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          検索条件設定
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <DialogContent sx={{ p: 3, flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* 基本情報セクション */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                基本情報
              </Typography>
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                '@media (min-width: 600px)': {
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 2
                }
              }}>
                <TextField
                  fullWidth
                  label="物件名"
                  placeholder="物件名を入力"
                  value={searchForm.propertyName}
                  onChange={(e) => handleInputChange('propertyName', e.target.value)}
                  variant="outlined"
                  size="small"
                />
                <TextField
                  fullWidth
                  label="住所"
                  placeholder="住所を入力"
                  value={searchForm.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  variant="outlined"
                  size="small"
                />
                <FormControl fullWidth size="small">
                  <InputLabel>建物種別</InputLabel>
                  <Select
                    value={searchForm.buildingType}
                    onChange={(e) => handleInputChange('buildingType', e.target.value)}
                    label="建物種別"
                    MenuProps={{
                      sx: { zIndex: 1500 }
                    }}
                  >
                    <MenuItem value="">選択してください</MenuItem>
                    <MenuItem value="mansion">マンション</MenuItem>
                    <MenuItem value="apartment">アパート</MenuItem>
                    <MenuItem value="house">一戸建て</MenuItem>
                    <MenuItem value="office">オフィス</MenuItem>
                    <MenuItem value="store">店舗</MenuItem>
                    <MenuItem value="other">その他</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel>空室有無</InputLabel>
                  <Select
                    value={searchForm.hasVacancy}
                    onChange={(e) => handleInputChange('hasVacancy', e.target.value)}
                    label="空室有無"
                    MenuProps={{
                      sx: { zIndex: 1500 }
                    }}
                  >
                    <MenuItem value="">選択してください</MenuItem>
                    <MenuItem value="true">空室あり</MenuItem>
                    <MenuItem value="false">満室</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel>店舗</InputLabel>
                  <Select
                    value={searchForm.storeId}
                    onChange={(e) => handleInputChange('storeId', e.target.value)}
                    label="店舗"
                    MenuProps={{
                      sx: { zIndex: 1500 }
                    }}
                  >
                    <MenuItem value="">すべての店舗</MenuItem>
                    {stores.map((store) => (
                      <MenuItem key={store.id} value={store.id}>
                        {store.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* 戸数条件セクション */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                戸数・空室条件
              </Typography>
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                '@media (min-width: 600px)': {
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 2
                }
              }}>
                <TextField
                  fullWidth
                  type="number"
                  label="最小戸数"
                  placeholder="例: 10"
                  InputProps={{ inputProps: { min: 1 } }}
                  value={searchForm.minRooms}
                  onChange={(e) => handleInputChange('minRooms', e.target.value)}
                  variant="outlined"
                  size="small"
                />
                <TextField
                  fullWidth
                  type="number"
                  label="最大戸数"
                  placeholder="例: 50"
                  InputProps={{ inputProps: { min: 1 } }}
                  value={searchForm.maxRooms}
                  onChange={(e) => handleInputChange('maxRooms', e.target.value)}
                  variant="outlined"
                  size="small"
                />
                <TextField
                  fullWidth
                  type="number"
                  label="最大空室率（%）"
                  placeholder="例: 15"
                  InputProps={{ inputProps: { min: 0, max: 100 } }}
                  value={searchForm.maxVacancyRate}
                  onChange={(e) => handleInputChange('maxVacancyRate', e.target.value)}
                  variant="outlined"
                  size="small"
                  sx={{ '@media (min-width: 600px)': { gridColumn: '1 / 2' } }}
                />
              </Box>
            </Box>

            {/* アクセスセクション */}
            {railwayData.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                  アクセス
                </Typography>
                <StationFilter
                  railwayData={railwayData}
                  selectedLineIds={searchForm.railwayLineIds}
                  onLineChange={(ids) => handleInputChange('railwayLineIds', ids)}
                  selectedStationIds={searchForm.stationIds}
                  onStationChange={(ids) => handleInputChange('stationIds', ids)}
                  maxWalkingMinutes={searchForm.maxWalkingMinutes}
                  onMaxWalkingMinutesChange={(val) => handleInputChange('maxWalkingMinutes', val)}
                />
              </Box>
            )}

            {/* 登録元セクション */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                登録元
              </Typography>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={searchForm.externalImport}
                      onChange={(e) => handleInputChange('externalImport', e.target.checked)}
                      sx={{
                        '& .MuiSvgIcon-root': { fontSize: 24 },
                        color: '#9e9e9e',
                        '&.Mui-checked': { color: '#1976d2' }
                      }}
                    />
                  }
                  label="外部取込み"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={searchForm.ownRegistration}
                      onChange={(e) => handleInputChange('ownRegistration', e.target.checked)}
                      sx={{
                        '& .MuiSvgIcon-root': { fontSize: 24 },
                        color: '#9e9e9e',
                        '&.Mui-checked': { color: '#1976d2' }
                      }}
                    />
                  }
                  label="自社登録"
                />
              </FormGroup>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1, gap: 1, flexShrink: 0 }}>
          <Button
            onClick={handleReset}
            variant="outlined"
            startIcon={<ClearAllIcon />}
            sx={{
              minWidth: 120,
              borderColor: 'grey.300',
              color: 'text.secondary',
              '&:hover': {
                borderColor: 'grey.400',
                backgroundColor: 'grey.50'
              }
            }}
          >
            条件をクリア
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
            disabled={isLoading}
            sx={{
              minWidth: 120,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 2
              }
            }}
          >
            {isLoading ? '検索中...' : '検索実行'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
