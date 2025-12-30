/**
 * Address Formatter
 * Japanese address formatting and parsing utilities
 */

// Prefecture list
export const PREFECTURES = [
  { code: '01', name: '北海道', nameKana: 'ホッカイドウ', region: '北海道' },
  { code: '02', name: '青森県', nameKana: 'アオモリケン', region: '東北' },
  { code: '03', name: '岩手県', nameKana: 'イワテケン', region: '東北' },
  { code: '04', name: '宮城県', nameKana: 'ミヤギケン', region: '東北' },
  { code: '05', name: '秋田県', nameKana: 'アキタケン', region: '東北' },
  { code: '06', name: '山形県', nameKana: 'ヤマガタケン', region: '東北' },
  { code: '07', name: '福島県', nameKana: 'フクシマケン', region: '東北' },
  { code: '08', name: '茨城県', nameKana: 'イバラキケン', region: '関東' },
  { code: '09', name: '栃木県', nameKana: 'トチギケン', region: '関東' },
  { code: '10', name: '群馬県', nameKana: 'グンマケン', region: '関東' },
  { code: '11', name: '埼玉県', nameKana: 'サイタマケン', region: '関東' },
  { code: '12', name: '千葉県', nameKana: 'チバケン', region: '関東' },
  { code: '13', name: '東京都', nameKana: 'トウキョウト', region: '関東' },
  { code: '14', name: '神奈川県', nameKana: 'カナガワケン', region: '関東' },
  { code: '15', name: '新潟県', nameKana: 'ニイガタケン', region: '中部' },
  { code: '16', name: '富山県', nameKana: 'トヤマケン', region: '中部' },
  { code: '17', name: '石川県', nameKana: 'イシカワケン', region: '中部' },
  { code: '18', name: '福井県', nameKana: 'フクイケン', region: '中部' },
  { code: '19', name: '山梨県', nameKana: 'ヤマナシケン', region: '中部' },
  { code: '20', name: '長野県', nameKana: 'ナガノケン', region: '中部' },
  { code: '21', name: '岐阜県', nameKana: 'ギフケン', region: '中部' },
  { code: '22', name: '静岡県', nameKana: 'シズオカケン', region: '中部' },
  { code: '23', name: '愛知県', nameKana: 'アイチケン', region: '中部' },
  { code: '24', name: '三重県', nameKana: 'ミエケン', region: '近畿' },
  { code: '25', name: '滋賀県', nameKana: 'シガケン', region: '近畿' },
  { code: '26', name: '京都府', nameKana: 'キョウトフ', region: '近畿' },
  { code: '27', name: '大阪府', nameKana: 'オオサカフ', region: '近畿' },
  { code: '28', name: '兵庫県', nameKana: 'ヒョウゴケン', region: '近畿' },
  { code: '29', name: '奈良県', nameKana: 'ナラケン', region: '近畿' },
  { code: '30', name: '和歌山県', nameKana: 'ワカヤマケン', region: '近畿' },
  { code: '31', name: '鳥取県', nameKana: 'トットリケン', region: '中国' },
  { code: '32', name: '島根県', nameKana: 'シマネケン', region: '中国' },
  { code: '33', name: '岡山県', nameKana: 'オカヤマケン', region: '中国' },
  { code: '34', name: '広島県', nameKana: 'ヒロシマケン', region: '中国' },
  { code: '35', name: '山口県', nameKana: 'ヤマグチケン', region: '中国' },
  { code: '36', name: '徳島県', nameKana: 'トクシマケン', region: '四国' },
  { code: '37', name: '香川県', nameKana: 'カガワケン', region: '四国' },
  { code: '38', name: '愛媛県', nameKana: 'エヒメケン', region: '四国' },
  { code: '39', name: '高知県', nameKana: 'コウチケン', region: '四国' },
  { code: '40', name: '福岡県', nameKana: 'フクオカケン', region: '九州' },
  { code: '41', name: '佐賀県', nameKana: 'サガケン', region: '九州' },
  { code: '42', name: '長崎県', nameKana: 'ナガサキケン', region: '九州' },
  { code: '43', name: '熊本県', nameKana: 'クマモトケン', region: '九州' },
  { code: '44', name: '大分県', nameKana: 'オオイタケン', region: '九州' },
  { code: '45', name: '宮崎県', nameKana: 'ミヤザキケン', region: '九州' },
  { code: '46', name: '鹿児島県', nameKana: 'カゴシマケン', region: '九州' },
  { code: '47', name: '沖縄県', nameKana: 'オキナワケン', region: '沖縄' }
];

