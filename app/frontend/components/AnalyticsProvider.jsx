import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initializeGA, trackPageView } from '../services/analytics';

/**
 * Analytics Provider Component
 * - Initializes GA4 on mount
 * - Tracks page views on route changes
 */
export default function AnalyticsProvider({ children }) {
  const location = useLocation();

  // Initialize GA4 on mount
  useEffect(() => {
    initializeGA();
  }, []);

  // Track page views on route change
  useEffect(() => {
    // Small delay to ensure page title is updated
    const timeout = setTimeout(() => {
      trackPageView(location.pathname + location.search, document.title);
    }, 100);

    return () => clearTimeout(timeout);
  }, [location]);

  return children;
}
