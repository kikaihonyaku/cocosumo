/**
 * 間取りタイプのラベル変換ユーティリティ
 */

const ROOM_TYPE_LABELS = {
  // 英語enum値 → 日本語ラベル
  'studio': 'ワンルーム',
  'one_room': '1R',
  'one_bedroom': '1K',
  'one_k': '1K',
  'one_dk': '1DK',
  'one_ldk': '1LDK',
  'two_bedroom': '2K',
  'two_k': '2K',
  'two_dk': '2DK',
  'two_ldk': '2LDK',
  'three_bedroom': '3K',
  'three_k': '3K',
  'three_dk': '3DK',
  'three_ldk': '3LDK',
  'four_ldk': '4LDK',
  'four_ldk_or_more': '4LDK以上',
  'other': 'その他',
  // 日本語表記がそのまま入っている場合
  '1R': '1R',
  '1K': '1K',
  '1DK': '1DK',
  '1LDK': '1LDK',
  '2K': '2K',
  '2DK': '2DK',
  '2LDK': '2LDK',
  '3K': '3K',
  '3DK': '3DK',
  '3LDK': '3LDK',
  '4LDK': '4LDK',
  '4LDK以上': '4LDK以上',
  'ワンルーム': 'ワンルーム',
  'その他': 'その他',
};

/**
 * 間取りタイプを日本語ラベルに変換
 * @param {string} type - 間取りタイプ（英語enumまたは日本語）
 * @returns {string} 日本語ラベル
 */
export const getRoomTypeLabel = (type) => {
  if (!type) return '-';
  return ROOM_TYPE_LABELS[type] || type;
};

/**
 * 間取りタイプのラベルマップを取得
 * @returns {Object} ラベルマップ
 */
export const getRoomTypeLabelMap = () => ROOM_TYPE_LABELS;

export default {
  getRoomTypeLabel,
  getRoomTypeLabelMap,
  ROOM_TYPE_LABELS,
};
