/**
 * Offline Service
 * Centralized offline data management and synchronization
 */

// Database configuration
const DB_NAME = 'cocosumo_offline_db';
const DB_VERSION = 1;

// Store names
export const STORES = {
  DATA: 'data',
  QUEUE: 'sync_queue',
  CACHE: 'api_cache',
  FAVORITES: 'favorites'
};

// Open IndexedDB connection
let dbPromise = null;

export function openDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Data store
      if (!db.objectStoreNames.contains(STORES.DATA)) {
        const dataStore = db.createObjectStore(STORES.DATA, { keyPath: 'key' });
        dataStore.createIndex('timestamp', 'timestamp');
        dataStore.createIndex('type', 'type');
      }

      // Sync queue store
      if (!db.objectStoreNames.contains(STORES.QUEUE)) {
        const queueStore = db.createObjectStore(STORES.QUEUE, { keyPath: 'id', autoIncrement: true });
        queueStore.createIndex('status', 'status');
        queueStore.createIndex('timestamp', 'timestamp');
      }

      // API cache store
      if (!db.objectStoreNames.contains(STORES.CACHE)) {
        const cacheStore = db.createObjectStore(STORES.CACHE, { keyPath: 'url' });
        cacheStore.createIndex('timestamp', 'timestamp');
        cacheStore.createIndex('expiry', 'expiry');
      }

      // Favorites store
      if (!db.objectStoreNames.contains(STORES.FAVORITES)) {
        const favoritesStore = db.createObjectStore(STORES.FAVORITES, { keyPath: 'id' });
        favoritesStore.createIndex('type', 'type');
        favoritesStore.createIndex('timestamp', 'timestamp');
      }
    };
  });

  return dbPromise;
}

/**
 * Generic data operations
 */
export const dataStore = {
  async get(key) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.DATA], 'readonly');
      const store = transaction.objectStore(STORES.DATA);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result?.value ?? null);
      request.onerror = () => reject(request.error);
    });
  },

  async set(key, value, type = 'general') {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.DATA], 'readwrite');
      const store = transaction.objectStore(STORES.DATA);
      const request = store.put({
        key,
        value,
        type,
        timestamp: Date.now()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async delete(key) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.DATA], 'readwrite');
      const store = transaction.objectStore(STORES.DATA);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getByType(type) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.DATA], 'readonly');
      const store = transaction.objectStore(STORES.DATA);
      const index = store.index('type');
      const request = index.getAll(type);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async clear() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.DATA], 'readwrite');
      const store = transaction.objectStore(STORES.DATA);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};

/**
 * Sync queue operations
 */
export const syncQueue = {
  async add(operation) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.QUEUE], 'readwrite');
      const store = transaction.objectStore(STORES.QUEUE);
      const request = store.add({
        operation,
        status: 'pending',
        timestamp: Date.now(),
        retries: 0
      });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getPending() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.QUEUE], 'readonly');
      const store = transaction.objectStore(STORES.QUEUE);
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async updateStatus(id, status, error = null) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.QUEUE], 'readwrite');
      const store = transaction.objectStore(STORES.QUEUE);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.status = status;
          item.lastUpdated = Date.now();
          if (error) item.error = error;
          if (status === 'failed') item.retries = (item.retries || 0) + 1;

          const putRequest = store.put(item);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  },

  async remove(id) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.QUEUE], 'readwrite');
      const store = transaction.objectStore(STORES.QUEUE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async clearCompleted() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.QUEUE], 'readwrite');
      const store = transaction.objectStore(STORES.QUEUE);
      const index = store.index('status');
      const request = index.openCursor('completed');

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
};

/**
 * API cache operations
 */
export const apiCache = {
  async get(url) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CACHE], 'readonly');
      const store = transaction.objectStore(STORES.CACHE);
      const request = store.get(url);

      request.onsuccess = () => {
        const result = request.result;
        if (result && result.expiry > Date.now()) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  },

  async set(url, data, ttl = 5 * 60 * 1000) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CACHE], 'readwrite');
      const store = transaction.objectStore(STORES.CACHE);
      const request = store.put({
        url,
        data,
        timestamp: Date.now(),
        expiry: Date.now() + ttl
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async delete(url) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CACHE], 'readwrite');
      const store = transaction.objectStore(STORES.CACHE);
      const request = store.delete(url);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async clearExpired() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CACHE], 'readwrite');
      const store = transaction.objectStore(STORES.CACHE);
      const index = store.index('expiry');
      const range = IDBKeyRange.upperBound(Date.now());
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  },

  async clear() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CACHE], 'readwrite');
      const store = transaction.objectStore(STORES.CACHE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};

/**
 * Favorites operations
 */
export const favorites = {
  async add(id, data, type = 'property') {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.FAVORITES], 'readwrite');
      const store = transaction.objectStore(STORES.FAVORITES);
      const request = store.put({
        id,
        data,
        type,
        timestamp: Date.now()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async remove(id) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.FAVORITES], 'readwrite');
      const store = transaction.objectStore(STORES.FAVORITES);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async get(id) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.FAVORITES], 'readonly');
      const store = transaction.objectStore(STORES.FAVORITES);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  },

  async getAll(type = null) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.FAVORITES], 'readonly');
      const store = transaction.objectStore(STORES.FAVORITES);

      const request = type
        ? store.index('type').getAll(type)
        : store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async isFavorite(id) {
    const result = await this.get(id);
    return result !== null;
  },

  async toggle(id, data, type = 'property') {
    const isFav = await this.isFavorite(id);
    if (isFav) {
      await this.remove(id);
      return false;
    } else {
      await this.add(id, data, type);
      return true;
    }
  }
};

/**
 * Sync manager
 */
export const syncManager = {
  isOnline: () => navigator.onLine,

  async processQueue(processor) {
    if (!this.isOnline()) return { processed: 0, failed: 0 };

    const pending = await syncQueue.getPending();
    let processed = 0;
    let failed = 0;

    for (const item of pending) {
      try {
        await syncQueue.updateStatus(item.id, 'processing');
        await processor(item.operation);
        await syncQueue.remove(item.id);
        processed++;
      } catch (error) {
        await syncQueue.updateStatus(item.id, 'failed', error.message);
        failed++;
      }
    }

    return { processed, failed };
  },

  // Register background sync (if supported)
  async registerBackgroundSync(tag = 'sync-queue') {
    if (!('serviceWorker' in navigator) || !('sync' in window.ServiceWorkerRegistration.prototype)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Storage stats
 */
export async function getStorageStats() {
  if (!navigator.storage?.estimate) {
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage,
      quota: estimate.quota,
      usagePercentage: (estimate.usage / estimate.quota) * 100,
      available: estimate.quota - estimate.usage
    };
  } catch {
    return null;
  }
}

/**
 * Clear all offline data
 */
export async function clearAllOfflineData() {
  await dataStore.clear();
  await apiCache.clear();

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.QUEUE], 'readwrite');
    const store = transaction.objectStore(STORES.QUEUE);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export default {
  openDatabase,
  dataStore,
  syncQueue,
  apiCache,
  favorites,
  syncManager,
  getStorageStats,
  clearAllOfflineData,
  STORES
};
