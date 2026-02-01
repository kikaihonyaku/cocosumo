Geocoder.configure(
  lookup: :google,
  api_key: ENV["GOOGLE_GEOCODING_API_KEY"],
  timeout: 5,
  use_https: true,
  language: :ja,
  units: :km,
)
