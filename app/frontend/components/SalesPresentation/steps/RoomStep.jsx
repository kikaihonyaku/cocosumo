import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  ImageList,
  ImageListItem,
  Dialog,
  IconButton
} from '@mui/material';
import {
  Home as RoomIcon,
  Close as CloseIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Pets as PetsIcon,
  People as PeopleIcon,
  Business as BusinessIcon
} from '@mui/icons-material';

const ROOM_TYPE_LABELS = {
  studio: 'ワンルーム',
  '1K': '1K',
  '1DK': '1DK',
  '1LDK': '1LDK',
  '2K': '2K',
  '2DK': '2DK',
  '2LDK': '2LDK',
  '3K': '3K',
  '3DK': '3DK',
  '3LDK': '3LDK',
  other: 'その他'
};

const formatCurrency = (value) => {
  if (!value && value !== 0) return '-';
  return `${Number(value).toLocaleString()}円`;
};

export default function RoomStep({ property, config, isMobile }) {
  const { room, publication, photos } = property;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const roomInfo = [
    { label: '部屋番号', value: room?.room_number ? `${room.room_number}号室` : null },
    { label: '階数', value: room?.floor ? `${room.floor}階` : null },
    { label: '間取り', value: ROOM_TYPE_LABELS[room?.room_type] || room?.room_type },
    { label: '専有面積', value: room?.area ? `${room.area}㎡` : null },
    { label: '向き', value: room?.direction }
  ].filter(item => item.value);

  const costInfo = [
    { label: '賃料', value: formatCurrency(room?.rent), highlight: true },
    { label: '管理費', value: formatCurrency(room?.management_fee) },
    { label: '敷金', value: formatCurrency(room?.deposit) },
    { label: '礼金', value: formatCurrency(room?.key_money) },
    { label: '更新料', value: room?.renewal_fee ? formatCurrency(room.renewal_fee) : null },
    { label: '駐車料金', value: room?.parking_fee ? formatCurrency(room.parking_fee) : null }
  ].filter(item => item.value && item.value !== '-');

  const conditions = [
    { icon: <PetsIcon />, label: 'ペット可', available: room?.pets_allowed },
    { icon: <PeopleIcon />, label: '2人入居可', available: room?.two_person_allowed },
    { icon: <BusinessIcon />, label: '事務所利用可', available: room?.office_use_allowed }
  ].filter(item => item.available);

  const handlePhotoClick = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handlePrevPhoto = () => {
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNextPhoto = () => {
    setLightboxIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <RoomIcon color="primary" />
        部屋情報
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        お部屋の詳細情報と写真をご案内します
      </Typography>

      {/* 写真ギャラリー */}
      {photos && photos.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            室内写真
          </Typography>
          <ImageList
            cols={isMobile ? 2 : 4}
            gap={8}
            sx={{ mt: 1, mb: 0 }}
          >
            {photos.slice(0, 8).map((photo, index) => (
              <ImageListItem
                key={photo.id || index}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 1,
                  overflow: 'hidden',
                  '&:hover': { opacity: 0.9 }
                }}
                onClick={() => handlePhotoClick(index)}
              >
                <img
                  src={photo.url}
                  alt={photo.alt_text || `写真 ${index + 1}`}
                  loading="lazy"
                  style={{ aspectRatio: '4/3', objectFit: 'cover' }}
                />
              </ImageListItem>
            ))}
          </ImageList>
          {photos.length > 8 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              +{photos.length - 8}枚の写真
            </Typography>
          )}
        </Paper>
      )}

      <Grid container spacing={3}>
        {/* 部屋情報 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              基本情報
            </Typography>
            <Table size="small">
              <TableBody>
                {roomInfo.map((info, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ fontWeight: 'bold', width: '40%', bgcolor: 'grey.50' }}>
                      {info.label}
                    </TableCell>
                    <TableCell>{info.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* 費用情報 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              費用
            </Typography>
            <Table size="small">
              <TableBody>
                {costInfo.map((info, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ fontWeight: 'bold', width: '40%', bgcolor: 'grey.50' }}>
                      {info.label}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: info.highlight ? 'bold' : 'normal',
                        fontSize: info.highlight ? '1.1rem' : 'inherit',
                        color: info.highlight ? 'primary.main' : 'inherit'
                      }}
                    >
                      {info.value}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* 条件 */}
        {conditions.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                入居条件
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {conditions.map((condition, index) => (
                  <Chip
                    key={index}
                    icon={condition.icon}
                    label={condition.label}
                    color="success"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Paper>
          </Grid>
        )}

        {/* 設備 */}
        {room?.facilities && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                設備
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {room.facilities}
              </Typography>
            </Paper>
          </Grid>
        )}

        {/* PR文 */}
        {publication?.pr_text && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2, bgcolor: 'primary.50' }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold" color="primary">
                おすすめポイント
              </Typography>
              <Typography
                variant="body1"
                dangerouslySetInnerHTML={{ __html: publication.pr_text }}
              />
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* ライトボックス */}
      <Dialog
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <Box sx={{ position: 'relative', bgcolor: 'black' }}>
          <IconButton
            onClick={() => setLightboxOpen(false)}
            sx={{ position: 'absolute', top: 8, right: 8, color: 'white', zIndex: 1 }}
          >
            <CloseIcon />
          </IconButton>

          {photos && photos[lightboxIndex] && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 400
              }}
            >
              <IconButton
                onClick={handlePrevPhoto}
                sx={{ position: 'absolute', left: 8, color: 'white' }}
              >
                <PrevIcon fontSize="large" />
              </IconButton>

              <img
                src={photos[lightboxIndex].url}
                alt={photos[lightboxIndex].alt_text || '写真'}
                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
              />

              <IconButton
                onClick={handleNextPhoto}
                sx={{ position: 'absolute', right: 8, color: 'white' }}
              >
                <NextIcon fontSize="large" />
              </IconButton>
            </Box>
          )}

          <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.7)', color: 'white', textAlign: 'center' }}>
            <Typography variant="body2">
              {lightboxIndex + 1} / {photos?.length || 0}
            </Typography>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}
