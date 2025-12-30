/**
 * Property Comparison Service
 * Uses localStorage to store properties for comparison
 * Maximum 4 properties can be compared at once
 */

const STORAGE_KEY = 'cocosumo_comparison';
const MAX_COMPARE_COUNT = 4;

/**
 * Get all properties in comparison list
 * @returns {Array} Array of property objects for comparison
 */
export const getCompareList = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Error reading comparison list:', e);
    return [];
  }
};

/**
 * Check if a property is in comparison list
 * @param {string} publicationId - The publication ID to check
 * @returns {boolean} Whether the property is in comparison
 */
export const isInComparison = (publicationId) => {
  const list = getCompareList();
  return list.some(item => item.publicationId === publicationId);
};

/**
 * Add a property to comparison list
 * @param {object} property - Property data to add
 * @returns {boolean} Whether the property was added (false if list is full)
 */
export const addToComparison = (property) => {
  const list = getCompareList();

  // Check if already exists
  if (list.some(item => item.publicationId === property.publicationId)) {
    return true; // Already in list
  }

  // Check max limit
  if (list.length >= MAX_COMPARE_COUNT) {
    return false; // List is full
  }

  const compareItem = {
    publicationId: property.publicationId,
    title: property.title,
    catchCopy: property.catchCopy,
    thumbnailUrl: property.thumbnailUrl,
    address: property.address,
    rent: property.rent,
    managementFee: property.managementFee,
    deposit: property.deposit,
    keyMoney: property.keyMoney,
    roomType: property.roomType,
    area: property.area,
    floor: property.floor,
    builtYear: property.builtYear,
    buildingType: property.buildingType,
    structure: property.structure,
    facilities: property.facilities,
    addedAt: new Date().toISOString()
  };

  list.push(compareItem);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    // Dispatch custom event for cross-component updates
    window.dispatchEvent(new CustomEvent('comparison-updated', { detail: list }));
    return true;
  } catch (e) {
    console.error('Error adding to comparison:', e);
    return false;
  }
};

/**
 * Remove a property from comparison list
 * @param {string} publicationId - The publication ID to remove
 */
export const removeFromComparison = (publicationId) => {
  const list = getCompareList();
  const filtered = list.filter(item => item.publicationId !== publicationId);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    // Dispatch custom event for cross-component updates
    window.dispatchEvent(new CustomEvent('comparison-updated', { detail: filtered }));
  } catch (e) {
    console.error('Error removing from comparison:', e);
  }
};

/**
 * Toggle comparison status
 * @param {object} property - Property data
 * @returns {object} { success: boolean, inList: boolean, message?: string }
 */
export const toggleComparison = (property) => {
  if (isInComparison(property.publicationId)) {
    removeFromComparison(property.publicationId);
    return { success: true, inList: false };
  } else {
    const success = addToComparison(property);
    if (!success) {
      return {
        success: false,
        inList: false,
        message: `比較リストは最大${MAX_COMPARE_COUNT}件までです`
      };
    }
    return { success: true, inList: true };
  }
};

/**
 * Get comparison list count
 * @returns {number} Number of properties in comparison
 */
export const getCompareCount = () => {
  return getCompareList().length;
};

/**
 * Get max comparison count
 * @returns {number} Maximum number of properties that can be compared
 */
export const getMaxCompareCount = () => {
  return MAX_COMPARE_COUNT;
};

/**
 * Clear comparison list
 */
export const clearComparison = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('comparison-updated', { detail: [] }));
  } catch (e) {
    console.error('Error clearing comparison:', e);
  }
};

export default {
  getCompareList,
  isInComparison,
  addToComparison,
  removeFromComparison,
  toggleComparison,
  getCompareCount,
  getMaxCompareCount,
  clearComparison
};
