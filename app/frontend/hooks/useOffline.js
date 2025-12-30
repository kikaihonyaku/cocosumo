/**
 * Offline Hooks
 * Hooks for offline support and network status management
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

/**
 * Network status hook
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });

  const [wasOffline, setWasOffline] = useState(false);
  const [lastOnline, setLastOnline] = useState(Date.now());
  const [lastOffline, setLastOffline] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setLastOnline(Date.now());
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setLastOffline(Date.now());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get connection info (if available)
  const connectionInfo = useMemo(() => {
    if (typeof navigator === 'undefined' || !navigator.connection) {
      return null;
    }

    const conn = navigator.connection;
    return {
      effectiveType: conn.effectiveType, // 'slow-2g', '2g', '3g', '4g'
      downlink: conn.downlink, // Mbps
      rtt: conn.rtt, // Round-trip time in ms
      saveData: conn.saveData // Data saver mode
    };
  }, [isOnline]);

  // Reset was offline flag
  const resetWasOffline = useCallback(() => {
    setWasOffline(false);
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    lastOnline,
    lastOffline,
    connectionInfo,
    resetWasOffline,
    offlineDuration: lastOffline && lastOnline > lastOffline
      ? lastOnline - lastOffline
      : null
  };
}

/**
 * Offline storage hook (using IndexedDB)
 */
export function useOfflineStorage(dbName = 'cocosumo_offline', storeName = 'data') {
  const dbRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  // Initialize IndexedDB
  useEffect(() => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      setError('IndexedDBがサポートされていません');
      return;
    }

    const request = indexedDB.open(dbName, 1);

    request.onerror = () => {
      setError('データベースの開始に失敗しました');
    };

    request.onsuccess = () => {
      dbRef.current = request.result;
      setIsReady(true);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'key' });
      }
    };

    return () => {
      dbRef.current?.close();
    };
  }, [dbName, storeName]);

  // Get item from storage
  const getItem = useCallback(async (key) => {
    if (!dbRef.current) return null;

    return new Promise((resolve, reject) => {
      const transaction = dbRef.current.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result?.value ?? null);
      };

      request.onerror = () => {
        reject(new Error('データの取得に失敗しました'));
      };
    });
  }, [storeName]);

  // Set item in storage
  const setItem = useCallback(async (key, value) => {
    if (!dbRef.current) throw new Error('Database not ready');

    return new Promise((resolve, reject) => {
      const transaction = dbRef.current.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put({
        key,
        value,
        timestamp: Date.now()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('データの保存に失敗しました'));
    });
  }, [storeName]);

  // Remove item from storage
  const removeItem = useCallback(async (key) => {
    if (!dbRef.current) return;

    return new Promise((resolve, reject) => {
      const transaction = dbRef.current.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('データの削除に失敗しました'));
    });
  }, [storeName]);

  // Get all items
  const getAllItems = useCallback(async () => {
    if (!dbRef.current) return [];

    return new Promise((resolve, reject) => {
      const transaction = dbRef.current.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result.map((item) => ({
          key: item.key,
          value: item.value,
          timestamp: item.timestamp
        })));
      };

      request.onerror = () => reject(new Error('データの取得に失敗しました'));
    });
  }, [storeName]);

  // Clear all items
  const clear = useCallback(async () => {
    if (!dbRef.current) return;

    return new Promise((resolve, reject) => {
      const transaction = dbRef.current.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('データのクリアに失敗しました'));
    });
  }, [storeName]);

  return {
    isReady,
    error,
    getItem,
    setItem,
    removeItem,
    getAllItems,
    clear
  };
}

/**
 * Offline queue hook (for pending operations)
 */
export function useOfflineQueue(options = {}) {
  const {
    storageKey = 'offline_queue',
    onSync,
    autoSync = true,
    maxRetries = 3
  } = options;

  const { isOnline } = useNetworkStatus();
  const storage = useOfflineStorage('cocosumo_offline', 'queue');

  const [queue, setQueue] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  // Load queue from storage on mount
  useEffect(() => {
    if (!storage.isReady) return;

    storage.getItem(storageKey).then((storedQueue) => {
      if (storedQueue) {
        setQueue(storedQueue);
      }
    });
  }, [storage.isReady, storageKey]);

  // Save queue to storage when it changes
  useEffect(() => {
    if (!storage.isReady) return;
    storage.setItem(storageKey, queue);
  }, [queue, storage.isReady, storageKey]);

  // Add operation to queue
  const addToQueue = useCallback((operation) => {
    const queueItem = {
      id: Date.now().toString(),
      operation,
      timestamp: Date.now(),
      retries: 0,
      status: 'pending'
    };

    setQueue((prev) => [...prev, queueItem]);
    return queueItem.id;
  }, []);

  // Remove from queue
  const removeFromQueue = useCallback((id) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Update queue item
  const updateQueueItem = useCallback((id, updates) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  // Process single queue item
  const processItem = useCallback(async (item) => {
    if (!onSync) return false;

    try {
      updateQueueItem(item.id, { status: 'processing' });
      await onSync(item.operation);
      removeFromQueue(item.id);
      return true;
    } catch (error) {
      const newRetries = item.retries + 1;

      if (newRetries >= maxRetries) {
        updateQueueItem(item.id, { status: 'failed', error: error.message });
      } else {
        updateQueueItem(item.id, {
          status: 'pending',
          retries: newRetries,
          lastError: error.message
        });
      }
      return false;
    }
  }, [onSync, maxRetries, updateQueueItem, removeFromQueue]);

  // Sync all pending items
  const syncQueue = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    const pendingItems = queue.filter((item) => item.status === 'pending');
    if (pendingItems.length === 0) return;

    setIsSyncing(true);
    setSyncError(null);

    let successCount = 0;
    let failCount = 0;

    for (const item of pendingItems) {
      const success = await processItem(item);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    setIsSyncing(false);

    if (failCount > 0) {
      setSyncError(`${failCount}件の同期に失敗しました`);
    }

    return { successCount, failCount };
  }, [isOnline, isSyncing, queue, processItem]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (autoSync && isOnline && queue.some((item) => item.status === 'pending')) {
      syncQueue();
    }
  }, [isOnline, autoSync]);

  // Clear failed items
  const clearFailed = useCallback(() => {
    setQueue((prev) => prev.filter((item) => item.status !== 'failed'));
  }, []);

  // Retry failed items
  const retryFailed = useCallback(() => {
    setQueue((prev) =>
      prev.map((item) =>
        item.status === 'failed'
          ? { ...item, status: 'pending', retries: 0 }
          : item
      )
    );
  }, []);

  // Get queue stats
  const stats = useMemo(() => ({
    total: queue.length,
    pending: queue.filter((item) => item.status === 'pending').length,
    processing: queue.filter((item) => item.status === 'processing').length,
    failed: queue.filter((item) => item.status === 'failed').length
  }), [queue]);

  return {
    queue,
    stats,
    isSyncing,
    syncError,
    addToQueue,
    removeFromQueue,
    syncQueue,
    clearFailed,
    retryFailed,
    hasPending: stats.pending > 0,
    hasFailed: stats.failed > 0
  };
}

