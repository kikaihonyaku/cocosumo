/**
 * 物件フィルタリング・集計ユーティリティ
 * バックエンドの property_analysis_controller.rb のロジックをJS実装
 */

// 定数
const RENT_MAX_THRESHOLD = 300000;
const AGE_MAX_THRESHOLD = 40;

/**
 * 物件配列から部屋をフラット化して抽出
 * @param {Array} properties - 物件配列
 * @returns {Array} 部屋配列（building参照付き）
 */
export function flattenRooms(properties) {
  if (!properties || !Array.isArray(properties)) {
    return [];
  }

  return properties.flatMap(property =>
    (property.rooms || []).map(room => ({
      ...room,
      building: property,
      building_id: property.id,
    }))
  );
}

/**
 * 範囲選択にマッチするかチェック
 * "0-50000" や "200000+" 形式に対応
 * @param {number} value - チェック対象の値
 * @param {Array} ranges - 範囲配列 ["0-50000", "100000-150000", "200000+"]
 * @returns {boolean}
 */
function matchesRangeSelection(value, ranges) {
  if (!ranges || ranges.length === 0) {
    return true;
  }

  return ranges.some(range => {
    if (range.endsWith('+')) {
      const min = parseFloat(range.replace('+', ''));
      return value >= min;
    }
    const [min, max] = range.split('-').map(parseFloat);
    return value >= min && value < max;
  });
}

/**
 * 部屋リストにフィルタを適用
 * @param {Array} rooms - 部屋配列（flattenRoomsの結果）
 * @param {Object} filters - フィルタ条件
 * @param {Array} filters.rentRange - [min, max]
 * @param {Array} filters.roomTypes - ['1K', '1LDK', ...]
 * @param {Array} filters.areaRange - [min, max]
 * @param {Array} filters.ageRange - [min, max]
 * @param {Array} filters.facilities - ['air_conditioner', 'auto_lock', ...] 設備コード
 * @param {Array} filters.railwayLineIds - 路線IDの配列
 * @param {Array} filters.stationIds - 駅IDの配列
 * @param {number} filters.maxWalkingMinutes - 最大徒歩分数
 * @param {Object} rangeSelections - 棒グラフ選択
 * @param {Array} rangeSelections.selectedRentRanges
 * @param {Array} rangeSelections.selectedAreaRanges
 * @param {Array} rangeSelections.selectedAgeRanges
 * @returns {Array} フィルタ後の部屋配列
 */
