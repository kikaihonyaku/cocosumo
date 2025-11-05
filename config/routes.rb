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

        # 公開VRツアー表示用（認証不要）
        member do
          get :public, to: 'vr_tours#show_public'
        end
      end

      # バーチャルステージング一覧
      resources :virtual_stagings, only: [:index]

      # 公開バーチャルステージング表示用（認証不要）
      resources :virtual_stagings, only: [] do
        member do
          get :public, to: 'virtual_stagings#show_public'
        end
      end
    end
  end

  # React Router用のキャッチオールルート
  # /vr/:id は React Router で処理されるため、ここでは定義しない
  get '*path', to: 'pages#index', constraints: ->(request) do
    !request.xhr? && request.format.html?
  end
end