// Region list
export const REGIONS = [
  '北海道', '東北', '関東', '中部', '近畿', '中国', '四国', '九州', '沖縄'
];

/**
 * Format full address
 */
export function formatAddress(address, options = {}) {
  if (!address) return '';

  const {
    format = 'full', // 'full', 'short', 'oneline'
    separator = '\n',
    includePostalCode = true,
    includeBuilding = true
  } = options;

  // Handle string input
  if (typeof address === 'string') {
    return address;
  }

  const {
    postalCode,
    prefecture,
    city,
    district,
    block,
    building,
    room
  } = address;

  const parts = [];

  // Postal code
  if (includePostalCode && postalCode) {
    parts.push(formatPostalCode(postalCode));
  }

  // Main address
  const mainAddress = [
    prefecture,
    city,
    district,
    block
  ].filter(Boolean).join('');

  if (mainAddress) {
    parts.push(mainAddress);
  }

  // Building and room
  if (includeBuilding) {
    if (building) {
      parts.push(building);
    }
    if (room) {
      parts.push(room);
    }
  }

  // Format based on style
  switch (format) {
    case 'short':
      // Prefecture + City only
      return [prefecture, city].filter(Boolean).join('');

    case 'oneline':
      // All on one line
      return parts.join(' ');

    case 'full':
    default:
      // Full address with separators
      if (separator === '\n') {
        // Group logically for multi-line
        const lines = [];
        if (includePostalCode && postalCode) {
          lines.push(formatPostalCode(postalCode));
        }
        if (mainAddress) {
          lines.push(mainAddress);
        }
        if (includeBuilding && (building || room)) {
          lines.push([building, room].filter(Boolean).join(' '));
        }
        return lines.join(separator);
      }
      return parts.join(separator);
  }
}

/**
 * Format postal code
 */
export function formatPostalCode(postalCode, options = {}) {
  if (!postalCode) return '';

  const { prefix = '〒', separator = '-' } = options;

  // Clean the postal code
  const cleaned = String(postalCode).replace(/[^\d]/g, '');

  if (cleaned.length !== 7) {
    return prefix ? `${prefix}${postalCode}` : postalCode;
  }

  return `${prefix}${cleaned.slice(0, 3)}${separator}${cleaned.slice(3)}`;
}

/**
 * Parse postal code
 */
export function parsePostalCode(input) {
  if (!input) return '';

  return String(input).replace(/[^\d]/g, '').slice(0, 7);
}

/**
 * Validate postal code format
 */
export function isValidPostalCode(postalCode) {
  const cleaned = parsePostalCode(postalCode);
  return /^\d{7}$/.test(cleaned);
}

/**
 * Parse address string into components
 */
export function parseAddress(addressString) {
  if (!addressString) return null;

  const result = {
    postalCode: null,
    prefecture: null,
    city: null,
    district: null,
    block: null,
    building: null,
    room: null
  };

  let remaining = addressString.trim();

  // Extract postal code
  const postalMatch = remaining.match(/〒?(\d{3}[-－]?\d{4})/);
  if (postalMatch) {
    result.postalCode = parsePostalCode(postalMatch[1]);
    remaining = remaining.replace(postalMatch[0], '').trim();
  }

  // Extract prefecture
  const prefectureMatch = remaining.match(/^(.+?[都道府県])/);
  if (prefectureMatch) {
    const prefName = prefectureMatch[1];
    const pref = PREFECTURES.find((p) => p.name === prefName);
    if (pref) {
      result.prefecture = pref.name;
      remaining = remaining.slice(prefName.length).trim();
    }
  }

  // Extract city (市区町村)
  const cityMatch = remaining.match(/^(.+?[市区町村])/);
  if (cityMatch) {
    result.city = cityMatch[1];
    remaining = remaining.slice(cityMatch[1].length).trim();
  }

  // Extract district (町名)
  const districtMatch = remaining.match(/^(.+?[町丁目])/);
  if (districtMatch) {
    result.district = districtMatch[1];
    remaining = remaining.slice(districtMatch[1].length).trim();
  }

  // Extract block number (番地)
  const blockMatch = remaining.match(/^(\d+[-－]\d+[-－]?\d*|\d+番地?の?\d*)/);
  if (blockMatch) {
    result.block = blockMatch[1];
    remaining = remaining.slice(blockMatch[1].length).trim();
  }

  // Remaining is building/room
  if (remaining) {
    // Check for room number pattern
    const roomMatch = remaining.match(/(\d+号室?|\d+[階F]?\d*号?室?)$/);
    if (roomMatch) {
      result.room = roomMatch[1];
      result.building = remaining.slice(0, -roomMatch[1].length).trim();
    } else {
      result.building = remaining;
    }
  }

  return result;
}

