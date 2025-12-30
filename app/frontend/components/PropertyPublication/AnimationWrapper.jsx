import React from 'react';
import { Box } from '@mui/material';
import { useScrollReveal, useStaggeredReveal } from '../../hooks/useScrollReveal';

/**
 * Animation wrapper component for scroll-reveal effects
 */
export function FadeInSection({
  children,
  direction = 'up', // up, down, left, right, none
  delay = 0,
  duration = 0.4,
  threshold = 0.1,
  ...props
}) {
  const { ref, isVisible } = useScrollReveal({ threshold });

  const getTransform = () => {
    if (!isVisible) {
      switch (direction) {
        case 'up': return 'translateY(30px)';
        case 'down': return 'translateY(-30px)';
        case 'left': return 'translateX(-30px)';
        case 'right': return 'translateX(30px)';
        default: return 'none';
      }
    }
    return 'none';
  };

  return (
    <Box
      ref={ref}
      sx={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transition: `opacity ${duration}s ease-out ${delay}s, transform ${duration}s ease-out ${delay}s`,
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Box>
  );
}

/**
 * Scale-in animation wrapper
 */
export function ScaleInSection({
  children,
  delay = 0,
  duration = 0.3,
  threshold = 0.1,
  ...props
}) {
  const { ref, isVisible } = useScrollReveal({ threshold });

  return (
    <Box
      ref={ref}
      sx={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.95)',
        transition: `opacity ${duration}s ease-out ${delay}s, transform ${duration}s ease-out ${delay}s`,
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Box>
  );
}

/**
 * Staggered list animation container
 */
export function StaggeredList({
  children,
  staggerDelay = 100,
  ...props
}) {
  const childArray = React.Children.toArray(children);
  const { containerRef, getItemProps } = useStaggeredReveal(
    childArray.length,
    staggerDelay
  );

  return (
    <Box ref={containerRef} {...props}>
      {childArray.map((child, index) => (
        <Box key={index} {...getItemProps(index)}>
          {child}
        </Box>
      ))}
    </Box>
  );
}

/**
 * Hover effect wrapper with lift animation
 */
export function HoverLift({
  children,
  liftAmount = 4,
  shadowIntensity = 0.12,
  ...props
}) {
  return (
    <Box
      sx={{
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: `translateY(-${liftAmount}px)`,
          boxShadow: `0 ${liftAmount * 2}px ${liftAmount * 6}px rgba(0, 0, 0, ${shadowIntensity})`
        },
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Box>
  );
}

/**
 * Pulse animation wrapper for attention-grabbing elements
 */
export function PulseEffect({
  children,
  active = true,
  intensity = 1.05,
  ...props
}) {
  return (
    <Box
      sx={{
        animation: active ? `pulse 2s ease-in-out infinite` : 'none',
        '@keyframes pulse': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: `scale(${intensity})` },
          '100%': { transform: 'scale(1)' }
        },
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Box>
  );
}

/**
 * Shimmer loading effect
 */
export function ShimmerEffect({
  width = '100%',
  height = 20,
  borderRadius = 4,
  ...props
}) {
  return (
    <Box
      sx={{
        width,
        height,
        borderRadius: `${borderRadius}px`,
        background: 'linear-gradient(90deg, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        '@keyframes shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        ...props.sx
      }}
      {...props}
    />
  );
}

/**
 * Fade transition for content changes
 */
export function FadeTransition({
  children,
  show = true,
  duration = 0.3,
  ...props
}) {
  return (
    <Box
      sx={{
        opacity: show ? 1 : 0,
        transition: `opacity ${duration}s ease-in-out`,
        visibility: show ? 'visible' : 'hidden',
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Box>
  );
}

/**
 * Slide transition for panels
 */
export function SlideTransition({
  children,
  show = true,
  direction = 'left', // left, right, up, down
  distance = 100,
  duration = 0.3,
  ...props
}) {
  const getTransform = () => {
    if (show) return 'translate(0, 0)';
    switch (direction) {
      case 'left': return `translateX(-${distance}%)`;
      case 'right': return `translateX(${distance}%)`;
      case 'up': return `translateY(-${distance}%)`;
      case 'down': return `translateY(${distance}%)`;
      default: return 'translate(0, 0)';
    }
  };

  return (
    <Box
      sx={{
        transform: getTransform(),
        opacity: show ? 1 : 0,
        transition: `transform ${duration}s ease-in-out, opacity ${duration}s ease-in-out`,
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Box>
  );
}

export default {
  FadeInSection,
  ScaleInSection,
  StaggeredList,
  HoverLift,
  PulseEffect,
  ShimmerEffect,
  FadeTransition,
  SlideTransition
};