/**
 * Offline-first data hook
 */
export function useOfflineData(key, fetchFn, options = {}) {
  const {
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 24 * 60 * 60 * 1000, // 24 hours
    onSuccess,
    onError
  } = options;

  const { isOnline } = useNetworkStatus();
  const storage = useOfflineStorage();

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);

  // Load cached data
  const loadFromCache = useCallback(async () => {
    if (!storage.isReady) return null;

    try {
      const cached = await storage.getItem(key);
      if (cached && cached.timestamp) {
        const age = Date.now() - cached.timestamp;
        if (age < cacheTime) {
          setIsStale(age > staleTime);
          return cached.data;
        }
      }
    } catch {
      // Ignore cache errors
    }
    return null;
  }, [key, storage, staleTime, cacheTime]);

  // Save to cache
  const saveToCache = useCallback(async (newData) => {
    if (!storage.isReady) return;

    try {
      await storage.setItem(key, {
        data: newData,
        timestamp: Date.now()
      });
    } catch {
      // Ignore cache errors
    }
  }, [key, storage]);

  // Fetch data
  const fetchData = useCallback(async (force = false) => {
    // Try cache first
    if (!force) {
      const cached = await loadFromCache();
      if (cached) {
        setData(cached);
        setIsLoading(false);

        // Fetch fresh data in background if stale
        if (isOnline && isStale) {
          try {
            const freshData = await fetchFn();
            setData(freshData);
            setIsStale(false);
            setLastFetched(Date.now());
            await saveToCache(freshData);
            onSuccess?.(freshData);
          } catch {
            // Keep stale data on background refresh failure
          }
        }
        return;
      }
    }

    // Fetch from network
    if (isOnline) {
      setIsLoading(true);
      setError(null);

      try {
        const freshData = await fetchFn();
        setData(freshData);
        setIsStale(false);
        setLastFetched(Date.now());
        await saveToCache(freshData);
        onSuccess?.(freshData);
      } catch (err) {
        setError(err.message);
        onError?.(err);

        // Try cache on error
        const cached = await loadFromCache();
        if (cached) {
          setData(cached);
          setIsStale(true);
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // Offline - use cache
      const cached = await loadFromCache();
      if (cached) {
        setData(cached);
        setIsStale(true);
      } else {
        setError('オフラインです。データがキャッシュされていません。');
      }
      setIsLoading(false);
    }
  }, [isOnline, isStale, fetchFn, loadFromCache, saveToCache, onSuccess, onError]);

  // Initial load
  useEffect(() => {
    if (storage.isReady) {
      fetchData();
    }
  }, [storage.isReady]);

  // Refetch when coming online if stale
  useEffect(() => {
    if (isOnline && isStale && data) {
      fetchData(true);
    }
  }, [isOnline]);

  // Force refetch
  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Clear cache
  const clearCache = useCallback(async () => {
    if (storage.isReady) {
      await storage.removeItem(key);
    }
    setData(null);
    setIsStale(false);
  }, [storage, key]);

  return {
    data,
    error,
    isLoading,
    isStale,
    isOffline: !isOnline,
    lastFetched,
    refetch,
    clearCache
  };
}

/**
 * Service Worker communication hook
 */
export function useServiceWorker() {
  const [registration, setRegistration] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Get current registration
    navigator.serviceWorker.ready.then(setRegistration);

    // Listen for updates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // New service worker activated
      window.location.reload();
    });
  }, []);

  // Check for updates
  const checkForUpdates = useCallback(async () => {
    if (!registration) return false;

    try {
      await registration.update();
      const waiting = registration.waiting;

      if (waiting) {
        setUpdateAvailable(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [registration]);

  // Apply update
  const applyUpdate = useCallback(() => {
    if (!registration?.waiting) return;

    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }, [registration]);

  // Send message to service worker
  const sendMessage = useCallback(async (message) => {
    if (!registration?.active) return null;

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      registration.active.postMessage(message, [messageChannel.port2]);
    });
  }, [registration]);

  return {
    registration,
    updateAvailable,
    checkForUpdates,
    applyUpdate,
    sendMessage,
    isSupported: 'serviceWorker' in navigator
  };
}

export default {
  useNetworkStatus,
  useOfflineStorage,
  useOfflineQueue,
  useOfflineData,
  useServiceWorker
};
