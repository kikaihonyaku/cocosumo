# Cloudflare R2用の設定
# R2はAWS SDKの新しいチェックサム機能に対応していないため無効化
Rails.application.config.after_initialize do
  if Rails.application.config.active_storage.service == :cloudflare_r2
    # AWS SDK S3クライアントのデフォルト設定を変更
    Aws.config.update(
      {
        s3: {
          compute_checksums: false
        }
      }
    )
  end
end
