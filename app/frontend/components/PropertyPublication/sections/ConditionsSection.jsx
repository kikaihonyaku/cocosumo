import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  Pets as PetsIcon,
  People as PeopleIcon,
  Business as OfficeIcon,
  VerifiedUser as GuarantorIcon,
  CalendarMonth as CalendarIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const conditionItems = [
  { key: 'pets_allowed', label: 'ペット可', icon: PetsIcon },
  { key: 'two_person_allowed', label: '二人入居可', icon: PeopleIcon },
  { key: 'office_use_allowed', label: '事務所利用可', icon: OfficeIcon },
  { key: 'guarantor_required', label: '保証人必要', icon: GuarantorIcon },
];

export default function ConditionsSection({ data, visibleFields, colors }) {
  if (!visibleFields.conditions_section) return null;

  const room = data.room;
  if (!room) return null;

  // Only show if at least one condition is defined
  const hasAny = conditionItems.some(item => room[item.key] != null) || room.available_date;
  if (!hasAny) return null;

  return (
    <Box id="conditions" sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', color: colors.primary, borderBottom: `2px solid ${colors.primary}`, pb: 1, mb: 2 }}>
        入居条件
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr' }, gap: 1.5 }}>
        {conditionItems.map((item) => {
          if (room[item.key] == null) return null;
          const isAllowed = !!room[item.key];
          const Icon = item.icon;
          // For guarantor_required, "required=true" is a neutral/required condition, not positive
          const isPositive = item.key === 'guarantor_required' ? !isAllowed : isAllowed;
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
                borderColor: isPositive ? `color-mix(in srgb, ${colors.primary} 40%, white)` : '#e0e0e0',
                bgcolor: isPositive ? `color-mix(in srgb, ${colors.primary} 5%, white)` : '#fafafa',
              }}
            >
              <Icon sx={{ color: isPositive ? colors.primary : '#999', fontSize: 22 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                  {item.label}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {item.key === 'guarantor_required' ? (
                    <Typography variant="caption" sx={{ color: isAllowed ? '#666' : colors.primary }}>
                      {isAllowed ? '必要' : '不要'}
                    </Typography>
                  ) : (
                    <>
                      {isAllowed
                        ? <CheckIcon sx={{ fontSize: 14, color: colors.primary }} />
                        : <CloseIcon sx={{ fontSize: 14, color: '#999' }} />
                      }
                      <Typography variant="caption" sx={{ color: isAllowed ? colors.primary : '#999' }}>
                        {isAllowed ? '可' : '不可'}
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>
            </Box>
          );
        })}

        {room.available_date && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1.5,
              borderRadius: 1,
              border: '1px solid',
              borderColor: `color-mix(in srgb, ${colors.primary} 40%, white)`,
              bgcolor: `color-mix(in srgb, ${colors.primary} 5%, white)`,
            }}
          >
            <CalendarIcon sx={{ color: colors.primary, fontSize: 22 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                入居可能日
              </Typography>
              <Typography variant="caption" sx={{ color: colors.primary }}>
                {new Date(room.available_date).toLocaleDateString('ja-JP')}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
