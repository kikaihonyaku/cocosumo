# frozen_string_literal: true

module ApiHelpers
  def json_response
    JSON.parse(response.body)
  end

  def login_as(user)
    post '/api/v1/auth/login', params: { email: user.email, password: 'password123' }
  end

  def auth_headers(user)
    login_as(user)
    { 'Cookie' => response.headers['Set-Cookie'] }
  end
end

RSpec.configure do |config|
  config.include ApiHelpers, type: :request
end
