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
  Divider,
  Card,
  CardContent
} from '@mui/material';
import {
  Home as HomeIcon,
  LocationOn as LocationOnIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import PhotoGallery from '../PhotoGallery';
import InquiryForm from '../InquiryForm';
import ShareButtons from '../ShareButtons';

function Template2({ data, publicationId }) {
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
    <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh' }} className="print-container">
      {/* Hero Section with Full-width Photo Gallery */}
      {property_publication_photos && property_publication_photos.length > 0 && (
        <Box sx={{ bgcolor: '#1a1a1a', color: '#fff', mb: 4 }}>
          <Container maxWidth="xl" disableGutters>
            <PhotoGallery photos={property_publication_photos} />
          </Container>
        </Box>
      )}

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Modern Title Section with gradient accent */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: '700',
              color: '#1a1a1a',
              letterSpacing: '-0.02em',
              mb: 2
            }}
          >
            {title}
          </Typography>

          {catch_copy && (
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: '500',
                color: '#666',
                mb: 4,
                pb: 2,
                borderBottom: '3px solid',
                borderImage: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%) 1'
              }}
            >
              {catch_copy}
            </Typography>
          )}

          {/* Modern Key Information Cards with shadow */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {visibleFields.rent && room.rent && (
              <Grid size={{ xs: 12, sm: 4 }}>
                <Card
                  elevation={0}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-4px)' }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <AttachMoneyIcon sx={{ fontSize: 48, mb: 1 }} />
                    <Typography variant="caption" display="block" sx={{ opacity: 0.9, mb: 1 }}>
                      賃料
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {room.rent.toLocaleString()}円
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
            {visibleFields.room_type && room.room_type && (
              <Grid size={{ xs: 12, sm: 4 }}>
                <Card
                  elevation={0}
                  sx={{
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-4px)' }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <HomeIcon sx={{ fontSize: 48, mb: 1 }} />
                    <Typography variant="caption" display="block" sx={{ opacity: 0.9, mb: 1 }}>
                      間取り
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {getRoomTypeLabel(room.room_type)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
            {visibleFields.area && room.area && (
              <Grid size={{ xs: 12, sm: 4 }}>
                <Card
                  elevation={0}
                  sx={{
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-4px)' }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <HomeIcon sx={{ fontSize: 48, mb: 1 }} />
                    <Typography variant="caption" display="block" sx={{ opacity: 0.9, mb: 1 }}>
                      専有面積
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {room.area}m²
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>

          {visibleFields.address && building?.address && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 2,
                bgcolor: 'white',
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}
            >
              <LocationOnIcon sx={{ color: '#1976d2' }} />
              <Typography variant="body1" fontWeight="500" color="text.primary">
                {building.address}
              </Typography>
            </Box>
          )}
        </Box>

        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* PR Text with modern styling */}
            {pr_text && (
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  mb: 3,
                  borderRadius: 3,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  background: 'linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%)'
                }}
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  fontWeight="bold"
                  sx={{
                    color: '#1a1a1a',
                    mb: 2,
                    pb: 1,
                    borderBottom: '2px solid #1976d2'
                  }}
                >
                  物件の特徴
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.9, color: '#555' }}>
                  {pr_text}
                </Typography>
              </Paper>
            )}

            {/* Property Details with modern card design */}
            <Paper
              elevation={0}
              sx={{
                mb: 3,
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
              }}
            >
              <Box sx={{ bgcolor: '#1976d2', color: 'white', p: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  物件詳細
                </Typography>
              </Box>

              <Table>
                <TableBody>
                  {visibleFields.rent && room.rent && (
                    <TableRow sx={{ '&:hover': { bgcolor: '#f5f9ff' } }}>
                      <TableCell sx={{ fontWeight: 'bold', width: '40%', py: 2.5, borderBottom: '1px solid #e8e8e8' }}>
                        賃料
                      </TableCell>
                      <TableCell sx={{ py: 2.5, borderBottom: '1px solid #e8e8e8', color: '#1976d2', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {room.rent.toLocaleString()}円
                      </TableCell>
                    </TableRow>
                  )}
                  {visibleFields.management_fee && room.management_fee && (
                    <TableRow sx={{ '&:hover': { bgcolor: '#f5f9ff' } }}>
                      <TableCell sx={{ fontWeight: 'bold', py: 2.5, borderBottom: '1px solid #e8e8e8' }}>
                        管理費
                      </TableCell>
                      <TableCell sx={{ py: 2.5, borderBottom: '1px solid #e8e8e8' }}>
                        {room.management_fee.toLocaleString()}円
                      </TableCell>
                    </TableRow>
                  )}
                  {visibleFields.deposit && room.deposit && (
                    <TableRow sx={{ '&:hover': { bgcolor: '#f5f9ff' } }}>
                      <TableCell sx={{ fontWeight: 'bold', py: 2.5, borderBottom: '1px solid #e8e8e8' }}>
                        敷金
                      </TableCell>
                      <TableCell sx={{ py: 2.5, borderBottom: '1px solid #e8e8e8' }}>
                        {room.deposit.toLocaleString()}円
                      </TableCell>
                    </TableRow>
                  )}
                  {visibleFields.key_money && room.key_money && (
                    <TableRow sx={{ '&:hover': { bgcolor: '#f5f9ff' } }}>
                      <TableCell sx={{ fontWeight: 'bold', py: 2.5, borderBottom: '1px solid #e8e8e8' }}>
                        礼金
                      </TableCell>
                      <TableCell sx={{ py: 2.5, borderBottom: '1px solid #e8e8e8' }}>
                        {room.key_money.toLocaleString()}円
                      </TableCell>
                    </TableRow>
                  )}
                  {visibleFields.room_type && room.room_type && (
                    <TableRow sx={{ '&:hover': { bgcolor: '#f5f9ff' } }}>
                      <TableCell sx={{ fontWeight: 'bold', py: 2.5, borderBottom: '1px solid #e8e8e8' }}>
                        間取り
                      </TableCell>
                      <TableCell sx={{ py: 2.5, borderBottom: '1px solid #e8e8e8' }}>
                        {getRoomTypeLabel(room.room_type)}
                      </TableCell>
                    </TableRow>
                  )}
                  {visibleFields.area && room.area && (
                    <TableRow sx={{ '&:hover': { bgcolor: '#f5f9ff' } }}>
                      <TableCell sx={{ fontWeight: 'bold', py: 2.5, borderBottom: '1px solid #e8e8e8' }}>
                        専有面積
                      </TableCell>
                      <TableCell sx={{ py: 2.5, borderBottom: '1px solid #e8e8e8' }}>
                        {room.area}m²
                      </TableCell>
                    </TableRow>
                  )}
                  {visibleFields.floor && room.floor && (
                    <TableRow sx={{ '&:hover': { bgcolor: '#f5f9ff' } }}>
                      <TableCell sx={{ fontWeight: 'bold', py: 2.5, borderBottom: '1px solid #e8e8e8' }}>
                        階数
                      </TableCell>
                      <TableCell sx={{ py: 2.5, borderBottom: '1px solid #e8e8e8' }}>
                        {room.floor}階
                      </TableCell>
                    </TableRow>
                  )}
                  {visibleFields.building_type && building?.building_type && (
                    <TableRow sx={{ '&:hover': { bgcolor: '#f5f9ff' } }}>
                      <TableCell sx={{ fontWeight: 'bold', py: 2.5, borderBottom: '1px solid #e8e8e8' }}>
                        建物種別
                      </TableCell>
                      <TableCell sx={{ py: 2.5, borderBottom: '1px solid #e8e8e8' }}>
                        {getBuildingTypeLabel(building.building_type)}
                      </TableCell>
                    </TableRow>
                  )}
                  {visibleFields.structure && building?.structure && (
                    <TableRow sx={{ '&:hover': { bgcolor: '#f5f9ff' } }}>
                      <TableCell sx={{ fontWeight: 'bold', py: 2.5, borderBottom: '1px solid #e8e8e8' }}>
                        構造
                      </TableCell>
                      <TableCell sx={{ py: 2.5, borderBottom: '1px solid #e8e8e8' }}>
                        {building.structure}
                      </TableCell>
                    </TableRow>
                  )}
                  {visibleFields.built_year && building?.built_year && (
                    <TableRow sx={{ '&:hover': { bgcolor: '#f5f9ff' } }}>
                      <TableCell sx={{ fontWeight: 'bold', py: 2.5, borderBottom: '1px solid #e8e8e8' }}>
                        築年
                      </TableCell>
                      <TableCell sx={{ py: 2.5, borderBottom: '1px solid #e8e8e8' }}>
                        {building.built_year}年
                      </TableCell>
                    </TableRow>
                  )}
                  {visibleFields.facilities && room.facilities && (
                    <TableRow sx={{ '&:hover': { bgcolor: '#f5f9ff' } }}>
                      <TableCell sx={{ fontWeight: 'bold', py: 2.5, borderBottom: 'none' }}>
                        設備
                      </TableCell>
                      <TableCell sx={{ py: 2.5, borderBottom: 'none' }}>
                        {room.facilities}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>

            {/* VR Tour & Virtual Staging with modern styling */}
            {((property_publication_vr_tours && property_publication_vr_tours.length > 0) ||
              (property_publication_virtual_stagings && property_publication_virtual_stagings.length > 0)) && (
              <Paper
                elevation={0}
                sx={{
                  mb: 3,
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
                }}
              >
                <Box sx={{ bgcolor: '#1976d2', color: 'white', p: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    バーチャルコンテンツ
                  </Typography>
                </Box>

                <Box sx={{ p: 3 }}>

                  {property_publication_vr_tours && property_publication_vr_tours.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      {property_publication_vr_tours.map((item) => (
                        <Box key={item.vr_tour.id} sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: '#1976d2' }}>
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
                              border: '2px solid #1976d2',
                              borderRadius: 2,
                              mt: 1
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  )}

                  {property_publication_virtual_stagings && property_publication_virtual_stagings.length > 0 && (
                    <Box>
                      {property_publication_virtual_stagings.map((item) => (
                        <Box key={item.virtual_staging.id} sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: '#1976d2' }}>
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
                              border: '2px solid #1976d2',
                              borderRadius: 2,
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

          {/* Right Column - Modern sticky sidebar */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper
              elevation={0}
              sx={{
                mb: 3,
                position: 'sticky',
                top: 20,
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }}
              className="no-print"
            >
              <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', p: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  お問い合わせ
                </Typography>
              </Box>
              <Box sx={{ p: 3 }}>
                <InquiryForm publicationId={publicationId} />
              </Box>

              <Divider />

              <Box sx={{ p: 3, bgcolor: '#f8f9fa' }}>
                <ShareButtons
                  url={public_url || window.location.href}
                  title={title}
                  qrCodeUrl={qr_code_data_url}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Template2;
