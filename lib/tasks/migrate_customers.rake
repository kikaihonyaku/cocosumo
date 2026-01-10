namespace :customers do
  desc "Migrate existing property inquiries to create customer records"
  task migrate_from_inquiries: :environment do
    puts "Starting customer migration..."

    migrated_count = 0
    skipped_count = 0
    error_count = 0

    PropertyInquiry.includes(:property_publication).find_each do |inquiry|
      next if inquiry.customer_id.present?

      begin
        tenant = inquiry.property_publication&.room&.building&.tenant
        next unless tenant

        customer = Customer.find_or_initialize_by_contact(
          tenant: tenant,
          email: inquiry.email,
          name: inquiry.name,
          phone: inquiry.phone
        )

        if customer.new_record?
          customer.save!
          puts "  Created customer: #{customer.name} (#{customer.email})"
        end

        inquiry.update_column(:customer_id, customer.id)
        migrated_count += 1
      rescue => e
        puts "  Error processing inquiry #{inquiry.id}: #{e.message}"
        error_count += 1
      end
    end

    puts "\nMigration complete!"
    puts "  Migrated: #{migrated_count}"
    puts "  Skipped: #{skipped_count}"
    puts "  Errors: #{error_count}"
  end

  desc "Link existing customer accesses to customers"
  task link_accesses: :environment do
    puts "Linking customer accesses..."

    linked_count = 0
    CustomerAccess.includes(:property_publication).where(customer_id: nil).find_each do |access|
      begin
        tenant = access.property_publication&.room&.building&.tenant
        next unless tenant

        customer = tenant.customers.find_by(email: access.customer_email)
        if customer
          access.update_column(:customer_id, customer.id)
          linked_count += 1
        end
      rescue => e
        puts "  Error linking access #{access.id}: #{e.message}"
      end
    end

    puts "Linked #{linked_count} accesses to customers"
  end
end
