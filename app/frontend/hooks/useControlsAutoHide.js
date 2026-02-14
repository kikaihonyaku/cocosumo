import { useState, useRef, useCallback, useEffect } from 'react';

const AUTO_HIDE_DELAY = 3000;

/**
 * コントロールの自動非表示を管理するフック
 * @param {Object} options
 * @param {boolean} options.preventHide - trueの間は非表示にしない（設定パネルやドロワーが開いている時）
 * @returns {{ controlsVisible: boolean, showControls: () => void, containerHandlers: Object }}
 */
export default function useControlsAutoHide({ preventHide = false } = {}) {
  const [controlsVisible, setControlsVisible] = useState(true);
  const timerRef = useRef(null);
  const preventHideRef = useRef(preventHide);
  preventHideRef.current = preventHide;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    if (preventHideRef.current) return;
    timerRef.current = setTimeout(() => {
      if (!preventHideRef.current) {
        setControlsVisible(false);
      }
    }, AUTO_HIDE_DELAY);
  }, [clearTimer]);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    startTimer();
  }, [startTimer]);

  // preventHideが変わったときの処理
  useEffect(() => {
    if (preventHide) {
      clearTimer();
      setControlsVisible(true);
    } else {
      startTimer();
    }
  }, [preventHide, clearTimer, startTimer]);

  // 初回マウント時にタイマー開始
  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer, clearTimer]);

  const containerHandlers = {
    onMouseMove: showControls,
    onTouchStart: showControls,
    onClick: showControls,
  };

  return { controlsVisible, showControls, containerHandlers };
}
