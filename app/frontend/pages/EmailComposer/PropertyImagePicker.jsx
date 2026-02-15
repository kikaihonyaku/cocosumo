import React, { useState } from 'react';
import {
  Box, Typography, Accordion, AccordionSummary, AccordionDetails,
  CircularProgress, Menu, MenuItem, Chip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Home as HomeIcon,
  Apartment as ApartmentIcon
} from '@mui/icons-material';

const SIZE_OPTIONS = [
  { label: '小 (240px)', width: 240 },
  { label: '中 (480px)', width: 480 },
  { label: '大 (640px)', width: 640 },
];

export default function PropertyImagePicker({ propertyPhotos, photosLoading, editor }) {
  const [sizeMenuAnchor, setSizeMenuAnchor] = useState(null);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState(null);

  const handlePhotoClick = (url, event) => {
    setSelectedPhotoUrl(url);
    setSizeMenuAnchor(event.currentTarget);
  };

  const handleInsertImage = (width) => {
    if (editor && selectedPhotoUrl) {
      editor.chain().focus().setImage({
        src: selectedPhotoUrl,
        alt: '物件画像',
        title: '物件画像',
      }).run();

      // After insertion, update the img style with width
      // Find the just-inserted image and add width style
      const { state } = editor;
      const { doc } = state;
      doc.descendants((node, pos) => {
        if (node.type.name === 'image' && node.attrs.src === selectedPhotoUrl) {
          editor.chain().focus().setNodeSelection(pos).updateAttributes('image', {
            style: `max-width: ${width}px; width: 100%; height: auto;`,
          }).run();
          return false; // Stop iteration
        }
      });
    }
    setSizeMenuAnchor(null);
    setSelectedPhotoUrl(null);
  };

  if (photosLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} sx={{ color: 'grey.500' }} />
      </Box>
    );
  }

  if (!propertyPhotos || propertyPhotos.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <HomeIcon sx={{ fontSize: 36, color: 'grey.300', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          案件に紐づく物件写真はありません
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, px: 1, py: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
        物件画像
      </Typography>

      {propertyPhotos.map((group) => {
        const allPhotos = [...(group.building_photos || []), ...(group.room_photos || [])];
        if (allPhotos.length === 0) return null;

        return (
          <Accordion key={group.property_inquiry_id} defaultExpanded disableGutters elevation={0}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ minHeight: 36, '& .MuiAccordionSummary-content': { my: 0.5 } }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ApartmentIcon sx={{ fontSize: 16, color: 'grey.600' }} />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {group.property_title}
                </Typography>
                <Chip label={`${allPhotos.length}枚`} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 1, py: 0.5 }}>
              {/* Building photos */}
              {group.building_photos?.length > 0 && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', px: 0.5 }}>
                    建物写真
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {group.building_photos.map(photo => (
                      <Box
                        key={`b-${photo.id}`}
                        onClick={(e) => handlePhotoClick(photo.url, e)}
                        sx={{
                          width: 72,
                          height: 72,
                          borderRadius: 1,
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: '2px solid transparent',
                          '&:hover': { borderColor: 'grey.600', opacity: 0.85 },
                          transition: 'all 0.15s',
                        }}
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption || '建物写真'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Room photos */}
              {group.room_photos?.length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', px: 0.5 }}>
                    部屋写真
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {group.room_photos.map(photo => (
                      <Box
                        key={`r-${photo.id}`}
                        onClick={(e) => handlePhotoClick(photo.url, e)}
                        sx={{
                          width: 72,
                          height: 72,
                          borderRadius: 1,
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: '2px solid transparent',
                          '&:hover': { borderColor: 'grey.600', opacity: 0.85 },
                          transition: 'all 0.15s',
                        }}
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption || '部屋写真'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}

      {/* Image size selection menu */}
      <Menu
        anchorEl={sizeMenuAnchor}
        open={Boolean(sizeMenuAnchor)}
        onClose={() => { setSizeMenuAnchor(null); setSelectedPhotoUrl(null); }}
      >
        <Typography variant="caption" sx={{ px: 2, py: 0.5, color: 'text.secondary', display: 'block' }}>
          挿入サイズを選択
        </Typography>
        {SIZE_OPTIONS.map(opt => (
          <MenuItem key={opt.width} onClick={() => handleInsertImage(opt.width)}>
            {opt.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
