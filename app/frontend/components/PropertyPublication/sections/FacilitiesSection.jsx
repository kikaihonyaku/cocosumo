import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import {
  Kitchen as KitchenIcon,
  Bathtub as BathIcon,
  AcUnit as AcIcon,
  Security as SecurityIcon,
  Inventory2 as StorageIcon,
  Wifi as WifiIcon,
  LocalLaundryService as LaundryIcon,
  Weekend as InteriorIcon,
  Apartment as BuildingIcon,
  MoreHoriz as OtherIcon,
} from '@mui/icons-material';

const categoryIcons = {
  kitchen: KitchenIcon,
  bath_toilet: BathIcon,
  cooling_heating: AcIcon,
  security: SecurityIcon,
  storage: StorageIcon,
  communication: WifiIcon,
  laundry: LaundryIcon,
  interior: InteriorIcon,
  building: BuildingIcon,
  other: OtherIcon,
};

const categoryLabels = {
  kitchen: 'キッチン',
  bath_toilet: 'バス・トイレ',
  cooling_heating: '冷暖房',
  security: 'セキュリティ',
  storage: '収納',
  communication: '通信',
  laundry: '洗濯',
  interior: '内装',
  building: '共用',
  other: 'その他',
};

export default function FacilitiesSection({ data, visibleFields, colors }) {
  if (!visibleFields.facilities_section) return null;

  const categorized = data.room?.categorized_facilities;
  if (!categorized || Object.keys(categorized).length === 0) return null;

  return (
    <Box id="facilities" sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', color: colors.primary, borderBottom: `2px solid ${colors.primary}`, pb: 1, mb: 2 }}>
        設備・条件
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {Object.entries(categorized).map(([category, facilities]) => {
          const Icon = categoryIcons[category] || OtherIcon;
          const label = facilities[0]?.category_label || categoryLabels[category] || category;
          return (
            <Box key={category}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Icon sx={{ fontSize: 20, color: colors.primary }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#555' }}>
                  {label}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {facilities.map((f) => (
                  <Chip
                    key={f.code}
                    label={f.name}
                    size="small"
                    variant={f.is_popular ? 'filled' : 'outlined'}
                    sx={{
                      ...(f.is_popular
                        ? { bgcolor: `color-mix(in srgb, ${colors.primary} 15%, white)`, color: colors.primary, fontWeight: 'bold', borderColor: colors.primary }
                        : { borderColor: '#ccc' }),
                    }}
                  />
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
