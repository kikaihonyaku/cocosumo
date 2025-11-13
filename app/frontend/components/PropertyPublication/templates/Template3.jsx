import React, { useState } from 'react';
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab
} from '@mui/material';
import {
  Home as HomeIcon,
  LocationOn as LocationOnIcon,
  AttachMoney as AttachMoneyIcon,
  CheckCircle as CheckCircleIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import PhotoGallery from '../PhotoGallery';
import InquiryForm from '../InquiryForm';
import ShareButtons from '../ShareButtons';

function Template3({ data, publicationId }) {
  const [activeTab, setActiveTab] = useState(0);

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
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh' }} className="print-container">
      {/* H-Sys style Header with Contact Info */}
      <Box sx={{ bgcolor: '#2e7d32', color: 'white', py: 1.5, px: 2 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2">
              物件詳細ページ
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon sx={{ fontSize: 18 }} />
              <Typography variant="body2" fontWeight="bold">
                お問い合わせ: 営業時間 10:00～18:00
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Title and Rent Highlight */}
        <Paper sx={{ mb: 3, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>
              {title}
            </Typography>

            {visibleFields.address && building?.address && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <LocationOnIcon sx={{ color: '#2e7d32', fontSize: 20 }} />
                <Typography variant="body1" color="text.secondary">
                  {building.address}
                </Typography>
              </Box>
            )}

            {/* Prominent Rent Display - H-Sys style */}
            {visibleFields.rent && room.rent && (
              <Box
                sx={{
                  bgcolor: '#fff3e0',
                  border: '2px solid #ff9800',
                  borderRadius: 2,
                  p: 2,
                  mb: 2,
                  display: 'inline-block'
                }}
              >
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>
                  賃料
                </Typography>
                <Typography variant="h3" sx={{ color: '#e65100', fontWeight: 'bold' }}>
                  {room.rent.toLocaleString()}円
                </Typography>
              </Box>
            )}

            {catch_copy && (
              <Typography variant="h6" sx={{
                color: '#555',
                fontWeight: 'medium',
                mt: 2,
                p: 2,
                bgcolor: '#f9fbe7',
                borderLeft: '4px solid #4caf50'
              }}>
                {catch_copy}
              </Typography>
            )}

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
              {visibleFields.room_type && room.room_type && (
                <Chip
                  icon={<HomeIcon />}
                  label={getRoomTypeLabel(room.room_type)}
                  size="medium"
                  sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 'bold' }}
                />
              )}
              {visibleFields.area && room.area && (
                <Chip
                  label={`${room.area}m²`}
                  size="medium"
                  sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 'bold' }}
                />
              )}
              {visibleFields.floor && room.floor && (
                <Chip
                  label={`${room.floor}階`}
                  size="medium"
                  sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 'bold' }}
                />
              )}
            </Box>
          </Box>

          {/* Tab Interface - H-Sys style */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{
                bgcolor: '#fafafa',
                '& .MuiTab-root': {
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  color: '#666'
                },
                '& .Mui-selected': {
                  color: '#2e7d32'
                },
                '& .MuiTabs-indicator': {
                  bgcolor: '#2e7d32',
                  height: 3
                }
              }}
            >
              <Tab label="物件情報" />
              <Tab label="写真" />
              <Tab label="バーチャル内覧" disabled={!((property_publication_vr_tours && property_publication_vr_tours.length > 0) || (property_publication_virtual_stagings && property_publication_virtual_stagings.length > 0))} />
            </Tabs>
          </Box>
        </Paper>

        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Tab Content */}
            <Box sx={{ minHeight: 400 }}>
              {/* Tab 0: Property Information */}
              {activeTab === 0 && (
                <>
                  {/* PR Text */}
                  {pr_text && (
                    <Paper sx={{ p: 3, mb: 3, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                      <Typography variant="h6" gutterBottom sx={{ color: '#2e7d32', fontWeight: 'bold', borderBottom: '2px solid #4caf50', pb: 1 }}>
                        物件のポイント
                      </Typography>
                      <Typography variant="body1" sx={{ lineHeight: 1.9, mt: 2, whiteSpace: 'pre-line' }}>
                        {pr_text}
                      </Typography>
                    </Paper>
                  )}

            {/* Property Details - Detailed Layout */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#2e7d32', fontWeight: 'bold', mb: 3 }}>
                物件詳細情報
              </Typography>

              {/* Basic Information */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: '#555', borderBottom: '2px solid #4caf50', pb: 1 }}>
                  基本情報
                </Typography>
                <Table size="small" sx={{ mt: 2 }}>
                  <TableBody>
                    {visibleFields.room_type && room.room_type && (
                      <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <TableCell sx={{ fontWeight: 'bold', width: '35%', bgcolor: '#f9f9f9' }}>
                          間取り
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'medium' }}>
                          {getRoomTypeLabel(room.room_type)}
                        </TableCell>
                      </TableRow>
                    )}
                    {visibleFields.area && room.area && (
                      <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f9f9f9' }}>
                          専有面積
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'medium' }}>
                          {room.area}m²
                        </TableCell>
                      </TableRow>
                    )}
                    {visibleFields.floor && room.floor && (
                      <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f9f9f9' }}>
                          所在階
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'medium' }}>
                          {room.floor}階
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>

              {/* Financial Information */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: '#555', borderBottom: '2px solid #4caf50', pb: 1 }}>
                  費用
                </Typography>
                <Table size="small" sx={{ mt: 2 }}>
                  <TableBody>
                    {visibleFields.rent && room.rent && (
                      <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <TableCell sx={{ fontWeight: 'bold', width: '35%', bgcolor: '#f9f9f9' }}>
                          賃料
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'medium', color: '#2e7d32', fontSize: '1.1rem' }}>
                          {room.rent.toLocaleString()}円
                        </TableCell>
                      </TableRow>
                    )}
                    {visibleFields.management_fee && room.management_fee && (
                      <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f9f9f9' }}>
                          管理費
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'medium' }}>
                          {room.management_fee.toLocaleString()}円
                        </TableCell>
                      </TableRow>
                    )}
                    {visibleFields.deposit && room.deposit && (
                      <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f9f9f9' }}>
                          敷金
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'medium' }}>
                          {room.deposit.toLocaleString()}円
                        </TableCell>
                      </TableRow>
                    )}
                    {visibleFields.key_money && room.key_money && (
                      <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f9f9f9' }}>
                          礼金
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'medium' }}>
                          {room.key_money.toLocaleString()}円
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>

              {/* Building Information */}
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: '#555', borderBottom: '2px solid #4caf50', pb: 1 }}>
                  建物情報
                </Typography>
                <Table size="small" sx={{ mt: 2 }}>
                  <TableBody>
                    {visibleFields.building_type && building?.building_type && (
                      <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <TableCell sx={{ fontWeight: 'bold', width: '35%', bgcolor: '#f9f9f9' }}>
                          建物種別
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'medium' }}>
                          {getBuildingTypeLabel(building.building_type)}
                        </TableCell>
                      </TableRow>
                    )}
                    {visibleFields.structure && building?.structure && (
                      <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f9f9f9' }}>
                          構造
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'medium' }}>
                          {building.structure}
                        </TableCell>
                      </TableRow>
                    )}
                    {visibleFields.built_year && building?.built_year && (
                      <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f9f9f9' }}>
                          築年
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'medium' }}>
                          {building.built_year}年
                        </TableCell>
                      </TableRow>
                    )}
                    {visibleFields.facilities && room.facilities && (
                      <TableRow sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f9f9f9' }}>
                          設備
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'medium' }}>
                          {room.facilities}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Paper>
                </>
              )}

              {/* Tab 1: Photos */}
              {activeTab === 1 && property_publication_photos && property_publication_photos.length > 0 && (
                <Paper sx={{ p: 3, mb: 3, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#2e7d32', fontWeight: 'bold', borderBottom: '2px solid #4caf50', pb: 1, mb: 2 }}>
                    物件写真（{property_publication_photos.length}点）
                  </Typography>
                  <PhotoGallery photos={property_publication_photos} />
                </Paper>
              )}

              {/* Tab 2: Virtual Tour */}
              {activeTab === 2 && ((property_publication_vr_tours && property_publication_vr_tours.length > 0) ||
                (property_publication_virtual_stagings && property_publication_virtual_stagings.length > 0)) && (
                <Paper sx={{ p: 3, mb: 3, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#2e7d32', fontWeight: 'bold', borderBottom: '2px solid #4caf50', pb: 1, mb: 3 }}>
                    バーチャル内覧
                  </Typography>

                  {property_publication_vr_tours && property_publication_vr_tours.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      {property_publication_vr_tours.map((item) => (
                        <Box key={item.vr_tour.id} sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: '#2e7d32' }}>
                            <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20, verticalAlign: 'text-bottom', mr: 0.5 }} />
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
                              border: '3px solid #4caf50',
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
                          <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: '#2e7d32' }}>
                            <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20, verticalAlign: 'text-bottom', mr: 0.5 }} />
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
                              border: '3px solid #4caf50',
                              borderRadius: 2,
                              mt: 1
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  )}
                </Paper>
              )}
            </Box>
          </Grid>

          {/* Right Column - H-Sys style */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper
              sx={{
                mb: 3,
                position: 'sticky',
                top: 20,
                borderTop: '4px solid #4caf50',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              className="no-print"
            >
              <Box sx={{ bgcolor: '#4caf50', color: 'white', p: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  お問い合わせ
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  お気軽にご連絡ください
                </Typography>
              </Box>
              <Box sx={{ p: 3 }}>
                <InquiryForm publicationId={publicationId} />
              </Box>

              <Divider />

              <Box sx={{ p: 3, bgcolor: '#f1f8e9' }}>
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

export default Template3;
