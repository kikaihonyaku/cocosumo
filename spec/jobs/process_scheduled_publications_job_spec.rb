# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ProcessScheduledPublicationsJob, type: :job do
  let(:tenant) { create(:tenant) }
  let(:building) { create(:building, tenant: tenant) }
  let(:room) { create(:room, building: building, tenant: tenant) }

  describe '#perform' do
    describe 'scheduled publish processing' do
      context 'with publications scheduled for the past' do
        let!(:publication) do
          create(:property_publication, room: room, tenant: tenant,
                 status: :draft,
                 scheduled_publish_at: 1.hour.ago)
        end

        it 'publishes the publication' do
          described_class.perform_now

          publication.reload
          expect(publication.status).to eq('published')
          expect(publication.published_at).to be_present
          expect(publication.scheduled_publish_at).to be_nil
        end
      end

      context 'with publications scheduled for exactly now' do
        let!(:publication) do
          create(:property_publication, room: room, tenant: tenant,
                 status: :draft,
                 scheduled_publish_at: Time.current)
        end

        it 'publishes the publication' do
          described_class.perform_now

          publication.reload
          expect(publication.status).to eq('published')
        end
      end

      context 'with publications scheduled for the future' do
        let!(:publication) do
          create(:property_publication, room: room, tenant: tenant,
                 status: :draft,
                 scheduled_publish_at: 1.hour.from_now)
        end

        it 'does not publish the publication' do
          described_class.perform_now

          publication.reload
          expect(publication.status).to eq('draft')
          expect(publication.scheduled_publish_at).to be_present
        end
      end

      context 'with already published publications' do
        let!(:publication) do
          create(:property_publication, :published, room: room, tenant: tenant,
                 scheduled_publish_at: 1.hour.ago)
        end

        it 'does not change the publication' do
          original_published_at = publication.published_at

          described_class.perform_now

          publication.reload
          expect(publication.status).to eq('published')
          expect(publication.published_at).to be_within(1.second).of(original_published_at)
        end
      end

      context 'with discarded publications' do
        let!(:publication) do
          create(:property_publication, room: room, tenant: tenant,
                 status: :draft,
                 scheduled_publish_at: 1.hour.ago)
        end

        before { publication.discard }

        it 'does not publish discarded publications' do
          described_class.perform_now

          publication.reload
          expect(publication.status).to eq('draft')
        end
      end

      context 'with multiple publications scheduled' do
        let!(:publications) do
          3.times.map do |i|
            create(:property_publication, room: room, tenant: tenant,
                   status: :draft,
                   scheduled_publish_at: (i + 1).hours.ago,
                   title: "Publication #{i + 1}")
          end
        end

        it 'publishes all scheduled publications' do
          described_class.perform_now

          publications.each do |pub|
            pub.reload
            expect(pub.status).to eq('published')
          end
        end
      end
    end

    describe 'scheduled unpublish processing' do
      context 'with publications scheduled to unpublish in the past' do
        let!(:publication) do
          create(:property_publication, :published, room: room, tenant: tenant,
                 scheduled_unpublish_at: 1.hour.ago)
        end

        it 'unpublishes the publication' do
          described_class.perform_now

          publication.reload
          expect(publication.status).to eq('draft')
          expect(publication.published_at).to be_nil
          expect(publication.scheduled_unpublish_at).to be_nil
        end
      end

      context 'with publications scheduled to unpublish exactly now' do
        let!(:publication) do
          create(:property_publication, :published, room: room, tenant: tenant,
                 scheduled_unpublish_at: Time.current)
        end

        it 'unpublishes the publication' do
          described_class.perform_now

          publication.reload
          expect(publication.status).to eq('draft')
        end
      end

      context 'with publications scheduled to unpublish in the future' do
        let!(:publication) do
          create(:property_publication, :published, room: room, tenant: tenant,
                 scheduled_unpublish_at: 1.hour.from_now)
        end

        it 'does not unpublish the publication' do
          described_class.perform_now

          publication.reload
          expect(publication.status).to eq('published')
          expect(publication.scheduled_unpublish_at).to be_present
        end
      end

      context 'with draft publications with scheduled unpublish' do
        let!(:publication) do
          create(:property_publication, room: room, tenant: tenant,
                 status: :draft,
                 scheduled_unpublish_at: 1.hour.ago)
        end

        it 'does not change draft publications' do
          described_class.perform_now

          publication.reload
          expect(publication.status).to eq('draft')
          # scheduled_unpublish_at should remain since it wasn't processed
          expect(publication.scheduled_unpublish_at).to be_present
        end
      end

      context 'with discarded publications' do
        let!(:publication) do
          create(:property_publication, :published, room: room, tenant: tenant,
                 scheduled_unpublish_at: 1.hour.ago)
        end

        before { publication.discard }

        it 'does not unpublish discarded publications' do
          described_class.perform_now

          publication.reload
          expect(publication.status).to eq('published')
        end
      end
    end

    describe 'combined publish and unpublish processing' do
      let!(:to_publish) do
        create(:property_publication, room: room, tenant: tenant,
               status: :draft,
               scheduled_publish_at: 1.hour.ago)
      end

      let!(:to_unpublish) do
        create(:property_publication, :published, room: room, tenant: tenant,
               scheduled_unpublish_at: 1.hour.ago)
      end

      let!(:no_change) do
        create(:property_publication, :published, room: room, tenant: tenant)
      end

      it 'processes both publish and unpublish in single job run' do
        described_class.perform_now

        expect(to_publish.reload.status).to eq('published')
        expect(to_unpublish.reload.status).to eq('draft')
        expect(no_change.reload.status).to eq('published')
      end
    end
  end

  describe 'job configuration' do
    it 'is in the default queue' do
      expect(described_class.new.queue_name).to eq('default')
    end
  end

  describe 'logging' do
    let!(:publication) do
      create(:property_publication, room: room, tenant: tenant,
             status: :draft,
             scheduled_publish_at: 1.hour.ago)
    end

    it 'logs when publishing' do
      expect(Rails.logger).to receive(:info).with(/Published:.*#{publication.id}/)

      described_class.perform_now
    end
  end
end
