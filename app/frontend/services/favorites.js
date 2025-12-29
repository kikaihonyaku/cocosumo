/**
 * Favorites Service
 * Uses localStorage to store user's favorite properties
 * Works without login for public visitors
 */

const STORAGE_KEY = 'cocosumo_favorites';

/**
 * Get all favorites from localStorage
 * @returns {Array} Array of favorite property objects
 */
export const getFavorites = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Error reading favorites:', e);
    return [];
  }
};

/**
 * Check if a property is favorited
 * @param {string} publicationId - The publication ID to check
 * @returns {boolean} Whether the property is favorited
 */
export const isFavorite = (publicationId) => {
  const favorites = getFavorites();
  return favorites.some(fav => fav.publicationId === publicationId);
};

/**
 * Add a property to favorites
 * @param {object} property - Property data to save
 */
export const addFavorite = (property) => {
  const favorites = getFavorites();

  // Check if already exists
  if (favorites.some(fav => fav.publicationId === property.publicationId)) {
    return;
  }

  const favorite = {
    publicationId: property.publicationId,
    title: property.title,
    catchCopy: property.catchCopy,
    thumbnailUrl: property.thumbnailUrl,
    address: property.address,
    rent: property.rent,
    roomType: property.roomType,
    area: property.area,
    addedAt: new Date().toISOString()
  };

  favorites.unshift(favorite); // Add to beginning

  // Limit to 50 favorites
  const limited = favorites.slice(0, 50);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
  } catch (e) {
    console.error('Error saving favorite:', e);
  }
};

/**
 * Remove a property from favorites
 * @param {string} publicationId - The publication ID to remove
 */
export const removeFavorite = (publicationId) => {
  const favorites = getFavorites();
  const filtered = favorites.filter(fav => fav.publicationId !== publicationId);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Error removing favorite:', e);
  }
};

/**
 * Toggle favorite status
 * @param {object} property - Property data
 * @returns {boolean} New favorite status
 */
export const toggleFavorite = (property) => {
  if (isFavorite(property.publicationId)) {
    removeFavorite(property.publicationId);
    return false;
  } else {
    addFavorite(property);
    return true;
  }
};

/**
 * Get favorites count
 * @returns {number} Number of favorites
 */
export const getFavoritesCount = () => {
  return getFavorites().length;
};

/**
 * Clear all favorites
 */
export const clearFavorites = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Error clearing favorites:', e);
  }
};

export default {
  getFavorites,
  isFavorite,
  addFavorite,
  removeFavorite,
  toggleFavorite,
  getFavoritesCount,
  clearFavorites
};
