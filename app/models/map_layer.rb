class MapLayer < ApplicationRecord
  belongs_to :tenant
  has_many :school_districts, dependent: :nullify

  # バリデーション
  validates :name, presence: true
  validates :layer_key, presence: true, uniqueness: { scope: :tenant_id }
  validates :layer_type, presence: true
  validates :color, presence: true
  validates :opacity, presence: true, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 1 }

  # スコープ
  scope :active, -> { where(is_active: true) }
  scope :by_type, ->(type) { where(layer_type: type) }
  scope :ordered, -> { order(display_order: :asc, created_at: :asc) }

  # レイヤータイプの定義
  LAYER_TYPES = {
    'school_districts' => {
      label: '学区',
      model: 'SchoolDistrict',
      supports_school_type: true
    },
    'parks' => {
      label: '公園',
      model: 'Park',
      supports_school_type: false
    },
    'train_stations' => {
      label: '駅',
      model: 'TrainStation',
      supports_school_type: false
    }
  }.freeze

  # フィーチャー数を更新
  def update_feature_count!
    case layer_type
    when 'school_districts'
      update!(feature_count: school_districts.count)
    # 将来的に他のレイヤータイプが追加された場合はここに追記
    end
  end

  # レイヤーのデータを取得（GeoJSON形式）
  def to_geojson
    case layer_type
    when 'school_districts'
      SchoolDistrict.to_geojson_feature_collection(school_districts)
    # 将来的に他のレイヤータイプが追加された場合はここに追記
    else
      { type: 'FeatureCollection', features: [] }
    end
  end

  # 表示用の設定情報を返す
  def display_config
    {
      id: id,
      name: name,
      layer_key: layer_key,
      layer_type: layer_type,
      color: color,
      opacity: opacity,
      is_active: is_active,
      feature_count: feature_count,
      attribution: attribution,
      display_order: display_order
    }
  end
end
