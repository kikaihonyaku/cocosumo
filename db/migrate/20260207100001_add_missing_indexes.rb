class AddMissingIndexes < ActiveRecord::Migration[8.0]
  def change
    # 複合インデックス: 顧客の商談ステータスフィルタで使用
    add_index :property_inquiries, [:customer_id, :deal_status],
              name: "index_property_inquiries_on_customer_deal_status"
  end
end
