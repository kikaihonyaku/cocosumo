xml.instruct! :xml, version: '1.0', encoding: 'UTF-8'
xml.urlset xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9',
           'xmlns:image': 'http://www.google.com/schemas/sitemap-image/1.1' do

  # Homepage
  xml.url do
    xml.loc root_url
    xml.changefreq 'daily'
    xml.priority '1.0'
  end

  # Property publications
  @property_publications.each do |publication|
    xml.url do
      xml.loc "#{root_url}property/#{publication.publication_id}"
      xml.lastmod publication.updated_at.strftime('%Y-%m-%d')
      xml.changefreq 'weekly'
      xml.priority '0.8'

      # Add images for better SEO
      if publication.property_publication_photos.any?
        publication.property_publication_photos.limit(5).each do |photo|
          next unless photo.room_photo&.photo&.attached?

          xml.tag!('image:image') do
            xml.tag!('image:loc', rails_blob_url(photo.room_photo.photo, only_path: false))
            xml.tag!('image:title', publication.title)
            xml.tag!('image:caption', photo.comment || publication.catch_copy || publication.title)
          end
        end
      end
    end
  end
end
