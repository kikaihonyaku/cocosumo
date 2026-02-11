# frozen_string_literal: true

require 'rails_helper'

RSpec.describe FlexMessageBuilder do
  let(:tenant) { create(:tenant) }
  let(:building) { create(:building, tenant: tenant, name: "テストマンション", address: "東京都渋谷区1-1-1") }
  let(:room) { create(:room, building: building, room_number: "301") }

  describe '.build_property_card' do
    it 'returns a bubble type flex message' do
      result = described_class.build_property_card(room)
      expect(result[:type]).to eq("bubble")
    end

    it 'includes building name in body' do
      result = described_class.build_property_card(room)
      body_contents = result[:body][:contents]
      names = body_contents.map { |c| c[:text] }.compact
      expect(names).to include("テストマンション")
    end

    it 'includes room number in body' do
      result = described_class.build_property_card(room)
      body_contents = result[:body][:contents]
      texts = body_contents.map { |c| c[:text] }.compact
      expect(texts).to include("301号室")
    end

    it 'includes address in info box' do
      result = described_class.build_property_card(room)
      body = result[:body][:contents]
      info_box = body.find { |c| c[:type] == "box" && c[:layout] == "vertical" }
      next unless info_box

      labels = info_box[:contents].flat_map { |r|
        r[:contents]&.map { |c| c[:text] } || []
      }
      expect(labels).to include("住所")
    end
  end

  describe '.build_multi_property_card' do
    it 'returns a carousel with multiple bubbles' do
      room2 = create(:room, building: building, room_number: "302")
      result = described_class.build_multi_property_card([room, room2])

      expect(result[:type]).to eq("carousel")
      expect(result[:contents].length).to eq(2)
    end

    it 'limits to 10 items max' do
      rooms = 12.times.map { |i| create(:room, building: building, room_number: "#{400 + i}") }
      result = described_class.build_multi_property_card(rooms)

      expect(result[:contents].length).to eq(10)
    end
  end

  describe '.build_from_template' do
    let(:text_template) { create(:line_template, tenant: tenant, message_type: :text, content: "{{お客様名}}様、物件のご案内です") }

    it 'replaces placeholders in text template' do
      result = described_class.build_from_template(text_template, { "お客様名" => "鈴木" })
      expect(result[:type]).to eq("text")
      expect(result[:text]).to eq("鈴木様、物件のご案内です")
    end

    it 'returns flex message for flex template' do
      flex_template = create(:line_template, :flex, tenant: tenant)
      result = described_class.build_from_template(flex_template, {})
      expect(result[:type]).to eq("flex")
      expect(result[:contents]).to be_a(Hash)
    end

    it 'returns image message for image template' do
      image_template = create(:line_template, :image, tenant: tenant, image_url: "https://example.com/img.jpg")
      result = described_class.build_from_template(image_template, {})
      expect(result[:type]).to eq("image")
      expect(result[:originalContentUrl]).to eq("https://example.com/img.jpg")
    end
  end
end
