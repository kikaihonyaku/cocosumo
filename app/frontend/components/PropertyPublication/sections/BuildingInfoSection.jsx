import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  LocalParking as ParkingIcon,
  Elevator as ElevatorIcon,
  PedalBike as BikeIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

export default function BuildingInfoSection({ data, visibleFields, colors }) {
  if (!visibleFields.building_amenities_section) return null;

  const building = data.room?.building;
  if (!building) return null;

  const items = [
    {
      key: 'has_parking',
      label: '駐車場',
      icon: ParkingIcon,
      available: building.has_parking,
      detail: building.has_parking && building.parking_spaces ? `${building.parking_spaces}台` : null,
    },
    {
      key: 'has_elevator',
      label: 'エレベーター',
      icon: ElevatorIcon,
      available: building.has_elevator,
    },
    {
      key: 'has_bicycle_parking',
      label: '駐輪場',
      icon: BikeIcon,
      available: building.has_bicycle_parking,
    },
  ];

  // Only show if at least one amenity is defined
  const hasAny = items.some(item => item.available != null);
  if (!hasAny) return null;

  return (
    <Box id="building-amenities" sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', color: colors.primary, borderBottom: `2px solid ${colors.primary}`, pb: 1, mb: 2 }}>
        建物設備
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr' }, gap: 1.5 }}>
        {items.map((item) => {
          if (item.available == null) return null;
          const isAvailable = !!item.available;
          const Icon = item.icon;
          return (
            <Box
              key={item.key}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1.5,
                borderRadius: 1,
                border: '1px solid',
                borderColor: isAvailable ? `color-mix(in srgb, ${colors.primary} 40%, white)` : '#e0e0e0',
                bgcolor: isAvailable ? `color-mix(in srgb, ${colors.primary} 5%, white)` : '#fafafa',
              }}
            >
              <Icon sx={{ color: isAvailable ? colors.primary : '#999', fontSize: 24 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {item.label}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {isAvailable
                    ? <CheckIcon sx={{ fontSize: 14, color: colors.primary }} />
                    : <CloseIcon sx={{ fontSize: 14, color: '#999' }} />
                  }
                  <Typography variant="caption" sx={{ color: isAvailable ? colors.primary : '#999' }}>
                    {isAvailable ? (item.detail || 'あり') : 'なし'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