export function filterRooms(rooms, filters, rangeSelections = {}) {
  if (!rooms || !Array.isArray(rooms)) {
    return [];
  }

  const {
    rentRange = [0, RENT_MAX_THRESHOLD],
    roomTypes = [],
    areaRange = [0, 200],
    ageRange = [0, AGE_MAX_THRESHOLD],
    facilities = [],
    railwayLineIds = [],
    stationIds = [],
    maxWalkingMinutes = null
  } = filters || {};

  const {
    selectedRentRanges = [],
    selectedAreaRanges = [],
    selectedAgeRanges = []
  } = rangeSelections;

  const currentYear = new Date().getFullYear();

  return rooms.filter(room => {
    const rent = room.rent || 0;
    const area = room.area || 0;

    // 賃料フィルタ（スライダー）
    // 30万円以上は上限なしとして扱う（バックエンドと同じ）
    if (rentRange[0] > 0 && rent < rentRange[0]) return false;
    if (rentRange[1] < RENT_MAX_THRESHOLD && rent > rentRange[1]) return false;

    // 間取りフィルタ
    if (roomTypes.length > 0 && !roomTypes.includes(room.room_type)) {
      return false;
    }

    // 面積フィルタ（スライダー）
    if (areaRange[0] > 0 && area < areaRange[0]) return false;
    if (areaRange[1] < 200 && area > areaRange[1]) return false;

    // 築年数フィルタ（スライダー）
    // 40年以上は上限なしとして扱う（バックエンドと同じ）
    if (room.building?.built_date) {
      const builtYear = new Date(room.building.built_date).getFullYear();
      const age = currentYear - builtYear;
      if (ageRange[0] > 0 && age < ageRange[0]) return false;
      if (ageRange[1] < AGE_MAX_THRESHOLD && age > ageRange[1]) return false;
    }
    // 築年数不明の場合は含める（バックエンドと同じ）

    // 棒グラフ選択による賃料範囲フィルタ
    if (selectedRentRanges.length > 0) {
      if (!matchesRangeSelection(rent, selectedRentRanges)) return false;
    }

    // 棒グラフ選択による面積範囲フィルタ
    if (selectedAreaRanges.length > 0) {
      if (!matchesRangeSelection(area, selectedAreaRanges)) return false;
    }

    // 棒グラフ選択による築年数範囲フィルタ
    if (selectedAgeRanges.length > 0) {
      if (room.building?.built_date) {
        const builtYear = new Date(room.building.built_date).getFullYear();
        const age = currentYear - builtYear;
        if (!matchesRangeSelection(age, selectedAgeRanges)) return false;
      }
      // 築年数不明の場合は含める（バックエンドと同じ）
    }

    // 設備フィルタ（指定された全ての設備を持つ部屋のみ）
    if (facilities.length > 0) {
      const roomFacilities = room.facility_codes || [];
      const hasAllFacilities = facilities.every(f => roomFacilities.includes(f));
      if (!hasAllFacilities) return false;
    }

    // 沿線フィルタ（指定路線のいずれかの駅が紐づく建物）
    if (railwayLineIds.length > 0) {
      const buildingStations = room.building?.building_stations || [];
      const hasMatchingLine = buildingStations.some(bs =>
        railwayLineIds.includes(bs.station?.railway_line_id)
      );
      if (!hasMatchingLine) return false;
    }

    // 駅フィルタ（指定駅のいずれかが紐づく建物）
    if (stationIds.length > 0) {
      const buildingStations = room.building?.building_stations || [];
      const hasMatchingStation = buildingStations.some(bs =>
        stationIds.includes(bs.station_id)
      );
      if (!hasMatchingStation) return false;
    }

    // 徒歩分数フィルタ（指定分数以内の駅がある建物）
    if (maxWalkingMinutes != null && maxWalkingMinutes !== '') {
      const buildingStations = room.building?.building_stations || [];
      const hasNearStation = buildingStations.some(bs =>
        bs.walking_minutes != null && bs.walking_minutes <= Number(maxWalkingMinutes)
      );
      if (!hasNearStation) return false;
    }

    return true;
  });
}

/**
 * フィルタ後の部屋から物件リストを再構築
 * @param {Array} allProperties - 全物件配列
 * @param {Array} filteredRooms - フィルタ後の部屋配列
 * @returns {Array} フィルタ後の物件配列（room_cnt, free_cnt更新済み）
 */
export function buildFilteredProperties(allProperties, filteredRooms) {
  if (!allProperties || !Array.isArray(allProperties)) {
    return [];
  }
  if (!filteredRooms || !Array.isArray(filteredRooms)) {
    // filteredRoomsが空でも、部屋がない物件は表示する
    return allProperties.filter(property => !property.rooms || property.rooms.length === 0)
      .map(property => ({
        ...property,
        rooms: [],
        room_cnt: 0,
        free_cnt: 0,
      }));
  }

  const filteredRoomIds = new Set(filteredRooms.map(r => r.id));
  const filteredBuildingIds = new Set(filteredRooms.map(r => r.building_id));

  return allProperties
    .filter(property => {
      // フィルタされた部屋を持つ物件、または部屋がない物件を含める
      return filteredBuildingIds.has(property.id) || !property.rooms || property.rooms.length === 0;
    })
    .map(property => {
      const filteredRoomsForBuilding = (property.rooms || []).filter(room =>
        filteredRoomIds.has(room.id)
      );

      return {
        ...property,
        rooms: filteredRoomsForBuilding,
        room_cnt: filteredRoomsForBuilding.length,
        free_cnt: filteredRoomsForBuilding.filter(r => r.status === 'vacant').length,
      };
    });
}

/**
 * 集計データを計算
 * @param {Array} rooms - 部屋配列（flattenRoomsの結果）
 * @returns {Object} 集計データ
 */
