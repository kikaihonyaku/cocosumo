import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { browserNotification } from '../utils/notificationUtils';

const POLLING_INTERVAL = 30000; // 30秒

export default function useUnreadNotifications({ enabled = true } = {}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadInquiries, setUnreadInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const prevCountRef = useRef(0);
  const mountedRef = useRef(true);
  const timerRef = useRef(null);

  // 未読件数を取得（軽量）
  const fetchCount = useCallback(async () => {
    if (!enabled) return;

    try {
      const res = await axios.get('/api/v1/unread_notifications/count');
      if (!mountedRef.current) return;

      const newCount = res.data.unread_count;

      // 新しい未読が検出された場合、ブラウザ通知を発火
      if (newCount > prevCountRef.current && prevCountRef.current >= 0) {
        const diff = newCount - prevCountRef.current;
        if (document.hidden) {
          browserNotification.show('CoCoスモ', {
            body: `${diff}件の新しい問い合わせがあります`,
            tag: 'unread-inquiry'
          });
        }
      }

      prevCountRef.current = newCount;
      setUnreadCount(newCount);
    } catch {
      // ポーリングのエラーは無視（ログアウト後のリクエストなど）
    }
  }, [enabled]);

  // 未読案件の詳細を取得（ドロップダウン用）
  const fetchDetails = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      const res = await axios.get('/api/v1/unread_notifications');
      if (!mountedRef.current) return;

      setUnreadInquiries(res.data.inquiries || []);
      setUnreadCount(res.data.unread_count);
    } catch {
      // エラーは無視
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [enabled]);

  // 特定案件を既読にする
  const markRead = useCallback(async (inquiryId) => {
    try {
      await axios.post('/api/v1/unread_notifications/mark_read', { inquiry_id: inquiryId });
      if (!mountedRef.current) return;

      setUnreadCount((prev) => Math.max(0, prev - 1));
      setUnreadInquiries((prev) => prev.filter((i) => i.id !== inquiryId));
    } catch {
      // エラーは無視
    }
  }, []);

  // 全件既読にする
  const markAllRead = useCallback(async () => {
    try {
      await axios.post('/api/v1/unread_notifications/mark_all_read');
      if (!mountedRef.current) return;

      setUnreadCount(0);
      setUnreadInquiries([]);
    } catch {
      // エラーは無視
    }
  }, []);

  // ポーリング開始
  useEffect(() => {
    mountedRef.current = true;

    if (!enabled) return;

    // 初回取得
    fetchCount();

    // ブラウザ通知の許可をリクエスト
    browserNotification.requestPermission();

    // 定期ポーリング
    timerRef.current = setInterval(fetchCount, POLLING_INTERVAL);

    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [enabled, fetchCount]);

  // タブがアクティブになった時に即座にリフレッシュ
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, fetchCount]);

  return {
    unreadCount,
    unreadInquiries,
    loading,
    fetchCount,
    fetchDetails,
    markRead,
    markAllRead
  };
}
