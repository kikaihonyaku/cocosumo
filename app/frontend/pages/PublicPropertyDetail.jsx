import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  CircularProgress,
  Alert
} from '@mui/material';
import axios from 'axios';
import Template1 from '../components/PropertyPublication/templates/Template1';
import Template2 from '../components/PropertyPublication/templates/Template2';
import Template3 from '../components/PropertyPublication/templates/Template3';

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
      // URLからpreviewパラメータとtemplateパラメータを取得
      const urlParams = new URLSearchParams(window.location.search);
      const isPreview = urlParams.get('preview') === 'true';
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
        public_url
      } = data;

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

      {renderTemplate()}
    </>
  );
}

export default PublicPropertyDetail;
