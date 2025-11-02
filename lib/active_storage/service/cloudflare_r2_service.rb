# frozen_string_literal: true

require "active_storage/service/s3_service"

module ActiveStorage
  class Service
    # Cloudflare R2用のカスタムサービス
    # R2はAWS S3互換だが、チェックサム機能に一部非互換がある
    class CloudflareR2Service < S3Service
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

          client.put_object(**upload_options, bucket: bucket.name, key: key)
        end
      end

      def upload_with_multipart(key, io, checksum: nil, filename: nil, content_type: nil, disposition: nil, custom_metadata: {}, **)
        instrument :upload, key: key, checksum: checksum do
          content_disposition = content_disposition_with(type: disposition, filename: filename) if disposition && filename

          # マルチパートアップロードでもチェックサムを除外
          upload_options = {
            acl: "private",
            content_type: content_type,
            content_disposition: content_disposition,
            metadata: custom_metadata
          }

          client.create_multipart_upload(**upload_options, bucket: bucket.name, key: key) do |upload|
            parts = []
            part_number = 0

            io.each_chunk do |chunk|
              part_number += 1
              parts << client.upload_part(
                bucket: bucket.name,
                key: key,
                part_number: part_number,
                upload_id: upload.upload_id,
                body: chunk
              ).etag
            end

            client.complete_multipart_upload(
              bucket: bucket.name,
              key: key,
              upload_id: upload.upload_id,
              multipart_upload: { parts: parts.map.with_index { |etag, i| { etag: etag, part_number: i + 1 } } }
            )
          end
        end
      end
    end
  end
end
