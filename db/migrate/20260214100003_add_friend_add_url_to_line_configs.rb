class AddFriendAddUrlToLineConfigs < ActiveRecord::Migration[8.0]
  def change
    add_column :line_configs, :friend_add_url, :string
  end
end
