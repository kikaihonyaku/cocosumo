class ProcessScheduledPublicationsJob < ApplicationJob
  queue_as :default

  def perform
    process_scheduled_publishes
    process_scheduled_unpublishes
  end

  private

  def process_scheduled_publishes
    # Find publications that should be published now
    publications = PropertyPublication.kept
                                      .where(status: :draft)
                                      .where.not(scheduled_publish_at: nil)
                                      .where('scheduled_publish_at <= ?', Time.current)

    publications.find_each do |publication|
      publication.update!(
        status: :published,
        published_at: Time.current,
        scheduled_publish_at: nil
      )
      Rails.logger.info "[ScheduledPublication] Published: #{publication.id} - #{publication.title}"
    end
  end

  def process_scheduled_unpublishes
    # Find publications that should be unpublished now
    publications = PropertyPublication.kept
                                      .where(status: :published)
                                      .where.not(scheduled_unpublish_at: nil)
                                      .where('scheduled_unpublish_at <= ?', Time.current)

    publications.find_each do |publication|
      publication.update!(
        status: :draft,
        published_at: nil,
        scheduled_unpublish_at: nil
      )
      Rails.logger.info "[ScheduledPublication] Unpublished: #{publication.id} - #{publication.title}"
    end
  end
end
