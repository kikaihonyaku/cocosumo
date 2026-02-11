# frozen_string_literal: true

FactoryBot.define do
  factory :line_template do
    tenant
    sequence(:name) { |n| "LINE Template #{n}" }
    message_type { :text }
    content { "こんにちは、{{お客様名}}様" }
    position { 0 }

    trait :image do
      message_type { :image }
      image_url { "https://example.com/image.jpg" }
      content { "画像メッセージ" }
    end

    trait :flex do
      message_type { :flex }
      content { '{"type":"bubble","body":{"type":"box","layout":"vertical","contents":[{"type":"text","text":"Hello"}]}}' }
      flex_alt_text { "Flexメッセージ" }
    end
  end
end
