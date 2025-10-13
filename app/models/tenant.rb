class Tenant < ApplicationRecord
  # Associations
  has_many :users, dependent: :destroy
  has_many :buildings, dependent: :destroy

  # Validations
  validates :name, presence: true
  validates :subdomain, presence: true, uniqueness: true, format: { with: /\A[a-z0-9-]+\z/ }

  # Serialize settings as JSON
  serialize :settings, coder: JSON
end
