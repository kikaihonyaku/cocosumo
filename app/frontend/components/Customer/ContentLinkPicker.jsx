import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, List, ListItemButton, ListItemIcon, ListItemText,
  Chip, CircularProgress, Divider
} from '@mui/material';
import {
  ViewInAr as VrIcon,
  AutoFixHigh as StagingIcon,
  Language as WebIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import axios from 'axios';
import RoomSearchField from '../../pages/EmailComposer/RoomSearchField';

export default function ContentLinkPicker({ customerId, onInsertLink, onRoomSelected }) {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomContent, setRoomContent] = useState(null);
  const [roomContentLoading, setRoomContentLoading] = useState(false);
  const [accesses, setAccesses] = useState([]);
  const [accessesLoading, setAccessesLoading] = useState(false);

  // Load customer accesses on mount
  useEffect(() => {
    if (!customerId) return;
    const loadAccesses = async () => {
      try {
        setAccessesLoading(true);
        const res = await axios.get(`/api/v1/customers/${customerId}/accesses`);
        setAccesses(Array.isArray(res.data) ? res.data : []);
      } catch {
        setAccesses([]);
      } finally {
        setAccessesLoading(false);
      }
    };
    loadAccesses();
  }, [customerId]);

  const handleRoomChange = useCallback(async (room) => {
    setSelectedRoom(room);
    if (!room) {
      setRoomContent(null);
      return;
    }
    onRoomSelected?.(room);
    try {
      setRoomContentLoading(true);
      const res = await axios.get(`/api/v1/rooms/${room.id}/published_content`);
      setRoomContent(res.data);
    } catch {
      setRoomContent(null);
    } finally {
      setRoomContentLoading(false);
    }
  }, []);

  const activeAccesses = accesses.filter(a => a.status === 'active');
  const vr_tours = roomContent?.vr_tours || [];
  const virtual_stagings = roomContent?.virtual_stagings || [];
  const property_publications = roomContent?.property_publications || [];
  const hasRoomContent = vr_tours.length > 0 || virtual_stagings.length > 0 || property_publications.length > 0;

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
        物件コンテンツのリンクを挿入
      </Typography>

      <RoomSearchField
        value={selectedRoom}
        onChange={handleRoomChange}
      />

      {roomContentLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
          <CircularProgress size={18} />
        </Box>
      )}

      {selectedRoom && !roomContentLoading && hasRoomContent && (
        <List dense disablePadding sx={{ mt: 0.5 }}>
          {vr_tours.map((vt) => (
            <ListItemButton
              key={`vr-${vt.id}`}
              sx={{ py: 0.25, px: 0.5 }}
              onClick={() => onInsertLink(vt.public_url)}
            >
              <ListItemIcon sx={{ minWidth: 24 }}>
                <VrIcon sx={{ fontSize: 14, color: '#1565c0' }} />
              </ListItemIcon>
              <ListItemText
                primary={vt.title}
                primaryTypographyProps={{ variant: 'caption', noWrap: true }}
              />
              <Chip label="VR" size="small" sx={{ height: 16, fontSize: '0.55rem', bgcolor: '#e3f2fd', color: '#1565c0' }} />
            </ListItemButton>
          ))}
          {virtual_stagings.map((vs) => (
            <ListItemButton
              key={`vs-${vs.id}`}
              sx={{ py: 0.25, px: 0.5 }}
              onClick={() => onInsertLink(vs.public_url)}
            >
              <ListItemIcon sx={{ minWidth: 24 }}>
                <StagingIcon sx={{ fontSize: 14, color: '#c62828' }} />
              </ListItemIcon>
              <ListItemText
                primary={vs.title}
                primaryTypographyProps={{ variant: 'caption', noWrap: true }}
              />
              <Chip label="VS" size="small" sx={{ height: 16, fontSize: '0.55rem', bgcolor: '#fce4ec', color: '#c62828' }} />
            </ListItemButton>
          ))}
          {property_publications.map((pp) => (
            <ListItemButton
              key={`pp-${pp.id}`}
              sx={{ py: 0.25, px: 0.5 }}
              onClick={() => onInsertLink(pp.public_url)}
            >
              <ListItemIcon sx={{ minWidth: 24 }}>
                <WebIcon sx={{ fontSize: 14, color: '#2e7d32' }} />
              </ListItemIcon>
              <ListItemText
                primary={pp.title}
                primaryTypographyProps={{ variant: 'caption', noWrap: true }}
              />
              <Chip label="公開" size="small" sx={{ height: 16, fontSize: '0.55rem', bgcolor: '#e8f5e9', color: '#2e7d32' }} />
            </ListItemButton>
          ))}
        </List>
      )}

      {selectedRoom && !roomContentLoading && !hasRoomContent && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', py: 1 }}>
          公開中のコンテンツはありません
        </Typography>
      )}

      {activeAccesses.length > 0 && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
            マイページリンク
          </Typography>
          <List dense disablePadding>
            {activeAccesses.map((access) => {
              const pub = access.property_publication || {};
              const label = [pub.building_name, pub.room_number].filter(Boolean).join(' ');
              const url = `${window.location.origin}/customer/${access.access_token}`;
              return (
                <ListItemButton
                  key={access.id}
                  sx={{ py: 0.25, px: 0.5 }}
                  onClick={() => onInsertLink(url)}
                >
                  <ListItemIcon sx={{ minWidth: 24 }}>
                    <PersonIcon sx={{ fontSize: 14, color: '#e65100' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={pub.title || label || 'マイページ'}
                    primaryTypographyProps={{ variant: 'caption', noWrap: true }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </>
      )}

      {accessesLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
          <CircularProgress size={16} />
        </Box>
      )}
    </Box>
  );
}
