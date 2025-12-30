/**
 * Geolocation Hooks
 * User location tracking and geo-related hooks
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  calculateDistance,
  calculateBearing,
  getCompassDirection,
  isPointInRadius
} from '../utils/geoUtils';

/**
 * User geolocation hook
 */
export function useGeolocation(options = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    watchPosition = false
  } = options;

  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWatching, setIsWatching] = useState(false);

  const watchIdRef = useRef(null);

  // Check if geolocation is supported
  const isSupported = useMemo(() => {
    return typeof navigator !== 'undefined' && 'geolocation' in navigator;
  }, []);

  // Success handler
  const handleSuccess = useCallback((pos) => {
    setPosition({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      altitude: pos.coords.altitude,
      altitudeAccuracy: pos.coords.altitudeAccuracy,
      heading: pos.coords.heading,
      speed: pos.coords.speed,
      timestamp: pos.timestamp
    });
    setError(null);
    setIsLoading(false);
  }, []);

  // Error handler
  const handleError = useCallback((err) => {
    let message;
    switch (err.code) {
      case err.PERMISSION_DENIED:
        message = '位置情報の取得が許可されていません';
        break;
      case err.POSITION_UNAVAILABLE:
        message = '位置情報を取得できません';
        break;
      case err.TIMEOUT:
        message = '位置情報の取得がタイムアウトしました';
        break;
      default:
        message = '位置情報の取得に失敗しました';
    }

    setError({ code: err.code, message });
    setIsLoading(false);
  }, []);

  // Get current position
  const getCurrentPosition = useCallback(() => {
    if (!isSupported) {
      setError({ code: 0, message: '位置情報がサポートされていません' });
      return Promise.reject(new Error('Geolocation not supported'));
    }

    setIsLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handleSuccess(pos);
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
        },
        (err) => {
          handleError(err);
          reject(err);
        },
        { enableHighAccuracy, timeout, maximumAge }
      );
    });
  }, [isSupported, enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError]);

  // Start watching position
  const startWatching = useCallback(() => {
    if (!isSupported || watchIdRef.current !== null) return;

    setIsWatching(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      { enableHighAccuracy, timeout, maximumAge }
    );
  }, [isSupported, enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError]);

  // Stop watching position
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsWatching(false);
    }
  }, []);

  // Auto-watch if enabled
  useEffect(() => {
    if (watchPosition && isSupported) {
      startWatching();
    }

    return () => {
      stopWatching();
    };
  }, [watchPosition, isSupported, startWatching, stopWatching]);

  return {
    position,
    error,
    isLoading,
    isWatching,
    isSupported,
    getCurrentPosition,
    startWatching,
    stopWatching
  };
}

/**
 * Distance tracking hook
 */
export function useDistanceFromLocation(targetLocation, options = {}) {
  const { watchPosition = false } = options;

  const { position, ...geoState } = useGeolocation({ watchPosition });

  const distance = useMemo(() => {
    if (!position || !targetLocation) return null;

    return calculateDistance(
      position.lat,
      position.lng,
      targetLocation.lat ?? targetLocation.latitude,
      targetLocation.lng ?? targetLocation.longitude
    );
  }, [position, targetLocation]);

  const bearing = useMemo(() => {
    if (!position || !targetLocation) return null;

    return calculateBearing(
      position.lat,
      position.lng,
      targetLocation.lat ?? targetLocation.latitude,
      targetLocation.lng ?? targetLocation.longitude
    );
  }, [position, targetLocation]);

  const direction = useMemo(() => {
    if (bearing === null) return null;
    return getCompassDirection(bearing);
  }, [bearing]);

  return {
    position,
    distance,
    bearing,
    direction,
    ...geoState
  };
}

/**
 * Geofence hook
 */
export function useGeofence(center, radiusKm, options = {}) {
  const {
    watchPosition = true,
    onEnter,
    onExit
  } = options;

  const { position, ...geoState } = useGeolocation({ watchPosition });

  const [isInside, setIsInside] = useState(null);
  const previousInsideRef = useRef(null);

  // Check if user is inside geofence
  useEffect(() => {
    if (!position || !center) {
      setIsInside(null);
      return;
    }

    const inside = isPointInRadius(position, center, radiusKm);
    setIsInside(inside);

    // Trigger callbacks on state change
    if (previousInsideRef.current !== null) {
      if (inside && !previousInsideRef.current) {
        onEnter?.({ position, center, radiusKm });
      } else if (!inside && previousInsideRef.current) {
        onExit?.({ position, center, radiusKm });
      }
    }

    previousInsideRef.current = inside;
  }, [position, center, radiusKm, onEnter, onExit]);

  const distance = useMemo(() => {
    if (!position || !center) return null;

    return calculateDistance(
      position.lat,
      position.lng,
      center.lat ?? center.latitude,
      center.lng ?? center.longitude
    );
  }, [position, center]);

  return {
    position,
    isInside,
    distance,
    distanceFromEdge: distance !== null ? distance - radiusKm : null,
    ...geoState
  };
}

