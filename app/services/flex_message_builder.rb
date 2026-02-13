class FlexMessageBuilder
  class << self
    # 物件カード（単体）
    def build_property_card(room, activity_id: nil)
      building = room.building
      photo_url = room_photo_url(room)

      {
        type: "bubble",
        hero: photo_url ? {
          type: "image",
          url: photo_url,
          size: "full",
          aspectRatio: "20:13",
          aspectMode: "cover"
        } : nil,
        body: {
          type: "box",
          layout: "vertical",
          contents: body_contents(room, building)
        },
        footer: footer_contents(room, activity_id: activity_id)
      }.compact
    end

    # カルーセル形式で複数物件
    def build_multi_property_card(rooms)
      bubbles = rooms.first(10).map { |room| build_property_card(room) }

      {
        type: "carousel",
        contents: bubbles
      }
    end

    # テンプレート変数置換
    def build_from_template(line_template, variables = {})
      content = line_template.content.dup
      variables.each do |key, value|
        content.gsub!("{{#{key}}}", value.to_s)
      end

      case line_template.message_type
      when "text"
        { type: "text", text: content }
      when "flex"
        flex_contents = JSON.parse(content)
        alt_text = line_template.flex_alt_text.presence || "メッセージ"
        {
          type: "flex",
          altText: apply_variables(alt_text, variables),
          contents: flex_contents
        }
      when "image"
        image_url = apply_variables(line_template.image_url || "", variables)
        {
          type: "image",
          originalContentUrl: image_url,
          previewImageUrl: image_url
        }
      end
    end

    private

    def body_contents(room, building)
      contents = []

      # 建物名
      contents << {
        type: "text",
        text: building&.name || "物件情報",
        weight: "bold",
        size: "lg",
        wrap: true
      }

      # 号室
      if room.room_number.present?
        contents << {
          type: "text",
          text: "#{room.room_number}号室",
          size: "sm",
          color: "#666666",
          margin: "sm"
        }
      end

      # 情報行
      info_box = {
        type: "box",
        layout: "vertical",
        margin: "lg",
        spacing: "sm",
        contents: []
      }

      # 賃料
      if room.respond_to?(:rent) && room.rent.present?
        info_box[:contents] << info_row("賃料", "#{number_with_delimiter(room.rent)}円")
      end

      # 間取り
      if room.respond_to?(:room_type) && room.room_type.present?
        info_box[:contents] << info_row("間取り", room.room_type_label)
      end

      # 面積
      if room.respond_to?(:area) && room.area.present?
        info_box[:contents] << info_row("面積", "#{room.area}㎡")
      end

      # 最寄駅
      if building&.respond_to?(:nearest_station) && building.nearest_station.present?
        info_box[:contents] << info_row("最寄駅", building.nearest_station)
      end

      # 住所
      if building&.address.present?
        info_box[:contents] << info_row("住所", building.address)
      end

      contents << info_box if info_box[:contents].any?
      contents
    end

    def footer_contents(room, activity_id: nil)
      # 物件公開ページがある場合のみフッター表示
      publication = room.property_publications.kept.published.first
      return nil unless publication

      base_url = Thread.current[:request_base_url] || Rails.application.config.x.default_base_url.presence || "https://cocosumo.jp"
      url = "#{base_url}/property/#{publication.publication_id}"

      # トラッキング URL に差し替え（activity_id がある場合のみ）
      if activity_id
        tracking = MessageTracking.create!(
          customer_activity_id: activity_id,
          destination_url: url
        )
        url = "#{base_url}/api/v1/t/#{tracking.token}"
      end

      {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            action: {
              type: "uri",
              label: "詳細を見る",
              uri: url
            }
          }
        ]
      }
    end

    def info_row(label, value)
      {
        type: "box",
        layout: "baseline",
        spacing: "sm",
        contents: [
          {
            type: "text",
            text: label,
            color: "#aaaaaa",
            size: "sm",
            flex: 2
          },
          {
            type: "text",
            text: value.to_s,
            wrap: true,
            color: "#666666",
            size: "sm",
            flex: 5
          }
        ]
      }
    end

    def room_photo_url(room)
      photo = room.room_photos.ordered.first
      return nil unless photo&.photo&.attached?

      if photo.photo.service.respond_to?(:url)
        photo.photo.url
      else
        Rails.application.routes.url_helpers.rails_blob_url(photo.photo, only_path: false)
      end
    rescue
      nil
    end

    def number_with_delimiter(number)
      number.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\1,').reverse
    end

    def apply_variables(text, variables)
      result = text.dup
      variables.each { |k, v| result.gsub!("{{#{k}}}", v.to_s) }
      result
    end
  end
end
