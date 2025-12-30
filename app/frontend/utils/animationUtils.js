/**
 * Animation Utilities
 * Easing functions, timing calculations, and animation helpers
 */

/**
 * Easing functions
 * t: current time (0-1)
 * returns: eased value (0-1)
 */
export const easings = {
  // Linear
  linear: (t) => t,

  // Quadratic
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  // Cubic
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => (--t) * t * t + 1,
  easeInOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  // Quartic
  easeInQuart: (t) => t * t * t * t,
  easeOutQuart: (t) => 1 - (--t) * t * t * t,
  easeInOutQuart: (t) =>
    t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,

  // Quintic
  easeInQuint: (t) => t * t * t * t * t,
  easeOutQuint: (t) => 1 + (--t) * t * t * t * t,
  easeInOutQuint: (t) =>
    t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,

  // Sinusoidal
  easeInSine: (t) => 1 - Math.cos((t * Math.PI) / 2),
  easeOutSine: (t) => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,

  // Exponential
  easeInExpo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  easeOutExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInOutExpo: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
    return (2 - Math.pow(2, -20 * t + 10)) / 2;
  },

  // Circular
  easeInCirc: (t) => 1 - Math.sqrt(1 - t * t),
  easeOutCirc: (t) => Math.sqrt(1 - (--t) * t),
  easeInOutCirc: (t) =>
    t < 0.5
      ? (1 - Math.sqrt(1 - 4 * t * t)) / 2
      : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,

  // Back (overshoot)
  easeInBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  easeOutBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInOutBack: (t) => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },

  // Elastic
  easeInElastic: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * ((2 * Math.PI) / 3));
  },
  easeOutElastic: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  },
  easeInOutElastic: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const c5 = (2 * Math.PI) / 4.5;
    return t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  },

  // Bounce
  easeInBounce: (t) => 1 - easings.easeOutBounce(1 - t),
  easeOutBounce: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  easeInOutBounce: (t) =>
    t < 0.5
      ? (1 - easings.easeOutBounce(1 - 2 * t)) / 2
      : (1 + easings.easeOutBounce(2 * t - 1)) / 2
};

/**
 * Interpolate between two values
 */
export function interpolate(from, to, progress, easing = 'linear') {
  const easingFn = typeof easing === 'function' ? easing : easings[easing] || easings.linear;
  const easedProgress = easingFn(Math.max(0, Math.min(1, progress)));
  return from + (to - from) * easedProgress;
}

/**
 * Interpolate between colors (hex)
 */
export function interpolateColor(fromColor, toColor, progress, easing = 'linear') {
  const parseHex = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [0, 0, 0];
  };

  const from = parseHex(fromColor);
  const to = parseHex(toColor);

  const r = Math.round(interpolate(from[0], to[0], progress, easing));
  const g = Math.round(interpolate(from[1], to[1], progress, easing));
  const b = Math.round(interpolate(from[2], to[2], progress, easing));

  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Create spring animation configuration
 */
export function createSpring(options = {}) {
  const {
    stiffness = 100,
    damping = 10,
    mass = 1,
    velocity = 0
  } = options;

  return {
    type: 'spring',
    stiffness,
    damping,
    mass,
    velocity
  };
}

/**
 * Calculate spring physics
 */
export function calculateSpring(current, target, velocity, config) {
  const { stiffness = 100, damping = 10, mass = 1 } = config;

  const springForce = -stiffness * (current - target);
  const dampingForce = -damping * velocity;
  const acceleration = (springForce + dampingForce) / mass;

  const newVelocity = velocity + acceleration * 0.016; // 60fps
  const newPosition = current + newVelocity * 0.016;

  return {
    position: newPosition,
    velocity: newVelocity,
    isAtRest: Math.abs(newVelocity) < 0.01 && Math.abs(newPosition - target) < 0.01
  };
}

/**
 * Calculate animation duration based on distance
 */
export function calculateDuration(distance, speed = 1, minDuration = 200, maxDuration = 1000) {
  const baseDuration = Math.abs(distance) * 2;
  const adjusted = baseDuration / speed;
  return Math.max(minDuration, Math.min(maxDuration, adjusted));
}

/**
 * Create animation sequence
 */
export function createSequence(animations) {
  let currentIndex = 0;
  let startTime = null;

  return {
    start: (onUpdate, onComplete) => {
      const runAnimation = (timestamp) => {
        if (!startTime) startTime = timestamp;

        const anim = animations[currentIndex];
        const elapsed = timestamp - startTime;
        const progress = Math.min(1, elapsed / anim.duration);

        const easedValue = interpolate(
          anim.from,
          anim.to,
          progress,
          anim.easing || 'easeOutCubic'
        );

        onUpdate(easedValue, currentIndex, progress);

        if (progress < 1) {
          requestAnimationFrame(runAnimation);
        } else {
          currentIndex++;
          startTime = null;

          if (currentIndex < animations.length) {
            requestAnimationFrame(runAnimation);
          } else {
            onComplete?.();
          }
        }
      };

      requestAnimationFrame(runAnimation);
    },

    reset: () => {
      currentIndex = 0;
      startTime = null;
    }
  };
}

