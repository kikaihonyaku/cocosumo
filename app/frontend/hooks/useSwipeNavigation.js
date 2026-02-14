import { useEffect, useRef } from 'react';

const EDGE_ZONE = 0.15; // 画面端15%
const MIN_SWIPE_DISTANCE = 50; // px
const MAX_SWIPE_TIME = 300; // ms

/**
 * 画面端スワイプでシーン前後移動を検出するフック
 * PSVのパノラマ操作と競合しないよう、画面端15%ゾーンから始まるクイックスワイプのみ検出
 *
 * @param {Object} options
 * @param {Function} options.onSwipeLeft - 左スワイプ（次のシーン）
 * @param {Function} options.onSwipeRight - 右スワイプ（前のシーン）
 * @param {boolean} options.enabled - 有効/無効
 */
export default function useSwipeNavigation({ onSwipeLeft, onSwipeRight, enabled = true }) {
  const touchStartRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e) => {
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      const screenWidth = window.innerWidth;
      const x = touch.clientX;

      // 画面端15%のゾーン内でのみ検出開始
      const isLeftEdge = x < screenWidth * EDGE_ZONE;
      const isRightEdge = x > screenWidth * (1 - EDGE_ZONE);

      if (isLeftEdge || isRightEdge) {
        touchStartRef.current = {
          x,
          y: touch.clientY,
          time: Date.now(),
          edge: isLeftEdge ? 'left' : 'right',
        };
      } else {
        touchStartRef.current = null;
      }
    };

    const handleTouchEnd = (e) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const dt = Date.now() - touchStartRef.current.time;

      touchStartRef.current = null;

      // クイックスワイプ判定（時間内 & 横移動が十分 & 縦移動が横移動より少ない）
      if (dt > MAX_SWIPE_TIME) return;
      if (Math.abs(dx) < MIN_SWIPE_DISTANCE) return;
      if (Math.abs(dy) > Math.abs(dx)) return;

      if (dx < 0) {
        onSwipeLeft?.();
      } else {
        onSwipeRight?.();
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, onSwipeLeft, onSwipeRight]);
}
