class FacilityNormalizer
  def initialize
    @synonym_map = build_synonym_map
    @facility_name_map = build_facility_name_map
  end

  # カンマ区切り文字列から設備をマッピング
  # @param facilities_text [String] カンマ区切りの設備文字列
  # @return [Hash] { matched: [{facility:, raw_text:}], unmatched: [String] }
  def normalize(facilities_text)
    return { matched: [], unmatched: [] } if facilities_text.blank?

    raw_facilities = facilities_text.split(/[,、，\n]/).map(&:strip).reject(&:blank?)
    results = { matched: [], unmatched: [] }
    matched_facility_ids = Set.new

    raw_facilities.each do |raw|
      facility = find_facility(raw)
      if facility && !matched_facility_ids.include?(facility.id)
        results[:matched] << { facility: facility, raw_text: raw }
        matched_facility_ids << facility.id
      elsif facility.nil?
        results[:unmatched] << raw
      end
      # 同じ設備が既にマッチしている場合はスキップ
    end

    results
  end

  # 部屋の設備を更新
  # @param room [Room] 対象の部屋
  # @param facilities_text [String] カンマ区切りの設備文字列
  # @return [Hash] { matched: [{facility:, raw_text:}], unmatched: [String] }
  def update_room_facilities(room, facilities_text)
    result = normalize(facilities_text)

    Room.transaction do
      # 既存のroom_facilitiesを削除
      room.room_facilities.destroy_all

      # マッチした設備を登録
      result[:matched].each do |match|
        room.room_facilities.create!(
          facility: match[:facility],
          raw_text: match[:raw_text]
        )
      end

      # 未マッチ設備を記録
      result[:unmatched].each do |raw|
        unmatched = room.unmatched_facilities.find_or_initialize_by(raw_text: raw)
        if unmatched.new_record?
          unmatched.save!
        else
          unmatched.increment!(:occurrence_count)
        end
      end

      # 後方互換性のため元のテキストも保持
      room.update_column(:facilities, facilities_text) if facilities_text.present?
    end

    result
  end

  private

  def build_synonym_map
    FacilitySynonym.includes(:facility).each_with_object({}) do |syn, map|
      normalized = normalize_text(syn.synonym)
      map[normalized] = syn.facility
    end
  end

  def build_facility_name_map
    Facility.all.each_with_object({}) do |facility, map|
      normalized = normalize_text(facility.name)
      map[normalized] = facility
    end
  end

  def find_facility(raw_text)
    normalized = normalize_text(raw_text)

    # 1. 設備名との完全一致
    return @facility_name_map[normalized] if @facility_name_map[normalized]

    # 2. 同義語との完全一致
    return @synonym_map[normalized] if @synonym_map[normalized]

    # 3. 同義語がraw_textに含まれる（部分一致）
    @synonym_map.each do |syn, facility|
      return facility if normalized.include?(syn) && syn.length >= 3
    end

    # 4. raw_textが同義語に含まれる（逆方向部分一致）
    @synonym_map.each do |syn, facility|
      return facility if syn.include?(normalized) && normalized.length >= 3
    end

    # 5. 曖昧マッチング（編集距離）- 長い文字列のみ
    find_by_fuzzy_match(normalized) if normalized.length >= 4
  end

  def find_by_fuzzy_match(text)
    best_match = nil
    best_distance = Float::INFINITY

    @synonym_map.each do |syn, facility|
      next if syn.length < 3 # 短い同義語はスキップ

      distance = levenshtein_distance(text, syn)
      max_len = [text.length, syn.length].max
      similarity = 1.0 - (distance.to_f / max_len)

      # 類似度70%以上で、より良いマッチを探す
      if similarity >= 0.7 && distance < best_distance
        best_distance = distance
        best_match = facility
      end
    end

    best_match
  end

  def normalize_text(text)
    text.to_s
        .unicode_normalize(:nfkc)    # 全角→半角
        .downcase
        .gsub(/[\s　・\/]+/, '')     # 空白・中点・スラッシュ除去
        .gsub(/[（）()「」【】『』]/, '') # 括弧除去
        .gsub(/付き?$/, '')          # 末尾の「付き」「付」を除去
        .gsub(/有り?$/, '')          # 末尾の「有り」「有」を除去
        .gsub(/あり$/, '')           # 末尾の「あり」を除去
  end

  # Levenshtein距離の計算
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
          d[i - 1][j] + 1,      # 削除
          d[i][j - 1] + 1,      # 挿入
          d[i - 1][j - 1] + cost # 置換
        ].min
      end
    end

    d[m][n]
  end
end
