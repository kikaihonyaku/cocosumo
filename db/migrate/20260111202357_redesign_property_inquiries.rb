class RedesignPropertyInquiries < ActiveRecord::Migration[8.0]
  def change
    # 新しいカラムを追加
    add_reference :property_inquiries, :room, foreign_key: true
    add_reference :property_inquiries, :assigned_user, foreign_key: { to_table: :users }
    add_column :property_inquiries, :media_type, :integer, default: 0
    add_column :property_inquiries, :origin_type, :integer, default: 0

    # 既存データのroom_idを設定
    reversible do |dir|
      dir.up do
        execute <<~SQL
          UPDATE property_inquiries
          SET room_id = property_publications.room_id
          FROM property_publications
          WHERE property_inquiries.property_publication_id = property_publications.id
        SQL
      end
    end

    # room_idを必須に（既存データがある場合のみ）
    reversible do |dir|
      dir.up do
        # room_idがnullのレコードがある場合は削除（または適切なデフォルト値を設定）
        execute <<~SQL
          DELETE FROM property_inquiries WHERE room_id IS NULL
        SQL
        change_column_null :property_inquiries, :room_id, false
      end
      dir.down do
        change_column_null :property_inquiries, :room_id, true
      end
    end

    # property_publication_idを任意に変更（既に任意かもしれないが念のため）
    change_column_null :property_inquiries, :property_publication_id, true

    # statusの値を変換
    # 現在: unreplied(0), replied(1), no_reply_needed(2)
    # 新規: pending(0), in_progress(1), completed(2)
    # unreplied → pending (0→0), replied → completed (1→2), no_reply_needed → completed (2→2)
    reversible do |dir|
      dir.up do
        execute <<~SQL
          UPDATE property_inquiries
          SET status = CASE
            WHEN status = 0 THEN 0  -- unreplied → pending
            WHEN status = 1 THEN 2  -- replied → completed
            WHEN status = 2 THEN 2  -- no_reply_needed → completed
            ELSE 0
          END
        SQL
      end
    end

    # インデックス追加
    add_index :property_inquiries, [:room_id, :customer_id]
    add_index :property_inquiries, :media_type
    add_index :property_inquiries, :status, name: :index_property_inquiries_on_status_new
    add_index :property_inquiries, :origin_type
  end
end
