import { useState, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

// Google Maps APIキーを取得する関数
const getGoogleMapsApiKey = () => {
  // 本番環境：meta tagから取得
  const metaTag = document.querySelector('meta[name="google-maps-api-key"]');
  if (metaTag) {
    return metaTag.getAttribute('content') || '';
  }
  // 開発環境：Viteの環境変数から取得
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
};

const GOOGLE_MAPS_API_KEY = getGoogleMapsApiKey();

export function useGoogleMaps(mapElementId, options = {}) {
  const [map, setMap] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const markersRef = useRef(new Map());
  const infoWindowRef = useRef(null);

  const defaultOptions = {
    center: { lat: 35.6812, lng: 139.7671 }, // 東京
    zoom: 10,
    mapTypeId: 'roadmap',
    scaleControl: true,
    minZoom: 2,
    ...options
  };

  useEffect(() => {
    const initializeMap = async () => {
      try {
        console.log('Initializing Google Maps with API key:', GOOGLE_MAPS_API_KEY ? 'Set' : 'Not set');

        if (!GOOGLE_MAPS_API_KEY) {
          throw new Error('Google Maps API key is not configured');
        }

        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          language: 'ja',
          libraries: ['visualization', 'drawing']
        });

        console.log('Loading Google Maps API...');
        const google = await loader.load();
        console.log('Google Maps API loaded successfully');

        // 要素が見つかるまで少し待つ
        let mapElement = document.getElementById(mapElementId);
        let retries = 0;
        while (!mapElement && retries < 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          mapElement = document.getElementById(mapElementId);
          retries++;
        }

        if (!mapElement) {
          throw new Error(`Map element with id "${mapElementId}" not found after ${retries} retries`);
        }

        console.log('Creating map with options:', defaultOptions);
        const newMap = new google.maps.Map(mapElement, defaultOptions);

        // InfoWindowを初期化
        infoWindowRef.current = new google.maps.InfoWindow();

        setMap(newMap);
        setIsLoaded(true);
        console.log('Google Maps initialized successfully');
      } catch (err) {
        console.error('Google Maps loading error:', err);
        console.error('Error details:', {
          message: err.message,
          stack: err.stack,
          apiKey: GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing'
        });
        setError(err.message);
      }
    };

    initializeMap();
  }, [mapElementId]);

  // マーカーを追加する関数
  const addMarker = (id, markerOptions) => {
    if (!map || !window.google) return null;

    const marker = new window.google.maps.Marker({
      map: map,
      ...markerOptions
    });

    // クリックイベントを追加
    if (markerOptions.onClick) {
      marker.addListener('click', () => {
        markerOptions.onClick(marker, id);
      });
    }

    markersRef.current.set(id, marker);
    return marker;
  };

  // マーカーを削除する関数
  const removeMarker = (id) => {
    const marker = markersRef.current.get(id);
    if (marker) {
      marker.setMap(null);
      markersRef.current.delete(id);
    }
  };

  // 全マーカーをクリアする関数
  const clearMarkers = () => {
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current.clear();
  };

  // InfoWindowを表示する関数
  const showInfoWindow = (content, marker, position, options = {}) => {
    if (infoWindowRef.current) {
      // 既存のInfoWindowを閉じて新しく作成（headerContentを更新するため）
      infoWindowRef.current.close();

      const infoWindowOptions = { content };

      // ヘッダーコンテンツが指定されている場合
      if (options.headerContent) {
        infoWindowOptions.headerContent = options.headerContent;
      }

      infoWindowRef.current = new google.maps.InfoWindow(infoWindowOptions);

      if (marker) {
        // マーカーが指定されている場合はマーカーに表示
        infoWindowRef.current.open(map, marker);
      } else if (position) {
        // 位置座標が指定されている場合は座標に表示
        infoWindowRef.current.setPosition(position);
        infoWindowRef.current.open(map);
      }
    }
  };

  // InfoWindowを閉じる関数
  const closeInfoWindow = () => {
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }
  };

  // マーカーの表示/非表示を切り替える関数
  const toggleMarkerVisibility = (id, visible) => {
    const marker = markersRef.current.get(id);
    if (marker) {
      marker.setVisible(visible);
    }
  };

  // 地図の中心とズームを設定する関数
  const panToLocation = (position, zoom = null) => {
    if (map) {
      map.panTo(position);
      if (zoom !== null) {
        map.setZoom(zoom);
      }
    }
  };

  // 複数の位置に地図をフィットする関数
  const fitBounds = (positions) => {
    if (map && positions.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      positions.forEach(pos => bounds.extend(pos));
      map.fitBounds(bounds);
    }
  };

  return {
    map,
    isLoaded,
    error,
    addMarker,
    removeMarker,
    clearMarkers,
    showInfoWindow,
    closeInfoWindow,
    toggleMarkerVisibility,
    panToLocation,
    fitBounds,
    markers: markersRef.current
  };
}
