# frozen_string_literal: true

require 'mini_magick'
require 'base64'

class AiImageWatermarkService
  WATERMARK_TEXT = 'AIイメージ'
  MIN_FONT_SIZE = 16
  MAX_FONT_SIZE = 48
  FONT_SIZE_RATIO = 0.03 # 画像幅の3%
  OPACITY = 0.5
  PADDING = 10 # 右下からのパディング（ピクセル）

  def initialize(base64_image)
    @base64_image = base64_image
  end

  # Base64画像にウォーターマークを追加して返す
  def add_watermark
    return @base64_image if @base64_image.blank?

    begin
      # Base64をデコードしてMiniMagickで読み込み
      image_data = Base64.decode64(@base64_image)
      image = MiniMagick::Image.read(image_data)

      # 画像サイズに基づいてフォントサイズを計算
      font_size = calculate_font_size(image.width)

      # ウォーターマークを追加
      add_watermark_to_image(image, font_size)

      # Base64にエンコードして返す
      Base64.strict_encode64(image.to_blob)
    rescue StandardError => e
      Rails.logger.error("AiImageWatermarkService error: #{e.message}")
      Rails.logger.error(e.backtrace.join("\n"))
      # エラー時は元の画像をそのまま返す
      @base64_image
    end
  end

  private

  def calculate_font_size(image_width)
    calculated_size = (image_width * FONT_SIZE_RATIO).to_i
    [[calculated_size, MIN_FONT_SIZE].max, MAX_FONT_SIZE].min
  end

  def add_watermark_to_image(image, font_size)
    font_path = find_japanese_font

    # 影付きテキストを描画（右下に配置）
    image.combine_options do |c|
      c.gravity 'SouthEast'
      c.font font_path if font_path
      c.pointsize font_size.to_s

      # 影を描画（黒、半透明）
      c.fill "rgba(0, 0, 0, 0.4)"
      c.annotate "+#{PADDING - 1}+#{PADDING - 1}", WATERMARK_TEXT
    end

    # メインテキストを描画（白、半透明）
    image.combine_options do |c|
      c.gravity 'SouthEast'
      c.font font_path if font_path
      c.pointsize font_size.to_s
      c.fill "rgba(255, 255, 255, #{OPACITY})"
      c.annotate "+#{PADDING}+#{PADDING}", WATERMARK_TEXT
    end
  end

  def find_japanese_font
    # 一般的な日本語フォントパスを優先順で検索
    font_paths = [
      # Noto Sans CJK JP（推奨）
      '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
      '/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc',
      '/usr/share/fonts/google-noto-cjk/NotoSansCJK-Regular.ttc',
      '/usr/share/fonts/OTF/NotoSansCJK-Regular.ttc',
      # Noto Sans JP
      '/usr/share/fonts/truetype/noto/NotoSansJP-Regular.ttf',
      '/usr/share/fonts/noto/NotoSansJP-Regular.ttf',
      # IPA フォント
      '/usr/share/fonts/ipa-gothic/ipag.ttf',
      '/usr/share/fonts/truetype/ipa-gothic/ipag.ttf',
      '/usr/share/fonts/ipa/ipag.ttf',
      '/usr/share/fonts/truetype/fonts-japanese-gothic.ttf',
      # Takao フォント
      '/usr/share/fonts/truetype/takao-gothic/TakaoGothic.ttf',
      # VL Gothic
      '/usr/share/fonts/truetype/vlgothic/VL-Gothic-Regular.ttf',
      # macOS
      '/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc',
      '/Library/Fonts/Arial Unicode.ttf'
    ]

    font_paths.find { |path| File.exist?(path) }
  end
end
