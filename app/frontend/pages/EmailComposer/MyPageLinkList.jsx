import React from 'react';
import {
  Box, Typography, List, ListItemButton, ListItemIcon, ListItemText,
  Chip, CircularProgress
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { buildMyPageCardHtml } from './contentCardTemplates';

export default function MyPageLinkList({ accesses, loading, editor }) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  const activeAccesses = (accesses || []).filter(a => a.status === 'active');

  if (activeAccesses.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="caption" color="text.secondary">
          有効なマイページリンクはありません
        </Typography>
      </Box>
    );
  }

  const insertHtml = (access) => {
    if (!editor) return;
    const pub = access.property_publication || {};
    const html = buildMyPageCardHtml({
      public_url: `${window.location.origin}/customer/${access.access_token}`,
      building_name: pub.building_name,
      room_number: pub.room_number,
      title: pub.title,
      expires_at: access.expires_at
    });
    editor.chain().focus().insertContent(html).run();
  };

  return (
    <Box>
      <Typography variant="caption" sx={{ fontWeight: 600, px: 1, color: 'text.secondary', fontSize: '0.7rem' }}>
        顧客マイページ
      </Typography>
      <List dense disablePadding>
        {activeAccesses.map((access) => {
          const pub = access.property_publication || {};
          const label = [pub.building_name, pub.room_number].filter(Boolean).join(' ');
          return (
            <ListItemButton
              key={access.id}
              sx={{ py: 0.5, px: 1 }}
              onClick={() => insertHtml(access)}
            >
              <ListItemIcon sx={{ minWidth: 28 }}>
                <PersonIcon sx={{ fontSize: 16, color: '#e65100' }} />
              </ListItemIcon>
              <ListItemText
                primary={pub.title || label || 'マイページ'}
                secondary={access.expires_at ? `期限: ${access.expires_at}` : null}
                primaryTypographyProps={{ variant: 'caption', fontWeight: 500, noWrap: true }}
                secondaryTypographyProps={{ variant: 'caption', fontSize: '0.6rem' }}
              />
              <Chip
                label={`${access.view_count || 0}回`}
                size="small"
                variant="outlined"
                sx={{ height: 18, fontSize: '0.6rem' }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}
