# Be sure to restart your server when you modify this file.

# Define an application-wide content security policy.
# See the Securing Rails Applications Guide for more information:
# https://guides.rubyonrails.org/security.html#content-security-policy-header

Rails.application.configure do
  config.content_security_policy do |policy|
    policy.default_src :self, :https
    policy.font_src    :self, :https, :data, "fonts.gstatic.com"
    policy.img_src     :self, :https, :data, :blob
    policy.object_src  :none
    policy.script_src  :self, :https, "maps.googleapis.com"
    policy.style_src   :self, :https, :unsafe_inline, "fonts.googleapis.com"
    policy.connect_src :self, :https
    policy.frame_src   :self, :https

    # Allow @vite/client to hot reload in development
    if Rails.env.development?
      policy.script_src *policy.script_src, :unsafe_eval, "http://#{ViteRuby.config.host_with_port}"
      policy.connect_src *policy.connect_src, "http://#{ViteRuby.config.host_with_port}", "ws://#{ViteRuby.config.host_with_port}"
    end

    # Blob needed for test environment
    policy.script_src *policy.script_src, :blob if Rails.env.test?
  end

  # Report violations without enforcing the policy (初期導入時はreport-onlyで様子見)
  config.content_security_policy_report_only = true
end
