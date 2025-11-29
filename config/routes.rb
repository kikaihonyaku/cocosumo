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

  # API routes
  namespace :api do
    namespace :v1 do
      # 認証関連
      get 'auth/me', to: 'auth#me'
      post 'auth/login', to: 'auth#login'
      post 'auth/logout', to: 'auth#logout'

      # Gemini AI
      post 'gemini/process_image', to: 'gemini#process_image'

      # Imagen AI (image editing)
      post 'imagen/edit_image', to: 'imagen#edit_image'

      # 物件管理
      resources :buildings do
        resources :photos, only: [:index, :create, :destroy, :show, :update], controller: 'building_photos' do
          member do
            post :replace
            post :duplicate
            get :proxy
          end
        end
        resources :owners
        resources :rooms, only: [:index, :create]

        # 物件個別アクション
        member do
          post :restore    # 論理削除からの復元
          post :grounding  # Grounding with Google Maps
        end
      end

      # 削除済み物件一覧
      get 'buildings_archived', to: 'buildings#archived'

      # 学区情報
      resources :school_districts, only: [:index, :show] do
        collection do
          get :stats
        end
      end

      # 管理者用API
      namespace :admin do
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
        # 部屋写真管理
        resources :room_photos do
          member do
            post :replace
            post :duplicate
            get :proxy
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

      # バーチャルステージング一覧
      resources :virtual_stagings, only: [:index]

      # 公開バーチャルステージング表示用（認証不要、public_idで取得）
      get 'virtual_stagings/:public_id/public', to: 'virtual_stagings#show_public', as: :public_virtual_staging

      # 物件公開ページ一覧
      resources :property_publications, only: [:index]

      # 公開物件詳細表示用（認証不要、publication_idで取得）
      get 'property_publications/:publication_id/public', to: 'property_publications#show_public'

      # 問い合わせAPI（認証不要）
      resources :property_publications, only: [], param: :publication_id do
        resources :inquiries, only: [:create, :index], controller: 'property_inquiries'
      end
    end
  end

  # React Router用のキャッチオールルート
  # /vr/:id は React Router で処理されるため、ここでは定義しない
  get '*path', to: 'pages#index', constraints: ->(request) do
    !request.xhr? && request.format.html?
  end
end
