namespace :inquiry do
  desc "問い合わせ関連データを全削除（再構築前に実行）"
  task cleanup: :environment do
    ActiveRecord::Base.transaction do
      puts "CustomerActivity を削除..."
      CustomerActivity.delete_all

      puts "CustomerRoute を削除..."
      CustomerRoute.delete_all

      puts "CustomerAccess を削除..."
      CustomerAccess.delete_all

      puts "PropertyInquiry を削除..."
      PropertyInquiry.delete_all

      puts "Customer を削除..."
      Customer.delete_all

      puts "完了"
    end
  end
end
