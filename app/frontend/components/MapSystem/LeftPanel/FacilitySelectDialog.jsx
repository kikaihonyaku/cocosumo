import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Kitchen as KitchenIcon,
  Bathtub as BathtubIcon,
  AcUnit as AcUnitIcon,
  Security as SecurityIcon,
  Inventory as StorageIcon,
  Wifi as WifiIcon,
  LocalLaundryService as LaundryIcon,
  Chair as InteriorIcon,
  Apartment as BuildingIcon,
  MoreHoriz as OtherIcon,
} from '@mui/icons-material';

// カテゴリごとのアイコン
const CATEGORY_ICONS = {
  kitchen: <KitchenIcon />,
  bath_toilet: <BathtubIcon />,
  cooling_heating: <AcUnitIcon />,
  security: <SecurityIcon />,
  storage: <StorageIcon />,
  communication: <WifiIcon />,
  laundry: <LaundryIcon />,
  interior: <InteriorIcon />,
  building: <BuildingIcon />,
  other: <OtherIcon />,
};

export default function FacilitySelectDialog({
  open,
  onClose,
  facilities,
  categories,
  selected,
  onSelectionChange,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [localSelected, setLocalSelected] = useState(selected || []);
  const [expandedCategories, setExpandedCategories] = useState(['bath_toilet', 'security']);

  // ダイアログが開いた時にselectedを同期
  useEffect(() => {
    if (open) {
      setLocalSelected(selected || []);
    }
  }, [open, selected]);

  const handleToggle = (code) => {
    setLocalSelected(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const handleCategoryToggle = (category) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleApply = () => {
    onSelectionChange(localSelected);
    onClose();
  };

  const handleClear = () => {
    setLocalSelected([]);
  };

  const handleSelectAll = (categoryCode) => {
    const categoryFacilities = facilities[categoryCode] || [];
    const allCodes = categoryFacilities.map(f => f.code);
    const allSelected = allCodes.every(code => localSelected.includes(code));

    if (allSelected) {
      // すべて解除
      setLocalSelected(prev => prev.filter(code => !allCodes.includes(code)));
    } else {
      // すべて選択
      setLocalSelected(prev => [...new Set([...prev, ...allCodes])]);
    }
  };

  const getCategorySelectedCount = (categoryCode) => {
    const categoryFacilities = facilities[categoryCode] || [];
    return categoryFacilities.filter(f => localSelected.includes(f.code)).length;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">設備を選択</Typography>
        <Typography variant="body2" color="text.secondary">
          {localSelected.length}件選択中
        </Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {/* 選択中の設備チップ */}
        {localSelected.length > 0 && (
          <Box sx={{ p: 2, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              選択中の設備:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {localSelected.map(code => {
                // facilities から name を探す
                let name = code;
                Object.values(facilities).forEach(categoryFacilities => {
                  const found = categoryFacilities.find(f => f.code === code);
                  if (found) name = found.name;
                });
                return (
                  <Chip
                    key={code}
                    label={name}
                    size="small"
                    onDelete={() => handleToggle(code)}
                    color="primary"
                  />
                );
              })}
            </Box>
          </Box>
        )}

        {/* カテゴリ別設備リスト */}
        {Object.entries(categories || {}).map(([categoryCode, categoryLabel]) => {
          const categoryFacilities = facilities[categoryCode] || [];
          if (categoryFacilities.length === 0) return null;

          const selectedCount = getCategorySelectedCount(categoryCode);
          const isExpanded = expandedCategories.includes(categoryCode);

          return (
            <Accordion
              key={categoryCode}
              expanded={isExpanded}
              onChange={() => handleCategoryToggle(categoryCode)}
              disableGutters
              elevation={0}
              sx={{ '&:before': { display: 'none' } }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  bgcolor: selectedCount > 0 ? 'primary.50' : 'inherit',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {CATEGORY_ICONS[categoryCode]}
                  <Typography>{categoryLabel}</Typography>
                  {selectedCount > 0 && (
                    <Chip
                      label={selectedCount}
                      size="small"
                      color="primary"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                  <Button
                    size="small"
                    onClick={() => handleSelectAll(categoryCode)}
                  >
                    {categoryFacilities.every(f => localSelected.includes(f.code))
                      ? 'すべて解除'
                      : 'すべて選択'}
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
                  {categoryFacilities.map(facility => (
                    <FormControlLabel
                      key={facility.code}
                      control={
                        <Checkbox
                          checked={localSelected.includes(facility.code)}
                          onChange={() => handleToggle(facility.code)}
                          size="small"
                        />
                      }
                      label={facility.name}
                      sx={{ width: '50%', m: 0 }}
                    />
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 2 }}>
        <Button onClick={handleClear} color="inherit">
          クリア
        </Button>
        <Box>
          <Button onClick={onClose} color="inherit">
            キャンセル
          </Button>
          <Button onClick={handleApply} variant="contained">
            適用
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
