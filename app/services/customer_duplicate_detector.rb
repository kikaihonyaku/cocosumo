class CustomerDuplicateDetector
  PHONE_MATCH_CONFIDENCE = 70
  PHONE_AND_NAME_MATCH_CONFIDENCE = 90
  NAME_ONLY_MATCH_CONFIDENCE = 50

  Result = Struct.new(:customer, :confidence, :signals, keyword_init: true)

  # Find duplicate candidates for a specific customer
  def self.find_for(customer)
    new(customer.tenant).find_duplicates_for(customer)
  end

  # Find all duplicate groups in a tenant
  def self.find_all(tenant)
    new(tenant).find_all_duplicates
  end

  def initialize(tenant)
    @tenant = tenant
    @dismissed_pairs = tenant.customer_merge_dismissals
                             .pluck(:customer1_id, :customer2_id)
                             .to_set
  end

  def find_duplicates_for(customer)
    candidates = []

    # Phone match
    if customer.phone.present?
      normalized = normalize_phone(customer.phone)
      phone_matches = @tenant.customers
        .where.not(id: customer.id)
        .where.not(phone: [nil, ""])
        .select { |c| normalize_phone(c.phone) == normalized }

      phone_matches.each do |match|
        if names_match?(customer.name, match.name)
          candidates << Result.new(
            customer: match,
            confidence: PHONE_AND_NAME_MATCH_CONFIDENCE,
            signals: ["電話番号一致", "名前一致"]
          )
        else
          candidates << Result.new(
            customer: match,
            confidence: PHONE_MATCH_CONFIDENCE,
            signals: ["電話番号一致"]
          )
        end
      end
    end

    # Name-only match (only if no phone matches found)
    if candidates.empty? && customer.name.present?
      name_matches = @tenant.customers
        .where.not(id: customer.id)
        .where("customers.name = ?", customer.name)

      name_matches.each do |match|
        candidates << Result.new(
          customer: match,
          confidence: NAME_ONLY_MATCH_CONFIDENCE,
          signals: ["名前一致"]
        )
      end
    end

    # Filter out dismissed pairs
    candidates.reject! { |c| pair_dismissed?(customer.id, c.customer.id) }

    candidates.sort_by { |c| -c.confidence }
  end

  def find_all_duplicates
    groups = []
    seen_ids = Set.new

    customers = @tenant.customers.where.not(phone: [nil, ""])
    phone_groups = customers.group_by { |c| normalize_phone(c.phone) }

    phone_groups.each do |_phone, members|
      next if members.size < 2

      group_ids = members.map(&:id).sort
      next if group_ids.any? { |id| seen_ids.include?(id) }

      # Filter out dismissed pairs within the group
      undismissed_members = members.select do |member|
        members.any? { |other| other.id != member.id && !pair_dismissed?(member.id, other.id) }
      end
      next if undismissed_members.size < 2

      seen_ids.merge(group_ids)

      # Check if names also match within the group
      name_match = undismissed_members.combination(2).any? { |a, b| names_match?(a.name, b.name) }

      groups << {
        customers: undismissed_members,
        confidence: name_match ? PHONE_AND_NAME_MATCH_CONFIDENCE : PHONE_MATCH_CONFIDENCE,
        signals: name_match ? ["電話番号一致", "名前一致"] : ["電話番号一致"]
      }
    end

    groups.sort_by { |g| -g[:confidence] }
  end

  private

  def pair_dismissed?(id_a, id_b)
    small, large = [id_a, id_b].sort
    @dismissed_pairs.include?([small, large])
  end

  def normalize_phone(phone)
    return nil if phone.blank?
    phone.gsub(/[\s\-\(\)（）ー]/, "")
  end

  def names_match?(name1, name2)
    return false if name1.blank? || name2.blank?
    normalize_name(name1) == normalize_name(name2)
  end

  def normalize_name(name)
    name.gsub(/[\s　]/, "")
  end
end