/**
 * Multiple geofences hook
 */
export function useMultipleGeofences(geofences, options = {}) {
  const { watchPosition = true, onEnter, onExit } = options;

  const { position, ...geoState } = useGeolocation({ watchPosition });

  const [insideGeofences, setInsideGeofences] = useState([]);
  const previousInsideRef = useRef([]);

  useEffect(() => {
    if (!position || !geofences || geofences.length === 0) {
      setInsideGeofences([]);
      return;
    }

    const currentlyInside = geofences.filter((geofence) =>
      isPointInRadius(position, geofence.center, geofence.radiusKm)
    );

    setInsideGeofences(currentlyInside);

    // Check for enters
    currentlyInside.forEach((geofence) => {
      const wasInside = previousInsideRef.current.some(
        (prev) => prev.id === geofence.id
      );
      if (!wasInside) {
        onEnter?.(geofence, position);
      }
    });

    // Check for exits
    previousInsideRef.current.forEach((prevGeofence) => {
      const stillInside = currentlyInside.some(
        (current) => current.id === prevGeofence.id
      );
      if (!stillInside) {
        onExit?.(prevGeofence, position);
      }
    });

    previousInsideRef.current = currentlyInside;
  }, [position, geofences, onEnter, onExit]);

  return {
    position,
    insideGeofences,
    isInsideAny: insideGeofences.length > 0,
    ...geoState
  };
}

/**
 * Heading/compass hook
 */
export function useCompass() {
  const [heading, setHeading] = useState(null);
  const [error, setError] = useState(null);

  const isSupported = useMemo(() => {
    return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
  }, []);

  useEffect(() => {
    if (!isSupported) {
      setError('コンパスがサポートされていません');
      return;
    }

    const handleOrientation = (event) => {
      // For iOS
      if (event.webkitCompassHeading !== undefined) {
        setHeading(event.webkitCompassHeading);
      }
      // For Android
      else if (event.alpha !== null) {
        // Convert alpha to compass heading
        setHeading((360 - event.alpha) % 360);
      }
    };

    // Request permission on iOS 13+
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then((permission) => {
          if (permission === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation, true);
          } else {
            setError('コンパスの使用が許可されていません');
          }
        })
        .catch(() => {
          setError('コンパスの権限取得に失敗しました');
        });
    } else {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [isSupported]);

  const direction = useMemo(() => {
    if (heading === null) return null;
    return getCompassDirection(heading);
  }, [heading]);

  return {
    heading,
    direction,
    error,
    isSupported
  };
}

/**
 * Motion tracking hook
 */
export function useMotion() {
  const [motion, setMotion] = useState({
    acceleration: null,
    accelerationIncludingGravity: null,
    rotationRate: null,
    interval: null
  });

  const [isMoving, setIsMoving] = useState(false);
  const movementThreshold = 0.5; // m/s²

  const isSupported = useMemo(() => {
    return typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
  }, []);

  useEffect(() => {
    if (!isSupported) return;

    const handleMotion = (event) => {
      const acc = event.acceleration;
      const accG = event.accelerationIncludingGravity;
      const rot = event.rotationRate;

      setMotion({
        acceleration: acc
          ? { x: acc.x, y: acc.y, z: acc.z }
          : null,
        accelerationIncludingGravity: accG
          ? { x: accG.x, y: accG.y, z: accG.z }
          : null,
        rotationRate: rot
          ? { alpha: rot.alpha, beta: rot.beta, gamma: rot.gamma }
          : null,
        interval: event.interval
      });

      // Detect movement
      if (acc) {
        const magnitude = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
        setIsMoving(magnitude > movementThreshold);
      }
    };

    // Request permission on iOS 13+
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission()
        .then((permission) => {
          if (permission === 'granted') {
            window.addEventListener('devicemotion', handleMotion, true);
          }
        })
        .catch(() => {});
    } else {
      window.addEventListener('devicemotion', handleMotion, true);
    }

    return () => {
      window.removeEventListener('devicemotion', handleMotion, true);
    };
  }, [isSupported]);

  return {
    ...motion,
    isMoving,
    isSupported
  };
}

/**
 * Reverse geocoding hook (placeholder - needs API)
 */
export function useReverseGeocode(position) {
  const [address, setAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!position) {
      setAddress(null);
      return;
    }

    // This would typically call a geocoding API
    // For now, just return coordinates as placeholder
    setAddress({
      formatted: `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`,
      coordinates: position
    });
  }, [position]);

  return {
    address,
    isLoading,
    error
  };
}

export default {
  useGeolocation,
  useDistanceFromLocation,
  useGeofence,
  useMultipleGeofences,
  useCompass,
  useMotion,
  useReverseGeocode
};
