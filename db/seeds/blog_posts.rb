# ブログ記事のシードデータ

puts "ブログ記事を作成中..."

Dir[Rails.root.join('db/seeds/blog_posts/*.rb')].sort.each do |file|
  load file
end

puts "✓ ブログ記事: #{BlogPost.count}件"
