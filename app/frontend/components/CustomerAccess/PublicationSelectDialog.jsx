import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  CircularProgress,
  Box,
  Alert,
  Chip
} from '@mui/material';
import axios from 'axios';

export default function PublicationSelectDialog({ open, onClose, roomId, onSelect }) {
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !roomId) return;

    const fetchPublications = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/v1/rooms/${roomId}/property_publications`);
        const data = response.data;
        setPublications(Array.isArray(data) ? data : data.publications || []);
      } catch (err) {
        console.error('Failed to load publications:', err);
        setError('公開ページの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchPublications();
  }, [open, roomId]);

  const handleSelect = (publication) => {
    onSelect(publication);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>公開ページを選択</DialogTitle>
      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        {!loading && !error && publications.length === 0 && (
          <Alert severity="info">
            この部屋の公開ページがありません。先に公開ページを作成してください。
          </Alert>
        )}

        {!loading && publications.length > 0 && (
          <List disablePadding>
            {publications.map((pub) => (
              <ListItemButton
                key={pub.id}
                onClick={() => handleSelect(pub)}
                sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
              >
                <ListItemText
                  primary={pub.title || `公開ページ #${pub.id}`}
                  secondaryTypographyProps={{ component: 'div' }}
                  secondary={
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center' }}>
                      {pub.status && (
                        <Chip
                          size="small"
                          label={pub.status === 'published' ? '公開中' : '下書き'}
                          color={pub.status === 'published' ? 'success' : 'default'}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                      {pub.publication_id && (
                        <Typography variant="caption" color="text.secondary">
                          ID: {pub.publication_id}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
      </DialogActions>
    </Dialog>
  );
}
