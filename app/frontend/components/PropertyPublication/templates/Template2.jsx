import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid
} from '@mui/material';
import {
  Home as HomeIcon,
  LocationOn as LocationOnIcon,
  Square as SquareIcon,
  Email as EmailIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import PhotoGallery from '../PhotoGallery';
import InquiryForm from '../InquiryForm';
import ShareButtons from '../ShareButtons';
import FavoriteButton from '../FavoriteButton';
import PdfExportButton from '../PdfExportButton';
import CompareButton from '../CompareButton';
import { getRoomTypeLabel } from '../../../utils/formatters';

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
    qr_code_data_url,
    primary_color,
    accent_color
  } = data;
  const building = room?.building;
  const visibleFields = visible_fields_with_defaults || {};

  // カスタムカラー（デフォルト値付き）
  const colors = {
    primary: primary_color || '#9acd32',
    accent: accent_color || '#ff1493'
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
    <Box className="template2-roomspot print-container" style={{ '--primary-color': colors.primary, '--accent-color': colors.accent }}>
      {/* RoomSpot風のカスタムCSS */}
      <style>{`
        .template2-roomspot {
          background: #ffffff;
          min-height: 100vh;
          font-family: "Hiragino Kaku Gothic ProN", "ヒラギノ角ゴ ProN W3", "Yu Gothic", "游ゴシック", "Meiryo", sans-serif;
        }

        /* Header Section */
        .template2-roomspot .header-section {
          background: linear-gradient(135deg, var(--primary-color) 0%, color-mix(in srgb, var(--primary-color) 80%, black) 100%);
          color: white;
          padding: 16px 0;
          margin-bottom: 0;
          box-shadow: 0 2px 4px rgba(154,205,50,0.2);
        }

        .template2-roomspot .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .template2-roomspot .header-logo {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .template2-roomspot .header-badge {
          background: white;
          color: var(--primary-color);
          padding: 6px 16px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: bold;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        }

        .template2-roomspot .breadcrumb {
          background: #f8f8f8;
          padding: 12px 0;
          margin-bottom: 20px;
          border-bottom: 1px solid #e0e0e0;
        }

        .template2-roomspot .breadcrumb-text {
          font-size: 13px;
          color: #666;
        }

        .template2-roomspot .breadcrumb-text a {
          color: #666;
          text-decoration: none;
        }

        .template2-roomspot .breadcrumb-text a:hover {
          color: var(--accent-color);
          text-decoration: underline;
        }

        .template2-roomspot .breadcrumb-separator {
          margin: 0 8px;
          color: #999;
        }

        /* Main Container */
        .template2-roomspot .main-container {
          padding: 20px 0 40px 0;
          background: #ffffff;
        }

        /* Title Section */
        .template2-roomspot .property-title {
          font-size: 26px;
          font-weight: bold;
          color: #333;
          margin-bottom: 12px;
          line-height: 1.4;
          padding-bottom: 12px;
          border-bottom: 3px solid var(--primary-color);
        }

        .template2-roomspot .property-meta {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .template2-roomspot .property-meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: #666;
        }

        /* 2 Column Layout */
        .template2-roomspot .two-column {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 24px;
          margin-bottom: 32px;
        }

        /* Photo Gallery */
        .template2-roomspot .photo-section {
          background: white;
        }

        /* Price Box - Pink */
        .template2-roomspot .price-box {
          background: #fff;
          border: 3px solid var(--accent-color);
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 16px;
        }

        .template2-roomspot .price-label {
          color: var(--accent-color);
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .template2-roomspot .price-amount {
          color: var(--accent-color);
          font-size: 36px;
          font-weight: bold;
          line-height: 1.2;
          margin-bottom: 4px;
        }

        .template2-roomspot .price-tax {
          color: #666;
          font-size: 12px;
        }

        /* Quick Info Grid */
        .template2-roomspot .quick-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }

        .template2-roomspot .quick-info-item {
          background: #f5f5f5;
          padding: 12px;
          border-radius: 4px;
          text-align: center;
        }

        .template2-roomspot .quick-info-label {
          font-size: 11px;
          color: #666;
          margin-bottom: 4px;
        }

        .template2-roomspot .quick-info-value {
          font-size: 16px;
          font-weight: bold;
          color: #333;
        }

        /* Point Badge */
        .template2-roomspot .point-badge {
          background: var(--primary-color);
          color: white;
          padding: 4px 12px;
          border-radius: 3px;
          font-size: 12px;
          font-weight: bold;
          display: inline-block;
          margin-bottom: 8px;
        }

        /* Catch Copy */
        .template2-roomspot .catch-copy-box {
          background: #fffacd;
          border-left: 4px solid var(--primary-color);
          padding: 12px 16px;
          margin-bottom: 20px;
          font-size: 14px;
          line-height: 1.7;
        }

        /* Section Title */
        .template2-roomspot .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #333;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid var(--primary-color);
        }

        /* Property Details Table */
        .template2-roomspot .details-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 32px;
          background: white;
        }

        .template2-roomspot .details-table tr {
          border-bottom: 1px solid #e0e0e0;
        }

        .template2-roomspot .details-table tr:nth-child(even) {
          background: #f9f9f9;
        }

        .template2-roomspot .details-table th {
          background: #f0f0f0;
          padding: 14px 16px;
          text-align: left;
          font-weight: bold;
          color: #333;
          width: 180px;
          font-size: 14px;
          vertical-align: top;
        }

        .template2-roomspot .details-table td {
          padding: 14px 16px;
          color: #333;
          font-size: 14px;
          line-height: 1.6;
        }

        .template2-roomspot .details-table td.highlight {
          color: var(--accent-color);
          font-size: 18px;
          font-weight: bold;
        }

        /* Contact Form Section */
        .template2-roomspot .contact-section {
          background: color-mix(in srgb, var(--primary-color) 10%, white);
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .template2-roomspot .contact-title {
          font-size: 18px;
          font-weight: bold;
          color: #333;
          margin-bottom: 16px;
          text-align: center;
        }

        /* CTA Button - Pink */
        .template2-roomspot .cta-button {
          background: var(--accent-color);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 16px 32px;
          font-size: 16px;
          font-weight: bold;
          width: 100%;
          cursor: pointer;
          transition: filter 0.3s;
        }

        .template2-roomspot .cta-button:hover {
          filter: brightness(0.9);
        }

        /* Feature Icons */
        .template2-roomspot .feature-icons {
          display: flex;
          gap: 16px;
          margin: 16px 0;
          flex-wrap: wrap;
        }

        .template2-roomspot .feature-icon {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          color: var(--primary-color);
        }

        .template2-roomspot .feature-icon-label {
          font-size: 11px;
          color: #666;
        }

        /* PR Text */
        .template2-roomspot .pr-text {
          font-size: 14px;
          line-height: 1.8;
          color: #333;
          margin-bottom: 24px;
        }

        .template2-roomspot .pr-text p {
          margin: 0 0 0.5em 0;
        }

        .template2-roomspot .pr-text h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1em 0 0.5em 0;
        }

        .template2-roomspot .pr-text h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 1em 0 0.5em 0;
        }

        .template2-roomspot .pr-text ul,
        .template2-roomspot .pr-text ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }

        .template2-roomspot .pr-text li {
          margin: 0.25em 0;
        }

        .template2-roomspot .pr-text blockquote {
          border-left: 3px solid var(--primary-color);
          padding-left: 1em;
          margin: 0.5em 0;
          color: #666;
          font-style: italic;
        }

        .template2-roomspot .pr-text a {
          color: var(--accent-color);
          text-decoration: underline;
        }

        /* VR Section */
        .template2-roomspot .vr-section {
          margin-bottom: 32px;
        }

        .template2-roomspot .vr-item {
          margin-bottom: 24px;
        }

        .template2-roomspot .vr-item-title {
          font-size: 16px;
          font-weight: bold;
          color: var(--accent-color);
          margin-bottom: 8px;
        }

        .template2-roomspot .vr-item-description {
          font-size: 13px;
          color: #666;
          margin-bottom: 12px;
          line-height: 1.6;
        }

        .template2-roomspot .vr-iframe {
          width: 100%;
          height: 550px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
        }

        /* Share Section */
        .template2-roomspot .share-box {
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
        }

        .template2-roomspot .share-title {
          font-size: 14px;
          font-weight: bold;
          color: #333;
          margin-bottom: 12px;
        }

        /* Responsive */
        @media (max-width: 960px) {
          .template2-roomspot .header-section {
            padding: 12px 0;
          }

          .template2-roomspot .header-logo {
            font-size: 18px;
          }

          .template2-roomspot .header-badge {
            font-size: 10px;
            padding: 5px 12px;
          }

          .template2-roomspot .property-title {
            font-size: 20px;
          }

          .template2-roomspot .two-column {
            grid-template-columns: 1fr;
          }

          .template2-roomspot .details-table th {
            width: 120px;
            font-size: 13px;
          }

          .template2-roomspot .details-table td {
            font-size: 13px;
          }

          .template2-roomspot .quick-info {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Header Section */}
      <Box className="header-section no-print">
        <Container maxWidth="lg">
          <div className="header-content">
            <div className="header-logo">RoomSpot</div>
            <div className="header-badge">賃貸物件情報</div>
          </div>
        </Container>
      </Box>

      {/* Breadcrumb */}
      <Box className="breadcrumb no-print">
        <Container maxWidth="lg">
          <div className="breadcrumb-text">
            <a href="/">ホーム</a>
            <span className="breadcrumb-separator">›</span>
            <a href="/properties">賃貸物件</a>
            <span className="breadcrumb-separator">›</span>
            <span>{title}</span>
          </div>
        </Container>
      </Box>

      <Container maxWidth="lg" className="main-container">
        {/* Property Title */}
        <h1 className="property-title">{title}</h1>

        {/* Property Meta Info */}
        {visibleFields.address && building?.address && (
          <div className="property-meta">
            <div className="property-meta-item">
              <LocationOnIcon sx={{ fontSize: 18, color: colors.primary }} />
              <span>{building.address}</span>
            </div>
            {visibleFields.building_type && building?.building_type && (
              <div className="property-meta-item">
                <HomeIcon sx={{ fontSize: 18, color: colors.primary }} />
                <span>{getBuildingTypeLabel(building.building_type)}</span>
              </div>
            )}
          </div>
        )}

        {/* 2 Column Layout */}
        <div className="two-column">
          {/* Left Column - Photos */}
          <div id="gallery" className="photo-section">
            {property_publication_photos && property_publication_photos.length > 0 && (
              <PhotoGallery photos={property_publication_photos} />
            )}

            {/* Feature Icons */}
            <div className="feature-icons" style={{ marginTop: '16px' }}>
              <div className="feature-icon">
                <HomeIcon sx={{ fontSize: 32, color: colors.primary }} />
                <span className="feature-icon-label">賃貸</span>
              </div>
              <div className="feature-icon">
                <LocationOnIcon sx={{ fontSize: 32, color: colors.primary }} />
                <span className="feature-icon-label">好立地</span>
              </div>
              {visibleFields.area && room.area && (
                <div className="feature-icon">
                  <SquareIcon sx={{ fontSize: 32, color: colors.primary }} />
                  <span className="feature-icon-label">広々</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Price & Info */}
          <div>
            {/* Price Box */}
            {visibleFields.rent && room.rent && (
              <div className="price-box">
                <div className="price-label">賃料</div>
                <div className="price-amount">¥{room.rent.toLocaleString()}</div>
                <div className="price-tax">※表示価格は税込です</div>
              </div>
            )}

            {/* Quick Info Grid */}
            <div className="quick-info">
              {visibleFields.room_type && room.room_type && (
                <div className="quick-info-item">
                  <div className="quick-info-label">間取り</div>
                  <div className="quick-info-value">{getRoomTypeLabel(room.room_type)}</div>
                </div>
              )}
              {visibleFields.area && room.area && (
                <div className="quick-info-item">
                  <div className="quick-info-label">専有面積</div>
                  <div className="quick-info-value">{room.area}m²</div>
                </div>
              )}
              {visibleFields.floor && room.floor && (
                <div className="quick-info-item">
                  <div className="quick-info-label">階数</div>
                  <div className="quick-info-value">{room.floor}階</div>
                </div>
              )}
              {visibleFields.deposit && room.deposit && (
                <div className="quick-info-item">
                  <div className="quick-info-label">敷金</div>
                  <div className="quick-info-value">{room.deposit.toLocaleString()}円</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Catch Copy */}
        {catch_copy && (
          <div>
            <span className="point-badge">おすすめポイント</span>
            <div className="catch-copy-box">{catch_copy}</div>
          </div>
        )}

        {/* PR Text */}
        {pr_text && (
          <div>
            <h2 className="section-title">物件の特徴</h2>
            <div
              className="pr-text"
              style={{
                whiteSpace: 'normal',
              }}
              dangerouslySetInnerHTML={{ __html: pr_text }}
            />
          </div>
        )}

        {/* Property Details Table */}
        <div id="property-info">
          <h2 className="section-title">物件詳細情報</h2>
          <table className="details-table">
            <tbody>
              {visibleFields.rent && room.rent && (
                <tr>
                  <th>賃料</th>
                  <td className="highlight">¥{room.rent.toLocaleString()}</td>
                </tr>
              )}
              {visibleFields.management_fee && room.management_fee && (
                <tr>
                  <th>管理費・共益費</th>
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
                  <th>所在階</th>
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
                  <th>築年月</th>
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
        </div>

        {/* VR Tour & Virtual Staging */}
        {((property_publication_vr_tours && property_publication_vr_tours.length > 0) ||
          (property_publication_virtual_stagings && property_publication_virtual_stagings.length > 0)) && (
          <div id="vr-tour" className="vr-section">
            <h2 className="section-title">バーチャルコンテンツ</h2>

            {property_publication_vr_tours && property_publication_vr_tours.length > 0 && (
              <div>
                {property_publication_vr_tours.map((item) => (
                  <div key={item.vr_tour.id} className="vr-item">
                    <div className="vr-item-title">VRツアー: {item.vr_tour.title}</div>
                    {item.vr_tour.description && (
                      <div className="vr-item-description">{item.vr_tour.description}</div>
                    )}
                    <iframe
                      src={`/vr/${item.vr_tour.public_id}`}
                      className="vr-iframe"
                      title={item.vr_tour.title}
                    />
                  </div>
                ))}
              </div>
            )}

            {property_publication_virtual_stagings && property_publication_virtual_stagings.length > 0 && (
              <div>
                {property_publication_virtual_stagings.map((item) => (
                  <div key={item.virtual_staging.id} className="vr-item">
                    <div className="vr-item-title">バーチャルステージング: {item.virtual_staging.title}</div>
                    {item.virtual_staging.description && (
                      <div className="vr-item-description">{item.virtual_staging.description}</div>
                    )}
                    <iframe
                      src={`/virtual-staging/${item.virtual_staging.public_id}?embed=true`}
                      className="vr-iframe"
                      title={item.virtual_staging.title}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Contact Form Section */}
        <div id="inquiry" className="contact-section no-print">
          <div className="contact-title">お問い合わせ</div>
          <InquiryForm publicationId={publicationId} />
        </div>

        {/* Share Section */}
        <div className="share-box no-print">
          <div className="share-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>この物件をシェア</span>
            <Box sx={{ display: 'flex', gap: 1 }}>
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
            </Box>
          </div>
          <ShareButtons
            url={public_url || window.location.href}
            title={title}
            qrCodeUrl={qr_code_data_url}
            publicationId={publicationId}
          />
          <PdfExportButton
            title={title}
            publicationId={publicationId}
            size="large"
          />
        </div>
      </Container>
    </Box>
  );
}

export default Template2;
