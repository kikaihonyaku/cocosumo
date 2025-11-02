# frozen_string_literal: true

require "active_storage/service/s3_service"

module ActiveStorage
  class Service
    # Cloudflare R2用のカスタムサービス
    # R2はAWS S3互換だが、チェックサム機能に一部非互換がある
    class CloudflareR2Service < S3Service
      def initialize(public_url: nil, **options)
        @public_url = public_url
        super(**options.except(:public_url))
      end

      # 公開URLを返す
      def url(key, **options)
        if @public_url.present?
          "#{@public_url}/#{key}"
        else
          super
        end
      end

      private

      # アップロード時のオプションをカスタマイズ
      def upload_with_single_part(key, io, checksum: nil, content_type: nil, disposition: nil, filename: nil, custom_metadata: {}, **)
        instrument :upload, key: key, checksum: checksum do
          content_disposition = content_disposition_with(type: disposition, filename: filename) if disposition && filename

          # R2互換のためチェックサム関連のパラメータを削除
          upload_options = {
            body: io,
            content_type: content_type,
            content_disposition: content_disposition,
            metadata: custom_metadata
            # content_md5とchecksum_algorithmを明示的に除外
          }

          bucket.object(key).put(**upload_options)
        end
      end

      def upload_with_multipart(key, io, checksum: nil, filename: nil, content_type: nil, disposition: nil, custom_metadata: {}, **)
        instrument :upload, key: key, checksum: checksum do
          content_disposition = content_disposition_with(type: disposition, filename: filename) if disposition && filename

          # マルチパートアップロードでもチェックサムを除外
          object = bucket.object(key)

          object.upload_stream(
            content_type: content_type,
            content_disposition: content_disposition,
            metadata: custom_metadata
          ) do |write_stream|
            IO.copy_stream(io, write_stream)
          end
        end
      end
    end
  end
end
