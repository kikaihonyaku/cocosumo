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
  Button
} from '@mui/material';
import {
  LocationOn as LocationOnIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import PhotoGallery from '../PhotoGallery';
import InquiryForm from '../InquiryForm';
import ShareButtons from '../ShareButtons';
import FavoriteButton from '../FavoriteButton';
import PdfExportButton from '../PdfExportButton';
import CompareButton from '../CompareButton';
import { getRoomTypeLabel } from '../../../utils/formatters';

function Template1({ data, publicationId }) {
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
    primary: primary_color || '#00b900',
    accent: accent_color || '#ff6600'
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
    <Box className="template1-suumo print-container" style={{ '--primary-color': colors.primary, '--accent-color': colors.accent }}>
      {/* SUUMO風のカスタムCSS */}
      <style>{`
        .template1-suumo {
          background-color: #f2f2f2;
          min-height: 100vh;
          font-family: "Hiragino Kaku Gothic ProN", "ヒラギノ角ゴ ProN W3", "游ゴシック", "Yu Gothic", "メイリオ", Meiryo, sans-serif;
        }

        .template1-suumo .suumo-breadcrumb {
          background: #fff;
          padding: 12px 0;
          border-bottom: 1px solid #e5e5e5;
          font-size: 12px;
          color: #666;
        }

        .template1-suumo .suumo-title-section {
          background: #fff;
          padding: 20px;
          margin-bottom: 16px;
        }

        .template1-suumo .suumo-property-name {
          font-size: 28px;
          font-weight: bold;
          color: #333;
          margin: 0 0 12px 0;
          line-height: 1.4;
        }

        .template1-suumo .suumo-address {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #666;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .template1-suumo .suumo-rent-box {
          background: linear-gradient(to bottom, #fff9ed 0%, #fff 100%);
          border: 2px solid var(--accent-color);
          border-radius: 4px;
          padding: 16px 20px;
          margin-bottom: 16px;
        }

        .template1-suumo .suumo-rent-amount {
          font-size: 36px;
          font-weight: bold;
          color: var(--accent-color);
          line-height: 1.2;
        }

        .template1-suumo .suumo-rent-label {
          font-size: 13px;
          color: #666;
          margin-top: 4px;
        }

        .template1-suumo .suumo-action-buttons {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }

        .template1-suumo .suumo-btn-primary {
          background: var(--primary-color);
          color: white;
          font-weight: bold;
          padding: 14px 32px;
          border-radius: 4px;
          border: none;
          font-size: 16px;
          cursor: pointer;
          flex: 1;
          transition: background 0.2s;
        }

        .template1-suumo .suumo-btn-primary:hover {
          filter: brightness(0.9);
        }

        .template1-suumo .suumo-btn-secondary {
          background: #fff;
          color: var(--primary-color);
          font-weight: bold;
          padding: 14px 24px;
          border-radius: 4px;
          border: 2px solid var(--primary-color);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .template1-suumo .suumo-btn-secondary:hover {
          background: #f0fff0;
        }

        .template1-suumo .suumo-section {
          background: #fff;
          margin-bottom: 16px;
          border-radius: 4px;
          overflow: hidden;
        }

        .template1-suumo .suumo-section-header {
          background: #f7f7f7;
          margin: 0;
          padding: 14px 20px;
          border-bottom: 2px solid var(--primary-color);
          font-size: 18px;
          font-weight: bold;
          color: #333;
        }

        .template1-suumo .suumo-section-body {
          padding: 20px;
        }

        .template1-suumo .suumo-table {
          width: 100%;
          border-collapse: collapse;
        }

        .template1-suumo .suumo-table tr {
          border-bottom: 1px solid #e5e5e5;
        }

        .template1-suumo .suumo-table tr:last-child {
          border-bottom: none;
        }

        .template1-suumo .suumo-table th {
          background: #f9f9f9;
          padding: 14px 16px;
          text-align: left;
          font-weight: bold;
          color: #333;
          width: 140px;
          font-size: 14px;
          vertical-align: top;
        }

        .template1-suumo .suumo-table td {
          padding: 14px 16px;
          color: #333;
          font-size: 14px;
          line-height: 1.6;
        }

        .template1-suumo .suumo-table td.highlight {
          color: var(--accent-color);
          font-size: 18px;
          font-weight: bold;
        }

        .template1-suumo .suumo-photo-count {
          background: rgba(0, 0, 0, 0.6);
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 13px;
          display: inline-block;
          margin-bottom: 12px;
        }

        .template1-suumo .suumo-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 12px;
        }

        .template1-suumo .suumo-tag {
          background: color-mix(in srgb, var(--primary-color) 15%, white);
          color: var(--primary-color);
          padding: 6px 14px;
          border-radius: 16px;
          font-size: 13px;
          font-weight: 500;
        }

        .template1-suumo .suumo-catch-copy {
          background: #fffacd;
          border-left: 4px solid #ffd700;
          padding: 16px;
          margin: 16px 0;
          font-size: 15px;
          line-height: 1.7;
          color: #333;
        }

        .template1-suumo .suumo-sidebar {
          position: sticky;
          top: 20px;
        }

        .template1-suumo .suumo-contact-box {
          background: #fff;
          border: 2px solid var(--primary-color);
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 16px;
        }

        .template1-suumo .suumo-contact-title {
          font-size: 18px;
          font-weight: bold;
          color: #333;
          margin-bottom: 16px;
          text-align: center;
        }
      `}</style>

      {/* パンくずリスト風 */}
      <Box className="suumo-breadcrumb">
        <Container maxWidth="lg">
          <Typography variant="body2">
            ホーム &gt; 賃貸物件 &gt; 物件詳細
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* タイトル・住所・賃料セクション */}
        <Paper className="suumo-title-section" elevation={0}>
          <h1 className="suumo-property-name">
            {title}
          </h1>

          {visibleFields.address && building?.address && (
            <div className="suumo-address">
              <LocationOnIcon sx={{ fontSize: 18, color: colors.primary }} />
              <span>{building.address}</span>
            </div>
          )}

          {visibleFields.rent && room.rent && (
            <Box className="suumo-rent-box">
              <div className="suumo-rent-amount">
                {room.rent.toLocaleString()}円
              </div>
              <div className="suumo-rent-label">賃料</div>
            </Box>
          )}

          {catch_copy && (
            <div className="suumo-catch-copy">
              {catch_copy}
            </div>
          )}

          <div className="suumo-tags">
            {visibleFields.room_type && room.room_type && (
              <span className="suumo-tag">{getRoomTypeLabel(room.room_type)}</span>
            )}
            {visibleFields.area && room.area && (
              <span className="suumo-tag">{room.area}m²</span>
            )}
            {visibleFields.floor && room.floor && (
              <span className="suumo-tag">{room.floor}階</span>
            )}
          </div>

          <div className="suumo-action-buttons">
            <button className="suumo-btn-primary">
              <EmailIcon sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
              空室確認・お問い合わせ（無料）
            </button>
            <button className="suumo-btn-secondary">
              お気に入りに追加
            </button>
          </div>
        </Paper>

        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Image Gallery - SUUMO style */}
            {property_publication_photos && property_publication_photos.length > 0 && (
              <Box id="gallery" className="suumo-section">
                <h2 className="suumo-section-header">
                  写真
                  <span className="suumo-photo-count" style={{ marginLeft: '12px' }}>
                    {property_publication_photos.length}点
                  </span>
                </h2>
                <Box className="suumo-section-body">
                  <PhotoGallery photos={property_publication_photos} />
                </Box>
              </Box>
            )}

            {/* PR Text Section */}
            {pr_text && (
              <Box className="suumo-section">
                <h2 className="suumo-section-header">物件の特徴・おすすめポイント</h2>
                <Box className="suumo-section-body">
                  <Box
                    sx={{
                      lineHeight: 1.8,
                      color: '#333',
                      fontSize: '14px',
                      '& p': { margin: '0 0 0.5em 0' },
                      '& h2': { fontSize: '1.25rem', fontWeight: 600, margin: '1em 0 0.5em 0' },
                      '& h3': { fontSize: '1.1rem', fontWeight: 600, margin: '1em 0 0.5em 0' },
                      '& ul, & ol': { paddingLeft: '1.5em', margin: '0.5em 0' },
                      '& li': { margin: '0.25em 0' },
                      '& blockquote': {
                        borderLeft: '3px solid #e0e0e0',
                        paddingLeft: '1em',
                        margin: '0.5em 0',
                        color: '#666',
                        fontStyle: 'italic',
                      },
                      '& a': { color: colors.primary, textDecoration: 'underline' },
                    }}
                    dangerouslySetInnerHTML={{ __html: pr_text }}
                  />
                </Box>
              </Box>
            )}

            {/* Property Details - SUUMO style table */}
            <Box id="property-info" className="suumo-section">
              <h2 className="suumo-section-header">物件詳細</h2>
              <Box className="suumo-section-body" sx={{ p: '0 !important' }}>
                <table className="suumo-table">
                  <tbody>
                    {visibleFields.rent && room.rent && (
                      <tr>
                        <th>賃料</th>
                        <td className="highlight">{room.rent.toLocaleString()}円</td>
                      </tr>
                    )}
                    {visibleFields.management_fee && room.management_fee && (
                      <tr>
                        <th>管理費等</th>
                        <td>{room.management_fee.toLocaleString()}円</td>
                      </tr>
                    )}
                    {visibleFields.deposit && room.deposit && (
                      <tr>
                        <th>敷金</th>
                        <td>{room.deposit.toLocaleString()}円</td>
                      </tr>
                    )}
                    {visibleFields.key_money && room.key_money && (
                      <tr>
                        <th>礼金</th>
                        <td>{room.key_money.toLocaleString()}円</td>
                      </tr>
                    )}
                    {visibleFields.room_type && room.room_type && (
                      <tr>
                        <th>間取り</th>
                        <td>{getRoomTypeLabel(room.room_type)}</td>
                      </tr>
                    )}
                    {visibleFields.area && room.area && (
                      <tr>
                        <th>専有面積</th>
                        <td>{room.area}m²</td>
                      </tr>
                    )}
                    {visibleFields.floor && room.floor && (
                      <tr>
                        <th>階数</th>
                        <td>{room.floor}階</td>
                      </tr>
                    )}
                    {visibleFields.building_type && building?.building_type && (
                      <tr>
                        <th>建物種別</th>
                        <td>{getBuildingTypeLabel(building.building_type)}</td>
                      </tr>
                    )}
                    {visibleFields.structure && building?.structure && (
                      <tr>
                        <th>構造</th>
                        <td>{building.structure}</td>
                      </tr>
                    )}
                    {visibleFields.built_year && building?.built_year && (
                      <tr>
                        <th>築年数</th>
                        <td>{building.built_year}年</td>
                      </tr>
                    )}
                    {visibleFields.facilities && room.facilities && (
                      <tr>
                        <th>設備・条件</th>
                        <td>{room.facilities}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Box>
            </Box>

            {/* VR Tour & Virtual Staging - SUUMO style */}
            {((property_publication_vr_tours && property_publication_vr_tours.length > 0) ||
              (property_publication_virtual_stagings && property_publication_virtual_stagings.length > 0)) && (
              <Box id="vr-tour" className="suumo-section">
                <h2 className="suumo-section-header">パノラマ写真・VR内覧</h2>
                <Box className="suumo-section-body">
                  {/* VR Tours */}
                  {property_publication_vr_tours && property_publication_vr_tours.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      {property_publication_vr_tours.map((item) => (
                        <Box key={item.vr_tour.id} sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: '#333', fontSize: '15px' }}>
                            VRツアー: {item.vr_tour.title}
                          </Typography>
                          {item.vr_tour.description && (
                            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: '13px', mb: 2 }}>
                              {item.vr_tour.description}
                            </Typography>
                          )}
                          <Box
                            component="iframe"
                            src={`/vr/${item.vr_tour.public_id}`}
                            title="VRツアー"
                            sx={{
                              width: '100%',
                              height: 550,
                              border: '1px solid #ddd',
                              borderRadius: '4px',
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
                          <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: '#333', fontSize: '15px' }}>
                            バーチャルステージング: {item.virtual_staging.title}
                          </Typography>
                          {item.virtual_staging.description && (
                            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: '13px', mb: 2 }}>
                              {item.virtual_staging.description}
                            </Typography>
                          )}
                          <Box
                            component="iframe"
                            src={`/virtual-staging/${item.virtual_staging.public_id}?embed=true`}
                            title="バーチャルステージング"
                            sx={{
                              width: '100%',
                              height: 550,
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              mt: 1
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </Grid>

          {/* Right Column - SUUMO style sidebar */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box className="suumo-sidebar no-print">
              <Box id="inquiry" className="suumo-contact-box">
                <div className="suumo-contact-title">
                  この物件へのお問い合わせ
                </div>
                <InquiryForm publicationId={publicationId} />
              </Box>

              <Box className="suumo-section" sx={{ mb: 2 }}>
                <Box className="suumo-section-body">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
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
                      sx={{
                        bgcolor: 'white',
                        boxShadow: 1,
                        '&:hover': { bgcolor: 'grey.100' }
                      }}
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
                      sx={{
                        bgcolor: 'white',
                        boxShadow: 1,
                        '&:hover': { bgcolor: 'grey.100' }
                      }}
                    />
                    <PdfExportButton
                      title={title}
                      publicationId={publicationId}
                      size="large"
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Template1;
