# Rack::Attack configuration for rate limiting
class Rack::Attack
  # Use Rails cache store for throttle data
  Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new

  ### Throttle Rules ###

  # Limit login attempts by IP (5 per 20 seconds)
  throttle("login/ip", limit: 5, period: 20.seconds) do |req|
    if req.path == "/api/v1/session" && req.post?
      req.ip
    end
  end

  # Limit login attempts by email (10 per 5 minutes)
  throttle("login/email", limit: 10, period: 5.minutes) do |req|
    if req.path == "/api/v1/session" && req.post?
      # Normalize email from request body
      req.params.dig("email")&.to_s&.downcase&.strip
    end
  end

  # Limit password verification for property publications (5 per minute per IP)
  throttle("password_verify/ip", limit: 5, period: 1.minute) do |req|
    if req.path.match?(%r{/api/v1/property_publications/.+/verify_password}) && req.post?
      req.ip
    end
  end

  # Limit customer access password verification (5 per minute per IP)
  throttle("customer_access_verify/ip", limit: 5, period: 1.minute) do |req|
    if req.path.match?(%r{/api/v1/customer_accesses/.+/verify_password}) && req.post?
      req.ip
    end
  end

  # Limit contact form / inquiry submissions (10 per minute per IP)
  throttle("inquiries/ip", limit: 10, period: 1.minute) do |req|
    if req.path.match?(%r{/api/v1/property_inquiries}) && req.post?
      req.ip
    end
  end

  # General API rate limit (300 requests per minute per IP)
  throttle("api/ip", limit: 300, period: 1.minute) do |req|
    if req.path.start_with?("/api/")
      req.ip
    end
  end

  ### Custom Responses ###

  self.throttled_responder = ->(req) {
    retry_after = (req.env["rack.attack.match_data"] || {})[:period]
    [
      429,
      { "Content-Type" => "application/json", "Retry-After" => retry_after.to_s },
      [{ error: "リクエスト制限を超えました。しばらくしてから再度お試しください。" }.to_json]
    ]
  }
end
