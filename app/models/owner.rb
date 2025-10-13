class Owner < ApplicationRecord
  # Associations
  belongs_to :tenant
  belongs_to :building

  # Validations
  validates :name, presence: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP, allow_blank: true }

  # Scopes
  scope :primary, -> { where(is_primary: true) }

  # Callbacks
  before_save :ensure_single_primary_owner

  private

  def ensure_single_primary_owner
    if is_primary && is_primary_changed?
      # 同じ物件の他の家主のis_primaryをfalseにする
      Owner.where(building_id: building_id).where.not(id: id).update_all(is_primary: false)
    end
  end
end
