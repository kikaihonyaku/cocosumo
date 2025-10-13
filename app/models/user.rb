class User < ApplicationRecord
  # Associations
  belongs_to :tenant

  # Secure password
  has_secure_password validations: false

  # Enums
  enum :role, { member: 0, admin: 1, super_admin: 2 }, default: :member

  # Validations
  validates :email, presence: true, uniqueness: { scope: :tenant_id }
  validates :name, presence: true
  validates :password, length: { minimum: 6 }, allow_nil: true, if: -> { auth_provider.nil? }

  # Scopes
  scope :admins, -> { where(role: [:admin, :super_admin]) }
end
