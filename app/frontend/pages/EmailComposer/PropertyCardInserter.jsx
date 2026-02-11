import React from 'react';
import {
  Box, Typography, Button, Card, CardContent, Chip
} from '@mui/material';
import {
  ViewModule as CardIcon,
  Home as HomeIcon
} from '@mui/icons-material';

function formatRent(rent) {
  if (!rent) return null;
  if (rent >= 10000) {
    const man = Math.floor(rent / 10000);
    const remainder = rent % 10000;
    return remainder > 0 ? `${man}万${remainder.toLocaleString()}円` : `${man}万円`;
  }
  return `${rent.toLocaleString()}円`;
}

function buildPropertyCardHtml(property) {
  const photoUrl = property.room_photos?.[0]?.url || property.building_photos?.[0]?.url || '';
  const publicUrl = property.publication_url
    ? `${window.location.origin}${property.publication_url}`
    : null;

  const imgHtml = photoUrl
    ? `<img src="${photoUrl}" alt="${property.property_title}" style="width: 100%; border-radius: 4px; margin-bottom: 8px;" />`
    : '';

  const details = [
    property.room_type,
    property.area ? `${property.area}m²` : null,
    property.rent ? `賃料 ¥${property.rent?.toLocaleString()}` : null,
  ].filter(Boolean).join(' | ');

  const linkHtml = publicUrl
    ? `<a href="${publicUrl}" style="color: #667eea; text-decoration: none; font-size: 14px;">詳細を見る →</a>`
    : '';

  return `
<div style="border: 1px solid #ddd; border-radius: 8px; padding: 16px; max-width: 480px; margin: 12px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
  ${imgHtml}
  <h3 style="margin: 8px 0 4px; font-size: 16px; color: #333;">${property.property_title}</h3>
  ${details ? `<p style="color: #666; margin: 0 0 8px; font-size: 14px;">${details}</p>` : ''}
  ${linkHtml}
</div>
`.trim();
}

export default function PropertyCardInserter({ propertyPhotos, editor }) {
  if (!propertyPhotos || propertyPhotos.length === 0) {
    return null;
  }

  const handleInsertCard = (property) => {
    if (!editor) return;
    const cardHtml = buildPropertyCardHtml(property);
    editor.chain().focus().insertContent(cardHtml).run();
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, px: 1, py: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
        物件カード挿入
      </Typography>

      {propertyPhotos.map((property) => (
        <Card
          key={property.property_inquiry_id}
          variant="outlined"
          sx={{ mx: 1, mb: 1, cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}
          onClick={() => handleInsertCard(property)}
        >
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <HomeIcon sx={{ fontSize: 14, color: 'primary.main' }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {property.property_title}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {property.room_type && (
                <Chip label={property.room_type} size="small" sx={{ height: 18, fontSize: '0.6rem' }} />
              )}
              {property.area && (
                <Chip label={`${property.area}m²`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />
              )}
              {property.rent && (
                <Chip label={formatRent(property.rent)} size="small" variant="outlined" color="primary" sx={{ height: 18, fontSize: '0.6rem' }} />
              )}
            </Box>
            <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5, fontSize: '0.65rem' }}>
              <CardIcon sx={{ fontSize: 12, mr: 0.25, verticalAlign: 'middle' }} />
              クリックでカード挿入
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
