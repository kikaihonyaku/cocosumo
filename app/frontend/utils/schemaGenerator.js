/**
 * Schema.org Structured Data Generator
 * Generates JSON-LD for various content types
 */

const SITE_CONFIG = {
  name: 'CoCoスモ',
  url: typeof window !== 'undefined' ? window.location.origin : '',
  logo: '/cocosumo-logo.png',
  description: '不動産物件管理・公開システム'
};

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema(options = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: options.name || SITE_CONFIG.name,
    url: options.url || SITE_CONFIG.url,
    logo: options.logo || `${SITE_CONFIG.url}${SITE_CONFIG.logo}`,
    description: options.description || SITE_CONFIG.description,
    ...(options.contactPoint && {
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: options.contactPoint.telephone,
        contactType: options.contactPoint.type || 'customer service',
        availableLanguage: options.contactPoint.languages || ['Japanese']
      }
    }),
    ...(options.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: options.address.street,
        addressLocality: options.address.city,
        addressRegion: options.address.region,
        postalCode: options.address.postalCode,
        addressCountry: options.address.country || 'JP'
      }
    }),
    ...(options.socialProfiles && {
      sameAs: options.socialProfiles
    })
  };
}

/**
 * Generate LocalBusiness schema (for real estate agency)
 */
export function generateLocalBusinessSchema(options = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: options.name || SITE_CONFIG.name,
    url: options.url || SITE_CONFIG.url,
    image: options.image || `${SITE_CONFIG.url}${SITE_CONFIG.logo}`,
    description: options.description || SITE_CONFIG.description,
    ...(options.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: options.address.street,
        addressLocality: options.address.city,
        addressRegion: options.address.region,
        postalCode: options.address.postalCode,
        addressCountry: options.address.country || 'JP'
      }
    }),
    ...(options.geo && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: options.geo.latitude,
        longitude: options.geo.longitude
      }
    }),
    ...(options.telephone && { telephone: options.telephone }),
    ...(options.openingHours && { openingHours: options.openingHours }),
    ...(options.priceRange && { priceRange: options.priceRange })
  };
}

/**
 * Generate RealEstateListing schema for property
 */
export function generatePropertySchema(property, options = {}) {
  if (!property) return null;

  const { room, title, catch_copy, pr_text, property_publication_photos } = property;
  const building = room?.building;
  const pageUrl = options.url || `${SITE_CONFIG.url}/p/${property.public_id || property.id}`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    '@id': `${pageUrl}#listing`,
    name: title,
    description: catch_copy || pr_text?.replace(/<[^>]*>/g, '').substring(0, 300),
    url: pageUrl,
    datePosted: property.published_at || new Date().toISOString(),
    availability: 'https://schema.org/InStock'
  };

  // Price/Rent
  if (room?.rent) {
    schema.offers = {
      '@type': 'Offer',
      price: room.rent,
      priceCurrency: 'JPY',
      availability: 'https://schema.org/InStock',
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
  }

  // Floor size
  if (room?.area) {
    schema.floorSize = {
      '@type': 'QuantitativeValue',
      value: room.area,
      unitCode: 'MTK'
    };
  }

  // Room type
  if (room?.room_type) {
    schema.numberOfRooms = room.room_type;
  }

  // Floor level
  if (room?.floor) {
    schema.floorLevel = room.floor;
  }

  // Address
  if (building?.address) {
    schema.address = {
      '@type': 'PostalAddress',
      addressLocality: building.address,
      addressCountry: 'JP',
      addressRegion: '日本'
    };
  }

  // Geo coordinates
  if (building?.latitude && building?.longitude) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: building.latitude,
      longitude: building.longitude
    };
  }

  // Building info
  if (building?.name) {
    schema.containedInPlace = {
      '@type': 'Apartment',
      name: building.name,
      ...(building.address && {
        address: {
          '@type': 'PostalAddress',
          addressLocality: building.address,
          addressCountry: 'JP'
        }
      })
    };
  }

  // Images
  if (property_publication_photos?.length > 0) {
    schema.image = property_publication_photos.map(photo => {
      const url = photo.room_photo?.photo_url || photo.photo_url;
      return url?.startsWith('http') ? url : `${SITE_CONFIG.url}${url}`;
    }).filter(Boolean);
  }

  // Facilities/Amenities
  if (Array.isArray(room?.facilities) && room.facilities.length > 0) {
    schema.amenityFeature = room.facilities.map(facility => ({
      '@type': 'LocationFeatureSpecification',
      name: facility,
      value: true
    }));
  }

  return schema;
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

/**
 * Generate WebPage schema
 */
export function generateWebPageSchema(options = {}) {
  const pageUrl = options.url || (typeof window !== 'undefined' ? window.location.href : '');

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': pageUrl,
    name: options.title,
    description: options.description,
    url: pageUrl,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url
    },
    ...(options.breadcrumb && {
      breadcrumb: {
        '@id': `${pageUrl}#breadcrumb`
      }
    }),
    ...(options.mainEntity && {
      mainEntity: {
        '@id': `${pageUrl}#${options.mainEntityType || 'main'}`
      }
    })
  };
}

/**
 * Generate SearchAction schema for site search
 */
export function generateSearchActionSchema(options = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}${options.searchPath || '/search'}?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };
}

/**
 * Generate FAQPage schema
 */
export function generateFAQSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

/**
 * Generate combined schema with @graph
 */
export function generateCombinedSchema(schemas) {
  return {
    '@context': 'https://schema.org',
    '@graph': schemas.filter(Boolean)
  };
}

/**
 * Generate full property page schema
 */
export function generateFullPropertyPageSchema(property, options = {}) {
  const pageUrl = options.url || `${SITE_CONFIG.url}/p/${property?.public_id || property?.id}`;

  const propertySchema = generatePropertySchema(property, { url: pageUrl });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'ホーム', url: SITE_CONFIG.url },
    { name: '物件情報', url: `${SITE_CONFIG.url}/property` },
    { name: property?.title || '物件詳細', url: pageUrl }
  ]);

  const webPageSchema = generateWebPageSchema({
    title: property?.title,
    description: property?.catch_copy,
    url: pageUrl,
    breadcrumb: true,
    mainEntity: true,
    mainEntityType: 'listing'
  });

  return generateCombinedSchema([
    propertySchema,
    breadcrumbSchema,
    webPageSchema
  ]);
}

/**
 * Inject schema into document head
 */
export function injectSchema(schema, id = 'main-schema') {
  if (typeof document === 'undefined') return;

  let script = document.querySelector(`script[data-schema-id="${id}"]`);

  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema-id', id);
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(schema);
}

/**
 * Remove schema from document head
 */
export function removeSchema(id = 'main-schema') {
  if (typeof document === 'undefined') return;

  const script = document.querySelector(`script[data-schema-id="${id}"]`);
  if (script) {
    script.remove();
  }
}

export default {
  generateOrganizationSchema,
  generateLocalBusinessSchema,
  generatePropertySchema,
  generateBreadcrumbSchema,
  generateWebPageSchema,
  generateSearchActionSchema,
  generateFAQSchema,
  generateCombinedSchema,
  generateFullPropertyPageSchema,
  injectSchema,
  removeSchema
};
