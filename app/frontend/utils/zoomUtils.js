/**
 * CSS zoom補正ユーティリティ
 *
 * document.body.style.zoom によるページ拡大時、
 * getBoundingClientRect() はビューポート座標（zoom適用済み）を返すが、
 * CSS px 値は zoom 前の座標系で解釈される。
 * この関数で取得した zoom 倍率で除算することで座標を補正する。
 */
export function getZoomFactor() {
  return parseFloat(document.documentElement.style.getPropertyValue('--body-zoom')) || 1;
}
