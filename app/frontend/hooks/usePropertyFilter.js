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
 * @param {Array|null} geoFilteredIds - GISフィルタで絞り込まれた物件ID配列（nullの場合はGISフィルタなし）
 * @returns {Object}
 */
export function usePropertyFilter(allProperties, filters, rangeSelections, geoFilteredIds = null) {
  // 全部屋をフラット化（allPropertiesが変更された時のみ再計算）
  const allRooms = useMemo(() => {
    return flattenRooms(allProperties);
  }, [allProperties]);

  // GISフィルタ適用済みの部屋（geoFilteredIdsがある場合のみフィルタ）
  const geoFilteredRooms = useMemo(() => {
    if (!geoFilteredIds || geoFilteredIds.length === 0) {
      // GISフィルタがない場合は全部屋を返す
      return allRooms;
    }
    const geoIdSet = new Set(geoFilteredIds);
    return allRooms.filter(room => geoIdSet.has(room.building_id));
  }, [allRooms, geoFilteredIds]);

  // フィルタ適用（フィルタ条件または元データが変更された時のみ再計算）
  // GISフィルタ済みの部屋に対して、賃料・間取り等のフィルタを適用
  const filteredRooms = useMemo(() => {
    return filterRooms(geoFilteredRooms, filters, rangeSelections);
  }, [
    geoFilteredRooms,
    filters?.rentRange,
    filters?.roomTypes,
    filters?.areaRange,
    filters?.ageRange,
    rangeSelections?.selectedRentRanges,
    rangeSelections?.selectedAreaRanges,
    rangeSelections?.selectedAgeRanges,
  ]);

  // フィルタ後の物件リスト再構築（一覧表示・集計用）
  const filteredProperties = useMemo(() => {
    return buildFilteredProperties(allProperties, filteredRooms);
  }, [allProperties, filteredRooms]);

  // 集計計算（フィルタ後の部屋リストが変更された時のみ再計算）
  const aggregations = useMemo(() => {
    return calculateAggregations(filteredRooms);
  }, [filteredRooms]);

  // 地図ピン表示用: GISフィルタのみ適用したプロパティ
  // （賃料・間取り等のフィルタは適用しない - 全ピン表示用）
  const propertiesForMapPins = useMemo(() => {
    if (geoFilteredIds === null) {
      // GISフィルタがない場合は全物件
      return allProperties;
    }
    // GISフィルタがある場合は、範囲内/外の情報を付与
    const geoIdSet = new Set(geoFilteredIds);
    return allProperties.map(property => ({
      ...property,
      isInGeoFilter: geoIdSet.has(property.id),
    }));
  }, [allProperties, geoFilteredIds]);

  return {
    allRooms,
    filteredRooms,
    filteredProperties,
    aggregations,
    propertiesForMapPins,
  };
}
