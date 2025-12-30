/**
 * SEO Meta Management Hook
 * Handles dynamic meta tags, OG tags, and structured data
 */

import { useEffect, useCallback, useRef } from 'react';

// Default SEO configuration
const DEFAULT_CONFIG = {
  siteName: 'CoCoスモ',
  siteUrl: typeof window !== 'undefined' ? window.location.origin : '',
  locale: 'ja_JP',
  twitterCard: 'summary_large_image'
};

/**
 * Set or update a meta tag
 */
function setMetaTag(attribute, attributeValue, content) {
  let element = document.querySelector(`meta[${attribute}="${attributeValue}"]`);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, attributeValue);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
  return element;
}

/**
 * Remove a meta tag
 */
function removeMetaTag(attribute, attributeValue) {
  const element = document.querySelector(`meta[${attribute}="${attributeValue}"]`);
  if (element) {
    element.remove();
  }
}

/**
 * Set link tag (canonical, alternate, etc.)
 */
function setLinkTag(rel, href, attributes = {}) {
  let element = document.querySelector(`link[rel="${rel}"]`);

  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }

  element.setAttribute('href', href);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  return element;
}

/**
 * Set JSON-LD structured data
 */
function setJsonLd(data, id = 'main-schema') {
  let script = document.querySelector(`script[data-schema-id="${id}"]`);

  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema-id', id);
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(data);
  return script;
}

/**
 * Remove JSON-LD structured data
 */
function removeJsonLd(id = 'main-schema') {
  const script = document.querySelector(`script[data-schema-id="${id}"]`);
  if (script) {
    script.remove();
  }
}

/**
 * Hook for managing SEO meta tags
 * @param {object} options - SEO configuration
 * @returns {object} SEO utilities
 */
export function useSeoMeta(options = {}) {
  const previousMetaRef = useRef([]);

  const {
    title,
    description,
    keywords,
    canonical,
    image,
    imageAlt,
    imageWidth,
    imageHeight,
    type = 'website',
    author,
    publishedTime,
    modifiedTime,
    noindex = false,
    nofollow = false,
    alternateLanguages = [],
    structuredData,
    ...customMeta
  } = options;

  useEffect(() => {
    const createdElements = [];

    // Page Title
    if (title) {
      const fullTitle = `${title} | ${DEFAULT_CONFIG.siteName}`;
      document.title = fullTitle;

      // OG Title
      createdElements.push(setMetaTag('property', 'og:title', fullTitle));
      createdElements.push(setMetaTag('name', 'twitter:title', fullTitle));
    }

    // Description
    if (description) {
      createdElements.push(setMetaTag('name', 'description', description));
      createdElements.push(setMetaTag('property', 'og:description', description));
      createdElements.push(setMetaTag('name', 'twitter:description', description));
    }

    // Keywords
    if (keywords) {
      const keywordString = Array.isArray(keywords) ? keywords.join(', ') : keywords;
      createdElements.push(setMetaTag('name', 'keywords', keywordString));
    }

    // Canonical URL
    if (canonical) {
      setLinkTag('canonical', canonical);
      createdElements.push(setMetaTag('property', 'og:url', canonical));
    }

    // Image
    if (image) {
      const fullImageUrl = image.startsWith('http') ? image : `${DEFAULT_CONFIG.siteUrl}${image}`;
      createdElements.push(setMetaTag('property', 'og:image', fullImageUrl));
      createdElements.push(setMetaTag('name', 'twitter:image', fullImageUrl));

      if (imageAlt) {
        createdElements.push(setMetaTag('property', 'og:image:alt', imageAlt));
        createdElements.push(setMetaTag('name', 'twitter:image:alt', imageAlt));
      }

      if (imageWidth) {
        createdElements.push(setMetaTag('property', 'og:image:width', imageWidth.toString()));
      }

      if (imageHeight) {
        createdElements.push(setMetaTag('property', 'og:image:height', imageHeight.toString()));
      }
    }

    // OG Type
    createdElements.push(setMetaTag('property', 'og:type', type));

    // Site Name
    createdElements.push(setMetaTag('property', 'og:site_name', DEFAULT_CONFIG.siteName));

    // Locale
    createdElements.push(setMetaTag('property', 'og:locale', DEFAULT_CONFIG.locale));

    // Twitter Card
    createdElements.push(setMetaTag('name', 'twitter:card', DEFAULT_CONFIG.twitterCard));

    // Author
    if (author) {
      createdElements.push(setMetaTag('name', 'author', author));
    }

    // Article dates
    if (type === 'article') {
      if (publishedTime) {
        createdElements.push(setMetaTag('property', 'article:published_time', publishedTime));
      }
      if (modifiedTime) {
        createdElements.push(setMetaTag('property', 'article:modified_time', modifiedTime));
      }
    }

    // Robots
    const robotsDirectives = [];
    if (noindex) robotsDirectives.push('noindex');
    if (nofollow) robotsDirectives.push('nofollow');
    if (robotsDirectives.length > 0) {
      createdElements.push(setMetaTag('name', 'robots', robotsDirectives.join(', ')));
    }

    // Alternate languages (hreflang)
    alternateLanguages.forEach(({ lang, url }) => {
      setLinkTag('alternate', url, { hreflang: lang });
    });

    // Custom meta tags
    Object.entries(customMeta).forEach(([key, value]) => {
      if (value) {
        createdElements.push(setMetaTag('name', key, value));
      }
    });

    // Structured Data
    if (structuredData) {
      setJsonLd(structuredData);
    }

    // Store for cleanup
    previousMetaRef.current = createdElements;

    // Cleanup function
    return () => {
      // Reset title
      document.title = DEFAULT_CONFIG.siteName;

      // Remove structured data
      if (structuredData) {
        removeJsonLd();
      }
    };
  }, [
    title,
    description,
    keywords,
    canonical,
    image,
    imageAlt,
    imageWidth,
    imageHeight,
    type,
    author,
    publishedTime,
    modifiedTime,
    noindex,
    nofollow,
    alternateLanguages,
    structuredData,
    customMeta
  ]);

  // Update specific meta tag
  const updateMeta = useCallback((name, content) => {
    setMetaTag('name', name, content);
  }, []);

  // Update OG tag
  const updateOgTag = useCallback((property, content) => {
    setMetaTag('property', `og:${property}`, content);
  }, []);

  return {
    updateMeta,
    updateOgTag,
    setJsonLd,
    removeJsonLd
  };
}

