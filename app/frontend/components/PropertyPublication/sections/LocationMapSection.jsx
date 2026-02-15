import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Map as MapIcon } from '@mui/icons-material';

export default function LocationMapSection({ data, visibleFields, colors }) {
  if (!visibleFields.map_section) return null;

  const building = data.room?.building;
  const latitude = building?.latitude;
  const longitude = building?.longitude;
  if (!latitude || !longitude) return null;

  const [isInteractive, setIsInteractive] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const staticMapUrl = apiKey
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=16&size=800x400&scale=2&markers=color:red|${latitude},${longitude}&key=${apiKey}&language=ja`
    : null;

  useEffect(() => {
    if (!isInteractive || !mapRef.current || mapInstanceRef.current) return;

    let cancelled = false;

    const initMap = async () => {
      try {
        // Use @googlemaps/js-api-loader (already installed in project)
        const { Loader } = await import('@googlemaps/js-api-loader');
        if (cancelled) return;

        const loader = new Loader({
          apiKey: apiKey || '',
          version: 'weekly',
          language: 'ja',
        });

        const google = await loader.load();
        if (cancelled || !mapRef.current) return;

        const position = { lat: latitude, lng: longitude };
        const map = new google.maps.Map(mapRef.current, {
          center: position,
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: true,
        });

        new google.maps.Marker({
          position,
          map,
          title: building?.name || '物件の位置',
        });

        mapInstanceRef.current = map;
      } catch (e) {
        console.error('Failed to load Google Maps:', e);
      }
    };

    initMap();
    return () => { cancelled = true; };
  }, [isInteractive, latitude, longitude, apiKey]);

  return (
    <Box id="map" sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', color: colors.primary, borderBottom: `2px solid ${colors.primary}`, pb: 1, mb: 2 }}>
        周辺地図
      </Typography>

      {!isInteractive ? (
        <Box
          sx={{ position: 'relative', cursor: 'pointer', borderRadius: 1, overflow: 'hidden' }}
          onClick={() => setIsInteractive(true)}
        >
          {staticMapUrl ? (
            <Box
              component="img"
              src={staticMapUrl}
              alt="周辺地図"
              sx={{ width: '100%', height: { xs: 250, sm: 400 }, objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <Box sx={{ width: '100%', height: { xs: 250, sm: 400 }, bgcolor: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">地図を表示するにはAPI Keyが必要です</Typography>
            </Box>
          )}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.15)',
              transition: 'background-color 0.2s',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.25)' },
            }}
          >
            <Button
              variant="contained"
              startIcon={<MapIcon />}
              sx={{
                bgcolor: 'white',
                color: colors.primary,
                fontWeight: 'bold',
                px: 3,
                py: 1.5,
                boxShadow: 3,
                '&:hover': { bgcolor: '#f5f5f5' },
              }}
            >
              地図を操作する
            </Button>
          </Box>
        </Box>
      ) : (
        <Box
          ref={mapRef}
          sx={{ width: '100%', height: { xs: 300, sm: 400 }, borderRadius: 1, overflow: 'hidden' }}
        />
      )}
    </Box>
  );
}
