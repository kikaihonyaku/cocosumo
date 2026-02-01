# シードデータ作成

puts "シードデータを作成中..."

# テナント作成
tenant = Tenant.create!(
  name: "サンプル不動産株式会社",
  subdomain: "sample",
  settings: {
    theme_color: "#0168B7",
    company_info: {
      address: "東京都渋谷区1-2-3",
      phone: "03-1234-5678"
    }
  }
)

puts "✓ テナント作成完了: #{tenant.name}"

# ユーザー作成
super_admin_user = User.create!(
  tenant: tenant,
  email: "superadmin@example.com",
  name: "スーパー管理者",
  password: "password123",
  password_confirmation: "password123",
  role: :super_admin
)

admin_user = User.create!(
  tenant: tenant,
  email: "admin@example.com",
  name: "管理者ユーザー",
  password: "password123",
  password_confirmation: "password123",
  role: :admin
)

member_user = User.create!(
  tenant: tenant,
  email: "member@example.com",
  name: "一般ユーザー",
  password: "password123",
  password_confirmation: "password123",
  role: :member
)

puts "✓ ユーザー作成完了: #{User.count}人"

# 建物作成
building1 = Building.create!(
  tenant: tenant,
  name: "サンプルマンションA",
  address: "東京都渋谷区恵比寿1-1-1",
  latitude: 35.6465,
  longitude: 139.7104,
  building_type: :mansion,
  total_units: 20,
  description: "駅近の好立地マンションです。"
)

building2 = Building.create!(
  tenant: tenant,
  name: "サンプルアパートB",
  address: "東京都渋谷区代官山2-2-2",
  latitude: 35.6500,
  longitude: 139.7050,
  building_type: :apartment,
  total_units: 10,
  description: "閑静な住宅街にあるアパートです。"
)

puts "✓ 建物作成完了: #{Building.count}件"

# 部屋作成
room1 = Room.create!(
  building: building1,
  room_number: "101",
  floor: 1,
  room_type: :one_ldk,
  area: 45.5,
  rent: 120000,
  status: :vacant,
  description: "南向きの明るい1LDKです。"
)

room2 = Room.create!(
  building: building1,
  room_number: "201",
  floor: 2,
  room_type: :two_ldk,
  area: 60.0,
  rent: 150000,
  status: :vacant,
  description: "広々とした2LDKです。"
)

room3 = Room.create!(
  building: building1,
  room_number: "301",
  floor: 3,
  room_type: :one_bedroom,
  area: 30.0,
  rent: 95000,
  status: :occupied,
  description: "コンパクトな1Kタイプです。"
)

room4 = Room.create!(
  building: building2,
  room_number: "101",
  floor: 1,
  room_type: :studio,
  area: 25.0,
  rent: 80000,
  status: :vacant,
  description: "学生向けのワンルームです。"
)

puts "✓ 部屋作成完了: #{Room.count}件"

# VRツアー作成（サンプル）
vr_tour = VrTour.create!(
  room: room1,
  title: "サンプルマンションA 101号室 VRツアー",
  description: "360度パノラマビューで部屋をご覧いただけます。",
  config: {
    scenes: [
      {
        id: "living",
        title: "リビング",
        panorama_url: "/sample-panorama-living.jpg",
        hotspots: []
      }
    ]
  },
  status: :draft
)

puts "✓ VRツアー作成完了: #{VrTour.count}件"

puts "\n=== シードデータ作成完了 ==="
puts "テナント: #{Tenant.count}件"
puts "ユーザー: #{User.count}人"
puts "建物: #{Building.count}件"
puts "部屋: #{Room.count}件"
puts "VRツアー: #{VrTour.count}件"
puts "\nログイン情報:"
puts "スーパー管理者 - Email: superadmin@example.com / Password: password123"
puts "管理者 - Email: admin@example.com / Password: password123"
puts "一般ユーザー - Email: member@example.com / Password: password123"

# ブログ記事のシードデータを読み込み
puts "\n"
load Rails.root.join('db/seeds/blog_posts.rb')

# 設備マスタのシードデータを読み込み
load Rails.root.join('db/seeds/facilities.rb')

# 沿線・駅マスタのシードデータを読み込み
load Rails.root.join('db/seeds/railway_stations.rb')
