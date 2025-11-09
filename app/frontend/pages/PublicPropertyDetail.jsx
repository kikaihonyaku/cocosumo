import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  CircularProgress,
  Alert,
  Divider,
  Button
} from '@mui/material';
import {
  Home as HomeIcon,
  LocationOn as LocationOnIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import axios from 'axios';
import PhotoGallery from '../components/PropertyPublication/PhotoGallery';
import InquiryForm from '../components/PropertyPublication/InquiryForm';
import ShareButtons from '../components/PropertyPublication/ShareButtons';

function PublicPropertyDetail() {
  const { publicationId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    loadData();
  }, [publicationId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/v1/property_publications/${publicationId}/public`);
      setData(response.data);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('物件情報の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!data) {
    return null;
  }

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
    qr_code_data_url
  } = data;
  const building = room?.building;
  const visibleFields = visible_fields_with_defaults || {};

  // SEO meta tags
  useEffect(() => {
    if (data) {
      // Set page title
      document.title = `${title} | CoCoスモ`;

      // Set meta description
      const description = catch_copy || pr_text?.substring(0, 160) || `${title}の物件情報`;
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
      }
      metaDescription.content = description;

      // Set OG tags for social sharing
      const ogTags = {
        'og:title': title,
        'og:description': description,
        'og:url': public_url,
        'og:type': 'website'
      };

      // Add first photo as og:image if available
      if (property_publication_photos && property_publication_photos.length > 0) {
        const firstPhoto = property_publication_photos[0];
        ogTags['og:image'] = firstPhoto.room_photo?.photo_url || firstPhoto.photo_url;
      }

      Object.entries(ogTags).forEach(([property, content]) => {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          document.head.appendChild(meta);
        }
        meta.content = content;
      });
    }

    // Cleanup function to reset title on unmount
    return () => {
      document.title = 'CoCoスモ';
    };
  }, [data, title, catch_copy, pr_text, public_url, property_publication_photos]);

  // Room type label
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

  // Building type label
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
    <>
      {/* Print-specific styles */}
      <style>{`
        @media print {
          /* Hide elements that shouldn't be printed */
          .no-print {
            display: none !important;
          }

          /* Reset background colors for printing */
          body {
            background: white !important;
          }

          /* Optimize layout for print */
          .print-container {
            max-width: 100% !important;
            padding: 0 !important;
          }

          /* Ensure photos are visible and appropriately sized */
          img {
            max-width: 100% !important;
            page-break-inside: avoid;
          }

          /* Improve table readability */
          table {
            page-break-inside: avoid;
          }

          /* Remove shadows and borders for cleaner print */
          .MuiPaper-root {
            box-shadow: none !important;
            border: 1px solid #ddd !important;
          }

          /* Optimize spacing */
          .print-spacing {
            margin-bottom: 1rem !important;
          }

          /* Hide iframes (VR tours) in print */
          iframe {
            display: none !important;
          }

          /* Show simplified message for interactive content */
          .print-interactive-notice {
            display: block !important;
          }
        }

        /* Hide print notice by default */
        .print-interactive-notice {
          display: none;
        }
      `}</style>

      <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 4 }} className="print-container">
        <Container maxWidth="lg">
        {/* Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            {title}
          </Typography>

          {catch_copy && (
            <Typography variant="h6" color="primary" gutterBottom sx={{ fontWeight: 'medium' }}>
              {catch_copy}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
            {visibleFields.rent && room.rent && (
              <Chip
                icon={<AttachMoneyIcon />}
                label={`賃料: ${room.rent.toLocaleString()}円`}
                color="primary"
                size="medium"
              />
            )}
            {visibleFields.room_type && room.room_type && (
              <Chip
                icon={<HomeIcon />}
                label={getRoomTypeLabel(room.room_type)}
                size="medium"
              />
            )}
            {visibleFields.address && building?.address && (
              <Chip
                icon={<LocationOnIcon />}
                label={building.address}
                size="medium"
              />
            )}
          </Box>
        </Paper>

        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} md={8}>
            {/* Image Gallery */}
            {property_publication_photos && property_publication_photos.length > 0 && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  写真
                </Typography>
                <PhotoGallery photos={property_publication_photos} />
              </Paper>
            )}

            {/* Property Details */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                物件詳細
              </Typography>

              {pr_text && (
                <>
                  <Typography variant="body1" paragraph>
                    {pr_text}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                </>
              )}

              <Table size="small">
                <TableBody>
                  {visibleFields.rent && room.rent && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>賃料</TableCell>
                      <TableCell>{room.rent.toLocaleString()}円</TableCell>
                    </TableRow>
                  )}
                  {visibleFields.management_fee && room.management_fee && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>管理費</TableCell>
                      <TableCell>{room.management_fee.toLocaleString()}円</TableCell>
                    </TableRow>
                  )}
                  {visibleFields.deposit && room.deposit && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>敷金</TableCell>
                      <TableCell>{room.deposit.toLocaleString()}円</TableCell>
                    </TableRow>
                  )}
                  {visibleFields.key_money && room.key_money && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>礼金</TableCell>
                      <TableCell>{room.key_money.toLocaleString()}円</TableCell>
                    </TableRow>
                  )}
                  {visibleFields.room_type && room.room_type && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>間取り</TableCell>
                      <TableCell>{getRoomTypeLabel(room.room_type)}</TableCell>
                    </TableRow>
                  )}
                  {visibleFields.area && room.area && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>専有面積</TableCell>
                      <TableCell>{room.area}m²</TableCell>
                    </TableRow>
                  )}
                  {visibleFields.floor && room.floor && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>階数</TableCell>
                      <TableCell>{room.floor}階</TableCell>
                    </TableRow>
                  )}
                  {visibleFields.building_type && building?.building_type && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>建物種別</TableCell>
                      <TableCell>{getBuildingTypeLabel(building.building_type)}</TableCell>
                    </TableRow>
                  )}
                  {visibleFields.structure && building?.structure && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>構造</TableCell>
                      <TableCell>{building.structure}</TableCell>
                    </TableRow>
                  )}
                  {visibleFields.built_year && building?.built_year && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>築年</TableCell>
                      <TableCell>{building.built_year}年</TableCell>
                    </TableRow>
                  )}
                  {visibleFields.facilities && room.facilities && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>設備</TableCell>
                      <TableCell>{room.facilities}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>

            {/* VR Tour & Virtual Staging */}
            {((property_publication_vr_tours && property_publication_vr_tours.length > 0) ||
              (property_publication_virtual_stagings && property_publication_virtual_stagings.length > 0)) && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  バーチャルコンテンツ
                </Typography>

                {/* VR Tours */}
                {property_publication_vr_tours && property_publication_vr_tours.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    {property_publication_vr_tours.map((item, index) => (
                      <Box key={item.vr_tour.id} sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
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
                            border: '1px solid #e0e0e0',
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
                    {property_publication_virtual_stagings.map((item, index) => (
                      <Box key={item.virtual_staging.id} sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
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
                            border: '1px solid #e0e0e0',
                            borderRadius: 1,
                            mt: 1
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                )}
              </Paper>
            )}
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} md={4}>
            {/* Inquiry Form - Hidden in print */}
            <Paper sx={{ p: 3, mb: 3, position: 'sticky', top: 20 }} className="no-print">
              <InquiryForm publicationId={publicationId} />

              <Divider sx={{ my: 3 }} />

              {/* Share Buttons */}
              <ShareButtons
                url={public_url || window.location.href}
                title={title}
                qrCodeUrl={qr_code_data_url}
              />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
    </>
  );
}

export default PublicPropertyDetail;
