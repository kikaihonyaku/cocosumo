class HashPropertyPublicationPasswords < ActiveRecord::Migration[8.0]
  def up
    # Add password_digest column for bcrypt hashing
    add_column :property_publications, :access_password_digest, :string

    # Migrate existing plaintext passwords to bcrypt hashes
    PropertyPublication.where.not(access_password: [nil, ""]).find_each do |pub|
      digest = BCrypt::Password.create(pub.access_password)
      pub.update_column(:access_password_digest, digest)
    end

    # Remove old plaintext column
    remove_column :property_publications, :access_password
  end

  def down
    add_column :property_publications, :access_password, :string
    remove_column :property_publications, :access_password_digest
  end
end
