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

ActiveRecord::Schema[8.0].define(version: 2025_10_13_204327) do
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

  create_table "ai_generated_images", force: :cascade do |t|
    t.integer "room_id", null: false
    t.integer "original_photo_id", null: false
    t.string "source_image_path"
    t.string "generated_image_path"
    t.string "generation_type"
    t.text "prompt"
    t.integer "status"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["original_photo_id"], name: "index_ai_generated_images_on_original_photo_id"
    t.index ["room_id"], name: "index_ai_generated_images_on_room_id"
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
    t.integer "built_year"
    t.string "postcode"
    t.string "structure"
    t.integer "floors"
    t.index ["tenant_id"], name: "index_buildings_on_tenant_id"
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

  create_table "room_photos", force: :cascade do |t|
    t.integer "room_id", null: false
    t.string "photo_type"
    t.string "file_path"
    t.text "caption"
    t.integer "display_order"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
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
    t.index ["building_id"], name: "index_rooms_on_building_id"
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

  create_table "vr_tours", force: :cascade do |t|
    t.integer "room_id", null: false
    t.string "title"
    t.text "description"
    t.text "config"
    t.integer "status"
    t.datetime "published_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["room_id"], name: "index_vr_tours_on_room_id"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "ai_generated_images", "original_photos"
  add_foreign_key "ai_generated_images", "rooms"
  add_foreign_key "buildings", "tenants"
  add_foreign_key "owners", "buildings"
  add_foreign_key "owners", "tenants"
  add_foreign_key "room_photos", "rooms"
  add_foreign_key "rooms", "buildings"
  add_foreign_key "users", "tenants"
  add_foreign_key "vr_tours", "rooms"
end
