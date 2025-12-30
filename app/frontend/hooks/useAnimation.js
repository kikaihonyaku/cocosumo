/**
 * Animation Hooks
 * React hooks for animations and transitions
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  easings,
  interpolate,
  calculateSpring,
  createSpring,
  animate,
  staggerDelay
} from '../utils/animationUtils';

/**
 * Basic animation value hook
 */
export function useAnimatedValue(initialValue = 0, options = {}) {
  const { duration = 300, easing = 'easeOutCubic' } = options;

  const [value, setValue] = useState(initialValue);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef(null);
  const currentValueRef = useRef(initialValue);

  // Animate to target value
  const animateTo = useCallback((target, customOptions = {}) => {
    const animDuration = customOptions.duration ?? duration;
    const animEasing = customOptions.easing ?? easing;

    // Cancel previous animation
    animationRef.current?.cancel();

    setIsAnimating(true);

    animationRef.current = animate({
      from: currentValueRef.current,
      to: target,
      duration: animDuration,
      easing: animEasing,
      onUpdate: (val) => {
        currentValueRef.current = val;
        setValue(val);
      },
      onComplete: () => {
        setIsAnimating(false);
        customOptions.onComplete?.();
      }
    });

    return animationRef.current;
  }, [duration, easing]);

  // Set value immediately (no animation)
  const setImmediate = useCallback((newValue) => {
    animationRef.current?.cancel();
    currentValueRef.current = newValue;
    setValue(newValue);
    setIsAnimating(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      animationRef.current?.cancel();
    };
  }, []);

  return {
    value,
    animateTo,
    setImmediate,
    isAnimating
  };
}

/**
 * Spring animation hook
 */
export function useSpring(initialValue = 0, config = {}) {
  const springConfig = useMemo(() => createSpring(config), [config]);

  const [value, setValue] = useState(initialValue);
  const [isAnimating, setIsAnimating] = useState(false);

  const targetRef = useRef(initialValue);
  const velocityRef = useRef(0);
  const frameRef = useRef(null);

  const animate = useCallback(() => {
    const result = calculateSpring(
      value,
      targetRef.current,
      velocityRef.current,
      springConfig
    );

    setValue(result.position);
    velocityRef.current = result.velocity;

    if (!result.isAtRest) {
      frameRef.current = requestAnimationFrame(animate);
    } else {
      setIsAnimating(false);
    }
  }, [value, springConfig]);

  // Set target and start animation
  const setTarget = useCallback((target) => {
    targetRef.current = target;
    setIsAnimating(true);

    if (!frameRef.current) {
      frameRef.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  // Set value immediately
  const setImmediate = useCallback((newValue) => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    targetRef.current = newValue;
    velocityRef.current = 0;
    setValue(newValue);
    setIsAnimating(false);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return {
    value,
    setTarget,
    setImmediate,
    isAnimating
  };
}

/**
 * Transition state hook
 */
export function useTransition(isVisible, options = {}) {
  const {
    duration = 300,
    enterDuration = duration,
    exitDuration = duration,
    enterEasing = 'easeOutCubic',
    exitEasing = 'easeInCubic',
    onEnter,
    onEntered,
    onExit,
    onExited
  } = options;

  const [state, setState] = useState(isVisible ? 'entered' : 'exited');
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setState('entering');
      onEnter?.();

      const timer = setTimeout(() => {
        setState('entered');
        onEntered?.();
      }, enterDuration);

      return () => clearTimeout(timer);
    } else {
      setState('exiting');
      onExit?.();

      const timer = setTimeout(() => {
        setState('exited');
        setShouldRender(false);
        onExited?.();
      }, exitDuration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, enterDuration, exitDuration, onEnter, onEntered, onExit, onExited]);

  return {
    state,
    shouldRender,
    isEntering: state === 'entering',
    isEntered: state === 'entered',
    isExiting: state === 'exiting',
    isExited: state === 'exited'
  };
}

/**
 * Staggered list animation hook
 */
export function useStaggeredList(items, options = {}) {
  const {
    delay = 50,
    duration = 300,
    easing = 'easeOutCubic',
    enabled = true
  } = options;

  const [visibleItems, setVisibleItems] = useState([]);
  const timeoutsRef = useRef([]);

  useEffect(() => {
    // Clear previous timeouts
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    if (!enabled) {
      setVisibleItems(items);
      return;
    }

    setVisibleItems([]);

    items.forEach((item, index) => {
      const timeout = setTimeout(() => {
        setVisibleItems((prev) => [...prev, item]);
      }, staggerDelay(index, { delay }));

      timeoutsRef.current.push(timeout);
    });

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, [items, delay, enabled]);

  const getItemStyle = useCallback((index) => ({
    animationDuration: `${duration}ms`,
    animationTimingFunction: easings[easing] ? `cubic-bezier(0.33, 1, 0.68, 1)` : easing,
    animationDelay: `${staggerDelay(index, { delay })}ms`
  }), [duration, easing, delay]);

  return {
    visibleItems,
    getItemStyle,
    isComplete: visibleItems.length === items.length
  };
}

/**
 * Scroll-linked animation hook
 */
export function useScrollAnimation(options = {}) {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    triggerOnce = true
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;

        if (visible) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }

        // Calculate scroll progress through element
        const rect = entry.boundingClientRect;
        const windowHeight = window.innerHeight;
        const progress = Math.max(0, Math.min(1,
          (windowHeight - rect.top) / (windowHeight + rect.height)
        ));
        setScrollProgress(progress);
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return {
    ref: elementRef,
    isVisible,
    scrollProgress
  };
}

/**
 * Parallax scroll hook
 */
export function useParallax(speed = 0.5) {
  const [offset, setOffset] = useState(0);
  const elementRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elementCenter = rect.top + rect.height / 2;
      const windowCenter = windowHeight / 2;
      const distance = elementCenter - windowCenter;

      setOffset(distance * speed);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return {
    ref: elementRef,
    offset,
    style: {
      transform: `translateY(${offset}px)`
    }
  };
}

/**
 * Mouse-tracking animation hook
 */
export function useMouseTracking(options = {}) {
  const {
    smoothing = 0.1,
    bounds = null // { x: [-50, 50], y: [-50, 50] }
  } = options;

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const targetRef = useRef({ x: 0, y: 0 });
  const elementRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const animate = () => {
      setPosition((prev) => ({
        x: prev.x + (targetRef.current.x - prev.x) * smoothing,
        y: prev.y + (targetRef.current.y - prev.y) * smoothing
      }));

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [smoothing]);

  const handleMouseMove = useCallback((e) => {
    if (!elementRef.current) return;

    const rect = elementRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let x = e.clientX - centerX;
    let y = e.clientY - centerY;

    if (bounds) {
      x = Math.max(bounds.x[0], Math.min(bounds.x[1], x));
      y = Math.max(bounds.y[0], Math.min(bounds.y[1], y));
    }

    targetRef.current = { x, y };
  }, [bounds]);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    targetRef.current = { x: 0, y: 0 };
  }, []);

  return {
    ref: elementRef,
    position,
    isHovering,
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave
    }
  };
}

