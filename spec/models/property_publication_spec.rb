# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PropertyPublication, type: :model do
  describe 'associations' do
    it { is_expected.to belong_to(:room) }
    it { is_expected.to have_many(:property_publication_photos).dependent(:destroy) }
    it { is_expected.to have_many(:property_inquiries).dependent(:destroy) }
  end

  describe 'validations' do
    subject { build(:property_publication) }

    it { is_expected.to validate_presence_of(:publication_id) }
    it { is_expected.to validate_presence_of(:title) }
    it { is_expected.to validate_presence_of(:status) }
  end

  describe '#publish!' do
    let(:publication) { create(:property_publication, status: :draft) }

    it 'changes status to published' do
      expect { publication.publish! }.to change(publication, :status).from('draft').to('published')
    end

    it 'sets published_at timestamp' do
      freeze_time do
        publication.publish!
        expect(publication.published_at).to eq(Time.current)
      end
    end
  end

  describe '#unpublish!' do
    let(:publication) { create(:property_publication, :published) }

    it 'changes status to draft' do
      expect { publication.unpublish! }.to change(publication, :status).from('published').to('draft')
    end

    it 'clears published_at' do
      publication.unpublish!
      expect(publication.published_at).to be_nil
    end
  end

  describe '#password_protected?' do
    it 'returns false when no password is set' do
      publication = build(:property_publication, access_password: nil)
      expect(publication.password_protected?).to be false
    end

    it 'returns true when password is set' do
      publication = build(:property_publication, :with_password)
      expect(publication.password_protected?).to be true
    end
  end

  describe '#authenticate_password' do
    context 'without password protection' do
      let(:publication) { create(:property_publication, access_password: nil) }

      it 'returns true for any input' do
        expect(publication.authenticate_password('anything')).to be true
        expect(publication.authenticate_password(nil)).to be true
      end
    end

    context 'with password protection' do
      let(:publication) { create(:property_publication, :with_password) }

      it 'returns true for correct password' do
        expect(publication.authenticate_password('secret123')).to be true
      end

      it 'returns false for incorrect password' do
        expect(publication.authenticate_password('wrong')).to be false
      end

      # SECURITY NOTE: This test documents that passwords are stored in plain text
      # This should be fixed using has_secure_password or similar
      it 'stores password in plain text (SECURITY ISSUE - should be fixed)' do
        expect(publication.access_password).to eq('secret123')
      end
    end
  end

  describe '#expired?' do
    it 'returns false when expires_at is nil' do
      publication = build(:property_publication, expires_at: nil)
      expect(publication.expired?).to be false
    end

    it 'returns false when expires_at is in future' do
      publication = build(:property_publication, :not_expired)
      expect(publication.expired?).to be false
    end

    it 'returns true when expires_at is in past' do
      publication = build(:property_publication, :expired)
      expect(publication.expired?).to be true
    end
  end

  describe '#accessible?' do
    it 'returns true when published and not expired' do
      publication = build(:property_publication, :published, :not_expired)
      expect(publication.accessible?).to be true
    end

    it 'returns false when draft' do
      publication = build(:property_publication)
      expect(publication.accessible?).to be false
    end

    it 'returns false when expired' do
      publication = build(:property_publication, :published, :expired)
      expect(publication.accessible?).to be false
    end
  end

  describe '#duplicate' do
    let!(:original) { create(:property_publication, :published, title: 'Original') }

    it 'creates a new publication' do
      expect { original.duplicate }.to change(PropertyPublication, :count).by(1)
    end

    it 'sets title with copy suffix' do
      duplicate = original.duplicate
      expect(duplicate.title).to eq('Original (コピー)')
    end

    it 'sets status to draft' do
      duplicate = original.duplicate
      expect(duplicate.status).to eq('draft')
    end

    it 'generates new publication_id' do
      duplicate = original.duplicate
      expect(duplicate.publication_id).not_to eq(original.publication_id)
    end

    it 'clears published_at' do
      duplicate = original.duplicate
      expect(duplicate.published_at).to be_nil
    end
  end

  describe 'publication_id generation' do
    it 'generates unique publication_id on create' do
      publication = create(:property_publication)
      expect(publication.publication_id).to be_present
      expect(publication.publication_id.length).to eq(12)
    end

    it 'generates alphanumeric lowercase id' do
      publication = create(:property_publication)
      expect(publication.publication_id).to match(/\A[a-z0-9]+\z/)
    end

    it 'does not overwrite existing publication_id' do
      publication = build(:property_publication)
      publication.publication_id = 'custom123456'
      publication.save!
      expect(publication.publication_id).to eq('custom123456')
    end
  end

  describe 'scopes' do
    let!(:published_pub) { create(:property_publication, :published) }
    let!(:draft_pub) { create(:property_publication) }
    let!(:expired_pub) { create(:property_publication, :published, :expired) }

    describe '.published' do
      it 'returns only published publications' do
        expect(described_class.published).to include(published_pub, expired_pub)
        expect(described_class.published).not_to include(draft_pub)
      end
    end

    describe '.draft' do
      it 'returns only draft publications' do
        expect(described_class.draft).to include(draft_pub)
        expect(described_class.draft).not_to include(published_pub)
      end
    end

    describe '.expired' do
      it 'returns only expired publications' do
        expect(described_class.expired).to include(expired_pub)
        expect(described_class.expired).not_to include(published_pub)
      end
    end

    describe '.not_expired' do
      it 'returns publications without expiry or future expiry' do
        expect(described_class.not_expired).to include(published_pub, draft_pub)
        expect(described_class.not_expired).not_to include(expired_pub)
      end
    end
  end
end
