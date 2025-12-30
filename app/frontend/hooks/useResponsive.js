/**
 * Responsive Hooks
 * Hooks for responsive design and breakpoint management
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// Default breakpoints (matching MUI)
export const BREAKPOINTS = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536
};

// Device types
export const DEVICE_TYPES = {
  MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop'
};

/**
 * Custom media query hook
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (e) => {
      setMatches(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}

/**
 * Breakpoint hook
 */
export function useBreakpoint(breakpoints = BREAKPOINTS) {
  const [currentBreakpoint, setCurrentBreakpoint] = useState('xs');
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const newWidth = window.innerWidth;
      setWidth(newWidth);

      // Determine current breakpoint
      const sortedBreakpoints = Object.entries(breakpoints)
        .sort(([, a], [, b]) => b - a);

      for (const [name, minWidth] of sortedBreakpoints) {
        if (newWidth >= minWidth) {
          setCurrentBreakpoint(name);
          break;
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoints]);

  // Check if current breakpoint is at least the given breakpoint
  const isUp = useCallback((breakpoint) => {
    return width >= (breakpoints[breakpoint] || 0);
  }, [width, breakpoints]);

  // Check if current breakpoint is at most the given breakpoint
  const isDown = useCallback((breakpoint) => {
    const sortedBreakpoints = Object.entries(breakpoints)
      .sort(([, a], [, b]) => a - b);

    const index = sortedBreakpoints.findIndex(([name]) => name === breakpoint);
    if (index === -1 || index === sortedBreakpoints.length - 1) {
      return true;
    }

    const nextBreakpoint = sortedBreakpoints[index + 1][1];
    return width < nextBreakpoint;
  }, [width, breakpoints]);

  // Check if current breakpoint matches exactly
  const isOnly = useCallback((breakpoint) => {
    return currentBreakpoint === breakpoint;
  }, [currentBreakpoint]);

  // Check if between two breakpoints
  const isBetween = useCallback((start, end) => {
    return width >= (breakpoints[start] || 0) && width < (breakpoints[end] || Infinity);
  }, [width, breakpoints]);

  return {
    breakpoint: currentBreakpoint,
    width,
    isUp,
    isDown,
    isOnly,
    isBetween,
    isXs: currentBreakpoint === 'xs',
    isSm: currentBreakpoint === 'sm',
    isMd: currentBreakpoint === 'md',
    isLg: currentBreakpoint === 'lg',
    isXl: currentBreakpoint === 'xl',
    isSmUp: isUp('sm'),
    isMdUp: isUp('md'),
    isLgUp: isUp('lg'),
    isXlUp: isUp('xl'),
    isSmDown: isDown('sm'),
    isMdDown: isDown('md'),
    isLgDown: isDown('lg')
  };
}

/**
 * Device type hook
 */
export function useDeviceType() {
  const { width } = useBreakpoint();

  const deviceType = useMemo(() => {
    if (width < BREAKPOINTS.sm) return DEVICE_TYPES.MOBILE;
    if (width < BREAKPOINTS.lg) return DEVICE_TYPES.TABLET;
    return DEVICE_TYPES.DESKTOP;
  }, [width]);

  return {
    deviceType,
    isMobile: deviceType === DEVICE_TYPES.MOBILE,
    isTablet: deviceType === DEVICE_TYPES.TABLET,
    isDesktop: deviceType === DEVICE_TYPES.DESKTOP,
    isTouchDevice: deviceType !== DEVICE_TYPES.DESKTOP
  };
}

/**
 * Viewport size hook
 */
export function useViewportSize() {
  const [size, setSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  }));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    ...size,
    aspectRatio: size.width / size.height,
    isPortrait: size.height > size.width,
    isLandscape: size.width > size.height
  };
}

/**
 * Responsive value hook - returns value based on current breakpoint
 */
