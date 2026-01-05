// アスペクト比の定数定義
export const ASPECT_RATIOS = [
  { value: '1:1', label: '1:1 (正方形)', ratio: 1 },
  { value: '4:3', label: '4:3 (横)', ratio: 4 / 3 },
  { value: '16:9', label: '16:9 (横)', ratio: 16 / 9 },
  { value: '3:4', label: '3:4 (縦)', ratio: 3 / 4 },
  { value: '9:16', label: '9:16 (縦)', ratio: 9 / 16 },
  { value: 'free', label: 'フリー (任意)', ratio: null },
];

// サイズプリセットの定義（Web用・SNS用）
export const SIZE_PRESETS = {
  '1:1': [
    { label: '1200×1200 (大)', width: 1200, height: 1200 },
    { label: '1080×1080 (Instagram)', width: 1080, height: 1080 },
    { label: '800×800 (中)', width: 800, height: 800 },
  ],
  '4:3': [
    { label: '1200×900 (大)', width: 1200, height: 900 },
    { label: '800×600 (中)', width: 800, height: 600 },
  ],
  '16:9': [
    { label: '1920×1080 (Full HD)', width: 1920, height: 1080 },
    { label: '1280×720 (HD)', width: 1280, height: 720 },
    { label: '1200×675 (Twitter/X)', width: 1200, height: 675 },
    { label: '800×450 (小)', width: 800, height: 450 },
  ],
  '3:4': [
    { label: '1080×1440 (Instagram)', width: 1080, height: 1440 },
    { label: '900×1200 (大)', width: 900, height: 1200 },
    { label: '600×800 (中)', width: 600, height: 800 },
  ],
  '9:16': [
    { label: '1080×1920 (Instagram Story)', width: 1080, height: 1920 },
    { label: '675×1200 (大)', width: 675, height: 1200 },
    { label: '450×800 (中)', width: 450, height: 800 },
  ],
  'free': [],
};

// photo_typeを日本語に変換
export const BUILDING_PHOTO_TYPES = {
  exterior: '外観',
  entrance: 'エントランス',
  common_area: '共用部',
  parking: '駐車場',
  surroundings: '周辺環境',
  other: 'その他'
};

export const ROOM_PHOTO_TYPES = {
  interior: '内観',
  living: 'リビング',
  kitchen: 'キッチン',
  bathroom: 'バスルーム',
  floor_plan: '間取り図',
  exterior: '外観',
  other: 'その他'
};

export const getPhotoTypeLabel = (photoType, isBuilding) => {
  const types = isBuilding ? BUILDING_PHOTO_TYPES : ROOM_PHOTO_TYPES;
  return types[photoType] || photoType;
};
