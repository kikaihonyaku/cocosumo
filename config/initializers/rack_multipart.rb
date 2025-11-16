# GeoJSONファイルアップロード用のマルチパート制限を緩和
# デフォルトは128（パーツ数）と65536バイト（パーツサイズ）
Rack::Utils.multipart_total_part_limit = 10000
Rack::Utils.multipart_file_limit = 100
