# frozen_string_literal: true

module Suumo
  class AccessInfoParser
    # SUUMOのアクセス情報テキストをパースして構造化データに変換
    #
    # 入力例:
    #   "JR山手線/渋谷駅 歩5分 / 東京メトロ銀座線/渋谷駅 歩5分"
    #   "JR中央線/新宿駅 歩3分"
    #
    # 出力例:
    #   [
    #     { line_name: "JR山手線", station_name: "渋谷", walking_minutes: 5, raw_text: "JR山手線/渋谷駅 歩5分" },
    #     { line_name: "東京メトロ銀座線", station_name: "渋谷", walking_minutes: 5, raw_text: "東京メトロ銀座線/渋谷駅 歩5分" }
    #   ]
    def parse(access_text)
      return [] if access_text.blank?

      entries = access_text.split(%r{\s*/\s*(?=[^\s/]*線)})

      entries.filter_map { |entry| parse_entry(entry.strip) }
    end

    # パース結果をマスタデータと突合して BuildingStation 用のデータを生成
    def resolve(parsed_entries)
      parsed_entries.filter_map do |entry|
        station = find_station(entry[:line_name], entry[:station_name])
        next unless station

        {
          station: station,
          walking_minutes: entry[:walking_minutes],
          raw_text: entry[:raw_text]
        }
      end
    end

    # アクセス情報テキストからパース→マスタ突合までを一括実行
    def parse_and_resolve(access_text)
      parsed = parse(access_text)
      resolve(parsed)
    end

    private

    # 個別エントリのパース
    # "JR山手線/渋谷駅 歩5分" -> { line_name: "JR山手線", station_name: "渋谷", walking_minutes: 5, raw_text: "..." }
    def parse_entry(text)
      return nil if text.blank?

      # パターン1: "路線名/駅名駅 歩N分" or "路線名/駅名 徒歩N分"
      if text =~ %r{(.+?)[/／](.+?)駅?\s*(?:歩|徒歩)\s*(\d+)\s*分}
        line_name = $1.strip
        station_name = $2.strip.sub(/駅$/, '')
        walking_minutes = $3.to_i

        return {
          line_name: line_name,
          station_name: station_name,
          walking_minutes: walking_minutes,
          raw_text: text
        }
      end

      # パターン2: "路線名/駅名駅" (徒歩分数なし)
      if text =~ %r{(.+?)[/／](.+?)駅?$}
        line_name = $1.strip
        station_name = $2.strip.sub(/駅$/, '')

        return {
          line_name: line_name,
          station_name: station_name,
          walking_minutes: nil,
          raw_text: text
        }
      end

      nil
    end

    # マスタデータから駅を検索
    def find_station(line_name, station_name)
      # まず路線名で検索（部分一致）
      railway_lines = RailwayLine.active.where("name ILIKE ?", "%#{line_name}%")

      # 路線が見つかった場合、その路線内で駅名を検索
      if railway_lines.any?
        station = Station.active
                         .where(railway_line: railway_lines)
                         .where("name = ? OR name ILIKE ?", station_name, "%#{station_name}%")
                         .first
        return station if station
      end

      # 路線が見つからない場合、駅名だけで検索（最初にヒットしたものを返す）
      Station.active
             .where("name = ?", station_name)
             .first
    end
  end
end
