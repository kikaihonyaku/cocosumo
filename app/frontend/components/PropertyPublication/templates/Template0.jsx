import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Divider
} from '@mui/material';
import {
  Home as HomeIcon,
  LocationOn as LocationOnIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import PhotoGallery from '../PhotoGallery';
import InquiryForm from '../InquiryForm';
import ShareButtons from '../ShareButtons';
import FavoriteButton from '../FavoriteButton';
import PdfExportButton from '../PdfExportButton';
import CompareButton from '../CompareButton';

function Template0({ data, publicationId }) {
  const {
    room,
    title,
    catch_copy,
    pr_text,
    visible_fields_with_defaults,
    property_publication_photos,
    property_publication_vr_tours,
    property_publication_virtual_stagings,
    public_url,
    qr_code_data_url,
    primary_color,
    accent_color
  } = data;
  const building = room?.building;
  const visibleFields = visible_fields_with_defaults || {};

  // カスタムカラー（デフォルト値付き）
  const colors = {
    primary: primary_color || '#0068b7',
    accent: accent_color || '#e3f2fd'
  };

  const getRoomTypeLabel = (roomType) => {
    const labels = {
      'studio': 'ワンルーム',
      '1K': '1K',
      '1DK': '1DK',
      '1LDK': '1LDK',
      '2K': '2K',
      '2DK': '2DK',
      '2LDK': '2LDK',
      '3K': '3K',
      '3DK': '3DK',
      '3LDK': '3LDK',
      'other': 'その他'
    };
    return labels[roomType] || roomType;
  };

  const getBuildingTypeLabel = (buildingType) => {
    const labels = {
      'apartment': 'アパート',
      'mansion': 'マンション',
      'house': '一戸建て',
      'office': 'オフィス'
    };
    return labels[buildingType] || buildingType;
  };

  return (
    <Box sx={{ bgcolor: '#f9f9f9', minHeight: '100vh', py: 3 }} className="print-container">
      <Container maxWidth="lg">
        {/* SUUMO-style Header with prominent rent display */}
        <Paper sx={{ mb: 3, overflow: 'hidden' }}>
          {/* Title Section */}
          <Box sx={{ bgcolor: colors.primary, color: 'white', px: 3, py: 2 }}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
              {title}
            </Typography>
            {visibleFields.address && building?.address && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                <LocationOnIcon sx={{ fontSize: 18 }} />
                <Typography variant="body2">
                  {building.address}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Rent Display - SUUMO style prominent */}
          <Box sx={{ bgcolor: 'white', px: 3, py: 3 }}>
            {visibleFields.rent && room.rent && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="h3" component="div" sx={{
                  color: colors.primary,
                  fontWeight: 'bold',
                  mb: 1
                }}>
                  {room.rent.toLocaleString()}円
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  賃料
                </Typography>
              </Box>
            )}

            {catch_copy && (
              <Typography variant="body1" sx={{
                color: '#333',
                fontWeight: 'medium',
                borderLeft: `4px solid ${colors.primary}`,
                pl: 2,
                my: 2
              }}>
                {catch_copy}
              </Typography>
            )}

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
              {visibleFields.room_type && room.room_type && (
                <Chip
                  label={getRoomTypeLabel(room.room_type)}
                  size="small"
                  sx={{ bgcolor: colors.accent }}
                />
              )}
              {visibleFields.area && room.area && (
                <Chip
                  label={`${room.area}m²`}
                  size="small"
                  sx={{ bgcolor: colors.accent }}
                />
              )}
              {visibleFields.floor && room.floor && (
                <Chip
                  label={`${room.floor}階`}
                  size="small"
                  sx={{ bgcolor: colors.accent }}
                />
              )}
            </Box>
          </Box>
        </Paper>

        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Image Gallery - SUUMO style with white background */}
            {property_publication_photos && property_publication_photos.length > 0 && (
              <Paper id="gallery" sx={{ mb: 3, overflow: 'hidden' }}>
                <Box sx={{ bgcolor: colors.primary, color: 'white', px: 2, py: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    写真（{property_publication_photos.length}点）
                  </Typography>
                </Box>
                <Box sx={{ p: 2 }}>
                  <PhotoGallery photos={property_publication_photos} />
                </Box>
              </Paper>
            )}

            {/* PR Text Section */}
            {pr_text && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: colors.primary, fontWeight: 'bold', borderBottom: `3px solid ${colors.primary}`, pb: 1, mb: 2 }}>
                  物件の特徴
                </Typography>
                <Box
                  sx={{
                    lineHeight: 1.8,
                    '& p': { margin: '0 0 0.5em 0' },
                    '& h2': { fontSize: '1.25rem', fontWeight: 600, margin: '1em 0 0.5em 0' },
                    '& h3': { fontSize: '1.1rem', fontWeight: 600, margin: '1em 0 0.5em 0' },
                    '& ul, & ol': { paddingLeft: '1.5em', margin: '0.5em 0' },
                    '& li': { margin: '0.25em 0' },
                    '& blockquote': {
                      borderLeft: '3px solid #e0e0e0',
                      paddingLeft: '1em',
                      margin: '0.5em 0',
                      color: 'text.secondary',
                      fontStyle: 'italic',
                    },
                    '& a': { color: colors.primary, textDecoration: 'underline' },
                  }}
                  dangerouslySetInnerHTML={{ __html: pr_text }}
                />
              </Paper>
            )}

            {/* Property Details - SUUMO style striped table */}
            <Paper id="property-info" sx={{ mb: 3, overflow: 'hidden' }}>
              <Box sx={{ bgcolor: colors.primary, color: 'white', px: 2, py: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  物件詳細
                </Typography>
              </Box>

              <Table>
                <TableBody>
                  {visibleFields.rent && room.rent && (
                    <TableRow sx={{ bgcolor: '#fafafa' }}>
                      <TableCell sx={{ fontWeight: 'bold', width: '35%', py: 2, borderBottom: '1px solid #e0e0e0' }}>賃料</TableCell>
                      <TableCell sx={{ py: 2, borderBottom: '1px solid #e0e0e0', color: colors.primary, fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {room.rent.toLocaleString()}円
                      </TableCell>
                    </TableRow>
                  )}
                  {visibleFields.management_fee && room.management_fee && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', py: 2, borderBottom: '1px solid #e0e0e0' }}>管理費</TableCell>
                      <TableCell sx={{ py: 2, borderBottom: '1px solid #e0e0e0' }}>{room.management_fee.toLocaleString()}円</TableCell>
                    </TableRow>
                  )}
                  {visibleFields.deposit && room.deposit && (
                    <TableRow sx={{ bgcolor: '#fafafa' }}>
                      <TableCell sx={{ fontWeight: 'bold', py: 2, borderBottom: '1px solid #e0e0e0' }}>敷金</TableCell>
                      <TableCell sx={{ py: 2, borderBottom: '1px solid #e0e0e0' }}>{room.deposit.toLocaleString()}円</TableCell>
                    </TableRow>
                  )}
                  {visibleFields.key_money && room.key_money && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', py: 2, borderBottom: '1px solid #e0e0e0' }}>礼金</TableCell>
                      <TableCell sx={{ py: 2, borderBottom: '1px solid #e0e0e0' }}>{room.key_money.toLocaleString()}円</TableCell>
                    </TableRow>
                  )}
                  {visibleFields.room_type && room.room_type && (
                    <TableRow sx={{ bgcolor: '#fafafa' }}>
                      <TableCell sx={{ fontWeight: 'bold', py: 2, borderBottom: '1px solid #e0e0e0' }}>間取り</TableCell>
                      <TableCell sx={{ py: 2, borderBottom: '1px solid #e0e0e0' }}>{getRoomTypeLabel(room.room_type)}</TableCell>
                    </TableRow>
                  )}
                  {visibleFields.area && room.area && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', py: 2, borderBottom: '1px solid #e0e0e0' }}>専有面積</TableCell>
                      <TableCell sx={{ py: 2, borderBottom: '1px solid #e0e0e0' }}>{room.area}m²</TableCell>
                    </TableRow>
                  )}
                  {visibleFields.floor && room.floor && (
                    <TableRow sx={{ bgcolor: '#fafafa' }}>
                      <TableCell sx={{ fontWeight: 'bold', py: 2, borderBottom: '1px solid #e0e0e0' }}>階数</TableCell>
                      <TableCell sx={{ py: 2, borderBottom: '1px solid #e0e0e0' }}>{room.floor}階</TableCell>
                    </TableRow>
                  )}
                  {visibleFields.building_type && building?.building_type && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', py: 2, borderBottom: '1px solid #e0e0e0' }}>建物種別</TableCell>
                      <TableCell sx={{ py: 2, borderBottom: '1px solid #e0e0e0' }}>{getBuildingTypeLabel(building.building_type)}</TableCell>
                    </TableRow>
                  )}
                  {visibleFields.structure && building?.structure && (
                    <TableRow sx={{ bgcolor: '#fafafa' }}>
                      <TableCell sx={{ fontWeight: 'bold', py: 2, borderBottom: '1px solid #e0e0e0' }}>構造</TableCell>
                      <TableCell sx={{ py: 2, borderBottom: '1px solid #e0e0e0' }}>{building.structure}</TableCell>
                    </TableRow>
                  )}
                  {visibleFields.built_year && building?.built_year && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', py: 2, borderBottom: '1px solid #e0e0e0' }}>築年</TableCell>
                      <TableCell sx={{ py: 2, borderBottom: '1px solid #e0e0e0' }}>{building.built_year}年</TableCell>
                    </TableRow>
                  )}
                  {visibleFields.facilities && room.facilities && (
                    <TableRow sx={{ bgcolor: '#fafafa' }}>
                      <TableCell sx={{ fontWeight: 'bold', py: 2, borderBottom: 'none' }}>設備</TableCell>
                      <TableCell sx={{ py: 2, borderBottom: 'none' }}>{room.facilities}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>

            {/* VR Tour & Virtual Staging - SUUMO style */}
            {((property_publication_vr_tours && property_publication_vr_tours.length > 0) ||
              (property_publication_virtual_stagings && property_publication_virtual_stagings.length > 0)) && (
              <Paper id="vr-tour" sx={{ mb: 3, overflow: 'hidden' }}>
                <Box sx={{ bgcolor: colors.primary, color: 'white', px: 2, py: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    バーチャル内覧
                  </Typography>
                </Box>

                <Box sx={{ p: 2 }}>
                  {/* VR Tours */}
                  {property_publication_vr_tours && property_publication_vr_tours.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      {property_publication_vr_tours.map((item) => (
                        <Box key={item.vr_tour.id} sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: colors.primary }}>
                            VRツアー: {item.vr_tour.title}
                          </Typography>
                          {item.vr_tour.description && (
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {item.vr_tour.description}
                            </Typography>
                          )}
                          <Box
                            component="iframe"
                            src={`/vr/${item.vr_tour.public_id}`}
                            sx={{
                              width: '100%',
                              height: 500,
                              border: `2px solid ${colors.primary}`,
                              borderRadius: 1,
                              mt: 1
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  )}

                  {/* Virtual Stagings */}
                  {property_publication_virtual_stagings && property_publication_virtual_stagings.length > 0 && (
                    <Box>
                      {property_publication_virtual_stagings.map((item) => (
                        <Box key={item.virtual_staging.id} sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: colors.primary }}>
                            バーチャルステージング: {item.virtual_staging.title}
                          </Typography>
                          {item.virtual_staging.description && (
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {item.virtual_staging.description}
                            </Typography>
                          )}
                          <Box
                            component="iframe"
                            src={`/virtual-staging/${item.virtual_staging.public_id}`}
                            sx={{
                              width: '100%',
                              height: 500,
                              border: `2px solid ${colors.primary}`,
                              borderRadius: 1,
                              mt: 1
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </Paper>
            )}
          </Grid>

          {/* Right Column - SUUMO style */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper id="inquiry" sx={{ mb: 3, position: 'sticky', top: 20, overflow: 'hidden' }} className="no-print">
              <Box sx={{ bgcolor: colors.primary, color: 'white', px: 2, py: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  お問い合わせ
                </Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                <InquiryForm publicationId={publicationId} />
              </Box>

              <Divider />

              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <ShareButtons
                  url={public_url || window.location.href}
                  title={title}
                  qrCodeUrl={qr_code_data_url}
                  publicationId={publicationId}
                />
                <FavoriteButton
                  publicationId={publicationId}
                  title={title}
                  catchCopy={catch_copy}
                  thumbnailUrl={property_publication_photos?.[0]?.room_photo?.photo_url}
                  address={building?.address}
                  rent={room?.rent}
                  roomType={room?.room_type}
                  area={room?.area}
                  size="large"
                />
                <CompareButton
                  publicationId={publicationId}
                  title={title}
                  catchCopy={catch_copy}
                  thumbnailUrl={property_publication_photos?.[0]?.room_photo?.photo_url}
                  address={building?.address}
                  rent={room?.rent}
                  managementFee={room?.management_fee}
                  deposit={room?.deposit}
                  keyMoney={room?.key_money}
                  roomType={room?.room_type}
                  area={room?.area}
                  floor={room?.floor}
                  builtYear={building?.built_year}
                  buildingType={building?.building_type}
                  structure={building?.structure}
                  facilities={room?.facilities}
                  size="large"
                />
                <PdfExportButton
                  title={title}
                  publicationId={publicationId}
                  size="large"
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Template0;
