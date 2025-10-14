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

      # 物件管理
      resources :buildings do
        resources :photos, only: [:index, :create, :destroy]
        resources :owners
        resources :rooms, only: [:index, :create]

        # 物件個別アクション
        member do
          post :restore  # 論理削除からの復元
        end
      end

      # 削除済み物件一覧
      get 'buildings_archived', to: 'buildings#archived'

      # 部屋詳細・更新・削除はスタンドアロン
      resources :rooms, only: [:show, :update, :destroy]
    end
  end

  # React Router用のキャッチオールルート
  get '*path', to: 'pages#index', constraints: ->(request) do
    !request.xhr? && request.format.html?
  end
end
