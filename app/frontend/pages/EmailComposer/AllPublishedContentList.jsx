import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, TextField, List, ListItemButton, ListItemIcon, ListItemText,
  Chip, CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  ViewInAr as VrIcon,
  AutoFixHigh as StagingIcon,
  Language as WebIcon
} from '@mui/icons-material';
import axios from 'axios';
import {
  buildVrTourCardHtml,
  buildVirtualStagingCardHtml,
  buildPublicationCardHtml
} from './contentCardTemplates';

export default function AllPublishedContentList({ editor }) {
  const [query, setQuery] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const fetchContents = (q) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/v1/published_contents', { params: { q } });
        setData(res.data);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  useEffect(() => {
    fetchContents('');
  }, []);

  const handleQueryChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    fetchContents(q);
  };

  const insertHtml = (html) => {
    if (!editor) return;
    editor.chain().focus().insertContent(html).run();
  };

  const vr_tours = data?.vr_tours || [];
  const virtual_stagings = data?.virtual_stagings || [];
  const property_publications = data?.property_publications || [];
  const hasContent = vr_tours.length > 0 || virtual_stagings.length > 0 || property_publications.length > 0;

  return (
    <Box>
      <Box sx={{ px: 1, mb: 1 }}>
        <TextField
          value={query}
          onChange={handleQueryChange}
          placeholder="建物名・タイトルで検索..."
          size="small"
          fullWidth
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 0.5, fontSize: 18 }} />,
          }}
        />
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={20} />
        </Box>
      )}

      {!loading && !hasContent && (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {query ? '該当するコンテンツがありません' : '公開中のコンテンツはありません'}
          </Typography>
        </Box>
      )}

      {!loading && hasContent && (
        <List dense disablePadding sx={{ maxHeight: 300, overflow: 'auto' }}>
          {vr_tours.map((vt) => (
            <ListItemButton
              key={`vr-${vt.id}`}
              sx={{ py: 0.5, px: 1 }}
              onClick={() => insertHtml(buildVrTourCardHtml(vt))}
            >
              <ListItemIcon sx={{ minWidth: 28 }}>
                <VrIcon sx={{ fontSize: 16, color: '#1565c0' }} />
              </ListItemIcon>
              <ListItemText
                primary={vt.title}
                secondary={`${vt.building_name || ''} ${vt.room_number || ''}`.trim()}
                primaryTypographyProps={{ variant: 'caption', fontWeight: 500, noWrap: true }}
                secondaryTypographyProps={{ variant: 'caption', fontSize: '0.6rem', noWrap: true }}
              />
              <Chip label="VR" size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#e3f2fd', color: '#1565c0' }} />
            </ListItemButton>
          ))}

          {virtual_stagings.map((vs) => (
            <ListItemButton
              key={`vs-${vs.id}`}
              sx={{ py: 0.5, px: 1 }}
              onClick={() => insertHtml(buildVirtualStagingCardHtml(vs))}
            >
              <ListItemIcon sx={{ minWidth: 28 }}>
                <StagingIcon sx={{ fontSize: 16, color: '#c62828' }} />
              </ListItemIcon>
              <ListItemText
                primary={vs.title}
                secondary={`${vs.building_name || ''} ${vs.room_number || ''}`.trim()}
                primaryTypographyProps={{ variant: 'caption', fontWeight: 500, noWrap: true }}
                secondaryTypographyProps={{ variant: 'caption', fontSize: '0.6rem', noWrap: true }}
              />
              <Chip label="VS" size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#fce4ec', color: '#c62828' }} />
            </ListItemButton>
          ))}

          {property_publications.map((pp) => (
            <ListItemButton
              key={`pp-${pp.id}`}
              sx={{ py: 0.5, px: 1 }}
              onClick={() => insertHtml(buildPublicationCardHtml(pp))}
            >
              <ListItemIcon sx={{ minWidth: 28 }}>
                <WebIcon sx={{ fontSize: 16, color: '#2e7d32' }} />
              </ListItemIcon>
              <ListItemText
                primary={pp.title}
                secondary={`${pp.building_name || ''} ${pp.room_number || ''}`.trim()}
                primaryTypographyProps={{ variant: 'caption', fontWeight: 500, noWrap: true }}
                secondaryTypographyProps={{ variant: 'caption', fontSize: '0.6rem', noWrap: true }}
              />
              <Chip label="公開" size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#e8f5e9', color: '#2e7d32' }} />
            </ListItemButton>
          ))}
        </List>
      )}
    </Box>
  );
}