export function calculateAggregations(rooms) {
  if (!rooms || !Array.isArray(rooms)) {
    return {
      total: 0,
      by_rent: getEmptyRentAggregation(),
      by_room_type: getEmptyRoomTypeAggregation(),
      by_area: getEmptyAreaAggregation(),
      by_building_age: getEmptyBuildingAgeAggregation(),
    };
  }

  const currentYear = new Date().getFullYear();

  // 賃料帯別集計
  const byRent = [
    { range: "0-50000", label: "〜5万円", count: 0 },
    { range: "50000-100000", label: "5〜10万円", count: 0 },
    { range: "100000-150000", label: "10〜15万円", count: 0 },
    { range: "150000-200000", label: "15〜20万円", count: 0 },
    { range: "200000+", label: "20万円〜", count: 0 },
  ];

  // 間取り別集計
  const byRoomType = {
    'studio': 0,
    '1K': 0,
    '1DK': 0,
    '1LDK': 0,
    '2K': 0,
    '2DK': 0,
    '2LDK': 0,
    '3K': 0,
    '3DK': 0,
    '3LDK': 0,
    'other': 0,
  };

  // 面積帯別集計
  const byArea = [
    { range: "0-20", label: "〜20㎡", count: 0 },
    { range: "20-40", label: "20〜40㎡", count: 0 },
    { range: "40-60", label: "40〜60㎡", count: 0 },
    { range: "60-80", label: "60〜80㎡", count: 0 },
    { range: "80+", label: "80㎡〜", count: 0 },
  ];

  // 築年数帯別集計
  const byBuildingAge = [
    { range: "0-5", label: "築5年以内", count: 0 },
    { range: "5-10", label: "築5〜10年", count: 0 },
    { range: "10-20", label: "築10〜20年", count: 0 },
    { range: "20-30", label: "築20〜30年", count: 0 },
    { range: "30+", label: "築30年以上", count: 0 },
  ];

  rooms.forEach(room => {
    const rent = room.rent || 0;
    const area = room.area || 0;

    // 賃料帯
    if (rent < 50000) byRent[0].count++;
    else if (rent < 100000) byRent[1].count++;
    else if (rent < 150000) byRent[2].count++;
    else if (rent < 200000) byRent[3].count++;
    else byRent[4].count++;

    // 間取り
    const roomType = room.room_type || 'other';
    if (byRoomType.hasOwnProperty(roomType)) {
      byRoomType[roomType]++;
    } else {
      byRoomType['other']++;
    }

    // 面積
    if (area < 20) byArea[0].count++;
    else if (area < 40) byArea[1].count++;
    else if (area < 60) byArea[2].count++;
    else if (area < 80) byArea[3].count++;
    else byArea[4].count++;

    // 築年数
    if (room.building?.built_date) {
      const builtYear = new Date(room.building.built_date).getFullYear();
      const age = currentYear - builtYear;

      if (age < 5) byBuildingAge[0].count++;
      else if (age < 10) byBuildingAge[1].count++;
      else if (age < 20) byBuildingAge[2].count++;
      else if (age < 30) byBuildingAge[3].count++;
      else byBuildingAge[4].count++;
    }
  });

  return {
    total: rooms.length,
    by_rent: byRent,
    by_room_type: byRoomType,
    by_area: byArea,
    by_building_age: byBuildingAge,
  };
}

// 空の集計データを返すヘルパー関数
function getEmptyRentAggregation() {
  return [
    { range: "0-50000", label: "〜5万円", count: 0 },
    { range: "50000-100000", label: "5〜10万円", count: 0 },
    { range: "100000-150000", label: "10〜15万円", count: 0 },
    { range: "150000-200000", label: "15〜20万円", count: 0 },
    { range: "200000+", label: "20万円〜", count: 0 },
  ];
}

function getEmptyRoomTypeAggregation() {
  return {
    'studio': 0, '1K': 0, '1DK': 0, '1LDK': 0,
    '2K': 0, '2DK': 0, '2LDK': 0,
    '3K': 0, '3DK': 0, '3LDK': 0, 'other': 0,
  };
}

function getEmptyAreaAggregation() {
  return [
    { range: "0-20", label: "〜20㎡", count: 0 },
    { range: "20-40", label: "20〜40㎡", count: 0 },
    { range: "40-60", label: "40〜60㎡", count: 0 },
    { range: "60-80", label: "60〜80㎡", count: 0 },
    { range: "80+", label: "80㎡〜", count: 0 },
  ];
}

function getEmptyBuildingAgeAggregation() {
  return [
    { range: "0-5", label: "築5年以内", count: 0 },
    { range: "5-10", label: "築5〜10年", count: 0 },
    { range: "10-20", label: "築10〜20年", count: 0 },
    { range: "20-30", label: "築20〜30年", count: 0 },
    { range: "30+", label: "築30年以上", count: 0 },
  ];
}
