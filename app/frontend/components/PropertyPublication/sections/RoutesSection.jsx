import React from 'react';
import { Box, Typography, Table, TableBody, TableRow, TableCell, TableHead } from '@mui/material';
import {
  DirectionsWalk as WalkIcon,
  DirectionsCar as CarIcon,
  DirectionsBus as TransitIcon,
  DirectionsBike as BikeIcon,
} from '@mui/icons-material';

const travelModeIcon = {
  walking: WalkIcon,
  driving: CarIcon,
  transit: TransitIcon,
  bicycling: BikeIcon,
};

const travelModeLabel = {
  walking: '徒歩',
  driving: '車',
  transit: '公共交通',
  bicycling: '自転車',
};

export default function RoutesSection({ data, visibleFields, colors }) {
  const routes = data.room?.building?.building_routes;
  if (!visibleFields.routes_section || !routes || routes.length === 0) return null;

  const sorted = [...routes].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  return (
    <Box id="routes" sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', color: colors.primary, borderBottom: `2px solid ${colors.primary}`, pb: 1, mb: 2 }}>
        周辺施設への経路
      </Typography>
      <Table size="small" sx={{ '& td, & th': { borderBottom: '1px solid #e0e0e0' } }}>
        <TableHead>
          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
            <TableCell sx={{ fontWeight: 'bold' }}>施設名</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>移動手段</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>距離</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>所要時間</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((route) => {
            const Icon = travelModeIcon[route.travel_mode] || WalkIcon;
            return (
              <TableRow key={route.id} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                <TableCell>{route.name}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Icon sx={{ fontSize: 18, color: colors.primary }} />
                    <span>{travelModeLabel[route.travel_mode] || route.travel_mode}</span>
                  </Box>
                </TableCell>
                <TableCell>{route.formatted_distance || '-'}</TableCell>
                <TableCell>{route.formatted_duration || '-'}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}
