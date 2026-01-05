class BuildingMatcherService
  THRESHOLDS = {
    name_similarity: 0.7,
    address_similarity: 0.7,
    distance_meters: 100
  }.freeze

  WEIGHTS = {
    name: 0.4,
    address: 0.35,
    location: 0.25
  }.freeze

  def initialize(tenant:)
    @tenant = tenant
  end

  # 類似建物を検索
  # @param name [String] 建物名
  # @param address [String] 住所
  # @param latitude [Float] 緯度（オプション）
  # @param longitude [Float] 経度（オプション）
  # @return [Array<Hash>] { building:, score:, reasons: [] }
  def find_similar(name:, address:, latitude: nil, longitude: nil)
    candidates = []

    # 1. 名前の正規化検索（完全一致）
    if name.present?
      normalized_name = normalize_name(name)
      name_matches = @tenant.buildings.kept.select do |b|
        normalize_name(b.name) == normalized_name
      end
      name_matches.each do |b|
        candidates << { building: b, reasons: ['名前が完全一致'] }
      end
    end

    # 2. 住所の部分一致検索
    if address.present?
      address_core = extract_address_core(address)
      if address_core.length >= 5
        address_matches = @tenant.buildings.kept
          .where('address LIKE ?', "%#{address_core}%")
          .where.not(id: candidates.map { |c| c[:building].id })
        address_matches.each do |b|
          candidates << { building: b, reasons: ['住所が部分一致'] }
        end
      end
    end

    # 3. 座標による近接検索（PostGIS ST_DWithin）
    if latitude.present? && longitude.present?
      nearby = @tenant.buildings.kept
        .within_radius(latitude, longitude, THRESHOLDS[:distance_meters])
        .where.not(id: candidates.map { |c| c[:building].id })
      nearby.each do |b|
        distance = b.distance_to(latitude, longitude)&.round(0) || 0
        candidates << { building: b, reasons: ["#{distance}m以内に存在"] }
      end
    end

    # 候補が0件の場合、座標周辺のより広い範囲も検索
    if candidates.empty? && latitude.present? && longitude.present?
      nearby = @tenant.buildings.kept
        .within_radius(latitude, longitude, 500)
        .order_by_distance(latitude, longitude)
        .limit(5)
      nearby.each do |b|
        distance = b.distance_to(latitude, longitude)&.round(0) || 0
        candidates << { building: b, reasons: ["#{distance}m付近に存在"] }
      end
    end

    # スコア計算
    results = candidates.map do |candidate|
      score = calculate_score(
        candidate[:building],
        name: name,
        address: address,
        latitude: latitude,
        longitude: longitude
      )
      candidate.merge(score: score)
    end

    # 重複を除去してスコア順にソート
    seen_ids = Set.new
    results.select! do |r|
      if seen_ids.include?(r[:building].id)
        false
      else
        seen_ids << r[:building].id
        true
      end
    end

    results.sort_by { |r| -r[:score] }.take(5)
  end

  private

  def calculate_score(building, name:, address:, latitude:, longitude:)
    score = 0.0

    # 名前の類似度
    if name.present? && building.name.present?
      name_sim = string_similarity(normalize_name(name), normalize_name(building.name))
      score += WEIGHTS[:name] * name_sim
    end

    # 住所の類似度
    if address.present? && building.address.present?
      addr_sim = string_similarity(extract_address_core(address), extract_address_core(building.address))
      score += WEIGHTS[:address] * addr_sim
    end

    # 座標の近さ（距離に反比例）
    if latitude.present? && longitude.present? && building.location.present?
      distance = building.distance_to(latitude, longitude) || Float::INFINITY
      if distance <= THRESHOLDS[:distance_meters]
        location_score = 1.0 - (distance / THRESHOLDS[:distance_meters])
        score += WEIGHTS[:location] * location_score
      end
    end

    (score * 100).round(2)
  end

  def normalize_name(name)
    name.to_s
        .unicode_normalize(:nfkc)
        .gsub(/[\s　]/, '')
        .tr('０-９', '0-9')
        .tr('Ａ-Ｚａ-ｚ', 'A-Za-z')
        .downcase
  end

  def extract_address_core(address)
    # 都道府県を除いた住所の核心部分を抽出
    address.to_s
           .gsub(/^(東京都|北海道|(?:京都|大阪)府|.{2,3}県)/, '')
           .gsub(/[\s　]/, '')
  end

  def string_similarity(str1, str2)
    return 1.0 if str1 == str2
    return 0.0 if str1.blank? || str2.blank?

    max_len = [str1.length, str2.length].max
    distance = levenshtein_distance(str1, str2)
    1.0 - (distance.to_f / max_len)
  end

  def levenshtein_distance(str1, str2)
    m = str1.length
    n = str2.length
    return n if m.zero?
    return m if n.zero?

    d = Array.new(m + 1) { Array.new(n + 1, 0) }

    (0..m).each { |i| d[i][0] = i }
    (0..n).each { |j| d[0][j] = j }

    (1..m).each do |i|
      (1..n).each do |j|
        cost = str1[i - 1] == str2[j - 1] ? 0 : 1
        d[i][j] = [
          d[i - 1][j] + 1,
          d[i][j - 1] + 1,
          d[i - 1][j - 1] + cost
        ].min
      end
    end

    d[m][n]
  end
end
