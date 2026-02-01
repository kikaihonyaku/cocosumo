# frozen_string_literal: true

namespace :tenant do
  desc "Set up default inquiry rooms for all active tenants"
  task setup_inquiry_rooms: :environment do
    Tenant.where(status: :active).find_each do |tenant|
      puts "Processing tenant: #{tenant.name} (#{tenant.subdomain})"

      # Skip if already configured
      if tenant.settings&.dig('default_inquiry_room_id').present?
        puts "  -> Already configured, skipping"
        next
      end

      # Find or create the general inquiry building
      building = tenant.buildings.find_or_create_by!(name: '一般問い合わせ') do |b|
        b.address = tenant.name
        b.building_type = :office
      end

      # Find or create the general inquiry room
      room = building.rooms.find_or_create_by!(room_number: 'INQUIRY') do |r|
        r.floor = 1
        r.room_type = :other
        r.status = :maintenance
        r.description = 'メール問い合わせ用（システム自動作成）'
      end

      # Update tenant settings
      settings = tenant.settings || {}
      settings['default_inquiry_room_id'] = room.id
      tenant.update!(settings: settings)

      puts "  -> Created room ##{room.id} and updated settings"
    end

    puts "Done!"
  end

  desc "Show inquiry email addresses for all active stores"
  task list_inquiry_emails: :environment do
    puts "Inquiry Email Addresses (per store):"
    puts "-" * 70

    Tenant.where(status: :active).order(:subdomain).each do |tenant|
      room_id = tenant.settings&.dig('default_inquiry_room_id')
      room_status = room_id.present? ? "configured (room ##{room_id})" : "NOT CONFIGURED"

      if tenant.stores.any?
        tenant.stores.ordered.each do |store|
          email = store.inquiry_email_address
          puts "#{email.ljust(50)} #{store.name} [#{room_status}]"
        end
      else
        puts "#{tenant.subdomain.ljust(50)} (店舗なし) [#{room_status}]"
      end
    end
  end
end
