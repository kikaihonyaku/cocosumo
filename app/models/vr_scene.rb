class VrScene < ApplicationRecord
  # Associations
  belongs_to :vr_tour
  belongs_to :room_photo, optional: true
  belongs_to :virtual_staging, optional: true

  # Validations
  validates :title, presence: true
  validates :display_order, numericality: { only_integer: true }, allow_nil: true
  validate :must_have_photo_or_virtual_staging

  # Serialize JSON fields
  serialize :initial_view, coder: JSON
  serialize :hotspots, coder: JSON
  serialize :minimap_position, coder: JSON

  # Default scope - order by display_order
  default_scope -> { order(display_order: :asc) }

  # Get photo URL
  def photo_url
    return nil unless room_photo&.photo&.attached?

    if Rails.env.production?
      room_photo.photo.url
    else
      Rails.application.routes.url_helpers.rails_blob_path(room_photo.photo, only_path: true)
    end
  end

  # Get before photo URL (for virtual staging)
  def before_photo_url
    return nil unless virtual_staging&.before_photo

    virtual_staging.before_photo_url
  end

  # Get after photo URL (for virtual staging)
  def after_photo_url
    return nil unless virtual_staging&.after_photo

    virtual_staging.after_photo_url
  end

  # Check if this is a virtual staging scene
  def virtual_staging_scene?
    virtual_staging_id.present?
  end

  private

  def must_have_photo_or_virtual_staging
    if room_photo_id.blank? && virtual_staging_id.blank?
      errors.add(:base, 'Must have either a room photo or virtual staging')
    end
  end
end
