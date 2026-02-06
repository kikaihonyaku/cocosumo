# GeoJSONファイルアップロード用のマルチパート制限を緩和
# デフォルトは128（パーツ数）
# 256はGeoJSON等の大きなフォーム送信に対応しつつ、DoSリスクを抑制
Rack::Utils.multipart_total_part_limit = 256
Rack::Utils.multipart_file_limit = 50
