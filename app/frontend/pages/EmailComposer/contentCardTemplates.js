/**
 * HTMLカードテンプレート生成関数
 * メールエディタに挿入するスタイル付きHTMLカードを生成する
 */

export function buildVrTourCardHtml({ title, public_url, thumbnail_url, building_name, room_number, scenes_count }) {
  const label = [building_name, room_number].filter(Boolean).join(' ');
  const imgHtml = thumbnail_url
    ? `<img src="${thumbnail_url}" alt="${title}" style="width: 100%; border-radius: 4px 4px 0 0; display: block;" />`
    : '';

  return `
<div style="border: 1px solid #ddd; border-radius: 8px; max-width: 480px; margin: 12px 0; font-family: 'Helvetica Neue', Arial, sans-serif; overflow: hidden;">
  ${imgHtml}
  <div style="padding: 12px 16px;">
    <span style="display: inline-block; background: #e3f2fd; color: #1565c0; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; margin-bottom: 8px;">VRツアー</span>
    <h3 style="margin: 4px 0; font-size: 15px; color: #333;">${title}</h3>
    ${label ? `<p style="color: #666; margin: 0 0 4px; font-size: 13px;">${label}</p>` : ''}
    ${scenes_count ? `<p style="color: #999; margin: 0 0 8px; font-size: 12px;">${scenes_count}シーン</p>` : ''}
    <a href="${public_url}" style="display: inline-block; background: #1976d2; color: #fff; text-decoration: none; padding: 8px 20px; border-radius: 6px; font-size: 14px; font-weight: 500;">VRツアーを見る</a>
  </div>
</div>
`.trim();
}

export function buildVirtualStagingCardHtml({ title, public_url, thumbnail_url, building_name, room_number }) {
  const label = [building_name, room_number].filter(Boolean).join(' ');
  const imgHtml = thumbnail_url
    ? `<img src="${thumbnail_url}" alt="${title}" style="width: 100%; border-radius: 4px 4px 0 0; display: block;" />`
    : '';

  return `
<div style="border: 1px solid #ddd; border-radius: 8px; max-width: 480px; margin: 12px 0; font-family: 'Helvetica Neue', Arial, sans-serif; overflow: hidden;">
  ${imgHtml}
  <div style="padding: 12px 16px;">
    <span style="display: inline-block; background: #fce4ec; color: #c62828; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; margin-bottom: 8px;">バーチャルステージング</span>
    <h3 style="margin: 4px 0; font-size: 15px; color: #333;">${title}</h3>
    ${label ? `<p style="color: #666; margin: 0 0 8px; font-size: 13px;">${label}</p>` : ''}
    <a href="${public_url}" style="display: inline-block; background: #c62828; color: #fff; text-decoration: none; padding: 8px 20px; border-radius: 6px; font-size: 14px; font-weight: 500;">ステージングを見る</a>
  </div>
</div>
`.trim();
}

export function buildPublicationCardHtml({ title, public_url, thumbnail_url, building_name, room_number }) {
  const label = [building_name, room_number].filter(Boolean).join(' ');
  const imgHtml = thumbnail_url
    ? `<img src="${thumbnail_url}" alt="${title}" style="width: 100%; border-radius: 4px 4px 0 0; display: block;" />`
    : '';

  return `
<div style="border: 1px solid #ddd; border-radius: 8px; max-width: 480px; margin: 12px 0; font-family: 'Helvetica Neue', Arial, sans-serif; overflow: hidden;">
  ${imgHtml}
  <div style="padding: 12px 16px;">
    <span style="display: inline-block; background: #e8f5e9; color: #2e7d32; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; margin-bottom: 8px;">物件ページ</span>
    <h3 style="margin: 4px 0; font-size: 15px; color: #333;">${title}</h3>
    ${label ? `<p style="color: #666; margin: 0 0 8px; font-size: 13px;">${label}</p>` : ''}
    <a href="${public_url}" style="display: inline-block; background: #2e7d32; color: #fff; text-decoration: none; padding: 8px 20px; border-radius: 6px; font-size: 14px; font-weight: 500;">物件ページを見る</a>
  </div>
</div>
`.trim();
}

export function buildMyPageCardHtml({ public_url, building_name, room_number, title, expires_at }) {
  const label = [building_name, room_number].filter(Boolean).join(' ');

  return `
<div style="border: 1px solid #ddd; border-radius: 8px; max-width: 480px; margin: 12px 0; font-family: 'Helvetica Neue', Arial, sans-serif; overflow: hidden;">
  <div style="padding: 12px 16px;">
    <span style="display: inline-block; background: #fff3e0; color: #e65100; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; margin-bottom: 8px;">マイページ</span>
    <h3 style="margin: 4px 0; font-size: 15px; color: #333;">${title || label || 'マイページ'}</h3>
    ${label && title ? `<p style="color: #666; margin: 0 0 4px; font-size: 13px;">${label}</p>` : ''}
    ${expires_at ? `<p style="color: #999; margin: 0 0 8px; font-size: 12px;">有効期限: ${expires_at}</p>` : ''}
    <a href="${public_url}" style="display: inline-block; background: #e65100; color: #fff; text-decoration: none; padding: 8px 20px; border-radius: 6px; font-size: 14px; font-weight: 500;">マイページを開く</a>
  </div>
</div>
`.trim();
}
