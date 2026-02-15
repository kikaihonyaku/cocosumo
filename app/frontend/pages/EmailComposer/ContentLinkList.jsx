import React from 'react';
import {
  Box, Typography, List, ListItemButton, ListItemIcon, ListItemText,
  Chip, CircularProgress
} from '@mui/material';
import {
  ViewInAr as VrIcon,
  AutoFixHigh as StagingIcon,
  Language as WebIcon
} from '@mui/icons-material';
import {
  buildVrTourCardHtml,
  buildVirtualStagingCardHtml,
  buildPublicationCardHtml
} from './contentCardTemplates';

export default function ContentLinkList({ roomContent, loading, editor }) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  if (!roomContent) return null;

  const { vr_tours = [], virtual_stagings = [], property_publications = [] } = roomContent;
  const hasContent = vr_tours.length > 0 || virtual_stagings.length > 0 || property_publications.length > 0;

  if (!hasContent) {
    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="caption" color="text.secondary">
          公開中のコンテンツはありません
        </Typography>
      </Box>
    );
  }

  const insertHtml = (html) => {
    if (!editor) return;
    editor.chain().focus().insertContent(html).run();
  };

  return (
    <Box>
      <Typography variant="caption" sx={{ fontWeight: 600, px: 1, color: 'text.secondary', fontSize: '0.7rem' }}>
        公開コンテンツ
      </Typography>
      <List dense disablePadding>
        {vr_tours.map((vt) => (
          <ListItemButton
            key={`vr-${vt.id}`}
            sx={{ py: 0.5, px: 1 }}
            onClick={() => insertHtml(buildVrTourCardHtml({
              ...vt,
              building_name: roomContent.room?.building_name,
              room_number: roomContent.room?.room_number
            }))}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <VrIcon sx={{ fontSize: 16, color: '#1565c0' }} />
            </ListItemIcon>
            <ListItemText
              primary={vt.title}
              primaryTypographyProps={{ variant: 'caption', fontWeight: 500, noWrap: true }}
            />
            <Chip label="VR" size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#e3f2fd', color: '#1565c0' }} />
          </ListItemButton>
        ))}

        {virtual_stagings.map((vs) => (
          <ListItemButton
            key={`vs-${vs.id}`}
            sx={{ py: 0.5, px: 1 }}
            onClick={() => insertHtml(buildVirtualStagingCardHtml({
              ...vs,
              building_name: roomContent.room?.building_name,
              room_number: roomContent.room?.room_number
            }))}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <StagingIcon sx={{ fontSize: 16, color: '#c62828' }} />
            </ListItemIcon>
            <ListItemText
              primary={vs.title}
              primaryTypographyProps={{ variant: 'caption', fontWeight: 500, noWrap: true }}
            />
            <Chip label="VS" size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#fce4ec', color: '#c62828' }} />
          </ListItemButton>
        ))}

        {property_publications.map((pp) => (
          <ListItemButton
            key={`pp-${pp.id}`}
            sx={{ py: 0.5, px: 1 }}
            onClick={() => insertHtml(buildPublicationCardHtml({
              ...pp,
              building_name: roomContent.room?.building_name,
              room_number: roomContent.room?.room_number
            }))}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <WebIcon sx={{ fontSize: 16, color: '#2e7d32' }} />
            </ListItemIcon>
            <ListItemText
              primary={pp.title}
              primaryTypographyProps={{ variant: 'caption', fontWeight: 500, noWrap: true }}
            />
            <Chip label="公開" size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#e8f5e9', color: '#2e7d32' }} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
