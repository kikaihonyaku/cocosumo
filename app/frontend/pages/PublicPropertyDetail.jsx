import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  CircularProgress,
  Alert,
  IconButton,
  Typography,
  Button
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon } from '@mui/icons-material';
import axios from 'axios';
import Template0 from '../components/PropertyPublication/templates/Template0';
import Template1 from '../components/PropertyPublication/templates/Template1';
import Template2 from '../components/PropertyPublication/templates/Template2';
import Template3 from '../components/PropertyPublication/templates/Template3';

function PublicPropertyDetail() {
  const { publicationId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // URLクエリパラメータを取得
  const urlParams = new URLSearchParams(window.location.search);
  const isPreview = urlParams.get('preview') === 'true';
  const roomId = urlParams.get('roomId');
  const publicationIdParam = urlParams.get('publicationId');

  useEffect(() => {
    loadData();
  }, [publicationId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const templateParam = urlParams.get('template');

      const response = await axios.get(`/api/v1/property_publications/${publicationId}/public`, {
        params: isPreview ? { preview: true } : {}
      });

      // URLパラメータでtemplateが指定されている場合は、それを優先する
      const responseData = response.data;
      if (templateParam && isPreview) {
        responseData.template_type = templateParam;
      }

      setData(responseData);
    } catch (error) {
      console.error('Error loading data:', error);
      if (error.response?.status === 401) {
        setError('プレビューを表示するにはログインが必要です');
      } else {
        setError('物件情報の読み込みに失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  // SEO meta tags
  useEffect(() => {
    if (data) {
      const {
        title,
        catch_copy,
        pr_text,
        property_publication_photos,
        public_url,
        room
      } = data;
      const building = room?.building;

      // Set page title
      document.title = `${title} | CoCoスモ`;

      // Set meta description
      const description = catch_copy || pr_text?.replace(/<[^>]*>/g, '').substring(0, 160) || `${title}の物件情報`;
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
      }
      metaDescription.content = description;

      // Get image URL
      let imageUrl = null;
      if (property_publication_photos && property_publication_photos.length > 0) {
        const firstPhoto = property_publication_photos[0];
        imageUrl = firstPhoto.room_photo?.photo_url || firstPhoto.photo_url;
        // Ensure absolute URL
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `${window.location.origin}${imageUrl}`;
        }
      }

      // Set OG tags for social sharing
      const ogTags = {
        'og:title': title,
        'og:description': description,
        'og:url': public_url || window.location.href,
        'og:type': 'website',
        'og:site_name': 'CoCoスモ',
        'og:locale': 'ja_JP'
      };

      // Add image with dimensions
      if (imageUrl) {
        ogTags['og:image'] = imageUrl;
        ogTags['og:image:width'] = '1200';
        ogTags['og:image:height'] = '630';
        ogTags['og:image:alt'] = title;
      }

      Object.entries(ogTags).forEach(([property, content]) => {
        if (!content) return;
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          document.head.appendChild(meta);
        }
        meta.content = content;
      });

      // Set Twitter Card tags
      const twitterTags = {
        'twitter:card': 'summary_large_image',
        'twitter:title': title,
        'twitter:description': description
      };

      if (imageUrl) {
        twitterTags['twitter:image'] = imageUrl;
        twitterTags['twitter:image:alt'] = title;
      }

      Object.entries(twitterTags).forEach(([name, content]) => {
        if (!content) return;
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', name);
          document.head.appendChild(meta);
        }
        meta.content = content;
      });

      // Set canonical URL
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.href = public_url || window.location.href;

      // Add JSON-LD structured data for real estate
      let jsonLdScript = document.querySelector('script[type="application/ld+json"][data-property]');
      if (!jsonLdScript) {
        jsonLdScript = document.createElement('script');
        jsonLdScript.type = 'application/ld+json';
        jsonLdScript.setAttribute('data-property', 'true');
        document.head.appendChild(jsonLdScript);
      }

      const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        'name': title,
        'description': description,
        'url': public_url || window.location.href
      };

      // Add property details if available
      if (room) {
        if (room.rent) {
          structuredData.offers = {
            '@type': 'Offer',
            'price': room.rent,
            'priceCurrency': 'JPY',
            'priceValidUntil': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          };
        }

        if (room.area) {
          structuredData.floorSize = {
            '@type': 'QuantitativeValue',
            'value': room.area,
            'unitCode': 'MTK' // Square meters
          };
        }

        if (room.room_type) {
          structuredData.numberOfRooms = room.room_type;
        }
      }

      // Add address if available
      if (building?.address) {
        structuredData.address = {
          '@type': 'PostalAddress',
          'addressLocality': building.address,
          'addressCountry': 'JP'
        };
      }

      // Add images
      if (property_publication_photos && property_publication_photos.length > 0) {
        structuredData.image = property_publication_photos.map(photo => {
          const url = photo.room_photo?.photo_url || photo.photo_url;
          return url?.startsWith('http') ? url : `${window.location.origin}${url}`;
        }).filter(Boolean);
      }

      jsonLdScript.textContent = JSON.stringify(structuredData);
    }

    // Cleanup function to reset title and remove meta tags on unmount
    return () => {
      document.title = 'CoCoスモ';
      // Clean up dynamically added meta tags
      const cleanupSelectors = [
        'meta[property^="og:"]',
        'meta[name^="twitter:"]',
        'link[rel="canonical"]',
        'script[data-property="true"]'
      ];
      cleanupSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => el.remove());
      });
    };
  }, [data]);

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
    template_type
  } = data;

  // Select template component based on template_type
  const renderTemplate = () => {
    const templateType = template_type || 'template1';

    switch (templateType) {
      case 'template0':
        return <Template0 data={data} publicationId={publicationId} />;
      case 'template2':
        return <Template2 data={data} publicationId={publicationId} />;
      case 'template3':
        return <Template3 data={data} publicationId={publicationId} />;
      case 'template1':
      default:
        return <Template1 data={data} publicationId={publicationId} />;
    }
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

      {/* プレビューモード時のヘッダー */}
      {isPreview && roomId && (
        <Box className="no-print" sx={{ bgcolor: 'background.default', py: 2 }}>
          <Container maxWidth="xl">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={() => {
                if (publicationIdParam) {
                  // 編集画面から来た場合は編集画面に戻る
                  navigate(`/room/${roomId}/property-publication/${publicationIdParam}/edit`);
                } else {
                  // 部屋詳細から来た場合は部屋詳細に戻る
                  navigate(`/room/${roomId}`);
                }
              }}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>プレビュー</Typography>
              {!publicationIdParam && data && data.id && (
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/room/${roomId}/property-publication/${data.id}/edit`)}
                >
                  編集
                </Button>
              )}
            </Box>
          </Container>
        </Box>
      )}

      {renderTemplate()}
    </>
  );
}

export default PublicPropertyDetail;