/**
 * Generate property listing SEO data
 */
export function usePropertySeo({
  property,
  publicationId,
  publicUrl
}) {
  const seoData = property ? {
    title: property.title,
    description: property.catch_copy || property.pr_text?.replace(/<[^>]*>/g, '').substring(0, 160),
    canonical: publicUrl || `${DEFAULT_CONFIG.siteUrl}/p/${publicationId}`,
    type: 'product',
    image: property.property_publication_photos?.[0]?.room_photo?.photo_url,
    imageAlt: property.title,
    keywords: [
      property.room?.room_type,
      property.room?.building?.address,
      '賃貸',
      '物件'
    ].filter(Boolean),
    structuredData: generatePropertySchema(property, publicUrl)
  } : {};

  return useSeoMeta(seoData);
}

/**
 * Generate Schema.org structured data for property
 */
function generatePropertySchema(property, publicUrl) {
  if (!property) return null;

  const { room, title, catch_copy, property_publication_photos } = property;
  const building = room?.building;

  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: title,
    description: catch_copy,
    url: publicUrl,
    ...(room?.rent && {
      offers: {
        '@type': 'Offer',
        price: room.rent,
        priceCurrency: 'JPY',
        availability: 'https://schema.org/InStock'
      }
    }),
    ...(room?.area && {
      floorSize: {
        '@type': 'QuantitativeValue',
        value: room.area,
        unitCode: 'MTK'
      }
    }),
    ...(building?.address && {
      address: {
        '@type': 'PostalAddress',
        addressLocality: building.address,
        addressCountry: 'JP'
      }
    }),
    ...(building?.latitude && building?.longitude && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: building.latitude,
        longitude: building.longitude
      }
    }),
    ...(property_publication_photos?.length > 0 && {
      image: property_publication_photos.map(p =>
        p.room_photo?.photo_url || p.photo_url
      ).filter(Boolean)
    })
  };
}

export default {
  useSeoMeta,
  usePropertySeo
};
