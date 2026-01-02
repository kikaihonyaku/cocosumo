import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Divider
} from '@mui/material';
import {
  DirectionsWalk as WalkIcon,
  DirectionsTransit as TransitIcon,
  DirectionsCar as CarIcon,
  Place as PlaceIcon,
  PlayArrow as PlayIcon
} from '@mui/icons-material';
import PropertyMapPanel from '../../BuildingDetail/PropertyMapPanel';

const TRAVEL_MODE_ICONS = {
  walking: <WalkIcon />,
  transit: <TransitIcon />,
  driving: <CarIcon />
};

const TRAVEL_MODE_LABELS = {
  walking: '徒歩',
  transit: '電車',
  driving: '車'
};

export default function NeighborhoodStep({ property, config, isMobile }) {
  const { building, routes } = property;
  const [selectedRoute, setSelectedRoute] = useState(null);

  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    const minutes = Math.ceil(seconds / 60);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}時間${mins}分`;
    }
    return `${minutes}分`;
  };

  const formatDistance = (meters) => {
    if (!meters) return '-';
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${meters}m`;
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PlaceIcon color="primary" />
        周辺環境
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        物件の立地と周辺施設をご案内します
      </Typography>

      <Grid container spacing={3}>
        {/* 地図エリア */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ height: isMobile ? 350 : 500, overflow: 'hidden', borderRadius: 2 }}>
            {building?.latitude && building?.longitude ? (
              <PropertyMapPanel
                property={{
                  latitude: building.latitude,
                  longitude: building.longitude,
                  name: building.name
                }}
                routes={routes?.map(r => ({
                  ...r,
                  origin_lat: building.latitude,
                  origin_lng: building.longitude,
                  destination_lat: r.destination_lat,
                  destination_lng: r.destination_lng
                }))}
                activeRoute={selectedRoute}
                onRouteSelect={setSelectedRoute}
                hideHeader={true}
                height="100%"
              />
            ) : (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.100'
                }}
              >
                <Typography color="text.secondary">
                  位置情報がありません
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* アクセス情報 */}
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            アクセス情報
          </Typography>

          {routes && routes.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {routes.map((route, index) => (
                <Card
                  key={route.id || index}
                  variant="outlined"
                  sx={{
                    cursor: 'pointer',
                    borderColor: selectedRoute?.id === route.id ? 'primary.main' : 'divider',
                    borderWidth: selectedRoute?.id === route.id ? 2 : 1,
                    transition: 'all 0.2s'
                  }}
                  onClick={() => setSelectedRoute(route)}
                >
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          bgcolor: 'primary.50',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'primary.main'
                        }}
                      >
                        {TRAVEL_MODE_ICONS[route.travel_mode] || <WalkIcon />}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {route.destination_name || route.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Chip
                            size="small"
                            label={formatDuration(route.duration_seconds)}
                            color="primary"
                            variant="outlined"
                          />
                          <Chip
                            size="small"
                            label={formatDistance(route.distance_meters)}
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Typography color="text.secondary">
                登録されたアクセス情報はありません
              </Typography>
            </Paper>
          )}

          {/* 住所情報 */}
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            所在地
          </Typography>
          <Typography variant="body1">
            {building?.address || '住所未設定'}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}
