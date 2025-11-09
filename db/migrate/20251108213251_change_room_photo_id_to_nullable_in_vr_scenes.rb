class ChangeRoomPhotoIdToNullableInVrScenes < ActiveRecord::Migration[8.0]
  def change
    change_column_null :vr_scenes, :room_photo_id, true
  end
end
