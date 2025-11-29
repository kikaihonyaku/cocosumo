# frozen_string_literal: true

module Suumo
  class ImageDownloader
    def initialize
      @logger = Rails.logger
      @config = Rails.application.config.suumo
    end

    # Download and attach a building photo
    def download_and_attach_building_photo(url:, building:, photo_type:, display_order: 0, source_url: nil)
      @logger.info "[SUUMO ImageDownloader] Downloading building photo: #{url}"

      tempfile = download_image(url)
      return false unless tempfile

      begin
        filename = generate_filename(url)
        content_type = detect_content_type(tempfile, filename)

        photo = building.building_photos.new(
          photo_type: photo_type,
          display_order: display_order,
          source_url: source_url || url
        )

        photo.photo.attach(
          io: tempfile,
          filename: filename,
          content_type: content_type
        )

        if photo.save
          @logger.info "[SUUMO ImageDownloader] Successfully attached building photo: #{filename}"
          true
        else
          @logger.error "[SUUMO ImageDownloader] Failed to save building photo: #{photo.errors.full_messages.join(', ')}"
          false
        end
      ensure
        tempfile.close
        tempfile.unlink
      end
    rescue StandardError => e
      @logger.error "[SUUMO ImageDownloader] Error attaching building photo: #{e.message}"
      false
    end

    # Download and attach a room photo
    def download_and_attach_room_photo(url:, room:, photo_type:, display_order: 0, source_url: nil)
      @logger.info "[SUUMO ImageDownloader] Downloading room photo: #{url}"

      tempfile = download_image(url)
      return false unless tempfile

      begin
        filename = generate_filename(url)
        content_type = detect_content_type(tempfile, filename)

        photo = room.room_photos.new(
          photo_type: photo_type,
          display_order: display_order,
          source_url: source_url || url
        )

        photo.photo.attach(
          io: tempfile,
          filename: filename,
          content_type: content_type
        )

        if photo.save
          @logger.info "[SUUMO ImageDownloader] Successfully attached room photo: #{filename}"
          true
        else
          @logger.error "[SUUMO ImageDownloader] Failed to save room photo: #{photo.errors.full_messages.join(', ')}"
          false
        end
      ensure
        tempfile.close
        tempfile.unlink
      end
    rescue StandardError => e
      @logger.error "[SUUMO ImageDownloader] Error attaching room photo: #{e.message}"
      false
    end

    private

    def download_image(url)
      response = HTTParty.get(
        url,
        headers: request_headers,
        timeout: 30,
        follow_redirects: true
      )

      unless response.success?
        @logger.warn "[SUUMO ImageDownloader] Failed to download #{url}: HTTP #{response.code}"
        return nil
      end

      content_type = response.headers["content-type"]
      unless content_type&.start_with?("image/")
        @logger.warn "[SUUMO ImageDownloader] Not an image: #{url} (#{content_type})"
        return nil
      end

      # Create temp file
      extension = detect_extension(content_type, url)
      tempfile = Tempfile.new(["suumo_image", extension])
      tempfile.binmode
      tempfile.write(response.body)
      tempfile.rewind

      tempfile
    rescue StandardError => e
      @logger.error "[SUUMO ImageDownloader] Error downloading #{url}: #{e.message}"
      nil
    end

    def generate_filename(url)
      # Extract filename from URL or generate one
      uri = URI.parse(url)
      basename = File.basename(uri.path)

      if basename.present? && basename.include?(".")
        # Sanitize the filename
        basename.gsub(/[^a-zA-Z0-9._-]/, "_")
      else
        # Generate a unique filename
        "suumo_#{SecureRandom.hex(8)}.jpg"
      end
    end

    def detect_content_type(tempfile, filename)
      # Try to detect from file content first
      begin
        require "marcel"
        Marcel::MimeType.for(tempfile)
      rescue LoadError
        # Fall back to extension-based detection
        extension = File.extname(filename).downcase
        case extension
        when ".jpg", ".jpeg"
          "image/jpeg"
        when ".png"
          "image/png"
        when ".gif"
          "image/gif"
        when ".webp"
          "image/webp"
        else
          "image/jpeg"
        end
      end
    end

    def detect_extension(content_type, url)
      case content_type
      when /jpeg/
        ".jpg"
      when /png/
        ".png"
      when /gif/
        ".gif"
      when /webp/
        ".webp"
      else
        # Try to get from URL
        ext = File.extname(URI.parse(url).path)
        ext.present? ? ext : ".jpg"
      end
    end

    def request_headers
      {
        "User-Agent" => @config.user_agent,
        "Accept" => "image/webp,image/apng,image/*,*/*;q=0.8",
        "Referer" => "https://suumo.jp/"
      }
    end
  end
end
