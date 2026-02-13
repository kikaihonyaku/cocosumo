Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Defines the root path route ("/")
  root "pages#index"

  # SEO routes
  get 'sitemap.xml', to: 'sitemaps#index', defaults: { format: 'xml' }
  get 'robots.txt', to: 'sitemaps#robots', defaults: { format: 'text' }

  # API routes
  namespace :api do
    namespace :v1 do
      # 認証関連
      get 'auth/me', to: 'auth#me'
      post 'auth/login', to: 'auth#login'
      post 'auth/logout', to: 'auth#logout'
      post 'auth/change_password', to: 'auth#change_password'
      get 'auth/profile', to: 'auth#profile'
      patch 'auth/profile', to: 'auth#update_profile'

      # Gemini AI
      post 'gemini/process_image', to: 'gemini#process_image'
      post 'gemini/generate_alt_text', to: 'gemini#generate_alt_text'
      post 'gemini/bulk_generate_alt_text', to: 'gemini#bulk_generate_alt_text'

      # Imagen AI (image editing)
      post 'imagen/edit_image', to: 'imagen#edit_image'
      post 'imagen/add_watermark', to: 'imagen#add_watermark'

      # 店舗管理
      resources :stores, only: [:index, :create, :show, :update] do
        collection do
          post :geocode
        end
      end

      # 設備マスタ
      resources :facilities, only: [:index]

      # 沿線・駅マスタ
      resources :railway_lines, only: [:index] do
        collection do
          get :stations_search
        end
      end

      # 一括物件登録
      resources :bulk_imports, only: [:create, :show] do
        member do
          patch 'items/:item_id', to: 'bulk_imports#update_item', as: :update_item
          post :register
        end
      end

      # 物件管理
      resources :buildings do
        # 募集図面からの物件登録
        collection do
          post :analyze_floorplan
          post :find_similar
          post :register_from_floorplan
        end

        resources :photos, only: [:index, :create, :destroy, :show, :update], controller: 'building_photos' do
          member do
            post :replace
            post :duplicate
            get :proxy
            post :move_to_room
          end
        end
        resources :owners
        resources :rooms, only: [:index, :create]

        # 経路管理
        resources :routes, controller: 'building_routes' do
          collection do
            post :preview   # 経路候補プレビュー
            post :confirm   # 選択した経路を保存
          end
          member do
            post :calculate           # 経路再計算
            get :streetview_points    # ストリートビューポイント取得
          end
        end

        # 物件個別アクション
        member do
          post :restore    # 論理削除からの復元
          post :grounding  # Grounding with Google Maps
        end

        # GIS検索アクション
        collection do
          get :nearest           # 最寄り物件検索
          get :by_school_district # 学区内物件検索
        end
      end

      # 削除済み物件一覧
      get 'buildings_archived', to: 'buildings#archived'

      # ストリートビューAPI
      post 'streetview/metadata', to: 'streetview#metadata'

      # 学区情報
      resources :school_districts, only: [:index, :show] do
        collection do
          get :stats
          get :find_by_location  # 座標から学区検索
        end
      end

      # レイヤーデータ（一般ユーザー向け）
      resources :map_layers, only: [:index, :show] do
        member do
          get :geojson  # GeoJSONデータ取得
        end
      end

      # スーパー管理者用API
      namespace :super_admin do
        resources :tenants do
          member do
            post :suspend
            post :reactivate
            post :impersonate
          end
          collection do
            get :dashboard
            post :stop_impersonation
          end
        end
      end

      # 管理者用API
      namespace :admin do
        resources :users do
          member do
            post :unlock
          end
        end

        resources :map_layers do
          member do
            post :append_features    # フィーチャー追加
            post :replace_features   # データ上書き
          end
        end

        # SUUMO インポート
        resources :suumo_imports, only: [:index, :show, :create] do
          collection do
            post :sync      # 同期実行（小規模インポート用）
            post :preview   # プレビュー（保存せずに解析結果を確認）
            get :tenants    # テナント一覧
          end
        end
      end

      # 部屋詳細・更新・削除はスタンドアロン
      resources :rooms, only: [:show, :update, :destroy] do
        collection do
          get :search
          get :advanced_search
        end
        member do
          post :upload_floorplan
          delete :delete_floorplan
          post :analyze_floorplan
          post :regenerate_floorplan_thumbnail
        end

        # 部屋写真管理
        resources :room_photos do
          member do
            post :replace
            post :duplicate
            get :proxy
            get :check_dependencies
            post :move_to_building
          end
        end

        # VRツアー管理
        resources :vr_tours do
          member do
            post :publish
            post :unpublish
          end
        end

        # バーチャルステージング管理
        resources :virtual_stagings do
          member do
            post :publish
            post :unpublish
          end
        end

        # 物件公開ページ管理
        resources :property_publications do
          member do
            post :publish
            post :unpublish
            post :duplicate
          end
        end
      end

      # VRツアー一覧・一括操作
      resources :vr_tours, only: [:index] do
        collection do
          post :bulk_action
        end
      end

      # VRツアーのシーン管理
      resources :vr_tours, only: [] do
        resources :vr_scenes do
          member do
            post :reorder
          end
        end
      end

      # 公開VRツアー表示用（認証不要、public_idで取得）
      get 'vr_tours/:public_id/public', to: 'vr_tours#show_public', as: :public_vr_tour

      # VRシーン画像プロキシ（認証不要、CORS回避用）
      get 'vr_scenes/:id/photo', to: 'vr_scenes#photo'
      get 'vr_scenes/:id/before_photo', to: 'vr_scenes#before_photo'
      get 'vr_scenes/:id/after_photo', to: 'vr_scenes#after_photo'

      # バーチャルステージング一覧
      resources :virtual_stagings, only: [:index] do
        resources :variations, controller: 'virtual_staging_variations', only: [:create, :update, :destroy] do
          collection do
            post :reorder
          end
        end
      end

      # 公開バーチャルステージング表示用（認証不要、public_idで取得）
      get 'virtual_stagings/:public_id/public', to: 'virtual_stagings#show_public', as: :public_virtual_staging

      # 物件公開ページ一覧
      resources :property_publications, only: [:index] do
        collection do
          post :bulk_action
          get :search
        end
      end

      # 公開物件詳細表示用（認証不要、publication_idで取得）
      get 'property_publications/:publication_id/public', to: 'property_publications#show_public'

      # ページビュー追跡（認証不要）
      post 'property_publications/:publication_id/track_view', to: 'property_publications#track_view'
      post 'property_publications/:publication_id/track_analytics', to: 'property_publications#track_analytics'

      # パスワード検証（認証不要）
      post 'property_publications/:publication_id/verify_password', to: 'property_publications#verify_password'

      # 詳細分析（認証必要）
      get 'property_publications/:publication_id/analytics', to: 'property_publications#analytics'

      # 物件分析API
      get 'property_analysis', to: 'property_analysis#show'
      post 'property_analysis/geo_filter', to: 'property_analysis#geo_filter'

      # 問い合わせAPI（認証不要）
      resources :property_publications, only: [], param: :publication_id do
        resources :property_inquiries, only: [:create, :index], controller: 'property_inquiries'
      end

      # 問い合わせ分析API（認証必要）
      get 'inquiry_analytics', to: 'property_inquiries#analytics'
      get 'property_inquiries', to: 'property_inquiries#all'
      get 'property_inquiries/export_csv', to: 'property_inquiries#export_csv'

      # 問い合わせ個別操作（認証必要）
      resources :property_inquiries, only: [:update] do
        member do
          post :reply
          post :change_deal_status
        end
      end

      # 未読通知（認証必要）
      get 'unread_notifications/count', to: 'unread_notifications#count'
      get 'unread_notifications', to: 'unread_notifications#index'
      post 'unread_notifications/mark_read', to: 'unread_notifications#mark_read'
      post 'unread_notifications/mark_all_read', to: 'unread_notifications#mark_all_read'

      # 案件管理（認証必要）
      resources :inquiries, only: [:index, :show, :create, :update] do
        member do
          post :change_status
          post :add_property
          get :photos
        end
      end

      # 顧客マイページ管理（物件公開ページ単位）
      resources :property_publications, only: [] do
        resources :customer_accesses, only: [:index, :create] do
          collection do
            get :check_existing
          end
        end
      end

      # 顧客アクセス分析API（認証必要）
      get 'customer_access_analytics', to: 'customer_accesses#analytics'

      # 顧客アクセス詳細操作（全一覧 + 個別操作）
      resources :customer_accesses, only: [:index, :show, :update, :destroy] do
        member do
          post :revoke
          post :extend_expiry
          post :set_password
          post :remove_password
        end
      end

      # ダッシュボード（認証必要）
      resource :dashboard, only: [:show]

      # 顧客管理（認証必要）
      resources :customers, only: [:index, :show, :update, :destroy] do
        member do
          get :inquiries
          get :accesses
          post :create_inquiry
          post :send_email
          post :send_line_message
          get :merge_preview
          post :merge
        end
        collection do
          get :find_duplicates
          post :bulk_send_line_guidance
        end
        resources :activities, controller: 'customer_activities', only: [:index, :create, :update, :destroy]
        resources :email_drafts, only: [:index, :create, :update, :destroy]
      end

      resources :customer_merges, only: [:index] do
        member do
          post :undo
        end
      end

      resources :email_templates, only: [:index, :create, :update, :destroy]
      resources :line_templates, only: [:index, :create, :update, :destroy]

      # LINE設定管理
      resource :line_config, only: [:show, :update] do
        post :test
      end

      # LINE Webhook（認証不要）
      post 'line/webhook/:tenant_subdomain', to: 'line_webhook#receive'

      # SendGrid Event Webhook（認証不要）
      post 'sendgrid/webhook', to: 'sendgrid_webhook#receive'

      # トラッキングリダイレクト（認証不要）
      get 't/:token', to: 'tracking#redirect', as: :tracking_redirect

      # 顧客向け公開API（認証不要）
      get 'customer/:access_token', to: 'customer_accesses#show_public'
      post 'customer/:access_token/verify_access', to: 'customer_accesses#verify_access'
      post 'customer/:access_token/track_view', to: 'customer_accesses#track_view'

      # 顧客向け画像シミュレーションAPI（認証不要）
      get 'customer/:access_token/image_simulations/quota', to: 'customer_image_simulations#quota'
      get 'customer/:access_token/image_simulations', to: 'customer_image_simulations#index'
      post 'customer/:access_token/image_simulations', to: 'customer_image_simulations#create'
      post 'customer/:access_token/image_simulations/:id/save', to: 'customer_image_simulations#save'
      delete 'customer/:access_token/image_simulations/:id/save', to: 'customer_image_simulations#unsave'

      # 顧客向けGrounding API（認証不要・トークン認証）
      post 'customer/:access_token/grounding', to: 'customer_groundings#create'

      # 顧客専用経路
      get 'customer/:access_token/routes', to: 'customer_accesses#customer_routes'
      post 'customer/:access_token/routes/preview', to: 'customer_accesses#preview_customer_route'
      post 'customer/:access_token/routes', to: 'customer_accesses#create_customer_route'
      delete 'customer/:access_token/routes/:route_id', to: 'customer_accesses#destroy_customer_route'
      post 'customer/:access_token/routes/:route_id/recalculate', to: 'customer_accesses#recalculate_customer_route'
      get 'customer/:access_token/routes/:route_id/streetview_points', to: 'customer_accesses#customer_route_streetview_points'

      # プレゼンアクセス管理（物件公開ページ単位）
      resources :property_publications, only: [] do
        resources :presentation_accesses, only: [:index, :create]
      end

      # プレゼンアクセス詳細操作
      resources :presentation_accesses, only: [:show, :update, :destroy] do
        member do
          post :revoke
          post :set_password
          post :remove_password
        end
      end

      # プレゼン公開API（認証不要）
      get 'present/:access_token', to: 'presentation_accesses#show_public'
      post 'present/:access_token/verify_access', to: 'presentation_accesses#verify_access'
      post 'present/:access_token/track_view', to: 'presentation_accesses#track_view'
      post 'present/:access_token/track_step', to: 'presentation_accesses#track_step'

      # ブログ記事API（認証不要）
      resources :blog_posts, only: [:index] do
        collection do
          get :recent
        end
      end
      get 'blog_posts/:public_id/public', to: 'blog_posts#show_public', as: :public_blog_post
    end
  end

  # React Router用のキャッチオールルート
  # /vr/:id は React Router で処理されるため、ここでは定義しない
  # /rails/ は Rails 内部ルート（Action Mailbox Conductor 等）のため除外
  get '*path', to: 'pages#index', constraints: ->(request) do
    !request.xhr? && request.format.html? && !request.path.start_with?('/rails/')
  end
end