/**
 * Stagger delay calculator
 */
export function staggerDelay(index, options = {}) {
  const {
    delay = 50,
    maxDelay = 500,
    easing = 'linear'
  } = options;

  const calculatedDelay = index * delay;
  const easingFn = easings[easing] || easings.linear;

  if (maxDelay && calculatedDelay > maxDelay) {
    return maxDelay;
  }

  return calculatedDelay;
}

/**
 * Create staggered animation config for array
 */
export function createStagger(items, options = {}) {
  const { delay = 50, duration = 300, easing = 'easeOutCubic' } = options;

  return items.map((item, index) => ({
    ...item,
    delay: staggerDelay(index, { delay }),
    duration,
    easing
  }));
}

/**
 * Keyframe animation builder
 */
export function buildKeyframes(keyframes) {
  const sortedKeyframes = [...keyframes].sort((a, b) => a.offset - b.offset);

  return (progress) => {
    // Find surrounding keyframes
    let fromKeyframe = sortedKeyframes[0];
    let toKeyframe = sortedKeyframes[sortedKeyframes.length - 1];

    for (let i = 0; i < sortedKeyframes.length - 1; i++) {
      if (progress >= sortedKeyframes[i].offset && progress <= sortedKeyframes[i + 1].offset) {
        fromKeyframe = sortedKeyframes[i];
        toKeyframe = sortedKeyframes[i + 1];
        break;
      }
    }

    // Calculate local progress
    const range = toKeyframe.offset - fromKeyframe.offset;
    const localProgress = range > 0 ? (progress - fromKeyframe.offset) / range : 1;

    // Interpolate values
    const result = {};
    for (const key of Object.keys(toKeyframe)) {
      if (key === 'offset' || key === 'easing') continue;

      const fromValue = fromKeyframe[key] ?? toKeyframe[key];
      const toValue = toKeyframe[key];

      if (typeof fromValue === 'number' && typeof toValue === 'number') {
        result[key] = interpolate(fromValue, toValue, localProgress, toKeyframe.easing);
      } else {
        result[key] = localProgress < 0.5 ? fromValue : toValue;
      }
    }

    return result;
  };
}

/**
 * Animation presets
 */
export const presets = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    duration: 300,
    easing: 'easeOutCubic'
  },

  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
    duration: 300,
    easing: 'easeInCubic'
  },

  slideInUp: {
    from: { opacity: 0, y: 20 },
    to: { opacity: 1, y: 0 },
    duration: 400,
    easing: 'easeOutCubic'
  },

  slideInDown: {
    from: { opacity: 0, y: -20 },
    to: { opacity: 1, y: 0 },
    duration: 400,
    easing: 'easeOutCubic'
  },

  slideInLeft: {
    from: { opacity: 0, x: -20 },
    to: { opacity: 1, x: 0 },
    duration: 400,
    easing: 'easeOutCubic'
  },

  slideInRight: {
    from: { opacity: 0, x: 20 },
    to: { opacity: 1, x: 0 },
    duration: 400,
    easing: 'easeOutCubic'
  },

  scaleIn: {
    from: { opacity: 0, scale: 0.9 },
    to: { opacity: 1, scale: 1 },
    duration: 300,
    easing: 'easeOutBack'
  },

  scaleOut: {
    from: { opacity: 1, scale: 1 },
    to: { opacity: 0, scale: 0.9 },
    duration: 300,
    easing: 'easeInBack'
  },

  bounce: {
    keyframes: [
      { offset: 0, y: 0 },
      { offset: 0.5, y: -20, easing: 'easeOutQuad' },
      { offset: 1, y: 0, easing: 'easeInQuad' }
    ],
    duration: 500
  },

  pulse: {
    keyframes: [
      { offset: 0, scale: 1 },
      { offset: 0.5, scale: 1.05 },
      { offset: 1, scale: 1 }
    ],
    duration: 400,
    easing: 'easeInOutQuad'
  },

  shake: {
    keyframes: [
      { offset: 0, x: 0 },
      { offset: 0.2, x: -10 },
      { offset: 0.4, x: 10 },
      { offset: 0.6, x: -10 },
      { offset: 0.8, x: 10 },
      { offset: 1, x: 0 }
    ],
    duration: 500
  }
};

/**
 * RAF-based animation runner
 */
export function animate(options) {
  const {
    from,
    to,
    duration = 300,
    easing = 'easeOutCubic',
    onUpdate,
    onComplete
  } = options;

  let startTime = null;
  let animationId = null;

  const tick = (timestamp) => {
    if (!startTime) startTime = timestamp;

    const elapsed = timestamp - startTime;
    const progress = Math.min(1, elapsed / duration);
    const value = interpolate(from, to, progress, easing);

    onUpdate(value, progress);

    if (progress < 1) {
      animationId = requestAnimationFrame(tick);
    } else {
      onComplete?.();
    }
  };

  animationId = requestAnimationFrame(tick);

  return {
    cancel: () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    }
  };
}

export default {
  easings,
  interpolate,
  interpolateColor,
  createSpring,
  calculateSpring,
  calculateDuration,
  createSequence,
  staggerDelay,
  createStagger,
  buildKeyframes,
  presets,
  animate
};
