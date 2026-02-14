class CustomerMergeDismissal < ApplicationRecord
  belongs_to :tenant
  belongs_to :customer1, class_name: "Customer"
  belongs_to :customer2, class_name: "Customer"
  belongs_to :dismissed_by, class_name: "User"

  validates :customer1_id, uniqueness: { scope: [:tenant_id, :customer2_id] }
  validate :customer1_id_less_than_customer2_id

  scope :for_customer, ->(id) { where("customer1_id = ? OR customer2_id = ?", id, id) }

  def self.build_for_pair(tenant:, id_a:, id_b:, dismissed_by:, reason: nil)
    small, large = [id_a.to_i, id_b.to_i].sort
    new(
      tenant: tenant,
      customer1_id: small,
      customer2_id: large,
      dismissed_by: dismissed_by,
      reason: reason
    )
  end

  def self.dismissed?(tenant_id:, id_a:, id_b:)
    small, large = [id_a.to_i, id_b.to_i].sort
    where(tenant_id: tenant_id, customer1_id: small, customer2_id: large).exists?
  end

  private

  def customer1_id_less_than_customer2_id
    if customer1_id.present? && customer2_id.present? && customer1_id >= customer2_id
      errors.add(:base, "customer1_id must be less than customer2_id")
    end
  end
end
