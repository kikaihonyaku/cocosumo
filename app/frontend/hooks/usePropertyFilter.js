import { useMemo } from 'react';
import {
  flattenRooms,
  filterRooms,
  buildFilteredProperties,
  calculateAggregations,
} from '../utils/propertyFilterUtils';

/**
 * 物件フィルタリングのカスタムフック
 * allPropertiesに対してフロントエンドでフィルタリングと集計を行う
 *
 * @param {Array} allProperties - API取得した全物件データ
 * @param {Object} filters - フィルタ条件
 * @param {Array} filters.rentRange - [min, max] 賃料範囲
 * @param {Array} filters.roomTypes - ['1K', '1LDK', ...] 間取り
 * @param {Array} filters.areaRange - [min, max] 面積範囲
 * @param {Array} filters.ageRange - [min, max] 築年数範囲
 * @param {Object} rangeSelections - 棒グラフ選択状態
 * @param {Array} rangeSelections.selectedRentRanges - 賃料範囲選択
 * @param {Array} rangeSelections.selectedAreaRanges - 面積範囲選択
 * @param {Array} rangeSelections.selectedAgeRanges - 築年数範囲選択
 * @returns {Object}
 */
export function usePropertyFilter(allProperties, filters, rangeSelections) {
  // 全部屋をフラット化（allPropertiesが変更された時のみ再計算）
  const allRooms = useMemo(() => {
    return flattenRooms(allProperties);
  }, [allProperties]);

  // フィルタ適用（フィルタ条件または元データが変更された時のみ再計算）
  const filteredRooms = useMemo(() => {
    return filterRooms(allRooms, filters, rangeSelections);
  }, [
    allRooms,
    filters?.rentRange,
    filters?.roomTypes,
    filters?.areaRange,
    filters?.ageRange,
    rangeSelections?.selectedRentRanges,
    rangeSelections?.selectedAreaRanges,
    rangeSelections?.selectedAgeRanges,
  ]);

  // フィルタ後の物件リスト再構築
  const filteredProperties = useMemo(() => {
    return buildFilteredProperties(allProperties, filteredRooms);
  }, [allProperties, filteredRooms]);

  // 集計計算（フィルタ後の部屋リストが変更された時のみ再計算）
  const aggregations = useMemo(() => {
    return calculateAggregations(filteredRooms);
  }, [filteredRooms]);

  return {
    allRooms,
    filteredRooms,
    filteredProperties,
    aggregations,
  };
}
