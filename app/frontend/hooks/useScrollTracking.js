import { useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

export function useScrollTracking(publicationId, isEnabled = true) {
  const maxScrollDepth = useRef(0);
  const startTime = useRef(Date.now());
  const hasTracked = useRef(false);

  const calculateScrollDepth = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return 100;
    const scrollPercent = Math.round((scrollTop / docHeight) * 100);
    return Math.min(scrollPercent, 100);
  }, []);

  const sendAnalytics = useCallback(async () => {
    if (!publicationId || hasTracked.current || !isEnabled) return;

    const sessionDuration = Math.round((Date.now() - startTime.current) / 1000);

    // Only send if user spent more than 2 seconds
    if (sessionDuration < 2) return;

    hasTracked.current = true;

    try {
      await axios.post(`/api/v1/property_publications/${publicationId}/track_analytics`, {
        scroll_depth: maxScrollDepth.current,
        session_duration: sessionDuration
      });
    } catch (error) {
      // Silent fail - don't disrupt user experience
      console.log('Analytics tracking skipped');
    }
  }, [publicationId, isEnabled]);

  useEffect(() => {
    if (!isEnabled) return;

    const handleScroll = () => {
      const currentDepth = calculateScrollDepth();
      if (currentDepth > maxScrollDepth.current) {
        maxScrollDepth.current = currentDepth;
      }
    };

    // Track on page leave
    const handleBeforeUnload = () => {
      sendAnalytics();
    };

    // Track on visibility change (tab switch, minimize)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendAnalytics();
      }
    };

    // Reset tracking state
    maxScrollDepth.current = 0;
    startTime.current = Date.now();
    hasTracked.current = false;

    // Initial scroll position check
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Send analytics on unmount
      sendAnalytics();
    };
  }, [publicationId, isEnabled, calculateScrollDepth, sendAnalytics]);

  return {
    getScrollDepth: () => maxScrollDepth.current,
    getSessionDuration: () => Math.round((Date.now() - startTime.current) / 1000)
  };
}

export default useScrollTracking;
