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

ActiveRecord::Schema[8.0].define(version: 2025_12_29_085451) do
  create_schema "topology"

  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "postgis"
  enable_extension "topology.postgis_topology"

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

  create_table "map_layers", force: :cascade do |t|
    t.integer "tenant_id", null: false
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
    t.index ["is_active"], name: "index_map_layers_on_is_active"
    t.index ["layer_type"], name: "index_map_layers_on_layer_type"
    t.index ["tenant_id", "layer_key"], name: "index_map_layers_on_tenant_id_and_layer_key", unique: true
    t.index ["tenant_id"], name: "index_map_layers_on_tenant_id"
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

  create_table "property_inquiries", force: :cascade do |t|
    t.integer "property_publication_id", null: false
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
    t.index ["created_at"], name: "index_property_inquiries_on_created_at"
    t.index ["property_publication_id"], name: "index_property_inquiries_on_property_publication_id"
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
    t.index ["discarded_at"], name: "index_property_publications_on_discarded_at"
    t.index ["publication_id"], name: "index_property_publications_on_publication_id", unique: true
    t.index ["room_id"], name: "index_property_publications_on_room_id"
    t.index ["status"], name: "index_property_publications_on_status"
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
    t.index ["room_id", "source_url"], name: "index_room_photos_on_room_id_and_source_url", unique: true, where: "(source_url IS NOT NULL)"
    t.index ["room_id"], name: "index_room_photos_on_room_id"
  end

  create_table "rooms", force: :cascade do |t|
    t.integer "building_id", null: false
    t.string "room_number"
    t.integer "floor"
    t.string "room_type"
    t.decimal "area"
    t.decimal "rent"
    t.integer "status"
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.decimal "management_fee"
    t.decimal "deposit"
    t.decimal "key_money"
    t.text "facilities"
    t.string "tenant_name"
    t.string "tenant_phone"
    t.date "contract_start_date"
    t.date "contract_end_date"
    t.text "notes"
    t.string "direction"
    t.decimal "parking_fee"
    t.date "available_date"
    t.decimal "renewal_fee"
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

  create_table "stores", force: :cascade do |t|
    t.bigint "tenant_id", null: false
    t.string "name", null: false
    t.string "address"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.decimal "latitude", precision: 10, scale: 7
    t.decimal "longitude", precision: 10, scale: 7
    t.st_point "location", geographic: true
    t.index ["location"], name: "index_stores_on_location", using: :gist
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
    t.index ["after_photo_id"], name: "index_virtual_stagings_on_after_photo_id"
    t.index ["before_photo_id"], name: "index_virtual_stagings_on_before_photo_id"
    t.index ["public_id"], name: "index_virtual_stagings_on_public_id", unique: true
    t.index ["room_id"], name: "index_virtual_stagings_on_room_id"
    t.index ["status"], name: "index_virtual_stagings_on_status"
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
    t.index ["minimap_room_photo_id"], name: "index_vr_tours_on_minimap_room_photo_id"
    t.index ["public_id"], name: "index_vr_tours_on_public_id", unique: true
    t.index ["room_id"], name: "index_vr_tours_on_room_id"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "address_points", "map_layers"
  add_foreign_key "ai_generated_images", "room_photos"
  add_foreign_key "ai_generated_images", "rooms"
  add_foreign_key "building_photos", "buildings"
  add_foreign_key "building_routes", "buildings"
  add_foreign_key "building_routes", "tenants"
  add_foreign_key "buildings", "stores"
  add_foreign_key "buildings", "tenants"
  add_foreign_key "map_layers", "tenants"
  add_foreign_key "owners", "buildings"
  add_foreign_key "owners", "tenants"
  add_foreign_key "property_inquiries", "property_publications"
  add_foreign_key "property_publication_photos", "property_publications"
  add_foreign_key "property_publication_photos", "room_photos"
  add_foreign_key "property_publication_virtual_stagings", "property_publications"
  add_foreign_key "property_publication_virtual_stagings", "virtual_stagings"
  add_foreign_key "property_publication_vr_tours", "property_publications"
  add_foreign_key "property_publication_vr_tours", "vr_tours"
  add_foreign_key "property_publications", "rooms"
  add_foreign_key "room_photos", "rooms"
  add_foreign_key "rooms", "buildings"
  add_foreign_key "school_districts", "map_layers"
  add_foreign_key "stores", "tenants"
  add_foreign_key "suumo_import_histories", "tenants"
  add_foreign_key "users", "tenants"
  add_foreign_key "virtual_staging_variations", "room_photos", column: "after_photo_id"
  add_foreign_key "virtual_staging_variations", "virtual_stagings"
  add_foreign_key "virtual_stagings", "room_photos", column: "after_photo_id"
  add_foreign_key "virtual_stagings", "room_photos", column: "before_photo_id"
  add_foreign_key "virtual_stagings", "rooms"
  add_foreign_key "vr_scenes", "room_photos"
  add_foreign_key "vr_scenes", "virtual_stagings"
  add_foreign_key "vr_scenes", "vr_tours"
  add_foreign_key "vr_tours", "room_photos", column: "minimap_room_photo_id"
  add_foreign_key "vr_tours", "rooms"
end
