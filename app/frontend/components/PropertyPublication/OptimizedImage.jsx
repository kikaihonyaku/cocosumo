import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Skeleton } from '@mui/material';
import { BrokenImage as BrokenImageIcon } from '@mui/icons-material';

/**
 * OptimizedImage Component
 * - Lazy loading with Intersection Observer
 * - Placeholder skeleton while loading
 * - Error state with fallback
 * - Preload support for next images
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  objectFit = 'cover',
  borderRadius = 0,
  priority = false, // If true, load immediately without lazy loading
  preloadSrc = null, // URL of the next image to preload
  onLoad,
  onError,
  sx = {},
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px', // Start loading 100px before entering viewport
        threshold: 0.01
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // Preload next image
  useEffect(() => {
    if (preloadSrc && isLoaded) {
      const preloadImage = new Image();
      preloadImage.src = preloadSrc;
    }
  }, [preloadSrc, isLoaded]);

  const handleLoad = useCallback((e) => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.(e);
  }, [onLoad]);

  const handleError = useCallback((e) => {
    setHasError(true);
    setIsLoaded(true);
    onError?.(e);
  }, [onError]);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: width || '100%',
        height: height || 'auto',
        overflow: 'hidden',
        borderRadius,
        bgcolor: 'grey.100',
        ...sx
      }}
      {...props}
    >
      {/* Skeleton placeholder */}
      {!isLoaded && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation="wave"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1
          }}
        />
      )}

      {/* Error state */}
      {hasError && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'grey.200',
            color: 'grey.500',
            zIndex: 2
          }}
        >
          <BrokenImageIcon sx={{ fontSize: 48 }} />
        </Box>
      )}

      {/* Actual image */}
      {isInView && src && !hasError && (
        <Box
          component="img"
          ref={imgRef}
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={handleLoad}
          onError={handleError}
          sx={{
            width: '100%',
            height: '100%',
            objectFit,
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            display: 'block'
          }}
        />
      )}
    </Box>
  );
}

/**
 * Hook for preloading images
 * @param {string[]} urls - Array of image URLs to preload
 */
export function useImagePreload(urls) {
  const [loadedCount, setLoadedCount] = useState(0);
  const [failedUrls, setFailedUrls] = useState([]);

  useEffect(() => {
    if (!urls || urls.length === 0) return;

    let mounted = true;
    const preloadedImages = [];

    urls.forEach((url) => {
      if (!url) return;

      const img = new Image();
      preloadedImages.push(img);

      img.onload = () => {
        if (mounted) {
          setLoadedCount((prev) => prev + 1);
        }
      };

      img.onerror = () => {
        if (mounted) {
          setFailedUrls((prev) => [...prev, url]);
          setLoadedCount((prev) => prev + 1);
        }
      };

      img.src = url;
    });

    return () => {
      mounted = false;
      // Cancel any pending loads
      preloadedImages.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [urls]);

  return {
    loadedCount,
    totalCount: urls?.length || 0,
    isComplete: loadedCount === (urls?.length || 0),
    progress: urls?.length ? (loadedCount / urls.length) * 100 : 100,
    failedUrls
  };
}

/**
 * Progressive image loading component
 * Shows a blurred low-res version first, then loads the full image
 */
export function ProgressiveImage({
  src,
  placeholderSrc, // Low-res or blurred placeholder
  alt,
  width,
  height,
  objectFit = 'cover',
  borderRadius = 0,
  sx = {},
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(!!placeholderSrc);

  const handleLoad = () => {
    setIsLoaded(true);
    // Keep placeholder visible briefly for smooth transition
    setTimeout(() => setShowPlaceholder(false), 300);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: width || '100%',
        height: height || 'auto',
        overflow: 'hidden',
        borderRadius,
        ...sx
      }}
      {...props}
    >
      {/* Placeholder image (low-res/blurred) */}
      {showPlaceholder && placeholderSrc && (
        <Box
          component="img"
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit,
            filter: 'blur(10px)',
            transform: 'scale(1.1)', // Prevent blur edges
            opacity: isLoaded ? 0 : 1,
            transition: 'opacity 0.3s ease-in-out',
            zIndex: 1
          }}
        />
      )}

      {/* Full resolution image */}
      <Box
        component="img"
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={handleLoad}
        sx={{
          width: '100%',
          height: '100%',
          objectFit,
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
    </Box>
  );
}
