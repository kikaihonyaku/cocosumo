import { useEffect, useRef, useState, useCallback } from 'react';
import { getZoomFactor } from '../utils/zoomUtils';

/**
 * Hook for scroll-reveal animations using Intersection Observer
 * @param {object} options - Intersection Observer options
 * @returns {object} { ref, isVisible }
 */
export function useScrollReveal(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
    triggerOnce: true, // Only trigger animation once
    ...options
  };

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (defaultOptions.triggerOnce) {
            observer.disconnect();
          }
        } else if (!defaultOptions.triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold: defaultOptions.threshold,
        rootMargin: defaultOptions.rootMargin
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [defaultOptions.threshold, defaultOptions.rootMargin, defaultOptions.triggerOnce]);

  return { ref, isVisible };
}

/**
 * Hook for staggered reveal animations on multiple elements
 * @param {number} itemCount - Number of items to animate
 * @param {number} staggerDelay - Delay between each item in ms
 * @returns {object} { containerRef, getItemProps }
 */
export function useStaggeredReveal(itemCount, staggerDelay = 100) {
  const containerRef = useRef(null);
  const [visibleItems, setVisibleItems] = useState([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      setVisibleItems(Array.from({ length: itemCount }, (_, i) => i));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Stagger the visibility of items
          for (let i = 0; i < itemCount; i++) {
            setTimeout(() => {
              setVisibleItems((prev) => [...prev, i]);
            }, i * staggerDelay);
          }
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, [itemCount, staggerDelay]);

  const getItemProps = useCallback(
    (index) => ({
      style: {
        opacity: visibleItems.includes(index) ? 1 : 0,
        transform: visibleItems.includes(index)
          ? 'translateY(0)'
          : 'translateY(20px)',
        transition: `opacity 0.4s ease-out, transform 0.4s ease-out`
      }
    }),
    [visibleItems]
  );

  return { containerRef, getItemProps, visibleItems };
}

/**
 * Hook for scroll-based progress indicator
 * @param {RefObject} targetRef - Reference to the element to track
 * @returns {number} Progress from 0 to 1
 */
export function useScrollProgress(targetRef) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!targetRef?.current) {
        // Track overall page scroll
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(Math.min(scrollTop / docHeight, 1));
      } else {
        // Track specific element
        const element = targetRef.current;
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top;
        const elementHeight = rect.height;
        const viewportHeight = window.innerHeight;

        // Calculate progress from entering to leaving viewport
        const start = viewportHeight;
        const end = -elementHeight;
        const current = elementTop;
        const progressValue = 1 - (current - end) / (start - end);

        setProgress(Math.max(0, Math.min(1, progressValue)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => window.removeEventListener('scroll', handleScroll);
  }, [targetRef]);

  return progress;
}

/**
 * Hook for smooth scroll to element
 * @returns {function} scrollTo function
 */
export function useSmoothScroll() {
  const scrollTo = useCallback((elementId, offset = 0) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const top = element.getBoundingClientRect().top / getZoomFactor() + window.scrollY - offset;

    window.scrollTo({
      top,
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
  }, []);

  return scrollTo;
}

export default {
  useScrollReveal,
  useStaggeredReveal,
  useScrollProgress,
  useSmoothScroll
};
