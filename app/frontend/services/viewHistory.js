/**
 * View History Service
 * Tracks recently viewed properties using localStorage
 * Works without login for public visitors
 */

const STORAGE_KEY = 'cocosumo_view_history';
const MAX_HISTORY_COUNT = 20;

/**
 * Get view history from localStorage
 * @returns {Array} Array of viewed property objects
 */
export const getViewHistory = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Error reading view history:', e);
    return [];
  }
};

/**
 * Add a property to view history
 * @param {object} property - Property data to add
 */
export const addToHistory = (property) => {
  if (!property || !property.publicationId) return;

  const history = getViewHistory();

  // Remove if already exists (will be re-added at top)
  const filtered = history.filter(
    (item) => item.publicationId !== property.publicationId
  );

  const historyItem = {
    publicationId: property.publicationId,
    title: property.title,
    catchCopy: property.catchCopy,
    thumbnailUrl: property.thumbnailUrl,
    address: property.address,
    rent: property.rent,
    roomType: property.roomType,
    area: property.area,
    viewedAt: new Date().toISOString(),
    viewCount: (history.find(h => h.publicationId === property.publicationId)?.viewCount || 0) + 1
  };

  // Add to beginning
  filtered.unshift(historyItem);

  // Limit to max count
  const limited = filtered.slice(0, MAX_HISTORY_COUNT);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
    // Dispatch custom event for cross-component updates
    window.dispatchEvent(new CustomEvent('view-history-updated', { detail: limited }));
  } catch (e) {
    console.error('Error saving view history:', e);
  }
};

/**
 * Remove a property from view history
 * @param {string} publicationId - The publication ID to remove
 */
export const removeFromHistory = (publicationId) => {
  const history = getViewHistory();
  const filtered = history.filter((item) => item.publicationId !== publicationId);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('view-history-updated', { detail: filtered }));
  } catch (e) {
    console.error('Error removing from history:', e);
  }
};

/**
 * Check if a property is in view history
 * @param {string} publicationId - The publication ID to check
 * @returns {boolean} Whether the property is in history
 */
export const isInHistory = (publicationId) => {
  const history = getViewHistory();
  return history.some((item) => item.publicationId === publicationId);
};

/**
 * Get view history count
 * @returns {number} Number of items in history
 */
export const getHistoryCount = () => {
  return getViewHistory().length;
};

/**
 * Get recent history (limited count)
 * @param {number} limit - Maximum number of items to return
 * @returns {Array} Recent history items
 */
export const getRecentHistory = (limit = 5) => {
  return getViewHistory().slice(0, limit);
};

/**
 * Clear all view history
 */
export const clearHistory = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('view-history-updated', { detail: [] }));
  } catch (e) {
    console.error('Error clearing history:', e);
  }
};

/**
 * Format relative time (e.g., "5分前", "2時間前", "昨日")
 * @param {string} isoDate - ISO date string
 * @returns {string} Formatted relative time
 */
export const formatRelativeTime = (isoDate) => {
  const now = new Date();
  const date = new Date(isoDate);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'たった今';
  if (diffMin < 60) return `${diffMin}分前`;
  if (diffHour < 24) return `${diffHour}時間前`;
  if (diffDay === 1) return '昨日';
  if (diffDay < 7) return `${diffDay}日前`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}週間前`;
  return `${Math.floor(diffDay / 30)}ヶ月前`;
};

export default {
  getViewHistory,
  addToHistory,
  removeFromHistory,
  isInHistory,
  getHistoryCount,
  getRecentHistory,
  clearHistory,
  formatRelativeTime
};
