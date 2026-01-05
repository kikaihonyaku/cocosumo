namespace :facilities do
  desc '既存のrooms.facilitiesデータを正規化して変換'
  task migrate: :environment do
    puts "=== 設備データ移行開始 ==="

    normalizer = FacilityNormalizer.new
    stats = { processed: 0, rooms_with_facilities: 0, matched: 0, unmatched: 0 }

    Room.where.not(facilities: [nil, '']).find_each do |room|
      result = normalizer.normalize(room.facilities)

      # room_facilitiesに登録
      result[:matched].each do |match|
        RoomFacility.find_or_create_by!(
          room: room,
          facility: match[:facility]
        ) do |rf|
          rf.raw_text = match[:raw_text]
        end
        stats[:matched] += 1
      end

      # 未マッチを記録
      result[:unmatched].each do |raw|
        unmatched = UnmatchedFacility.find_or_initialize_by(room: room, raw_text: raw)
        if unmatched.new_record?
          unmatched.save!
        else
          unmatched.increment!(:occurrence_count)
        end
        stats[:unmatched] += 1
      end

      stats[:rooms_with_facilities] += 1 if result[:matched].any? || result[:unmatched].any?
      stats[:processed] += 1
      print '.' if stats[:processed] % 100 == 0
    end

    puts "\n\n=== 設備データ移行完了 ==="
    puts "処理した部屋数: #{stats[:processed]}件"
    puts "設備がある部屋: #{stats[:rooms_with_facilities]}件"
    puts "マッチした設備: #{stats[:matched]}件"
    puts "未マッチ設備: #{stats[:unmatched]}件"
  end

  desc '未マッチ設備の出現頻度レポート'
  task report_unmatched: :environment do
    puts "=== 未マッチ設備 出現頻度レポート ==="
    puts ""

    unmatched = UnmatchedFacility.where(status: :pending)
                                  .group(:raw_text)
                                  .count

    if unmatched.empty?
      puts "未マッチ設備はありません。"
    else
      puts "Top 50:"
      unmatched.sort_by { |_, v| -v }
               .first(50)
               .each_with_index do |(text, count), i|
        puts "  #{(i + 1).to_s.rjust(3)}. #{count.to_s.rjust(5)}件 : #{text}"
      end
      puts ""
      puts "合計: #{unmatched.values.sum}件（#{unmatched.keys.length}種類）"
    end
  end

  desc '設備マスタの統計を表示'
  task stats: :environment do
    puts "=== 設備マスタ統計 ==="
    puts ""
    puts "設備マスタ: #{Facility.count}件"
    puts "同義語: #{FacilitySynonym.count}件"
    puts "部屋-設備紐付け: #{RoomFacility.count}件"
    puts "未マッチ設備: #{UnmatchedFacility.count}件"
    puts ""

    puts "カテゴリ別設備数:"
    Facility::CATEGORIES.each do |code, label|
      count = Facility.where(category: code).count
      puts "  #{label}: #{count}件"
    end

    puts ""
    puts "人気設備:"
    Facility.popular.ordered.each do |f|
      room_count = f.room_facilities.count
      puts "  #{f.name}: #{room_count}部屋で使用"
    end
  end

  desc '設備シードデータを再投入'
  task seed: :environment do
    load Rails.root.join('db/seeds/facilities.rb')
  end
end
