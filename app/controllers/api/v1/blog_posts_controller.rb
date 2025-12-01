class Api::V1::BlogPostsController < ApplicationController
  skip_before_action :verify_authenticity_token

  # GET /api/v1/blog_posts
  def index
    page = (params[:page] || 1).to_i
    per_page = (params[:per_page] || 12).to_i.clamp(1, 50)

    @blog_posts = BlogPost.published
                          .offset((page - 1) * per_page)
                          .limit(per_page)

    total_count = BlogPost.published.count

    render json: {
      blog_posts: @blog_posts.as_json(
        only: [:id, :public_id, :title, :summary, :thumbnail_url, :published_at],
        methods: [:public_url]
      ),
      pagination: {
        current_page: page,
        per_page: per_page,
        total_count: total_count,
        total_pages: (total_count.to_f / per_page).ceil
      }
    }
  end

  # GET /api/v1/blog_posts/recent
  def recent
    limit = (params[:limit] || 3).to_i.clamp(1, 10)
    @blog_posts = BlogPost.recent(limit)

    render json: @blog_posts.as_json(
      only: [:id, :public_id, :title, :summary, :thumbnail_url, :published_at],
      methods: [:public_url]
    )
  end

  # GET /api/v1/blog_posts/:public_id/public
  def show_public
    @blog_post = BlogPost.published.find_by!(public_id: params[:public_id])

    render json: @blog_post.as_json(
      only: [:id, :public_id, :title, :summary, :content, :thumbnail_url, :published_at, :commit_hash],
      methods: [:public_url]
    )
  rescue ActiveRecord::RecordNotFound
    render json: { error: '記事が見つかりませんでした' }, status: :not_found
  end
end
