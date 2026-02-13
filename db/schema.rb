# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2026_02_14_100002) do
  create_schema "topology"

  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "postgis"
  enable_extension "topology.postgis_topology"

  create_table "action_mailbox_inbound_emails", force: :cascade do |t|
    t.integer "status", default: 0, null: false
    t.string "message_id", null: false
    t.string "message_checksum", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["message_id", "message_checksum"], name: "index_action_mailbox_inbound_emails_uniqueness", unique: true
  end

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "address_points", force: :cascade do |t|
    t.bigint "map_layer_id", null: false
    t.string "prefecture"
    t.string "city"
    t.string "district"
    t.string "block_number"
    t.decimal "latitude", precision: 10, scale: 6
    t.decimal "longitude", precision: 10, scale: 6
    t.st_point "location", geographic: true
    t.boolean "representative", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["location"], name: "index_address_points_on_location", using: :gist
    t.index ["map_layer_id", "prefecture", "city"], name: "index_address_points_on_map_layer_id_and_prefecture_and_city"
    t.index ["map_layer_id"], name: "index_address_points_on_map_layer_id"
  end

  create_table "admin_audit_logs", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "tenant_id"
    t.string "action", null: false
    t.string "resource_type"
    t.bigint "resource_id"
    t.jsonb "changes_data", default: {}
    t.jsonb "metadata", default: {}
    t.string "ip_address"
    t.string "user_agent"
    t.datetime "created_at", null: false
    t.index ["action"], name: "index_admin_audit_logs_on_action"
    t.index ["resource_type", "resource_id"], name: "index_admin_audit_logs_on_resource_type_and_resource_id"
    t.index ["tenant_id", "created_at"], name: "index_admin_audit_logs_on_tenant_id_and_created_at"
    t.index ["tenant_id"], name: "index_admin_audit_logs_on_tenant_id"
    t.index ["user_id", "created_at"], name: "index_admin_audit_logs_on_user_id_and_created_at"
    t.index ["user_id"], name: "index_admin_audit_logs_on_user_id"
  end

  create_table "ai_generated_images", force: :cascade do |t|
    t.integer "room_id", null: false
    t.integer "room_photo_id", null: false
    t.string "source_image_path"
    t.string "generated_image_path"
    t.string "generation_type"
    t.text "prompt"
    t.integer "status"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["room_id"], name: "index_ai_generated_images_on_room_id"
    t.index ["room_photo_id"], name: "index_ai_generated_images_on_room_photo_id"
  end

  create_table "blog_posts", force: :cascade do |t|
    t.string "public_id", null: false
    t.string "title", null: false
    t.text "summary"
    t.text "content", null: false
    t.string "thumbnail_url"
    t.string "commit_hash"
    t.integer "status", default: 0, null: false
    t.datetime "published_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["public_id"], name: "index_blog_posts_on_public_id", unique: true
    t.index ["status", "published_at"], name: "index_blog_posts_on_status_and_published_at"
  end

  create_table "building_photos", force: :cascade do |t|
    t.integer "building_id", null: false
    t.string "photo_type"
    t.text "caption"
    t.integer "display_order"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "source_url"
    t.index ["building_id", "source_url"], name: "index_building_photos_on_building_id_and_source_url", unique: true, where: "(source_url IS NOT NULL)"
    t.index ["building_id"], name: "index_building_photos_on_building_id"
  end

  create_table "building_routes", force: :cascade do |t|
    t.bigint "building_id", null: false
    t.bigint "tenant_id", null: false
    t.string "route_type", default: "custom", null: false
    t.string "name", null: false
    t.text "description"
    t.st_point "origin", geographic: true
    t.st_point "destination", geographic: true
    t.string "destination_name"
    t.string "destination_place_id"
    t.st_line_string "route_geometry", geographic: true
    t.jsonb "waypoints", default: []
    t.text "encoded_polyline"
    t.jsonb "directions_response"
    t.jsonb "streetview_points", default: []
    t.integer "distance_meters"
    t.integer "duration_seconds"
    t.string "travel_mode", default: "walking"
    t.integer "display_order", default: 0
    t.boolean "is_default", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["building_id", "route_type"], name: "index_building_routes_on_building_id_and_route_type"
    t.index ["building_id"], name: "index_building_routes_on_building_id"
    t.index ["route_geometry"], name: "index_building_routes_on_route_geometry", using: :gist
    t.index ["tenant_id"], name: "index_building_routes_on_tenant_id"
  end

  create_table "building_stations", force: :cascade do |t|
    t.bigint "building_id", null: false
    t.bigint "station_id", null: false
    t.integer "walking_minutes"
    t.integer "display_order", default: 0
    t.string "raw_text"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["building_id", "station_id"], name: "index_building_stations_on_building_id_and_station_id", unique: true
    t.index ["building_id"], name: "index_building_stations_on_building_id"
    t.index ["station_id"], name: "index_building_stations_on_station_id"
  end

  create_table "buildings", force: :cascade do |t|
    t.integer "tenant_id", null: false
    t.string "name"
    t.string "address"
    t.decimal "latitude"
    t.decimal "longitude"
    t.string "building_type"
    t.integer "total_units"
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "postcode"
    t.string "structure"
    t.integer "floors"
    t.datetime "discarded_at"
    t.boolean "has_elevator"
    t.boolean "has_bicycle_parking"
    t.boolean "has_parking"
    t.integer "parking_spaces"
    t.date "built_date"
    t.string "external_key"
    t.datetime "suumo_imported_at"
    t.st_point "location", geographic: true
    t.bigint "store_id"
    t.index ["discarded_at"], name: "index_buildings_on_discarded_at"
    t.index ["location"], name: "index_buildings_on_location", using: :gist
    t.index ["store_id"], name: "index_buildings_on_store_id"
    t.index ["tenant_id", "external_key"], name: "index_buildings_on_tenant_id_and_external_key", unique: true, where: "(external_key IS NOT NULL)"
    t.index ["tenant_id"], name: "index_buildings_on_tenant_id"
  end

  create_table "bulk_import_histories", force: :cascade do |t|
    t.bigint "tenant_id", null: false
    t.bigint "user_id", null: false
    t.string "status", default: "pending", null: false
    t.datetime "started_at"
    t.datetime "completed_at"
    t.integer "total_files", default: 0
    t.integer "analyzed_count", default: 0
    t.integer "buildings_created", default: 0
    t.integer "buildings_matched", default: 0
    t.integer "rooms_created", default: 0
    t.integer "error_count", default: 0
    t.text "log_data"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_bulk_import_histories_on_created_at"
    t.index ["status"], name: "index_bulk_import_histories_on_status"
    t.index ["tenant_id"], name: "index_bulk_import_histories_on_tenant_id"
    t.index ["user_id"], name: "index_bulk_import_histories_on_user_id"
  end

  create_table "bulk_import_items", force: :cascade do |t|
    t.bigint "bulk_import_history_id", null: false
    t.string "status", default: "pending", null: false
    t.string "original_filename", null: false
    t.jsonb "extracted_data", default: {}
    t.jsonb "edited_data", default: {}
    t.jsonb "similar_buildings", default: []
    t.bigint "selected_building_id"
    t.bigint "created_building_id"
    t.bigint "created_room_id"
    t.text "error_message"
    t.integer "display_order", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["bulk_import_history_id"], name: "index_bulk_import_items_on_bulk_import_history_id"
    t.index ["status"], name: "index_bulk_import_items_on_status"
  end

  create_table "customer_accesses", force: :cascade do |t|
    t.bigint "property_publication_id", null: false
    t.string "access_token", null: false
    t.string "customer_name", null: false
    t.string "customer_email", null: false
    t.string "customer_phone"
    t.string "password_digest"
    t.datetime "expires_at"
    t.integer "status", default: 0, null: false
    t.text "notes"
    t.integer "view_count", default: 0, null: false
    t.datetime "last_accessed_at"
    t.datetime "first_accessed_at"
    t.jsonb "access_history", default: []
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "customer_message"
    t.bigint "customer_id"
    t.bigint "property_inquiry_id"
    t.bigint "inquiry_id"
    t.index ["access_token"], name: "index_customer_accesses_on_access_token", unique: true
    t.index ["customer_email"], name: "index_customer_accesses_on_customer_email"
    t.index ["customer_id"], name: "index_customer_accesses_on_customer_id"
    t.index ["inquiry_id"], name: "index_customer_accesses_on_inquiry_id"
    t.index ["property_inquiry_id"], name: "index_customer_accesses_on_property_inquiry_id"
    t.index ["property_publication_id", "status"], name: "index_customer_accesses_on_property_publication_id_and_status"
    t.index ["property_publication_id"], name: "index_customer_accesses_on_property_publication_id"
  end

  create_table "customer_activities", force: :cascade do |t|
    t.bigint "customer_id", null: false
    t.bigint "user_id"
    t.integer "activity_type", default: 0, null: false
    t.integer "direction", default: 0, null: false
    t.string "subject"
    t.text "content"
    t.bigint "property_inquiry_id"
    t.bigint "customer_access_id"
    t.bigint "property_publication_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "inquiry_id", null: false
    t.string "content_format", default: "text", null: false
    t.jsonb "metadata", default: {}
    t.index ["activity_type"], name: "index_customer_activities_on_activity_type"
    t.index ["customer_access_id"], name: "index_customer_activities_on_customer_access_id"
    t.index ["customer_id", "created_at"], name: "index_customer_activities_on_customer_id_and_created_at"
    t.index ["customer_id"], name: "index_customer_activities_on_customer_id"
    t.index ["inquiry_id"], name: "index_customer_activities_on_inquiry_id"
    t.index ["property_inquiry_id"], name: "index_customer_activities_on_property_inquiry_id"
    t.index ["property_publication_id"], name: "index_customer_activities_on_property_publication_id"
    t.index ["user_id"], name: "index_customer_activities_on_user_id"
  end

  create_table "customer_image_simulations", force: :cascade do |t|
    t.bigint "property_publication_id", null: false
    t.string "session_id", null: false
    t.string "source_photo_type", null: false
    t.bigint "source_photo_id", null: false
    t.text "prompt", null: false
    t.text "result_image_base64"
    t.integer "status", default: 0, null: false
    t.string "error_message"
    t.date "simulation_date", null: false
    t.string "ip_address"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "customer_access_id"
    t.boolean "saved", default: false, null: false
    t.string "title"
    t.text "source_photo_url"
    t.index ["customer_access_id", "saved"], name: "idx_cis_customer_access_saved", where: "(saved = true)"
    t.index ["customer_access_id"], name: "index_customer_image_simulations_on_customer_access_id"
    t.index ["property_publication_id", "simulation_date"], name: "idx_cis_publication_date"
    t.index ["property_publication_id"], name: "index_customer_image_simulations_on_property_publication_id"
    t.index ["session_id"], name: "index_customer_image_simulations_on_session_id"
  end

  create_table "customer_merges", force: :cascade do |t|
    t.bigint "tenant_id", null: false
    t.bigint "primary_customer_id", null: false
    t.bigint "performed_by_id", null: false
    t.bigint "undone_by_id"
    t.jsonb "secondary_snapshot", default: {}, null: false
    t.jsonb "primary_snapshot", default: {}, null: false
    t.string "merge_reason"
    t.integer "status", default: 0, null: false
    t.datetime "undone_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["performed_by_id"], name: "index_customer_merges_on_performed_by_id"
    t.index ["primary_customer_id"], name: "index_customer_merges_on_primary_customer_id"
    t.index ["tenant_id", "created_at"], name: "index_customer_merges_on_tenant_id_and_created_at"
    t.index ["tenant_id"], name: "index_customer_merges_on_tenant_id"
    t.index ["undone_by_id"], name: "index_customer_merges_on_undone_by_id"
  end

  create_table "customer_routes", force: :cascade do |t|
    t.bigint "customer_access_id", null: false
    t.string "name", null: false
    t.string "destination_name"
    t.string "destination_address"
    t.decimal "destination_lat", precision: 10, scale: 7
    t.decimal "destination_lng", precision: 10, scale: 7
    t.decimal "origin_lat", precision: 10, scale: 7
    t.decimal "origin_lng", precision: 10, scale: 7
    t.string "travel_mode", default: "walking"
    t.integer "distance_meters"
    t.integer "duration_seconds"
    t.text "encoded_polyline"
    t.boolean "calculated", default: false
    t.integer "display_order", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["customer_access_id", "display_order"], name: "index_customer_routes_on_customer_access_id_and_display_order"
    t.index ["customer_access_id"], name: "index_customer_routes_on_customer_access_id"
  end

  create_table "customers", force: :cascade do |t|
    t.bigint "tenant_id", null: false
    t.string "email"
    t.string "line_user_id"
    t.string "name", null: false
    t.string "phone"
    t.text "notes"
    t.integer "status", default: 0, null: false
    t.datetime "last_contacted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.date "expected_move_date"
    t.integer "budget_min"
    t.integer "budget_max"
    t.jsonb "preferred_areas", default: []
    t.text "requirements"
    t.index ["tenant_id", "email"], name: "index_customers_on_tenant_id_and_email", unique: true, where: "((email IS NOT NULL) AND ((email)::text <> ''::text))"
    t.index ["tenant_id", "line_user_id"], name: "index_customers_on_tenant_id_and_line_user_id", unique: true, where: "(line_user_id IS NOT NULL)"
    t.index ["tenant_id"], name: "index_customers_on_tenant_id"
  end

  create_table "email_attachments", force: :cascade do |t|
    t.bigint "customer_activity_id", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.integer "byte_size"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["customer_activity_id"], name: "index_email_attachments_on_customer_activity_id"
  end

  create_table "email_drafts", force: :cascade do |t|
    t.bigint "tenant_id", null: false
    t.bigint "user_id", null: false
    t.bigint "customer_id", null: false
    t.bigint "inquiry_id"
    t.string "subject"
    t.text "body"
    t.string "body_format", default: "html", null: false
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["customer_id"], name: "index_email_drafts_on_customer_id"
    t.index ["inquiry_id"], name: "index_email_drafts_on_inquiry_id"
    t.index ["tenant_id"], name: "index_email_drafts_on_tenant_id"
    t.index ["user_id", "customer_id"], name: "index_email_drafts_on_user_customer"
    t.index ["user_id"], name: "index_email_drafts_on_user_id"
  end

  create_table "email_templates", force: :cascade do |t|
    t.bigint "tenant_id", null: false
    t.string "name", null: false
    t.string "subject", null: false
    t.text "body", null: false
    t.integer "position", default: 0
    t.datetime "discarded_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "body_format", default: "text", null: false
    t.index ["tenant_id"], name: "index_email_templates_on_tenant_id"
  end

  create_table "facilities", force: :cascade do |t|
    t.string "code", null: false
    t.string "name", null: false
    t.string "category", null: false
    t.integer "display_order", default: 0
    t.boolean "is_popular", default: false
    t.boolean "is_active", default: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category"], name: "index_facilities_on_category"
    t.index ["code"], name: "index_facilities_on_code", unique: true
    t.index ["is_popular", "display_order"], name: "index_facilities_on_is_popular_and_display_order"
  end

  create_table "facility_synonyms", force: :cascade do |t|
    t.bigint "facility_id", null: false
    t.string "synonym", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["facility_id"], name: "index_facility_synonyms_on_facility_id"
    t.index ["synonym"], name: "index_facility_synonyms_on_synonym", unique: true
  end

  create_table "inquiries", force: :cascade do |t|
    t.bigint "tenant_id", null: false
    t.bigint "customer_id", null: false
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "status", default: 0, null: false
    t.bigint "assigned_user_id"
    t.index ["assigned_user_id"], name: "index_inquiries_on_assigned_user_id"
    t.index ["customer_id"], name: "index_inquiries_on_customer_id"
    t.index ["status"], name: "index_inquiries_on_status"
    t.index ["tenant_id"], name: "index_inquiries_on_tenant_id"
  end

  create_table "inquiry_read_statuses", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "inquiry_id", null: false
    t.datetime "last_read_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["inquiry_id"], name: "index_inquiry_read_statuses_on_inquiry_id"
    t.index ["user_id", "inquiry_id"], name: "index_inquiry_read_statuses_on_user_id_and_inquiry_id", unique: true
    t.index ["user_id"], name: "index_inquiry_read_statuses_on_user_id"
  end

  create_table "line_configs", force: :cascade do |t|
    t.bigint "tenant_id", null: false
    t.string "channel_id"
    t.string "channel_secret"
    t.string "channel_token"
    t.boolean "webhook_verified", default: false, null: false
    t.text "greeting_message"
    t.string "rich_menu_id"
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["tenant_id"], name: "index_line_configs_on_tenant_id", unique: true
  end

  create_table "line_templates", force: :cascade do |t|
    t.bigint "tenant_id", null: false
    t.string "name", null: false
    t.integer "message_type", default: 0, null: false
    t.text "content", null: false
    t.string "image_url"
    t.string "flex_alt_text"
    t.integer "position"
    t.datetime "discarded_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["discarded_at"], name: "index_line_templates_on_discarded_at"
    t.index ["tenant_id", "discarded_at"], name: "index_line_templates_on_tenant_id_and_discarded_at"
    t.index ["tenant_id"], name: "index_line_templates_on_tenant_id"
  end

  create_table "map_layers", force: :cascade do |t|
    t.integer "tenant_id"
    t.string "name", null: false
    t.string "layer_key", null: false
    t.text "description"
    t.string "layer_type", null: false
    t.string "color", default: "#FF6B00"
    t.float "opacity", default: 0.15
    t.integer "display_order", default: 0
    t.boolean "is_active", default: true
    t.string "icon"
    t.integer "feature_count", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "attribution"
    t.boolean "is_global", default: false, null: false
    t.index ["is_active"], name: "index_map_layers_on_is_active"
    t.index ["layer_key"], name: "index_map_layers_on_global_key", unique: true, where: "(is_global = true)"
    t.index ["layer_type"], name: "index_map_layers_on_layer_type"
    t.index ["tenant_id", "layer_key"], name: "index_map_layers_on_tenant_and_key", unique: true, where: "(tenant_id IS NOT NULL)"
    t.index ["tenant_id"], name: "index_map_layers_on_tenant_id"
  end

  create_table "message_trackings", force: :cascade do |t|
    t.bigint "customer_activity_id", null: false
    t.string "token", null: false
    t.string "destination_url", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["customer_activity_id"], name: "index_message_trackings_on_customer_activity_id"
    t.index ["token"], name: "index_message_trackings_on_token", unique: true
  end

  create_table "owners", force: :cascade do |t|
    t.integer "tenant_id", null: false
    t.integer "building_id", null: false
    t.string "name"
    t.string "phone"
    t.string "email"
    t.string "address"
    t.text "notes"
    t.boolean "is_primary", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["building_id"], name: "index_owners_on_building_id"
    t.index ["tenant_id"], name: "index_owners_on_tenant_id"
  end

  create_table "presentation_accesses", force: :cascade do |t|
    t.bigint "property_publication_id", null: false
    t.string "access_token", null: false
    t.string "title"
    t.string "password_digest"
    t.datetime "expires_at"
    t.integer "status", default: 0, null: false
    t.text "notes"
    t.jsonb "step_config", default: {}
    t.integer "view_count", default: 0, null: false
    t.datetime "last_accessed_at"
    t.datetime "first_accessed_at"
    t.jsonb "access_history", default: []
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["access_token"], name: "index_presentation_accesses_on_access_token", unique: true
    t.index ["property_publication_id", "status"], name: "idx_on_property_publication_id_status_d30092d266"
    t.index ["property_publication_id"], name: "index_presentation_accesses_on_property_publication_id"
  end

  create_table "property_inquiries", force: :cascade do |t|
    t.integer "property_publication_id"
    t.string "name", null: false
    t.string "email", null: false
    t.string "phone"
    t.text "message", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "source"
    t.string "utm_source"
    t.string "utm_medium"
    t.string "utm_campaign"
    t.string "referrer"
    t.integer "source_type", default: 0
    t.string "source_url", limit: 500
    t.integer "status", default: 0
    t.datetime "replied_at"
    t.text "reply_message"
    t.bigint "customer_id"
    t.integer "channel", default: 0, null: false
    t.bigint "room_id", null: false
    t.integer "media_type", default: 0
    t.integer "origin_type", default: 0
    t.bigint "inquiry_id", null: false
    t.integer "deal_status", default: 0, null: false
    t.datetime "deal_status_changed_at"
    t.integer "priority", default: 1, null: false
    t.bigint "assigned_user_id"
    t.string "lost_reason"
    t.index ["assigned_user_id"], name: "index_property_inquiries_on_assigned_user_id"
    t.index ["channel"], name: "index_property_inquiries_on_channel"
    t.index ["created_at"], name: "index_property_inquiries_on_created_at"
    t.index ["customer_id", "deal_status"], name: "index_property_inquiries_on_customer_deal_status"
    t.index ["customer_id"], name: "index_property_inquiries_on_customer_id"
    t.index ["deal_status"], name: "index_property_inquiries_on_deal_status"
    t.index ["inquiry_id"], name: "index_property_inquiries_on_inquiry_id"
    t.index ["media_type"], name: "index_property_inquiries_on_media_type"
    t.index ["origin_type"], name: "index_property_inquiries_on_origin_type"
    t.index ["priority"], name: "index_property_inquiries_on_priority"
    t.index ["property_publication_id"], name: "index_property_inquiries_on_property_publication_id"
    t.index ["room_id", "customer_id"], name: "index_property_inquiries_on_room_id_and_customer_id"
    t.index ["room_id"], name: "index_property_inquiries_on_room_id"
    t.index ["source_type"], name: "index_property_inquiries_on_source_type"
    t.index ["status"], name: "index_property_inquiries_on_status"
    t.index ["status"], name: "index_property_inquiries_on_status_new"
  end

  create_table "property_publication_photos", force: :cascade do |t|
    t.integer "property_publication_id", null: false
    t.integer "room_photo_id", null: false
    t.integer "display_order", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "comment"
    t.index ["display_order"], name: "index_property_publication_photos_on_display_order"
    t.index ["property_publication_id", "room_photo_id"], name: "index_pub_photos_on_pub_and_photo", unique: true
    t.index ["property_publication_id"], name: "index_property_publication_photos_on_property_publication_id"
    t.index ["room_photo_id"], name: "index_property_publication_photos_on_room_photo_id"
  end

  create_table "property_publication_virtual_stagings", force: :cascade do |t|
    t.integer "property_publication_id", null: false
    t.integer "virtual_staging_id", null: false
    t.integer "display_order", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["display_order"], name: "index_property_publication_virtual_stagings_on_display_order"
    t.index ["property_publication_id", "virtual_staging_id"], name: "index_pub_virtual_stagings_on_pub_and_vs", unique: true
    t.index ["property_publication_id"], name: "idx_on_property_publication_id_b3b5dbf46f"
    t.index ["virtual_staging_id"], name: "idx_on_virtual_staging_id_caed2d8ed5"
  end

  create_table "property_publication_vr_tours", force: :cascade do |t|
    t.integer "property_publication_id", null: false
    t.integer "vr_tour_id", null: false
    t.integer "display_order", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["display_order"], name: "index_property_publication_vr_tours_on_display_order"
    t.index ["property_publication_id", "vr_tour_id"], name: "index_pub_vr_tours_on_pub_and_vr_tour", unique: true
    t.index ["property_publication_id"], name: "index_property_publication_vr_tours_on_property_publication_id"
    t.index ["vr_tour_id"], name: "index_property_publication_vr_tours_on_vr_tour_id"
  end

  create_table "property_publications", force: :cascade do |t|
    t.integer "room_id", null: false
    t.string "publication_id", null: false
    t.string "title"
    t.text "catch_copy"
    t.text "pr_text"
    t.integer "status", default: 0, null: false
    t.json "visible_fields"
    t.datetime "published_at"
    t.datetime "discarded_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "template_type", default: 0, null: false
    t.integer "view_count", default: 0, null: false
    t.datetime "scheduled_publish_at"
    t.datetime "scheduled_unpublish_at"
    t.integer "max_scroll_depth"
    t.integer "avg_session_duration"
    t.string "primary_color"
    t.string "accent_color"
    t.datetime "expires_at"
    t.jsonb "device_stats", default: {}
    t.jsonb "referrer_stats", default: {}
    t.jsonb "hourly_stats", default: {}
    t.bigint "created_by_id"
    t.bigint "updated_by_id"
    t.string "access_password_digest"
    t.index ["created_by_id"], name: "index_property_publications_on_created_by_id"
    t.index ["discarded_at"], name: "index_property_publications_on_discarded_at"
    t.index ["publication_id"], name: "index_property_publications_on_publication_id", unique: true
    t.index ["room_id"], name: "index_property_publications_on_room_id"
    t.index ["status"], name: "index_property_publications_on_status"
    t.index ["updated_by_id"], name: "index_property_publications_on_updated_by_id"
  end

  create_table "railway_lines", force: :cascade do |t|
    t.string "code", null: false
    t.string "name", null: false
    t.string "company", null: false
    t.string "company_code", null: false
    t.string "color"
    t.integer "display_order", default: 0
    t.boolean "is_active", default: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_railway_lines_on_code", unique: true
    t.index ["company_code"], name: "index_railway_lines_on_company_code"
    t.index ["is_active"], name: "index_railway_lines_on_is_active"
  end

  create_table "room_facilities", force: :cascade do |t|
    t.bigint "room_id", null: false
    t.bigint "facility_id", null: false
    t.string "raw_text"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["facility_id"], name: "index_room_facilities_on_facility_id"
    t.index ["room_id", "facility_id"], name: "index_room_facilities_on_room_id_and_facility_id", unique: true
    t.index ["room_id"], name: "index_room_facilities_on_room_id"
  end

  create_table "room_photos", force: :cascade do |t|
    t.integer "room_id", null: false
    t.string "photo_type"
    t.string "file_path"
    t.text "caption"
    t.integer "display_order"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "source_url"
    t.text "alt_text"
    t.index ["room_id", "source_url"], name: "index_room_photos_on_room_id_and_source_url", unique: true, where: "(source_url IS NOT NULL)"
    t.index ["room_id"], name: "index_room_photos_on_room_id"
  end

  create_table "rooms", force: :cascade do |t|
    t.integer "building_id", null: false
    t.string "room_number"
    t.integer "floor"
    t.string "room_type"
    t.decimal "area"
    t.integer "rent"
    t.integer "status"
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "management_fee"
    t.integer "deposit"
    t.integer "key_money"
    t.string "tenant_name"
    t.string "tenant_phone"
    t.date "contract_start_date"
    t.date "contract_end_date"
    t.text "notes"
    t.string "direction"
    t.integer "parking_fee"
    t.date "available_date"
    t.integer "renewal_fee"
    t.boolean "guarantor_required", default: true
    t.boolean "pets_allowed", default: false
    t.boolean "two_person_allowed", default: false
    t.boolean "office_use_allowed", default: false
    t.string "suumo_room_code"
    t.string "suumo_detail_url"
    t.datetime "suumo_imported_at"
    t.index ["building_id"], name: "index_rooms_on_building_id"
    t.index ["suumo_room_code"], name: "index_rooms_on_suumo_room_code", where: "(suumo_room_code IS NOT NULL)"
  end

  create_table "school_districts", force: :cascade do |t|
    t.string "name"
    t.string "school_name"
    t.string "school_code"
    t.string "prefecture"
    t.string "city"
    t.string "school_type"
    t.json "geometry"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "map_layer_id"
    t.st_multi_polygon "geom", geographic: true
    t.index ["city"], name: "index_school_districts_on_city"
    t.index ["geom"], name: "index_school_districts_on_geom", using: :gist
    t.index ["map_layer_id"], name: "index_school_districts_on_map_layer_id"
    t.index ["prefecture"], name: "index_school_districts_on_prefecture"
    t.index ["school_code"], name: "index_school_districts_on_school_code"
  end

  create_table "solid_queue_blocked_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "queue_name", null: false
    t.integer "priority", default: 0, null: false
    t.string "concurrency_key", null: false
    t.datetime "expires_at", null: false
    t.datetime "created_at", null: false
    t.index ["concurrency_key", "priority", "job_id"], name: "index_solid_queue_blocked_executions_for_release"
    t.index ["expires_at", "concurrency_key"], name: "index_solid_queue_blocked_executions_for_maintenance"
    t.index ["job_id"], name: "index_solid_queue_blocked_executions_on_job_id", unique: true
  end

  create_table "solid_queue_claimed_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.bigint "process_id"
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_claimed_executions_on_job_id", unique: true
    t.index ["process_id", "job_id"], name: "index_solid_queue_claimed_executions_on_process_id_and_job_id"
  end

  create_table "solid_queue_failed_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.text "error"
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_failed_executions_on_job_id", unique: true
  end

  create_table "solid_queue_jobs", force: :cascade do |t|
    t.string "queue_name", null: false
    t.string "class_name", null: false
    t.text "arguments"
    t.integer "priority", default: 0, null: false
    t.string "active_job_id"
    t.datetime "scheduled_at"
    t.datetime "finished_at"
    t.string "concurrency_key"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active_job_id"], name: "index_solid_queue_jobs_on_active_job_id"
    t.index ["class_name"], name: "index_solid_queue_jobs_on_class_name"
    t.index ["finished_at"], name: "index_solid_queue_jobs_on_finished_at"
    t.index ["queue_name", "finished_at"], name: "index_solid_queue_jobs_for_filtering"
    t.index ["scheduled_at", "finished_at"], name: "index_solid_queue_jobs_for_alerting"
  end

  create_table "solid_queue_pauses", force: :cascade do |t|
    t.string "queue_name", null: false
    t.datetime "created_at", null: false
    t.index ["queue_name"], name: "index_solid_queue_pauses_on_queue_name", unique: true
  end

  create_table "solid_queue_processes", force: :cascade do |t|
    t.string "kind", null: false
    t.datetime "last_heartbeat_at", null: false
    t.bigint "supervisor_id"
    t.integer "pid", null: false
    t.string "hostname"
    t.text "metadata"
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.index ["last_heartbeat_at"], name: "index_solid_queue_processes_on_last_heartbeat_at"
    t.index ["name", "supervisor_id"], name: "index_solid_queue_processes_on_name_and_supervisor_id", unique: true
    t.index ["supervisor_id"], name: "index_solid_queue_processes_on_supervisor_id"
  end

  create_table "solid_queue_ready_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "queue_name", null: false
    t.integer "priority", default: 0, null: false
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_ready_executions_on_job_id", unique: true
    t.index ["priority", "job_id"], name: "index_solid_queue_poll_all"
    t.index ["queue_name", "priority", "job_id"], name: "index_solid_queue_poll_by_queue"
  end

  create_table "solid_queue_recurring_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "task_key", null: false
    t.datetime "run_at", null: false
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_recurring_executions_on_job_id", unique: true
    t.index ["task_key", "run_at"], name: "index_solid_queue_recurring_executions_on_task_key_and_run_at", unique: true
  end

  create_table "solid_queue_recurring_tasks", force: :cascade do |t|
    t.string "key", null: false
    t.string "schedule", null: false
    t.string "command", limit: 2048
    t.string "class_name"
    t.text "arguments"
    t.string "queue_name"
    t.integer "priority", default: 0
    t.boolean "static", default: true, null: false
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_solid_queue_recurring_tasks_on_key", unique: true
    t.index ["static"], name: "index_solid_queue_recurring_tasks_on_static"
  end

  create_table "solid_queue_scheduled_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "queue_name", null: false
    t.integer "priority", default: 0, null: false
    t.datetime "scheduled_at", null: false
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_scheduled_executions_on_job_id", unique: true
    t.index ["scheduled_at", "priority", "job_id"], name: "index_solid_queue_dispatch_all"
  end

  create_table "solid_queue_semaphores", force: :cascade do |t|
    t.string "key", null: false
    t.integer "value", default: 1, null: false
    t.datetime "expires_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["expires_at"], name: "index_solid_queue_semaphores_on_expires_at"
    t.index ["key", "value"], name: "index_solid_queue_semaphores_on_key_and_value"
    t.index ["key"], name: "index_solid_queue_semaphores_on_key", unique: true
  end

  create_table "stations", force: :cascade do |t|
    t.bigint "railway_line_id", null: false
    t.string "code", null: false
    t.string "name", null: false
    t.string "name_kana"
    t.st_point "location", geographic: true
    t.integer "display_order", default: 0
    t.boolean "is_active", default: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_stations_on_code", unique: true
    t.index ["is_active"], name: "index_stations_on_is_active"
    t.index ["location"], name: "index_stations_on_location", using: :gist
    t.index ["name"], name: "index_stations_on_name"
    t.index ["railway_line_id"], name: "index_stations_on_railway_line_id"
  end

  create_table "stores", force: :cascade do |t|
    t.bigint "tenant_id", null: false
    t.string "name", null: false
    t.string "address"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.decimal "latitude", precision: 10, scale: 7
    t.decimal "longitude", precision: 10, scale: 7
    t.st_point "location", geographic: true
    t.string "email"
    t.string "code", limit: 6, null: false
    t.index ["location"], name: "index_stores_on_location", using: :gist
    t.index ["tenant_id", "code"], name: "index_stores_on_tenant_id_and_code", unique: true
    t.index ["tenant_id"], name: "index_stores_on_tenant_id"
  end

  create_table "streetview_caches", force: :cascade do |t|
    t.st_point "location", null: false, geographic: true
    t.decimal "heading", precision: 6, scale: 2
    t.decimal "pitch", precision: 5, scale: 2, default: "0.0"
    t.integer "fov", default: 90
    t.string "pano_id"
    t.date "capture_date"
    t.datetime "expires_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["expires_at"], name: "index_streetview_caches_on_expires_at"
    t.index ["location"], name: "index_streetview_caches_on_location", using: :gist
    t.index ["pano_id"], name: "index_streetview_caches_on_pano_id", unique: true
  end

  create_table "suumo_import_histories", force: :cascade do |t|
    t.integer "tenant_id", null: false
    t.string "url", null: false
    t.string "status", default: "pending", null: false
    t.datetime "started_at"
    t.datetime "completed_at"
    t.integer "buildings_created", default: 0
    t.integer "buildings_updated", default: 0
    t.integer "rooms_created", default: 0
    t.integer "rooms_updated", default: 0
    t.integer "images_downloaded", default: 0
    t.integer "images_skipped", default: 0
    t.integer "error_count", default: 0
    t.text "log_data"
    t.json "options"
    t.text "error_message"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["started_at"], name: "index_suumo_import_histories_on_started_at"
    t.index ["status"], name: "index_suumo_import_histories_on_status"
    t.index ["tenant_id"], name: "index_suumo_import_histories_on_tenant_id"
  end

  create_table "tenants", force: :cascade do |t|
    t.string "name"
    t.string "subdomain"
    t.text "settings"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "status", default: 0, null: false
    t.string "plan", default: "basic"
    t.integer "max_users", default: 10
    t.integer "max_buildings", default: 100
    t.bigint "created_by_id"
    t.datetime "suspended_at"
    t.text "suspended_reason"
    t.index ["status"], name: "index_tenants_on_status"
  end

  create_table "unmatched_facilities", force: :cascade do |t|
    t.bigint "room_id", null: false
    t.string "raw_text", null: false
    t.integer "occurrence_count", default: 1
    t.string "status", default: "pending"
    t.bigint "mapped_to_facility_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["mapped_to_facility_id"], name: "index_unmatched_facilities_on_mapped_to_facility_id"
    t.index ["raw_text"], name: "index_unmatched_facilities_on_raw_text"
    t.index ["room_id"], name: "index_unmatched_facilities_on_room_id"
    t.index ["status", "occurrence_count"], name: "index_unmatched_facilities_on_status_and_occurrence_count"
  end

  create_table "users", force: :cascade do |t|
    t.integer "tenant_id", null: false
    t.string "email"
    t.string "name"
    t.string "password_digest"
    t.integer "role"
    t.string "auth_provider"
    t.string "auth_uid"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "phone"
    t.string "avatar_url"
    t.boolean "active", default: true, null: false
    t.datetime "last_login_at"
    t.bigint "store_id"
    t.string "position"
    t.string "employee_code"
    t.jsonb "notification_settings", default: {}
    t.datetime "password_changed_at"
    t.integer "failed_login_count", default: 0, null: false
    t.datetime "locked_at"
    t.text "email_signature"
    t.index ["active"], name: "index_users_on_active"
    t.index ["employee_code"], name: "index_users_on_employee_code"
    t.index ["store_id"], name: "index_users_on_store_id"
    t.index ["tenant_id"], name: "index_users_on_tenant_id"
  end

  create_table "virtual_staging_variations", force: :cascade do |t|
    t.bigint "virtual_staging_id", null: false
    t.bigint "after_photo_id", null: false
    t.string "style_name", null: false
    t.integer "display_order", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["after_photo_id"], name: "index_virtual_staging_variations_on_after_photo_id"
    t.index ["virtual_staging_id", "display_order"], name: "index_vs_variations_on_staging_and_order"
    t.index ["virtual_staging_id"], name: "index_virtual_staging_variations_on_virtual_staging_id"
  end

  create_table "virtual_stagings", force: :cascade do |t|
    t.integer "room_id", null: false
    t.string "title"
    t.text "description"
    t.integer "before_photo_id"
    t.integer "after_photo_id"
    t.integer "status", default: 0, null: false
    t.datetime "published_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "public_id"
    t.json "annotations", default: []
    t.bigint "created_by_id"
    t.bigint "updated_by_id"
    t.index ["after_photo_id"], name: "index_virtual_stagings_on_after_photo_id"
    t.index ["before_photo_id"], name: "index_virtual_stagings_on_before_photo_id"
    t.index ["created_by_id"], name: "index_virtual_stagings_on_created_by_id"
    t.index ["public_id"], name: "index_virtual_stagings_on_public_id", unique: true
    t.index ["room_id"], name: "index_virtual_stagings_on_room_id"
    t.index ["status"], name: "index_virtual_stagings_on_status"
    t.index ["updated_by_id"], name: "index_virtual_stagings_on_updated_by_id"
  end

  create_table "vr_scenes", force: :cascade do |t|
    t.integer "vr_tour_id", null: false
    t.integer "room_photo_id"
    t.string "title"
    t.integer "display_order"
    t.text "initial_view"
    t.text "hotspots"
    t.text "minimap_position"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "virtual_staging_id"
    t.index ["display_order"], name: "index_vr_scenes_on_display_order"
    t.index ["room_photo_id"], name: "index_vr_scenes_on_room_photo_id"
    t.index ["virtual_staging_id"], name: "index_vr_scenes_on_virtual_staging_id"
    t.index ["vr_tour_id"], name: "index_vr_scenes_on_vr_tour_id"
  end

  create_table "vr_tours", force: :cascade do |t|
    t.integer "room_id", null: false
    t.string "title"
    t.text "description"
    t.text "config"
    t.integer "status"
    t.datetime "published_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "minimap_room_photo_id"
    t.string "public_id"
    t.bigint "created_by_id"
    t.bigint "updated_by_id"
    t.index ["created_by_id"], name: "index_vr_tours_on_created_by_id"
    t.index ["minimap_room_photo_id"], name: "index_vr_tours_on_minimap_room_photo_id"
    t.index ["public_id"], name: "index_vr_tours_on_public_id", unique: true
    t.index ["room_id"], name: "index_vr_tours_on_room_id"
    t.index ["updated_by_id"], name: "index_vr_tours_on_updated_by_id"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "address_points", "map_layers"
  add_foreign_key "admin_audit_logs", "tenants"
  add_foreign_key "admin_audit_logs", "users"
  add_foreign_key "ai_generated_images", "room_photos"
  add_foreign_key "ai_generated_images", "rooms"
  add_foreign_key "building_photos", "buildings"
  add_foreign_key "building_routes", "buildings"
  add_foreign_key "building_routes", "tenants"
  add_foreign_key "building_stations", "buildings"
  add_foreign_key "building_stations", "stations"
  add_foreign_key "buildings", "stores"
  add_foreign_key "buildings", "tenants"
  add_foreign_key "bulk_import_histories", "tenants"
  add_foreign_key "bulk_import_histories", "users"
  add_foreign_key "bulk_import_items", "buildings", column: "created_building_id", on_delete: :nullify
  add_foreign_key "bulk_import_items", "buildings", column: "selected_building_id", on_delete: :nullify
  add_foreign_key "bulk_import_items", "bulk_import_histories"
  add_foreign_key "bulk_import_items", "rooms", column: "created_room_id", on_delete: :nullify
  add_foreign_key "customer_accesses", "customers"
  add_foreign_key "customer_accesses", "inquiries"
  add_foreign_key "customer_accesses", "property_inquiries"
  add_foreign_key "customer_accesses", "property_publications"
  add_foreign_key "customer_activities", "customer_accesses"
  add_foreign_key "customer_activities", "customers"
  add_foreign_key "customer_activities", "inquiries"
  add_foreign_key "customer_activities", "property_inquiries"
  add_foreign_key "customer_activities", "property_publications"
  add_foreign_key "customer_activities", "users"
  add_foreign_key "customer_image_simulations", "customer_accesses"
  add_foreign_key "customer_image_simulations", "property_publications"
  add_foreign_key "customer_merges", "customers", column: "primary_customer_id"
  add_foreign_key "customer_merges", "tenants"
  add_foreign_key "customer_merges", "users", column: "performed_by_id"
  add_foreign_key "customer_merges", "users", column: "undone_by_id"
  add_foreign_key "customer_routes", "customer_accesses"
  add_foreign_key "customers", "tenants"
  add_foreign_key "email_attachments", "customer_activities"
  add_foreign_key "email_drafts", "customers"
  add_foreign_key "email_drafts", "inquiries"
  add_foreign_key "email_drafts", "tenants"
  add_foreign_key "email_drafts", "users"
  add_foreign_key "email_templates", "tenants"
  add_foreign_key "facility_synonyms", "facilities"
  add_foreign_key "inquiries", "customers"
  add_foreign_key "inquiries", "tenants"
  add_foreign_key "inquiries", "users", column: "assigned_user_id"
  add_foreign_key "inquiry_read_statuses", "inquiries"
  add_foreign_key "inquiry_read_statuses", "users"
  add_foreign_key "line_configs", "tenants"
  add_foreign_key "line_templates", "tenants"
  add_foreign_key "map_layers", "tenants", on_delete: :cascade
  add_foreign_key "message_trackings", "customer_activities"
  add_foreign_key "owners", "buildings"
  add_foreign_key "owners", "tenants"
  add_foreign_key "presentation_accesses", "property_publications"
  add_foreign_key "property_inquiries", "customers"
  add_foreign_key "property_inquiries", "inquiries"
  add_foreign_key "property_inquiries", "property_publications"
  add_foreign_key "property_inquiries", "rooms"
  add_foreign_key "property_inquiries", "users", column: "assigned_user_id"
  add_foreign_key "property_publication_photos", "property_publications"
  add_foreign_key "property_publication_photos", "room_photos"
  add_foreign_key "property_publication_virtual_stagings", "property_publications"
  add_foreign_key "property_publication_virtual_stagings", "virtual_stagings"
  add_foreign_key "property_publication_vr_tours", "property_publications"
  add_foreign_key "property_publication_vr_tours", "vr_tours"
  add_foreign_key "property_publications", "rooms"
  add_foreign_key "property_publications", "users", column: "created_by_id"
  add_foreign_key "property_publications", "users", column: "updated_by_id"
  add_foreign_key "room_facilities", "facilities"
  add_foreign_key "room_facilities", "rooms"
  add_foreign_key "room_photos", "rooms"
  add_foreign_key "rooms", "buildings"
  add_foreign_key "school_districts", "map_layers"
  add_foreign_key "solid_queue_blocked_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_claimed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_failed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_ready_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_recurring_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_scheduled_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "stations", "railway_lines"
  add_foreign_key "stores", "tenants"
  add_foreign_key "suumo_import_histories", "tenants"
  add_foreign_key "tenants", "users", column: "created_by_id"
  add_foreign_key "unmatched_facilities", "facilities", column: "mapped_to_facility_id"
  add_foreign_key "unmatched_facilities", "rooms"
  add_foreign_key "users", "stores"
  add_foreign_key "users", "tenants"
  add_foreign_key "virtual_staging_variations", "room_photos", column: "after_photo_id"
  add_foreign_key "virtual_staging_variations", "virtual_stagings"
  add_foreign_key "virtual_stagings", "room_photos", column: "after_photo_id"
  add_foreign_key "virtual_stagings", "room_photos", column: "before_photo_id"
  add_foreign_key "virtual_stagings", "rooms"
  add_foreign_key "virtual_stagings", "users", column: "created_by_id"
  add_foreign_key "virtual_stagings", "users", column: "updated_by_id"
  add_foreign_key "vr_scenes", "room_photos"
  add_foreign_key "vr_scenes", "virtual_stagings"
  add_foreign_key "vr_scenes", "vr_tours"
  add_foreign_key "vr_tours", "room_photos", column: "minimap_room_photo_id"
  add_foreign_key "vr_tours", "rooms"
  add_foreign_key "vr_tours", "users", column: "created_by_id"
  add_foreign_key "vr_tours", "users", column: "updated_by_id"
end
