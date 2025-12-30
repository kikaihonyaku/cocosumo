/**
 * Geographic Utilities
 * Distance calculations, coordinate transformations, and geo operations
 */

// Earth's radius in kilometers
const EARTH_RADIUS_KM = 6371;
const EARTH_RADIUS_M = 6371000;

/**
 * Convert degrees to radians
 */
export function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
export function toDegrees(radians) {
  return (radians * 180) / Math.PI;
}

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @param {string} unit - 'km' or 'm'
 * @returns {number} Distance in specified unit
 */
export function calculateDistance(lat1, lng1, lat2, lng2, unit = 'km') {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const radius = unit === 'm' ? EARTH_RADIUS_M : EARTH_RADIUS_KM;
  return radius * c;
}

/**
 * Format distance for display
 */
export function formatDistance(distance, unit = 'km') {
  if (unit === 'm') {
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(1)}km`;
    }
    return `${Math.round(distance)}m`;
  }

  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
}

/**
 * Calculate bearing (direction) between two points
 * @returns {number} Bearing in degrees (0-360, 0 = North)
 */
export function calculateBearing(lat1, lng1, lat2, lng2) {
  const dLng = toRadians(lng2 - lng1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

  let bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

/**
 * Get compass direction from bearing
 */
export function getCompassDirection(bearing) {
  const directions = [
    { min: 337.5, max: 360, name: '北', short: 'N' },
    { min: 0, max: 22.5, name: '北', short: 'N' },
    { min: 22.5, max: 67.5, name: '北東', short: 'NE' },
    { min: 67.5, max: 112.5, name: '東', short: 'E' },
    { min: 112.5, max: 157.5, name: '南東', short: 'SE' },
    { min: 157.5, max: 202.5, name: '南', short: 'S' },
    { min: 202.5, max: 247.5, name: '南西', short: 'SW' },
    { min: 247.5, max: 292.5, name: '西', short: 'W' },
    { min: 292.5, max: 337.5, name: '北西', short: 'NW' }
  ];

  const normalizedBearing = ((bearing % 360) + 360) % 360;

  for (const dir of directions) {
    if (normalizedBearing >= dir.min && normalizedBearing < dir.max) {
      return dir;
    }
  }

  return directions[0];
}

/**
 * Get destination point given start point, bearing, and distance
 */
export function getDestinationPoint(lat, lng, bearing, distanceKm) {
  const bearingRad = toRadians(bearing);
  const latRad = toRadians(lat);
  const lngRad = toRadians(lng);
  const angularDistance = distanceKm / EARTH_RADIUS_KM;

  const destLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(angularDistance) +
      Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearingRad)
  );

  const destLngRad =
    lngRad +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(latRad),
      Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(destLatRad)
    );

  return {
    lat: toDegrees(destLatRad),
    lng: toDegrees(destLngRad)
  };
}

/**
 * Calculate bounding box for a set of points
 */
export function calculateBounds(points) {
  if (!points || points.length === 0) {
    return null;
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const point of points) {
    const lat = point.lat ?? point.latitude ?? point[0];
    const lng = point.lng ?? point.longitude ?? point[1];

    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }

  return {
    north: maxLat,
    south: minLat,
    east: maxLng,
    west: minLng,
    center: {
      lat: (maxLat + minLat) / 2,
      lng: (maxLng + minLng) / 2
    }
  };
}

/**
 * Calculate center point (centroid) of points
 */
export function calculateCenterPoint(points) {
  if (!points || points.length === 0) {
    return null;
  }

  let sumLat = 0;
  let sumLng = 0;

  for (const point of points) {
    const lat = point.lat ?? point.latitude ?? point[0];
    const lng = point.lng ?? point.longitude ?? point[1];
    sumLat += lat;
    sumLng += lng;
  }

  return {
    lat: sumLat / points.length,
    lng: sumLng / points.length
  };
}

/**
 * Check if a point is inside a polygon
 */
export function isPointInPolygon(point, polygon) {
  const x = point.lng ?? point.longitude ?? point[1];
  const y = point.lat ?? point.latitude ?? point[0];

  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].lng ?? polygon[i].longitude ?? polygon[i][1];
    const yi = polygon[i].lat ?? polygon[i].latitude ?? polygon[i][0];
    const xj = polygon[j].lng ?? polygon[j].longitude ?? polygon[j][1];
    const yj = polygon[j].lat ?? polygon[j].latitude ?? polygon[j][0];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Check if a point is within radius of center point
 */
export function isPointInRadius(point, center, radiusKm) {
  const lat1 = point.lat ?? point.latitude ?? point[0];
  const lng1 = point.lng ?? point.longitude ?? point[1];
  const lat2 = center.lat ?? center.latitude ?? center[0];
  const lng2 = center.lng ?? center.longitude ?? center[1];

  const distance = calculateDistance(lat1, lng1, lat2, lng2);
  return distance <= radiusKm;
}

/**
 * Generate points on a circle (for radius visualization)
 */
export function generateCirclePoints(centerLat, centerLng, radiusKm, numPoints = 64) {
  const points = [];

  for (let i = 0; i < numPoints; i++) {
    const bearing = (360 / numPoints) * i;
    const point = getDestinationPoint(centerLat, centerLng, bearing, radiusKm);
    points.push(point);
  }

  // Close the circle
  points.push(points[0]);

  return points;
}

/**
 * Calculate polygon area using Shoelace formula (approximate for small areas)
 */
export function calculatePolygonArea(polygon) {
  if (!polygon || polygon.length < 3) return 0;

  // Convert to meters for area calculation
  const center = calculateCenterPoint(polygon);
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos(toRadians(center.lat));

  const coords = polygon.map((p) => ({
    x: (p.lng ?? p.longitude ?? p[1]) * metersPerDegreeLng,
    y: (p.lat ?? p.latitude ?? p[0]) * metersPerDegreeLat
  }));

  let area = 0;
  const n = coords.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coords[i].x * coords[j].y;
    area -= coords[j].x * coords[i].y;
  }

  return Math.abs(area / 2);
}

/**
 * Convert area to tsubo (Japanese unit)
 */
export function sqmToTsubo(sqm) {
  return sqm / 3.30579;
}

/**
 * Convert tsubo to square meters
 */
export function tsuboToSqm(tsubo) {
  return tsubo * 3.30579;
}

/**
 * Format area with appropriate unit
 */
export function formatArea(sqm, options = {}) {
  const { unit = 'sqm', decimals = 1 } = options;

  if (unit === 'tsubo') {
    const tsubo = sqmToTsubo(sqm);
    return `${tsubo.toFixed(decimals)}坪`;
  }

  if (sqm >= 10000) {
    return `${(sqm / 10000).toFixed(decimals)}ha`;
  }

  return `${sqm.toFixed(decimals)}㎡`;
}

/**
 * Filter points within bounds
 */
export function filterPointsInBounds(points, bounds) {
  return points.filter((point) => {
    const lat = point.lat ?? point.latitude ?? point[0];
    const lng = point.lng ?? point.longitude ?? point[1];

    return (
      lat >= bounds.south &&
      lat <= bounds.north &&
      lng >= bounds.west &&
      lng <= bounds.east
    );
  });
}

/**
 * Filter points within radius
 */
export function filterPointsInRadius(points, center, radiusKm) {
  return points.filter((point) => isPointInRadius(point, center, radiusKm));
}

/**
 * Sort points by distance from reference point
 */
export function sortByDistance(points, referencePoint) {
  const refLat = referencePoint.lat ?? referencePoint.latitude ?? referencePoint[0];
  const refLng = referencePoint.lng ?? referencePoint.longitude ?? referencePoint[1];

  return [...points]
    .map((point) => {
      const lat = point.lat ?? point.latitude ?? point[0];
      const lng = point.lng ?? point.longitude ?? point[1];
      const distance = calculateDistance(refLat, refLng, lat, lng);
      return { ...point, distance };
    })
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Get nearest point from a list
 */
export function getNearestPoint(points, referencePoint) {
  const sorted = sortByDistance(points, referencePoint);
  return sorted[0] || null;
}

/**
 * Cluster nearby points
 */
export function clusterPoints(points, radiusKm) {
  const clusters = [];
  const used = new Set();

  for (let i = 0; i < points.length; i++) {
    if (used.has(i)) continue;

    const cluster = {
      points: [points[i]],
      center: {
        lat: points[i].lat ?? points[i].latitude ?? points[i][0],
        lng: points[i].lng ?? points[i].longitude ?? points[i][1]
      }
    };

    used.add(i);

    for (let j = i + 1; j < points.length; j++) {
      if (used.has(j)) continue;

      if (isPointInRadius(points[j], cluster.center, radiusKm)) {
        cluster.points.push(points[j]);
        used.add(j);
      }
    }

    // Recalculate center
    cluster.center = calculateCenterPoint(cluster.points);
    cluster.count = cluster.points.length;
    clusters.push(cluster);
  }

  return clusters;
}

/**
 * Calculate appropriate zoom level for bounds
 */
export function calculateZoomLevel(bounds, mapWidth, mapHeight) {
  const WORLD_DIM = { height: 256, width: 256 };
  const ZOOM_MAX = 21;

  const latRad = (lat) => {
    const sin = Math.sin((lat * Math.PI) / 180);
    const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
    return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
  };

  const zoom = (mapPx, worldPx, fraction) => {
    return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
  };

  const latFraction = (latRad(bounds.north) - latRad(bounds.south)) / Math.PI;
  const lngDiff = bounds.east - bounds.west;
  const lngFraction = (lngDiff < 0 ? lngDiff + 360 : lngDiff) / 360;

  const latZoom = zoom(mapHeight, WORLD_DIM.height, latFraction);
  const lngZoom = zoom(mapWidth, WORLD_DIM.width, lngFraction);

  return Math.min(latZoom, lngZoom, ZOOM_MAX);
}

/**
 * Simplify polyline using Douglas-Peucker algorithm
 */
export function simplifyPolyline(points, tolerance = 0.0001) {
  if (points.length <= 2) return points;

  const getPerpendicularDistance = (point, lineStart, lineEnd) => {
    const x = point.lng ?? point[1];
    const y = point.lat ?? point[0];
    const x1 = lineStart.lng ?? lineStart[1];
    const y1 = lineStart.lat ?? lineStart[0];
    const x2 = lineEnd.lng ?? lineEnd[1];
    const y2 = lineEnd.lat ?? lineEnd[0];

    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  let maxDistance = 0;
  let maxIndex = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const distance = getPerpendicularDistance(
      points[i],
      points[0],
      points[points.length - 1]
    );

    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  if (maxDistance > tolerance) {
    const left = simplifyPolyline(points.slice(0, maxIndex + 1), tolerance);
    const right = simplifyPolyline(points.slice(maxIndex), tolerance);

    return left.slice(0, -1).concat(right);
  }

  return [points[0], points[points.length - 1]];
}

export default {
  toRadians,
  toDegrees,
  calculateDistance,
  formatDistance,
  calculateBearing,
  getCompassDirection,
  getDestinationPoint,
  calculateBounds,
  calculateCenterPoint,
  isPointInPolygon,
  isPointInRadius,
  generateCirclePoints,
  calculatePolygonArea,
  sqmToTsubo,
  tsuboToSqm,
  formatArea,
  filterPointsInBounds,
  filterPointsInRadius,
  sortByDistance,
  getNearestPoint,
  clusterPoints,
  calculateZoomLevel,
  simplifyPolyline,
  EARTH_RADIUS_KM,
  EARTH_RADIUS_M
};
