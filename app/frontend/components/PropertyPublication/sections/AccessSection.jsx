import React from 'react';
import { Box, Typography } from '@mui/material';
import { Train as TrainIcon } from '@mui/icons-material';

export default function AccessSection({ data, visibleFields, colors }) {
  const stations = data.room?.building?.building_stations;
  if (!visibleFields.access_section || !stations || stations.length === 0) return null;

  const sorted = [...stations].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  return (
    <Box id="access" sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', color: colors.primary, borderBottom: `2px solid ${colors.primary}`, pb: 1, mb: 2 }}>
        アクセス
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {sorted.map((bs) => {
          const station = bs.station;
          const line = station?.railway_line;
          return (
            <Box key={bs.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: '#f9f9f9', borderRadius: 1 }}>
              <TrainIcon sx={{ color: line?.color || colors.primary, fontSize: 24 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                {line?.name && (
                  <Box
                    component="span"
                    sx={{
                      bgcolor: line.color || colors.primary,
                      color: '#fff',
                      px: 1,
                      py: 0.25,
                      borderRadius: 0.5,
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {line.name}
                  </Box>
                )}
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {station?.name}駅
                </Typography>
                {bs.walking_minutes != null && (
                  <Typography variant="body2" color="text.secondary">
                    徒歩{bs.walking_minutes}分
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
