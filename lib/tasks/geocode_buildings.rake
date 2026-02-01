namespace :geocode do
  desc "Geocode buildings that have no location data"
  task buildings: :environment do
    buildings = Building.kept.where(location: nil).where.not(address: [nil, ""])
    total = buildings.count

    if total.zero?
      puts "No buildings need geocoding."
      next
    end

    puts "Geocoding #{total} buildings..."

    success = 0
    failed = 0

    buildings.find_each.with_index(1) do |building, index|
      results = Geocoder.search(building.address)
      if (result = results.first)
        building.update_columns(
          location: "POINT(#{result.longitude} #{result.latitude})"
        )
        success += 1
        puts "[#{index}/#{total}] OK: #{building.name} - #{building.address}"
      else
        failed += 1
        puts "[#{index}/#{total}] FAIL: #{building.name} - #{building.address}"
      end

      sleep 0.1
    rescue => e
      failed += 1
      puts "[#{index}/#{total}] ERROR: #{building.name} - #{e.message}"
      sleep 0.1
    end

    puts
    puts "Done. Success: #{success}, Failed: #{failed}, Total: #{total}"
  end
end
