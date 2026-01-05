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
 * @param {Array} filters.facilities - ['air_conditioner', 'auto_lock', ...] 設備コード
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
    if (geoFilteredIds === null) {
      // GISフィルタがない場合（null）は全部屋を返す
      return allRooms;
    }
    // geoFilteredIds が空配列の場合は0件（フィルタ適用済みだが該当なし）
    if (geoFilteredIds.length === 0) {
      return [];
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
    filters?.facilities,
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

  // 地図ピン表示用のプロパティ
  // 賃料・間取り等のフィルタを適用し、GISフィルタは範囲内/外の情報として付与
  // （GIS範囲外は紫色で表示するため除外しない）
  const propertiesForMapPins = useMemo(() => {
    // まず、賃料・間取り等のフィルタ条件にマッチする物件IDを取得
    const filteredPropertyIds = new Set(filteredProperties.map(p => p.id));

    if (geoFilteredIds === null) {
      // GISフィルタがない場合は、賃料・間取り等のフィルタのみ適用
      return allProperties.filter(property => filteredPropertyIds.has(property.id));
    }

    // GISフィルタがある場合は、賃料・間取り等のフィルタを適用しつつ、
    // GIS範囲外の物件も含め、範囲内/外の情報を付与
    const geoIdSet = new Set(geoFilteredIds);

    // 賃料・間取り等のフィルタ条件にマッチする物件のみ（GISフィルタ前の全物件から）
    // ※GIS範囲外の物件も含めるため、allRoomsベースでフィルタし直す
    const allFilteredRooms = filterRooms(allRooms, filters, rangeSelections);
    const allFilteredPropertyIds = new Set(allFilteredRooms.map(r => r.building_id));

    return allProperties
      .filter(property => allFilteredPropertyIds.has(property.id))
      .map(property => ({
        ...property,
        isInGeoFilter: geoIdSet.has(property.id),
      }));
  }, [
    allProperties,
    filteredProperties,
    geoFilteredIds,
    allRooms,
    filters?.rentRange,
    filters?.roomTypes,
    filters?.areaRange,
    filters?.ageRange,
    filters?.facilities,
    rangeSelections?.selectedRentRanges,
    rangeSelections?.selectedAreaRanges,
    rangeSelections?.selectedAgeRanges,
  ]);

  return {
    allRooms,
    filteredRooms,
    filteredProperties,
    aggregations,
    propertiesForMapPins,
  };
}
