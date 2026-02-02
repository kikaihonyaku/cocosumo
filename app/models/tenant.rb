class Tenant < ApplicationRecord
  # Associations
  has_many :users, dependent: :destroy
  has_many :buildings, dependent: :destroy
  has_many :stores, dependent: :destroy
  has_many :map_layers, dependent: :destroy
  has_many :customers, dependent: :destroy
  has_many :inquiries, dependent: :destroy
  has_many :admin_audit_logs
  has_many :bulk_import_histories
  has_many :email_templates, dependent: :destroy
  belongs_to :created_by, class_name: "User", optional: true

  # Enums
  enum :status, { active: 0, suspended: 1, deleted: 2 }, default: :active

  # Validations
  validates :name, presence: true
  validates :subdomain, presence: true, uniqueness: true,
            format: { with: /\A[a-z0-9]([a-z0-9-]*[a-z0-9])?\z/,
                      message: "は英小文字、数字、ハイフンのみ使用可能です" }
  validates :subdomain, exclusion: {
    in: %w[www admin api app mail ftp ssh assets],
    message: "は予約されています"
  }

  # Callbacks
  after_create :setup_inquiry_room
  after_create :setup_default_email_templates

  # Scopes
  scope :ordered, -> { order(created_at: :desc) }

  # Serialize settings as JSON
  serialize :settings, coder: JSON

  # Methods
  def suspend!(reason: nil, by_user: nil)
    update!(status: :suspended, suspended_at: Time.current, suspended_reason: reason)
    AdminAuditLog.log_action(by_user, "suspend", self, { reason: reason }) if by_user
  end

  def reactivate!(by_user: nil)
    update!(status: :active, suspended_at: nil, suspended_reason: nil)
    AdminAuditLog.log_action(by_user, "reactivate", self) if by_user
  end

  def statistics
    {
      users_count: users.count,
      buildings_count: buildings.kept.count,
      rooms_count: Room.joins(:building).where(buildings: { tenant_id: id }).count,
      stores_count: stores.count
    }
  end

  # テンプレートの初期データ定義
  DEFAULT_EMAIL_TEMPLATES = [
    {
      name: "物件ご案内",
      subject: "【{{会社名}}】ご希望に合う物件のご案内",
      body: <<~BODY,
        {{お客様名}} 様

        いつもお世話になっております。{{会社名}}の{{担当者名}}です。

        ご希望の条件に合う物件をご案内いたします。

        ■ 物件情報
        物件名：
        所在地：
        間取り：
        賃料：
        管理費：
        最寄駅：

        詳しい情報や内見のご予約は、お気軽にご連絡ください。

        何卒よろしくお願いいたします。

        {{署名}}
      BODY
      position: 1
    },
    {
      name: "お問い合わせ御礼",
      subject: "【{{会社名}}】お問い合わせいただきありがとうございます",
      body: <<~BODY,
        {{お客様名}} 様

        この度はお問い合わせいただき、誠にありがとうございます。
        {{会社名}}の{{担当者名}}と申します。

        ご連絡いただきました内容を確認のうえ、改めてご回答させていただきます。

        ご不明な点がございましたら、いつでもお気軽にご連絡ください。

        今後ともよろしくお願いいたします。

        {{署名}}
      BODY
      position: 2
    },
    {
      name: "内見日程のご確認",
      subject: "【{{会社名}}】内見日程のご確認",
      body: <<~BODY,
        {{お客様名}} 様

        いつもお世話になっております。{{会社名}}の{{担当者名}}です。

        内見の日程についてご連絡いたします。

        ■ 内見予定
        日時：
        物件名：
        所在地：
        集合場所：
        所要時間：約30分

        ■ 当日のご持参物
        ・本人確認書類（運転免許証等）
        ・筆記用具

        ご都合が悪くなった場合は、お早めにご連絡いただけますと幸いです。

        当日お会いできることを楽しみにしております。

        {{署名}}
      BODY
      position: 3
    },
    {
      name: "お申込み手続きのご案内",
      subject: "【{{会社名}}】お申込み手続きのご案内",
      body: <<~BODY,
        {{お客様名}} 様

        いつもお世話になっております。{{会社名}}の{{担当者名}}です。

        この度は物件のお申込みをいただき、誠にありがとうございます。
        お手続きに必要な書類についてご案内いたします。

        ■ 必要書類
        ・入居申込書（別途お送りいたします）
        ・本人確認書類（運転免許証・パスポート等）のコピー
        ・収入証明書（源泉徴収票・直近の給与明細等）
        ・連帯保証人様の情報

        ■ お手続きの流れ
        1. 上記書類のご提出
        2. 入居審査（通常3〜5営業日）
        3. 契約書類のご案内
        4. 契約金のお支払い
        5. 鍵のお引渡し

        ご不明な点がございましたら、お気軽にお問い合わせください。

        {{署名}}
      BODY
      position: 4
    },
    {
      name: "ご契約ありがとうございます",
      subject: "【{{会社名}}】ご契約いただきありがとうございます",
      body: <<~BODY,
        {{お客様名}} 様

        この度はご契約いただき、誠にありがとうございます。
        {{会社名}}の{{担当者名}}です。

        新生活のスタートにあたり、以下の情報をお知らせいたします。

        ■ ご入居日：
        ■ 鍵のお引渡し：
        ■ ライフラインのお手続き
        ・電気：ご入居日までにお客様にてお申込みください
        ・ガス：開栓立ち会いが必要です
        ・水道：ご入居日までにお客様にてお申込みください
        ・インターネット：物件により異なります

        ご入居後もお困りのことがございましたら、いつでもご連絡ください。

        快適な新生活をお過ごしいただけますよう、スタッフ一同お祈りしております。

        {{署名}}
      BODY
      position: 5
    },
    {
      name: "追加物件のご提案",
      subject: "【{{会社名}}】新着物件のご紹介",
      body: <<~BODY,
        {{お客様名}} 様

        いつもお世話になっております。{{会社名}}の{{担当者名}}です。

        以前ご希望いただいた条件に近い物件が新たに掲載されましたので、ご紹介させていただきます。

        ■ 物件1
        物件名：
        所在地：
        間取り：
        賃料：

        ■ 物件2
        物件名：
        所在地：
        間取り：
        賃料：

        ご興味のある物件がございましたら、詳細資料をお送りいたします。
        内見のご予約も承っておりますので、お気軽にお申し付けください。

        {{署名}}
      BODY
      position: 6
    }
  ].freeze

  private

  # メール問い合わせ用のBuilding/Roomを自動作成
  def setup_inquiry_room
    building = buildings.create!(
      name: "一般問い合わせ",
      address: name,
      building_type: :office
    )

    room = building.rooms.create!(
      room_number: "INQUIRY",
      floor: 1,
      room_type: :other,
      status: :maintenance,
      description: "メール問い合わせ用（システム自動作成）"
    )

    update_columns(
      settings: (settings || {}).merge(
        "default_inquiry_room_id" => room.id
      )
    )
  end

  # デフォルトのメールテンプレートを作成
  def setup_default_email_templates
    DEFAULT_EMAIL_TEMPLATES.each do |template_attrs|
      email_templates.create!(template_attrs)
    end
  end
end