/**
 * Get prefecture by name or code
 */
export function getPrefecture(nameOrCode) {
  if (!nameOrCode) return null;

  return PREFECTURES.find(
    (p) => p.name === nameOrCode || p.code === nameOrCode || p.nameKana === nameOrCode
  ) || null;
}

/**
 * Get prefectures by region
 */
export function getPrefecturesByRegion(region) {
  return PREFECTURES.filter((p) => p.region === region);
}

/**
 * Get prefecture name from code
 */
export function getPrefectureName(code) {
  const pref = getPrefecture(code);
  return pref ? pref.name : '';
}

/**
 * Get prefecture code from name
 */
export function getPrefectureCode(name) {
  const pref = getPrefecture(name);
  return pref ? pref.code : '';
}

/**
 * Format as short address (for display)
 */
export function formatShortAddress(address) {
  return formatAddress(address, { format: 'short', includePostalCode: false });
}

/**
 * Format as one-line address
 */
export function formatOneLineAddress(address) {
  return formatAddress(address, { format: 'oneline', includePostalCode: false });
}

/**
 * Format address for display (with HTML)
 */
export function formatAddressHtml(address) {
  const formatted = formatAddress(address, { separator: '<br>' });
  return formatted;
}

/**
 * Format address for maps URL
 */
export function formatAddressForMaps(address) {
  const fullAddress = formatAddress(address, {
    format: 'oneline',
    includePostalCode: false,
    includeBuilding: false
  });

  return encodeURIComponent(fullAddress);
}

/**
 * Get Google Maps URL for address
 */
export function getGoogleMapsUrl(address) {
  const encoded = formatAddressForMaps(address);
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}

/**
 * Get Google Maps directions URL
 */
export function getGoogleMapsDirectionsUrl(fromAddress, toAddress) {
  const origin = formatAddressForMaps(fromAddress);
  const destination = formatAddressForMaps(toAddress);
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
}

/**
 * Mask address for privacy
 */
export function maskAddress(address, options = {}) {
  const { showPrefecture = true, showCity = true } = options;

  if (typeof address === 'string') {
    const parsed = parseAddress(address);
    if (!parsed) return '***';
    address = parsed;
  }

  const parts = [];

  if (showPrefecture && address.prefecture) {
    parts.push(address.prefecture);
  }

  if (showCity && address.city) {
    parts.push(address.city);
  }

  if (parts.length === 0) {
    return '***';
  }

  return parts.join('') + '***';
}

/**
 * Calculate distance between two addresses (placeholder - needs geocoding API)
 */
export function calculateDistance(address1, address2) {
  // This would typically use a geocoding API
  // Returning null as placeholder
  return null;
}

/**
 * Format building floor
 */
export function formatFloor(floor) {
  if (!floor) return '';

  const num = parseInt(floor, 10);
  if (isNaN(num)) return floor;

  if (num < 0) {
    return `地下${Math.abs(num)}階`;
  }

  return `${num}階`;
}

/**
 * Format room number
 */
export function formatRoomNumber(room) {
  if (!room) return '';

  const num = String(room).replace(/[^\d]/g, '');
  if (!num) return room;

  return `${num}号室`;
}

export default {
  formatAddress,
  formatPostalCode,
  parsePostalCode,
  isValidPostalCode,
  parseAddress,
  getPrefecture,
  getPrefecturesByRegion,
  getPrefectureName,
  getPrefectureCode,
  formatShortAddress,
  formatOneLineAddress,
  formatAddressHtml,
  formatAddressForMaps,
  getGoogleMapsUrl,
  getGoogleMapsDirectionsUrl,
  maskAddress,
  formatFloor,
  formatRoomNumber,
  PREFECTURES,
  REGIONS
};
