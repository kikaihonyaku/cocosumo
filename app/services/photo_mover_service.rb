# frozen_string_literal: true

class PhotoMoverService
  class MoveError < StandardError; end
  class HasDependenciesError < MoveError; end

  def initialize(source_photo)
    @source_photo = source_photo
  end

  # RoomPhoto -> BuildingPhoto
  def move_to_building(building, target_photo_type: nil)
    validate_room_photo_movable!
    target_type = target_photo_type || map_to_building_type(@source_photo.photo_type)

    ActiveRecord::Base.transaction do
      new_photo = BuildingPhoto.create!(
        building: building,
        photo_type: target_type,
        caption: @source_photo.caption,
        display_order: @source_photo.display_order,
        source_url: @source_photo.source_url
      )
      transfer_attachment(new_photo)
      @source_photo.destroy!
      new_photo
    end
  end

  # BuildingPhoto -> RoomPhoto
  def move_to_room(room, target_photo_type: nil)
    target_type = target_photo_type || map_to_room_type(@source_photo.photo_type)

    ActiveRecord::Base.transaction do
      new_photo = RoomPhoto.create!(
        room: room,
        photo_type: target_type,
        caption: @source_photo.caption,
        display_order: @source_photo.display_order,
        source_url: @source_photo.source_url
      )
      transfer_attachment(new_photo)
      @source_photo.destroy!
      new_photo
    end
  end

  private

  def validate_room_photo_movable!
    return unless @source_photo.is_a?(RoomPhoto)

    if @source_photo.has_dependencies?
      raise HasDependenciesError,
        "この写真には関連データがあるため移動できません: #{@source_photo.dependency_names.join(', ')}"
    end
  end

  def transfer_attachment(new_photo)
    return unless @source_photo.photo.attached?

    blob = @source_photo.photo.blob
    new_photo.photo.attach(blob)
  end

  def map_to_building_type(room_type)
    case room_type
    when 'exterior' then 'exterior'
    else 'other'
    end
  end

  def map_to_room_type(building_type)
    case building_type
    when 'exterior' then 'exterior'
    else 'other'
    end
  end
end