/**
 * Typewriter effect hook
 */
export function useTypewriter(text, options = {}) {
  const {
    speed = 50,
    delay = 0,
    cursor = true,
    onComplete
  } = options;

  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(cursor);

  useEffect(() => {
    if (!text) return;

    setDisplayText('');
    setIsTyping(true);

    const startTimeout = setTimeout(() => {
      let index = 0;

      const interval = setInterval(() => {
        if (index < text.length) {
          setDisplayText(text.slice(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
          setIsTyping(false);
          onComplete?.();
        }
      }, speed);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [text, speed, delay, onComplete]);

  // Cursor blink
  useEffect(() => {
    if (!cursor) return;

    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, [cursor]);

  return {
    displayText,
    isTyping,
    showCursor: cursor && showCursor,
    cursorChar: showCursor ? '|' : ''
  };
}

/**
 * Counter animation hook
 */
export function useCounter(target, options = {}) {
  const {
    duration = 1000,
    easing = 'easeOutCubic',
    decimals = 0,
    start = 0,
    enabled = true
  } = options;

  const [value, setValue] = useState(start);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }

    setIsAnimating(true);

    const animation = animate({
      from: value,
      to: target,
      duration,
      easing,
      onUpdate: (val) => {
        setValue(Number(val.toFixed(decimals)));
      },
      onComplete: () => {
        setIsAnimating(false);
      }
    });

    return () => animation.cancel();
  }, [target, duration, easing, decimals, enabled]);

  return {
    value,
    isAnimating,
    formattedValue: value.toLocaleString()
  };
}

export default {
  useAnimatedValue,
  useSpring,
  useTransition,
  useStaggeredList,
  useScrollAnimation,
  useParallax,
  useMouseTracking,
  useTypewriter,
  useCounter
};