export function useResponsiveValue(values, defaultValue = null) {
  const { breakpoint, isUp } = useBreakpoint();

  return useMemo(() => {
    if (!values || typeof values !== 'object') {
      return values ?? defaultValue;
    }

    // Check breakpoints from largest to smallest
    const breakpointOrder = ['xl', 'lg', 'md', 'sm', 'xs'];

    for (const bp of breakpointOrder) {
      if (isUp(bp) && values[bp] !== undefined) {
        return values[bp];
      }
    }

    return defaultValue;
  }, [values, defaultValue, breakpoint, isUp]);
}

/**
 * Orientation hook
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState(() => {
    if (typeof window === 'undefined') return 'portrait';
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Try screen orientation API first
    if (screen.orientation) {
      const handleChange = () => {
        setOrientation(
          screen.orientation.type.includes('landscape') ? 'landscape' : 'portrait'
        );
      };

      screen.orientation.addEventListener('change', handleChange);
      return () => screen.orientation.removeEventListener('change', handleChange);
    }

    // Fallback to resize
    const handleResize = () => {
      setOrientation(
        window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
      );
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape'
  };
}

/**
 * Touch device detection hook
 */
export function useTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for touch capability
    const hasTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches;

    setIsTouch(hasTouch);

    // Also detect first touch interaction
    const handleTouch = () => {
      setIsTouch(true);
      window.removeEventListener('touchstart', handleTouch);
    };

    window.addEventListener('touchstart', handleTouch, { passive: true });
    return () => window.removeEventListener('touchstart', handleTouch);
  }, []);

  return isTouch;
}

/**
 * Safe area insets hook (for notched devices)
 */
export function useSafeAreaInsets() {
  const [insets, setInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateInsets = () => {
      const computedStyle = getComputedStyle(document.documentElement);

      setInsets({
        top: parseInt(computedStyle.getPropertyValue('--sat') || '0', 10) ||
          parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0', 10),
        right: parseInt(computedStyle.getPropertyValue('--sar') || '0', 10) ||
          parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0', 10),
        bottom: parseInt(computedStyle.getPropertyValue('--sab') || '0', 10) ||
          parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0', 10),
        left: parseInt(computedStyle.getPropertyValue('--sal') || '0', 10) ||
          parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0', 10)
      });
    };

    updateInsets();
    window.addEventListener('resize', updateInsets);
    return () => window.removeEventListener('resize', updateInsets);
  }, []);

  return insets;
}

/**
 * Scroll direction hook
 */
export function useScrollDirection(threshold = 10) {
  const [scrollDirection, setScrollDirection] = useState('none');
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollDirection = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY;

      if (Math.abs(diff) > threshold) {
        setScrollDirection(diff > 0 ? 'down' : 'up');
        lastScrollY = currentScrollY;
      }

      setScrollY(currentScrollY);
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return {
    scrollDirection,
    scrollY,
    isScrollingUp: scrollDirection === 'up',
    isScrollingDown: scrollDirection === 'down',
    isAtTop: scrollY === 0
  };
}

/**
 * Container query hook (element resize)
 */
export function useContainerSize(ref) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;

    // Use ResizeObserver
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}

/**
 * Columns count hook for grid layouts
 */
export function useGridColumns(options = {}) {
  const {
    minWidth = 300,
    gap = 16,
    maxColumns = 4
  } = options;

  const { width } = useViewportSize();

  const columns = useMemo(() => {
    const availableWidth = width - (gap * 2); // Account for container padding
    const possibleColumns = Math.floor((availableWidth + gap) / (minWidth + gap));
    return Math.min(Math.max(1, possibleColumns), maxColumns);
  }, [width, minWidth, gap, maxColumns]);

  return columns;
}

export default {
  useMediaQuery,
  useBreakpoint,
  useDeviceType,
  useViewportSize,
  useResponsiveValue,
  useOrientation,
  useTouchDevice,
  useSafeAreaInsets,
  useScrollDirection,
  useContainerSize,
  useGridColumns,
  BREAKPOINTS,
  DEVICE_TYPES
};
