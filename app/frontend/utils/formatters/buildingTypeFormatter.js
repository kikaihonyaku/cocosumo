/**
 * 建物種別のラベル変換ユーティリティ
 */

const BUILDING_TYPE_LABELS = {
  'apartment': 'アパート',
  'mansion': 'マンション',
  'house': '一戸建て',
  'office': 'オフィス',
};

/**
 * 建物種別を日本語ラベルに変換
 * @param {string} type - 建物種別
 * @returns {string} 日本語ラベル
 */
export const getBuildingTypeLabel = (type) => {
  if (!type) return '-';
  return BUILDING_TYPE_LABELS[type] || type;
};

export default { getBuildingTypeLabel, BUILDING_TYPE_LABELS };
