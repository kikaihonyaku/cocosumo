class CustomerMergeService
  class MergeError < StandardError; end

  MERGEABLE_FIELDS = %w[name email line_user_id phone notes status expected_move_date budget_min budget_max preferred_areas requirements].freeze
  UNIQUE_FIELDS = %w[email line_user_id].freeze

  def initialize(primary:, secondary:, field_resolutions: {}, performed_by:, merge_reason: nil)
    @primary = primary
    @secondary = secondary
    @field_resolutions = field_resolutions.stringify_keys
    @performed_by = performed_by
    @merge_reason = merge_reason
  end

  def execute!
    validate_merge!

    ActiveRecord::Base.transaction do
      lock_customers!

      primary_snapshot = snapshot_customer(@primary)
      secondary_snapshot = build_secondary_snapshot

      clear_secondary_unique_fields!
      apply_field_resolutions!
      move_related_records!

      merge_record = CustomerMerge.create!(
        tenant: @primary.tenant,
        primary_customer: @primary,
        performed_by: @performed_by,
        secondary_snapshot: secondary_snapshot,
        primary_snapshot: primary_snapshot,
        merge_reason: @merge_reason,
        status: :completed
      )

      record_merge_activity!(merge_record)

      @secondary.destroy!

      merge_record
    end
  end

  def self.undo!(merge_record, undone_by:)
    raise MergeError, "この統合は既に取り消されています" if merge_record.status_undone?

    ActiveRecord::Base.transaction do
      merge_record.primary_customer.lock!

      # Restore secondary customer
      secondary_attrs = merge_record.secondary_snapshot["customer_attributes"]
      secondary = Customer.new(secondary_attrs.except("id"))
      secondary.id = secondary_attrs["id"]
      secondary.save!(validate: false)

      # Restore primary to pre-merge state
      primary_attrs = merge_record.primary_snapshot
      merge_record.primary_customer.update_columns(
        primary_attrs.slice(*MERGEABLE_FIELDS).transform_keys(&:to_sym)
      )

      # Move back related records
      move_back_records!(merge_record, secondary)

      merge_record.update!(
        status: :undone,
        undone_by: undone_by,
        undone_at: Time.current
      )

      # Record undo activity
      inquiry = merge_record.primary_customer.inquiries.order(created_at: :desc).first
      if inquiry
        merge_record.primary_customer.add_activity!(
          activity_type: :customer_merged,
          direction: :internal,
          inquiry: inquiry,
          user: undone_by,
          subject: "顧客統合を取り消し",
          content: "#{secondary.name} との統合を取り消しました"
        )
      end
    end
  end

  private

  def validate_merge!
    raise MergeError, "同じ顧客を統合することはできません" if @primary.id == @secondary.id
    raise MergeError, "異なるテナントの顧客は統合できません" if @primary.tenant_id != @secondary.tenant_id

    # Validate that resolved values won't leave customer without contact info
    resolved_email = resolve_field_value("email")
    resolved_line = resolve_field_value("line_user_id")
    if resolved_email.blank? && resolved_line.blank?
      raise MergeError, "統合後にメールアドレスもLINE IDも無い状態にはできません"
    end

    # Check unique constraint conflicts
    UNIQUE_FIELDS.each do |field|
      chosen = resolve_field_value(field)
      next if chosen.blank?

      existing = Customer.where(tenant_id: @primary.tenant_id)
                         .where.not(id: [@primary.id, @secondary.id])
                         .where(field => chosen)
                         .exists?
      raise MergeError, "#{field_label(field)}「#{chosen}」は既に別の顧客で使用されています" if existing
    end
  end

  def lock_customers!
    # Lock in ID order to prevent deadlocks
    ids = [@primary.id, @secondary.id].sort
    Customer.where(id: ids).order(:id).lock("FOR UPDATE").to_a
    @primary.reload
    @secondary.reload
  end

  def snapshot_customer(customer)
    customer.attributes.except("created_at", "updated_at")
  end

  def build_secondary_snapshot
    {
      customer_attributes: @secondary.attributes,
      inquiry_ids: @secondary.inquiries.pluck(:id),
      property_inquiry_ids: @secondary.property_inquiries.pluck(:id),
      customer_activity_ids: @secondary.customer_activities.pluck(:id),
      customer_access_ids: @secondary.customer_accesses.pluck(:id),
      email_draft_ids: @secondary.email_drafts.pluck(:id),
      field_resolutions: @field_resolutions
    }
  end

  # secondary のユニークフィールドをクリアして、primary への更新時に
  # uniqueness バリデーション違反を防ぐ
  def clear_secondary_unique_fields!
    clear_attrs = {}
    UNIQUE_FIELDS.each do |field|
      clear_attrs[field] = nil if @secondary.send(field).present?
    end
    @secondary.update_columns(clear_attrs) if clear_attrs.present?
  end

  def apply_field_resolutions!
    updates = {}

    MERGEABLE_FIELDS.each do |field|
      case field
      when "notes"
        updates[:notes] = merge_notes
      when "status"
        # If either is active, keep active
        updates[:status] = (@primary.active? || @secondary.active?) ? :active : @primary.status
      when "last_contacted_at"
        updates[:last_contacted_at] = [@primary.last_contacted_at, @secondary.last_contacted_at].compact.max
      when "preferred_areas"
        primary_areas = Array(@primary.preferred_areas)
        secondary_areas = Array(@secondary.preferred_areas)
        updates[:preferred_areas] = (primary_areas | secondary_areas)
      when "requirements"
        updates[:requirements] = merge_text_field("requirements")
      else
        resolved = resolve_field_value(field)
        updates[field.to_sym] = resolved

        # Record discarded unique field values in notes
        if UNIQUE_FIELDS.include?(field)
          discarded = discarded_value(field)
          if discarded.present? && discarded != resolved
            updates[:notes] = [updates[:notes] || @primary.notes, "旧#{field_label(field)}: #{discarded}"].compact.join("\n")
          end
        end
      end
    end

    @primary.update!(updates)
  end

  def resolve_field_value(field)
    choice = @field_resolutions[field]
    primary_val = @primary.send(field)
    secondary_val = @secondary.send(field)

    case choice
    when "primary"
      primary_val
    when "secondary"
      secondary_val
    else
      # Default: prefer non-blank, primary wins ties
      primary_val.present? ? primary_val : secondary_val
    end
  end

  def discarded_value(field)
    choice = @field_resolutions[field]
    primary_val = @primary.send(field)
    secondary_val = @secondary.send(field)

    case choice
    when "primary"
      secondary_val
    when "secondary"
      primary_val
    else
      primary_val.present? ? secondary_val : primary_val
    end
  end

  def merge_notes
    parts = [@primary.notes, @secondary.notes].compact.reject(&:blank?)
    parts.join("\n---\n")
  end

  def merge_text_field(field)
    primary_val = @primary.send(field)
    secondary_val = @secondary.send(field)
    parts = [primary_val, secondary_val].compact.reject(&:blank?)
    parts.uniq.join("\n")
  end

  def move_related_records!
    Inquiry.where(customer_id: @secondary.id).update_all(customer_id: @primary.id)
    PropertyInquiry.where(customer_id: @secondary.id).update_all(customer_id: @primary.id)
    CustomerActivity.where(customer_id: @secondary.id).update_all(customer_id: @primary.id)
    CustomerAccess.where(customer_id: @secondary.id).update_all(customer_id: @primary.id)
    EmailDraft.where(customer_id: @secondary.id).update_all(customer_id: @primary.id)
  end

  def record_merge_activity!(merge_record)
    inquiry = @primary.inquiries.order(created_at: :desc).first
    return unless inquiry

    @primary.add_activity!(
      activity_type: :customer_merged,
      direction: :internal,
      inquiry: inquiry,
      user: @performed_by,
      subject: "顧客統合",
      content: "#{@secondary.name} を統合しました" + (@merge_reason.present? ? "\n理由: #{@merge_reason}" : "")
    )
  end

  def self.move_back_records!(merge_record, secondary)
    snapshot = merge_record.secondary_snapshot

    if snapshot["inquiry_ids"].present?
      Inquiry.where(id: snapshot["inquiry_ids"]).update_all(customer_id: secondary.id)
    end
    if snapshot["property_inquiry_ids"].present?
      PropertyInquiry.where(id: snapshot["property_inquiry_ids"]).update_all(customer_id: secondary.id)
    end
    if snapshot["customer_activity_ids"].present?
      CustomerActivity.where(id: snapshot["customer_activity_ids"]).update_all(customer_id: secondary.id)
    end
    if snapshot["customer_access_ids"].present?
      CustomerAccess.where(id: snapshot["customer_access_ids"]).update_all(customer_id: secondary.id)
    end
    if snapshot["email_draft_ids"].present?
      EmailDraft.where(id: snapshot["email_draft_ids"]).update_all(customer_id: secondary.id)
    end
  end

  def field_label(field)
    {
      "name" => "顧客名",
      "email" => "メールアドレス",
      "line_user_id" => "LINE ID",
      "phone" => "電話番号"
    }[field] || field
  end
end
